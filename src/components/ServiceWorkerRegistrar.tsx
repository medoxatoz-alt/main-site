'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    // Catch background auth network timeouts gracefully
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (
        reason?.code === 'auth/network-request-failed' ||
        reason?.message?.includes('auth/network-request-failed')
      ) {
        console.warn('[Auth] Handled background network timeout:', reason?.message || reason);
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[SW] Registered, scope:', reg.scope);
          // Proactively check for a new sw.js on every app load instead of
          // waiting for the browser's own (much longer) update interval.
          reg.update().catch(() => {});
        })
        .catch((err) => console.error('[SW] Registration failed:', err));
    }

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}
