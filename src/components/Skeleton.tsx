'use client';

import React from 'react';

/**
 * Reusable shimmer skeleton primitive with GPU-accelerated shimmer sweep
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
      className={`relative overflow-hidden bg-gray-200/80 rounded-md before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent ${className}`}
    />
  );
}

/**
 * Product Card Shimmer Skeleton
 */
export function ProductCardSkeleton() {
  return (
    <div className="bg-white p-3 sm:p-5 rounded-xl flex flex-col justify-between relative border border-gray-100 shadow-sm overflow-hidden">
      {/* Image frame */}
      <div className="h-[140px] sm:h-[220px] w-full bg-gray-100 rounded-lg mb-3 sm:mb-4 relative overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>

      {/* Details */}
      <div className="flex-1 flex flex-col gap-2">
        {/* Title lines */}
        <Skeleton className="h-3.5 sm:h-4 w-4/5 rounded" />
        <Skeleton className="h-3 sm:h-3.5 w-3/5 rounded" />

        {/* Price & Button */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
          <div className="flex flex-col gap-1 w-1/3">
            <Skeleton className="h-2.5 w-2/3 rounded" />
            <Skeleton className="h-4 sm:h-5 w-full rounded" />
          </div>
          <Skeleton className="h-7 sm:h-8 w-14 sm:w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Product Grid Shimmer Skeleton
 */
export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6 mb-10">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Product Detail Page Shimmer Skeleton
 */
export function ProductDetailSkeleton() {
  return (
    <div className="max-w-[1500px] w-full mx-auto lg:px-8 py-4 lg:py-12 mt-2">
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-10 items-start px-4 lg:px-0">
        {/* Left: Gallery Skeleton */}
        <div className="lg:col-span-7 w-full flex flex-col gap-4">
          <div className="w-full aspect-square lg:aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden">
            <Skeleton className="w-full h-full" />
          </div>
          <div className="hidden lg:flex gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-24 h-24 bg-gray-100 rounded-xl shrink-0 overflow-hidden">
                <Skeleton className="w-full h-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Details Skeleton */}
        <div className="lg:col-span-5 flex flex-col gap-5 mt-6 lg:mt-0 w-full">
          <Skeleton className="w-24 h-6 rounded-md" />
          <Skeleton className="w-4/5 h-9 rounded-lg" />
          <Skeleton className="w-1/2 h-8 rounded-lg" />

          {/* Pricing Box */}
          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col gap-3">
            <Skeleton className="w-1/3 h-7 rounded" />
            <Skeleton className="w-2/3 h-4 rounded" />
            <div className="grid grid-cols-2 gap-3 mt-2">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
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
 * Cart Item Shimmer Skeleton
 */
export function CartItemSkeleton() {
  return (
    <div className="bg-white border border-gray-100 p-3.5 rounded-xl shadow-sm flex gap-4">
      <div className="shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>
      <div className="flex flex-col flex-1 gap-2 py-1">
        <Skeleton className="h-4 w-4/5 rounded" />
        <Skeleton className="h-3 w-1/3 rounded" />
        <div className="mt-auto flex items-center justify-between pt-1">
          <Skeleton className="h-7 w-20 rounded-lg" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
      </div>
    </div>
  );
}
