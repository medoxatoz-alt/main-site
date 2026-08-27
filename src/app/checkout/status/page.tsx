"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

function StatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cashfreeOrderId = searchParams.get('cashfree_order_id');
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!cashfreeOrderId) {
      router.replace('/');
      return;
    }

    const verifyPayment = async () => {
      try {
        const { data } = await api.post('/payments/cashfree/verify', {
          cashfree_order_id: cashfreeOrderId
        });

        if (data.success || data.status === 'PAID') {
          setStatus('success');
          if (data.invoiceUrls && data.invoiceUrls.length > 0) {
            setInvoiceUrl(data.invoiceUrls[0]);
          }
          await api.delete('/cart').catch(() => {});
          toast.success('Payment successful!');
        } else if (data.status === 'PENDING') {
          // Keep verifying or tell user it's pending
          setTimeout(verifyPayment, 3000);
        } else {
          setStatus('failed');
          toast.error('Payment failed.');
        }
      } catch (err: any) {
        if (err.response?.status === 202) {
          // Pending status
          setTimeout(verifyPayment, 3000);
        } else {
          console.error(err);
          setStatus('failed');
          toast.error('Payment verification failed.');
        }
      }
    };

    verifyPayment();
  }, [cashfreeOrderId, router]);

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-20 px-4 text-center">
      {status === 'verifying' && (
        <>
          <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment...</h2>
          <p className="text-gray-500 max-w-md mx-auto">Please wait while we confirm your payment with Cashfree. Do not close or refresh this page.</p>
        </>
      )}

      {status === 'success' && (
        <div className="animate-in zoom-in duration-500">
          <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-8">Your payment was successful and your order has been placed.</p>
          
          <div className="flex gap-4 justify-center">
            {invoiceUrl && (
              <a
                href={invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all"
              >
                View Invoice
              </a>
            )}
            <button
              onClick={() => router.push('/account')}
              className="px-6 py-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 border border-indigo-200 transition-all cursor-pointer"
            >
              Go to My Orders
            </button>
          </div>
        </div>
      )}

      {status === 'failed' && (
        <div className="animate-in zoom-in duration-500">
          <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Failed</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-8">We could not process your payment. Your account has not been charged.</p>
          <button
            onClick={() => router.push('/checkout')}
            className="px-8 py-3 bg-gold-primary text-text-main font-bold rounded-xl hover:bg-gold-hover transition-all cursor-pointer"
          >
            Try Again
          </button>
        </div>
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
          <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-6" />
          <p className="text-gray-500">Loading...</p>
        </div>
      }>
        <StatusContent />
      </Suspense>
    </main>
  );
}
