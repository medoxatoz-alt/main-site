'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2, MapPin, Lock, X } from 'lucide-react';
import { load } from '@cashfreepayments/cashfree-js';
import PhoneVerification from '@/components/PhoneVerification';
import { useGeolocatedAddress } from '@/hooks/useGeolocatedAddress';

export default function CheckoutModal({ isOpen, onClose, buyNowItem }: { isOpen: boolean; onClose: () => void; buyNowItem?: { productId: string, quantity: number } | null }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [productDetails, setProductDetails] = useState<Record<string, any>>({});
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentMethod] = useState<'CASHFREE'>('CASHFREE');
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const { detect: detectLocation, detecting: detectingLoc } = useGeolocatedAddress({ onError: (msg) => toast.error(msg) });
  const [cashfree, setCashfree] = useState<any>(null);

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

  // Auto-fetch City and State from Pincode (debounced, and ignores stale responses
  // if the pincode changes again before the request resolves)
  useEffect(() => {
    const pin = shipping.pincode?.replace(/\D/g, '');
    if (!useNewAddress || pin?.length !== 6) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setPincodeLoading(true);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        const data = await res.json();
        if (cancelled) return;
        if (data && data[0]?.Status === 'Success') {
          const postOffice = data[0].PostOffice[0];
          setShipping(prev => ({
            ...prev,
            city: postOffice.District || postOffice.Block || prev.city,
            state: postOffice.State || prev.state
          }));
        } else {
          toast.error('Invalid Pincode entered');
        }
      } catch (err) {
        if (!cancelled) console.error('Failed to fetch pincode data', err);
      } finally {
        if (!cancelled) setPincodeLoading(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [shipping.pincode, useNewAddress]);

  // Initialize Cashfree SDK
  useEffect(() => {
    const initializeCashfree = async () => {
      try {
        const cf = await load({
          mode: process.env.NEXT_PUBLIC_CASHFREE_ENV?.toUpperCase() === 'PRODUCTION' ? 'production' : 'sandbox',
        });
        setCashfree(cf);
      } catch (err) {
        console.error('Failed to load Cashfree SDK:', err);
      }
    };
    initializeCashfree();
  }, []);

  const autoFillCheckoutLocation = async () => {
    try {
      const parsed = await detectLocation();
      setShipping(prev => ({
        ...prev,
        address: parsed.streetAddress || prev.address,
        city: parsed.city || prev.city,
        state: parsed.state || prev.state,
        pincode: parsed.pincode || prev.pincode
      }));
      toast.success('Location fields autofilled!');
    } catch {
      // error toast already shown by the hook
    }
  };


  useEffect(() => {
    if (isOpen) {
      if (!authLoading && !user) {
        router.push('/signin');
      } else if (user) {
        setShipping(s => ({ ...s, email: user.email }));
      }
    }
  }, [isOpen, user, authLoading, router]);

  const fetchData = useCallback(async () => {
    try {
      const [cartRes, addrRes] = await Promise.all([
        api.get('/cart'),
        api.get('/user/addresses')
      ]);

      const items = buyNowItem ? [buyNowItem] : cartRes.data;
      if (items.length === 0) {
        toast('Your cart is empty');
        onClose();
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

      const uniqueProductIds: string[] = Array.from(new Set(items.map((i: any) => i.productId)));
      const fetchResults = await Promise.all(uniqueProductIds.map(async (productId) => {
        try {
          const prodRes = await api.get(`/products/${productId}`);
          return { productId, data: prodRes.data, ok: true as const };
        } catch (err) {
          console.error(`Failed to fetch product ${productId}`, err);
          return { productId, ok: false as const };
        }
      }));

      const details: Record<string, any> = {};
      for (const result of fetchResults) {
        if (result.ok) {
          details[result.productId] = result.data;
        } else {
          // Auto-remove unavailable product
          try {
            await api.delete(`/cart/${result.productId}`);
            setCartItems(prev => prev.filter(i => i.productId !== result.productId));
          } catch (delErr) {
            console.error(`Failed to auto-remove unavailable product ${result.productId}`, delErr);
          }
        }
      }
      setProductDetails(details);
    } catch {
      toast.error('Failed to load checkout details');
    } finally {
      setLoading(false);
    }
  }, [user, router, buyNowItem]);

  useEffect(() => {
    if (user && isOpen) fetchData();
  }, [user, isOpen, fetchData]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shipping.fullName?.trim() || !shipping.phone?.trim() || !shipping.address?.trim() || !shipping.city?.trim() || !shipping.state?.trim() || !shipping.pincode?.trim()) {
      toast.error('Please fill in all shipping details.');
      return;
    }

    if (!/^\d{6}$/.test(shipping.pincode.trim())) {
      toast.error('Please enter a valid 6-digit Pincode.');
      return;
    }

    setPlacingOrder(true);

    try {
      if (useNewAddress && shipping.address.trim() !== '') {
        try {
          await api.post('/user/addresses', shipping);
        } catch (e) {
          console.error('Failed to auto-save new address', e);
        }
      }

      const payload = {
        cartItems: cartItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
        shippingDetails: shipping,
      };

      if (paymentMethod === 'CASHFREE') {
        if (!cashfree) {
          toast.error('Payment gateway is still initializing. Please try again in a moment.');
          setPlacingOrder(false);
          return;
        }

        const { data } = await api.post('/payments/cashfree/create-order', payload);
        
        if (!data.payment_session_id) {
          throw new Error('Failed to create Cashfree session');
        }

        // Open Cashfree Drop-in Checkout
        const checkoutOptions = {
          paymentSessionId: data.payment_session_id,
          redirectTarget: '_self', 
        };
        
        cashfree.checkout(checkoutOptions).then((result: any) => {
          if (result.error) {
            console.error('Cashfree Error:', result.error);
            toast.error(result.error.message || 'Payment failed or cancelled.');
            setPlacingOrder(false);
          } else if (result.redirect) {
            // Handled by Cashfree SDK natively (if user clicks UPIDent/Wallet etc.)
          } else if (result.paymentDetails) {
            // Success in modal
            console.log('Payment success:', result.paymentDetails);
          }
        });
      }

    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Something went wrong. Please try again.';
      toast.error(msg);
      setPlacingOrder(false);
    }
  };

  if (!isOpen) return null;

  if (authLoading || loading) {
    return (
      <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-6 animate-in fade-in duration-200">
        <div className="bg-white w-full h-full md:h-auto md:max-w-2xl md:rounded-2xl flex flex-col items-center justify-center py-20 relative shadow-2xl">
          <Loader2 className="w-12 h-12 text-gold-primary animate-spin" />
          <p className="mt-4 text-gray-500 font-semibold tracking-wide">Loading Checkout...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (!user.phone) {
    return (
      <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-xl rounded-2xl flex flex-col relative shadow-2xl overflow-hidden">
          <div className="flex justify-end   bg-white">
             <button onClick={onClose} className="relative p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors bg-transparent border-none cursor-pointer relative z-10">
               <X className="w-5 h-5" />
             </button>
          </div>
          <div className=" ">
            <PhoneVerification onVerified={() => fetchData()} />
          </div>
        </div>
      </div>
    );
  }

  const totalAmount = cartItems.reduce((acc, item) => {
    const p = productDetails[item.productId];
    if (!p) return acc;
    const price = typeof p.price === 'string' ? parseFloat(p.price.replace(/,/g, '')) : Number(p.price);
    return acc + (price * item.quantity);
  }, 0);

  return (
    <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-0 md:p-6 animate-in fade-in duration-200">
      <div className="bg-[#f8f9fa] w-full h-full md:h-auto md:max-h-[90vh] md:max-w-6xl md:rounded-2xl shadow-2xl flex flex-col relative overflow-hidden flex-1">
        
        {/* Header with Close Button */}
        <div className=" border-b border-gray-100 px-4 md:px-6 py-4 flex justify-between items-center shrink-0">
          <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 flex items-center gap-3">
            
            Secure Checkout
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors bg-transparent border-none cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative p-4 md:p-6">

      <div className="flex flex-col lg:flex-row gap-6 md:gap-8 items-start">
        {/* Shipping Form Card */}
        <div className="flex-1 w-full">
          <div className="px-5 border-x border-b border-gray-100/80">
            <form id="checkoutForm" onSubmit={handlePlaceOrder} className="flex flex-col gap-6">
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
                          className="mt-1 cursor-pointer"
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
                        readOnly={pincodeLoading}
                        value={shipping.state}
                        onChange={e => setShipping({...shipping, state: e.target.value})}
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none transition-all focus:border-gold-primary focus:ring-2 focus:ring-gold-primary/20 disabled:bg-gray-100"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Pincode</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        pattern="\d{6}"
                        title="6-digit Pincode"
                        value={shipping.pincode}
                        onChange={e => setShipping({...shipping, pincode: e.target.value.replace(/\D/g, '')})}
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none transition-all focus:border-gold-primary focus:ring-2 focus:ring-gold-primary/20"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Payment Methods */}
              <h2 className="text-lg font-bold text-gray-900 mt-4 border-t border-gray-100 pt-5">Payment Method</h2>
              <div className="flex flex-col gap-3">
                {/* Cashfree Online Payment */}
                <label
                  className={`flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    paymentMethod === 'CASHFREE'
                      ? 'border-indigo-500 bg-indigo-50/40 shadow-sm'
                      : 'border-gray-200 bg-white hover:bg-gray-50/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'CASHFREE'}
                    readOnly
                    className="mt-1.5 cursor-pointer"
                  />
                  <div className="flex-1 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-900 flex items-center gap-2">
                        Pay Online <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Recommended</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">UPI, Credit/Debit Cards, Net Banking, and Wallets</p>
                    </div>
                    {/* Minimal Cashfree badging */}
                    <div className="text-[10px] font-bold text-gray-400 uppercase flex flex-col items-end">
                      Secured by
                      <img src="https://mintcdn.com/cashfreepayments-d00050e9/dtW4IY4XfWXyv9-C/static/logo/light.svg" alt="Cashfree" className="h-4 mt-1 opacity-70 grayscale" />
                    </div>
                  </div>
                </label>

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
                  <span>Initiating Payment...</span>
                </>
              ) : (
                <span>{`Pay ₹${totalAmount.toLocaleString('en-IN')}`}</span>
              )}
            </button>

            <p className="text-xs text-gray-400 text-center mt-3 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              100% Secure Checkout
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
    </div>
  );
}
