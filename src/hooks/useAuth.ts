import { useState, useCallback } from 'react';
import { User } from '../types';
import { authenticate } from '../lib/auth';
import * as api from '../lib/api';

const SESSION_KEY = 'pcvt_sk_user';
const CACHE_KEY = 'pcvt_sk_cache_v3';

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  });

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    let dynamicAccounts: any[] = [];
    try {
      const cache = localStorage.getItem(CACHE_KEY);
      if (cache) {
        const parsed = JSON.parse(cache);
        dynamicAccounts = parsed.accounts || [];
      }
    } catch (_) {}

    if (dynamicAccounts.length === 0) {
      try {
        const freshData = await api.loadAll();
        dynamicAccounts = freshData.accounts || [];
        localStorage.setItem(CACHE_KEY, JSON.stringify(freshData));
      } catch (_) {}
    }

    const u = authenticate(username, password, dynamicAccounts);
    if (u) {
      setUser(u);
      localStorage.setItem(SESSION_KEY, JSON.stringify(u));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(CACHE_KEY);
  }, []);

  return { user, isAuthenticated: !!user, login, logout };
}
