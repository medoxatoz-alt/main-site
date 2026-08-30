'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, ChevronRight } from 'lucide-react';

export default function MegaMenu() {
  const [categoriesConfig, setCategoriesConfig] = useState<{
    mainCategories: { id: string, name: string }[], 
    subcategories: Record<string, { id: string, name: string }[]>
  }>({ mainCategories: [], subcategories: {} });
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMobileCat, setExpandedMobileCat] = useState<string | null>(null);
  const [hoveredDesktopCat, setHoveredDesktopCat] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategoriesConfig(res.data);
      } catch (err) {
        console.error('Failed to fetch categories', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  const toggleMobileCat = (catId: string) => {
    setExpandedMobileCat(prev => prev === catId ? null : catId);
  };

  const getCatUrl = (mainCat: { id: string }, subCatId?: string) => {
    let url = `/categories/${encodeURIComponent(mainCat.id)}`;
    if (subCatId) {
      url += `?subCategory=${encodeURIComponent(subCatId)}`;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="bg-[#12161b] border-t border-b border-white/5 py-3">
        <div className="max-w-[1500px] mx-auto px-4 flex gap-6 animate-pulse">
          <div className="w-24 h-5 bg-white/10 rounded"></div>
          <div className="w-32 h-5 bg-white/10 rounded hidden md:block"></div>
          <div className="w-28 h-5 bg-white/10 rounded hidden md:block"></div>
          <div className="w-36 h-5 bg-white/10 rounded hidden lg:block"></div>
        </div>
      </div>
    );
  }

  const { mainCategories, subcategories } = categoriesConfig;

  return (
    <>
      {/* ─── DESKTOP MENU BAR ─── */}
      <div className="bg-[#12161b] border-t border-b border-white/5 relative z-40 hidden md:block">
        <div className="max-w-[1500px] mx-auto px-4 lg:px-8 flex items-center justify-between">
          <ul className="flex items-center space-x-6 lg:space-x-8">
            {mainCategories.map((mainCat) => {
              const subs = subcategories[mainCat.id] || [];
              const isHovered = hoveredDesktopCat === mainCat.id;
              return (
                <li 
                  key={mainCat.id} 
                  className="relative group py-3.5 cursor-pointer"
                  onMouseEnter={() => setHoveredDesktopCat(mainCat.id)}
                  onMouseLeave={() => setHoveredDesktopCat(null)}
                >
                  <Link 
                    href={getCatUrl(mainCat)}
                    className="text-white/80 hover:text-gold-primary transition-colors text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1"
                  >
                    {mainCat.name}
                    {subs.length > 0 && <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isHovered ? 'rotate-180' : ''}`} />}
                  </Link>

                  {/* Desktop Dropdown Mega-Panel */}
                  {subs.length > 0 && isHovered && (
                    <div className="absolute top-full left-0 mt-0 w-[260px] bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-gray-100 overflow-hidden pt-2 pb-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-2 bg-gray-50/50 mb-2 border-b border-gray-50">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Subcategories</span>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto px-2 custom-scrollbar">
                        {subs.map(subCat => (
                          <Link 
                            key={subCat.id}
                            href={getCatUrl(mainCat, subCat.id)}
                            className="block px-3 py-2 text-sm text-gray-700 hover:text-gold-primary hover:bg-gold-primary/5 rounded-lg transition-colors"
                          >
                            {subCat.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* ─── MOBILE HEADER TRIGGER ─── */}
      <div className="bg-[#12161b] border-t border-b border-white/5 py-3 px-4 md:hidden flex items-center">
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex items-center gap-2 text-white hover:text-gold-primary transition-colors font-medium text-[14px]"
        >
          <Menu className="w-5 h-5" />
          <span className="uppercase tracking-wider font-bold">Categories</span>
        </button>
      </div>

      {/* ─── MOBILE DRAWER (ACCORDION) ─── */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[5000] flex md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Drawer */}
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-[320px] bg-[#0d1117] shadow-2xl flex flex-col animate-in slide-in-from-left duration-300 border-r border-white/10">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#12161b]">
              <h2 className="text-lg font-bold text-white tracking-widest uppercase">Categories</h2>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Accordion List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
              {mainCategories.map((mainCat) => {
                const subs = subcategories[mainCat.id] || [];
                const isExpanded = expandedMobileCat === mainCat.id;
                return (
                  <div key={mainCat.id} className="mb-2">
                    <button
                      onClick={() => toggleMobileCat(mainCat.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${isExpanded ? 'bg-white/5 border border-white/10' : 'bg-transparent border border-transparent hover:bg-white/5'}`}
                    >
                      <span className={`font-semibold uppercase tracking-wider text-[13px] ${isExpanded ? 'text-gold-primary' : 'text-white/90'}`}>
                        {mainCat.name}
                      </span>
                      {subs.length > 0 ? (
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-gold-primary' : 'text-gray-500'}`} />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                    </button>

                    {/* Subcategories */}
                    {isExpanded && subs.length > 0 && (
                      <div className="mt-1 mb-2 px-4 py-2 border-l-2 border-gold-primary/30 ml-4 animate-in slide-in-from-top-2 fade-in duration-200">
                        <Link 
                          href={getCatUrl(mainCat)}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block py-2 text-sm text-gold-primary font-semibold mb-1"
                        >
                          View All {mainCat.name} →
                        </Link>
                        {subs.map(subCat => (
                          <Link 
                            key={subCat.id}
                            href={getCatUrl(mainCat, subCat.id)}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block py-2.5 text-sm text-gray-400 hover:text-white transition-colors border-b border-white/5 last:border-0"
                          >
                            {subCat.name}
                          </Link>
                        ))}
                      </div>
                    )}
                    
                    {/* View All link if no subcategories exist */}
                    {isExpanded && subs.length === 0 && (
                       <div className="mt-1 mb-2 px-4 py-2 ml-4">
                         <Link 
                          href={getCatUrl(mainCat)}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block py-2 text-sm text-gold-primary font-semibold"
                        >
                          View All Products →
                        </Link>
                       </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
        }
        .bg-white .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.1);
        }
      `}} />
    </>
  );
}
