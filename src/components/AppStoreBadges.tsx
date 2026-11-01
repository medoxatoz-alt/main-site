'use client';

import React from 'react';

export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.medox.atoz';

export function AppleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 384 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

const BADGE_DIMS = {
  sm: {
    container: 'w-[150px] h-[42px]',
    appleIcon: 'w-5 h-5',
    subText: 'text-[8px]',
    mainText: 'text-[12px]',
    badgeText: 'text-[7.5px] px-1 py-0.5',
  },
  md: {
    container: 'w-[165px] h-[46px]',
    appleIcon: 'w-5.5 h-5.5',
    subText: 'text-[8.5px]',
    mainText: 'text-[13px]',
    badgeText: 'text-[8px] px-1.5 py-0.5',
  },
  lg: {
    container: 'w-[185px] h-[52px]',
    appleIcon: 'w-6 h-6',
    subText: 'text-[9.5px]',
    mainText: 'text-[15px]',
    badgeText: 'text-[8.5px] px-1.5 py-0.5',
  },
};

export function GooglePlayButton({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: string;
}) {
  const dims = BADGE_DIMS[size] || BADGE_DIMS.md;

  return (
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center shrink-0 transition-transform duration-200 hover:scale-[1.03] active:scale-95 select-none ${dims.container} ${className}`}
      aria-label="Get it on Google Play"
    >
      <img
        src="/Google_Play-Badge-Logo.wine.svg"
        alt="Get it on Google Play"
        className="w-full h-full object-contain rounded-[7px] drop-shadow-sm"
      />
    </a>
  );
}

export function AppStoreButton({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: string;
}) {
  const dims = BADGE_DIMS[size] || BADGE_DIMS.md;

  return (
    <div
      className={`inline-flex items-center justify-between bg-black border border-[#A6A6A6] rounded-[7px] text-white px-2.5 select-none shrink-0 cursor-default shadow-sm opacity-95 hover:opacity-100 transition-opacity ${dims.container} ${className}`}
      title="MedoxAtoZ iOS App is coming soon to the Apple App Store"
    >
      <div className="flex items-center gap-2 min-w-0">
        <AppleIcon className={`${dims.appleIcon} text-white shrink-0`} />
        <div className="flex flex-col text-left leading-tight min-w-0">
          <span className={`${dims.subText} text-gray-300 font-medium tracking-tight whitespace-nowrap`}>
            Download on the
          </span>
          <span className={`${dims.mainText} font-bold tracking-tight text-white whitespace-nowrap`}>
            App Store
          </span>
        </div>
      </div>
      <span className={`${dims.badgeText} ml-1 font-semibold uppercase rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0 whitespace-nowrap`}>
        Soon
      </span>
    </div>
  );
}
