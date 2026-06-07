import React, { useMemo, useState } from 'react';
import { SangKien } from '../types';
import StatusDropdown from './StatusDropdown';
import SKDetailModal from './SKDetailModal';
import { canEditDept } from '../lib/auth';

interface DeptTableProps {
  deptKey: string;
  appData: any;
}

export default function DeptTable({ deptKey, appData }: DeptTableProps) {
  const { masterData, searchQuery, statusFilter, sortConfig, setSortConfig, quickStatusChange, user } = appData;
  const [selectedSK, setSelectedSK] = useState<SangKien | null>(null);

  const deptData = masterData?.departments[deptKey];
  
  const filteredItems = useMemo(() => {
    if (!deptData?.items) return [];
    
    return deptData.items.filter((item: SangKien) => {
      // Filter by search
      const query = searchQuery.toLowerCase();
      const matchSearch = item.ma.toLowerCase().includes(query) || 
                         item.ten.toLowerCase().includes(query) || 
                         item.donvi.toLowerCase().includes(query);
      
      // Filter by status
      const matchStatus = statusFilter === 'all' || item.trang_thai === statusFilter;
      
      return matchSearch && matchStatus;
    }).sort((a: SangKien, b: SangKien) => {
      const col = sortConfig.col as keyof SangKien;
      const asc = sortConfig.asc ? 1 : -1;
      
      if (a[col] < b[col]) return -1 * asc;
      if (a[col] > b[col]) return 1 * asc;
      return 0;
    });
  }, [deptData, searchQuery, statusFilter, sortConfig]);

  const handleSort = (col: string) => {
    if (sortConfig.col === col) {
      setSortConfig({ col, asc: !sortConfig.asc });
    } else {
      setSortConfig({ col, asc: false });
    }
  };

  if (!deptData) return <div className="p-4 text-center text-gray-500">Không tìm thấy phòng/đội</div>;

  const canEdit = user ? canEditDept(user, deptKey) : false;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {!canEdit && (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-800 p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ Bạn đang xem dữ liệu của phòng đội khác. Tính năng chấm điểm và cập nhật tiến độ đã bị vô hiệu hóa.
          </p>
        </div>
      )}
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Danh sách Sáng kiến: {deptData.name}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Hiển thị {filteredItems.length} / {deptData.count} sáng kiến
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">
                STT
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => handleSort('ma')}>
                Mã SK {sortConfig.col === 'ma' ? (sortConfig.asc ? '↑' : '↓') : ''}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 w-1/2" onClick={() => handleSort('ten')}>
                Tên Sáng Kiến {sortConfig.col === 'ten' ? (sortConfig.asc ? '↑' : '↓') : ''}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                Đơn Vị
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => handleSort('diem')}>
                Điểm AI {sortConfig.col === 'diem' ? (sortConfig.asc ? '↑' : '↓') : ''}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Trạng Thái
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  Không tìm thấy sáng kiến nào phù hợp.
                </td>
              </tr>
            ) : (
              filteredItems.map((item: SangKien, idx: number) => (
                <tr 
                  key={item.ma} 
                  onClick={() => setSelectedSK(item)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {idx + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-evn-blue dark:text-blue-400">
                    {item.ma}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                    <div className="line-clamp-2">{item.ten}</div>
                    {item.hard_filtered && (
                      <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        🗑️ Đã lọc
                      </span>
                    )}
                    {item.need_review && (
                      <span className="inline-flex items-center px-2 py-0.5 mt-1 ml-1 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                        ⚠️ Cần review
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {item.donvi}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.diem >= 8.5 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      item.diem >= 6.5 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {item.diem.toFixed(1)} / 10
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <StatusDropdown 
                      maSk={item.ma} 
                      currentStatus={item.trang_thai} 
                      onChange={quickStatusChange} 
                      disabled={!canEdit}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedSK && (
        <SKDetailModal 
          item={selectedSK} 
          onClose={() => setSelectedSK(null)} 
          appData={appData}
        />
      )}
    </div>
  );
}
