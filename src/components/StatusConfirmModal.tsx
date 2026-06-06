import React, { useState } from 'react';
import { TrangThai } from '../types';

interface StatusConfirmModalProps {
  maSk: string;
  phongDoi: string;
  total: number;
  grade: string;
  reviewer: string;
  onClose: () => void;
  appData: any;
}

export default function StatusConfirmModal({ maSk, phongDoi, total, grade, reviewer, onClose, appData }: StatusConfirmModalProps) {
  const [loadingStatus, setLoadingStatus] = useState<TrangThai | null>(null);

  const applyStatus = async (status: TrangThai) => {
    setLoadingStatus(status);
    try {
      const res = await appData.handleSubmitTracking({
        action: 'tracking',
        ma_sk: maSk,
        phong_doi: phongDoi,
        nguoi_phu_trach: reviewer,
        trang_thai: status,
        ghi_chu: `Hệ thống: Chuyển trạng thái sau khi chấm điểm (${total}đ - Loại ${grade})`
      });
      if (res.success) {
        onClose();
      } else {
        alert("Lỗi cập nhật: " + res.message);
      }
    } catch (e: any) {
      alert("Lỗi hệ thống: " + e.message);
    } finally {
      setLoadingStatus(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 text-center">
        <div className="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/80 backdrop-blur-sm" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full border border-gray-200 dark:border-gray-700">
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
            <h3 className="text-xl font-bold text-white flex items-center space-x-2">
              <span>✅ Chấm điểm Thành công!</span>
            </h3>
          </div>

          <div className="px-6 py-6 text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-4 text-lg">
              Sáng kiến <strong className="text-evn-blue dark:text-blue-400">{maSk}</strong> đạt <strong className="text-2xl">{total}</strong> điểm (Loại <strong className="text-2xl text-evn-orange">{grade}</strong>)
            </p>
            <p className="text-gray-500 dark:text-gray-400 mb-6 font-medium">Bạn muốn cập nhật Trạng thái xử lý tiếp theo là gì?</p>

            <div className="space-y-3">
              <button 
                onClick={() => applyStatus('trien_khai')}
                disabled={loadingStatus !== null}
                className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all font-bold text-lg
                  ${grade === 'A' ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 shadow-md transform hover:scale-[1.02]' 
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              >
                <span>🚀 Triển khai ngay</span>
                {grade === 'A' && <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full uppercase">Đề xuất</span>}
                {loadingStatus === 'trien_khai' && <span className="animate-spin ml-2">⏳</span>}
              </button>

              <button 
                onClick={() => applyStatus('da_xet')}
                disabled={loadingStatus !== null}
                className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all font-bold text-lg
                  ${grade === 'B' ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 shadow-md transform hover:scale-[1.02]' 
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              >
                <span>📋 Đã xét duyệt — Lên Kế hoạch</span>
                {grade === 'B' && <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded-full uppercase">Đề xuất</span>}
                {loadingStatus === 'da_xet' && <span className="animate-spin ml-2">⏳</span>}
              </button>

              <button 
                onClick={() => applyStatus('khong_trien_khai')}
                disabled={loadingStatus !== null}
                className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all font-bold text-lg
                  ${grade === 'C' ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 shadow-md transform hover:scale-[1.02]' 
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              >
                <span>❌ Không triển khai</span>
                {grade === 'C' && <span className="ml-2 text-xs bg-red-500 text-white px-2 py-1 rounded-full uppercase">Đề xuất</span>}
                {loadingStatus === 'khong_trien_khai' && <span className="animate-spin ml-2">⏳</span>}
              </button>

              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                <button 
                  onClick={onClose}
                  disabled={loadingStatus !== null}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium"
                >
                  <span>⏭️ Để sau (Giữ trạng thái Đã chấm)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
