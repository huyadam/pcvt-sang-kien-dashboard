import React, { useMemo, useState } from 'react';
import { Department, User } from '../types';
import { sortDeptEntries, DEPT_GROUPS } from '../lib/constants';

interface DeptNavProps {
  departments: Record<string, Department>;
  currentTab: string;
  onTabChange: (tab: string) => void;
  user: User;
  gsheetData?: any;
}

export default function DeptNav({ departments, currentTab, onTabChange, user, gsheetData }: DeptNavProps) {
  const depts = sortDeptEntries(Object.entries(departments));

  const deadlineMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (!gsheetData?.tracking) return map;
    const now = Date.now();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const latestTrack = new Map<string, any>();
    gsheetData.tracking.forEach((t: any) => {
      const ex = latestTrack.get(t.ma_sk);
      if (!ex || new Date(t.timestamp) > new Date(ex.timestamp)) latestTrack.set(t.ma_sk, t);
    });
    latestTrack.forEach((t) => {
      if (!t.deadline || t.trang_thai === 'hoan_thanh' || t.trang_thai === 'khong_trien_khai') return;
      const dl = new Date(t.deadline).getTime();
      if (isNaN(dl)) return;
      if (dl > now && dl - now <= SEVEN_DAYS) {
        const key = t.phong_doi || '';
        map[key] = (map[key] || 0) + 1;
      }
    });
    return map;
  }, [gsheetData]);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggleGroup = (label: string) =>
    setCollapsed(prev => ({ ...prev, [label]: !prev[label] }));

  const NavItem = ({ id, label, icon, badge, deadlineCount = 0, indent = false }: {
    id: string; label: string; icon: string; badge?: number; deadlineCount?: number; indent?: boolean;
  }) => {
    const isActive = currentTab === id;
    return (
      <button
        onClick={() => onTabChange(id)}
        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors ${
          indent ? 'pl-8' : ''
        } ${
          isActive
            ? 'bg-evn-blue text-white'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <div className="flex items-center space-x-3 truncate">
          <span>{icon}</span>
          <span className="truncate">{label}</span>
        </div>
        <div className="flex items-center space-x-1 shrink-0">
          {deadlineCount > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                isActive
                  ? 'bg-orange-300 text-orange-900'
                  : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
              }`}
              title={`${deadlineCount} SK sap den han`}
            >
              {deadlineCount}
            </span>
          )}
          {badge !== undefined && (
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              isActive ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
            }`}>
              {badge}
            </span>
          )}
        </div>
      </button>
    );
  };

  const myDepts = depts.filter(([k, d]) =>
    k.includes(user.deptKey) || user.deptKey.includes(k) ||
    d.name.includes(user.deptKey) || user.deptKey.includes(d.name)
  );

  const otherDepts = depts.filter(([k, d]) =>
    !(k.includes(user.deptKey) || user.deptKey.includes(k) ||
      d.name.includes(user.deptKey) || user.deptKey.includes(d.name))
  );

  const renderGrouped = (entries: [string, Department][]) => {
    const rendered: React.ReactNode[] = [];

    for (const group of DEPT_GROUPS) {
      const groupDepts = entries.filter(([_, d]) =>
        group.depts.some(gd => d.name.includes(gd) || gd.includes(d.name))
      );
      if (groupDepts.length === 0) continue;

      const isCollapsed = collapsed[group.label];
      const groupTotal = groupDepts.reduce((sum, [_, d]) => sum + d.count, 0);

      rendered.push(
        <div key={group.label}>
          <button
            onClick={() => toggleGroup(group.label)}
            className="w-full flex items-center justify-between px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span className={`flex items-center space-x-1.5 ${group.color}`}>
              <span>{group.icon}</span>
              <span>{group.label}</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="text-gray-400 text-xs normal-case font-normal">{groupTotal}</span>
              <span className="text-gray-400">{isCollapsed ? '>' : 'v'}</span>
            </span>
          </button>
          {!isCollapsed && groupDepts.map(([key, dept]) => (
            <NavItem
              key={key}
              id={key}
              label={dept.name}
              icon="*"
              badge={dept.count}
              deadlineCount={deadlineMap[dept.name] || deadlineMap[key] || 0}
              indent
            />
          ))}
        </div>
      );
    }

    const ungrouped = entries.filter(([_, d]) =>
      !DEPT_GROUPS.some(g => g.depts.some(gd => d.name.includes(gd) || gd.includes(d.name)))
    );
    if (ungrouped.length > 0) {
      rendered.push(
        <div key="__other">
          <div className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Khac
          </div>
          {ungrouped.map(([key, dept]) => (
            <NavItem key={key} id={key} label={dept.name} icon="*" badge={dept.count} indent />
          ))}
        </div>
      );
    }

    return rendered;
  };

  return (
    <nav className="flex flex-col py-4">
      <NavItem id="overview" label="Tong quan" icon="*" />
      <NavItem id="tracking" label="Theo doi Tien do" icon="*" />

      <div className="my-3 border-t border-gray-200 dark:border-gray-700" />

      {/* Skeleton khi chưa có dữ liệu */}
      {depts.length === 0 ? (
        <div className="px-4 space-y-2 animate-pulse">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-100 dark:bg-gray-700/50 rounded"></div>
          ))}
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mt-4 mb-2"></div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-100 dark:bg-gray-700/50 rounded"></div>
          ))}
        </div>
      ) : (
        <>
          {user.role === 'dept' && myDepts.length > 0 && (
            <>
              <div className="px-4 mb-1 text-xs font-semibold text-evn-orange uppercase tracking-wider flex items-center space-x-1">
                <span>Phong cua toi</span>
              </div>
              {myDepts.map(([key, dept]) => (
                <NavItem key={key} id={key} label={dept.name} icon="*" badge={dept.count}
                  deadlineCount={deadlineMap[dept.name] || deadlineMap[key] || 0} />
              ))}
              <div className="my-3 border-t border-gray-200 dark:border-gray-700" />
            </>
          )}
          <div className="pb-1">
            {user.role === 'admin'
              ? renderGrouped(depts)
              : renderGrouped(otherDepts)
            }
          </div>
        </>
      )}
    </nav>
  );
}
