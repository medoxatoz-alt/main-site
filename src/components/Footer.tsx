'use client';

import Link from 'next/link';
import { Download } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-nav-bg text-white mt-auto hidden md:block">

      {/* Main footer grid */}
      <div className="max-w-[1500px] mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-5 gap-10 border-b border-white/[0.08]">

        {/* Brand Column */}
        <div className="col-span-2">
          <img src="/logo-footer.webp" alt="MedoxAtoZ" className="h-24 object-contain mb-5" />
          <p className="text-white/55 text-[14px] leading-relaxed mb-6 pr-10">
            India's premier B2B marketplace for premium medical and diagnostic supplies. Engineering the clinical supply chain with clinical precision.
          </p>
          <Link
            href="/download"
            className="pressable inline-flex items-center gap-2 h-10 px-4 rounded-full border border-white/15 text-white text-sm font-medium hover:bg-white/[0.08]"
          >
            <Download className="w-4 h-4" /> Get the App
          </Link>

        </div>

        {/* Column: Shop */}
        <div>
          <h3 className="text-[13px] font-semibold text-white mb-4">Shop</h3>
          <ul className="space-y-2.5">
            {[
 
              { label: 'Shopping Cart', href: '/cart' },
              { label: 'Secure Checkout', href: '/checkout' },
              { label: 'Download App', href: '/download' },
            ].map(({ label, href }) => (
              <li key={href}>
                <Link href={href} className="text-white/55 text-[14px] hover:text-white transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column: Company */}
        <div>
          <h3 className="text-[13px] font-semibold text-white mb-4">Company</h3>
          <ul className="space-y-2.5">
            {[
              { label: 'Contact Us', href: 'mailto:medoxatoz@gmail.com' },
              { label: 'Sell on MedoxAtoZ', href: '/vendor/register' },
            ].map(({ label, href }) => (
              <li key={href}>
                <Link href={href} className="text-white/55 text-[14px] hover:text-white transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column: Account & Support */}
        <div>
          <h3 className="text-[13px] font-semibold text-white mb-4">Account & Support</h3>
          <ul className="space-y-2.5">
            {[
              { label: 'Sign In', href: '/signin' },
              { label: 'Create Account', href: '/signup' },
              { label: 'Your Account', href: '/account' },
              { label: 'Track Orders', href: '/account/orders' },
              { label: 'Saved Wishlist', href: '/account/wishlist' },
            ].map(({ label, href }) => (
              <li key={href}>
                <Link href={href} className="text-white/55 text-[14px] hover:text-white transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>

       
        </div>

      </div>

      {/* Footer Bottom */}
      <div className="max-w-[1500px] mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[13px] text-white/55">
        <span className="font-medium">© 2026, SREE SAI LAKSHMI GANAPATHI TRADERS (MedoxAtoZ) — All rights reserved.</span>
        <div className="flex items-center gap-5 flex-wrap font-medium">
          <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
          
          <Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
          
          <Link href="/refund-policy" className="hover:text-white transition-colors">Return & Refund Policy</Link>
          
          <Link href="/shipping-policy" className="hover:text-white transition-colors">Shipping Policy</Link>
        </div>
      </div>

    </footer>
  );
}