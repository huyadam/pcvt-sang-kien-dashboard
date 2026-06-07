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
    // Bước 1: Gọi API lấy danh sách accounts mới nhất từ Google Sheet
    let dynamicAccounts: any[] = [];
    try {
      const data = await api.loadAll();
      dynamicAccounts = data.accounts || [];
      // Lưu cache luôn để sau khi login useAppData có dữ liệu sẵn
      localStorage.setItem('pcvt_sk_cache', JSON.stringify(data));
    } catch (e) {
      // Nếu API lỗi, thử đọc từ cache cũ
      try {
        const cache = localStorage.getItem('pcvt_sk_cache');
        if (cache) {
          const parsed = JSON.parse(cache);
          dynamicAccounts = parsed.accounts || [];
        }
      } catch (_) {}
    }

    // Bước 2: Xác thực với danh sách accounts mới nhất
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
    // Xóa cache localStorage để phòng ban này đăng xuất vào phòng ban khác không bị cache cũ
    localStorage.removeItem('pcvt_sk_cache');
  }, []);

  return { user, isAuthenticated: !!user, login, logout };
}
