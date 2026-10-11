'use client';

import { Suspense, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, LayoutDashboard, Tag } from 'lucide-react';
import CouponsTab from '@/sections/admin/CouponsTab';

function AdminCouponsContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.replace('/signin');
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link
            href="/admin?tab=coupons"
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors text-decoration-none"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Dashboard
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-2 text-sm font-bold text-teal-400">
            <Tag className="w-4 h-4" />
            <span>Coupon & Promo Codes</span>
          </div>
        </div>

        <Link
          href="/admin"
          className="flex items-center gap-2 text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg transition-colors text-decoration-none"
        >
          <LayoutDashboard className="w-3.5 h-3.5" /> Full Panel
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <CouponsTab />
      </main>
    </div>
  );
}

export default function AdminCouponsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      }
    >
      <AdminCouponsContent />
    </Suspense>
  );
}
