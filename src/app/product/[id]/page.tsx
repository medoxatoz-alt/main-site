'use client';

import { useEffect, useState, use } from 'react';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Loader2, 
  Star, 
  ShieldCheck, 
  Truck, 
  BadgeCheck, 
  RotateCcw, 
  Plus, 
  Minus, 
  ShoppingBag,
  Award,
  Heart,
  Share2,
  MessageSquare
} from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import React from 'react';

const parseImages = (imageProp: any): string[] => {
  if (Array.isArray(imageProp)) return imageProp;
  if (typeof imageProp !== 'string') return ['https://via.placeholder.com/400?text=No+Image'];
  const trimmed = imageProp.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try { return JSON.parse(trimmed); } catch {}
  }
  if (trimmed.includes(',')) {
    return trimmed.split(',').map((img) => img.trim());
  }
  return trimmed ? [trimmed] : ['https://via.placeholder.com/400?text=No+Image'];
};

export default function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const { user } = useAuth();
  const router = useRouter();

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    if (user && id) {
      api.get('/user/wishlist')
        .then(res => {
          const ids = res.data.wishlistIds || [];
          setIsWishlisted(ids.includes(id));
        })
        .catch(err => console.error("Failed to fetch wishlist status", err));
    }
  }, [user, id]);

  const toggleWishlist = async () => {
    if (!user) {
      toast.error('Please sign in to manage your wishlist');
      router.push('/signin');
      return;
    }
    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        await api.delete(`/user/wishlist/${id}`);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await api.post(`/user/wishlist/${id}`);
        setIsWishlisted(true);
        toast.success('Added to wishlist!');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  const shareProduct = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.title || 'MedoxAtoZ Product',
          text: `Check out ${product?.title || 'this medical product'} on MedoxAtoZ!`,
          url: window.location.href,
        });
        toast.success('Shared successfully!');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          toast.error('Failed to share.');
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      } catch {
        toast.error('Failed to copy link.');
      }
    }
  };

  useEffect(() => {
    const fetchProductAndReviews = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data);
        if ((Number(res.data.stock) || 0) <= 0) {
          setQuantity(0);
        }
      } catch (err: any) {
        const msg = err.response?.data?.error || 'Product not found';
        setErrorMsg(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchProductAndReviews();
  }, [id, user]);

  const handleAddToCart = async () => {
    if (!user) {
      toast('Please sign in to add to cart');
      router.push('/signin');
      return;
    }
    setAddingToCart(true);
    try {
      const cartRes = await api.get('/cart');
      const existingItem = cartRes.data.find((item: any) => item.productId === product.id);
      const currentQty = existingItem ? existingItem.quantity : 0;
      
      const targetQty = currentQty + quantity;
      const stock = Number(product.stock) || 0;

      if (stock < targetQty) {
        toast.error(`Cannot add to cart. Only ${stock} units available in stock (you already have ${currentQty} in your cart).`);
        setAddingToCart(false);
        return false;
      }
      
      if (currentQty === 0) {
        await api.post(`/cart/${product.id}`);
        if (targetQty > 1) {
          await api.patch(`/cart/${product.id}`, { quantity: targetQty });
        }
      } else {
        await api.patch(`/cart/${product.id}`, { quantity: targetQty });
      }

      toast.success('Added to Cart!');
      window.dispatchEvent(new Event('cart-updated'));
      return true;
    } catch (err) {
      toast.error('Failed to add to cart');
      return false;
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      toast('Please sign in to buy');
      router.push('/signin');
      return;
    }
    
    window.dispatchEvent(new CustomEvent('open-checkout', { 
      detail: { 
        buyNowItem: { 
          productId: product.id, 
          quantity: quantity 
        } 
      } 
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] flex flex-col">
        <Navbar />
        <div className="flex flex-col items-center justify-center flex-1 py-20 animate-pulse">
          <Loader2 className="w-12 h-12 text-gold-primary animate-spin" />
          <p className="mt-4 text-gray-500 font-semibold tracking-wide">Loading premium medical supplies...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] flex flex-col">
        <Navbar />
        <div className="flex flex-col items-center justify-center flex-1 py-20">
          <ErrorState message={errorMsg} />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] flex flex-col">
        <Navbar />
        <div className="flex flex-col items-center justify-center flex-1 py-20">
          <ErrorState message="Product not found." />
        </div>
      </div>
    );
  }

  const images = Array.isArray(product.images) && product.images.length > 0 
    ? product.images 
    : parseImages(product.image);
  const activeImageUrl = images[activeImgIdx] || images[0] || 'https://via.placeholder.com/400';
  const price = typeof product.price === 'string' ? parseFloat(product.price.replace(/,/g, '')) : Number(product.price);
  const mrp = product.mrp ? (typeof product.mrp === 'string' ? parseFloat(product.mrp.replace(/,/g, '')) : Number(product.mrp)) : null;
  const discountPercentage = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  return (
    <main className="bg-[var(--bg-page)] min-h-screen pb-20 ">
      <Navbar />
      
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-5">
        
        {/* Navigation Breadcrumb */}
        <div className="text-xs text-gray-500 mb-6 flex items-center gap-1.5 font-medium">
          <span className="hover:text-gold-primary cursor-pointer transition-colors" onClick={() => router.push('/')}>Home</span>
          <span>/</span>
          <span className="text-gray-400 capitalize">{product.category}</span>
          <span>/</span>
          <span className="text-gray-800 font-semibold truncate max-w-[200px] sm:max-w-xs">{product.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Image Area (lg:col-span-5) */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="bg-white p-5 rounded-2xl border border-gray-200/60 shadow-[var(--shadow-soft)] flex justify-center items-center overflow-hidden relative group h-[340px] sm:h-[450px]">
              {discountPercentage > 0 && (
                <div className="absolute top-4 left-4 z-10 bg-red-600 text-white text-[11px] uppercase tracking-wider font-extrabold px-3 py-1 rounded shadow-md">
                  {discountPercentage}% OFF
                </div>
              )}
              
              <img 
                key={activeImageUrl}
                src={activeImageUrl} 
                alt={product.title} 
                className="max-w-full max-h-full object-contain transition-transform duration-500 hover:scale-105" 
              />
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2.5 mt-4 overflow-x-auto py-1 no-scrollbar max-w-full">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveImgIdx(idx);
                    }}
                    className={`w-[70px] h-[70px] rounded-lg border-2 p-1 bg-white flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-95 shrink-0 ${
                      idx === activeImgIdx 
                        ? 'border-gold-primary shadow-md scale-105' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img src={img} alt={`${product.title} view ${idx + 1}`} className="max-w-full max-h-full object-contain" />
                  </button>
                ))}
              </div>
            )}

            {/* Quality Seals */}
            <div className="mt-8 grid grid-cols-2 gap-3.5">
              <div className="bg-white p-3.5 rounded-xl border border-gray-200/50 flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-gold-primary rounded-lg">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">ISO 13485</div>
                  <div className="text-[10px] text-gray-500 font-medium">Certified Quality</div>
                </div>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-gray-200/50 flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">Secure Checkout</div>
                  <div className="text-[10px] text-gray-500 font-medium">SSL Encrypted</div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column: Details & Actions Area (lg:col-span-4) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200/60 shadow-[var(--shadow-soft)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-gold-primary bg-amber-50/50 px-2.5 py-1 rounded">
                  {product.category}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={toggleWishlist}
                    disabled={wishlistLoading}
                    className={`p-1.5 hover:bg-gray-50 active:scale-90 rounded-full transition-all duration-150 cursor-pointer disabled:opacity-50 ${
                      isWishlisted ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                    }`}
                    aria-label="Add to wishlist"
                  >
                    <Heart className="w-4 h-4" fill={isWishlisted ? 'currentColor' : 'none'} />
                  </button>
                  <button 
                    onClick={shareProduct}
                    className="p-1.5 hover:bg-gray-50 hover:text-gold-primary text-gray-400 active:scale-90 rounded-full transition-all duration-150 cursor-pointer" 
                    aria-label="Share product"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-6 leading-snug">
                {product.title}
              </h1>

              {/* Pricing Section */}
              <div className="border-t border-b border-gray-100 py-4 mb-6">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-3xl font-extrabold text-gray-900">
                    ₹{price.toLocaleString('en-IN')}
                  </span>
                  {mrp && mrp > price && (
                    <>
                      <span className="text-sm text-gray-400 line-through">
                        ₹{mrp.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded ml-1">
                        {discountPercentage}% Save
                      </span>
                    </>
                  )}
                </div>
                <div className="text-[11px] text-gray-400 mt-1.5 font-medium mb-4">Inclusive of all duties and taxes</div>

                {/* Inline Checkout Actions */}
                {(() => {
                  const stock = Number(product.stock) || 0;
                  const isOutOfStock = stock <= 0;
                  return (
                    <div className="flex flex-col gap-5 mt-6 border-t border-gray-100 pt-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex flex-col gap-1">
                          <div className={isOutOfStock ? "text-red-600 font-bold text-sm" : "text-emerald-600 font-bold text-sm"}>
                            {isOutOfStock ? "Out of Stock" : "In Stock & Secure"}
                          </div>
                          {!isOutOfStock && <div className="text-xs text-gray-500 font-medium">Estimated Dispatch: Within 24 Hours</div>}
                        </div>

                        {/* Quantity Selector */}
                        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-1.5">
                          <button
                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                            disabled={isOutOfStock || quantity <= 1}
                            className="p-1.5 hover:bg-white active:scale-90 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed rounded transition-all duration-150 shadow-sm cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5 stroke-2" />
                          </button>
                          <span className="text-sm font-extrabold text-gray-800 w-6 text-center">{quantity}</span>
                          <button
                            onClick={() => setQuantity(q => Math.min(Math.min(10, stock), q + 1))}
                            disabled={isOutOfStock || quantity >= Math.min(10, stock)}
                            className="p-1.5 hover:bg-white active:scale-90 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed rounded transition-all duration-150 shadow-sm cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-2" />
                          </button>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                          onClick={handleAddToCart}
                          disabled={isOutOfStock || addingToCart}
                          className={`flex-1 py-3.5 font-extrabold rounded-full transition-all duration-300 shadow-md cursor-pointer flex items-center justify-center gap-2 ${
                            isOutOfStock 
                              ? 'bg-gray-100 text-gray-400 border border-gray-200 shadow-none cursor-not-allowed' 
                              : 'bg-white text-gray-900 border-2 border-gold-primary hover:bg-gold-50 shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none'
                          }`}
                        >
                          <ShoppingBag className="w-4 h-4 stroke-2" />
                          <span>{isOutOfStock ? 'Out of Stock' : addingToCart ? 'Adding to Cart...' : 'Add to Cart'}</span>
                        </button>
                        
                        <button 
                          onClick={handleBuyNow}
                          disabled={isOutOfStock || addingToCart}
                          className={`flex-1 py-3.5 font-extrabold rounded-full transition-all duration-300 shadow-md cursor-pointer flex items-center justify-center gap-2 ${
                            isOutOfStock 
                              ? 'bg-gray-200 text-gray-400 border border-gray-200 shadow-none cursor-not-allowed hidden' 
                              : 'bg-gold-primary hover:bg-gold-hover text-[#2b3036] shadow-amber-500/20 hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none'
                          }`}
                        >
                          <span>Buy Now</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

              </div>
            </div>

            {/* Attributes List */}
            <div className="bg-white px-6 sm:px-8 py-5 border-t border-gray-100">
              <h2 className="text-sm font-extrabold text-gray-900 mb-4 uppercase tracking-wider">Product Specifications</h2>
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] gap-y-3 text-sm">
                <div className="font-bold text-gray-800">Item Category</div>
                <div className="text-gray-600 capitalize">{product.category}</div>
                
                <div className="font-bold text-gray-800">Availability</div>
                <div className="text-emerald-700 font-semibold">{product.stock && product.stock > 0 ? 'Certified In Stock' : 'Pre-order Available'}</div>

                {product.attributes && product.attributes.map((attr: any, idx: number) => (
                  <React.Fragment key={idx}>
                    <div className="font-bold text-gray-800 capitalize">{attr.key}</div>
                    <div className="text-gray-600">{attr.value}</div>
                  </React.Fragment>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Information & Related Area (lg:col-span-3) */}
          <div className="lg:col-span-3 flex flex-col gap-6 sticky top-24">
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-[var(--shadow-soft)] overflow-hidden">
              {/* About this item (Description) */}
              <div className="px-6 sm:px-8 py-6">
                <h2 className="text-sm font-extrabold text-gray-900 mb-4 uppercase tracking-wider">About this item</h2>
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {product.description ? (
                    <ul className="list-disc pl-5 space-y-2.5 marker:text-gold-primary">
                      {product.description.split('\n').map((line: string, i: number) => {
                        const trimmed = line.trim();
                        if (!trimmed) return null;
                        return <li key={i} className="pl-1">{trimmed.replace(/^- /, '')}</li>;
                      })}
                    </ul>
                  ) : (
                    <p className="italic text-gray-400">No detailed description provided for this item.</p>
                  )}
                </div>
              </div>
              
              {/* Vendor Details */}
              <div className="bg-gray-50/80 p-6 sm:p-8 border-t border-gray-100">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <div className="text-sm font-extrabold text-gray-900">
                      {product.is_sold_by_vendor ? 'Verified Third-Party Vendor' : 'Medox Certified Partner'}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed pl-7">
                    {product.is_sold_by_vendor 
                      ? 'This item is sold by a verified independent vendor on the MedoxAtoZ platform. All sellers must meet strict quality standards.'
                      : 'This item is shipped directly from a certified medical warehousing facility to maintain precise temperature and moisture controls. Only authorized vendors can publish listing records.'}
                  </p>
                </div>
              </div>
            </div>
          </div>



        </div>
      </div>
    </main>
  );
}
