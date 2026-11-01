'use client';

import { useEffect, useRef, useState } from 'react';
import { displayContact } from '@/lib/format';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2, ChevronRight, Heart, MapPin, Phone, Trash2, Plus, Package, Edit3, X, CheckCircle2, HelpCircle, Shield, LogOut } from 'lucide-react';
import Sheet from '@/components/ui/Sheet';
import { Skeleton } from '@/components/Skeleton';
import ErrorState from '@/components/ErrorState';
import Link from 'next/link';
import { useGeolocatedAddress } from '@/hooks/useGeolocatedAddress';


function Row({
  icon: Icon,
  title,
  subtitle,
  href,
  onClick,
  trailing,
  tone = 'default',
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  href?: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
  tone?: 'default' | 'danger';
}) {
  const inner = (
    <>
      <span className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${tone === 'danger' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-700'}`}>
        <Icon className="w-[18px] h-[18px]" />
      </span>
      <span className="flex-1 min-w-0">
        <span className={`block text-[15px] ${tone === 'danger' ? 'text-red-600 font-medium' : 'text-ink'}`}>{title}</span>
        {subtitle && <span className="block text-[12.5px] text-text-muted truncate mt-0.5">{subtitle}</span>}
      </span>
      {trailing ?? (tone !== 'danger' && <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />)}
    </>
  );
  const cls = 'w-full flex items-center gap-3.5 px-4 py-3 text-left border-none bg-transparent hover:bg-gray-50 active:bg-gray-100 transition-colors';
  if (href) return <Link href={href} className={cls}>{inner}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className={cls}>{inner}</button>;
  return <div className={cls.replace(' hover:bg-gray-50 active:bg-gray-100', '')}>{inner}</div>;
}

export default function Account() {
  const { user, loading: authLoading } = useAuth();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const router = useRouter();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ fullName: '', phone: '', address: '', city: '', state: '', pincode: '' });
  const [savingAddress, setSavingAddress] = useState(false);
  const { detect: detectAddrLocation, detecting: detectingAddrLoc } = useGeolocatedAddress({ onError: (msg) => toast.error(msg) });
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [exitConfirmEnabled, setExitConfirmEnabled] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('medox_exit_confirm');
      if (stored !== null) {
        setExitConfirmEnabled(stored !== 'false');
      }
    }
  }, []);

  // Auto-fetch City and State from Pincode
  useEffect(() => {
    const fetchPincode = async () => {
      const pin = newAddress.pincode.replace(/\D/g, '');
      if (pin.length === 6) {
        setPincodeLoading(true);
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
          const data = await res.json();
          if (data && data[0]?.Status === 'Success') {
            const postOffice = data[0].PostOffice[0];
            setNewAddress(prev => ({
              ...prev,
              city: postOffice.District || postOffice.Block || prev.city,
              state: postOffice.State || prev.state
            }));
          } else {
            toast.error('Invalid Pincode entered');
          }
        } catch (err) {
          console.error('Failed to fetch pincode data', err);
        } finally {
          setPincodeLoading(false);
        }
      }
    };
    fetchPincode();
  }, [newAddress.pincode]);

  const autoFillAddressLocation = async () => {
    try {
      const parsed = await detectAddrLocation();
      setNewAddress(prev => ({
        ...prev,
        address: parsed.streetAddress || prev.address,
        city: parsed.city || prev.city,
        state: parsed.state || prev.state,
        pincode: parsed.pincode || prev.pincode
      }));
      toast.success('Location fields autofilled!');
    } catch {
      // error toast already shown by the hook
    }
  };

  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    storeName: '',
    phone: '',
    gstNumber: '',
    address: '',
  });

  const { refreshUser, logout } = useAuth();

  const handleOpenEdit = async () => {
    setProfileForm({
      name: user?.name || '',
      storeName: '',
      phone: '',
      gstNumber: '',
      address: '',
    });

    if (user?.role === 'vendor') {
      setEditLoading(true);
      try {
        const res = await api.get('/vendors/me');
        const v = res.data;
        setProfileForm({
          name: '',
          storeName: v.storeName || '',
          phone: v.phone || '',
          gstNumber: v.gstNumber || '',
          address: v.address || '',
        });
      } catch {
        toast.error('Failed to load vendor details');
      } finally {
        setEditLoading(false);
      }
    }
    setShowEditModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      if (user?.role === 'vendor') {
        await api.put('/vendors/me', {
          storeName: profileForm.storeName,
          phone: profileForm.phone,
          gstNumber: profileForm.gstNumber,
          address: profileForm.address,
        });
      } else {
        await api.put('/user/profile', { name: profileForm.name });
      }
      await refreshUser();
      toast.success('Account details updated!');
      setShowEditModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to update details');
    } finally {
      setSavingAddress(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push('/signin');
  }, [user, authLoading, router]);

  const fetchSeq = useRef(0);
  const fetchData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const seq = ++fetchSeq.current; // ignore responses from older requests
    setFetchError(false);
    try {
      const res = await api.get('/user/addresses');
      if (seq !== fetchSeq.current) return;
      const addrs = res.data || [];
      setAddresses(addrs);
    } catch {
      if (seq === fetchSeq.current) setFetchError(true);
    } finally {
      if (seq === fetchSeq.current) setLoading(false);
    }
  };

  // Counts for the profile header (best-effort; failures just hide the number).
  const [counts, setCounts] = useState<{ orders: number | null; wishlist: number | null }>({ orders: null, wishlist: null });
  useEffect(() => {
    if (!user?.uid) return;
    api.get('/orders/my').then(r => setCounts(c => ({ ...c, orders: (r.data || []).length }))).catch(() => {});
    api.get('/user/wishlist').then(r => setCounts(c => ({ ...c, wishlist: (r.data?.wishlistIds || []).length }))).catch(() => {});
  }, [user?.uid]);

  const [showAddresses, setShowAddresses] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, [user?.uid]);

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.fullName.trim()) {
      toast.error('Please enter a full name.');
      return;
    }
    if (newAddress.phone.replace(/\D/g, '').length !== 10) {
      toast.error('Please enter a valid 10-digit phone number.');
      return;
    }
    if (!newAddress.address.trim() || !newAddress.city.trim() || !newAddress.state.trim()) {
      toast.error('Please fill in the address, city, and state.');
      return;
    }
    if (!/^\d{6}$/.test(newAddress.pincode.trim())) {
      toast.error('Please enter a valid 6-digit Pincode.');
      return;
    }

    setSavingAddress(true);
    try {
      await api.post('/user/addresses', newAddress);
      toast.success('Address saved!');
      setShowAddForm(false);
      setNewAddress({ fullName: '', phone: '', address: '', city: '', state: '', pincode: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to save address');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await api.delete(`/user/addresses/${id}`);
      toast.success('Address removed');
      fetchData();
    } catch {
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      await api.patch(`/user/addresses/${id}/default`);
      toast.success('Default address updated');
      fetchData();
    } catch {
      toast.error('Failed to set default address');
    }
  };

  const fieldCls =
    'w-full h-12 px-4 bg-white border border-line rounded-xl text-[15px] text-ink placeholder:text-gray-400 outline-none transition-[border-color,box-shadow] duration-200 focus:border-ink focus:ring-4 focus:ring-black/[0.04] disabled:bg-gray-50 disabled:text-gray-400';
  const labelCls = 'block text-[13px] font-medium text-ink mb-1.5';

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-page">
        <Navbar />
        <div className="bg-nav-bg rounded-b-[28px] px-4 sm:px-6 pt-4 pb-6">
          <div className="max-w-2xl mx-auto flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/10 animate-pulse" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-4 w-36 rounded bg-white/10 animate-pulse" />
              <div className="h-3 w-28 rounded bg-white/10 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-4">
          <Skeleton className="h-52 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>
      </main>
    );
  }
  if (!user) return null;

  const initial = (user.name || 'U').trim().charAt(0).toUpperCase();
  const roleLabel = user.role === 'buyer' ? 'Customer' : user.role === 'vendor' ? 'Seller' : 'Admin';
  const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];

  const stats = [
    { label: 'Orders', value: counts.orders, href: '/account/orders' },
    { label: 'Wishlist', value: counts.wishlist, href: '/account/wishlist' },
    { label: 'Addresses', value: addresses.length, onClick: () => setShowAddresses(true) },
  ];

  return (
    <main className="bg-page min-h-screen pb-20">
      <Navbar />

      {/* Profile header — continues the dark navbar */}
      <section className="bg-nav-bg text-white rounded-b-[28px] px-4 sm:px-6 pt-3 pb-5 sm:pt-6 sm:pb-7 -mt-px">
        <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-1 duration-500">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gold-primary text-ink grid place-items-center text-[26px] font-semibold shrink-0 ring-4 ring-white/[0.06]">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-[20px] sm:text-[22px] font-semibold truncate">{user.name || 'Your account'}</h1>
              <p className="text-[13.5px] text-white/60 truncate">{displayContact(user.email)}</p>
              <span className="inline-block mt-1.5 text-[11px] font-medium text-gold-primary bg-gold-primary/10 border border-gold-primary/20 rounded-full px-2 py-0.5">
                {roleLabel}
              </span>
            </div>
            <button
              onClick={handleOpenEdit}
              aria-label="Edit profile"
              className="pressable shrink-0 h-9 px-3.5 rounded-full bg-white/[0.08] border border-white/10 text-white text-[13px] font-medium flex items-center gap-1.5 hover:bg-white/[0.12]"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 mt-5 rounded-2xl bg-white/[0.05] border border-white/[0.08] divide-x divide-white/[0.08]">
            {stats.map(s => {
              const inner = (
                <>
                  <span className="text-[20px] font-semibold tabular-nums leading-none">
                    {s.value === null ? <span className="inline-block w-5 h-4 rounded bg-white/10 animate-pulse align-middle" /> : s.value}
                  </span>
                  <span className="text-[12px] text-white/60 mt-1.5">{s.label}</span>
                </>
              );
              const cls = 'pressable flex flex-col items-center py-3.5 border-none bg-transparent text-white';
              return s.href
                ? <Link key={s.label} href={s.href} className={cls}>{inner}</Link>
                : <button key={s.label} type="button" onClick={s.onClick} className={cls}>{inner}</button>;
            })}
          </div>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8 flex flex-col gap-5">

        {/* No address prompt */}
        {user.role === 'buyer' && !fetchError && addresses.length === 0 && (
          <button
            onClick={() => setShowAddForm(true)}
            className="pressable w-full flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left animate-in fade-in duration-300"
          >
            <MapPin className="w-5 h-5 text-amber-700 shrink-0" />
            <span className="flex-1">
              <span className="block text-[14px] font-semibold text-amber-950">Add a delivery address</span>
              <span className="block text-[12.5px] text-amber-900/75">Needed before you can check out</span>
            </span>
            <Plus className="w-5 h-5 text-amber-800" />
          </button>
        )}

        {/* Activity */}
        <div>
          <h2 className="text-[13px] font-medium text-text-muted mb-2 px-1">Your activity</h2>
          <div className="bg-white rounded-2xl border border-line divide-y divide-line overflow-hidden">
            <Row icon={Package} title="Orders" subtitle="Track, return or buy again" href="/account/orders" />
            <Row icon={Heart} title="Wishlist" subtitle="Items you've saved" href="/account/wishlist" />
            <Row
              icon={MapPin}
              title="Saved addresses"
              subtitle={defaultAddr ? `${defaultAddr.fullName} · ${defaultAddr.city} ${defaultAddr.pincode}` : 'Add where we should deliver'}
              onClick={() => setShowAddresses(true)}
            />
          </div>
        </div>

        {/* Support & settings */}
        <div>
          <h2 className="text-[13px] font-medium text-text-muted mb-2 px-1">Support &amp; settings</h2>
          <div className="bg-white rounded-2xl border border-line divide-y divide-line overflow-hidden">
            <Row icon={HelpCircle} title="Help & guides" subtitle="FAQs, GST, returns, contact us" onClick={() => window.dispatchEvent(new Event('open-help-modal'))} />
            <Row
              icon={Shield}
              title="Confirm before exiting"
              subtitle="Ask before closing the app from home"
              trailing={
                <button
                  type="button"
                  role="switch"
                  aria-checked={exitConfirmEnabled}
                  aria-label="Confirm before exiting"
                  onClick={() => {
                    const nextVal = !exitConfirmEnabled;
                    setExitConfirmEnabled(nextVal);
                    localStorage.setItem('medox_exit_confirm', String(nextVal));
                  }}
                  className={`relative shrink-0 w-[46px] h-7 rounded-full border-none p-0 transition-colors duration-300 ${exitConfirmEnabled ? 'bg-emerald-500' : 'bg-gray-200'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition-transform duration-300 ease-[var(--ease-out-expo)] ${exitConfirmEnabled ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                </button>
              }
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-line overflow-hidden">
          <Row icon={LogOut} title="Sign out" onClick={handleLogout} tone="danger" />
        </div>
      </div>

      {/* Address book */}
      <Sheet
        open={showAddresses}
        onClose={() => setShowAddresses(false)}
        side="bottom"
        label="Saved addresses"
        className="sm:max-w-lg sm:mx-auto sm:bottom-6 sm:rounded-[20px]"
      >
        <div data-sheet-handle className="px-5 pt-1 pb-3 flex items-center justify-between touch-none">
          <h3 className="text-[17px] font-semibold text-ink">Saved addresses <span className="text-text-muted font-normal text-[14px]">{addresses.length}/5</span></h3>
          <button onClick={() => setShowAddresses(false)} aria-label="Close" className="pressable -mr-2 w-10 h-10 grid place-items-center rounded-full text-gray-500 hover:bg-gray-100 border-none bg-transparent">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 pb-5 overflow-y-auto overscroll-contain flex flex-col gap-3">
          {fetchError ? (
            <ErrorState message="Failed to load addresses." />
          ) : addresses.length === 0 ? (
            <p className="text-center text-[14px] text-text-muted py-6">No saved addresses yet</p>
          ) : (
            addresses.map(addr => (
              <div key={addr.id} className={`rounded-2xl border p-4 ${addr.isDefault ? 'border-ink' : 'border-line'}`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-[14.5px] font-semibold text-ink truncate">{addr.fullName}</h4>
                  {addr.isDefault && (
                    <span className="shrink-0 flex items-center gap-1 text-[11px] font-medium text-white bg-ink px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Default
                    </span>
                  )}
                </div>
                <p className="text-[13.5px] text-gray-600 leading-relaxed">
                  {addr.address}, {addr.city}, {addr.state} {addr.pincode}
                </p>
                <p className="flex items-center gap-1.5 text-[13px] text-text-muted mt-1">
                  <Phone className="w-3.5 h-3.5" /> {addr.phone}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  {!addr.isDefault && (
                    <button onClick={() => handleSetDefaultAddress(addr.id)} className="pressable h-8 px-3 rounded-full border border-line text-[12.5px] font-medium text-ink hover:bg-gray-50">
                      Set as default
                    </button>
                  )}
                  <button onClick={() => handleDeleteAddress(addr.id)} className="pressable h-8 px-3 rounded-full text-[12.5px] font-medium text-red-600 hover:bg-red-50 flex items-center gap-1">
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            ))
          )}
          {addresses.length < 5 && (
            <button
              onClick={() => { setShowAddresses(false); setTimeout(() => setShowAddForm(true), 250); }}
              className="pressable w-full h-12 rounded-full bg-ink text-white text-[15px] font-semibold flex items-center justify-center gap-2 border-none"
            >
              <Plus className="w-4 h-4" /> Add new address
            </button>
          )}
        </div>
      </Sheet>

      {/* Add address */}
      <Sheet
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        side="bottom"
        label="Add address"
        className="sm:max-w-lg sm:mx-auto sm:bottom-6 sm:rounded-[20px]"
      >
        <div data-sheet-handle className="px-5 pt-1 pb-3 flex items-center justify-between touch-none">
          <h3 className="text-[17px] font-semibold text-ink">Add address</h3>
          <button onClick={() => setShowAddForm(false)} aria-label="Close" className="pressable -mr-2 w-10 h-10 grid place-items-center rounded-full text-gray-500 hover:bg-gray-100 border-none bg-transparent">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSaveAddress} className="px-5 pb-5 overflow-y-auto overscroll-contain flex flex-col gap-3.5">
          <button
            type="button"
            onClick={autoFillAddressLocation}
            disabled={detectingAddrLoc}
            className="pressable flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-line bg-gray-50 text-ink text-[14px] font-medium hover:bg-gray-100 disabled:opacity-50"
          >
            <MapPin className="w-4 h-4" />
            {detectingAddrLoc ? 'Detecting location…' : 'Use current location'}
          </button>
          <div>
            <label className={labelCls}>Full name</label>
            <input required autoComplete="name" value={newAddress.fullName} onChange={e => setNewAddress({ ...newAddress, fullName: e.target.value })} className={fieldCls} />
          </div>
          <div>
            <label className={labelCls}>Phone number</label>
            <input required type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} placeholder="10 digits" value={newAddress.phone} onChange={e => setNewAddress({ ...newAddress, phone: e.target.value.replace(/\D/g, '') })} className={fieldCls} />
          </div>
          <div>
            <label className={labelCls}>Address</label>
            <textarea required autoComplete="street-address" placeholder="House / flat no., street, landmark" value={newAddress.address} onChange={e => setNewAddress({ ...newAddress, address: e.target.value })} className={`${fieldCls} h-auto py-3 resize-none`} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Pincode</label>
              <input required inputMode="numeric" autoComplete="postal-code" maxLength={6} pattern="\d{6}" title="6-digit pincode" value={newAddress.pincode} onChange={e => setNewAddress({ ...newAddress, pincode: e.target.value.replace(/\D/g, '') })} className={fieldCls} />
            </div>
            <div>
              <label className={labelCls}>City</label>
              <input required autoComplete="address-level2" value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} className={fieldCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>State</label>
            <input required autoComplete="address-level1" value={newAddress.state} readOnly={pincodeLoading} onChange={e => setNewAddress({ ...newAddress, state: e.target.value })} className={fieldCls} />
          </div>
          <button type="submit" disabled={savingAddress} className="pressable mt-1 w-full h-12 rounded-full bg-gold-primary hover:bg-gold-hover text-ink text-[15px] font-semibold border-none disabled:opacity-50 flex items-center justify-center gap-2">
            {savingAddress && <Loader2 className="w-4 h-4 animate-spin" />}
            {savingAddress ? 'Saving…' : 'Save address'}
          </button>
        </form>
      </Sheet>

      {/* Edit profile */}
      <Sheet
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        side="bottom"
        label="Edit profile"
        className="sm:max-w-md sm:mx-auto sm:bottom-6 sm:rounded-[20px]"
      >
        <div data-sheet-handle className="px-5 pt-1 pb-3 flex items-center justify-between touch-none">
          <h3 className="text-[17px] font-semibold text-ink">Edit profile</h3>
          <button onClick={() => setShowEditModal(false)} aria-label="Close" className="pressable -mr-2 w-10 h-10 grid place-items-center rounded-full text-gray-500 hover:bg-gray-100 border-none bg-transparent">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSaveProfile} className="px-5 pb-5 overflow-y-auto overscroll-contain flex flex-col gap-3.5">
          {editLoading ? (
            <div className="flex flex-col gap-3 py-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
          ) : (
            <>
              {user?.role !== 'vendor' ? (
                <div>
                  <label className={labelCls}>Name</label>
                  <input type="text" required autoComplete="name" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} className={fieldCls} />
                </div>
              ) : (
                <>
                  <div>
                    <label className={labelCls}>Store name</label>
                    <input type="text" required value={profileForm.storeName} onChange={e => setProfileForm({ ...profileForm, storeName: e.target.value })} className={fieldCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Phone number</label>
                    <input type="tel" disabled value={profileForm.phone} className={fieldCls} />
                  </div>
                  <div>
                    <label className={labelCls}>GSTIN <span className="text-text-muted font-normal">(optional)</span></label>
                    <input type="text" value={profileForm.gstNumber} onChange={e => setProfileForm({ ...profileForm, gstNumber: e.target.value })} className={fieldCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Business address</label>
                    <textarea required rows={2} value={profileForm.address} onChange={e => setProfileForm({ ...profileForm, address: e.target.value })} className={`${fieldCls} h-auto py-3 resize-none`} />
                  </div>
                </>
              )}
              <button type="submit" disabled={savingAddress} className="pressable mt-1 w-full h-12 rounded-full bg-gold-primary hover:bg-gold-hover text-ink text-[15px] font-semibold border-none disabled:opacity-50 flex items-center justify-center gap-2">
                {savingAddress && <Loader2 className="w-4 h-4 animate-spin" />}
                {savingAddress ? 'Saving…' : 'Save changes'}
              </button>
            </>
          )}
        </form>
      </Sheet>
    </main>
  );
}