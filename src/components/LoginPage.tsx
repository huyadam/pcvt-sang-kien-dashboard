import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: (username: string, password: string) => boolean;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = onLogin(username.trim().toLowerCase(), password);
    if (!success) {
      setError('Tên đăng nhập hoặc mật khẩu không đúng!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-evn-blue to-[#002a4d] px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Dashboard Sáng Kiến PCVT</h1>
            <p className="text-gray-500 dark:text-gray-400">Đăng nhập để chấm điểm & cập nhật tiến độ</p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center mb-6 border border-red-200 dark:border-red-800 animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="username">
                Tên đăng nhập
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-evn-blue focus:border-evn-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                placeholder="Nhập tên đăng nhập"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="password">
                Mật khẩu
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-evn-blue focus:border-evn-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                placeholder="Nhập mật khẩu"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-evn-orange hover:bg-evn-orange-hover text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-evn-orange"
            >
              Đăng Nhập
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              © 2026 Công ty Điện lực Vũng Tàu. Phục vụ quản trị nội bộ.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
