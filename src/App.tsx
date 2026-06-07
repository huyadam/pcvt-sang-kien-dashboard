import React, { useState, useEffect } from 'react';
import { useAppData } from './hooks/useAppData';
import { useDarkMode } from './hooks/useDarkMode';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import Overview from './components/Overview';
import DeptTable from './components/DeptTable';
import KanbanBoard from './components/KanbanBoard';
import { Toaster } from 'react-hot-toast';
import * as api from './lib/api';

export default function App() {
  const { isDark, toggle: toggleDark } = useDarkMode();
  const { user, isAuthenticated, login, logout } = useAuth();
  const appData = useAppData(user);
  const [prefetchDone, setPrefetchDone] = useState(false);

  // Pre-fetch: Khi F5 mở trang, tải toàn bộ dữ liệu GSheet trước (kể cả accounts)
  useEffect(() => {
    api.loadAll()
      .then(data => {
        localStorage.setItem('pcvt_sk_cache', JSON.stringify(data));
      })
      .catch(() => {})
      .finally(() => setPrefetchDone(true));
  }, []);

  const {
    loading,
    error,
    masterData,
    gsheetData,
    currentTab,
    setCurrentTab,
    refreshData,
  } = appData;

  // Hiện loading trong khi đang pre-fetch dữ liệu
  if (!prefetchDone) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-evn-blue to-[#002a4d]">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent mx-auto"></div>
          <p className="mt-4 text-white/80">Đang đồng bộ dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginPage onLogin={login} />;
  }

  if (loading && !masterData) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-evn-blue border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Đang tải dữ liệu từ Google Sheet...</p>
        </div>
      </div>
    );
  }

  if (error && !masterData) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-red-200 dark:border-red-900 max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Lỗi tải dữ liệu</h2>
          <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-evn-blue text-white rounded hover:bg-evn-blue-hover transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (currentTab === 'overview') {
      return <Overview appData={appData} isDark={isDark} />;
    }
    if (currentTab === 'tracking') {
      return <KanbanBoard appData={appData} />;
    }
    return <DeptTable deptKey={currentTab} appData={appData} />;
  };

  return (
    <>
      <Toaster position="top-right" />
      <Layout
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      masterData={masterData}
      isDark={isDark}
      onToggleDark={toggleDark}
      appData={appData}
      user={user}
      onLogout={logout}
    >
      <div key={currentTab} className="animate-fade-in h-full">
        {renderContent()}
      </div>
    </Layout>
    </>
  );
}
