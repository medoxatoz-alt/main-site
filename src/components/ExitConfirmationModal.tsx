'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { LogOut, ShoppingBag, X } from 'lucide-react';

export default function ExitConfirmationModal() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Only intercept back-navigation on the root home page
    if (pathname !== '/') return;

    // Check user preference (defaults to true)
    const isEnabled = localStorage.getItem('medox_exit_confirm') !== 'false';
    if (!isEnabled) return;

    // Push an initial state so the hardware/browser back triggers popstate instead of immediate exit
    window.history.pushState({ medoxHome: true }, '', window.location.href);

    const handlePopState = (event: PopStateEvent) => {
      const exitConfirmPref = localStorage.getItem('medox_exit_confirm') !== 'false';
      if (!exitConfirmPref) return;

      // Prevent immediate exit and show confirmation popup
      event.preventDefault();
      setIsOpen(true);
      // Re-push state to hold the page while dialog is open
      window.history.pushState({ medoxHome: true }, '', window.location.href);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pathname]);

  const handleKeepShopping = () => {
    setIsOpen(false);
  };

  const handleConfirmExit = () => {
    setIsOpen(false);

    // Notify native WebView wrapper if present
    if ((window as any).ReactNativeWebView) {
      (window as any).ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'exit-app' })
      );
    } else {
      // In regular browser, navigate back or close
      window.history.go(-2);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop Dismissal */}
      <div className="absolute inset-0" onClick={handleKeepShopping} />

      {/* Modal / Mobile Native Card */}
      <div className="relative w-full sm:max-w-sm bg-white rounded-t-[32px] sm:rounded-3xl p-6 sm:p-7 shadow-2xl text-gray-900 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 z-10 border border-gray-100">
        
        {/* Mobile Pull Handle Bar */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 sm:hidden shrink-0" />

        {/* Close icon */}
        <button
          onClick={handleKeepShopping}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors cursor-pointer border-none"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Title */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 mb-4 shadow-xs">
            <ShoppingBag className="w-8 h-8 stroke-[2]" />
          </div>

          <h3 className="text-xl font-black tracking-tight text-gray-900 mb-1.5">
            Exit Medox?
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-6 max-w-xs">
            Are you sure you want to leave? Your cart items and clinical orders are securely preserved.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5 w-full">
            <button
              onClick={handleKeepShopping}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-md shadow-amber-500/20 text-xs sm:text-sm border-none"
            >
              Keep Shopping
            </button>
            <button
              onClick={handleConfirmExit}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 font-bold rounded-2xl transition-all duration-200 active:scale-[0.98] cursor-pointer text-xs flex items-center justify-center gap-1.5 border-none"
            >
              <LogOut className="w-3.5 h-3.5 text-gray-500" />
              <span>Exit App</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
