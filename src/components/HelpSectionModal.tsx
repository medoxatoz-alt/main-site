'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  HelpCircle,
  X,
  ChevronDown,
  Mail,
  MessageCircle,
  Phone,
  Package,
  FileCheck2,
  Receipt,
  Truck,
  RotateCcw,
  Sparkles,
  Search,
  Compass,
  ArrowRight,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';

import api from '@/lib/api';

interface FaqItem {
  id: string;
  category: string;
  icon: any;
  iconColor: string;
  badgeBg: string;
  q: string;
  a: string;
}

const ICON_META: Record<string, { icon: any; iconColor: string; badgeBg: string }> = {
  Package: {
    icon: Package,
    iconColor: 'bg-blue-50 text-blue-600 border border-blue-200/60',
    badgeBg: 'text-blue-700 bg-blue-50',
  },
  FileCheck2: {
    icon: FileCheck2,
    iconColor: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60',
    badgeBg: 'text-emerald-700 bg-emerald-50',
  },
  Receipt: {
    icon: Receipt,
    iconColor: 'bg-purple-50 text-purple-600 border border-purple-200/60',
    badgeBg: 'text-purple-700 bg-purple-50',
  },
  Truck: {
    icon: Truck,
    iconColor: 'bg-sky-50 text-sky-600 border border-sky-200/60',
    badgeBg: 'text-sky-700 bg-sky-50',
  },
  RotateCcw: {
    icon: RotateCcw,
    iconColor: 'bg-rose-50 text-rose-600 border border-rose-200/60',
    badgeBg: 'text-rose-700 bg-rose-50',
  },
  ShieldCheck: {
    icon: ShieldCheck,
    iconColor: 'bg-amber-50 text-amber-600 border border-amber-200/60',
    badgeBg: 'text-amber-700 bg-amber-50',
  },
  CreditCard: {
    icon: CreditCard,
    iconColor: 'bg-indigo-50 text-indigo-600 border border-indigo-200/60',
    badgeBg: 'text-indigo-700 bg-indigo-50',
  },
  HelpCircle: {
    icon: HelpCircle,
    iconColor: 'bg-amber-50 text-amber-600 border border-amber-200/60',
    badgeBg: 'text-amber-700 bg-amber-50',
  },
  Phone: {
    icon: Phone,
    iconColor: 'bg-blue-50 text-blue-600 border border-blue-200/60',
    badgeBg: 'text-blue-700 bg-blue-50',
  },
  Mail: {
    icon: Mail,
    iconColor: 'bg-gray-100 text-gray-700 border border-gray-200',
    badgeBg: 'text-gray-700 bg-gray-100',
  },
  Sparkles: {
    icon: Sparkles,
    iconColor: 'bg-amber-50 text-amber-600 border border-amber-200/60',
    badgeBg: 'text-amber-700 bg-amber-50',
  },
};

const FALLBACK_FAQS: FaqItem[] = [
  {
    id: 'bulk',
    category: 'Bulk & B2B',
    icon: Package,
    iconColor: 'bg-blue-50 text-blue-600 border border-blue-200/60',
    badgeBg: 'text-blue-700 bg-blue-50',
    q: 'How do I place bulk orders for my clinic or hospital?',
    a: 'You can increase product quantities directly in your cart to automatically unlock wholesale tier discounts. For complete clinic setups or institutional tender quotations, reach out directly to our B2B desk for personalized commercial rates.',
  },
  {
    id: 'rx',
    category: 'Prescriptions',
    icon: FileCheck2,
    iconColor: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60',
    badgeBg: 'text-emerald-700 bg-emerald-50',
    q: 'How does prescription upload and verification work?',
    a: 'For regulated pharmaceuticals or diagnostic items, simply upload a clear photo or PDF of your valid prescription or clinic registration during checkout. Our registered medical team verifies it swiftly without delaying your order dispatch.',
  },
  {
    id: 'gst',
    category: 'GST & Tax',
    icon: Receipt,
    iconColor: 'bg-purple-50 text-purple-600 border border-purple-200/60',
    badgeBg: 'text-purple-700 bg-purple-50',
    q: 'Can I get a verified GST invoice for input tax credit (ITC)?',
    a: 'Yes, 100%! MedoxAtoZ generates authentic, GST-compliant tax invoices for every single purchase. Enter your clinic/hospital GSTIN at checkout or in Account Settings to automatically claim your input tax credit.',
  },
  {
    id: 'shipping',
    category: 'Shipping',
    icon: Truck,
    iconColor: 'bg-sky-50 text-sky-600 border border-sky-200/60',
    badgeBg: 'text-sky-700 bg-sky-50',
    q: 'What are the delivery timelines across India?',
    a: 'Tier-1 metro cities receive orders within 24 to 48 hours. Tier-2 and regional clinics are serviced within 3 to 5 business days. Temperature-sensitive pharmaceuticals and test kits travel in insulated cold-chain packaging.',
  },
  {
    id: 'returns',
    category: 'Returns & Warranty',
    icon: RotateCcw,
    iconColor: 'bg-rose-50 text-rose-600 border border-rose-200/60',
    badgeBg: 'text-rose-700 bg-rose-50',
    q: 'What is your return, replacement, and warranty policy?',
    a: 'If any medical supply arrives damaged, expired, or with compromised seals, submit a replacement or full refund request within 7 days via your Orders section. All diagnostic devices carry full manufacturer warranty.',
  },
  {
    id: 'genuine',
    category: 'Bulk & B2B',
    icon: ShieldCheck,
    iconColor: 'bg-amber-50 text-amber-600 border border-amber-200/60',
    badgeBg: 'text-amber-700 bg-amber-50',
    q: 'Are all medical equipment and instruments 100% genuine?',
    a: 'Every product listed on MedoxAtoZ is sourced directly from certified original manufacturers or authorized national distributors. All batches carry verifiable lot numbers, expiry dates, and regulatory compliance documents.',
  },
  {
    id: 'payment',
    category: 'GST & Tax',
    icon: CreditCard,
    iconColor: 'bg-indigo-50 text-indigo-600 border border-indigo-200/60',
    badgeBg: 'text-indigo-700 bg-indigo-50',
    q: 'Which payment methods are accepted for medical orders?',
    a: 'We accept all major UPI apps (GPay, PhonePe, Paytm), Credit & Debit cards, Net Banking across 50+ Indian banks, and secure Cashfree gateways. Verified B2B hospital accounts can also apply for credit billing terms.',
  },
];

export default function HelpSectionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [openIdx, setOpenIdx] = useState<string | null>('bulk');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dbFaqs, setDbFaqs] = useState<FaqItem[]>(FALLBACK_FAQS);

  // Fetch dynamic FAQs from database
  useEffect(() => {
    const loadFaqs = async () => {
      try {
        const res = await api.get('/faqs');
        if (Array.isArray(res.data) && res.data.length > 0) {
          const mapped: FaqItem[] = res.data.map((item: any) => {
            const iconKey = item.icon || 'HelpCircle';
            const meta = ICON_META[iconKey] || ICON_META.HelpCircle;
            return {
              id: item.id || String(Math.random()),
              category: item.category || 'General',
              icon: meta.icon,
              iconColor: meta.iconColor,
              badgeBg: meta.badgeBg,
              q: item.question || item.q,
              a: item.answer || item.a,
            };
          });
          setDbFaqs(mapped);
          if (mapped.length > 0) {
            setOpenIdx(mapped[0].id);
          }
        }
      } catch (err) {
        // Fallback already pre-set
      }
    };
    loadFaqs();
  }, []);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setSearchQuery('');
      setSelectedCategory('All');
    };
    window.addEventListener('open-help-modal', handleOpen);
    return () => window.removeEventListener('open-help-modal', handleOpen);
  }, []);

  const openWalkthrough = () => {
    setIsOpen(false);
    window.dispatchEvent(new Event('open-walkthrough'));
  };

  // Compute categories dynamically
  const categories = useMemo(() => {
    const set = new Set<string>();
    dbFaqs.forEach((f) => set.add(f.category));
    return ['All', ...Array.from(set)];
  }, [dbFaqs]);

  // Filter FAQs by search query & category
  const filteredFaqs = useMemo(() => {
    return dbFaqs.filter((faq) => {
      const matchesCategory =
        selectedCategory === 'All' || faq.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        faq.q.toLowerCase().includes(query) ||
        faq.a.toLowerCase().includes(query) ||
        faq.category.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [dbFaqs, searchQuery, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop Dismissal */}
      <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

      {/* Modal / Native Bottom Sheet Container */}
      <div className="relative w-full sm:max-w-xl bg-white rounded-t-[32px] sm:rounded-3xl p-5 sm:p-7 shadow-2xl text-gray-900 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[92vh] flex flex-col z-10 border border-gray-100">
        
        {/* Mobile Pull Handle Bar */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3 sm:hidden shrink-0" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-600 shadow-xs">
              <HelpCircle className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                Help & Guides
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Instant answers, FAQs & healthcare support
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close help modal"
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors cursor-pointer border-none"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Instant Search Bar */}
        <div className="pt-3 pb-2 shrink-0">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help topics, GST, orders, returns..."
              className="w-full pl-10 pr-9 py-2.5 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200/90 rounded-2xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer bg-transparent border-none"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills (Horizontal Scroll) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2.5 pt-0.5 shrink-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer border-none ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80 hover:text-gray-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Interactive App Tour / How to Use Banner */}
        <div className="mb-3 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-amber-50/80 via-orange-50/50 to-amber-50/80 border border-amber-200/70 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Compass className="w-5 h-5 stroke-[2]" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 leading-tight">
                How to Use Medox App
              </h4>
              <p className="text-[11px] text-gray-600 truncate">
                Take the interactive 30-second walkthrough tour
              </p>
            </div>
          </div>
          <button
            onClick={openWalkthrough}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 border border-amber-300 text-amber-800 text-xs font-black flex items-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <span>View Tour</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

        {/* Scrollable FAQ Accordion */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-0.5 space-y-2">
          {filteredFaqs.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mb-2">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-gray-800">No matching questions found</p>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                Can’t find what you are looking for? Reach out to our 24/7 medical desk below.
              </p>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isExpanded = openIdx === faq.id;
              const Icon = faq.icon;
              return (
                <div
                  key={faq.id}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isExpanded
                      ? 'border-amber-200 bg-amber-50/20 shadow-xs'
                      : 'border-gray-100 bg-gray-50/60 hover:bg-gray-50 hover:border-gray-200'
                  }`}
                >
                  <button
                    onClick={() => setOpenIdx(isExpanded ? null : faq.id)}
                    className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left gap-3 cursor-pointer bg-transparent border-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center shrink-0 ${faq.iconColor}`}
                      >
                        <Icon className="w-4.5 h-4.5 stroke-[2]" />
                      </div>
                      <div className="min-w-0">
                        <span
                          className={`text-[9.5px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md inline-block mb-1 ${faq.badgeBg}`}
                        >
                          {faq.category}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-gray-900 block leading-snug">
                          {faq.q}
                        </span>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${
                        isExpanded ? 'rotate-180 text-amber-600' : ''
                      }`}
                    />
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 pl-14 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100/80 pt-2.5 animate-in fade-in duration-150">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Quick Contact Desk Footer */}
        <div className="pt-3.5 border-t border-gray-100 flex flex-col gap-2.5 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
              Need Direct Assistance?
            </span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Support Desk Online</span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs transition-all shadow-xs"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span className="truncate">WhatsApp</span>
            </a>
            <a
              href="tel:+919876543210"
              className="flex items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-700 font-black text-xs transition-all border border-blue-200/60"
            >
              <Phone className="w-4 h-4 shrink-0" />
              <span className="truncate">Call Desk</span>
            </a>
            <a
              href="mailto:support@medoxatoz.com"
              className="flex items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-gray-900 hover:bg-black active:scale-95 text-white font-black text-xs transition-all shadow-xs"
            >
              <Mail className="w-4 h-4 shrink-0" />
              <span className="truncate">Email Us</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
