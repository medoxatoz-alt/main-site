'use client';

import { useState, useEffect } from 'react';

export function useIsInApp() {
  const [isInApp, setIsInApp] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent || '';
    const hasMedoxUA = ua.includes('MedoxApp');
    const hasReactNativeWebView = Boolean((window as any).ReactNativeWebView);
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;

    const inAppDetected = hasMedoxUA || hasReactNativeWebView || isStandalone;
    setIsInApp(inAppDetected);

    const mobileDetected =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
      window.innerWidth <= 768;
    setIsMobile(mobileDetected);
  }, []);

  return { isInApp, isMobile, isMounted };
}
