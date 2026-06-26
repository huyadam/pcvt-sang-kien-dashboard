import React from 'react';
import { useAppData } from './hooks/useAppData';
import { useDarkMode } from './hooks/useDarkMode';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import Overview from './components/Overview';
import DeptTable from './components/DeptTable';
import KanbanBoard from './components/KanbanBoard';
import { Toaster } from 'react-hot-toast';

export default function App() {
  const { isDark, toggle: toggleDark } = useDarkMode();
  const { user, isAuthenticated, login, logout } = useAuth();
  const appData = useAppData(user);

  const {
    loading,
    error,
    masterData,
    gsheetData,
    currentTab,
    setCurrentTab,
    refreshData,
  } = appData;

  if (!isAuthenticated || !user) {
    return <LoginPage onLogin={login} />;
  }

  const renderContent = () => {
    if (loading && !masterData) {
      return (
        <div className="space-y-4 animate-pulse">
          {error ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Lỗi tải dữ liệu</h2>
              <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
              <button onClick={refreshData} className="px-4 py-2 bg-evn-blue text-white rounded hover:bg-evn-blue-hover transition-colors">
                Thử lại
              </button>
            </div>
          ) : (
            <>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="mt-6 space-y-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
              <p className="text-center text-sm text-gray-400 dark:text-gray-500 pt-4">
                Đang tải dữ liệu từ Google Sheet...
              </p>
            </>
          )}
        </div>
      );
    }
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
