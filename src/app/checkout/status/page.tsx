'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { CheckCircle2, XCircle, Loader2, Smartphone, Globe } from 'lucide-react';
import Link from 'next/link';

// ─── Bridge page shown when payment was initiated from the app's system browser ──
// The system browser has no auth session cookies, so we can't verify here.
//   • "Continue in App" → closes this browser tab so the app foregrounds; the
//     app's AppState listener (App.tsx) navigates the WebView to /checkout/status
//     (without app=1), where auth cookies exist and verification runs normally.
//   • "Continue on Website" → navigates to the same URL without app=1, so the
//     user can log in on the web and verify from there.
function AppBridgePage({ cashfreeOrderId }: { cashfreeOrderId: string }) {
  // Countdown before auto-redirecting back to app (seconds)
  const [countdown, setCountdown] = useState(2);
  const [autoFailed, setAutoFailed] = useState(false);

  const triggerAppReturn = () => {
    // 1. Try window.close() — works if opened via openAuthSessionAsync / window.open()
    try { window.close(); } catch {}
    // 2. Deep-link redirect — closes Chrome Custom Tab (Android) / triggers app (iOS)
    window.location.href = 'medox://open';
  };

  // Auto-redirect on mount with a short countdown so user sees the success state
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          triggerAppReturn();
          // If still here after 2s, auto-close failed → show manual button
          setTimeout(() => setAutoFailed(true), 2000);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const webStatusUrl = `/checkout/status?cashfree_order_id=${encodeURIComponent(cashfreeOrderId)}`;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center min-h-[60vh]">
      {/* Animated success ring */}
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-30" />
        <div className="relative w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
      </div>

      <h1 className="text-2xl font-extrabold text-gray-900 mb-2 tracking-tight">
        Payment Complete!
      </h1>

      {/* Auto-redirect countdown */}
      {!autoFailed && countdown > 0 && (
        <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
          Returning you to the app in{' '}
          <span className="font-extrabold text-[#d4af37]">{countdown}s</span>…
        </p>
      )}
      {!autoFailed && countdown === 0 && (
        <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
          Opening Medox app…
        </p>
      )}
      {autoFailed && (
        <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
          Couldn't auto-close this browser. Use the button below.
        </p>
      )}

      <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
        {/* Always show manual button as fallback */}
        <button
          onClick={triggerAppReturn}
          className="w-full py-4 bg-[#d4af37] hover:bg-[#bda036] active:scale-[0.98] text-[#2b3036] font-extrabold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2.5"
        >
          {countdown > 0 ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Smartphone className="w-5 h-5" />
          )}
          {countdown > 0 ? `Opening in ${countdown}s…` : 'Open Medox App'}
        </button>

        <Link
          href={webStatusUrl}
          className="w-full py-4 bg-white hover:bg-gray-50 active:scale-[0.98] text-gray-700 font-bold border border-gray-200 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2.5"
        >
          <Globe className="w-5 h-5 text-gray-400" />
          Continue on Website
        </Link>
      </div>

      <p className="text-[11px] text-gray-400 mt-8 max-w-xs">
        If the app doesn&apos;t open automatically, tap &quot;Open Medox App&quot; above.
      </p>
    </div>
  );
}

// ─── Main verification flow (web-only, requires auth session) ───────────────────
function VerificationFlow({ cashfreeOrderId }: { cashfreeOrderId: string }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [status, setStatus] = useState<'LOADING' | 'SUCCESS' | 'FAILED'>('LOADING');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(
        `/signin?redirect=${encodeURIComponent(`/checkout/status?cashfree_order_id=${cashfreeOrderId}`)}`,
      );
      return;
    }

    const verifyPayment = async () => {
      try {
        const { data } = await api.post('/payments/cashfree/verify', {
          cashfree_order_id: cashfreeOrderId,
        });

        if (data.success) {
          setStatus('SUCCESS');
          api.delete('/cart').catch((err) => console.error('Failed to clear cart:', err));
        } else {
          setStatus('FAILED');
          setErrorMessage(data.message || 'Payment was not completed successfully.');
        }
      } catch (err: any) {
        setStatus('FAILED');
        setErrorMessage(
          err.response?.data?.message ||
            err.response?.data?.error ||
            'Verification failed. If money was deducted, it will be refunded automatically.',
        );
      }
    };

    verifyPayment();
  }, [authLoading, user, cashfreeOrderId, router]);

  if (status === 'LOADING') {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4 text-center min-h-[60vh]">
        <Loader2 className="w-16 h-16 text-[#d4af37] animate-spin mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment…</h1>
        <p className="text-gray-500">Please wait while we confirm your order with the bank.</p>
      </div>
    );
  }

  if (status === 'SUCCESS') {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center min-h-[60vh]">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-30" />
          <div className="relative w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">
          Payment Successful!
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          Thank you for your purchase. Your order has been placed and is being processed.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-sm mx-auto">
          <Link
            href="/account/orders"
            className="w-full py-4 bg-[#d4af37] hover:bg-[#bda036] text-[#2b3036] font-extrabold rounded-2xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center"
          >
            View My Orders
          </Link>
          <Link
            href="/"
            className="w-full py-4 bg-white hover:bg-gray-50 text-gray-700 font-bold border border-gray-200 rounded-2xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center min-h-[60vh]">
      <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
        <XCircle className="w-12 h-12 text-red-500" />
      </div>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">Payment Failed</h1>
      <p className="text-base text-gray-600 mb-8 max-w-md mx-auto">
        {errorMessage || 'Your transaction could not be completed.'}
      </p>
      <div className="flex flex-col gap-3 w-full max-w-sm mx-auto">
        <button
          onClick={() => router.back()}
          className="w-full py-4 bg-[#d4af37] hover:bg-[#bda036] text-[#2b3036] font-extrabold rounded-2xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="w-full py-4 bg-white hover:bg-gray-50 text-gray-700 font-bold border border-gray-200 rounded-2xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}

// ─── Router: decides which view to show based on `app` query param ──────────────
function CheckoutStatusContent() {
  const searchParams = useSearchParams();
  const cashfreeOrderId = searchParams.get('cashfree_order_id');
  const isApp = searchParams.get('app') === '1';

  if (!cashfreeOrderId) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4 text-center min-h-[60vh]">
        <XCircle className="w-16 h-16 text-red-400 mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
        <p className="text-gray-500 mb-8">No order ID was found in this link.</p>
        <Link href="/" className="py-3 px-6 bg-[#d4af37] text-[#2b3036] font-bold rounded-xl">
          Go Home
        </Link>
      </div>
    );
  }

  // App-originated payment: show bridge page (don't verify — no auth cookies here)
  if (isApp) {
    return <AppBridgePage cashfreeOrderId={cashfreeOrderId} />;
  }

  // Web-originated or app WebView redirect: verify normally
  return <VerificationFlow cashfreeOrderId={cashfreeOrderId} />;
}

export default function CheckoutStatusPage() {
  return (
    <main className="min-h-screen bg-gray-50 pt-20 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <Suspense
            fallback={
              <div className="flex justify-center items-center h-[50vh]">
                <Loader2 className="w-12 h-12 text-[#d4af37] animate-spin" />
              </div>
            }
          >
            <CheckoutStatusContent />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

