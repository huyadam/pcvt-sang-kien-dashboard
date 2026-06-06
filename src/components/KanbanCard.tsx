import React from 'react';
import { SangKien, TrackingRecord } from '../types';

interface KanbanCardProps {
  item: SangKien;
  track: TrackingRecord | null;
  boardScore?: number;
  onClick: () => void;
}

export default function KanbanCard({ item, track, boardScore, onClick }: KanbanCardProps) {
  const progress = track?.tien_do || 0;
  
  // Progress color based on status
  let pColor = "bg-evn-blue";
  if (item.trang_thai === 'hoan_thanh') pColor = "bg-green-500";
  else if (item.trang_thai === 'khong_trien_khai') pColor = "bg-red-500";

  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md hover:border-evn-blue dark:hover:border-blue-500 transition-all group"
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold text-evn-orange dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded">
          {item.ma}
        </span>
        <div className="flex items-center space-x-2">
          {boardScore !== undefined && (
            <span className="text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-1.5 py-0.5 rounded">
              {boardScore}đ
            </span>
          )}
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[90px]" title={item.donvi}>
            {item.donvi}
          </span>
        </div>
      </div>
      
      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-evn-blue dark:group-hover:text-blue-400 transition-colors">
        {item.ten}
      </h4>
      
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
        <div className="flex items-center space-x-1 truncate pr-2">
          <span>👤</span>
          <span className="truncate">{track?.nguoi_phu_trach || 'Chưa giao'}</span>
        </div>
        <span className="font-medium text-gray-700 dark:text-gray-300">{progress}%</span>
      </div>
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
        <div className={`${pColor} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${progress}%` }}></div>
      </div>
      
      {track?.deadline && (
        <div className="mt-2 text-xs text-right text-gray-400 dark:text-gray-500">
          Hạn: {new Date(track.deadline).toLocaleDateString('vi-VN')}
        </div>
      )}
    </div>
  );
}
