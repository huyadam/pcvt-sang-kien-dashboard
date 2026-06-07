import React, { useState } from 'react';
import { Menu, X, Sun, Moon, Download, Search, Filter, RefreshCw } from 'lucide-react';
import DeptNav from './DeptNav';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentTab: string;
  onTabChange: (tab: string) => void;
  masterData: any;
  isDark: boolean;
  onToggleDark: () => void;
  appData: any;
  user: User;
  onLogout: () => void;
}

export default function Layout({
  children,
  currentTab,
  onTabChange,
  masterData,
  isDark,
  onToggleDark,
  appData,
  user,
  onLogout
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleExportCSV = () => {
    if (!masterData) return;
    let csvContent = '\uFEFF'; // BOM
    csvContent += 'Mã SK,Tên Sáng Kiến,Đơn Vị,Tác Giả,Phòng/Đội,Điểm AI,Xếp Loại,Trạng Thái\n';

    Object.values(masterData.departments).forEach((dept: any) => {
      dept.items.forEach((item: any) => {
        const row = [
          item.ma,
          `"${item.ten.replace(/"/g, '""')}"`,
          `"${item.donvi}"`,
          '', // Tác giả chưa có trong data
          `"${dept.name}"`,
          item.diem,
          item.diem >= 8.5 ? 'A' : (item.diem >= 6.5 ? 'B' : 'C'),
          item.trang_thai
        ].join(',');
        csvContent += row + '\n';
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SangKien_PCVT_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-72 transform bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded bg-evn-blue flex items-center justify-center text-white font-bold">
              EVN
            </div>
            <span className="font-semibold text-gray-900 dark:text-white truncate">
              Sáng Kiến PCVT
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mt-4 px-2 custom-scrollbar pb-6">
          <DeptNav
            departments={masterData?.departments || {}}
            currentTab={currentTab}
            onTabChange={(tab) => {
              onTabChange(tab);
              setSidebarOpen(false);
            }}
            user={user}
          />
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center space-x-3 mb-3 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="w-8 h-8 bg-evn-blue text-white rounded-full flex items-center justify-center font-bold">
              {user.role === 'admin' ? 'A' : 'P'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{user.displayName}</p>
              <p className="text-xs text-gray-500 truncate">{user.username}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none transition-colors"
          >
            🔓 Đăng xuất
          </button>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-center">
            Cập nhật: {masterData?.generated_at ? new Date(masterData.generated_at).toLocaleString('vi-VN') : 'Đang tải...'}
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between px-4 sm:px-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="mr-4 p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white hidden sm:block">
              {currentTab === 'overview'
                ? 'Tổng quan Phân loại'
                : currentTab === 'tracking'
                ? 'Theo dõi Tiến độ'
                : masterData?.departments[currentTab]?.name || 'Chi tiết'}
            </h1>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {currentTab !== 'overview' && currentTab !== 'tracking' && (
              <div className="flex items-center space-x-2">
                <div className="relative w-32 sm:w-48">
                  <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                    <Search size={14} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={appData.searchQuery}
                    onChange={(e) => appData.setSearchQuery(e.target.value)}
                    placeholder="Tìm..."
                    className="block w-full pl-7 sm:pl-10 pr-2 sm:pr-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-evn-blue focus:border-evn-blue text-xs sm:text-sm"
                  />
                </div>
                <div className="relative w-32 sm:w-48 hidden xs:block">
                  <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                    <Filter size={14} className="text-gray-400" />
                  </div>
                  <select
                    value={appData.statusFilter}
                    onChange={(e) => appData.setStatusFilter(e.target.value)}
                    className="block w-full pl-7 sm:pl-10 pr-6 sm:pr-8 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-evn-blue focus:border-evn-blue text-xs sm:text-sm appearance-none"
                  >
                    <option value="all">Tất cả</option>
                    <option value="chua_xet">⏳ Chưa xét</option>
                    <option value="da_cham">✏️ Đã chấm</option>
                    <option value="dang_tk">🚀 Triển khai</option>
                    <option value="hoan_thanh">✅ Hoàn thành</option>
                    <option value="khong_trien_khai">❌ Không TK</option>
                  </select>
                </div>
              </div>
            )}

            <button
              onClick={appData.refreshData}
              className={`p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 ${appData.loading ? 'animate-spin text-evn-blue' : ''}`}
              title="Làm mới dữ liệu"
            >
              <RefreshCw size={20} />
            </button>
            <button
              onClick={onToggleDark}
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hidden sm:block"
              title="Đổi giao diện Sáng/Tối"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1 p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Xuất CSV"
            >
              <Download size={20} />
              <span className="hidden sm:inline text-sm font-medium">Xuất CSV</span>
            </button>
          </div>
        </header>

        {/* Main Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
