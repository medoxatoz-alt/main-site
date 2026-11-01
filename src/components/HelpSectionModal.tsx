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
  ShieldCheck,
  CreditCard,
} from 'lucide-react';

import api from '@/lib/api';
import Sheet from '@/components/ui/Sheet';

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

  const close = () => setIsOpen(false);

  return (
    <Sheet
      open={isOpen}
      onClose={close}
      side="bottom"
      label="Help and guides"
      zIndex={9999}
      className="h-[88dvh] sm:h-[min(760px,86dvh)] sm:max-w-xl sm:mx-auto sm:bottom-6 sm:rounded-[20px]"
    >
      {/* Header */}
      <div data-sheet-handle className="px-5 pt-1 pb-3 flex items-center justify-between touch-none shrink-0">
        <div>
          <h3 className="text-[19px] font-semibold text-ink tracking-tight">Help &amp; guides</h3>
          <p className="text-[13px] text-text-muted">Answers to common questions</p>
        </div>
        <button
          onClick={close}
          aria-label="Close help"
          className="pressable -mr-2 w-10 h-10 grid place-items-center rounded-full text-gray-500 hover:bg-gray-100 border-none bg-transparent"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search */}
      <div className="px-5 pb-3 shrink-0">
        <div className="flex items-center h-11 rounded-xl bg-gray-100 px-3.5 focus-within:bg-white focus-within:ring-1 focus-within:ring-ink transition-colors">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders, GST, returns…"
            className="flex-1 min-w-0 h-full bg-transparent border-none outline-none px-2.5 text-[15px] text-ink placeholder:text-gray-400 [&::-webkit-search-cancel-button]:hidden"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} aria-label="Clear search" className="text-gray-400 hover:text-ink border-none bg-transparent">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-5 pb-3 shrink-0">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`pressable shrink-0 h-8 px-3.5 rounded-full text-[13px] font-medium whitespace-nowrap border ${
              selectedCategory === cat ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-line hover:border-gray-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar px-5 pb-4 border-t border-line">

        {/* FAQs */}
        <div className="mt-4">
          {filteredFaqs.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center">
              <Search className="w-7 h-7 text-gray-300 mb-2" />
              <p className="text-[15px] font-medium text-ink">No matching questions</p>
              <p className="text-[13px] text-text-muted mt-1 max-w-xs">Try another word, or contact us below.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-line divide-y divide-line overflow-hidden">
              {filteredFaqs.map((faq) => {
                const isExpanded = openIdx === faq.id;
                const Icon = faq.icon;
                return (
                  <div key={faq.id} className="bg-white">
                    <button
                      onClick={() => setOpenIdx(isExpanded ? null : faq.id)}
                      aria-expanded={isExpanded}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left border-none bg-transparent hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    >
                      <Icon className="w-[18px] h-[18px] text-gray-400 shrink-0" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-[14.5px] font-medium text-ink leading-snug">{faq.q}</span>
                        <span className="block text-[12px] text-text-muted mt-0.5">{faq.category}</span>
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-300 ease-[var(--ease-out-expo)] ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <div
                      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[var(--ease-out-expo)] ${
                        isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="px-4 pb-4 pl-[46px] text-[14px] text-gray-600 leading-relaxed">{faq.a}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Contact */}
      <div className="shrink-0 border-t border-line px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] bg-white">
        <p className="text-[12.5px] text-text-muted mb-2.5">Still need help? Contact us</p>
        <div className="grid grid-cols-3 gap-2">
          <a
            href="https://wa.me/919876543210"
            target="_blank"
            rel="noopener noreferrer"
            className="pressable h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13.5px] font-medium flex items-center justify-center gap-1.5"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </a>
          <a
            href="tel:+919876543210"
            className="pressable h-11 rounded-xl border border-line bg-white hover:bg-gray-50 text-ink text-[13.5px] font-medium flex items-center justify-center gap-1.5"
          >
            <Phone className="w-4 h-4" /> Call
          </a>
          <a
            href="mailto:support@medoxatoz.com"
            className="pressable h-11 rounded-xl border border-line bg-white hover:bg-gray-50 text-ink text-[13.5px] font-medium flex items-center justify-center gap-1.5"
          >
            <Mail className="w-4 h-4" /> Email
          </a>
        </div>
      </div>
    </Sheet>
  );
}