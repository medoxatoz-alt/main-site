'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2, ChevronLeft, Heart, Trash2 } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import Pagination from '@/components/Pagination';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import { ProductGridSkeleton } from '@/components/Skeleton';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const router = useRouter();

  const [navHeight, setNavHeight] = useState(112);

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
    if (!authLoading && !user) router.push('/signin');
  }, [user, authLoading, router]);

  const fetchWishlist = async () => {
    if (!user) return;
    setFetchError(false);
    try {
      const res = await api.get('/user/wishlist');
      const ids: string[] = res.data.wishlistIds || [];
      setWishlistIds(ids);

      if (ids.length > 0) {
        const productRes = await api.post('/products/bulk', { ids });
        // Preserve wishlist order
        const productMap = new Map(productRes.data.map((p: any) => [p.id, p]));
        setProducts(ids.map(id => productMap.get(id)).filter(Boolean) as any[]);
      } else {
        setProducts([]);
      }
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWishlist(); }, [user]);

  const handleRemove = async (productId: string) => {
    setRemovingId(productId);
    try {
      await api.delete(`/user/wishlist/${productId}`);
      toast.success('Removed from wishlist');
      setWishlistIds(prev => prev.filter(id => id !== productId));
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch {
      toast.error('Failed to remove from wishlist');
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToCart = async (product: any) => {
    try {
      await api.post(`/cart/${product.id}`);
      toast.success('Added to cart');
      window.dispatchEvent(new Event('cart-updated'));
    } catch {
      toast.error('Could not add to cart');
    }
  };

  const header = (
    <div className="flex items-end justify-between gap-3 mb-5 sm:mb-7">
      <div>
        <h1 className="text-[22px] md:text-[28px] font-semibold tracking-tight text-ink">Wishlist</h1>
        <p className="text-[13px] text-text-muted mt-0.5">Items you&apos;ve saved for later</p>
      </div>
      {!loading && (
        <span className="text-[12.5px] font-medium text-text-muted bg-white border border-line rounded-full px-3 h-8 inline-flex items-center tabular-nums">
          {wishlistIds.length} / 10 saved
        </span>
      )}
    </div>
  );

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-page">
        <Navbar />
        <div className="max-w-[1500px] mx-auto px-2.5 sm:px-4 md:px-6 py-6 sm:py-10">
          <div className="px-1.5 sm:px-0">{header}</div>
          <ProductGridSkeleton count={5} />
        </div>
      </main>
    );
  }
  if (!user) return null;

  return (
    <main className="bg-page min-h-screen pb-20">
      <Navbar />

      <div className="max-w-[1500px] mx-auto px-2.5 sm:px-4 md:px-6 py-6 sm:py-10">
        <div className="px-1.5 sm:px-0">{header}</div>

        {fetchError ? (
          <ErrorState message="Failed to load wishlist. Please try again." showHomeButton />
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center text-center py-16 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-white border border-line grid place-items-center mb-4">
              <Heart className="w-7 h-7 text-gray-300" />
            </div>
            <h2 className="text-[17px] font-semibold text-ink">No saved items yet</h2>
            <p className="text-[14px] text-text-muted mt-1 max-w-xs">Tap the heart on any product to save it here.</p>
            <Link href="/" className="pressable mt-6 h-11 px-6 inline-flex items-center rounded-full bg-ink text-white text-[14px] font-semibold hover:bg-black">
              Browse products
            </Link>
          </div>
        ) : (
          <Pagination items={products} pageSize={12} showPageInfo renderPage={(slice) => (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-2.5 sm:gap-4">
              {slice.map(product => (
                <div key={product.id} className="relative grid">
                  <ProductCard product={product} onAddToCart={handleAddToCart} />
                  <button
                    onClick={() => handleRemove(product.id)}
                    disabled={removingId === product.id}
                    className="pressable absolute top-3.5 right-3.5 z-30 w-8 h-8 grid place-items-center bg-white rounded-full shadow-sm border border-line text-gray-500 hover:text-red-600 disabled:opacity-50"
                    aria-label="Remove from wishlist"
                  >
                    {removingId === product.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          )} />
        )}
      </div>
    </main>
  );
}