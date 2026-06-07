import React, { useMemo } from 'react';
import { MasterData, SangKien } from '../types';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { sortDeptEntries } from '../lib/constants';

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
  const { masterData, gsheetData } = appData;
  if (!masterData) return null;

  const stats = useMemo(() => {
    let valid = 0, filtered = 0, review = 0;
    Object.values(masterData.departments).forEach((dept: any) => {
      dept.items.forEach((item: SangKien) => {
        if (item.hard_filtered) filtered++;
        else valid++;
        if (item.need_review) review++;
      });
    });
    return { valid, filtered, review, total: masterData.total };
  }, [masterData]);

  const pieData = useMemo(() => {
    const counts: Record<string, number> = {
      chua_xet: 0, da_cham: 0, da_xet: 0, dang_tk: 0, hoan_thanh: 0, khong_trien_khai: 0
    };
    Object.values(masterData.departments).forEach((dept: any) => {
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
  }, [masterData]);

  const barData = useMemo(() => {
    const sortedEntries = sortDeptEntries(Object.entries(masterData.departments));
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
        name: dept.name,
        'Chưa xét': chua_xet,
        'Đã chấm/xét': da_cham,
        'Đang TK': dang_tk,
        'Hoàn thành': hoan_thanh,
        'Không TK': khong_tk,
      };
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

    Object.values(masterData.departments).forEach((dept: any) => {
      dept.items.forEach((item: SangKien) => {
        if (!item.hard_filtered) {
          const finalScore = scoreMap.has(item.ma) ? scoreMap.get(item.ma) : item.diem;
          all.push({ ...item, totalScore: finalScore });
        }
      });
    });

    return all.sort((a, b) => b.totalScore - a.totalScore).slice(0, 10);
  }, [masterData, gsheetData]);

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Tỷ lệ Trạng thái Sáng kiến</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: isDark ? '#d1d5db' : '#374151', fontSize: '12px', marginTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stacked Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Trạng thái theo Phòng/Đội</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={30} wrapperStyle={{ color: isDark ? '#d1d5db' : '#374151', fontSize: '12px' }} />
                <Bar dataKey="Chưa xét" stackId="a" fill={COLORS.chua_xet} radius={[0,0,2,2]} />
                <Bar dataKey="Đã chấm/xét" stackId="a" fill={COLORS.da_cham} />
                <Bar dataKey="Đang TK" stackId="a" fill={COLORS.dang_tk} />
                <Bar dataKey="Hoàn thành" stackId="a" fill={COLORS.hoan_thanh} />
                <Bar dataKey="Không TK" stackId="a" fill={COLORS.khong_trien_khai} radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Sáng kiến */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Top 10 Sáng kiến Nổi bật</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '50px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '50%' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '80px' }} />
            </colgroup>
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hạng</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mã SK</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tên Sáng Kiến</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Đơn vị</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Điểm</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {topItems.map((item, idx) => (
                <tr key={item.ma} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-800' : idx === 1 ? 'bg-gray-200 text-gray-800' : idx === 2 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-evn-blue dark:text-blue-400">{item.ma}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100"><div className="line-clamp-1">{item.ten}</div></td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.donvi}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">{item.totalScore.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
