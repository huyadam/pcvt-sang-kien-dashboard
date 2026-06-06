import React, { useMemo } from 'react';
import { MasterData } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface OverviewProps {
  masterData: MasterData | null;
}

export default function Overview({ masterData }: OverviewProps) {
  if (!masterData) return null;

  const stats = useMemo(() => {
    let valid = 0, filtered = 0, review = 0;
    Object.values(masterData.departments).forEach(dept => {
      dept.items.forEach(item => {
        if (item.hard_filtered) filtered++;
        else valid++;
        if (item.need_review) review++;
      });
    });
    return { valid, filtered, review, total: masterData.total };
  }, [masterData]);

  const chartData = useMemo(() => {
    return Object.entries(masterData.departments)
      .map(([key, dept]) => {
        let valid = 0, filtered = 0;
        dept.items.forEach(item => {
          if (item.hard_filtered) filtered++;
          else valid++;
        });
        return {
          name: dept.name,
          valid,
          filtered,
        };
      })
      .sort((a, b) => (b.valid + b.filtered) - (a.valid + a.filtered));
  }, [masterData]);

  return (
    <div className="space-y-6">
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

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Phân bổ Sáng kiến theo Phòng/Đội</h3>
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
            >
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={100} 
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <YAxis tick={{ fill: '#6b7280' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                itemStyle={{ color: '#1f2937', fontWeight: 500 }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="valid" name="Hợp lệ" stackId="a" fill="#004B87" radius={[0, 0, 4, 4]} />
              <Bar dataKey="filtered" name="Loại" stackId="a" fill="#d1d5db" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
