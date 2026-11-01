'use client';

import React from 'react';

/**
 * Shimmer skeleton primitive (GPU-friendly transform sweep).
 */
export function Skeleton({
  className = '',
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={`relative overflow-hidden bg-gray-100 rounded-md before:absolute before:inset-0 before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent ${className}`}
    />
  );
}

/**
 * Product Card Skeleton — mirrors ProductCard's layout so nothing jumps on load.
 */
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-line p-2 sm:p-2.5 flex flex-col">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <div className="px-1 pt-3 sm:px-1.5 flex flex-col gap-2">
        <Skeleton className="h-3.5 w-11/12 rounded" />
        <Skeleton className="h-3.5 w-3/5 rounded" />
        <Skeleton className="h-4 w-1/3 rounded mt-1" />
        <Skeleton className="h-9 w-full rounded-lg mt-1" />
      </div>
    </div>
  );
}

/**
 * Width of one card in a horizontal product row. Shared by the real rows and
 * their skeletons so nothing shifts when products finish loading.
 */
export const RAIL_ITEM_CLASS =
  'snap-start shrink-0 w-[46%] min-w-[150px] max-w-[190px] sm:w-[200px] sm:max-w-none lg:w-[216px] grid';

/** Gap/padding of a horizontal product row (pair with RAIL_ITEM_CLASS). */
export const RAIL_TRACK_CLASS = 'flex gap-2.5 sm:gap-3.5';

/**
 * Horizontal row skeleton: optional title bar + cards sized exactly like the real row.
 */
export function ProductRailSkeleton({ count = 7, title = true, padClass = 'px-4 md:px-0' }: { count?: number; title?: boolean; padClass?: string }) {
  return (
    <div>
      {title && <div className={padClass}><Skeleton className="h-5 w-44 rounded mb-4" /></div>}
      <div className={`${RAIL_TRACK_CLASS} overflow-hidden ${padClass} pb-1`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={RAIL_ITEM_CLASS}><ProductCardSkeleton /></div>
        ))}
      </div>
    </div>
  );
}

/**
 * Product Grid Skeleton
 */
export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-2.5 sm:gap-4 mb-10">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Product Detail Page Skeleton
 */
export function ProductDetailSkeleton() {
  return (
    <div className="max-w-[1500px] w-full mx-auto lg:px-8 py-4 lg:py-12 mt-2">
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-10 items-start px-4 lg:px-0">
        <div className="lg:col-span-7 w-full flex flex-col gap-4">
          <div className="w-full aspect-square lg:aspect-[4/3] rounded-2xl overflow-hidden">
            <Skeleton className="w-full h-full" />
          </div>
          <div className="hidden lg:flex gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-24 h-24 rounded-xl shrink-0 overflow-hidden">
                <Skeleton className="w-full h-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-5 mt-6 lg:mt-0 w-full">
          <Skeleton className="w-24 h-6 rounded-md" />
          <Skeleton className="w-4/5 h-9 rounded-lg" />
          <Skeleton className="w-1/2 h-8 rounded-lg" />
          <div className="p-5 rounded-2xl bg-white border border-line flex flex-col gap-3">
            <Skeleton className="w-1/3 h-7 rounded" />
            <Skeleton className="w-2/3 h-4 rounded" />
            <div className="grid grid-cols-2 gap-3 mt-2">
              <Skeleton className="h-12 rounded-full" />
              <Skeleton className="h-12 rounded-full" />
            </div>
          </div>
          <Skeleton className="w-full h-24 rounded-2xl" />
          <Skeleton className="w-full h-36 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Cart Item Skeleton
 */
export function CartItemSkeleton() {
  return (
    <div className="p-4 flex gap-4">
      <div className="shrink-0 w-20 h-20 rounded-xl overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>
      <div className="flex flex-col flex-1 gap-2 py-1">
        <Skeleton className="h-4 w-4/5 rounded" />
        <Skeleton className="h-3 w-1/3 rounded" />
        <div className="mt-auto flex items-center justify-between pt-1">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
      </div>
    </div>
  );
}
