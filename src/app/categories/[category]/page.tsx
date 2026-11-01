'use client';

import { useEffect, useState, use, useMemo, useRef } from 'react';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import api, { getCategoriesCached } from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import { ProductGridSkeleton } from '@/components/Skeleton';
import { ChevronRight, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import React from 'react';



export default function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: categoryParam } = use(params);
  const categoryStr = decodeURIComponent(categoryParam).toLowerCase();
  const searchParams = useSearchParams();
  const subCategoryQuery = searchParams.get('subCategory');
  
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const [sortBy, setSortBy] = useState<'relevance' | 'price-asc' | 'price-desc' | 'discount' | 'newest'>('relevance');
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  
  const [categoriesConfig, setCategoriesConfig] = useState<{mainCategories: {id: string, name: string}[], subcategories: Record<string, {id: string, name: string}[]>}>({ mainCategories: [], subcategories: {} });

  const [filters, setFilters] = useState<{
    subcategories: string[];
    brands: string[];
    priceRange: [number, number];
    attributes: Record<string, string[]>;
  }>({
    subcategories: subCategoryQuery ? [subCategoryQuery] : [],
    brands: [],
    priceRange: [0, Number.MAX_SAFE_INTEGER],
    attributes: {}
  });
  
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchProductsAndCategories = async () => {
      try {
        const [prodRes, catData] = await Promise.all([
          api.get('/products'),
          getCategoriesCached()
        ]);
        setAllProducts(prodRes.data || []);
        setCategoriesConfig(catData);
      } catch (err) {
        console.error('Failed to fetch data', err);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProductsAndCategories();
  }, []);

  // Ensure subCategory from URL is synced on first load if it changes
  useEffect(() => {
    if (subCategoryQuery && !filters.subcategories.includes(subCategoryQuery)) {
      setFilters(prev => ({ ...prev, subcategories: [...prev.subcategories, subCategoryQuery] }));
    }
  }, [subCategoryQuery]);

  const baseProducts = useMemo(() => {
    return allProducts.filter(p => {
      if (p.mainCategoryId) {
        return p.mainCategoryId === categoryStr;
      }
      // Backwards compat
      const mainCatStr = (p.mainCategory || p.category || '').toLowerCase().replace(/ & /g, '-').replace(/ /g, '-');
      return mainCatStr === categoryStr;
    });
  }, [allProducts, categoryStr]);

  const { availableSubcats, availableBrands, counts, maxPrice, availableAttributes } = useMemo(() => {
    const subs = new Set<string>();
    const brands = new Set<string>();
    const attrs: Record<string, Set<string>> = {};
    const c = { 
      subcategories: {} as Record<string, number>, 
      brands: {} as Record<string, number>,
      attributes: {} as Record<string, Record<string, number>>
    };
    let mPrice = 0;

    baseProducts.forEach(p => {
      if (p.price > mPrice) mPrice = p.price;
      
      const subId = p.subCategoryId || p.subCategory;
      if (subId) {
        subs.add(subId);
        c.subcategories[subId] = (c.subcategories[subId] || 0) + 1;
      }
      if (p.brand) {
        brands.add(p.brand);
        c.brands[p.brand] = (c.brands[p.brand] || 0) + 1;
      }

      if (p.attributes && Array.isArray(p.attributes)) {
        p.attributes.forEach((attr: any) => {
          if (attr.key && attr.value) {
            if (!attrs[attr.key]) {
              attrs[attr.key] = new Set();
              c.attributes[attr.key] = {};
            }
            attrs[attr.key].add(attr.value);
            c.attributes[attr.key][attr.value] = (c.attributes[attr.key][attr.value] || 0) + 1;
          }
        });
      }
    });

    // Map subcategory IDs to {id, name}
    const mappedSubcats = Array.from(subs).map(subId => {
      // Find name from config
      const found = categoriesConfig.subcategories[categoryStr]?.find(s => s.id === subId);
      return {
        id: subId,
        name: found ? found.name : subId // Fallback to ID/name if not found
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    const formattedAttrs: Record<string, string[]> = {};
    Object.keys(attrs).forEach(key => {
      formattedAttrs[key] = Array.from(attrs[key]).sort();
    });

    return {
      availableSubcats: mappedSubcats,
      availableBrands: Array.from(brands).sort(),
      availableAttributes: formattedAttrs,
      counts: c,
      maxPrice: mPrice || 50000
    };
  }, [baseProducts, categoriesConfig, categoryStr]);

  // Adjust price filter max if it was Infinity
  useEffect(() => {
    if (filters.priceRange[1] === Number.MAX_SAFE_INTEGER && maxPrice > 0) {
      setFilters(prev => ({ ...prev, priceRange: [0, maxPrice] }));
    }
  }, [maxPrice]);

  const filteredProducts = useMemo(() => {
    return baseProducts.filter(p => {
      const subId = p.subCategoryId || p.subCategory;
      if (filters.subcategories.length > 0 && (!subId || !filters.subcategories.includes(subId))) return false;
      if (filters.brands.length > 0 && (!p.brand || !filters.brands.includes(p.brand))) return false;
      if (p.price > filters.priceRange[1]) return false;
      
      if (filters.attributes && Object.keys(filters.attributes).length > 0) {
        for (const key of Object.keys(filters.attributes)) {
          if (filters.attributes[key] && filters.attributes[key].length > 0) {
            const prodAttr = (p.attributes || []).find((a: any) => a.key === key);
            if (!prodAttr || !filters.attributes[key].includes(prodAttr.value)) return false;
          }
        }
      }
      
      return true;
    });
  }, [baseProducts, filters]);

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

  // Reset visible count when category or filters change
  useEffect(() => {
    setVisibleCount(20);
  }, [categoryStr, subCategoryQuery, filters]);

  // Infinite Scroll: Load more items when reaching near end of page
  useEffect(() => {
    if (loading || visibleCount >= filteredProducts.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 20, filteredProducts.length));
        }
      },
      { rootMargin: '400px' }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [loading, visibleCount, filteredProducts.length]);

  // Fallback scroll listener for mobile webview
  useEffect(() => {
    const handleScroll = () => {
      if (loading) return;
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        setVisibleCount((prev) => {
          if (prev < filteredProducts.length) {
            return Math.min(prev + 20, filteredProducts.length);
          }
          return prev;
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, filteredProducts.length]);

  const mainCat = categoriesConfig.mainCategories.find(c =>
    c.id === categoryStr || c.id === categoryStr.replace(/\s+/g, '-') || c.name.toLowerCase() === categoryStr
  );
  const resolvedCatName = mainCat ? mainCat.name : categoryStr.replace(/-/g, ' ');
  const activeSub = filters.subcategories.length === 1 ? filters.subcategories[0] : null;
  const activeSubName = availableSubcats.find(s => s.id === activeSub)?.name;

  const priceOf = (p: any) => (typeof p.price === 'string' ? parseFloat(p.price.replace(/,/g, '')) : Number(p.price)) || 0;
  const mrpOf = (p: any) => (typeof p.mrp === 'string' ? parseFloat(p.mrp.replace(/,/g, '')) : Number(p.mrp)) || 0;
  const offOf = (p: any) => (mrpOf(p) > priceOf(p) ? (mrpOf(p) - priceOf(p)) / mrpOf(p) : 0);

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortBy === 'price-asc') list.sort((a, b) => priceOf(a) - priceOf(b));
    else if (sortBy === 'price-desc') list.sort((a, b) => priceOf(b) - priceOf(a));
    else if (sortBy === 'discount') list.sort((a, b) => offOf(b) - offOf(a));
    else if (sortBy === 'newest') list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredProducts, sortBy]);

  const displayedProducts = sortedProducts.slice(0, visibleCount);
  const hasMore = visibleCount < sortedProducts.length;

  const chip = (active: boolean) =>
    `pressable shrink-0 h-9 px-4 rounded-full text-[13px] font-medium border whitespace-nowrap ${
      active ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-line hover:border-gray-300'
    }`;

  return (
    <main className="min-h-screen bg-page pb-20">
      <Navbar />

      <div className="max-w-[1500px] mx-auto">
        {/* Header */}
        <div className="px-4 md:px-6 pt-5 md:pt-8 animate-in fade-in duration-300">
          <nav className="flex items-center gap-1 text-[12.5px] text-text-muted mb-2" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-ink">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className={`capitalize ${activeSubName ? '' : 'text-ink font-medium'}`}>{resolvedCatName}</span>
            {activeSubName && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-ink font-medium">{activeSubName}</span>
              </>
            )}
          </nav>
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-[22px] md:text-[30px] leading-tight font-semibold tracking-tight text-ink capitalize">
                {activeSubName || resolvedCatName}
              </h1>
              {!loading && (
                <p className="text-[13px] text-text-muted mt-0.5">
                  {sortedProducts.length} {sortedProducts.length === 1 ? 'product' : 'products'}
                </p>
              )}
            </div>
            <label className="relative shrink-0">
              <span className="sr-only">Sort products</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="appearance-none h-9 pl-3.5 pr-9 rounded-full bg-white border border-line text-[13px] font-medium text-ink cursor-pointer hover:border-gray-300 focus:outline-none"
              >
                <option value="relevance">Sort: Featured</option>
                <option value="price-asc">Price: Low to high</option>
                <option value="price-desc">Price: High to low</option>
                <option value="discount">Biggest discount</option>
                <option value="newest">Newest first</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </label>
          </div>
        </div>

        {/* Sub-category chips */}
        {availableSubcats.length > 0 && (
          <div className="mt-3">
            <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 md:px-6 py-2.5">
              <button
                type="button"
                onClick={() => setFilters(prev => ({ ...prev, subcategories: [] }))}
                className={chip(filters.subcategories.length === 0)}
              >
                All
              </button>
              {availableSubcats.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, subcategories: activeSub === s.id ? [] : [s.id] }))}
                  className={chip(activeSub === s.id)}
                >
                  {s.name}
                  <span className={`ml-1.5 text-[11.5px] ${activeSub === s.id ? 'text-white/60' : 'text-text-muted'}`}>
                    {counts.subcategories[s.id] || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="px-2.5 sm:px-4 md:px-6 pt-3 md:pt-4">
          {loading ? (
            <ProductGridSkeleton count={10} />
          ) : fetchError ? (
            <ErrorState message="Failed to load products. Please try again later." showHomeButton />
          ) : sortedProducts.length === 0 ? (
            <EmptyState message="No products found here yet." showHomeButton />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-2.5 sm:gap-4">
                {displayedProducts.map(p => (
                  <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} />
                ))}
              </div>

              {hasMore ? (
                <div ref={sentinelRef} className="flex justify-center py-8">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-ink rounded-full animate-spin" />
                </div>
              ) : (
                <p className="text-center text-[13px] text-text-muted py-10">You&apos;ve seen everything in {activeSubName || resolvedCatName}</p>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}