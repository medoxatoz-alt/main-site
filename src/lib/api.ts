// src/lib/api.ts
import axios from 'axios';

// All frontend requests go to the Express backend.
// WithCredentials ensures cookies (JWT) are sent with every request.
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

// ── Token helpers ─────────────────────────────────────────────────────────────
// Persist/clear token in both localStorage (for Bearer header) and a
// client-accessible cookie (for Next.js edge middleware route guards).

const TOKEN_KEY = 'medox_token';

export function saveToken(token: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
    // Set a JS-accessible cookie (NOT httpOnly) so the edge middleware can read it.
    // maxAge = 7 days in seconds
    document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=604800; SameSite=Lax`;
  } catch {}
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TOKEN_KEY);
    // Expire the client-side cookie immediately
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
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
