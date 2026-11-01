'use client';

import Link from 'next/link';
import { displayContact } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Home,
  Heart,
  ShoppingBag,
  User,
  Download,
  Package,
  MapPin,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  HelpCircle,
  Search,
  X,
  LogOut,
  LayoutDashboard,
  Store,
  Navigation,
} from 'lucide-react';
import { useState, useEffect, Suspense, useRef } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useIsInApp } from '@/hooks/useIsInApp';
import { GooglePlayButton, AppStoreButton } from '@/components/AppStoreBadges';
import MegaMenu from '@/components/MegaMenu';
import CartDrawer from '@/components/CartDrawer';
import Sheet from '@/components/ui/Sheet';
import { useGeolocatedAddress } from '@/hooks/useGeolocatedAddress';

/* ---------------------------------------------------------------- */
/* Search                                                            */
/* ---------------------------------------------------------------- */

const searchShell =
  'order-3 md:order-2 w-full md:flex-1 md:max-w-[640px] flex items-center h-10 md:h-11 rounded-xl bg-white/[0.08] border border-white/[0.06] transition-colors duration-200 focus-within:bg-white focus-within:border-white';

function SearchBarInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    inputRef.current?.blur(); // dismiss the mobile keyboard
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/');
    }
  };

  return (
    <form onSubmit={handleSearch} role="search" className={`group ${searchShell}`}>
      <Search className="w-[18px] h-[18px] ml-3.5 shrink-0 text-white/50 group-focus-within:text-gray-500 transition-colors" />
      <input
        ref={inputRef}
        type="search"
        enterKeyHint="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search medical supplies"
        aria-label="Search products"
        className="flex-1 min-w-0 h-full bg-transparent border-none outline-none px-3 text-[15px] text-white placeholder:text-white/50 group-focus-within:text-ink group-focus-within:placeholder:text-gray-400 [&::-webkit-search-cancel-button]:hidden"
        suppressHydrationWarning
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => { setSearchQuery(''); inputRef.current?.focus(); }}
          aria-label="Clear search"
          className="pressable w-8 h-8 mr-1 grid place-items-center rounded-full text-white/60 group-focus-within:text-gray-400 hover:bg-black/5 border-none bg-transparent"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </form>
  );
}

/* ---------------------------------------------------------------- */
/* Account menu content (shared by desktop popover + mobile sheet)   */
/* ---------------------------------------------------------------- */

function MenuRow({
  href,
  onClick,
  icon: Icon,
  children,
  tone = 'default',
}: {
  href?: string;
  onClick?: () => void;
  icon: React.ElementType;
  children: React.ReactNode;
  tone?: 'default' | 'danger';
}) {
  const cls = `pressable w-full flex items-center gap-3 px-3 h-11 rounded-lg text-[14px] text-left border-none bg-transparent ${
    tone === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-ink hover:bg-gray-50'
  }`;
  const inner = (
    <>
      <Icon className={`w-[18px] h-[18px] shrink-0 ${tone === 'danger' ? 'text-red-500' : 'text-gray-400'}`} />
      <span className="flex-1">{children}</span>
      {href && <ChevronRight className="w-4 h-4 text-gray-300 md:hidden" />}
    </>
  );
  return href ? (
    <Link href={href} onClick={onClick} className={cls}>{inner}</Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>{inner}</button>
  );
}

function AccountMenu({ onNavigate, onLogout }: { onNavigate: () => void; onLogout: () => void }) {
  const { user, loading } = useAuth();
  const { isInApp } = useIsInApp();

  return (
    <div className="flex flex-col">
      {!loading && !user ? (
        <div className="px-3 pt-1 pb-4 mb-2 border-b border-line">
          <p className="text-[13px] text-text-muted mb-3">Sign in to track orders, save items and check out faster.</p>
          <div className="flex gap-2">
            <Link
              href="/signin"
              onClick={onNavigate}
              className="pressable flex-1 h-10 grid place-items-center rounded-full bg-ink text-white text-sm font-semibold hover:bg-black"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              onClick={onNavigate}
              className="pressable flex-1 h-10 grid place-items-center rounded-full border border-line text-ink text-sm font-semibold hover:bg-gray-50"
            >
              Create account
            </Link>
          </div>
        </div>
      ) : user ? (
        <div className="px-3 pt-1 pb-3 mb-2 border-b border-line flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold-light text-gold-ink grid place-items-center font-semibold">
            {(user.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-semibold text-ink truncate">{user.name || 'Your account'}</div>
            {user.email && <div className="text-[12px] text-text-muted truncate">{displayContact(user.email)}</div>}
          </div>
        </div>
      ) : null}

      <MenuRow href="/account" onClick={onNavigate} icon={User}>Your account</MenuRow>
      <MenuRow href="/account/orders" onClick={onNavigate} icon={Package}>Orders</MenuRow>
      <MenuRow href="/account/wishlist" onClick={onNavigate} icon={Heart}>Wishlist</MenuRow>
      <MenuRow
        onClick={() => { onNavigate(); window.dispatchEvent(new Event('open-help-modal')); }}
        icon={HelpCircle}
      >
        Help &amp; guides
      </MenuRow>

      {user?.role === 'admin' && (
        <MenuRow href="/admin" onClick={onNavigate} icon={LayoutDashboard}>Admin dashboard</MenuRow>
      )}
      {user?.role === 'vendor' && (
        <MenuRow href="/vendor/dashboard" onClick={onNavigate} icon={LayoutDashboard}>Seller dashboard</MenuRow>
      )}
      {(!user || user.role === 'buyer') && (
        <MenuRow href="/vendor/register" onClick={onNavigate} icon={Store}>Sell on MedoxAtoZ</MenuRow>
      )}

      {!isInApp && (!user || user.role === 'buyer') && (
        <div className="mt-2 pt-3 px-3 border-t border-line">
          <div className="text-[12px] font-medium text-text-muted mb-2">Get the app</div>
          <div className="flex flex-wrap gap-2">
            <GooglePlayButton size="md" />
            <AppStoreButton size="md" />
          </div>
        </div>
      )}

      {user && (
        <div className="mt-2 pt-2 border-t border-line">
          <MenuRow onClick={onLogout} icon={LogOut} tone="danger">Sign out</MenuRow>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Navbar                                                            */
/* ---------------------------------------------------------------- */

export default function Navbar({ hideTabBar = false }: { hideTabBar?: boolean } = {}) {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [cartPulse, setCartPulse] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [location, setLocation] = useState('India');
  const { detect: detectLocationRaw, detecting: loadingLocation } = useGeolocatedAddress({ onError: (msg) => toast.error(msg) });
  const { isInApp } = useIsInApp();

  // Desktop account popover (hover-intent + click) and mobile account sheet.
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isAccountSheetOpen, setIsAccountSheetOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const [settingLocationId, setSettingLocationId] = useState<string | null>(null);
  const locationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedLoc = localStorage.getItem('medox_location');
    if (savedLoc) setLocation(savedLoc);
  }, []);

  // Close desktop popovers on outside click.
  useEffect(() => {
    const handle = (event: MouseEvent) => {
      const t = event.target as Node;
      if (locationRef.current && !locationRef.current.contains(t)) setIsLocationOpen(false);
      if (accountRef.current && !accountRef.current.contains(t)) setIsAccountOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // Close menus on route change.
  useEffect(() => {
    setIsAccountOpen(false);
    setIsLocationOpen(false);
    setIsAccountSheetOpen(false);
  }, [pathname]);

  const loadAddresses = () => {
    if (!addressesLoaded && user) {
      api.get('/user/addresses')
        .then(res => setSavedAddresses(res.data || []))
        .catch(() => {})
        .finally(() => setAddressesLoaded(true));
    }
  };

  const openLocationPicker = () => {
    setIsLocationOpen(o => !o);
    loadAddresses();
  };

  const detectLocation = async () => {
    setIsLocationOpen(false);
    try {
      const parsed = await detectLocationRaw();
      const displayLoc = parsed.city ? `${parsed.city}, ${parsed.state}` : parsed.state || 'India';
      localStorage.setItem('medox_location', displayLoc);
      setLocation(displayLoc);
      toast.success(`Delivering to ${displayLoc}`);
    } catch {
      // error toast already shown by the hook
    }
  };

  const selectSavedAddress = async (addr: any) => {
    const displayLoc = `${addr.city}, ${addr.state}`;
    localStorage.setItem('medox_location', displayLoc);
    setLocation(displayLoc);
    setIsLocationOpen(false);
    if (addr.isDefault) return;
    setSettingLocationId(addr.id);
    try {
      await api.patch(`/user/addresses/${addr.id}/default`);
      setSavedAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === addr.id })));
    } catch {
      toast.error('Failed to update saved location');
    } finally {
      setSettingLocationId(null);
    }
  };

  useEffect(() => {
    const fetchCartCount = () => {
      if (user) {
        api.get('/cart')
          .then(res => {
            const totalItems = res.data.reduce((acc: number, item: any) => acc + item.quantity, 0);
            setCartCount(totalItems);
          })
          .catch(err => console.error('Failed to fetch cart count', err));
      } else {
        setCartCount(0);
      }
    };

    fetchCartCount();

    const handleCartUpdated = () => {
      fetchCartCount();
      setCartPulse(p => p + 1); // re-keys the badge so the pop animation replays
    };
    const handleOpenCart = () => setIsCartOpen(true);

    window.addEventListener('cart-updated', handleCartUpdated);
    window.addEventListener('open-cart', handleOpenCart);
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdated);
      window.removeEventListener('open-cart', handleOpenCart);
    };
  }, [user]);

  const handleLogout = async () => {
    await logout();
    setIsAccountOpen(false);
    setIsAccountSheetOpen(false);
    router.push('/');
  };

  const openAccountHover = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setIsAccountOpen(true), 80);
  };
  const closeAccountHover = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setIsAccountOpen(false), 160);
  };

  const firstName = !loading && user?.name ? user.name.split(' ')[0] : null;

  const popover = (open: boolean) =>
    `absolute top-full right-0 mt-2 bg-white rounded-2xl border border-line shadow-[0_12px_40px_rgba(16,24,40,0.14)] origin-top-right transition-[opacity,transform] duration-200 ease-[var(--ease-out-expo)] ${
      open ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-[0.97] -translate-y-1 pointer-events-none'
    }`;

  const navBtn =
    'pressable hidden md:flex items-center gap-2 h-10 px-3 rounded-lg text-[14px] font-medium text-white/80 hover:text-white hover:bg-white/[0.08] border-none bg-transparent';

  const tabs = [
    { href: '/', label: 'Home', icon: Home, active: pathname === '/' },
    { href: '/account/wishlist', label: 'Wishlist', icon: Heart, active: pathname === '/account/wishlist' },
    { href: null, label: 'Cart', icon: ShoppingBag, active: isCartOpen },
    { href: '/account/orders', label: 'Orders', icon: Package, active: !!pathname?.startsWith('/account/orders') },
    { href: '/account', label: 'Account', icon: User, active: pathname === '/account' },
  ];
  // While the cart is open, highlight Cart; otherwise the current page's tab.
  const activeTab = isCartOpen ? 2 : tabs.findIndex((t) => t.active);

  return (
    <>
      <header className="bg-nav-bg sticky top-0 z-[1000] pt-safe">
        <div className="max-w-[1500px] mx-auto flex flex-wrap md:flex-nowrap items-center justify-between gap-x-6 gap-y-2.5 px-4 md:px-6 py-2.5 md:py-0 md:h-[72px]">

          {/* Logo */}
          <Link href="/" className="order-1 shrink-0 flex items-center pressable" aria-label="MedoxAtoZ home">
            <img src="/logo.webp" alt="MedoxAtoZ" className="h-10 md:h-14 w-auto object-contain" />
          </Link>

          {/* Search */}
          <Suspense
            fallback={
              <div className={searchShell}>
                <Search className="w-[18px] h-[18px] ml-3.5 text-white/50" />
                <span className="px-3 text-[15px] text-white/50">Search medical supplies</span>
              </div>
            }
          >
            <SearchBarInput />
          </Suspense>

          {/* Actions */}
          <div className="order-2 md:order-3 flex items-center gap-1">

            {/* Mobile: compact location + account */}
            <button
              onClick={detectLocation}
              className="pressable md:hidden flex items-center gap-1 h-9 px-2.5 rounded-full text-[12px] text-white/75 bg-white/[0.06] border-none max-w-[150px]"
              aria-label="Set delivery location"
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{loadingLocation ? 'Locating…' : location}</span>
            </button>
            <button
              onClick={() => setIsAccountSheetOpen(true)}
              aria-label="Account menu"
              className="pressable md:hidden w-9 h-9 grid place-items-center rounded-full text-white/85 bg-white/[0.06] border-none ml-1"
            >
              <User className="w-[18px] h-[18px]" />
            </button>

            {/* Desktop: location */}
            <div className="relative hidden md:block" ref={locationRef}>
              <button onClick={openLocationPicker} className={navBtn} aria-expanded={isLocationOpen}>
                <MapPin className="w-[18px] h-[18px] text-white/60" />
                <span className="flex flex-col items-start leading-tight">
                  <span className="text-[11px] text-white/50 font-normal">Deliver to</span>
                  <span className="text-[13px] max-w-[130px] truncate">{loadingLocation ? 'Detecting…' : location}</span>
                </span>
              </button>

              <div className={`${popover(isLocationOpen)} w-80 overflow-hidden z-[1100] text-text-main`}>
                <div className="p-2">
                  <button
                    onClick={detectLocation}
                    disabled={loadingLocation}
                    className="pressable w-full flex items-center gap-3 px-3 h-11 rounded-lg text-[14px] font-medium text-ink hover:bg-gray-50 disabled:opacity-50 border-none bg-transparent"
                  >
                    <Navigation className="w-4 h-4 text-gold-ink" />
                    {loadingLocation ? 'Detecting location…' : 'Use current location'}
                  </button>
                </div>

                {user && (
                  <div className="max-h-64 overflow-y-auto border-t border-line p-2">
                    <div className="px-3 pt-1 pb-2 text-[11px] font-medium uppercase tracking-wide text-text-muted">Saved addresses</div>
                    {!addressesLoaded ? (
                      <div className="px-3 py-2 text-[13px] text-text-muted">Loading…</div>
                    ) : savedAddresses.length === 0 ? (
                      <div className="px-3 py-2 text-[13px] text-text-muted">No saved addresses yet.</div>
                    ) : (
                      savedAddresses.map(addr => (
                        <button
                          key={addr.id}
                          onClick={() => selectSavedAddress(addr)}
                          disabled={settingLocationId === addr.id}
                          className="w-full text-left px-3 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-start gap-2.5 disabled:opacity-50 border-none bg-transparent"
                        >
                          {addr.isDefault ? (
                            <CheckCircle2 className="w-4 h-4 text-gold-ink shrink-0 mt-0.5" />
                          ) : (
                            <span className="w-4 h-4 shrink-0" />
                          )}
                          <span className="min-w-0">
                            <span className="font-medium text-ink block truncate">{addr.fullName}</span>
                            <span className="text-text-muted text-xs block truncate">{addr.address}, {addr.city}, {addr.state} {addr.pincode}</span>
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}

                <Link
                  href={user ? '/account' : '/signin'}
                  onClick={() => setIsLocationOpen(false)}
                  className="block text-center py-3 text-[13px] font-medium text-ink hover:bg-gray-50 transition-colors border-t border-line"
                >
                  {user ? 'Add a new address' : 'Sign in to use a saved address'}
                </Link>
              </div>
            </div>

            {/* Desktop: account */}
            <div
              className="relative hidden md:block"
              ref={accountRef}
              onMouseEnter={openAccountHover}
              onMouseLeave={closeAccountHover}
            >
              <button
                onClick={() => setIsAccountOpen(o => !o)}
                className={navBtn}
                aria-expanded={isAccountOpen}
                aria-haspopup="menu"
              >
                <User className="w-[18px] h-[18px] text-white/60" />
                <span className="flex flex-col items-start leading-tight">
                  <span className="text-[11px] text-white/50 font-normal">{firstName ? `Hello, ${firstName}` : 'Hello, sign in'}</span>
                  <span className="text-[13px] flex items-center gap-1">
                    Account
                    <ChevronDown className={`w-3.5 h-3.5 text-white/50 transition-transform duration-200 ${isAccountOpen ? 'rotate-180' : ''}`} />
                  </span>
                </span>
              </button>
              {/* Invisible bridge so the pointer can travel into the popover. */}
              <div className="absolute top-full right-0 h-3 w-full" aria-hidden />
              <div className={`${popover(isAccountOpen)} w-[300px] p-2 z-[1100]`} role="menu">
                <AccountMenu onNavigate={() => setIsAccountOpen(false)} onLogout={handleLogout} />
              </div>
            </div>

            {!isInApp && (
              <Link href="/download" className={navBtn}>
                <Download className="w-[18px] h-[18px] text-white/60" />
                <span>App</span>
              </Link>
            )}

            <Link href="/account/orders" className={navBtn}>
              <Package className="w-[18px] h-[18px] text-white/60" />
              <span>Orders</span>
            </Link>

            {/* Desktop: cart */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="pressable relative hidden md:flex items-center gap-2 h-10 pl-3 pr-4 ml-2 rounded-lg bg-gold-primary text-ink text-[14px] font-semibold hover:bg-gold-hover border-none"
            >
              <ShoppingBag className="w-[18px] h-[18px]" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span
                  key={cartPulse}
                  className="badge-pop ml-0.5 min-w-[20px] h-5 px-1.5 rounded-full bg-ink text-white text-[11px] font-semibold grid place-items-center tabular-nums"
                >
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Categories strip (home + category pages) */}
      {(pathname === '/' || pathname?.startsWith('/categories')) && <MegaMenu />}

      {/* Mobile bottom tab bar — floating dark capsule that matches the header */}
      {!hideTabBar && (
      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-[999] px-3 pb-[max(10px,env(safe-area-inset-bottom))] pointer-events-none"
        aria-label="Primary"
      >
        <div className="pointer-events-auto relative mx-auto max-w-[480px] h-[var(--tabbar-h)] rounded-[22px] bg-nav-bg/95 backdrop-blur-xl backdrop-saturate-150 border border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.28)] p-1.5">
          <div className="relative flex h-full">
            {/* Sliding highlight */}
            {activeTab >= 0 && (
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 rounded-[16px] bg-white/[0.09] transition-transform duration-500 ease-[var(--ease-out-expo)]"
                style={{ width: `${100 / tabs.length}%`, transform: `translateX(${activeTab * 100}%)` }}
              />
            )}
            {tabs.map(({ href, label, icon: Icon, active }) => {
              const content = (
                <>
                  <span className="relative">
                    <Icon
                      className={`w-[22px] h-[22px] transition-[color,transform] duration-300 ease-[var(--ease-out-expo)] ${
                        active ? 'text-gold-primary stroke-[2.2] -translate-y-px' : 'text-white/55 stroke-[1.8]'
                      }`}
                    />
                    {label === 'Cart' && cartCount > 0 && (
                      <span
                        key={cartPulse}
                        className="badge-pop absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-gold-primary text-ink text-[10px] font-bold grid place-items-center ring-2 ring-nav-bg tabular-nums"
                      >
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    )}
                  </span>
                  <span className={`text-[10.5px] mt-1 leading-none transition-colors duration-300 ${active ? 'text-white font-semibold' : 'text-white/50 font-medium'}`}>
                    {label}
                  </span>
                </>
              );
              const cls = 'pressable relative flex-1 flex flex-col items-center justify-center rounded-[16px] border-none bg-transparent';
              return href ? (
                <Link key={label} href={href} className={cls} aria-current={active ? 'page' : undefined}>
                  {content}
                </Link>
              ) : (
                <button key={label} type="button" onClick={() => setIsCartOpen(true)} className={cls}>
                  {content}
                </button>
              );
            })}
          </div>
        </div>
      </nav>
      )}

      {/* Mobile account sheet */}
      <Sheet
        open={isAccountSheetOpen}
        onClose={() => setIsAccountSheetOpen(false)}
        side="bottom"
        label="Account menu"
        zIndex={3000}
      >
        <div data-sheet-handle className="px-5 pt-1 pb-3 touch-none">
          <h2 className="text-[17px] font-semibold text-ink">Account</h2>
        </div>
        <div className="overflow-y-auto overscroll-contain px-2 pb-4">
          <AccountMenu onNavigate={() => setIsAccountSheetOpen(false)} onLogout={handleLogout} />
        </div>
      </Sheet>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}