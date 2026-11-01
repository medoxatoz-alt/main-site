'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import toast from 'react-hot-toast';
import { Loader2, Minus, Plus, Trash2, X, ShoppingBag, Tag } from 'lucide-react';

import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import CheckoutModal from '@/components/CheckoutModal';
import Sheet from '@/components/ui/Sheet';

// --- Types ---
interface CartItem {
  productId: string;
  quantity: number;
  variantId?: string;
}

interface ProductVariant {
  id: string;
  label: string;
  price: number;
  mrp?: number;
  stock: number;
  images?: string[];
}

interface Product {
  _id?: string;
  title: string;
  price: string | number;
  image: string | string[];
  stock?: number;
  variants?: ProductVariant[];
}

// Resolves a cart line's display price/stock/image/label: the matching
// variant's own fields when the line has a variantId, falling back to the
// product's flat fields otherwise (unchanged from before variants existed).
// A variant's image falls back to the product's own images when it has none.
function resolveLine(p: Product, item: CartItem) {
  const variant = item.variantId ? p.variants?.find(v => v.id === item.variantId) : undefined;
  const price = variant ? Number(variant.price) || 0 : (typeof p.price === 'string' ? parseFloat(p.price.replace(/,/g, '')) : Number(p.price) || 0);
  const stock = variant ? Number(variant.stock) || 0 : Number(p.stock) || 0;
  const variantImages = variant?.images;
  const imageField = Array.isArray(variantImages) && variantImages.length > 0 ? variantImages : p.image;
  const image = Array.isArray(imageField) ? imageField[0] : (imageField || 'https://via.placeholder.com/150');
  return { price, stock, image, label: variant?.label };
}

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [productDetails, setProductDetails] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [buyNowItem, setBuyNowItem] = useState<{ productId: string, quantity: number, variantId?: string } | null>(null);

  useEffect(() => {
    const handleOpenCheckout = (e: any) => {
      if (e.detail?.buyNowItem) {
        setBuyNowItem(e.detail.buyNowItem);
      } else {
        setBuyNowItem(null);
      }
      setIsCheckoutOpen(true);
    };
    window.addEventListener('open-checkout', handleOpenCheckout);
    return () => window.removeEventListener('open-checkout', handleOpenCheckout);
  }, []);

  const fetchCartAndProducts = async () => {
    setLoading(true);
    try {
      const { data: items } = await api.get('/cart');
      setCartItems(items);

      const missingProductIds = Array.from(new Set<string>(
        items.map((item: CartItem) => item.productId)
      )).filter((id: string) => !productDetails[id]);

      if (missingProductIds.length > 0) {
        const productPromises = missingProductIds.map((id: string) => 
          api.get(`/products/${id}`).catch(async err => {
            console.error(`Failed to fetch product ${id}`, err);
            try {
              await api.delete(`/cart/${id}`);
              setCartItems(prev => prev.filter(i => i.productId !== id));
            } catch (delErr) {
              console.error(`Failed to auto-remove unavailable product ${id}`, delErr);
            }
            return null;
          })
        );
        const productResponses = await Promise.all(productPromises);

        const newDetails = { ...productDetails };
        productResponses.forEach((res, index) => {
          if (res && res.data) {
            newDetails[missingProductIds[index]] = res.data;
          }
        });
        setProductDetails(newDetails);
      }
    } catch (err) {
      console.error('Failed to fetch cart', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchCartAndProducts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user]);

  const lineKey = (productId: string, variantId?: string) => `${productId}_${variantId ?? ''}`;

  const handleUpdateQty = async (productId: string, newQty: number, variantId?: string) => {
    const p = productDetails[productId];
    const stock = p ? resolveLine(p, { productId, quantity: newQty, variantId }).stock : 0;
    if (p && newQty > stock) {
      toast.error(`Only ${stock} units available in stock.`);
      return;
    }
    const key = lineKey(productId, variantId);
    setIsUpdating(key);
    try {
      const qs = variantId ? `?variantId=${encodeURIComponent(variantId)}` : '';
      if (newQty <= 0) {
        await api.delete(`/cart/${productId}${qs}`);
        toast.success('Item removed');
      } else {
        await api.patch(`/cart/${productId}${qs}`, { quantity: newQty });
      }

      // Update local state optimistic
      setCartItems(prev => {
        if (newQty <= 0) return prev.filter(i => lineKey(i.productId, i.variantId) !== key);
        return prev.map(i => lineKey(i.productId, i.variantId) === key ? { ...i, quantity: newQty } : i);
      });
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update quantity');
      await fetchCartAndProducts();
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRemove = async (productId: string, variantId?: string) => {
    const key = lineKey(productId, variantId);
    setIsRemoving(key);
    setIsUpdating(key);
    try {
      const qs = variantId ? `?variantId=${encodeURIComponent(variantId)}` : '';
      await api.delete(`/cart/${productId}${qs}`);
      toast.success('Item removed');
      setCartItems(prev => prev.filter(i => lineKey(i.productId, i.variantId) !== key));
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) {
      toast.error('Failed to remove item');
      await fetchCartAndProducts();
    } finally {
      setIsRemoving(null);
      setIsUpdating(null);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const p = productDetails[item.productId];
      if (!p) return total;
      return total + (resolveLine(p, item).price * item.quantity);
    }, 0);
  };

  const closeCheckout = () => {
    setIsCheckoutOpen(false);
    // Clear any stale "Buy Now" item so a later full-cart checkout isn't
    // silently limited to whatever single product was last bought this way.
    setBuyNowItem(null);
  };

  const totalAmount = calculateTotal();
  const itemCount = cartItems.reduce((n, i) => n + i.quantity, 0);
  const hasInventoryIssues = cartItems.some(item => {
    const p = productDetails[item.productId];
    if (!p) return false;
    return resolveLine(p, item).stock < item.quantity;
  });

  return (
    <>
      <Sheet
        open={isOpen}
        onClose={onClose}
        side="right"
        label="Shopping cart"
        className="w-full sm:w-[420px] max-w-[100vw] bg-white"
      >
        {/* Header */}
        <div className="pt-safe shrink-0 border-b border-line">
          <div className="h-14 px-4 sm:px-5 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <h2 className="text-[17px] font-semibold text-ink">Cart</h2>
              {user && itemCount > 0 && (
                <span className="text-[13px] text-text-muted">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Close cart"
              className="pressable -mr-2 w-10 h-10 grid place-items-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-ink border-none bg-transparent"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar">
          {!user ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-8 animate-in fade-in duration-300">
              <div className="w-14 h-14 rounded-full bg-gray-100 grid place-items-center mb-4">
                <ShoppingBag className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-ink mb-1">Sign in to view your cart</h3>
              <p className="text-text-muted mb-6 text-sm">Your saved items will appear here.</p>
              <button
                onClick={() => { onClose(); router.push('/signin'); }}
                className="pressable h-11 px-8 bg-ink text-white text-sm font-semibold rounded-full border-none hover:bg-black"
              >
                Sign in
              </button>
            </div>
          ) : authLoading || loading ? (
            <div className="divide-y divide-line">
              {[0, 1, 2].map(i => (
                <div key={i} className="p-4 sm:px-5 flex gap-4">
                  <div className="shrink-0 w-20 h-20 bg-gray-100 rounded-xl animate-pulse" />
                  <div className="flex flex-col flex-1 gap-2 py-1">
                    <div className="h-3.5 bg-gray-100 rounded animate-pulse w-4/5" />
                    <div className="h-3.5 bg-gray-100 rounded animate-pulse w-2/5" />
                    <div className="mt-auto h-8 w-24 bg-gray-100 rounded-full animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-8 animate-in fade-in duration-300">
              <div className="w-40 h-40 mb-2">
                <DotLottieReact
                  src="https://lottie.host/c79bec0a-7f01-4537-bf9b-69f8ef77b8f3/8hIlnWm3PQ.lottie"
                  loop
                  autoplay
                />
              </div>
              <h3 className="text-base font-semibold text-ink mb-1">Your cart is empty</h3>
              <p className="text-sm text-text-muted mb-6">Browse the catalogue to add supplies.</p>
              <button
                onClick={onClose}
                className="pressable h-11 px-6 border border-line bg-white text-ink text-sm font-semibold rounded-full hover:bg-gray-50"
              >
                Continue shopping
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {cartItems.map((item, idx) => {
                const p = productDetails[item.productId];
                if (!p) return null;

                const { price, stock, image: img, label } = resolveLine(p, item);
                const key = lineKey(item.productId, item.variantId);
                const isItemUpdating = isUpdating === key;
                const isItemRemoving = isRemoving === key;

                return (
                  <li
                    key={key}
                    style={{ animationDelay: `${Math.min(idx, 6) * 30}ms` }}
                    className={`p-4 sm:px-5 flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both transition-opacity ${isItemUpdating ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}
                  >
                    <Link href={`/product/${item.productId}`} onClick={onClose} className="shrink-0 w-20 h-20 bg-gray-50 border border-line rounded-xl p-2 flex items-center justify-center">
                      <img src={img} alt={p.title} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                    </Link>

                    <div className="flex flex-col flex-1 min-w-0">
                      <Link href={`/product/${item.productId}`} onClick={onClose} className="text-[14px] leading-snug font-medium text-ink line-clamp-2 hover:underline underline-offset-2">
                        {p.title}
                      </Link>
                      {label && (
                        <div className="text-[12px] text-text-muted mt-0.5">{label}</div>
                      )}

                      <div className="text-[15px] font-semibold text-ink mt-1 tabular-nums">
                        ₹{price.toLocaleString('en-IN')}
                      </div>

                      <div className="mt-auto pt-2 flex items-center justify-between">
                        {/* Quantity stepper */}
                        <div className="flex items-center h-9 border border-line rounded-full overflow-hidden bg-white">
                          <button
                            onClick={() => handleUpdateQty(item.productId, item.quantity - 1, item.variantId)}
                            aria-label="Decrease quantity"
                            className="pressable w-9 h-full grid place-items-center text-gray-600 hover:bg-gray-50 border-none bg-transparent"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-7 text-center text-[13px] font-semibold text-ink tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQty(item.productId, item.quantity + 1, item.variantId)}
                            disabled={item.quantity >= stock}
                            aria-label="Increase quantity"
                            className="pressable w-9 h-full grid place-items-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 border-none bg-transparent"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemove(item.productId, item.variantId)}
                          className="pressable w-9 h-9 grid place-items-center text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 border-none bg-transparent"
                          aria-label="Remove item"
                        >
                          {isItemRemoving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {user && cartItems.length > 0 && !loading && (
          <div className="border-t border-line px-4 sm:px-5 pt-4 pb-[max(16px,env(safe-area-inset-bottom))] shrink-0 bg-white animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-1.5 text-[12px] text-text-muted mb-3">
              <Tag className="w-3.5 h-3.5" />
              <span>Coupon codes can be applied at checkout</span>
            </div>

            <div className="flex justify-between items-baseline mb-4">
              <span className="text-sm text-text-muted">Subtotal</span>
              <span className="text-xl font-semibold text-ink tabular-nums">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>

            {hasInventoryIssues && (
              <p className="text-[12px] text-red-600 font-medium mb-3">
                Some items exceed available stock. Please reduce quantities.
              </p>
            )}

            <button
              onClick={() => { setBuyNowItem(null); setIsCheckoutOpen(true); }}
              disabled={hasInventoryIssues}
              className={`pressable w-full h-12 text-[15px] font-semibold rounded-full flex items-center justify-center gap-2 border-none ${
                hasInventoryIssues
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gold-primary hover:bg-gold-hover text-ink'
              }`}
            >
              Checkout
            </button>
          </div>
        )}
      </Sheet>

      <CheckoutModal isOpen={isCheckoutOpen} onClose={closeCheckout} buyNowItem={buyNowItem} />
    </>
  );
}

