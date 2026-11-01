// src/lib/api.ts
import axios from 'axios';

// All frontend requests go to the Express backend.
// Ensure baseURL always ends with /api even if user sets NEXT_PUBLIC_API_URL without /api
let rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
rawBaseUrl = rawBaseUrl.trim().replace(/\/+$/, '');
const normalizedBaseUrl = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;

// WithCredentials ensures cookies (JWT) are sent with every request.
const api = axios.create({
  baseURL: normalizedBaseUrl,
  withCredentials: true,
});

// ── Token helpers ─────────────────────────────────────────────────────────────
// The session token lives in localStorage (sent as a Bearer header). The
// Next.js proxy only needs to know *whether* someone is signed in to redirect
// guests away from protected pages, so the JS-readable cookie it checks holds
// a plain marker -- never the token itself, which would otherwise be copied
// into every page request and readable from document.cookie.

const TOKEN_KEY = 'medox_token';
const SESSION_MARKER_COOKIE = 'medox_session';

export function saveToken(token: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
    // Add Secure flag on HTTPS (production), omit on HTTP (local dev).
    const isSecure = window.location.protocol === 'https:';
    const secureFlag = isSecure ? '; Secure' : '';
    document.cookie = `${SESSION_MARKER_COOKIE}=1; path=/; max-age=604800; SameSite=Lax${secureFlag}`;
    // Remove the token cookie older versions of the site set.
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax${secureFlag}`;
  } catch {}
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TOKEN_KEY);
    // Expire the client-side cookie immediately
    const isSecure = window.location.protocol === 'https:';
    const secureFlag = isSecure ? '; Secure' : '';
    document.cookie = `${SESSION_MARKER_COOKIE}=; path=/; max-age=0; SameSite=Lax${secureFlag}`;
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax${secureFlag}`;
  } catch {}
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

// ── Interceptors ──────────────────────────────────────────────────────────────

// Request: attach stored token as Authorization header on every outgoing call.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Response: clear stale token on 401 so subsequent calls don't keep failing.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearToken();
    }
    return Promise.reject(error);
  }
);

export default api;


// ── Shared categories cache ─────────────────────────────────────────────────
// Categories rarely change and are fetched independently by both the nav menu
// and category pages on every load. Dedupe/cache in-memory (per page session)
// so we don't issue the same GET twice for one navigation.
let categoriesCache: any | null = null;
let categoriesPromise: Promise<any> | null = null;

export function getCategoriesCached(): Promise<any> {
  if (categoriesCache) return Promise.resolve(categoriesCache);
  if (!categoriesPromise) {
    categoriesPromise = api.get('/categories')
      .then(res => {
        categoriesCache = res.data;
        return res.data;
      })
      .catch(err => {
        categoriesPromise = null; // allow retry on next call
        throw err;
      });
  }
  return categoriesPromise;
}
