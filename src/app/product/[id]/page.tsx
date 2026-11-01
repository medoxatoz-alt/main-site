'use client';

import { useEffect, useState, use, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import api, { peekProduct, getProductsCached } from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  ShieldCheck,
  Truck,
  BadgeCheck,
  Plus,
  Minus,
  ShoppingBag,
  Award,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  FileText,
  ExternalLink,
  RotateCcw,
  Receipt,
  XCircle,
  ChevronDown
} from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import DeliveryEstimate from '@/components/DeliveryEstimate';
import ProductCard from '@/components/ProductCard';
import { ProductRailSkeleton, RAIL_ITEM_CLASS, RAIL_TRACK_CLASS } from '@/components/Skeleton';
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

// Summaries of the store policies (see /shipping-policy and /refund-policy).
const POLICIES = [
  {
    id: 'shipping',
    icon: Truck,
    title: 'Shipping',
    summary: 'Dispatched in 1–2 business days, India only',
    points: [
      'Orders are dispatched within 1–2 business days (excluding weekends and public holidays).',
      'Standard delivery: 3–5 business days. Express: 1–2 business days for select pin codes.',
      'Temperature-sensitive items ship by cold-chain delivery.',
      'Shipping charges are shown at checkout. Tracking is shared once your order ships.',
    ],
    href: '/shipping-policy',
  },
  {
    id: 'returns',
    icon: RotateCcw,
    title: 'Returns & refunds',
    summary: 'Within 48 hours for damaged or wrong items',
    points: [
      'Returns accepted if the product is defective, damaged in transit, or the wrong item was delivered.',
      'Request a return within 48 hours of delivery. Items must be unused, sealed and in original packaging.',
      'Opened consumables, cold-chain products and custom orders cannot be returned.',
      'Refunds reach your account in 5–7 business days.',
    ],
    href: '/refund-policy',
  },
  {
    id: 'cancel',
    icon: XCircle,
    title: 'Cancellations',
    summary: 'Free cancellation before dispatch',
    points: [
      'Cancel any time before your order is dispatched for a full refund.',
      'Once shipped, an order can no longer be cancelled — the return policy applies instead.',
    ],
    href: '/refund-policy',
  },
  {
    id: 'payments',
    icon: ShieldCheck,
    title: 'Secure payments',
    summary: 'UPI, cards and net banking',
    points: [
      'Pay securely with UPI, credit or debit cards, or net banking.',
      'A GST invoice is issued for every order.',
    ],
    href: '/terms',
  },
];

export default function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // Seed from the cached list (tapped from a card) so the page paints instantly.
  const [product, setProduct] = useState<any>(() => (typeof window !== 'undefined' ? peekProduct(id) : null));
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showThumbArrows, setShowThumbArrows] = useState(false);
  const [loading, setLoading] = useState(() => !(typeof window !== 'undefined' && peekProduct(id)));
  const [addingToCart, setAddingToCart] = useState(false);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(() => (typeof window !== 'undefined' ? peekProduct(id)?.variants?.[0]?.id : undefined));
  const [isZooming, setIsZooming] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });

  const handleZoomMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoomOrigin({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const [navHeight, setNavHeight] = useState(112); // fallback desktop height

  useEffect(() => {
    const updateHeight = () => {
      const header = document.querySelector('header');
      if (header) {
        setNavHeight(header.getBoundingClientRect().height);
      }
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    
    const header = document.querySelector('header');
    let observer: ResizeObserver | null = null;
    if (header && window.ResizeObserver) {
      observer = new ResizeObserver(updateHeight);
      observer.observe(header);
    }
    
    return () => {
      window.removeEventListener('resize', updateHeight);
      if (observer) observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const checkOverflow = () => {
      if (scrollRef.current) {
        setShowThumbArrows(scrollRef.current.scrollWidth > scrollRef.current.clientWidth);
      }
    };
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [product]);

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
        const firstVariant = res.data.variants?.[0];
        // Keep a variant the shopper already picked while details were refreshing.
        setSelectedVariantId(prev => (prev && res.data.variants?.some((v: any) => v.id === prev)) ? prev : firstVariant?.id);
        const initialStock = Number(firstVariant ? firstVariant.stock : res.data.stock) || 0;
        if (initialStock <= 0) {
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

  // "You may also like": same category first, then anything else, current product excluded.
  const [similar, setSimilar] = useState<any[]>([]);
  const [similarLoaded, setSimilarLoaded] = useState(false);
  useEffect(() => {
    if (!product) return;
    getProductsCached()
      .then((list) => {
        const all: any[] = (list || []).filter((p: any) => p.id !== id);
        const same = all.filter((p) => product.mainCategoryId && p.mainCategoryId === product.mainCategoryId);
        const rest = all.filter((p) => !same.includes(p));
        setSimilar([...same, ...rest].slice(0, 12));
      })
      .catch(() => {})
      .finally(() => setSimilarLoaded(true));
  }, [product?.id, product?.mainCategoryId, id]);

  const addSimilarToCart = async (p: any) => {
    if (!user) {
      toast('Sign in to add items to your cart');
      router.push('/signin');
      return;
    }
    try {
      await api.post(`/cart/${p.id}`);
      toast.success('Added to cart');
      window.dispatchEvent(new Event('cart-updated'));
    } catch {
      toast.error('Could not add to cart');
    }
  };

  const [openPolicy, setOpenPolicy] = useState<string | null>(null);

  const handleAddToCart = async () => {
    if (!user) {
      toast('Please sign in to add to cart');
      router.push('/signin');
      return;
    }
    const activeVariant = product.variants?.find((v: any) => v.id === selectedVariantId);
    setAddingToCart(true);
    try {
      const cartRes = await api.get('/cart');
      const existingItem = cartRes.data.find((item: any) => item.productId === product.id && (item.variantId || undefined) === (activeVariant?.id || undefined));
      const currentQty = existingItem ? existingItem.quantity : 0;

      const targetQty = currentQty + quantity;
      const stock = Number(activeVariant ? activeVariant.stock : product.stock) || 0;

      if (stock < targetQty) {
        toast.error(`Cannot add to cart. Only ${stock} units available in stock (you already have ${currentQty} in your cart).`);
        setAddingToCart(false);
        return false;
      }

      if (currentQty === 0) {
        await api.post(`/cart/${product.id}`, activeVariant ? { variantId: activeVariant.id } : {});
        if (targetQty > 1) {
          const qs = activeVariant ? `?variantId=${encodeURIComponent(activeVariant.id)}` : '';
          await api.patch(`/cart/${product.id}${qs}`, { quantity: targetQty });
        }
      } else {
        const qs = activeVariant ? `?variantId=${encodeURIComponent(activeVariant.id)}` : '';
        await api.patch(`/cart/${product.id}${qs}`, { quantity: targetQty });
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
    const activeVariant = product.variants?.find((v: any) => v.id === selectedVariantId);

    window.dispatchEvent(new CustomEvent('open-checkout', {
      detail: {
        buyNowItem: {
          productId: product.id,
          quantity: quantity,
          ...(activeVariant ? { variantId: activeVariant.id } : {}),
        }
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex flex-col">
        <Navbar />
        <div className="max-w-[1500px] w-full mx-auto lg:px-8 py-0 lg:py-12 lg:pt-5 animate-pulse mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-10 items-start px-4 lg:px-0">
            {/* Left: Image Skeleton */}
            <div className="lg:col-span-7 w-full flex flex-col gap-4">
              <div className="w-full aspect-square lg:aspect-[4/3] bg-gray-200 rounded-2xl"></div>
              <div className="hidden lg:flex gap-3">
                {[1,2,3,4].map(i => <div key={i} className="w-24 h-24 bg-gray-200 rounded-xl shrink-0"></div>)}
              </div>
            </div>
            {/* Right: Details Skeleton */}
            <div className="lg:col-span-5 flex flex-col gap-6 mt-6 lg:mt-0 w-full">
              <div className="w-20 h-6 bg-gray-200 rounded-md"></div>
              <div className="w-3/4 h-10 bg-gray-200 rounded-lg"></div>
              <div className="w-1/3 h-10 bg-gray-200 rounded-lg mt-2"></div>
              
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="h-16 bg-gray-200 rounded-xl"></div>
                <div className="h-16 bg-gray-200 rounded-xl"></div>
              </div>

              <div className="h-24 bg-gray-200 rounded-2xl mt-4"></div>
              <div className="h-40 bg-gray-200 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-page flex flex-col">
        <Navbar />
        <div className="flex flex-col items-center justify-center flex-1 py-20">
          <ErrorState message={errorMsg} showHomeButton />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-page flex flex-col">
        <Navbar />
        <div className="flex flex-col items-center justify-center flex-1 py-20">
          <ErrorState message="Product not found." showHomeButton />
        </div>
      </div>
    );
  }

  const variants = product.variants as { id: string; label: string; price: number; mrp?: number; stock: number; images?: string[] }[] | undefined;
  const activeVariant = variants?.find(v => v.id === selectedVariantId);

  const baseImages = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : parseImages(product.image);
  // A variant with its own images uses those; otherwise falls back to the
  // product's regular images.
  const images = activeVariant?.images && activeVariant.images.length > 0 ? activeVariant.images : baseImages;
  const price = activeVariant ? Number(activeVariant.price) || 0 : (typeof product.price === 'string' ? parseFloat(product.price.replace(/,/g, '')) : Number(product.price));
  const mrp = activeVariant
    ? (activeVariant.mrp ? Number(activeVariant.mrp) : null)
    : (product.mrp ? (typeof product.mrp === 'string' ? parseFloat(product.mrp.replace(/,/g, '')) : Number(product.mrp)) : null);
  const discountPercentage = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;


  return (
    <main className="bg-white lg:bg-page min-h-screen pb-28 lg:pb-20 animate-fade-in">
      <Navbar hideTabBar />
      
      {/* Sticky Back Button Bar - Merges with Navbar */}
      <div
        className="sticky z-[990] bg-nav-bg border-b border-white/10 px-3.5 md:px-5 py-2 md:py-2.5 shadow-sm -mt-[2px]"
        style={{ top: `${navHeight - 1}px` }}
      >
        <div className="max-w-[1500px] mx-auto lg:px-4 flex items-center">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-1 md:gap-1.5 text-[13px] md:text-sm font-semibold text-white/80 hover:text-white transition-colors cursor-pointer w-fit group border-none bg-transparent outline-none p-0"
          >
            <ChevronLeft className="w-4 h-4 md:w-4 md:h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="tracking-wide">Back</span>
          </button>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto lg:px-8 py-0 lg:py-12 lg:pt-5 animate-fade-in">

        <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-10 items-start">
          
          {/* Left Column: Image Gallery (lg:col-span-7) */}
          <div className="lg:col-span-7 w-full">
            {/* Mobile View: Horizontal Snap Scroll */}
            <div className="lg:hidden relative">
              <div 
                className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar bg-gray-50 border-b border-gray-200"
                onScroll={(e) => {
                  const target = e.target as HTMLDivElement;
                  const newIndex = Math.round(target.scrollLeft / target.clientWidth);
                  setActiveImgIdx(newIndex);
                }}
              >
                {images.map((img: string, idx: number) => (
                  <div key={idx} className="w-full shrink-0 snap-center aspect-square flex items-center justify-center relative">
                    <img src={img} alt={`${product.title} ${idx + 1}`} className="w-full h-full object-contain p-6" />
                  </div>
                ))}
              </div>

              {/* Stationary Discount Badge */}
              {discountPercentage > 0 && (
                <div className="absolute top-4 left-4 z-10 bg-white text-emerald-700 text-[12px] font-semibold px-2 py-1 rounded-md shadow-sm pointer-events-none">
                  {discountPercentage}% off
                </div>
              )}
              
              {/* Stationary Indicators */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
                  {images.map((_: any, dotIdx: number) => (
                    <div key={dotIdx} className={`h-1.5 rounded-full transition-all duration-300 ${activeImgIdx === dotIdx ? 'w-4 bg-gray-800' : 'w-1.5 bg-gray-300'}`} />
                  ))}
                </div>
              )}
            </div>

            {/* Desktop View: Single Main Image + Thumbnails */}
            <div className="hidden lg:flex flex-col gap-4">
              <div
                className="bg-white rounded-3xl border border-line flex items-center justify-center relative aspect-[4/3] overflow-hidden group cursor-zoom-in"
                onMouseEnter={() => setIsZooming(true)}
                onMouseLeave={() => setIsZooming(false)}
                onMouseMove={handleZoomMouseMove}
              >
                {discountPercentage > 0 && (
                  <div className="absolute top-5 left-5 z-10 bg-white text-emerald-700 text-[13px] font-semibold px-2.5 py-1 rounded-md border border-line">
                    {discountPercentage}% off
                  </div>
                )}
                
                {images.length > 1 && (
                  <>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveImgIdx(prev => prev === 0 ? images.length - 1 : prev - 1);
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 shadow-md p-2 rounded-full border border-gray-200 text-gray-700 hover:text-black opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveImgIdx(prev => prev === images.length - 1 ? 0 : prev + 1);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 shadow-md p-2 rounded-full border border-gray-200 text-gray-700 hover:text-black opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>

                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5 pointer-events-none z-10">
                      {images.map((_: any, dotIdx: number) => (
                        <div key={dotIdx} className={`h-1.5 rounded-full transition-all duration-300 ${activeImgIdx === dotIdx ? 'w-4 bg-gray-800' : 'w-2 bg-gray-300'}`} />
                      ))}
                    </div>
                  </>
                )}

                <img
                  src={images[activeImgIdx] || images[0] || 'https://via.placeholder.com/400'}
                  alt={product.title}
                  style={isZooming ? { transform: `scale(2)`, transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%` } : undefined}
                  className="w-full h-full object-contain p-10 transition-transform duration-200 ease-out"
                />
              </div>

              {images.length > 1 && (
                <div className="relative group">
                  {showThumbArrows && (
                    <button 
                      onClick={() => scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 shadow-md p-1.5 rounded-full border border-gray-200 text-gray-700 hover:text-black opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  <div ref={scrollRef} className="flex gap-3 overflow-x-auto py-1 no-scrollbar scroll-smooth">
                    {images.map((img: string, idx: number) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImgIdx(idx)}
                        className={`w-24 h-24 rounded-xl border-2 p-2 bg-white flex items-center justify-center cursor-pointer transition-all shrink-0 ${
                          idx === activeImgIdx 
                            ? 'border-gray-900 shadow-md scale-[1.02]' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img src={img} alt={`${product.title} view ${idx + 1}`} className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                  {showThumbArrows && (
                    <button 
                      onClick={() => scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 shadow-md p-1.5 rounded-full border border-gray-200 text-gray-700 hover:text-black opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Details & Actions (lg:col-span-5) */}
          <div className="lg:col-span-5 flex flex-col gap-8 lg:sticky lg:top-24 px-4 sm:px-6 lg:px-0 py-6 lg:py-0">
            
            {/* Title & Header */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0 pt-1.5">
                  {product.brand && (
                    <Link
                      href={`/?search=${encodeURIComponent(product.brand)}`}
                      className="text-[13px] font-medium text-gold-ink hover:underline underline-offset-2"
                    >
                      {product.brand}
                    </Link>
                  )}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={toggleWishlist}
                    disabled={wishlistLoading}
                    className={`pressable w-10 h-10 grid place-items-center rounded-full border border-line bg-white hover:bg-gray-50 disabled:opacity-50 ${
                      isWishlisted ? 'text-red-500' : 'text-gray-500'
                    }`}
                    aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart className={`w-[18px] h-[18px] transition-transform duration-300 ${isWishlisted ? 'scale-110' : ''}`} fill={isWishlisted ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={shareProduct}
                    className="pressable w-10 h-10 grid place-items-center rounded-full border border-line bg-white hover:bg-gray-50 text-gray-500"
                    aria-label="Share product"
                  >
                    <Share2 className="w-[18px] h-[18px]" />
                  </button>
                </div>
              </div>

              <h1 className="text-[22px] sm:text-[28px] font-semibold text-ink mb-4 leading-snug tracking-tight">
                {product.title}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span className="text-[30px] sm:text-[34px] font-semibold text-ink tracking-tight tabular-nums">
                  ₹{price.toLocaleString('en-IN')}
                </span>
                {mrp && mrp > price && (
                  <>
                    <span className="text-[15px] text-gray-400 line-through tabular-nums">
                      ₹{mrp.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[15px] font-semibold text-emerald-700">
                      {discountPercentage}% off
                    </span>
                  </>
                )}
              </div>
              <div className="text-[12.5px] text-text-muted mt-1">Inclusive of all taxes</div>
            </div>

            {/* Variant Selector */}
            {variants && variants.length > 1 && (
              <div>
                <div className="text-[14px] font-semibold text-ink mb-2.5">
                  Options{activeVariant ? `: ${activeVariant.label}` : ''}
                </div>
                <div className="flex flex-wrap gap-2">
                  {variants.map(v => {
                    const isSelected = v.id === selectedVariantId;
                    const outOfStock = (Number(v.stock) || 0) <= 0;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setSelectedVariantId(v.id);
                          setActiveImgIdx(0);
                          const newStock = Number(v.stock) || 0;
                          setQuantity(newStock <= 0 ? 0 : Math.min(quantity || 1, Math.min(10, newStock)));
                        }}
                        disabled={outOfStock}
                        className={`pressable h-10 px-4 rounded-full text-[14px] font-medium border ${
                          isSelected
                            ? "border-ink bg-ink text-white"
                            : outOfStock
                              ? 'border-gray-200 text-gray-300 cursor-not-allowed line-through'
                              : 'border-gray-200 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Highlights */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: Truck, t: 'Ships in', d: '1–2 days' },
                { icon: RotateCcw, t: '48-hour', d: 'returns' },
                { icon: Receipt, t: 'GST', d: 'invoice' },
                { icon: Award, t: 'ISO 13485', d: 'certified' },
              ].map(({ icon: Icon, t, d }) => (
                <div key={t} className="flex flex-col items-center text-center gap-1.5 py-3 px-1 rounded-xl bg-white border border-line">
                  <Icon className="w-5 h-5 text-gray-700" />
                  <span className="text-[11.5px] leading-tight text-ink font-medium">{t}<br /><span className="text-text-muted font-normal">{d}</span></span>
                </div>
              ))}
            </div>

            {/* Inline Checkout Actions (All Devices) */}
            {(() => {
              const stock = Number(activeVariant ? activeVariant.stock : product.stock) || 0;
              const isOutOfStock = stock <= 0;
              return (
                <div className="flex flex-col gap-5 rounded-2xl border border-line bg-white p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className={`text-[14px] font-semibold flex items-center gap-1.5 ${isOutOfStock ? 'text-red-600' : 'text-emerald-700'}`}>
                        <span className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-red-500' : 'bg-emerald-500'}`} />
                        {isOutOfStock ? 'Out of stock' : 'In stock'}
                      </div>
                      {!isOutOfStock && <div className="text-[12.5px] text-text-muted flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Dispatches in 1–2 business days</div>}
                      {!isOutOfStock && stock <= 5 && (
                        <div className="text-[12.5px] font-medium text-orange-600">Only {stock} left</div>
                      )}
                    </div>

                    {/* Quantity stepper */}
                    <div className="flex items-center h-10 border border-line rounded-full overflow-hidden shrink-0">
                      <button
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        disabled={isOutOfStock || quantity <= 1}
                        aria-label="Decrease quantity"
                        className="pressable w-10 h-full grid place-items-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 border-none bg-transparent"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-[14px] font-semibold text-ink w-7 text-center tabular-nums">{quantity}</span>
                      <button
                        onClick={() => setQuantity(q => Math.min(Math.min(10, stock), q + 1))}
                        disabled={isOutOfStock || quantity >= Math.min(10, stock)}
                        aria-label="Increase quantity"
                        className="pressable w-10 h-full grid place-items-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 border-none bg-transparent"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Desktop actions (mobile uses the sticky bar below) */}
                  <div className="hidden lg:flex gap-3">
                    <button
                      onClick={handleAddToCart}
                      disabled={isOutOfStock || addingToCart}
                      className={`pressable flex-1 h-12 text-[15px] font-semibold rounded-full flex items-center justify-center gap-2 ${
                        isOutOfStock
                          ? 'bg-gray-100 text-gray-400 border border-line cursor-not-allowed'
                          : 'bg-white text-ink border border-ink hover:bg-gray-50 disabled:opacity-50'
                      }`}
                    >
                      {addingToCart ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
                      <span>{isOutOfStock ? 'Out of stock' : 'Add to cart'}</span>
                    </button>
                    {!isOutOfStock && (
                      <button
                        onClick={handleBuyNow}
                        disabled={addingToCart}
                        className="pressable flex-1 h-12 text-[15px] font-semibold rounded-full bg-gold-primary hover:bg-gold-hover text-ink border-none disabled:opacity-50"
                      >
                        Buy now
                      </button>
                    )}
                  </div>

                  {/* Mobile sticky action bar */}
                  <div className="lg:hidden fixed inset-x-0 bottom-0 z-[998] bg-white/95 backdrop-blur-xl border-t border-line px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom-full duration-500">
                    <div className="flex items-center gap-2.5 max-w-[640px] mx-auto">
                      <button
                        onClick={handleAddToCart}
                        disabled={isOutOfStock || addingToCart}
                        className={`pressable flex-1 h-12 text-[15px] font-semibold rounded-full flex items-center justify-center gap-2 ${
                          isOutOfStock
                            ? 'bg-gray-100 text-gray-400 border border-line'
                            : 'bg-white text-ink border border-ink disabled:opacity-50'
                        }`}
                      >
                        {addingToCart ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
                        {isOutOfStock ? 'Out of stock' : 'Add to cart'}
                      </button>
                      {!isOutOfStock && (
                        <button
                          onClick={handleBuyNow}
                          disabled={addingToCart}
                          className="pressable flex-1 h-12 text-[15px] font-semibold rounded-full bg-gold-primary text-ink border-none disabled:opacity-50"
                        >
                          Buy now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Delivery Estimate */}
            <DeliveryEstimate weightKg={Number(product.weight) || 0.5} />

            {/* Description & Specs */}
            <div className="flex flex-col gap-6">
              
              {/* Product Specifications */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-line">
                <h2 className="text-[16px] font-semibold text-ink mb-4">Specifications</h2>
                <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[140px_1fr] gap-y-3 text-sm">
                  <div className="text-text-muted">Brand</div>
                  <div className="text-ink">{product.brand || "—"}</div>
                  
                  <div className="text-text-muted">Availability</div>
                  <div className="text-emerald-700 font-semibold">{(activeVariant ? activeVariant.stock : product.stock) > 0 ? 'In Stock' : 'Out of Stock'}</div>

                  {product.attributes && product.attributes.map((attr: any, idx: number) => (
                    <React.Fragment key={idx}>
                      <div className="text-text-muted capitalize">{attr.key}</div>
                      <div className="text-ink">{attr.value}</div>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* About this item */}
              <div className="bg-white lg:bg-transparent rounded-2xl lg:p-0">
                <h2 className="text-[16px] font-semibold text-ink mb-3">About this item</h2>
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {product.description ? (
                    <ul className="list-disc pl-5 space-y-2.5 marker:text-gray-300">
                      {product.description.split('\n').map((line: string, i: number) => {
                        const trimmed = line.trim();
                        if (!trimmed) return null;
                        return <li key={i} className="pl-1">{trimmed.replace(/^- /, '')}</li>;
                      })}
                    </ul>
                  ) : (
                    <p className="italic text-gray-400">No detailed description provided.</p>
                  )}
                </div>
              </div>

              {/* How to Use */}
              {(product.howToUsePdf || (Array.isArray(product.resourceLinks) && product.resourceLinks.length > 0)) && (
                <div className="bg-white rounded-2xl p-5 border border-line">
                  <h2 className="text-[16px] font-semibold text-ink mb-3">How to Use</h2>
                  <div className="flex flex-col gap-2">
                    {product.howToUsePdf && (
                      <a
                        href={product.howToUsePdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-gold-primary hover:text-gold-ink transition-colors"
                      >
                        <FileText className="w-4 h-4 text-gold-ink shrink-0" />
                        <span className="flex-1">Download Usage Guide (PDF)</span>
                        <ExternalLink className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      </a>
                    )}
                    {Array.isArray(product.resourceLinks) && product.resourceLinks.map((link: any, idx: number) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-gold-primary hover:text-gold-ink transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-gold-ink shrink-0" />
                        <span className="flex-1 truncate">{link.label || 'Link'}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Vendor Information */}
              <div className="bg-white p-5 rounded-2xl border border-line">
                <div className="flex items-start gap-3">
                  <BadgeCheck className="w-5 h-5 text-gold-primary mt-0.5 shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900 mb-1">
                      {product.is_sold_by_vendor ? 'Verified Independent Vendor' : 'Medox Certified Origin'}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {product.is_sold_by_vendor 
                        ? 'Sold by a vetted third-party vendor. Protected by MedoxAtoZ guarantee.'
                        : 'Shipped from a certified medical warehousing facility with climate control.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Policies */}
              <div>
                <h2 className="text-[16px] font-semibold text-ink mb-3">Shipping &amp; returns</h2>
                <div className="bg-white rounded-2xl border border-line divide-y divide-line overflow-hidden">
                  {POLICIES.map((pol) => {
                    const open = openPolicy === pol.id;
                    const Icon = pol.icon;
                    return (
                      <div key={pol.id}>
                        <button
                          type="button"
                          onClick={() => setOpenPolicy(open ? null : pol.id)}
                          aria-expanded={open}
                          className="w-full flex items-center gap-3 px-4 py-3.5 text-left border-none bg-transparent hover:bg-gray-50 active:bg-gray-100 transition-colors"
                        >
                          <Icon className="w-[18px] h-[18px] text-gray-500 shrink-0" />
                          <span className="flex-1 min-w-0">
                            <span className="block text-[14.5px] font-medium text-ink">{pol.title}</span>
                            <span className="block text-[12.5px] text-text-muted truncate">{pol.summary}</span>
                          </span>
                          <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-300 ease-[var(--ease-out-expo)] ${open ? 'rotate-180' : ''}`} />
                        </button>
                        <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[var(--ease-out-expo)] ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                          <div className="overflow-hidden">
                            <div className="px-4 pb-4 pl-[46px]">
                              <ul className="space-y-1.5 text-[13.5px] text-gray-600 leading-relaxed list-disc pl-4 marker:text-gray-300">
                                {pol.points.map((pt) => <li key={pt}>{pt}</li>)}
                              </ul>
                              {pol.href && (
                                <Link href={pol.href} className="inline-flex items-center gap-1 mt-3 text-[13px] font-medium text-ink underline underline-offset-2 decoration-gray-300 hover:decoration-ink">
                                  Read full policy <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Similar products */}
        {!similarLoaded && (
          <section className="mt-10 lg:mt-16 pb-4">
            <ProductRailSkeleton count={6} padClass="px-4 sm:px-6 lg:px-0" />
          </section>
        )}
        {similarLoaded && similar.length > 0 && (
          <section className="mt-10 lg:mt-16 pb-4">
            <div className="flex items-end justify-between gap-4 mb-3 px-4 sm:px-6 lg:px-0">
              <h2 className="text-[18px] md:text-[20px] font-semibold text-ink tracking-tight">You may also like</h2>
              {product.mainCategoryId && (
                <Link
                  href={`/categories/${encodeURIComponent(product.mainCategoryId)}`}
                  className="pressable shrink-0 flex items-center gap-0.5 h-8 pl-3 pr-2 rounded-full text-[13px] font-semibold text-ink bg-white border border-line hover:bg-gray-50"
                >
                  See all <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
            <div className={`${RAIL_TRACK_CLASS} overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-px-4 px-4 sm:px-6 lg:px-0 pb-1`}>
              {similar.map((p) => (
                <div key={p.id} className={RAIL_ITEM_CLASS}>
                  <ProductCard product={p} onAddToCart={addSimilarToCart} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

    </main>
  );
}
