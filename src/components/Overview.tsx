import React, { useMemo, useState } from 'react';
import { MasterData, SangKien } from '../types';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import { sortDeptEntries, DEPT_GROUPS } from '../lib/constants';

interface OverviewProps {
  appData: any;
  isDark?: boolean;
}

const COLORS = {
  chua_xet: '#f59e0b',
  da_cham: '#3b82f6',
  da_xet: '#6366f1',
  dang_tk: '#10b981',
  hoan_thanh: '#059669',
  khong_trien_khai: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  chua_xet: 'Chưa xét',
  da_cham: 'Đã chấm',
  da_xet: 'Đã duyệt',
  dang_tk: 'Đang TK',
  hoan_thanh: 'Hoàn thành',
  khong_trien_khai: 'Hủy/Không TK',
};

export default function Overview({ appData, isDark = false }: OverviewProps) {
  const { masterData, gsheetData, user } = appData;
  const [filterDept, setFilterDept] = useState<string>(() => {
    return user && user.role === 'dept' && user.deptKey ? user.deptKey : 'all';
  });

  if (!masterData) return null;

  const getFilteredDepts = () => {
    if (filterDept === 'all') return Object.entries(masterData.departments);
    if (masterData.departments[filterDept]) return [[filterDept, masterData.departments[filterDept]]];
    return [];
  };

  const stats = useMemo(() => {
    let valid = 0, filtered = 0, review = 0, total = 0;
    getFilteredDepts().forEach(([_, dept]: [string, any]) => {
      total += dept.count;
      dept.items.forEach((item: SangKien) => {
        if (item.hard_filtered) filtered++;
        else valid++;
        if (item.need_review) review++;
      });
    });
    return { valid, filtered, review, total };
  }, [masterData, filterDept]);

  const pieData = useMemo(() => {
    const counts: Record<string, number> = {
      chua_xet: 0, da_cham: 0, da_xet: 0, dang_tk: 0, hoan_thanh: 0, khong_trien_khai: 0
    };
    getFilteredDepts().forEach(([_, dept]: [string, any]) => {
      dept.items.forEach((item: SangKien) => {
        if (!item.hard_filtered) {
          if (counts[item.trang_thai] !== undefined) {
            counts[item.trang_thai]++;
          } else {
            counts['chua_xet']++;
          }
        }
      });
    });
    return Object.keys(counts).map(k => ({
      name: STATUS_LABELS[k] || k,
      value: counts[k],
      color: COLORS[k as keyof typeof COLORS] || '#9ca3af'
    })).filter(d => d.value > 0);
  }, [masterData, filterDept]);

  const barData = useMemo(() => {
    const sortedEntries = sortDeptEntries(getFilteredDepts());
    return sortedEntries.map(([key, dept]: [string, any]) => {
      let chua_xet = 0, da_cham = 0, dang_tk = 0, hoan_thanh = 0, khong_tk = 0;
      dept.items.forEach((item: SangKien) => {
        if (!item.hard_filtered) {
          if (item.trang_thai === 'chua_xet') chua_xet++;
          else if (item.trang_thai === 'da_cham' || item.trang_thai === 'da_xet') da_cham++;
          else if (item.trang_thai === 'dang_tk') dang_tk++;
          else if (item.trang_thai === 'hoan_thanh') hoan_thanh++;
          else khong_tk++;
        }
      });
      return {
        name: filterDept === 'all' ? dept.name : 'Số lượng',
        'Chưa xét': chua_xet,
        'Đã chấm/xét': da_cham,
        'Đang TK': dang_tk,
        'Hoàn thành': hoan_thanh,
        'Không TK': khong_tk,
      };
    });
  }, [masterData, filterDept]);

  const khoiStats = useMemo(() => {
    return DEPT_GROUPS.map(group => {
      let total = 0, valid = 0, hoanThanh = 0, dangTK = 0, daCham = 0;
      Object.entries(masterData.departments).forEach(([_, dept]: [string, any]) => {
        const inGroup = group.depts.some(gd => dept.name.includes(gd) || gd.includes(dept.name));
        if (!inGroup) return;
        dept.items.forEach((item: SangKien) => {
          total++;
          if (!item.hard_filtered) {
            valid++;
            if (item.trang_thai === 'hoan_thanh') hoanThanh++;
            else if (item.trang_thai === 'dang_tk' || item.trang_thai === 'trien_khai') dangTK++;
            else if (item.trang_thai === 'da_cham' || item.trang_thai === 'da_xet') daCham++;
          }
        });
      });
      const pctDone = valid > 0 ? Math.round((hoanThanh / valid) * 100) : 0;
      return { ...group, total, valid, hoanThanh, dangTK, daCham, pctDone };
    });
  }, [masterData]);

  const topItems = useMemo(() => {
    let all: Array<SangKien & { totalScore: number }> = [];
    
    // Map scores from gsheet
    const scoreMap = new Map();
    if (gsheetData?.scores) {
      gsheetData.scores.forEach((s: any) => {
        const t = (Number(s.d1_tinhmoi)||0) + (Number(s.d2_tuchu)||0) + (Number(s.d3_chiphi)||0) + (Number(s.d4_kinhte)||0) + (Number(s.d5_antoan)||0);
        scoreMap.set(s.ma_sk, t);
      });
    }

    getFilteredDepts().forEach(([_, dept]: [string, any]) => {
      dept.items.forEach((item: SangKien) => {
        if (!item.hard_filtered) {
          const finalScore = scoreMap.has(item.ma) ? scoreMap.get(item.ma) : item.diem;
          all.push({ ...item, totalScore: finalScore });
        }
      });
    });

    return all.sort((a, b) => b.totalScore - a.totalScore).slice(0, 10);
  }, [masterData, gsheetData, filterDept]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-lg shadow-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-800'}`}>
          <p className="font-semibold mb-2">{label || payload[0].name}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <span>{entry.name}: </span>
              <span className="font-bold">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tổng quan Sáng kiến PCVT 2026</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Lọc phòng đội:</span>
          <select 
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="w-48 p-1.5 sm:p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-evn-blue"
          >
            <option value="all">🌐 Tất cả Phòng/Đội</option>
            {Object.entries(masterData.departments).map(([key, dept]: [string, any]) => (
              <option key={key} value={key}>{dept.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-gray-400">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tổng Số Sáng Kiến</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-evn-blue">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Hợp Lệ Cấp Cơ Sở</p>
          <p className="text-3xl font-bold text-evn-blue mt-2">{stats.valid}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-gray-300">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Loại (Hard-filtered)</p>
          <p className="text-3xl font-bold text-gray-600 dark:text-gray-300 mt-2">{stats.filtered}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-evn-orange">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cần Review Thêm</p>
          <p className="text-3xl font-bold text-evn-orange mt-2">{stats.review}</p>
        </div>
      </div>

      {/* Thống kê theo Khối */}
      {filterDept === 'all' && (
        <div>
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">Thống kê theo Khối</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {khoiStats.map(g => (
              <div key={g.label} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-semibold ${g.color}`}>{g.icon} {g.label}</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{g.valid}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-2">
                  <div
                    className="bg-green-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${g.pctDone}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>✅ HT: {g.hoanThanh}</span>
                  <span>🔄 TK: {g.dangTK}</span>
                  <span>📋 Chấm: {g.daCham}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard + Radar — chỉ hiện khi xem tất cả */}
      {filterDept === 'all' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leaderboard khối */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-4">🏆 Xếp hạng Khối</h3>
            <div className="space-y-3">
              {[...khoiStats]
                .sort((a, b) => b.pctDone - a.pctDone || b.hoanThanh - a.hoanThanh)
                .map((g, idx) => {
                  const medals = ['🥇', '🥈', '🥉', '4️⃣'];
                  const pctTK = g.valid > 0 ? Math.round(((g.hoanThanh + g.dangTK) / g.valid) * 100) : 0;
                  return (
                    <div key={g.label} className="flex items-center space-x-3">
                      <span className="text-xl w-8 text-center">{medals[idx]}</span>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-sm font-medium ${g.color}`}>{g.icon} {g.label}</span>
                          <span className="text-xs text-gray-500">{g.hoanThanh} HT / {g.valid} SK</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: `${g.pctDone}%` }} />
                          <div className="bg-blue-400 h-2 rounded-full -mt-2" style={{ width: `${pctTK}%`, opacity: 0.4 }} />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                          <span>HT: {g.pctDone}%</span>
                          <span>Đang TK: {pctTK}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Radar chart so sánh khối */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">📡 So sánh Khối (radar)</h3>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  data={(() => {
                    const maxValid = Math.max(...khoiStats.map(g => g.valid), 1);
                    return [
                      { metric: 'Số lượng', ...Object.fromEntries(khoiStats.map(g => [g.label, Math.round((g.valid / maxValid) * 100)])) },
                      { metric: '% Hoàn thành', ...Object.fromEntries(khoiStats.map(g => [g.label, g.pctDone])) },
                      { metric: '% Triển khai', ...Object.fromEntries(khoiStats.map(g => [g.label, g.valid > 0 ? Math.round(((g.hoanThanh + g.dangTK) / g.valid) * 100) : 0])) },
                      { metric: '% Đã chấm', ...Object.fromEntries(khoiStats.map(g => [g.label, g.valid > 0 ? Math.round((g.daCham / g.valid) * 100) : 0])) },
                    ];
                  })()}
                  outerRadius={80}
                >
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                  {khoiStats.map((g) => (
                    <Radar
                      key={g.label}
                      name={g.label}
                      dataKey={g.label}
                      stroke={g.label.includes('Kỹ thuật') ? '#ca8a04' : g.label.includes('Kinh doanh') ? '#16a34a' : g.label.includes('ĐTXD') ? '#2563eb' : '#7c3aed'}
                      fill={g.label.includes('Kỹ thuật') ? '#ca8a04' : g.label.includes('Kinh doanh') ? '#16a34a' : g.label.includes('ĐTXD') ? '#2563eb' : '#7c3aed'}
                      fillOpacity={0.08}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
