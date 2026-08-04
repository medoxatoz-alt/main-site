import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping Policy | MedoxAtoZ',
  description: 'Shipping policy and delivery times for MedoxAtoZ.',
};

export default function ShippingPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
          {/* Header */}
          <div className="bg-[#0d1117] rounded-2xl p-8 mb-8 text-white">
            <p className="text-gold-primary text-sm font-semibold mb-2 uppercase tracking-widest">Legal</p>
            <h1 className="text-3xl font-extrabold mb-2">Shipping Policy</h1>
            <p className="text-gray-400 text-sm">Last updated: August 2026</p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Processing Time</h2>
              <p>All orders are processed and dispatched within 1-2 business days. Orders are not shipped or delivered on weekends or public holidays.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Shipping Rates</h2>
              <p>We are proud to offer <strong>Free Shipping on all orders</strong> across India.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Delivery Times</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><span className="font-semibold">Standard:</span> 5–10 business days.</li>
                <li><span className="font-semibold">Express:</span> 3–5 business days.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Order Tracking</h2>
              <p>Tracking details are shared via email and SMS once the order is shipped. You can also track your order through your account dashboard.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">International Shipping</h2>
              <p>Currently, MedoxAtoZ only ships to addresses within India. We do not offer international shipping at this time.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Damages & Issues</h2>
              <p>Please inspect your order upon reception. If the item is defective, damaged, or if you received the wrong item, contact us immediately so that we can evaluate the issue and make it right.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Delays</h2>
              <p>The business is not responsible for delays due to courier services or unforeseen circumstances.</p>
            </section>

            <div className="border-t border-gray-100 pt-6 flex gap-4 flex-wrap">
              <Link href="/terms" className="text-blue-600 hover:underline text-sm">Terms & Conditions</Link>
              <Link href="/refund-policy" className="text-blue-600 hover:underline text-sm">Refund Policy</Link>
              <Link href="/privacy-policy" className="text-blue-600 hover:underline text-sm">Privacy Policy</Link>
              <Link href="/" className="text-blue-600 hover:underline text-sm">← Back to Home</Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
