import { useState, useCallback } from 'react';
import { User } from '../types';
import { authenticate } from '../lib/auth';

const SESSION_KEY = 'pcvt_sk_user';

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  });

  const login = useCallback((username: string, password: string): boolean => {
    const u = authenticate(username, password);
    if (u) {
      setUser(u);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(u));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
    // Xóa cache localStorage để phòng ban này đăng xuất vào phòng ban khác không bị cache cũ
    localStorage.removeItem('pcvt_sk_cache');
  }, []);

  return { user, isAuthenticated: !!user, login, logout };
}
