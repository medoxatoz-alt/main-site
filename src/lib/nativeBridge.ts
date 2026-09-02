// Bridge to the Medox Android/iOS app's WebView shell (see medox-app/App.tsx).
//
// `window.ReactNativeWebView` is injected automatically by react-native-webview
// on every page it loads -- its presence is how the site detects it's running
// inside the app versus a normal browser, no separate flag needed.

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (message: string) => void };
  }
}

export function isNativeApp(): boolean {
  return typeof window !== 'undefined' && !!window.ReactNativeWebView;
}

// Hands the checkout off to the app's native Cashfree SDK instead of running
// Cashfree's hosted web checkout inside the WebView. The web checkout's UPI
// Intent app list only appears once Cashfree enables a feature flag per merchant
// account (support ticket pending); the native SDK's UPI Intent flow needs no
// such flag -- it resolves installed apps via the OS directly. The app navigates
// the WebView to /checkout/status once the native payment UI finishes, so the
// existing server-side verification on that page runs unchanged either way.
export function requestNativeCashfreePayment(
  paymentSessionId: string,
  orderId: string,
  environment: 'PRODUCTION' | 'SANDBOX'
): boolean {
  if (!isNativeApp()) return false;
  window.ReactNativeWebView!.postMessage(
    JSON.stringify({ type: 'CASHFREE_PAYMENT_REQUEST', paymentSessionId, orderId, environment })
  );
  return true;
}
