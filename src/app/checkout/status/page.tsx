"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import api from '@/lib/api';

function StatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const verifyPayment = async () => {
      // PhonePe appends transactionId to the redirect URL
      const transactionId = searchParams.get('transactionId') || searchParams.get('id');
      
      if (!transactionId) {
        setStatus('error');
        setMessage('Invalid request. No transaction ID found.');
        return;
      }

      try {
        const { data } = await api.post('/payments/phonepe/verify', {
          merchantTransactionId: transactionId
        });

        if (data.success) {
          setStatus('success');
          setMessage('Payment successful! Your order has been placed.');
          // Clear cart
          try {
            await api.delete('/cart');
          } catch (e) {
            // ignore cart clear error
          }
        } else {
          setStatus('error');
          setMessage('Payment could not be verified.');
        }
      } catch (err: any) {
        console.error(err);
        setStatus('error');
        setMessage(err.response?.data?.error || 'Payment failed or was cancelled.');
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-20 px-4 text-center">
      {status === 'loading' && (
        <>
          <Loader2 className="w-16 h-16 text-gold-primary animate-spin mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h1>
          <p className="text-gray-500">{message}</p>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle className="w-20 h-20 text-emerald-500 mb-6" />
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Order Confirmed!</h1>
          <p className="text-gray-600 mb-8 max-w-md">{message}</p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => router.push('/account')}
              className="px-8 py-3 bg-gold-primary text-white font-bold rounded-lg hover:bg-gold-hover transition-colors"
            >
              View My Orders
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-8 py-3 bg-gray-100 text-gray-800 font-bold rounded-lg hover:bg-gray-200 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </>
      )}

      {status === 'error' && (
        <>
          <XCircle className="w-20 h-20 text-red-500 mb-6" />
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Payment Failed</h1>
          <p className="text-gray-600 mb-8 max-w-md">{message}</p>
          
          <button
            onClick={() => router.push('/checkout')}
            className="px-8 py-3 bg-gold-primary text-white font-bold rounded-lg hover:bg-gold-hover transition-colors"
          >
            Try Again
          </button>
        </>
      )}
    </div>
  );
}

export default function CheckoutStatusPage() {
  return (
    <main className="bg-[var(--bg-page)] min-h-screen flex flex-col">
      <Navbar />
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center flex-1 py-20 px-4 text-center">
          <Loader2 className="w-16 h-16 text-gold-primary animate-spin mb-6" />
          <p className="text-gray-500">Loading...</p>
        </div>
      }>
        <StatusContent />
      </Suspense>
    </main>
  );
}
