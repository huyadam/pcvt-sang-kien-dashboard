import React, { useMemo, useState } from 'react';
import { SangKien, TrackingRecord } from '../types';
import KanbanCard from './KanbanCard';
import TrackingModal from './TrackingModal';

interface KanbanBoardProps {
  appData: any;
}

export default function KanbanBoard({ appData }: KanbanBoardProps) {
  const { masterData, gsheetData, searchQuery } = appData;
  const [selectedItem, setSelectedItem] = useState<{ item: SangKien, track: TrackingRecord | null } | null>(null);

  const { trackMap, colItems } = useMemo(() => {
    // 1. Build track map (latest record per ma_sk)
    const tMap = new Map<string, TrackingRecord>();
    if (gsheetData?.tracking) {
      gsheetData.tracking.forEach((t: TrackingRecord) => {
        const exist = tMap.get(t.ma_sk);
        if (!exist || new Date(t.timestamp) > new Date(exist.timestamp)) {
          tMap.set(t.ma_sk, t);
        }
      });
    }

    // 2. Collect all valid items
    let all: SangKien[] = [];
    if (masterData) {
      Object.values(masterData.departments).forEach((dept: any) => {
        all = all.concat(dept.items);
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

    // 4. Group into 3 columns
    const cols = {
      da_cham: [] as SangKien[],
      dang_tk: [] as SangKien[],
      hoan_thanh: [] as SangKien[]
    };

    all.forEach(item => {
      if (item.trang_thai === 'da_cham' || item.trang_thai === 'da_xet') {
        cols.da_cham.push(item);
      } else if (item.trang_thai === 'dang_tk' || item.trang_thai === 'trien_khai') {
        cols.dang_tk.push(item);
      } else if (item.trang_thai === 'hoan_thanh') {
        cols.hoan_thanh.push(item);
      }
      // chua_xet, chua_cham, huy, khong_trien_khai -> hidden
    });

    return { trackMap: tMap, colItems: cols };
  }, [masterData, gsheetData, searchQuery]);

  const isEmpty = colItems.da_cham.length === 0 && colItems.dang_tk.length === 0 && colItems.hoan_thanh.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="text-6xl mb-4">📭</div>
        <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Chưa có Sáng kiến nào đang theo dõi</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
          Chỉ những Sáng kiến đã được chấm điểm hoặc đang triển khai mới hiển thị trên bảng Kanban này.
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
    <div className="flex h-full space-x-4 overflow-x-auto pb-4">
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
              onClick={() => setSelectedItem({ item, track: trackMap.get(item.ma) || null })}
            />
          ))}
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
