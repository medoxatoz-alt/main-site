'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ChevronRight, Package } from 'lucide-react';
import { Skeleton } from '@/components/Skeleton';
import OrderDetailModal from '@/components/OrderDetailModal';
import Pagination from '@/components/Pagination';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  Pending:   'bg-amber-50 text-amber-700 border-amber-200',
  Approved:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected:  'bg-red-50 text-red-700 border-red-200',
  Delivered: 'bg-purple-50 text-purple-700 border-purple-200',
};

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const router = useRouter();

  const [navHeight, setNavHeight] = useState(112);

  useEffect(() => {
    const updateHeight = () => {
      const header = document.querySelector('header');
      if (header) {
        setNavHeight(header.getBoundingClientRect().height);
      }
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    
    const header = document.querySelector('header');
    let observer: ResizeObserver | null = null;
    if (header && window.ResizeObserver) {
      observer = new ResizeObserver(updateHeight);
      observer.observe(header);
    }
    
    return () => {
      window.removeEventListener('resize', updateHeight);
      if (observer) observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.push('/signin');
  }, [user, authLoading, router]);

  const fetchOrders = async () => {
    if (!user) return;
    setFetchError(false);
    try {
      const res = await api.get('/orders/my');
      // Sort newest first
      const sorted = (res.data as any[]).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(sorted);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [user]);

  const header = (
    <div className="flex items-end justify-between gap-3 mb-5 sm:mb-7">
      <div>
        <h1 className="text-[22px] md:text-[28px] font-semibold tracking-tight text-ink">Orders</h1>
        <p className="text-[13px] text-text-muted mt-0.5">Track and manage your purchases</p>
      </div>
      {!loading && orders.length > 0 && (
        <span className="text-[12.5px] font-medium text-text-muted bg-white border border-line rounded-full px-3 h-8 inline-flex items-center tabular-nums">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'}
        </span>
      )}
    </div>
  );

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-page">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          {header}
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-line p-4 flex gap-3">
                <Skeleton className="w-14 h-14 rounded-xl" />
                <div className="flex-1 flex flex-col gap-2 py-1">
                  <Skeleton className="h-3.5 w-2/3 rounded" />
                  <Skeleton className="h-3 w-1/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }
  if (!user) return null;

  return (
    <main className="bg-page min-h-screen pb-20">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {header}

        {fetchError ? (
          <ErrorState message="Failed to load orders. Please try again." showHomeButton />
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center text-center py-16 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-white border border-line grid place-items-center mb-4">
              <Package className="w-7 h-7 text-gray-300" />
            </div>
            <h2 className="text-[17px] font-semibold text-ink">No orders yet</h2>
            <p className="text-[14px] text-text-muted mt-1 max-w-xs">When you place an order, it will show up here.</p>
            <Link href="/" className="pressable mt-6 h-11 px-6 inline-flex items-center rounded-full bg-ink text-white text-[14px] font-semibold hover:bg-black">
              Start shopping
            </Link>
          </div>
        ) : (
          <Pagination items={orders} pageSize={8} showPageInfo renderPage={(slice) => (
            <div className="flex flex-col gap-3">
              {slice.map((order, idx) => {
                const displayStatus = order.status === 'Pending' ? 'Approved' : order.status;
                return (
                  <button
                    type="button"
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    style={{ animationDelay: `${Math.min(idx, 6) * 40}ms` }}
                    className="pressable w-full text-left bg-white rounded-2xl border border-line hover:border-gray-300 hover:shadow-[0_8px_24px_-12px_rgba(16,24,40,0.15)] p-4 sm:p-5 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both"
                  >
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <span className={`text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[displayStatus] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                        {displayStatus}
                      </span>
                      <span className="text-[12.5px] text-text-muted">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="flex -space-x-3 shrink-0">
                        {order.items.slice(0, 3).map((item: any, i: number) => (
                          <img
                            key={i}
                            src={item.image || 'https://via.placeholder.com/40'}
                            alt={item.title}
                            className="w-12 h-12 sm:w-14 sm:h-14 object-contain rounded-xl border-2 border-white bg-gray-50 p-1"
                            style={{ zIndex: 3 - i }}
                          />
                        ))}
                        {order.items.length > 3 && (
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 border-white bg-gray-100 grid place-items-center text-[12px] font-semibold text-gray-500">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-ink truncate">{order.items[0]?.title}</p>
                        <p className="text-[12.5px] text-text-muted mt-0.5">
                          {order.items.length > 1
                            ? `+ ${order.items.length - 1} more item${order.items.length > 2 ? 's' : ''}`
                            : `Qty ${order.items[0]?.qty}`}
                          <span className="mx-1.5">·</span>#{order.orderId}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[15px] font-semibold text-ink tabular-nums">₹{Number(order.totalAmount).toLocaleString('en-IN')}</div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
                    </div>
                  </button>
                );
              })}
            </div>
          )} />
        )}
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          viewerUid={user.uid}
          viewerRole="customer"
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </main>
  );
}