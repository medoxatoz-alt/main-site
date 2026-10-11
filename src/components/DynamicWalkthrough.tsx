'use client';

import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  LayoutGrid,
  Receipt,
  Truck,
  HeartHandshake,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
 
  HelpCircle,
  ArrowRight,
} from 'lucide-react';

interface Step {
  title: string;
  subtitle: string;
  description: string;
  icon: any;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeColor: string;
  tag: string;
  keyPoints: string[];
  tip?: string;
}

const STEPS: Step[] = [
  {
    title: 'Welcome to MedoxAtoZ',
    subtitle: "India's Verified Medical Supply Platform",
    description:
      'Order authentic surgical instruments, hospital equipment, clinic consumables, and pharmaceuticals straight from certified manufacturers.',
    icon: ShieldCheck,
    iconBg: 'bg-emerald-50 border-emerald-200/80',
    iconColor: 'text-emerald-600',
    badgeBg: 'bg-emerald-100/70',
    badgeColor: 'text-emerald-800',
    tag: '100% Genuine Supplies',
    keyPoints: [
      'Certified batch numbers & manufacturer warranties',
 
      'Direct-from-distributor pricing with zero middlemen',
    ],
    tip: 'Search by brand, category, or generic salt name anytime.',
  },
  {
    title: 'Smart Category Explorer',
    subtitle: 'Department-Wise One-Tap Browsing',
    description:
      'Easily browse specialty departments including Dermatology, Hospital Supplies, Surgical, Diagnostics, Clinic Setup, and Home Healthcare.',
    icon: LayoutGrid,
    iconBg: 'bg-amber-50 border-amber-200/80',
    iconColor: 'text-amber-600',
    badgeBg: 'bg-amber-100/70',
    badgeColor: 'text-amber-800',
    tag: 'Fast Navigation',
    keyPoints: [
      'Top icon category bar accessible across the app',
      'Filter by clinic department, brand, and stock status',
      'Instant search with real-time autocompletion',
    ],
    tip: 'Swipe horizontally on mobile to view all departments.',
  },
  {
    title: 'Wholesale B2B & GST Invoices',
    subtitle: 'Maximum Commercial Savings for Clinics',
    description:
      'Automatically unlock tiered wholesale discounts as order quantities increase, and obtain 100% compliant GST tax invoices for input tax credit (ITC).',
    icon: Receipt,
    iconBg: 'bg-purple-50 border-purple-200/80',
    iconColor: 'text-purple-600',
    badgeBg: 'bg-purple-100/70',
    badgeColor: 'text-purple-800',
    tag: 'Verified GST ITC',
    keyPoints: [
      'Input Tax Credit (ITC) compliant invoices on every order',
      'Wholesale tiered bulk pricing automatically applied',
      'Enter clinic GSTIN once during checkout or profile setup',
    ],
    tip: 'You can download digital GST tax invoices directly from Your Orders.',
  },
  {
    title: 'Express Doorstep Delivery',
    subtitle: 'Cold-Chain & Real-Time Tracking',
    description:
      'Fast pan-India dispatch with 24-48 hour metro deliveries. Temperature-sensitive vaccines and diagnostics travel in certified insulated cold-chain packaging.',
    icon: Truck,
    iconBg: 'bg-sky-50 border-sky-200/80',
    iconColor: 'text-sky-600',
    badgeBg: 'bg-sky-100/70',
    badgeColor: 'text-sky-800',
    tag: 'Pan-India Dispatch',
    keyPoints: [
      '24 to 48 hour delivery across metro healthcare hubs',
      'Live SMS & WhatsApp dispatch tracking updates',
      'Secure UPI, Cards, NetBanking & Cashfree checkout',
    ],
    tip: 'Check estimated arrival date for your pincode directly on product pages.',
  },
  {
    title: 'Prescriptions & Priority Support',
    subtitle: 'Dedicated Medical Concierge Desk',
    description:
      'Easily upload prescription photos during checkout for regulated items, and reach our dedicated healthcare support team via WhatsApp with a single tap.',
    icon: HeartHandshake,
    iconBg: 'bg-rose-50 border-rose-200/80',
    iconColor: 'text-rose-600',
    badgeBg: 'bg-rose-100/70',
    badgeColor: 'text-rose-800',
    tag: 'Priority Assistance',
    keyPoints: [
      'Hassle-free 1-tap Rx photo upload at checkout',
      'Quick repeat orders from your order history',
      'Dedicated WhatsApp & phone concierge for doctors & clinics',
    ],
    tip: 'Need immediate help? Tap "Help & Guides" anytime in the menu.',
  },
];

export default function DynamicWalkthrough() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has seen walkthrough on first visit
    const hasSeen = localStorage.getItem('medox_walkthrough_seen');
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Allow reopening walkthrough from settings or help modal
  useEffect(() => {
    const handleOpen = () => {
      setCurrentStep(0);
      setIsOpen(true);
    };
    window.addEventListener('open-walkthrough', handleOpen);
    return () => window.removeEventListener('open-walkthrough', handleOpen);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('medox_walkthrough_seen', 'true');
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const openHelpModal = () => {
    handleClose();
    window.dispatchEvent(new Event('open-help-modal'));
  };

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const IconComponent = step.icon;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop Dismissal */}
      <div className="absolute inset-0" onClick={handleClose} />

      {/* Modal / Mobile Native Bottom Sheet Card */}
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-[32px] sm:rounded-3xl p-5 sm:p-7 shadow-2xl text-gray-900 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[92vh] flex flex-col z-10 border border-gray-100">
        
        {/* Mobile Pull Handle Bar */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3 sm:hidden shrink-0" />

        {/* Top Bar with Step Pill & Skip */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
             
              <span>Step {currentStep + 1} of {STEPS.length}</span>
            </span>
            <span className="text-xs text-gray-400 font-medium hidden sm:inline">
              How to Use Medox
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors cursor-pointer px-3 py-1.5 rounded-full hover:bg-gray-100 active:scale-95 border-none bg-transparent"
            >
              Skip
            </button>
            <button
              onClick={handleClose}
              aria-label="Close walkthrough"
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors cursor-pointer border-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar my-4 pr-0.5 space-y-4">
          
          {/* Main Visual Header */}
          <div className="flex flex-col items-center text-center pt-1">
            <div
              className={`w-18 h-18 sm:w-20 sm:h-20 rounded-3xl ${step.iconBg} border flex items-center justify-center ${step.iconColor} mb-4 shadow-sm relative transition-all duration-300`}
            >
              <IconComponent className="w-9 h-9 sm:w-10 sm:h-10 stroke-[2]" />
              <span
                className={`absolute -bottom-2.5 ${step.badgeBg} ${step.badgeColor} text-[10px] font-extrabold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-xs border border-white`}
              >
                {step.tag}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mt-1 mb-1">
              {step.title}
            </h3>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">
              {step.subtitle}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-sm px-1">
              {step.description}
            </p>
          </div>

          {/* Key Points Card */}
          <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Key Features & Benefits
            </span>
            {step.keyPoints.map((point, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-left">
                <div className="w-4.5 h-4.5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span className="text-xs sm:text-sm text-gray-800 font-medium leading-snug">
                  {point}
                </span>
              </div>
            ))}
          </div>

          {/* Quick Helpful Tip */}
          {step.tip && (
            <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 text-left">
              <span className="text-base shrink-0">💡</span>
              <p className="text-xs text-amber-900 font-medium leading-normal">
                <strong className="font-bold">Pro Tip:</strong> {step.tip}
              </p>
            </div>
          )}
        </div>

        {/* Progress Indicators & Navigation Footer */}
        <div className="pt-3 border-t border-gray-100 flex flex-col gap-3 shrink-0">
          
          {/* Progress Dots / Bar */}
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  aria-label={`Jump to step ${idx + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer border-none p-0 ${
                    idx === currentStep
                      ? 'w-8 bg-amber-500 shadow-xs'
                      : idx < currentStep
                      ? 'w-2.5 bg-gray-400'
                      : 'w-2 bg-gray-200 hover:bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={openHelpModal}
              className="text-[11px] font-bold text-gray-500 hover:text-amber-600 flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Need Help?</span>
            </button>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-2.5">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="py-3 px-4 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 font-bold rounded-2xl text-xs sm:text-sm transition-all duration-200 border-none flex items-center justify-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-black rounded-2xl text-xs sm:text-sm transition-all duration-200 shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer border-none"
            >
              <span>{currentStep === STEPS.length - 1 ? 'Start Shopping' : 'Continue'}</span>
              {currentStep === STEPS.length - 1 ? (
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
