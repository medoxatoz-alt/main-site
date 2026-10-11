'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  HelpCircle,
  Plus,
  Edit3,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Package,
  FileCheck2,
  Receipt,
  Truck,
  ShieldCheck,
  CreditCard,
  Phone,
  Mail,
  Sparkles,
  ChevronDown,
  X,
  Loader2,
} from 'lucide-react';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  icon?: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const ICON_MAP: Record<string, any> = {
  Package,
  FileCheck2,
  Receipt,
  Truck,
  RotateCcw,
  ShieldCheck,
  CreditCard,
  HelpCircle,
  Phone,
  Mail,
  Sparkles,
};

const CATEGORIES = [
  'All',
  'Bulk & B2B',
  'Prescriptions',
  'GST & Tax',
  'Shipping',
  'Returns & Warranty',
  'General',
];

export default function FaqsTab() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'General',
    icon: 'HelpCircle',
    order: 1,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  // Delete modal state
  const [faqToDelete, setFaqToDelete] = useState<FaqItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reseeding, setReseeding] = useState(false);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/faqs/admin');
      setFaqs(res.data || []);
    } catch (err: any) {
      console.error('Failed to load FAQs:', err);
      // Fallback to public endpoint if admin endpoint has issue
      try {
        const fallbackRes = await api.get('/faqs');
        setFaqs(fallbackRes.data || []);
      } catch {
        toast.error('Failed to fetch FAQs.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const openCreateModal = () => {
    setEditingFaq(null);
    setFormData({
      question: '',
      answer: '',
      category: 'Bulk & B2B',
      icon: 'Package',
      order: faqs.length + 1,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (faq: FaqItem) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || 'General',
      icon: faq.icon || 'HelpCircle',
      order: faq.order || 1,
      isActive: faq.isActive !== false,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error('Please enter both a question and answer.');
      return;
    }

    setSaving(true);
    try {
      if (editingFaq) {
        await api.put(`/faqs/${editingFaq.id}`, formData);
        toast.success('FAQ updated successfully!');
      } else {
        await api.post('/faqs', formData);
        toast.success('New FAQ added successfully!');
      }
      setIsModalOpen(false);
      await fetchFaqs();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save FAQ.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (faq: FaqItem) => {
    const nextStatus = !faq.isActive;
    try {
      await api.put(`/faqs/${faq.id}`, { isActive: nextStatus });
      setFaqs((prev) =>
        prev.map((item) => (item.id === faq.id ? { ...item, isActive: nextStatus } : item))
      );
      toast.success(nextStatus ? 'FAQ published' : 'FAQ hidden from customers');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!faqToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/faqs/${faqToDelete.id}`);
      toast.success('FAQ deleted!');
      setFaqToDelete(null);
      await fetchFaqs();
    } catch (err) {
      toast.error('Failed to delete FAQ.');
    } finally {
      setDeleting(false);
    }
  };

  const handleReseed = async () => {
    if (!confirm('Are you sure you want to restore default Help FAQs? Any custom edits will be replaced.')) {
      return;
    }
    setReseeding(true);
    try {
      await api.post('/faqs/seed');
      toast.success('Default FAQs restored!');
      await fetchFaqs();
    } catch (err) {
      toast.error('Failed to reseed FAQs.');
    } finally {
      setReseeding(false);
    }
  };

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesCategory =
        selectedCategory === 'All' || faq.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.category.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [faqs, searchQuery, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-600 shadow-xs">
            <HelpCircle className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Help & FAQs Manager</h3>
            <p className="text-xs text-gray-500 font-medium">
              Manage questions, answers, categories, and icons displayed in the customer Help Modal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleReseed}
            disabled={reseeding}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            title="Reset to default medical FAQs"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${reseeding ? 'animate-spin' : ''}`} />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20 cursor-pointer border-none"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add New FAQ</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions, answers, keywords..."
            className="w-full pl-10 pr-9 py-2 bg-gray-50 hover:bg-gray-100/60 focus:bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer bg-transparent border-none"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border-none ${
                selectedCategory === cat
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FAQs List Table / Cards */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-xs text-gray-500 font-semibold">Loading FAQs from database...</p>
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-800">No FAQs found</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-sm">
              Try adjusting your search criteria or tap "Add New FAQ" to create one.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredFaqs.map((faq, index) => {
              const IconComp = ICON_MAP[faq.icon || 'HelpCircle'] || HelpCircle;
              return (
                <div
                  key={faq.id}
                  className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-gray-50/70 transition-colors"
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Icon Badge */}
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
                      <IconComp className="w-5 h-5 stroke-[2]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100/70 text-amber-800">
                          {faq.category}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400">
                          Order #{faq.order}
                        </span>
                        {!faq.isActive && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            Hidden
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-gray-900 leading-snug">
                        {faq.question}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed line-clamp-2">
                        {faq.answer}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Status Toggle */}
                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                    {/* Active toggle button */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(faq)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        faq.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {faq.isActive ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Hidden</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(faq)}
                        className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer border-none"
                        title="Edit FAQ"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setFaqToDelete(faq)}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer border-none"
                        title="Delete FAQ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl text-gray-900 animate-in zoom-in-95 duration-200 border border-gray-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
              <h3 className="text-base font-black text-gray-900">
                {editingFaq ? 'Edit FAQ' : 'Add New FAQ'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto space-y-4 my-4 pr-1">
              {/* Question */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Question *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="e.g. Can I get a verified GST invoice for input tax credit?"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Answer */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Answer *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="e.g. Yes, 100%! MedoxAtoZ provides genuine, GST-compliant tax invoices for every single purchase..."
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm outline-none focus:border-amber-500"
                  >
                    <option value="Bulk & B2B">Bulk & B2B</option>
                    <option value="Prescriptions">Prescriptions</option>
                    <option value="GST & Tax">GST & Tax</option>
                    <option value="Shipping">Shipping</option>
                    <option value="Returns & Warranty">Returns & Warranty</option>
                    <option value="General">General</option>
                  </select>
                </div>

                {/* Lucide Icon */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Lucide Icon
                  </label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm outline-none focus:border-amber-500"
                  >
                    {Object.keys(ICON_MAP).map((iconKey) => (
                      <option key={iconKey} value={iconKey}>
                        {iconKey}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center pt-1">
                {/* Display Order */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Display Order (Priority)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm outline-none focus:border-amber-500"
                  />
                </div>

                {/* Active Checkbox */}
                <div className="flex items-center gap-2.5 pt-5">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-amber-500 rounded border-gray-300 focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="isActiveCheck" className="text-xs font-bold text-gray-700 cursor-pointer">
                    Visible to Customers
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer border-none flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingFaq ? 'Save Changes' : 'Create FAQ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {faqToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-gray-900 animate-in zoom-in-95 duration-200 border border-gray-100 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-gray-900 mb-1">Delete FAQ?</h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-6">
              Are you sure you want to delete <strong className="text-gray-900">"{faqToDelete.question}"</strong>?
              This will remove it from the database and customer Help modal.
            </p>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setFaqToDelete(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer border-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black rounded-xl cursor-pointer border-none flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
