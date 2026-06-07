import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | MedoxAtoZ',
  description: 'Learn how MedoxAtoZ collects, uses, and protects your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
          {/* Header */}
          <div className="bg-[#0d1117] rounded-2xl p-8 mb-8 text-white">
            <p className="text-gold-primary text-sm font-semibold mb-2 uppercase tracking-widest">Legal</p>
            <h1 className="text-3xl font-extrabold mb-2">Privacy Policy</h1>
            <p className="text-gray-400 text-sm">Last updated: June 2026</p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8 text-gray-700 leading-relaxed">

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Information We Collect</h2>
              <p>We collect personal information you provide when you register, place an order, or contact us. This includes your name, email address, phone number, and delivery address. We also collect usage data such as pages visited and actions taken within the platform.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. How We Use Your Information</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>To process and fulfill your orders</li>
                <li>To send order confirmations and shipping updates</li>
                <li>To improve our platform and personalize your experience</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. Data Sharing</h2>
              <p>We do not sell your personal data to third parties. We may share data with trusted service providers (payment gateways, shipping partners) strictly for order fulfillment. All third parties are contractually bound to protect your data.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Cookies</h2>
              <p>We use session cookies to maintain your login state and preferences. These cookies are essential for the platform to function. We do not use tracking or advertising cookies.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. Data Security</h2>
              <p>We implement industry-standard security measures including HTTPS encryption, secure Firebase Authentication, and JWT-based session management to protect your personal data.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">6. Your Rights</h2>
              <p>You may request access to, correction of, or deletion of your personal data at any time by contacting us at <a href="mailto:medoxatoz@gmail.com" className="text-blue-600 hover:underline">medoxatoz@gmail.com</a>.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">7. Contact</h2>
              <p>For privacy-related queries, reach out to us at <a href="mailto:medoxatoz@gmail.com" className="text-blue-600 hover:underline">medoxatoz@gmail.com</a>.</p>
            </section>

            <div className="border-t border-gray-100 pt-6 flex gap-4 flex-wrap">
              <Link href="/terms" className="text-blue-600 hover:underline text-sm">Terms & Conditions</Link>
              <Link href="/refund-policy" className="text-blue-600 hover:underline text-sm">Refund Policy</Link>
              <Link href="/" className="text-blue-600 hover:underline text-sm">← Back to Home</Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
