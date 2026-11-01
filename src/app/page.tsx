'use client';

import { useEffect, useState, useRef, useMemo, Suspense } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Receipt,
  Truck,
  Lock,
  Headphones,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';

import api, { getCategoriesCached } from '@/lib/api';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import { ProductGridSkeleton, ProductRailSkeleton, RAIL_ITEM_CLASS, RAIL_TRACK_CLASS } from '@/components/Skeleton';

const ROW_LIMIT = 20;


const num = (v: any) => (typeof v === 'string' ? parseFloat(v.replace(/,/g, '')) : Number(v)) || 0;
const discountOf = (p: any) => {
  const price = num(p.price);
  const mrp = num(p.mrp);
  return mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
};
const inStock = (p: any) => (p.stock === undefined ? true : Number(p.stock) > 0);

/* ---------------------------------------------------------------- */
/* Section header                                                    */
/* ---------------------------------------------------------------- */

function SectionHead({ title, subtitle, href, linkLabel = 'See all' }: { title: string; subtitle?: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-3 md:mb-4 px-4 md:px-0">
      <div className="min-w-0">
        <h2 className="text-[17px] md:text-[20px] font-semibold text-ink tracking-tight truncate">{title}</h2>
        {subtitle && <p className="text-[12.5px] md:text-[13px] text-text-muted mt-0.5 truncate">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="pressable shrink-0 flex items-center gap-0.5 h-8 pl-3 pr-2 rounded-full text-[13px] font-semibold text-ink bg-white border border-line hover:bg-gray-50">
          {linkLabel} <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Horizontal product rail                                           */
/* ---------------------------------------------------------------- */

function Rail({
  title,
  subtitle,
  href,
  products,
  onAddToCart,
  id,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  products: any[];
  onAddToCart: (p: any) => void;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = () => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [products.length]);

  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: 'smooth' });

  const arrow =
    'pressable hidden md:grid absolute top-[38%] -translate-y-1/2 z-10 w-10 h-10 place-items-center rounded-full bg-white border border-line shadow-[0_4px_14px_rgba(16,24,40,0.12)] text-ink transition-opacity duration-200';

  return (
    <section id={id} className="scroll-mt-32">
      <SectionHead title={title} subtitle={subtitle} href={href} />
      <div className="relative group/rail">
        <div
          ref={ref}
          onScroll={update}
          className={`${RAIL_TRACK_CLASS} overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-px-4 md:scroll-px-0 px-4 md:px-0 pb-1`}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {products.map((p) => (
            <div key={p.id} className={RAIL_ITEM_CLASS}>
              <ProductCard product={p} onAddToCart={onAddToCart} />
            </div>
          ))}
        </div>
        <button aria-label="Scroll left" onClick={() => scroll(-1)} className={`${arrow} -left-4 ${canLeft ? 'opacity-0 group-hover/rail:opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button aria-label="Scroll right" onClick={() => scroll(1)} className={`${arrow} -right-4 ${canRight ? 'opacity-0 group-hover/rail:opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
}

function RailSkeleton() {
  return (
    <ProductRailSkeleton />
  );
}

/* ---------------------------------------------------------------- */
/* Page                                                              */
/* ---------------------------------------------------------------- */

function HomeContent() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const searchParams = useSearchParams();
  const rawSearch = searchParams.get('search') || '';
  const searchQuery = rawSearch.toLowerCase();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setVisibleCount(20);
  }, [searchQuery]);

  useEffect(() => {
    getCategoriesCached()
      .then((d: any) => setCategories(d?.mainCategories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setFetchError(false);
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

  // Infinite scroll — search results only.
  useEffect(() => {
    if (!searchQuery || loading || visibleCount >= products.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setVisibleCount((prev) => Math.min(prev + 20, products.length));
      },
      { rootMargin: '400px' }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [searchQuery, loading, visibleCount, products.length]);

  const handleAddToCart = async (product: any) => {
    if (!user) {
      toast('Sign in to add items to your cart');
      router.push('/signin');
      return;
    }
    try {
      await api.post(`/cart/${product.id}`);
      toast.success('Added to cart');
      window.dispatchEvent(new Event('cart-updated'));
    } catch {
      toast.error('Could not add to cart');
    }
  };

  // ---- Home sections -------------------------------------------------
  const deals = useMemo(
    () => products.filter((p) => discountOf(p) > 0 && inStock(p)).sort((a, b) => discountOf(b) - discountOf(a)).slice(0, ROW_LIMIT),
    [products]
  );

  const newArrivals = useMemo(
    () =>
      [...products]
        .filter((p) => p.createdAt)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, ROW_LIMIT),
    [products]
  );

  const budget = useMemo(
    () => products.filter((p) => num(p.price) > 0 && num(p.price) <= 500 && inStock(p)).sort((a, b) => num(a.price) - num(b.price)).slice(0, ROW_LIMIT),
    [products]
  );

  // Every category that has at least one product, in the store's own order.
  const categoryRows = useMemo(
    () =>
      categories
        .map((c) => {
          const all = products.filter((p) => p.mainCategoryId === c.id);
          return { ...c, total: all.length, items: all.slice(0, ROW_LIMIT) };
        })
        .filter((c) => c.total > 0),
    [categories, products]
  );

  const displayedProducts = products.slice(0, visibleCount);
  const hasMore = visibleCount < products.length;
  const isSearch = !!searchQuery;

  return (
    <main className="min-h-screen bg-page">
      <Navbar />

      <div className="max-w-[1500px] mx-auto md:px-6">
        {isSearch ? (
          /* ---------------- Search results ---------------- */
          <div className="px-2.5 sm:px-4 md:px-0 pt-5 md:pt-8">
            <div className="px-1.5 sm:px-0 mb-4 animate-in fade-in duration-300">
              <h1 className="text-[18px] md:text-[22px] font-semibold text-ink">Results for “{rawSearch}”</h1>
              {!loading && !fetchError && (
                <p className="text-[13px] text-text-muted mt-0.5">{products.length} {products.length === 1 ? 'product' : 'products'}</p>
              )}
            </div>
            {loading ? (
              <ProductGridSkeleton count={10} />
            ) : fetchError ? (
              <ErrorState message="Failed to load products. Please try again later." showHomeButton />
            ) : products.length === 0 ? (
              <div className="my-10"><EmptyState message="No products match your search." showHomeButton /></div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-2.5 sm:gap-4">
                  {displayedProducts.map((p) => (
                    <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} />
                  ))}
                </div>
                {hasMore && (
                  <div ref={sentinelRef} className="flex justify-center py-8">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-ink rounded-full animate-spin" />
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* ---------------- Home ---------------- */
          <div className="flex flex-col gap-9 md:gap-12 pt-4 md:pt-6 pb-6">
            {/* 1. Promo banner */}
            <div className="px-4 md:px-0">
              <section className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-[#14181d] text-white animate-in fade-in zoom-in-[0.98] duration-500">
                <div className="absolute -right-16 -top-24 w-72 h-72 md:w-[420px] md:h-[420px] rounded-full bg-gold-primary/15 blur-3xl" aria-hidden />
                <div className="absolute right-8 bottom-0 w-40 h-40 rounded-full bg-gold-primary/10 blur-2xl" aria-hidden />
                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5 p-5 md:p-10">
                  <div className="max-w-xl">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gold-primary">Wholesale for clinics</span>
                    <h1 className="mt-2 text-[22px] leading-[1.2] md:text-[36px] font-semibold tracking-tight">
                      Welcome to <span className="text-gold-primary">MedoxAtoZ</span>
                    </h1>
                    <p className="mt-2 text-[13.5px] md:text-[15px] text-white/60">Genuine medical supplies and clinic essentials at wholesale prices, delivered across India.</p>
                    <a
                      href={deals.length ? '#deals' : '#rows'}
                      className="pressable mt-5 inline-flex items-center gap-1.5 h-10 md:h-11 px-5 rounded-full bg-gold-primary text-ink text-[14px] font-semibold hover:bg-gold-hover"
                    >
                      Shop deals <ChevronRight className="w-4 h-4" />
                    </a>
                  </div>
                  <ul className="flex flex-wrap md:flex-col md:flex-nowrap gap-1.5 md:gap-3">
                    {[
                      { icon: ShieldCheck, t: '100% genuine' },
                      { icon: Receipt, t: 'GST invoices' },
                      { icon: Truck, t: 'Doorstep delivery' },
                    ].map(({ icon: Icon, t }) => (
                      <li key={t} className="shrink-0 flex items-center gap-1.5 md:gap-2 h-8 md:h-11 px-2.5 md:px-4 rounded-full md:rounded-xl bg-white/[0.06] border border-white/[0.08] text-[11.5px] md:text-[14px] text-white/80">
                        <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-gold-primary" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            </div>

            {loading ? (
              <>
                <RailSkeleton />
                <RailSkeleton />
              </>
            ) : fetchError ? (
              <ErrorState message="Failed to load products. Please try again later." />
            ) : products.length === 0 ? (
              <div className="my-10"><EmptyState message="No products available yet." /></div>
            ) : (
              <>
                {/* 3. Deals */}
                {deals.length >= 2 && (
                  <Rail id="deals" title="Top deals" subtitle="Biggest savings right now" products={deals} onAddToCart={handleAddToCart} />
                )}

                {/* 4. New arrivals */}
                {newArrivals.length >= 2 && (
                  <Rail title="New arrivals" subtitle="Recently added to the store" products={newArrivals} onAddToCart={handleAddToCart} />
                )}

                {/* 5. One row per category */}
                {categoryRows.map((c, i) => (
                  <div key={c.id} className="contents">
                    <Rail
                      title={c.name}
                      subtitle={`${c.total} ${c.total === 1 ? 'product' : 'products'}`}
                      href={`/categories/${encodeURIComponent(c.id)}`}
                      products={c.items}
                      onAddToCart={handleAddToCart}
                    />
                    {/* Break up long stretches of rows with a budget row */}
                    {i === 1 && budget.length >= 2 && (
                      <Rail title="Under ₹500" subtitle="Everyday essentials, lowest price first" products={budget} onAddToCart={handleAddToCart} />
                    )}
                  </div>
                ))}
                {categoryRows.length < 2 && budget.length >= 2 && (
                  <Rail title="Under ₹500" subtitle="Everyday essentials, lowest price first" products={budget} onAddToCart={handleAddToCart} />
                )}

                {/* 7. Why buy from us */}
                <section className="px-4 md:px-0">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                    {[
                      { icon: ShieldCheck, t: 'Genuine products', d: 'Sourced from authorised suppliers' },
                      { icon: Receipt, t: 'GST invoices', d: 'Claim input tax credit' },
                      { icon: Lock, t: 'Secure payments', d: 'UPI, cards and net banking' },
                      { icon: Headphones, t: 'Help when you need it', d: 'Guides and support in-app' },
                    ].map(({ icon: Icon, t, d }) => (
                      <div key={t} className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 p-3.5 sm:p-4 rounded-2xl bg-white border border-line">
                        <span className="w-10 h-10 shrink-0 rounded-xl bg-gold-light text-gold-ink grid place-items-center">
                          <Icon className="w-5 h-5" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-[13.5px] font-semibold text-ink">{t}</div>
                          <div className="text-[12px] text-text-muted leading-snug">{d}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-page" />}>
      <HomeContent />
    </Suspense>
  );
}
