'use client';

import { useEffect, useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2, MapPin, ShieldCheck,  Lock, X } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

// ── Razorpay type declaration ────────────────────────────────────────────────
declare global {
  interface Window {
    Razorpay: any;
  }
}

// Load Razorpay script dynamically
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Checkout() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [productDetails, setProductDetails] = useState<Record<string, any>>({});
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoicePdfUrl, setInvoicePdfUrl] = useState<string | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [detectingLoc, setDetectingLoc] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'idle' | 'creating' | 'paying' | 'verifying'>('idle');

  const autoFillCheckoutLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setDetectingLoc(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const address = data.address || {};

          const parts = [
            address.road || address.pedestrian || '',
            address.suburb || address.neighbourhood || address.residential || '',
          ].filter(Boolean);

          const streetAddress = parts.join(', ');
          const city = address.city || address.town || address.village || address.suburb || address.county || '';
          const state = address.state || '';
          const pincode = address.postcode || '';

          setShipping(prev => ({
            ...prev,
            address: streetAddress || prev.address,
            city: city || prev.city,
            state: state || prev.state,
            pincode: pincode || prev.pincode
          }));
          toast.success('Location fields autofilled!');
        } catch {
          toast.error('Failed to resolve location details.');
        } finally {
          setDetectingLoc(false);
        }
      },
      () => {
        toast.error('Location access denied or unavailable.');
        setDetectingLoc(false);
      }
    );
  };

  const [shipping, setShipping] = useState<{
    id?: string;
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  }>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    } else if (user) {
      setShipping(s => ({ ...s, email: user.email }));
    }
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    try {
      const [cartRes, addrRes] = await Promise.all([
        api.get('/cart'),
        api.get('/user/addresses')
      ]);

      const items = cartRes.data;
      if (items.length === 0) {
        toast('Your cart is empty');
        router.push('/cart');
        return;
      }
      setCartItems(items);

      const savedAddresses = addrRes.data;
      setAddresses(savedAddresses);

      if (savedAddresses.length > 0) {
        setShipping(prev => ({ ...prev, ...savedAddresses[0] }));
      } else {
        setUseNewAddress(true);
        setShipping(s => ({ ...s, fullName: user?.name || '' }));
      }

      const details: Record<string, any> = {};
      for (const item of items) {
        if (!details[item.productId]) {
          const prodRes = await api.get(`/products/${item.productId}`);
          details[item.productId] = prodRes.data;
        }
      }
      setProductDetails(details);
    } catch {
      toast.error('Failed to load checkout details');
    } finally {
      setLoading(false);
    }
  }, [user, router]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  const handlePayWithRazorpay = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shipping.fullName?.trim() || !shipping.phone?.trim() || !shipping.address?.trim() || !shipping.city?.trim() || !shipping.state?.trim() || !shipping.pincode?.trim()) {
      toast.error('Please fill in all shipping details.');
      return;
    }

    setPlacingOrder(true);
    setPaymentStep('creating');

    try {
      if (useNewAddress && shipping.address.trim() !== '') {
        try {
          await api.post('/user/addresses', shipping);
        } catch (e) {
          console.error('Failed to auto-save new address', e);
        }
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load payment gateway. Please check your internet connection.');
        setPlacingOrder(false);
        setPaymentStep('idle');
        return;
      }

      const { data: orderData } = await api.post('/payments/create-order', {
        cartItems: cartItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
        shippingDetails: shipping,
      });

      setPaymentStep('paying');

      const urls = await new Promise<string[]>((resolve, reject) => {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'MedoxAtoZ',
          description: `Order for ${cartItems.length} item(s)`,
          image: '/logo.png',
          order_id: orderData.razorpayOrderId,
          prefill: {
            name: shipping.fullName,
            email: shipping.email || user?.email || '',
            contact: shipping.phone,
          },
          theme: {
            color: '#D97706',
          },
          modal: {
            ondismiss: () => {
              reject(new Error('PAYMENT_DISMISSED'));
            },
          },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              setPaymentStep('verifying');

              const res = await api.post('/payments/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              await api.delete('/cart');

              resolve(res.data?.invoiceUrls || []);
            } catch (verifyErr: any) {
              reject(verifyErr);
            }
          },
        };

        const rzp = new window.Razorpay(options);

        rzp.on('payment.failed', (resp: any) => {
          console.error('[Razorpay] Payment failed:', resp.error);
          reject(new Error('PAYMENT_FAILED|' + (resp.error?.description || 'Payment failed')));
        });

        rzp.open();
      });

      if (urls && urls.length > 0) {
        toast.success('🎉 Payment successful!');
        setInvoicePdfUrl(urls[0]);
      } else {
        toast.success('🎉 Payment successful! Order placed.');
        router.push('/account');
      }

    } catch (err: any) {
      if (err.message === 'PAYMENT_DISMISSED') {
        toast('Payment cancelled. Your order was not placed.', { icon: '⚠️' });
      } else if (err.message?.startsWith('PAYMENT_FAILED|')) {
        const msg = err.message.split('|')[1];
        toast.error(`Payment failed: ${msg}`);
      } else {
        const msg = err.response?.data?.error || err.message || 'Something went wrong. Please try again.';
        toast.error(msg);
      }
    } finally {
      setPlacingOrder(false);
      setPaymentStep('idle');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] flex flex-col">
        <Navbar />
        <div className="flex flex-col items-center justify-center flex-1 py-20">
          <Loader2 className="w-12 h-12 text-gold-primary animate-spin" />
          <p className="mt-4 text-gray-500 font-semibold tracking-wide">Loading Checkout...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const totalAmount = cartItems.reduce((acc, item) => {
    const p = productDetails[item.productId];
    if (!p) return acc;
    const price = typeof p.price === 'string' ? parseFloat(p.price.replace(/,/g, '')) : Number(p.price);
    return acc + (price * item.quantity);
  }, 0);

  const paymentStatusLabel = {
    idle: placingOrder ? 'Initiating...' : null,
    creating: 'Creating secure payment...',
    paying: 'Waiting for payment...',
    verifying: 'Verifying payment...',
  };

  const buttonLabel = paymentStatusLabel[paymentStep] || (placingOrder ? 'Processing...' : 'Pay with Razorpay');

  return (
    <main className="bg-[var(--bg-page)] min-h-screen pb-28">
      <Navbar />

      {/* Verifying Lottie Overlay */}
      {paymentStep === 'verifying' && (
        <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-black/90 to-gray-900/90 flex flex-col items-center justify-center backdrop-blur-sm">
          <div className="w-64 h-64 flex items-center justify-center">
            <DotLottieReact
              src="https://lottie.host/a2345253-3c9e-443b-8cfa-5a37e74a01ca/KiTAb9htWE.lottie"
              loop
              autoplay
            />
          </div>
          <p className="text-white font-bold text-xl mt-4 animate-pulse">Verifying secure payment...</p>
        </div>
      )}

      {/* Invoice PDF Modal */}
      {invoicePdfUrl && (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex flex-col items-center justify-center p-4 md:p-10 backdrop-blur-md">
          <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col h-full max-h-[90vh] animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
              <h2 className="font-bold text-gray-800 text-lg">Order Confirmed! Your Invoice</h2>
              <button 
                onClick={() => router.push('/account')}
                className="px-5 py-2.5 bg-gold-primary text-white rounded-lg text-sm font-bold hover:bg-gold-hover transition-colors flex items-center gap-2"
              >
                Continue to Account <X className="w-4 h-4" />
              </button>
            </div>
            <iframe src={invoicePdfUrl} className="w-full flex-1 border-0" title="Invoice PDF" />
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col lg:flex-row gap-8 items-start">

        {/* Shipping Form Card */}
        <div className="flex-1 w-full">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-[var(--shadow-soft)] border-t-4 border-t-gold-primary border-x border-b border-gray-100/80">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 border-b border-gray-100 pb-5 mb-6 flex items-center gap-3">
              <span className="w-1.5 h-8 bg-gold-primary rounded-full"></span>
              Checkout
            </h1>

            <form id="checkoutForm" onSubmit={handlePayWithRazorpay} className="flex flex-col gap-6">
              <div className="flex justify-between items-center mt-2.5">
                <h2 className="text-lg font-bold text-gray-900">Shipping Address</h2>
                {addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setUseNewAddress(!useNewAddress)}
                    className="text-gold-primary hover:text-gold-hover transition-colors text-sm font-semibold bg-transparent border-none cursor-pointer"
                  >
                    {useNewAddress ? 'Use Saved Address' : 'Enter New Address'}
                  </button>
                )}
              </div>

              {!useNewAddress && addresses.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {addresses.map(addr => {
                    const isSelected = shipping.id === addr.id || (shipping.address === addr.address && shipping.pincode === addr.pincode);
                    return (
                      <label
                        key={addr.id}
                        className={`flex gap-3.75 p-3.75 border rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'border-gold-primary bg-gold-light/45 shadow-sm'
                            : 'border-gray-250 bg-white hover:bg-gray-50/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="addressSelection"
                          checked={isSelected}
                          onChange={() => setShipping({...shipping, ...addr})}
                          className="mt-1"
                        />
                        <div className="text-gray-700">
                          <strong className="text-gray-900 font-bold">{addr.fullName}</strong>
                          <div className="text-sm mt-1 text-gray-600">{addr.address}, {addr.city}, {addr.state} {addr.pincode}</div>
                          <div className="text-sm mt-0.5 text-gray-500">Phone: {addr.phone}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <>
                  <div className="col-span-full mb-1">
                    <button
                      type="button"
                      onClick={autoFillCheckoutLocation}
                      disabled={detectingLoc}
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-200 text-blue-700 font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      <MapPin className="w-4 h-4" />
                      {detectingLoc ? 'Autofilling location details...' : 'Autofill with Current Location'}
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-5">
                    <div className="flex-1">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        required
                        value={shipping.fullName}
                        onChange={e => setShipping({...shipping, fullName: e.target.value})}
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none transition-all focus:border-gold-primary focus:ring-2 focus:ring-gold-primary/20"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={shipping.phone}
                        onChange={e => setShipping({...shipping, phone: e.target.value})}
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none transition-all focus:border-gold-primary focus:ring-2 focus:ring-gold-primary/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Complete Address</label>
                    <textarea
                      required
                      rows={3}
                      value={shipping.address}
                      onChange={e => setShipping({...shipping, address: e.target.value})}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none transition-all focus:border-gold-primary focus:ring-2 focus:ring-gold-primary/20"
                    ></textarea>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-5">
                    <div className="flex-1">
                      <label className="block text-sm font-bold text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        required
                        value={shipping.city}
                        onChange={e => setShipping({...shipping, city: e.target.value})}
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none transition-all focus:border-gold-primary focus:ring-2 focus:ring-gold-primary/20"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-bold text-gray-700 mb-2">State</label>
                      <input
                        type="text"
                        required
                        value={shipping.state}
                        onChange={e => setShipping({...shipping, state: e.target.value})}
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none transition-all focus:border-gold-primary focus:ring-2 focus:ring-gold-primary/20"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Pincode</label>
                      <input
                        type="text"
                        required
                        value={shipping.pincode}
                        onChange={e => setShipping({...shipping, pincode: e.target.value})}
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none transition-all focus:border-gold-primary focus:ring-2 focus:ring-gold-primary/20"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Payment Method — Razorpay */}
              <h2 className="text-lg font-bold text-gray-900 mt-4 border-t border-gray-100 pt-5">Payment</h2>
              <div className="p-5 border-2 border-gold-primary/40 rounded-xl bg-amber-50/40 flex items-start gap-4">
          
                  <img src="/assets/razorpay.svg" alt="Razorpay" className="w-7 h-7" />
           
                <div>
                  <p className="font-bold text-gray-900">Razorpay — Secure Online Payment</p>
                  <p className="text-xs text-gray-500 mt-1">Pay securely via UPI, Credit/Debit Card, Net Banking, or Wallets. Your order will be confirmed only after successful payment.</p>
             
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar Order Summary */}
        <div className="w-full lg:w-[380px] shrink-0">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-[var(--shadow-soft)] border-t-4 border-t-gold-primary border-x border-b border-gray-100/80 sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-100">Order Summary</h2>
            <div className="border-b border-gray-100 pb-3.75 mb-3.75 space-y-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Items ({cartItems.length}):</span>
                <span className="font-semibold text-gray-800">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery:</span>
                <span className="text-emerald-600 font-semibold">FREE</span>
              </div>
            </div>
            <div className="flex justify-between items-end text-xl font-extrabold text-gray-900 mb-6">
              <span>Order Total:</span>
              <span className="text-2xl text-red-700">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>

            <button
              type="submit"
              form="checkoutForm"
              disabled={placingOrder || !shipping.address}
              className="w-full py-4 bg-gold-primary hover:bg-gold-hover text-text-main font-bold rounded-lg transition-all duration-300 shadow-md shadow-amber-500/10 hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer flex items-center justify-center gap-2"
            >
              {placingOrder ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{buttonLabel}</span>
                </>
              ) : (
                <>
                  <img src="/assets/razorpay.svg" alt="Razorpay" className="w-5 h-5" />
                  <span>Pay ₹{totalAmount.toLocaleString('en-IN')} Securely</span>
                </>
              )}
            </button>

            <p className="text-xs text-gray-400 text-center mt-3 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              Powered by Razorpay. 100% secure.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
