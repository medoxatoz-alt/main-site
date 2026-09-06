'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { XCircle, Loader2 } from 'lucide-react';

// Reached only from the Medox app: after the system browser hands control back to
// the app via the medox://payment-callback deep link, the app drives its WebView
// here with the opaque `state` from that callback. This page's only job is to
// resolve that state (via the authenticated WebView session) to the underlying
// Cashfree order id, then hand off to the site's existing /checkout/status page,
// which is the only place that actually calls /cashfree/verify. The medox://
// callback and this page never mean "payment succeeded" -- only "control returned
// to the app."
function AppReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const state = searchParams.get('state');

  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/signin');
      return;
    }

    if (!state) {
      setErrorMessage('Missing payment reference.');
      return;
    }

    api.post('/payments/cashfree/resolve-state', { state })
      .then(({ data }) => {
        router.replace(`/checkout/status?cashfree_order_id=${data.cashfree_order_id}`);
      })
      .catch((err) => {
        setErrorMessage(err.response?.data?.error || 'Could not find that payment. If money was deducted, check your orders.');
      });
  }, [authLoading, user, state, router]);

  if (errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center min-h-[60vh]">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <XCircle className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">Something went wrong</h1>
        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">{errorMessage}</p>
        <button onClick={() => window.location.href = '/account/orders'} className="py-3.5 px-8 bg-gold-primary hover:bg-gold-hover text-text-main font-bold rounded-xl shadow-md transition-all active:scale-[0.98]">
          View Orders
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-32 px-4 text-center min-h-[60vh]">
      <Loader2 className="w-16 h-16 text-gold-primary animate-spin mb-6" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Returning to Medox...</h1>
      <p className="text-gray-500">Please wait while we confirm your order with the bank.</p>
    </div>
  );
}

export default function AppReturnPage() {
  return (
    <main className="min-h-screen bg-gray-50 pt-20 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <Suspense fallback={
            <div className="flex justify-center items-center h-[50vh]">
              <Loader2 className="w-12 h-12 text-gold-primary animate-spin" />
            </div>
          }>
            <AppReturnContent />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
