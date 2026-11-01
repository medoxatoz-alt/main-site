'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { getCategoriesCached } from '@/lib/api';
import { usePathname } from 'next/navigation';
import Sheet from '@/components/ui/Sheet';
import {
  LayoutGrid,
  Scissors,
  Microscope,
  HeartPulse,
  Building2,
  Home as HomeIcon,
  Palette,
  Flame,
  Zap,
  SoapDispenserDroplet,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Search,
  MoreHorizontal
} from 'lucide-react';

// Maps category IDs or keywords to custom icons matching the image style
// 3D category artwork in /public/categories/<id>.webp. Categories not listed
// here (e.g. ones added later in admin) fall back to the line icon.
const CATEGORY_IMAGES = new Set([
  'for-you',
  'all',
  'skin-hair-care',
  'dermatology-equipment',
  'makeup-beauty',
  'medical-products',
  'surgical-products',
  'diagnostic-products',
  'health-wellness',
  'home-lifestyle',
  'puja-items',
]);
export const categoryImage = (id: string) =>
  CATEGORY_IMAGES.has(id) ? `/categories/${id}.webp` : undefined;

export const getCategoryIcon = (id: string, name: string) => {
  const lowerId = (id || '').toLowerCase();
  const lowerName = (name || '').toLowerCase();

  if (lowerId === 'for-you' || lowerId === 'all') return LayoutGrid;
  if (lowerId.includes('skin') || lowerName.includes('skin') || lowerName.includes('hair')) return SoapDispenserDroplet;
  if (lowerId.includes('derma') || lowerName.includes('derma')) return Zap;
  if (lowerId.includes('makeup') || lowerName.includes('makeup') || lowerName.includes('beauty')) return Palette;
  if (lowerId.includes('hosp') || lowerName.includes('hosp') || lowerName.includes('dept') || lowerId.includes('medical-products')) return Building2;
  if (lowerId.includes('surg') || lowerName.includes('surg')) return Scissors;
  if (lowerId.includes('diag') || lowerName.includes('diag') || lowerName.includes('test')) return Microscope;
  if (lowerId.includes('health') || lowerName.includes('wellness') || lowerName.includes('pharma')) return HeartPulse;
  if (lowerId.includes('home') || lowerName.includes('lifestyle')) return HomeIcon;
  if (lowerId.includes('puja') || lowerName.includes('heal') || lowerName.includes('spiritual')) return Flame;
  
  return LayoutGrid;
};

export default function MegaMenu() {
  const [categoriesConfig, setCategoriesConfig] = useState<{
    mainCategories: { id: string; name: string }[];
    subcategories: Record<string, { id: string; name: string }[]>;
  }>({ mainCategories: [], subcategories: {} });
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchDrawerQuery, setSearchDrawerQuery] = useState('');
  const [expandedMobileCat, setExpandedMobileCat] = useState<string | null>(null);
  const [hoveredDesktopCat, setHoveredDesktopCat] = useState<string | null>(null);
  const pathname = usePathname();
  const leaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollContainerRef = useRef<HTMLUListElement>(null);
  const activeItemRef = useRef<HTMLLIElement | null>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftScroll(scrollLeft > 6);
      setShowRightScroll(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 6);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [categoriesConfig.mainCategories.length]);

  const scrollByAmount = (offset: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategoriesCached();
        setCategoriesConfig(data);
      } catch (err) {
        console.error('Failed to fetch categories', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const getCatUrl = (mainCat: { id: string }, subCatId?: string) => {
    let url = `/categories/${encodeURIComponent(mainCat.id)}`;
    if (subCatId) {
      url += `?subCategory=${encodeURIComponent(subCatId)}`;
    }
    return url;
  };

  const handleMouseEnterCat = (catId: string) => {
    if (leaveTimeout.current) clearTimeout(leaveTimeout.current);
    setHoveredDesktopCat(catId);
  };

  const handleMouseLeaveMenu = () => {
    leaveTimeout.current = setTimeout(() => {
      setHoveredDesktopCat(null);
    }, 120);
  };

  const handleMouseEnterPanel = () => {
    if (leaveTimeout.current) clearTimeout(leaveTimeout.current);
  };

  const { mainCategories, subcategories } = categoriesConfig;
  const activeDropdown = hoveredDesktopCat ? subcategories[hoveredDesktopCat] || [] : [];
  const isCatActivePage = (catId: string) => {
    if (!pathname) return false;
    const target = `/categories/${encodeURIComponent(catId)}`.toLowerCase();
    const current = pathname.toLowerCase();
    return current === target || current.startsWith(`${target}/`);
  };

  const isForYouActive = pathname === '/' || pathname === '';

  // Close any open desktop hover dropdown when scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (hoveredDesktopCat) setHoveredDesktopCat(null);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hoveredDesktopCat]);

  // Auto-scroll active item into view on mount or route shift
  useEffect(() => {
    if (activeItemRef.current && scrollContainerRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
    checkScroll();
  }, [pathname, categoriesConfig.mainCategories.length]);

  // Close the drawer when navigating.
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const shortName = (name: string) =>
    name
      .replace('All Hosp Dept Wise Products', 'Hospital Supplies')
      .replace('Healing Puja Products', 'Healing & Puja')
      .replace('Makeup & Beauty Products', 'Makeup & Beauty');

  if (loading) {
    return (
      <div className="bg-white border-b border-line">
        <div className="max-w-[1500px] mx-auto px-4 py-3 flex items-center gap-4 overflow-hidden">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 shrink-0 min-w-[64px]">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 animate-pulse" />
              <div className="w-12 h-2.5 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const renderItem = ({
    href,
    onClick,
    icon: Icon,
    image,
    label,
    title,
    active,
    highlighted,
  }: {
    href?: string;
    onClick?: () => void;
    icon: React.ElementType;
    image?: string;
    label: string;
    title?: string;
    active: boolean;
    highlighted?: boolean;
  }) => {
    const on = active || highlighted;
    const inner = (
      <>
        {image ? (
          <span
            className={`w-14 h-14 grid place-items-center transition-transform duration-300 ease-[var(--ease-out-expo)] ${
              active ? 'scale-110' : on ? 'scale-105' : 'group-hover/item:scale-105'
            }`}
          >
            <img src={image} alt="" width={56} height={56} loading="lazy" decoding="async" className="w-full h-full object-contain" />
          </span>
        ) : (
          <span
            className={`w-14 h-14 rounded-full grid place-items-center transition-colors duration-200 ${
              active ? 'bg-gold-light text-gold-ink' : on ? 'bg-gray-200 text-ink' : 'bg-gray-100 text-gray-600 group-hover/item:bg-gray-200 group-hover/item:text-ink'
            }`}
          >
            <Icon className="w-5 h-5 stroke-[1.9]" />
          </span>
        )}
        <span
          title={title}
          className={`mt-1 text-[11.5px] leading-tight whitespace-nowrap truncate max-w-[92px] lg:max-w-full transition-colors ${
            on ? 'text-ink font-semibold' : 'text-gray-500 font-medium group-hover/item:text-ink'
          }`}
        >
          {label}
        </span>
        <span
          className={`absolute -bottom-[11px] left-3 right-3 h-[2px] rounded-full bg-gold-primary origin-center transition-transform duration-300 ease-[var(--ease-out-expo)] ${
            active ? 'scale-x-100' : 'scale-x-0'
          }`}
        />
      </>
    );
    const cls =
      'pressable group/item relative flex flex-col items-center justify-center min-w-[72px] lg:w-full px-2 border-none bg-transparent';
    return href ? (
      <Link href={href} className={cls} aria-current={active ? 'page' : undefined}>{inner}</Link>
    ) : (
      <button type="button" onClick={onClick} className={cls}>{inner}</button>
    );
  };

  const hoveredCat = mainCategories.find((c) => c.id === hoveredDesktopCat);

  return (
    <>
      {/* Category strip */}
      <div
        className="bg-white border-b border-line relative z-30 select-none"
        onMouseLeave={handleMouseLeaveMenu}
      >
        <div className="w-full max-w-[1500px] mx-auto relative px-1 md:px-4">
          {showLeftScroll && (
            <button
              onClick={() => scrollByAmount(-280)}
              aria-label="Scroll left"
              className="hidden md:flex lg:hidden absolute left-0 top-0 bottom-0 z-20 w-10 items-center justify-start pl-1 bg-gradient-to-r from-white via-white to-transparent text-gray-500 hover:text-ink border-none"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          <ul
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex items-stretch gap-1 overflow-x-auto no-scrollbar scroll-smooth snap-x pt-2 pb-2.5 px-2 lg:overflow-visible lg:justify-between lg:px-0"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <li ref={isForYouActive ? activeItemRef : null} className="shrink-0 snap-start lg:flex-1 lg:min-w-0 flex justify-center">
              {renderItem({ href: "/", icon: LayoutGrid, image: categoryImage('for-you'), label: "For you", active: isForYouActive })}
            </li>

            {mainCategories.map((mainCat) => {
              const isCurrentPage = isCatActivePage(mainCat.id);
              const IconComponent = getCategoryIcon(mainCat.id, mainCat.name);
              return (
                <li
                  key={mainCat.id}
                  ref={isCurrentPage ? activeItemRef : null}
                  className="shrink-0 snap-start lg:flex-1 lg:min-w-0 flex justify-center"
                  onMouseEnter={() => handleMouseEnterCat(mainCat.id)}
                >
                  {renderItem({
                    href: getCatUrl(mainCat),
                    icon: IconComponent,
                    image: categoryImage(mainCat.id),
                    label: shortName(mainCat.name),
                    title: mainCat.name,
                    active: isCurrentPage,
                    highlighted: hoveredDesktopCat === mainCat.id,
                  })}
                </li>
              );
            })}

            <li className="shrink-0 snap-start lg:flex-1 lg:min-w-0 flex justify-center" onMouseEnter={() => setHoveredDesktopCat(null)}>
              {renderItem({ onClick: () => setIsMobileMenuOpen(true), icon: MoreHorizontal, image: categoryImage('all'), label: "All", active: false })}
            </li>
          </ul>

          {showRightScroll && (
            <button
              onClick={() => scrollByAmount(280)}
              aria-label="Scroll right"
              className="hidden md:flex lg:hidden absolute right-0 top-0 bottom-0 z-20 w-10 items-center justify-end pr-1 bg-gradient-to-l from-white via-white to-transparent text-gray-500 hover:text-ink border-none"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Desktop mega dropdown */}
        <div
          className={`hidden md:block absolute top-full inset-x-0 z-50 transition-[opacity,transform] duration-200 ease-[var(--ease-out-expo)] ${
            hoveredCat ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-1 pointer-events-none'
          }`}
          onMouseEnter={handleMouseEnterPanel}
          onMouseLeave={handleMouseLeaveMenu}
        >
          {hoveredCat && (
            <div className="bg-white border-b border-line shadow-[0_24px_48px_-12px_rgba(16,24,40,0.18)]">
              <div className="max-w-[1500px] mx-auto px-6 lg:px-8 py-6">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-line">
                  <h3 className="text-ink text-[15px] font-semibold">{hoveredCat.name}</h3>
                  <Link
                    href={getCatUrl(hoveredCat)}
                    className="inline-flex items-center gap-1 text-[13px] font-medium text-gray-600 hover:text-ink transition-colors"
                  >
                    View all <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                {activeDropdown.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-0.5 max-h-[380px] overflow-y-auto custom-scrollbar pr-2">
                    {activeDropdown.map((subCat) => (
                      <Link
                        key={subCat.id}
                        href={getCatUrl(hoveredCat, subCat.id)}
                        className="block truncate text-[14px] text-gray-600 hover:text-ink hover:bg-gray-50 rounded-md px-2 py-2 transition-colors"
                      >
                        {subCat.name}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-[14px] text-text-muted py-2">
                    Browse every product in this category.{' '}
                    <Link href={getCatUrl(hoveredCat)} className="text-ink font-medium underline underline-offset-2">Explore</Link>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* All categories drawer */}
      <Sheet
        open={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        side="left"
        label="All categories"
        zIndex={5000}
        className="w-[86%] max-w-[380px]"
      >
        <div className="pt-safe shrink-0 border-b border-line">
          <div className="h-14 px-4 flex items-center justify-between">
            <h2 className="text-[17px] font-semibold text-ink">Categories</h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="pressable -mr-2 w-10 h-10 grid place-items-center rounded-full text-gray-500 hover:bg-gray-100 border-none bg-transparent"
              aria-label="Close categories"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="px-4 pb-3">
            <div className="flex items-center h-10 bg-gray-100 rounded-xl px-3">
              <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
              <input
                type="text"
                value={searchDrawerQuery}
                onChange={(e) => setSearchDrawerQuery(e.target.value)}
                placeholder="Find a category"
                className="bg-transparent border-none outline-none text-ink text-[15px] w-full placeholder:text-gray-400"
              />
              {searchDrawerQuery && (
                <button onClick={() => setSearchDrawerQuery('')} className="text-gray-400 hover:text-ink border-none bg-transparent" aria-label="Clear">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar py-2 pb-safe">
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 mx-2 px-3 h-12 rounded-xl transition-colors ${
              isForYouActive ? 'bg-gray-100 text-ink font-semibold' : 'text-ink hover:bg-gray-50'
            }`}
          >
            <img src="/categories/for-you.webp" alt="" width={32} height={32} className="w-8 h-8 rounded-lg object-contain shrink-0" />
            <span className="flex-1 text-[15px]">All products</span>
          </Link>

          {mainCategories
            .filter((c) => !searchDrawerQuery || c.name.toLowerCase().includes(searchDrawerQuery.toLowerCase()))
            .map((mainCat) => {
              const subs = subcategories[mainCat.id] || [];
              const isExpanded = expandedMobileCat === mainCat.id;
              const isCurrent = isCatActivePage(mainCat.id);
              const Icon = getCategoryIcon(mainCat.id, mainCat.name);

              const row = `flex items-center gap-3 w-[calc(100%-16px)] mx-2 px-3 h-12 rounded-xl text-left transition-colors border-none ${
                isCurrent ? 'bg-gray-100 font-semibold' : 'bg-transparent hover:bg-gray-50'
              }`;

              return (
                <div key={mainCat.id}>
                  {subs.length > 0 ? (
                    <button
                      onClick={() => setExpandedMobileCat((prev) => (prev === mainCat.id ? null : mainCat.id))}
                      className={row}
                      aria-expanded={isExpanded}
                    >
                      {categoryImage(mainCat.id) ? <img src={categoryImage(mainCat.id)} alt="" width={32} height={32} loading="lazy" className="w-8 h-8 rounded-lg object-contain shrink-0" /> : <Icon className="w-[18px] h-[18px] text-gray-500 shrink-0" />}
                      <span className="flex-1 text-[15px] text-ink truncate">{mainCat.name}</span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-300 ease-[var(--ease-out-expo)] ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  ) : (
                    <Link href={getCatUrl(mainCat)} onClick={() => setIsMobileMenuOpen(false)} className={row}>
                      {categoryImage(mainCat.id) ? <img src={categoryImage(mainCat.id)} alt="" width={32} height={32} loading="lazy" className="w-8 h-8 rounded-lg object-contain shrink-0" /> : <Icon className="w-[18px] h-[18px] text-gray-500 shrink-0" />}
                      <span className="flex-1 text-[15px] text-ink truncate">{mainCat.name}</span>
                      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                    </Link>
                  )}

                  {/* Smooth accordion using grid-rows trick (animates to auto height) */}
                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[var(--ease-out-expo)] ${
                      isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="ml-[42px] mr-2 py-1 border-l border-line">
                        <Link
                          href={getCatUrl(mainCat)}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block pl-4 py-2.5 text-[14px] font-medium text-ink"
                        >
                          View all
                        </Link>
                        {subs.map((subCat) => (
                          <Link
                            key={subCat.id}
                            href={getCatUrl(mainCat, subCat.id)}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block pl-4 py-2.5 text-[14px] text-gray-600 active:bg-gray-50 hover:text-ink transition-colors"
                          >
                            {subCat.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </Sheet>
    </>
  );
}

