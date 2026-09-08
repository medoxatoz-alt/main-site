'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

// In-app replacement for the old public/offline.html served by the service
// worker on a failed navigation. That approach could only ever be a bare
// static page (a service worker's fetch handler returns raw bytes, not
// React), so it could never share this app's actual design system. This
// component instead detects connectivity loss client-side and overlays the
// same UI the rest of the app uses -- no separate HTML file, no service
// worker fallback page. It covers the common real case (the user is already
// using the app and loses connectivity mid-session); the one thing it can't
// cover is a *fresh* navigation attempt with zero connectivity, since no JS
// can run yet at that point -- that's the browser/WebView's own native
// offline handling, same as any site.
export default function OfflineOverlay() {
  const [isOffline, setIsOffline] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    // Set the real initial state on mount -- navigator.onLine may already be
    // false by the time this component renders (e.g. the page was loaded
    // from bfcache while offline).
    setIsOffline(typeof navigator !== 'undefined' && !navigator.onLine);

    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!isOffline) return null;

  const handleRetry = () => {
    setRetrying(true);
    // navigator.onLine can lag behind reality (e.g. Wi-Fi connected but no
    // real internet); a real request is the only trustworthy check.
    fetch('/manifest.json', { method: 'HEAD', cache: 'no-store' })
      .then(() => setIsOffline(false))
      .catch(() => {})
      .finally(() => setRetrying(false));
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#f4f5f7] flex flex-col items-center justify-center px-9 text-center">
      <div className="w-20 h-20 rounded-full bg-white border border-gray-200 flex items-center justify-center mb-6">
        <WifiOff className="w-9 h-9 text-gold-primary" />
      </div>
      <h1 className="text-xl font-extrabold text-gray-900 mb-2">No Internet Connection</h1>
      <p className="text-sm text-gray-500 leading-relaxed max-w-xs mb-7">
        Please check your Wi-Fi or mobile data and try again.
      </p>
      <button
        type="button"
        onClick={handleRetry}
        disabled={retrying}
        className="px-9 py-3.5 bg-gold-primary hover:bg-gold-hover text-text-main font-bold rounded-full shadow-md transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer border-none"
      >
        {retrying ? 'Checking…' : 'Try Again'}
      </button>
      <p className="text-xs text-gray-400 mt-7">
        We&apos;ll reconnect automatically once you&apos;re back online.
      </p>
    </div>
  );
}
