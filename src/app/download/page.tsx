'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useIsInApp } from '@/hooks/useIsInApp';
import { GooglePlayButton, AppStoreButton, PLAY_STORE_URL } from '@/components/AppStoreBadges';
import {
  Smartphone,
  Zap,
  ShieldCheck,
  BellRing,
  FileText,
  Truck,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  QrCode,
  Sparkles,
} from 'lucide-react';

const appFeatures = [
  {
    icon: <Zap className="w-5 h-5 text-amber-400" />,
    bg: 'bg-amber-400/10',
    title: 'Lightning-Fast Ordering',
    desc: 'Optimized specifically for clinic managers and doctors to place bulk orders in under 30 seconds.',
  },
  {
    icon: <BellRing className="w-5 h-5 text-sky-400" />,
    bg: 'bg-sky-400/10',
    title: 'Real-Time Dispatch Alerts',
    desc: 'Get instant live push notifications when your package is packed, shipped, and out for delivery.',
  },
  {
    icon: <FileText className="w-5 h-5 text-emerald-400" />,
    bg: 'bg-emerald-400/10',
    title: '1-Click GST Invoices',
    desc: 'Download authentic GST tax invoices directly to your device for smooth input tax credit claims.',
  },
  {
    icon: <ShieldCheck className="w-5 h-5 text-violet-400" />,
    bg: 'bg-violet-400/10',
    title: '100% Genuine Supplies',
    desc: 'Direct sourcing from verified national manufacturers with batch lot verification and cold-chain integrity.',
  },
  {
    icon: <Truck className="w-5 h-5 text-rose-400" />,
    bg: 'bg-rose-400/10',
    title: 'Priority Clinic Delivery',
    desc: 'Express dispatch with real-time tracking across 19,000+ pin codes across India.',
  },
  {
    icon: <Sparkles className="w-5 h-5 text-yellow-400" />,
    bg: 'bg-yellow-400/10',
    title: 'App-Exclusive Wholesale Discounts',
    desc: 'Special bulk volume pricing and seasonal deals reserved exclusively for app users.',
  },
];

export default function DownloadAppPage() {
  const { isInApp, isMobile, isMounted } = useIsInApp();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-page pb-24">
        {/* ─── Hero Section ─── */}
        <section className="bg-nav-bg text-white border-b-2 border-gold-primary relative overflow-hidden">
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold-primary/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none translate-y-1/3 -translate-x-1/4" />

          <div className="max-w-6xl mx-auto px-6 py-14 sm:py-20 relative z-10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
              {/* Left Column: Heading & Actions */}
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-gold-primary/15 border border-gold-primary/30 text-gold-primary text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-6">
                  <Smartphone className="w-3.5 h-3.5" /> Official Mobile App
                </div>

                <h1 className="text-3xl sm:text-5xl font-bold text-white leading-[1.15] mb-5 tracking-tight">
                  MedoxAtoZ on your phone.{' '}
                  <span className="text-gold-primary block mt-1">Faster. Smoother. Smarter.</span>
                </h1>

                <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8 font-normal">
                  Order surgical instruments, clinic equipment, and consumables directly from your smartphone.
                  Enjoy instant delivery notifications, 1-click reorders, and tax invoices on the go.
                </p>

                {/* State: If Already in App vs External Browser */}
                {isMounted && isInApp ? (
                  <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-5 rounded-2xl max-w-md mx-auto lg:mx-0 shadow-lg">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-white text-base">You're using the MedoxAtoZ App!</p>
                      <p className="text-xs text-emerald-200/80 mt-0.5">
                        You have the latest mobile version running with full native capabilities.
                      </p>
                      <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-gold-primary hover:underline mt-2.5"
                      >
                        Browse Medical Catalog <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* App Store & Play Store Action Badges */}
                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 flex-wrap">
                      <GooglePlayButton size="lg" className="w-full sm:w-auto justify-center" />
                      <AppStoreButton size="lg" className="w-full sm:w-auto justify-center" />
                    </div>

                    {/* QR Code helper for desktop users */}
                    {!isMobile && (
                      <div className="hidden sm:inline-flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-3.5 mt-2">
                        <div className="w-16 h-16 bg-white p-1 rounded-xl shrink-0 flex items-center justify-center shadow-md">
                          {/* Visual QR Code pointing to Play Store */}
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                              PLAY_STORE_URL
                            )}`}
                            alt="Scan to download on Play Store"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-white flex items-center gap-1.5">
                            <QrCode className="w-3.5 h-3.5 text-gold-primary" /> Scan with your phone
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Point your Android camera to download directly from Google Play.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: App Mockup & Highlights */}
              <div className="flex flex-col items-center shrink-0">
                <div className="relative group">
                  <div className="absolute -inset-1 rounded-[36px] bg-gradient-to-r from-gold-primary/40 to-emerald-500/30 blur-xl opacity-75 group-hover:opacity-100 transition duration-500" />
                  <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-[32px] bg-nav-bg border-2 border-gold-primary/30 p-6 flex flex-col items-center justify-center shadow-2xl">
                    <img
                      src="/logo.webp"
                      alt="MedoxAtoZ Mobile App"
                      className="w-28 h-28 sm:w-32 sm:h-32 object-contain drop-shadow-xl"
                    />
                    <div className="mt-3 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-300">
                        Official App
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 mt-6 text-xs text-gray-400">
                  <div className="text-center">
                    <p className="text-base font-bold text-white">4.8 ★</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Rating</p>
                  </div>
                  <div className="h-6 w-px bg-white/10" />
                  <div className="text-center">
                    <p className="text-base font-bold text-white">10K+</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Clinics</p>
                  </div>
                  <div className="h-6 w-px bg-white/10" />
                  <div className="text-center">
                    <p className="text-base font-bold text-white">Free</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Download</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Key App Features Grid ─── */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--text-main)] mb-3 tracking-tight">
              Why download the MedoxAtoZ App?
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-muted)]">
              Tailored specifically for Indian doctors, hospitals, clinics, and surgical procurement teams.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {appFeatures.map(({ icon, bg, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                    {icon}
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Bottom CTA Banner ─── */}
        {!isInApp && (
          <section className="max-w-4xl mx-auto px-6 pb-12">
            <div className="bg-gradient-to-br from-nav-bg to-nav-bg border border-gold-primary/30 rounded-3xl p-8 sm:p-10 text-center text-white relative overflow-hidden shadow-xl">
              <div className="relative z-10 max-w-xl mx-auto">
                <h3 className="text-2xl sm:text-3xl font-semibold mb-3">
                  Ready to elevate your clinic supply chain?
                </h3>
                <p className="text-sm text-gray-300 mb-8 leading-relaxed">
                  Download the MedoxAtoZ App today for genuine surgical instruments and medical supplies at transparent wholesale rates.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <GooglePlayButton size="md" className="w-full sm:w-auto justify-center" />
                  <AppStoreButton size="md" className="w-full sm:w-auto justify-center" />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ─── Back to Store Home ─── */}
        <div className="text-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-gold-primary hover:text-gold-ink hover:underline"
          >
            ← Back to Store Home
          </Link>
        </div>
      </main>
    </>
  );
}
