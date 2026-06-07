import React, { useMemo, useState } from 'react';
import { SangKien, TrackingRecord } from '../types';
import KanbanCard from './KanbanCard';
import TrackingModal from './TrackingModal';

import { canEditDept } from '../lib/auth';

interface KanbanBoardProps {
  appData: any;
}

export default function KanbanBoard({ appData }: KanbanBoardProps) {
  const { masterData, gsheetData, searchQuery, user } = appData;
  const [selectedDept, setSelectedDept] = useState<string>(() => {
    if (user && user.role === 'dept' && user.deptKey) {
      return user.deptKey;
    }
    return 'all';
  });
  const [selectedItem, setSelectedItem] = useState<{ item: SangKien, track: TrackingRecord | null } | null>(null);

  // Helper: kiểm tra department key có match với selected dept không (hỗ trợ alias)
  const isDeptMatch = (deptKey: string, selected: string): boolean => {
    if (selected === 'all') return true;
    if (deptKey === selected) return true;
    // Dùng canEditDept để check alias (ví dụ KTAT <-> Kỹ thuật An toàn)
    if (user) return canEditDept({ ...user, deptKey: selected }, deptKey);
    // Fallback: so sánh lowercase contains
    return deptKey.toLowerCase().includes(selected.toLowerCase()) || 
           selected.toLowerCase().includes(deptKey.toLowerCase());
  };

  const { trackMap, scoreMap, colItems } = useMemo(() => {
    // 1. Build track map
    const tMap = new Map<string, TrackingRecord>();
    if (gsheetData?.tracking) {
      gsheetData.tracking.forEach((t: TrackingRecord) => {
        const exist = tMap.get(t.ma_sk);
        if (!exist || new Date(t.timestamp) > new Date(exist.timestamp)) {
          tMap.set(t.ma_sk, t);
        }
      });
    }

    // Build score map
    const sMap = new Map<string, number>();
    if (gsheetData?.scores) {
      gsheetData.scores.forEach((s: any) => {
        sMap.set(s.ma_sk, (Number(s.d1_tinhmoi)||0) + (Number(s.d2_tuchu)||0) + (Number(s.d3_chiphi)||0) + (Number(s.d4_kinhte)||0) + (Number(s.d5_antoan)||0));
      });
    }

    // 2. Collect all valid items
    let all: SangKien[] = [];
    if (masterData) {
      Object.entries(masterData.departments).forEach(([key, dept]: [string, any]) => {
        if (isDeptMatch(key, selectedDept)) {
          all = all.concat(dept.items);
        }
      });
    }

    // 3. Filter by search query
    const query = searchQuery.toLowerCase();
    if (query) {
      all = all.filter(item => 
        item.ma.toLowerCase().includes(query) || 
        item.ten.toLowerCase().includes(query) || 
        item.donvi.toLowerCase().includes(query)
      );
    }

    // 4. Group into 4 columns
    const cols = {
      da_cham: [] as SangKien[],
      dang_tk: [] as SangKien[],
      hoan_thanh: [] as SangKien[],
      khong_trien_khai: [] as SangKien[]
    };

    all.forEach(item => {
      if (item.trang_thai === 'da_cham' || item.trang_thai === 'da_xet') {
        cols.da_cham.push(item);
      } else if (item.trang_thai === 'dang_tk') {
        cols.dang_tk.push(item);
      } else if (item.trang_thai === 'hoan_thanh') {
        cols.hoan_thanh.push(item);
      } else if (item.trang_thai === 'khong_trien_khai') {
        cols.khong_trien_khai.push(item);
      }
    });

    return { trackMap: tMap, scoreMap: sMap, colItems: cols };
  }, [masterData, gsheetData, searchQuery, selectedDept]);

  const isEmpty = colItems.da_cham.length === 0 && colItems.dang_tk.length === 0 && colItems.hoan_thanh.length === 0 && colItems.khong_trien_khai.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="text-6xl mb-4">📭</div>
        <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Chưa có Sáng kiến nào trong quy trình</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
          Chỉ những Sáng kiến đã được chấm điểm hoặc đang triển khai mới hiển thị trên bảng Kanban này. 
          Vui lòng vào tab Phòng/Đội để chấm điểm Sáng kiến trước.
        </p>
        <button 
          onClick={() => appData.setCurrentTab('overview')}
          className="mt-6 px-4 py-2 bg-evn-blue text-white rounded hover:bg-evn-blue-hover transition-colors"
        >
          Quay lại Tổng quan
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header: Stepper & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 px-2 pb-2">
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 overflow-x-auto pb-2 sm:pb-0">
          <span className="flex items-center"><span className="mr-1">⏳</span> Chưa xét</span>
          <span className="text-gray-300 dark:text-gray-600">→</span>
          <span className="flex items-center text-orange-600 dark:text-orange-400 font-medium bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full"><span className="mr-1">✏️</span> Đã chấm/xét</span>
          <span className="text-gray-300 dark:text-gray-600">→</span>
          <span className="flex items-center text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full"><span className="mr-1">🚀</span> Triển khai</span>
          <span className="text-gray-300 dark:text-gray-600">→</span>
          <span className="flex items-center text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full"><span className="mr-1">✅</span> Hoàn thành</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Lọc phòng đội:</span>
          <select 
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-48 p-1.5 sm:p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-evn-blue"
          >
            <option value="all">🌐 Tất cả Phòng/Đội</option>
            {masterData && Object.entries(masterData.departments).map(([key, dept]: [string, any]) => (
              <option key={key} value={key}>{dept.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-1 space-x-4 overflow-x-auto pb-4">
        {/* Col 1 */}
        <div className="flex-shrink-0 w-80 bg-gray-100 dark:bg-gray-800/50 rounded-lg flex flex-col max-h-full border border-gray-200 dark:border-gray-700">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-orange-100/50 dark:bg-orange-900/20 rounded-t-lg">
            <h3 className="font-semibold text-orange-800 dark:text-orange-400 flex justify-between items-center">
              <span>✏️ Chờ Triển khai</span>
              <span className="bg-white dark:bg-gray-800 text-xs px-2 py-1 rounded-full">{colItems.da_cham.length}</span>
            </h3>
          </div>
          <div className="p-3 flex-1 overflow-y-auto space-y-3">
            {colItems.da_cham.map(item => (
              <KanbanCard 
                key={item.ma} 
                item={item} 
                track={trackMap.get(item.ma) || null} 
                boardScore={scoreMap.get(item.ma)}
                onClick={() => setSelectedItem({ item, track: trackMap.get(item.ma) || null })}
              />
            ))}
          </div>
        </div>

        {/* Col 2 */}
        <div className="flex-shrink-0 w-80 bg-gray-100 dark:bg-gray-800/50 rounded-lg flex flex-col max-h-full border border-gray-200 dark:border-gray-700">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-blue-100/50 dark:bg-blue-900/20 rounded-t-lg">
            <h3 className="font-semibold text-evn-blue dark:text-blue-400 flex justify-between items-center">
              <span>🚀 Đang Triển khai</span>
              <span className="bg-white dark:bg-gray-800 text-xs px-2 py-1 rounded-full">{colItems.dang_tk.length}</span>
            </h3>
          </div>
          <div className="p-3 flex-1 overflow-y-auto space-y-3">
            {colItems.dang_tk.map(item => (
              <KanbanCard 
                key={item.ma} 
                item={item} 
                track={trackMap.get(item.ma) || null} 
                boardScore={scoreMap.get(item.ma)}
                onClick={() => setSelectedItem({ item, track: trackMap.get(item.ma) || null })}
              />
            ))}
          </div>
        </div>

        {/* Col 3 */}
        <div className="flex-shrink-0 w-80 bg-gray-100 dark:bg-gray-800/50 rounded-lg flex flex-col max-h-full border border-gray-200 dark:border-gray-700">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-green-100/50 dark:bg-green-900/20 rounded-t-lg">
            <h3 className="font-semibold text-green-700 dark:text-green-400 flex justify-between items-center">
              <span>✅ Đã Hoàn thành</span>
              <span className="bg-white dark:bg-gray-800 text-xs px-2 py-1 rounded-full">{colItems.hoan_thanh.length}</span>
            </h3>
          </div>
          <div className="p-3 flex-1 overflow-y-auto space-y-3">
            {colItems.hoan_thanh.map(item => (
              <KanbanCard 
                key={item.ma} 
                item={item} 
                track={trackMap.get(item.ma) || null} 
                boardScore={scoreMap.get(item.ma)}
                onClick={() => setSelectedItem({ item, track: trackMap.get(item.ma) || null })}
              />
            ))}
          </div>
        </div>

        {/* Col 4 */}
        <div className="flex-shrink-0 w-80 bg-gray-100 dark:bg-gray-800/50 rounded-lg flex flex-col max-h-full border border-gray-200 dark:border-gray-700 opacity-80 hover:opacity-100 transition-opacity">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-red-100/30 dark:bg-red-900/10 rounded-t-lg">
            <h3 className="font-semibold text-red-700 dark:text-red-400 flex justify-between items-center">
              <span>❌ Không triển khai</span>
              <span className="bg-white dark:bg-gray-800 text-xs px-2 py-1 rounded-full">{colItems.khong_trien_khai.length}</span>
            </h3>
          </div>
          <div className="p-3 flex-1 overflow-y-auto space-y-3">
            {colItems.khong_trien_khai.map(item => (
              <KanbanCard 
                key={item.ma} 
                item={item} 
                track={trackMap.get(item.ma) || null} 
                boardScore={scoreMap.get(item.ma)}
                onClick={() => setSelectedItem({ item, track: trackMap.get(item.ma) || null })}
              />
            ))}
          </div>
        </div>
      </div>

      {selectedItem && (
        <TrackingModal 
          item={selectedItem.item}
          track={selectedItem.track}
          onClose={() => setSelectedItem(null)}
          appData={appData}
        />
      )}
    </div>
  );
}
