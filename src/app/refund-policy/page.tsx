import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund & Return Policy | MedoxAtoZ',
  description: 'Understand our refund and return policy for medical supplies purchased on MedoxAtoZ.',
};

export default function RefundPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
          <div className="bg-[#0d1117] rounded-2xl p-8 mb-8 text-white">
            <p className="text-gold-primary text-sm font-semibold mb-2 uppercase tracking-widest">Legal</p>
            <h1 className="text-3xl font-extrabold mb-2">Refund & Return Policy</h1>
            <p className="text-gray-400 text-sm">Last updated: June 2026</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8 text-gray-700 leading-relaxed">

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Return Eligibility</h2>
              <p>Products may be returned within <strong>7 days of delivery</strong> if they are:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                <li>Damaged or defective upon arrival</li>
                <li>Incorrectly delivered (wrong item or quantity)</li>
                <li>Expired or near-expiry (within 30 days of delivery)</li>
              </ul>
              <p className="mt-3 text-sm text-red-600 font-medium">Note: Due to hygiene and regulatory standards for medical supplies, opened or used products are not eligible for return.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. How to Initiate a Return</h2>
              <ol className="list-decimal pl-5 space-y-2 text-sm">
                <li>Contact us at <a href="mailto:medoxatoz@gmail.com" className="text-blue-600 hover:underline">medoxatoz@gmail.com</a> within 7 days of delivery.</li>
                <li>Include your order ID, the item(s) to return, and clear photos of the issue.</li>
                <li>Our team will respond within 2 business days with return instructions.</li>
                <li>Pack the items securely and ship to our provided return address.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. Refund Process</h2>
              <p>Once we receive and inspect the returned item, we will notify you of the approval or rejection of your refund. Approved refunds are processed within <strong>5–7 business days</strong> to your original payment method.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Non-Returnable Items</h2>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Single-use or consumable medical supplies once opened</li>
                <li>Prescription or regulated medical devices</li>
                <li>Items purchased on sale or clearance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. Order Cancellations</h2>
              <p>Orders can be cancelled before they are dispatched. To cancel, contact us immediately at <a href="mailto:medoxatoz@gmail.com" className="text-blue-600 hover:underline">medoxatoz@gmail.com</a>. Once dispatched, the standard return process applies.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">6. Contact Us</h2>
              <p>For any return or refund related queries, please email us at <a href="mailto:medoxatoz@gmail.com" className="text-blue-600 hover:underline">medoxatoz@gmail.com</a>. We aim to resolve all queries within 2 business days.</p>
            </section>

            <div className="border-t border-gray-100 pt-6 flex gap-4 flex-wrap">
              <Link href="/privacy-policy" className="text-blue-600 hover:underline text-sm">Privacy Policy</Link>
              <Link href="/terms" className="text-blue-600 hover:underline text-sm">Terms & Conditions</Link>
              <Link href="/" className="text-blue-600 hover:underline text-sm">← Back to Home</Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
