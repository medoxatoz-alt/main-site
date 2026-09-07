'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Truck, MapPin, ChevronDown, CheckCircle2, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

interface Address {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

interface Serviceability {
  serviceable: boolean;
  estimatedDeliveryDate?: string; // 'YYYY-MM-DD'
  courierName?: string;
}

// Adds `n` business days (skipping Sat/Sun) to `date`.
function addBusinessDays(date: Date, n: number): Date {
  const result = new Date(date);
  let added = 0;
  while (added < n) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return result;
}

const formatDate = (d: Date) => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

// Parses a 'YYYY-MM-DD' string as a local date (avoids the UTC-midnight
// shift `new Date('YYYY-MM-DD')` can cause).
function parseDateOnly(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Shown immediately, computed synchronously with no network wait: dispatch
// (1-2 business days) + Standard Delivery (3-5 business days), matching the
// numbers published on /shipping-policy. Replaced by the real Shiprocket
// quote the moment it arrives, but the page never waits on it.
function fallbackWindow(): { from: string; to: string } {
  const now = new Date();
  return {
    from: formatDate(addBusinessDays(now, 4)),
    to: formatDate(addBusinessDays(now, 7)),
  };
}

function Skeleton() {
  return (
    <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 flex items-start gap-3 animate-pulse">
      <div className="w-5 h-5 rounded-full bg-gray-200 shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-gray-200 rounded w-2/5" />
        <div className="h-3 bg-gray-100 rounded w-3/5" />
      </div>
    </div>
  );
}

interface DeliveryEstimateProps {
  /** Product weight in kg, used for the real Shiprocket serviceability/ETD check. */
  weightKg?: number;
}

export default function DeliveryEstimate({ weightKg }: DeliveryEstimateProps) {
  const { user, loading: authLoading } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [serviceability, setServiceability] = useState<Serviceability | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      setAddressesLoading(false);
      return;
    }
    api.get('/user/addresses')
      .then(res => {
        const addrs: Address[] = res.data || [];
        setAddresses(addrs);
        const def = addrs.find(a => a.isDefault) || addrs[0];
        setSelectedId(def?.id || null);
      })
      .catch(() => {})
      .finally(() => setAddressesLoading(false));
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = addresses.find(a => a.id === selectedId);

  // Real courier-quoted estimate from Shiprocket for whichever address is
  // selected. Runs in the background -- the widget already shows the
  // fallback window immediately, this just upgrades the date once it's back.
  useEffect(() => {
    if (!selected?.pincode) {
      setServiceability(null);
      return;
    }
    let cancelled = false;
    api.get('/shipment/serviceability', { params: { pincode: selected.pincode, weight: weightKg || 0.5 } })
      .then(res => { if (!cancelled) setServiceability(res.data); })
      .catch(() => { if (!cancelled) setServiceability(null); });
    return () => { cancelled = true; };
  }, [selected?.pincode, weightKg]);

  const selectAddress = async (addr: Address) => {
    setSelectedId(addr.id);
    setPickerOpen(false);
    if (addr.isDefault) return;
    setUpdating(true);
    try {
      await api.patch(`/user/addresses/${addr.id}/default`);
      setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === addr.id })));
      toast.success('Delivery address updated');
    } catch {
      toast.error('Failed to update delivery address');
    } finally {
      setUpdating(false);
    }
  };

  // Auth state isn't known yet -- rather than a spinner, a skeleton matching
  // the widget's final shape so the page doesn't jump once it resolves.
  if (authLoading) {
    return <Skeleton />;
  }

  if (!user) {
    return (
      <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
        <Truck className="w-5 h-5 text-gold-primary shrink-0" />
        <p className="text-sm text-gray-600">
          <Link href="/signin" className="font-bold text-gold-hover hover:underline">Sign in</Link> to see a delivery estimate for your address.
        </p>
      </div>
    );
  }

  if (addressesLoading) {
    return <Skeleton />;
  }

  if (addresses.length === 0) {
    return (
      <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
        <Truck className="w-5 h-5 text-gold-primary shrink-0" />
        <p className="text-sm text-gray-600">
          <Link href="/account" className="font-bold text-gold-hover hover:underline">Add a delivery address</Link> to see an estimated delivery date.
        </p>
      </div>
    );
  }

  // Prefer Shiprocket's real, courier-quoted date; fall back to the generic
  // policy-based window (shown immediately, before the real check even
  // starts) if it hasn't arrived yet, failed, or came back without a date.
  const notServiceable = serviceability?.serviceable === false;
  const realEstimate = serviceability?.serviceable && serviceability.estimatedDeliveryDate
    ? formatDate(parseDateOnly(serviceability.estimatedDeliveryDate))
    : null;
  const fallback = fallbackWindow();

  return (
    <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 relative">
      <div className="flex items-start gap-3">
        {notServiceable ? (
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        ) : (
          <Truck className="w-5 h-5 text-gold-primary shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-gray-900">
            {notServiceable
              ? 'Not deliverable to this address currently'
              : `Get it by ${realEstimate || `${fallback.from} – ${fallback.to}`}`}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">
              Deliver to {selected?.city}, {selected?.pincode}
            </span>
            <button
              type="button"
              onClick={() => setPickerOpen(o => !o)}
              disabled={updating}
              className="font-bold text-gold-hover hover:text-gold-primary hover:underline shrink-0 cursor-pointer flex items-center gap-0.5 disabled:opacity-50"
            >
              Change <ChevronDown className={`w-3 h-3 transition-transform ${pickerOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {pickerOpen && (
        <div ref={pickerRef} className="absolute z-20 top-full left-4 right-4 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="max-h-64 overflow-y-auto">
            {addresses.map(addr => (
              <button
                key={addr.id}
                type="button"
                onClick={() => selectAddress(addr)}
                className={`w-full text-left px-4 py-3 text-sm border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors flex items-start gap-2 cursor-pointer ${addr.id === selectedId ? 'bg-gold-light/30' : ''}`}
              >
                {addr.id === selectedId ? (
                  <CheckCircle2 className="w-4 h-4 text-gold-hover shrink-0 mt-0.5" />
                ) : (
                  <span className="w-4 h-4 shrink-0" />
                )}
                <span className="min-w-0">
                  <span className="font-bold text-gray-900 block truncate">{addr.fullName}</span>
                  <span className="text-gray-500 text-xs block truncate">{addr.address}, {addr.city} {addr.pincode}</span>
                </span>
              </button>
            ))}
          </div>
          <Link
            href="/account"
            className="block text-center py-2.5 text-xs font-bold text-gold-hover hover:text-gold-primary hover:bg-gray-50 transition-colors border-t border-gray-100"
          >
            + Add a new address
          </Link>
        </div>
      )}
    </div>
  );
}
