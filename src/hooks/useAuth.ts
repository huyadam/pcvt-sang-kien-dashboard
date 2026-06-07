import { useState, useCallback } from 'react';
import { User } from '../types';
import { authenticate } from '../lib/auth';
import * as api from '../lib/api';

const SESSION_KEY = 'pcvt_sk_user';

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  });

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    // 1. Thử lấy accounts từ cache trước
    let dynamicAccounts: any[] = [];
    try {
      const cache = localStorage.getItem('pcvt_sk_cache');
      if (cache) {
        const parsed = JSON.parse(cache);
        dynamicAccounts = parsed.accounts || [];
      }
    } catch (_) {}

    // 2. Nếu cache không có accounts, fetch từ API
    if (dynamicAccounts.length === 0) {
      try {
        const freshData = await api.loadAll();
        dynamicAccounts = freshData.accounts || [];
        // Cache lại để lần sau dùng
        localStorage.setItem('pcvt_sk_cache', JSON.stringify(freshData));
      } catch (_) {
        // Nếu fetch lỗi, tiếp tục dùng password mặc định trong code
      }
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
    localStorage.removeItem('pcvt_sk_cache');
  }, []);

  return { user, isAuthenticated: !!user, login, logout };
}
