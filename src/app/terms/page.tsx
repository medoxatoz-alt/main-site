import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions | MedoxAtoZ',
  description: 'Read the terms and conditions governing your use of MedoxAtoZ.',
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
          <div className="bg-[#0d1117] rounded-2xl p-8 mb-8 text-white">
            <p className="text-gold-primary text-sm font-semibold mb-2 uppercase tracking-widest">Legal</p>
            <h1 className="text-3xl font-extrabold mb-2">Terms & Conditions</h1>
            <p className="text-gray-400 text-sm">Last updated: June 2026</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8 text-gray-700 leading-relaxed">

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p>By accessing or using MedoxAtoZ (operated by SREE SAI LAKSHMI GANAPATHI TRADERS), you agree to be bound by these Terms & Conditions. If you do not agree, please discontinue use of the platform immediately.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. Use of Platform</h2>
              <p>MedoxAtoZ is a B2B marketplace for medical supplies intended for clinics, hospitals, and licensed medical professionals in India. By using this platform, you confirm that you are a legitimate medical professional or business entity.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. Account Responsibility</h2>
              <p>You are responsible for maintaining the confidentiality of your login credentials. Any activity carried out under your account is your responsibility. Report unauthorized access immediately to <a href="mailto:medoxatoz@gmail.com" className="text-blue-600 hover:underline">medoxatoz@gmail.com</a>.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Product Listings</h2>
              <p>Vendors are responsible for the accuracy of their product descriptions, pricing, and availability. MedoxAtoZ reserves the right to remove any listing that violates platform policies or applicable law.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. Order & Payment</h2>
              <p>All prices are listed in Indian Rupees (₹). Orders are subject to acceptance and availability. MedoxAtoZ reserves the right to cancel any order at its discretion.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">6. Intellectual Property</h2>
              <p>All content on this platform — including logos, design, and product images — is the property of MedoxAtoZ or its respective vendors. Unauthorized use is strictly prohibited.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">7. Limitation of Liability</h2>
              <p>MedoxAtoZ is not liable for any indirect, incidental, or consequential damages arising from the use of this platform or products purchased through it.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">8. Changes to Terms</h2>
              <p>We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the updated terms.</p>
            </section>

            <div className="border-t border-gray-100 pt-6 flex gap-4 flex-wrap">
              <Link href="/privacy-policy" className="text-blue-600 hover:underline text-sm">Privacy Policy</Link>
              <Link href="/refund-policy" className="text-blue-600 hover:underline text-sm">Refund Policy</Link>
              <Link href="/" className="text-blue-600 hover:underline text-sm">← Back to Home</Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
