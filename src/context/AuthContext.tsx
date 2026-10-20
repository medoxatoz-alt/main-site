'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api, { saveToken, clearToken } from '../lib/api';

export interface User {
  uid: string;
  email: string;
  phone?: string;
  name?: string;
  role: 'buyer' | 'vendor' | 'admin';
  status?: 'pending' | 'approved' | 'rejected';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      // Persist the refreshed token so the edge middleware cookie stays valid
      if (res.data.token) {
        saveToken(res.data.token);
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        setUser(null);
        clearToken();
      } else {
        console.warn('Could not refresh user session:', err?.message || err);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const refreshUser = async () => {
    await fetchUser();
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      setUser(null);
      clearToken();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
