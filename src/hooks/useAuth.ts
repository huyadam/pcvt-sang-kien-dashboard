import { useState, useCallback } from 'react';
import { User } from '../types';
import { authenticate, authenticateByToken } from '../lib/auth';
import * as api from '../lib/api';

const SESSION_KEY = 'pcvt_sk_user';
const CACHE_KEY = 'pcvt_sk_cache_v3';

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    // Ưu tiên kiểm tra token trong URL trước
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      const u = authenticateByToken(token);
      if (u) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(u));
        // Xóa token khỏi URL (không reload trang)
        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        window.history.replaceState({}, '', url.toString());
        return u;
      }
    }
    // Sau đó kiểm tra session đã lưu
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  });

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    const u = authenticate(username, password);
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
