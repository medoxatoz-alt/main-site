'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { getCategoriesCached } from '@/lib/api';
import { usePathname } from 'next/navigation';
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
const getCategoryIcon = (id: string, name: string) => {
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

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

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

  // Auto-hide MegaMenu while scrolling down, reveal when scrolling up or at top
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Always show when near the top of the page
      if (currentScrollY <= 40) {
        setIsVisible(true);
        lastScrollYRef.current = currentScrollY;
        return;
      }

      const diff = currentScrollY - lastScrollYRef.current;

      // Scrolling down -> hide categories bar for more screen space
      if (diff > 8) {
        setIsVisible(false);
        if (hoveredDesktopCat) setHoveredDesktopCat(null);
      }
      // Scrolling up -> reveal categories bar smoothly
      else if (diff < -8) {
        setIsVisible(true);
      }

      lastScrollYRef.current = currentScrollY;
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

  if (loading) {
    return (
      <div className="bg-[#12161b] border-t border-b border-white/5 py-2.5">
        <div className="max-w-[1500px] mx-auto px-4 flex items-center gap-3 sm:gap-6 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 shrink-0 min-w-[64px] animate-pulse">
              <div className="w-9 h-9 rounded-full bg-white/10" />
              <div className="w-12 h-2.5 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* UNIFIED HORIZONTAL CATEGORY STRIP (SCROLL HIDE ON SCROLL DOWN, REVEAL ON SCROLL UP) */}
      <div
        className={`bg-transparent md:bg-[#12161b] border-t-0 border-b-0 md:border-t md:border-b border-white/5 relative z-40 select-none shadow-none md:shadow-sm transition-all duration-300 ease-in-out ${
          isVisible
            ? 'max-h-28 opacity-100 translate-y-0 pointer-events-auto'
            : 'max-h-0 opacity-0 -translate-y-full pointer-events-none overflow-hidden border-t-0 border-b-0 py-0'
        }`}
        onMouseLeave={handleMouseLeaveMenu}
      >
        <div className="w-full max-w-[1600px] mx-auto relative group px-1 sm:px-3 lg:px-6">
          {/* Tablet Scroll Buttons (hidden on mobile and full PC) */}
          {showLeftScroll && (
            <button
              onClick={() => scrollByAmount(-280)}
              aria-label="Scroll left"
              className="hidden md:flex lg:hidden absolute left-0 top-0 bottom-0 z-20 w-8 items-center justify-center bg-gradient-to-r from-[#12161b] via-[#12161b]/95 to-transparent text-white/70 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4 drop-shadow" />
            </button>
          )}

          {/* Categories Row: Scrollable on mobile, spanning the full length on PC */}
          <ul
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar scroll-smooth py-2.5 px-2.5 lg:px-0 lg:py-2.5 lg:overflow-visible lg:w-full lg:justify-between lg:items-stretch"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {/* 1. "For You" / All Products Tab (like in image) */}
            <li
              ref={isForYouActive ? activeItemRef : null}
              className="shrink-0 lg:shrink lg:flex-1 lg:min-w-0 lg:flex lg:justify-center relative"
            >
              <Link
                href="/"
                className={`group/item flex flex-col items-center justify-center min-w-[70px] sm:min-w-[78px] lg:w-full px-2 py-1 lg:py-1.5 rounded-xl transition-all duration-200 relative ${
                  isForYouActive
                    ? 'text-gold-primary'
                    : 'text-white/75 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <div
                  className={`w-10 h-10 sm:w-10.5 sm:h-10.5 lg:w-9 lg:h-9 rounded-full flex items-center justify-center transition-all duration-200 mb-1.5 lg:mb-1 ${
                    isForYouActive
                      ? 'bg-gold-primary/20 text-gold-primary scale-110 shadow-[0_0_14px_rgba(212,175,55,0.35)]'
                      : 'bg-white/5 text-white/80 group-hover/item:bg-white/10 group-hover/item:text-white group-hover/item:scale-105'
                  }`}
                >
                  <LayoutGrid className="w-5 h-5 sm:w-5 sm:h-5 lg:w-4.5 lg:h-4.5 stroke-[2]" />
                </div>
                <span
                  className={`text-[11px] sm:text-[11.5px] lg:text-[11.5px] font-semibold text-center leading-tight tracking-tight whitespace-nowrap px-0.5 truncate lg:max-w-full ${
                    isForYouActive
                      ? 'font-bold text-gold-primary'
                      : 'text-gray-300 group-hover/item:text-white'
                  }`}
                >
                  For you
                </span>

                {/* Active Underline Indicator */}
                {isForYouActive && (
                  <span className="absolute bottom-0 left-2 right-2 lg:left-3 lg:right-3 h-[2.5px] bg-gold-primary rounded-full shadow-[0_0_8px_rgba(212,175,55,0.6)] animate-in fade-in zoom-in-75 duration-200" />
                )}
              </Link>
            </li>

            {/* 2. Main Categories with Icons */}
            {mainCategories.map((mainCat) => {
              const subs = subcategories[mainCat.id] || [];
              const isHovered = hoveredDesktopCat === mainCat.id;
              const isCurrentPage = isCatActivePage(mainCat.id);
              const IconComponent = getCategoryIcon(mainCat.id, mainCat.name);

              // Short clean name for mobile & desktop pill view
              const displayName = mainCat.name
                .replace('All Hosp Dept Wise Products', 'Hospital Supplies')
                .replace('Healing Puja Products', 'Healing & Puja')
                .replace('Makeup & Beauty Products', 'Makeup & Beauty');

              return (
                <li
                  key={mainCat.id}
                  ref={isCurrentPage ? activeItemRef : null}
                  className="shrink-0 lg:shrink lg:flex-1 lg:min-w-0 lg:flex lg:justify-center relative"
                  onMouseEnter={() => handleMouseEnterCat(mainCat.id)}
                >
                  <Link
                    href={getCatUrl(mainCat)}
                    className={`group/item flex flex-col items-center justify-center min-w-[74px] sm:min-w-[82px] lg:w-full px-2 py-1 lg:py-1.5 rounded-xl transition-all duration-200 relative ${
                      isHovered || isCurrentPage
                        ? 'text-gold-primary'
                        : 'text-white/75 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 sm:w-10.5 sm:h-10.5 lg:w-9 lg:h-9 rounded-full flex items-center justify-center transition-all duration-200 mb-1.5 lg:mb-1 ${
                        isCurrentPage || isHovered
                          ? 'bg-gold-primary/20 text-gold-primary scale-110 shadow-[0_0_14px_rgba(212,175,55,0.35)]'
                          : 'bg-white/5 text-white/80 group-hover/item:bg-white/10 group-hover/item:text-white group-hover/item:scale-105'
                      }`}
                    >
                      <IconComponent className="w-5 h-5 sm:w-5 sm:h-5 lg:w-4.5 lg:h-4.5 stroke-[2]" />
                    </div>
                    <span
                      className={`text-[10.5px] sm:text-[11.5px] lg:text-[11.5px] font-semibold text-center leading-tight tracking-tight whitespace-nowrap max-w-[88px] sm:max-w-[102px] lg:max-w-full truncate px-0.5 ${
                        isCurrentPage || isHovered
                          ? 'font-bold text-gold-primary'
                          : 'text-gray-300 group-hover/item:text-white'
                      }`}
                      title={mainCat.name}
                    >
                      {displayName}
                    </span>

                    {/* Active Underline Indicator */}
                    {(isCurrentPage || isHovered) && (
                      <span className="absolute bottom-0 left-2 right-2 lg:left-3 lg:right-3 h-[2.5px] bg-gold-primary rounded-full shadow-[0_0_8px_rgba(212,175,55,0.6)] animate-in fade-in zoom-in-75 duration-200" />
                    )}
                  </Link>
                </li>
              );
            })}

            {/* 3. "More / All" Button (opens full drawer) */}
            <li className="shrink-0 lg:shrink lg:flex-1 lg:min-w-0 lg:flex lg:justify-center relative">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="View all categories"
                className="group/item flex flex-col items-center justify-center min-w-[62px] sm:min-w-[70px] lg:w-full px-2 py-1 lg:py-1.5 rounded-xl transition-all duration-200 text-white/70 hover:text-gold-primary hover:bg-white/[0.04] cursor-pointer"
              >
                <div className="w-10 h-10 sm:w-10.5 sm:h-10.5 lg:w-9 lg:h-9 rounded-full flex items-center justify-center bg-white/5 text-white/80 group-hover/item:bg-gold-primary/15 group-hover/item:text-gold-primary transition-all duration-200 mb-1.5 lg:mb-1 group-hover/item:scale-105">
                  <MoreHorizontal className="w-5 h-5 sm:w-5 sm:h-5 lg:w-4.5 lg:h-4.5 stroke-[2]" />
                </div>
                <span className="text-[10.5px] sm:text-[11px] lg:text-[11.5px] font-semibold text-center leading-tight tracking-tight whitespace-nowrap text-gray-300 group-hover/item:text-gold-primary truncate lg:max-w-full">
                  More
                </span>
              </button>
            </li>
          </ul>

          {/* Tablet Right Scroll Button */}
          {showRightScroll && (
            <button
              onClick={() => scrollByAmount(280)}
              aria-label="Scroll right"
              className="hidden md:flex lg:hidden absolute right-0 top-0 bottom-0 z-20 w-8 items-center justify-center bg-gradient-to-l from-[#12161b] via-[#12161b]/95 to-transparent text-white/70 hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4 drop-shadow" />
            </button>
          )}
        </div>

        {/* Full-width Mega Dropdown Panel on Desktop Hover */}
        {hoveredDesktopCat && (
          <div
            className="hidden md:block absolute top-full left-0 right-0 w-full z-50 animate-in fade-in slide-in-from-top-1 duration-150"
            onMouseEnter={handleMouseEnterPanel}
            onMouseLeave={handleMouseLeaveMenu}
          >
            {/* Gold highlight accent line */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-gold-primary/50 to-transparent" />

            <div className="bg-[#0d1117] border-b border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.7)] backdrop-blur-md">
              <div className="max-w-[1500px] mx-auto px-6 lg:px-8 py-6">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-gold-primary animate-pulse" />
                    <h3 className="text-white text-base font-bold uppercase tracking-wider">
                      {mainCategories.find((c) => c.id === hoveredDesktopCat)?.name}
                    </h3>
                  </div>
                  <Link
                    href={getCatUrl({ id: hoveredDesktopCat })}
                    className="inline-flex items-center gap-1.5 text-gold-primary hover:text-white text-xs font-bold transition-colors uppercase tracking-wider"
                  >
                    View All Products <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {activeDropdown.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-3.5 max-h-[380px] overflow-y-auto custom-scrollbar pr-2">
                    {activeDropdown.map((subCat) => (
                      <Link
                        key={subCat.id}
                        href={getCatUrl({ id: hoveredDesktopCat }, subCat.id)}
                        className="group/link flex items-center gap-2 text-white/70 hover:text-white text-[13px] font-medium transition-colors py-1 px-1.5 rounded hover:bg-white/[0.04]"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover/link:bg-gold-primary transition-colors shrink-0" />
                        <span className="truncate group-hover/link:text-gold-primary transition-colors">
                          {subCat.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-start gap-3 py-3">
                    <p className="text-[13px] text-white/50">
                      No specific subcategories. Explore all products in this category.
                    </p>
                    <Link
                      href={getCatUrl({ id: hoveredDesktopCat })}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold-primary/10 border border-gold-primary/30 text-gold-primary text-[12px] font-bold hover:bg-gold-primary/20 transition-colors"
                    >
                      Explore Products <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FULL CATEGORIES DRAWER (Mobile + Accessible from "More") */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[5000] flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Sidebar */}
          <div className="absolute inset-y-0 left-0 w-[88%] max-w-[360px] bg-[#0d1117] shadow-2xl flex flex-col animate-in slide-in-from-left duration-300 border-r border-white/10 z-10">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#12161b]">
              <div className="flex items-center gap-2.5">
                <LayoutGrid className="w-5 h-5 text-gold-primary" />
                <h2 className="text-base font-bold text-white tracking-wider uppercase">
                  All Categories
                </h2>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-gray-300 transition-colors cursor-pointer"
                aria-label="Close categories menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Search inside Drawer */}
            <div className="p-3 border-b border-white/10 bg-[#12161b]/50">
              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm">
                <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                <input
                  type="text"
                  value={searchDrawerQuery}
                  onChange={(e) => setSearchDrawerQuery(e.target.value)}
                  placeholder="Filter categories..."
                  className="bg-transparent border-none outline-none text-white text-xs w-full placeholder-gray-500"
                />
                {searchDrawerQuery && (
                  <button
                    onClick={() => setSearchDrawerQuery('')}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Categories List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5">
              {/* "For You" / Home Link */}
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 p-3.5 rounded-xl transition-all ${
                  isForYouActive
                    ? 'bg-gold-primary/10 border border-gold-primary/30 text-gold-primary'
                    : 'text-white/90 hover:bg-white/5'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gold-primary shrink-0">
                  <LayoutGrid className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <span className="font-bold text-sm">For You (All Products)</span>
                  <p className="text-[11px] text-gray-400">Featured & trending supplies</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>

              {mainCategories
                .filter(
                  (c) =>
                    !searchDrawerQuery ||
                    c.name.toLowerCase().includes(searchDrawerQuery.toLowerCase())
                )
                .map((mainCat) => {
                  const subs = subcategories[mainCat.id] || [];
                  const isExpanded = expandedMobileCat === mainCat.id;
                  const isCurrent = isCatActivePage(mainCat.id);
                  const Icon = getCategoryIcon(mainCat.id, mainCat.name);

                  return (
                    <div key={mainCat.id} className="rounded-xl overflow-hidden">
                      <button
                        onClick={() =>
                          setExpandedMobileCat((prev) =>
                            prev === mainCat.id ? null : mainCat.id
                          )
                        }
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                          isExpanded || isCurrent
                            ? 'bg-white/10 text-gold-primary'
                            : 'bg-white/[0.02] text-white/90 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gold-primary shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="font-semibold text-xs text-left truncate">
                            {mainCat.name}
                          </span>
                        </div>
                        {subs.length > 0 ? (
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 shrink-0 ${
                              isExpanded ? 'rotate-180 text-gold-primary' : 'text-gray-400'
                            }`}
                          />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                        )}
                      </button>

                      {/* Subcategories dropdown */}
                      {isExpanded && subs.length > 0 && (
                        <div className="mt-1 mb-2 pl-11 pr-2 py-1.5 space-y-1 border-l-2 border-gold-primary/30 ml-4 animate-in slide-in-from-top-1 duration-150">
                          <Link
                            href={getCatUrl(mainCat)}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block py-1.5 text-xs text-gold-primary font-bold hover:underline"
                          >
                            Explore All {mainCat.name} →
                          </Link>
                          {subs.map((subCat) => (
                            <Link
                              key={subCat.id}
                              href={getCatUrl(mainCat, subCat.id)}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="block py-2 text-xs text-gray-300 hover:text-white transition-colors border-b border-white/5 last:border-0"
                            >
                              {subCat.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
      `,
        }}
      />
    </>
  );
}
