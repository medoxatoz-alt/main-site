'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import api from '@/lib/api';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import { ProductGridSkeleton } from '@/components/Skeleton';

function HomeContent() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search')?.toLowerCase() || '';
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const { user } = useAuth();
  const router = useRouter();

  // Reset visible count when search query changes
  useEffect(() => {
    setVisibleCount(20);
  }, [searchQuery]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const endpoint = searchQuery ? `/products?search=${encodeURIComponent(searchQuery)}` : '/products';
        const res = await api.get(endpoint);
        setProducts(res.data);
      } catch (err) {
        console.error('Failed to fetch products', err);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [searchQuery]);

  // Infinite Scroll: Load more items when reaching near end of page
  useEffect(() => {
    if (loading || visibleCount >= products.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 20, products.length));
        }
      },
      { rootMargin: '400px' }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [loading, visibleCount, products.length]);

  // Fallback scroll listener for seamless mobile webview compatibility
  useEffect(() => {
    const handleScroll = () => {
      if (loading) return;
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        setVisibleCount((prev) => {
          if (prev < products.length) {
            return Math.min(prev + 20, products.length);
          }
          return prev;
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, products.length]);

  const handleAddToCart = async (product: any) => {
    if (!user) {
      toast('Please sign in to add to cart');
      router.push('/signin');
      return;
    }
    try {
      await api.post(`/cart/${product.id}`);
      toast.success('Added to Cart!');
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) {
      toast.error('Failed to add to cart');
    }
  };

  const displayedProducts = products.slice(0, visibleCount);
  const hasMore = visibleCount < products.length;

  return (
    <main className="min-h-screen bg-[var(--bg-page)] pb-20">
      <Navbar />

      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-[#1e2226] to-nav-bg pt-10 -mt-2 pb-[150px] md:pb-[180px] flex justify-center relative mb-[-120px]">
        <div className="w-full max-w-[1500px] px-5 text-white z-[2]">
          <h1 className="text-4xl md:text-[2.8rem] mb-2.5 font-light leading-tight">
            Equipping India's <span className="text-gold-primary font-bold">Clinics</span>
          </h1>
          <p className="text-gray-300 text-base md:text-lg">Premium Medical Supplies Delivered Fast.</p>
        </div>
        <div className="absolute bottom-0 w-full h-[150px] bg-gradient-to-b from-transparent to-[var(--bg-page)] z-[1]"></div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1500px] mx-auto p-3 sm:p-5 relative z-[5]">
        {loading ? (
          <ProductGridSkeleton count={10} />
        ) : fetchError ? (
          <ErrorState message="Failed to load products. Please try again later." />
        ) : products.length === 0 ? (
          <div className="my-10">
            <EmptyState message="No products found matching your search." />
          </div>
        ) : (
          <>
            {/* Seamless Infinite Product Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6 mb-8">
              {displayedProducts.map((p) => (
                <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} />
              ))}
            </div>

            {/* End of list Sentinel for Infinite Scroll */}
            {hasMore ? (
              <div
                ref={sentinelRef}
                className="col-span-full flex flex-col items-center justify-center py-8 gap-2"
              >
                <div className="w-6 h-6 border-2 border-gold-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold text-gray-500">Loading more products...</span>
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => Math.min(prev + 20, products.length))}
                  className="mt-2 text-xs font-bold text-gold-hover hover:underline cursor-pointer bg-transparent border-none"
                >
                  Click to load more ({products.length - visibleCount} remaining)
                </button>
              </div>
            ) : (
              <div className="col-span-full text-center py-10 border-t border-gray-100 mt-6">
                <p className="text-xs sm:text-sm font-bold text-gray-400">
                  You've viewed all {products.length} products ✓
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
