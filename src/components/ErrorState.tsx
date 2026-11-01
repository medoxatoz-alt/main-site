import React from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface ErrorStateProps {
  message?: string;
  /** Show a "Go to home" button under the message (shopper-facing pages). */
  showHomeButton?: boolean;
}

export default function ErrorState({ message = 'Something went wrong.', showHomeButton = false }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 w-full min-h-[300px] text-center animate-in fade-in duration-300">
      <div className="w-[180px] h-[180px]">
        <DotLottieReact
          src="https://lottie.host/94129b5d-23c9-4c70-a746-7b3a4d1da50c/y2424zHnAl.lottie"
          loop
          autoplay
        />
      </div>
      <p className="mt-2 text-[16px] font-semibold text-ink px-6">{message}</p>
      {showHomeButton && (
        <Link
          href="/"
          className="pressable mt-5 h-11 px-6 inline-flex items-center gap-2 rounded-full bg-ink text-white text-[14px] font-semibold hover:bg-black"
        >
          <Home className="w-4 h-4" /> Go to home
        </Link>
      )}
    </div>
  );
}
