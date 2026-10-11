'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Tag,
  Plus,
  Edit3,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Percent,
  IndianRupee,
  Calendar,
  Users,
  ShieldCheck,
  ChevronDown,
  X,
  Loader2,
  Sparkles,
  Layers,
  AlertCircle,
} from 'lucide-react';

export interface CouponItem {
  id: string;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount?: number | null;
  startDate: string;
  endDate: string;
  usageLimit?: number | null;
  usedCount: number;
  perUserLimit: number;
  applicableCategories?: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function CouponsTab() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Paused' | 'Expired'>('All');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FLAT',
    discountValue: 10,
    minOrderValue: 500,
    maxDiscountAmount: '' as string | number,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usageLimit: '' as string | number,
    perUserLimit: 1,
    isActive: true,
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await api.get('/coupons/admin');
      setCoupons(res.data || []);
    } catch (err: any) {
      console.error('Failed to load coupons:', err);
      toast.error('Failed to load coupons.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied "${code}" to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleStatus = async (coupon: CouponItem) => {
    try {
      const nextStatus = !coupon.isActive;
      await api.put(`/coupons/${coupon.id}`, { isActive: nextStatus });
      setCoupons(prev =>
        prev.map(c => (c.id === coupon.id ? { ...c, isActive: nextStatus } : c))
      );
      toast.success(nextStatus ? `Coupon "${coupon.code}" activated` : `Coupon "${coupon.code}" paused`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update coupon status.');
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!window.confirm(`Are you sure you want to delete coupon "${code}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/coupons/${id}`);
      setCoupons(prev => prev.filter(c => c.id !== id));
      toast.success(`Coupon "${code}" deleted successfully.`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete coupon.');
    }
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderValue: 500,
      maxDiscountAmount: 500,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      usageLimit: '',
      perUserLimit: 1,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: CouponItem) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderValue: coupon.minOrderValue || 0,
      maxDiscountAmount: coupon.maxDiscountAmount || '',
      startDate: coupon.startDate ? coupon.startDate.split('T')[0] : '',
      endDate: coupon.endDate ? coupon.endDate.split('T')[0] : '',
      usageLimit: coupon.usageLimit || '',
      perUserLimit: coupon.perUserLimit || 1,
      isActive: coupon.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCode = formData.code.trim().toUpperCase();
    if (!cleanCode || !/^[A-Z0-9_-]{3,20}$/.test(cleanCode)) {
      toast.error('Code must be 3-20 characters with letters, numbers, hyphens only.');
      return;
    }

    if (!formData.discountValue || Number(formData.discountValue) <= 0) {
      toast.error('Please enter a valid discount value.');
      return;
    }

    if (formData.discountType === 'PERCENTAGE' && Number(formData.discountValue) > 100) {
      toast.error('Percentage discount cannot exceed 100%.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: cleanCode,
        description: formData.description.trim(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minOrderValue: Number(formData.minOrderValue) || 0,
        maxDiscountAmount:
          formData.discountType === 'PERCENTAGE' && formData.maxDiscountAmount
            ? Number(formData.maxDiscountAmount)
            : null,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(`${formData.endDate}T23:59:59.999Z`).toISOString(),
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        perUserLimit: Number(formData.perUserLimit) || 1,
        isActive: formData.isActive,
      };

      if (editingCoupon) {
        const res = await api.put(`/coupons/${editingCoupon.id}`, payload);
        setCoupons(prev => prev.map(c => (c.id === editingCoupon.id ? { ...c, ...res.data } : c)));
        toast.success(`Coupon "${cleanCode}" updated successfully!`);
      } else {
        const res = await api.post('/coupons', payload);
        setCoupons(prev => [res.data, ...prev]);
        toast.success(`Coupon "${cleanCode}" created successfully!`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save coupon.');
    } finally {
      setSaving(false);
    }
  };

  // Filtered list
  const filteredCoupons = useMemo(() => {
    const now = new Date();
    return coupons.filter(c => {
      const matchesSearch =
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const isExpired = c.endDate ? new Date(c.endDate) < now : false;

      let matchesStatus = true;
      if (statusFilter === 'Active') {
        matchesStatus = c.isActive && !isExpired;
      } else if (statusFilter === 'Paused') {
        matchesStatus = !c.isActive;
      } else if (statusFilter === 'Expired') {
        matchesStatus = isExpired;
      }

      return matchesSearch && matchesStatus;
    });
  }, [coupons, searchQuery, statusFilter]);

  // Summary stats
  const stats = useMemo(() => {
    const now = new Date();
    const total = coupons.length;
    const active = coupons.filter(c => c.isActive && (!c.endDate || new Date(c.endDate) >= now)).length;
    const totalRedemptions = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);
    return { total, active, totalRedemptions };
  }, [coupons]);

  return (
    <div className="space-y-6">
      {/* ── Top Bar & Stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Total Coupons</div>
            <div className="text-2xl font-black text-gray-900">{stats.total}</div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Active & Live</div>
            <div className="text-2xl font-black text-emerald-600">{stats.active}</div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Total Redemptions</div>
            <div className="text-2xl font-black text-amber-600">{stats.totalRedemptions}</div>
          </div>
        </div>
      </div>

      {/* ── Action Header & Filter Controls ─────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search coupon code or description..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white transition-all text-gray-900 placeholder-gray-400"
            />
          </div>

          <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl">
            {(['All', 'Active', 'Paused', 'Expired'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer border-none ${
                  statusFilter === tab
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'bg-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer border-none shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* ── Coupons List / Table ────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            <span className="text-sm">Loading coupons...</span>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Tag className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">No coupons found</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-5">
              {searchQuery || statusFilter !== 'All'
                ? 'Try adjusting your filters or search terms.'
                : 'Create your first promotional discount coupon to attract buyers and boost orders!'}
            </p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white font-semibold text-sm rounded-xl hover:bg-teal-700 cursor-pointer border-none"
            >
              <Plus className="w-4 h-4" /> Create Coupon
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="py-3.5 px-4">Coupon Code</th>
                  <th className="py-3.5 px-4">Discount</th>
                  <th className="py-3.5 px-4">Min Order</th>
                  <th className="py-3.5 px-4">Usage & Limits</th>
                  <th className="py-3.5 px-4">Validity</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredCoupons.map(coupon => {
                  const now = new Date();
                  const isExpired = coupon.endDate ? new Date(coupon.endDate) < now : false;
                  const isCopied = copiedCode === coupon.code;

                  return (
                    <tr key={coupon.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Code */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-gray-900 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg text-xs tracking-wider">
                            {coupon.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(coupon.code)}
                            title="Copy code"
                            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors border-none bg-transparent cursor-pointer"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        {coupon.description && (
                          <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={coupon.description}>
                            {coupon.description}
                          </div>
                        )}
                      </td>

                      {/* Discount Value */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                          {coupon.discountType === 'PERCENTAGE' ? (
                            <>
                              <span className="text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md text-xs font-black">
                                {coupon.discountValue}% OFF
                              </span>
                              {coupon.maxDiscountAmount && (
                                <span className="text-xs text-gray-500 font-normal">
                                  (Up to ₹{coupon.maxDiscountAmount.toLocaleString('en-IN')})
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-xs font-black">
                              ₹{coupon.discountValue.toLocaleString('en-IN')} FLAT OFF
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Min Order */}
                      <td className="py-4 px-4">
                        <div className="text-gray-700 font-medium">
                          {coupon.minOrderValue > 0 ? `₹${coupon.minOrderValue.toLocaleString('en-IN')}` : 'No Minimum'}
                        </div>
                      </td>

                      {/* Usage */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="text-xs font-semibold text-gray-800">
                            {coupon.usedCount || 0}{' '}
                            <span className="text-gray-400 font-normal">
                              / {coupon.usageLimit ? coupon.usageLimit : '∞'} used
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {coupon.perUserLimit ? `${coupon.perUserLimit}x per buyer` : '1x per buyer'}
                          </div>
                        </div>
                      </td>

                      {/* Validity Period */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col text-xs text-gray-600">
                          <span>
                            Ends:{' '}
                            {coupon.endDate
                              ? new Date(coupon.endDate).toLocaleDateString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'No expiry'}
                          </span>
                          {isExpired && (
                            <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider mt-0.5">
                              Expired
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(coupon)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer border-none ${
                            coupon.isActive && !isExpired ? 'bg-teal-600' : 'bg-gray-200'
                          }`}
                          title={coupon.isActive ? 'Click to Pause' : 'Click to Activate'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              coupon.isActive && !isExpired ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(coupon)}
                            className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                            title="Edit Coupon"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(coupon.id, coupon.code)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                            title="Delete Coupon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ──────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  <Tag className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Coupon'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg border-none bg-transparent cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form id="couponForm" onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Code */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MEDOX10, WELCOME500"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                  className="w-full px-3.5 py-2.5 font-mono uppercase font-bold text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white text-gray-900"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  3-20 characters. Uppercase alphanumeric only.
                </span>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Description / Offer Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10% off on clinic essentials above ₹1,500"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white text-gray-900"
                />
              </div>

              {/* Discount Type Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Discount Type *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, discountType: 'PERCENTAGE' })}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs cursor-pointer border transition-all ${
                      formData.discountType === 'PERCENTAGE'
                        ? 'border-teal-600 bg-teal-50 text-teal-700 ring-2 ring-teal-600/20'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Percent className="w-4 h-4" /> Percentage (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, discountType: 'FLAT' })}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs cursor-pointer border transition-all ${
                      formData.discountType === 'FLAT'
                        ? 'border-teal-600 bg-teal-50 text-teal-700 ring-2 ring-teal-600/20'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <IndianRupee className="w-4 h-4" /> Flat Amount (₹)
                  </button>
                </div>
              </div>

              {/* Value and Max Cap */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    {formData.discountType === 'PERCENTAGE' ? 'Discount Percentage (%) *' : 'Discount Amount (₹) *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={formData.discountType === 'PERCENTAGE' ? 100 : 100000}
                    required
                    value={formData.discountValue}
                    onChange={e => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white text-gray-900 font-semibold"
                  />
                </div>

                {formData.discountType === 'PERCENTAGE' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Max Discount Cap (₹)
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 1000 (optional)"
                      value={formData.maxDiscountAmount}
                      onChange={e => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white text-gray-900"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Min Order Subtotal (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 for no minimum"
                    value={formData.minOrderValue}
                    onChange={e => setFormData({ ...formData, minOrderValue: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Per User Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.perUserLimit}
                    onChange={e => setFormData({ ...formData, perUserLimit: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white text-gray-900"
                  />
                </div>
              </div>

              {/* Validity Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white text-gray-900"
                  />
                </div>
              </div>

              {/* Total Usage Limit */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Total Redemption Cap (Store-wide)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Leave blank for unlimited"
                  value={formData.usageLimit}
                  onChange={e => setFormData({ ...formData, usageLimit: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white text-gray-900"
                />
              </div>

              {/* Active Toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 border-gray-300"
                  />
                  <span className="text-sm font-semibold text-gray-800">
                    Enable and make coupon active immediately
                  </span>
                </label>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800 rounded-xl border-none bg-transparent cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="couponForm"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer border-none"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{editingCoupon ? 'Update Coupon' : 'Create Coupon'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
