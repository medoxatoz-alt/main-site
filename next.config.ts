import type { NextConfig } from "next";

// Origin of the Express API, so the browser may call it under the CSP.
function apiOrigin(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').origin;
  } catch {
    return '';
  }
}

// Third-party origins the site actually uses:
//  - Cashfree checkout SDK + hosted payment page (form POST / redirect)
//  - Firebase Auth (identitytoolkit / securetoken) and reCAPTCHA for phone OTP
//  - dotLottie animations (lottie.host) and its WASM renderer (jsDelivr / unpkg)
//  - pincode / reverse-geocoding lookups
const CASHFREE = 'https://sdk.cashfree.com https://api.cashfree.com https://sandbox.cashfree.com';
const GOOGLE_AUTH = 'https://www.google.com https://www.gstatic.com https://apis.google.com https://recaptcha.google.com';

const fullPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' ${CASHFREE} ${GOOGLE_AUTH}`,
  `connect-src 'self' ${apiOrigin()} https://*.googleapis.com ${CASHFREE} https://lottie.host https://cdn.jsdelivr.net https://unpkg.com https://api.postalpincode.in https://nominatim.openstreetmap.org`,
  "img-src 'self' data: blob: https:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  `frame-src ${CASHFREE} https://www.google.com https://recaptcha.google.com https://*.firebaseapp.com`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  `form-action 'self' ${CASHFREE}`,
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
].join('; ');

// Enforced now: directives that can't break any legitimate flow, and that
// block plugin injection, <base> hijacking and clickjacking.
const enforcedPolicy = ["object-src 'none'", "base-uri 'self'", "frame-ancestors 'self'"].join('; ');

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Never ship source maps of the production bundle.
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            // The legacy XSS auditor is removed from modern browsers and could
            // itself be abused; '0' is the current recommendation.
            key: 'X-XSS-Protection',
            value: '0',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          {
            key: 'Content-Security-Policy',
            value: enforcedPolicy,
          },
          {
            // Full allowlist in report-only mode: violations show in the
            // browser console without blocking anything. Once a release has
            // run cleanly through checkout, phone sign-in and the product
            // pages, rename this header to Content-Security-Policy.
            key: 'Content-Security-Policy-Report-Only',
            value: fullPolicy,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
