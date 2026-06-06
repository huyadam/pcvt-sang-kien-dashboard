import React from 'react';
import { Department } from '../types';
import { sortDeptEntries } from '../lib/constants';

interface DeptNavProps {
  departments: Record<string, Department>;
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export default function DeptNav({ departments, currentTab, onTabChange }: DeptNavProps) {
  // Sắp xếp theo thứ tự QĐ 09 thay vì alphabetical
  const depts = sortDeptEntries(Object.entries(departments));

  const NavItem = ({ id, label, icon, badge }: { id: string, label: string, icon: string, badge?: number }) => {
    const isActive = currentTab === id;
    return (
      <button
        onClick={() => onTabChange(id)}
        className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-evn-blue text-white'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <div className="flex items-center space-x-3 truncate">
          <span>{icon}</span>
          <span className="truncate">{label}</span>
        </div>
        {badge !== undefined && (
          <span
            className={`px-2 py-0.5 rounded-full text-xs ${
              isActive
                ? 'bg-white/20 text-white'
                : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
            }`}
          >
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <nav className="flex flex-col py-4">
      <NavItem id="overview" label="Tổng quan" icon="📊" />
      <NavItem id="tracking" label="Theo dõi Tiến độ" icon="📈" />
      
      <div className="my-4 border-t border-gray-200 dark:border-gray-700"></div>
      
      <div className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Phòng / Đội
      </div>
      
      {depts.map(([key, dept]) => (
        <NavItem
          key={key}
          id={key}
          label={dept.name}
          icon="🏢"
          badge={dept.count}
        />
      ))}
    </nav>
  );
}
