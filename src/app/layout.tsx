import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';
import ConditionalFooter from '@/components/ConditionalFooter';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';
import OfflineOverlay from '@/components/OfflineOverlay';
import ExitConfirmationModal from '@/components/ExitConfirmationModal';
import HelpSectionModal from '@/components/HelpSectionModal';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('https://medoxatoz.com'),
  title: {
    default: 'MedoxAtoZ | Medical Supplies, Bulk Equipment & Clinic Essentials',
    template: '%s | MedoxAtoZ Medical Supplies',
  },
  description:
    "Equipping India's clinics and healthcare practitioners with genuine medical supplies, bulk clinic equipment, surgical instruments, pharmaceuticals, and diagnostic tests with fast doorstep delivery.",
  keywords: [
    'medical supplies',
    'bulk medical equipment',
    'clinic essentials',
    'surgical products',
    'diagnostic supplies',
    'hospital supplies India',
    'pharmaceuticals B2B',
    'dermatology equipment',
    'medical disposables',
    'clinic furniture',
    'MedoxAtoZ',
    'Medox',
  ],
  authors: [{ name: 'MedoxAtoZ Healthcare' }],
  creator: 'MedoxAtoZ',
  publisher: 'MedoxAtoZ',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'MedoxAtoZ | Medical Supplies, Bulk Equipment & Clinic Essentials',
    description:
      "Order bulk medical equipment, pharmaceuticals, surgical supplies, and clinic essentials online with doorstep delivery and verified GST invoices.",
    url: 'https://medoxatoz.com',
    siteName: 'MedoxAtoZ',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MedoxAtoZ | Medical Supplies & Clinic Equipment',
    description:
      'Buy genuine medical supplies, bulk clinic essentials, and surgical instruments at wholesale prices across India.',
  },
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
      { url: '/apple-touch-icon-152x152.png', sizes: '152x152' },
      { url: '/apple-touch-icon-167x167.png', sizes: '167x167' },
      { url: '/apple-touch-icon-180x180.png', sizes: '180x180' },
    ],
    other: [{ rel: 'mask-icon', url: '/safari-pinned-tab.svg' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0d10',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  name: 'MedoxAtoZ',
  url: 'https://medoxatoz.com',
  logo: 'https://medoxatoz.com/logo.webp',
  description:
    'Premier Indian platform for medical supplies, bulk clinic equipment, surgical essentials, and healthcare diagnostics.',
  currenciesAccepted: 'INR',
  paymentAccepted: 'Cash, Credit Card, UPI, Net Banking',
  areaServed: 'IN',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={inter.className} style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
        <AuthProvider>
          <ServiceWorkerRegistrar />
          <Toaster
            position="top-center"
            containerStyle={{ top: 'calc(env(safe-area-inset-top) + 12px)' }}
            toastOptions={{
              duration: 2400,
              style: {
                background: '#0f1115',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 500,
                padding: '10px 14px',
                borderRadius: '999px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
                maxWidth: 'calc(100vw - 32px)',
              },
              success: { iconTheme: { primary: '#34d399', secondary: '#0f1115' } },
              error: { iconTheme: { primary: '#f87171', secondary: '#0f1115' } },
            }}
          />
          <OfflineOverlay />
          <ExitConfirmationModal />
          <HelpSectionModal />
          {children}
          <ConditionalFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
