import React, { useState, useEffect } from 'react';
import { SangKien, TrackingRecord, TrangThai } from '../types';

interface TrackingModalProps {
  item: SangKien;
  track: TrackingRecord | null;
  onClose: () => void;
  appData: any;
}

export default function TrackingModal({ item, track, onClose, appData }: TrackingModalProps) {
  const [formData, setFormData] = useState({
    nguoi_phu_trach: '',
    ngay_bat_dau: '',
    deadline: '',
    tien_do: 0,
    trang_thai: item.trang_thai,
    ghi_chu: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (track) {
      setFormData({
        nguoi_phu_trach: track.nguoi_phu_trach || '',
        // Extract YYYY-MM-DD from ISO string if exists
        ngay_bat_dau: track.ngay_bat_dau ? track.ngay_bat_dau.split('T')[0] : '',
        deadline: track.deadline ? track.deadline.split('T')[0] : '',
        tien_do: track.tien_do || 0,
        trang_thai: item.trang_thai, // Always use current state from item
        ghi_chu: '' // Keep empty for new note
      });
    }
  }, [track, item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        action: 'tracking',
        ma_sk: item.ma,
        phong_doi: item.source_dept || 'Văn phòng',
        ...formData
      };
      
      const res = await appData.handleSubmitTracking(payload);
      if (res.success) {
        onClose();
      } else {
        alert("Lỗi cập nhật: " + res.message);
      }
    } catch (err: any) {
      alert("Lỗi hệ thống: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl w-full border border-gray-200 dark:border-gray-700">
          
          <div className="bg-gradient-to-r from-evn-blue to-blue-700 px-6 py-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>📈 Cập nhật Tiến độ Sáng kiến</span>
            </h3>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-6 py-5">
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-evn-orange dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded">
                      {item.ma}
                    </span>
                    <h4 className="font-semibold text-gray-900 dark:text-white mt-2 text-lg">{item.ten}</h4>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái hiện tại</label>
                  <select 
                    value={formData.trang_thai}
                    onChange={(e) => setFormData({...formData, trang_thai: e.target.value as TrangThai})}
                    className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-evn-blue"
                  >
                    <option value="da_cham">✏️ Đã chấm điểm</option>
                    <option value="da_xet">✅ Đã xét duyệt</option>
                    <option value="dang_tk">🚀 Đang triển khai</option>
                    <option value="hoan_thanh">✅ Đã hoàn thành</option>
                    <option value="khong_trien_khai">❌ Không triển khai</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Người phụ trách / Đơn vị</label>
                  <input 
                    type="text" 
                    value={formData.nguoi_phu_trach}
                    onChange={(e) => setFormData({...formData, nguoi_phu_trach: e.target.value})}
                    placeholder="Tên người hoặc đơn vị"
                    className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-evn-blue" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày bắt đầu</label>
                  <input 
                    type="date" 
                    value={formData.ngay_bat_dau}
                    onChange={(e) => setFormData({...formData, ngay_bat_dau: e.target.value})}
                    className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-evn-blue" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thời hạn dự kiến (Deadline)</label>
                  <input 
                    type="date" 
                    value={formData.deadline}
                    onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                    className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-evn-blue" 
                  />
                </div>

                <div className="md:col-span-2 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <label className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span>Mức độ hoàn thành (%)</span>
                    <span className="font-bold text-evn-blue dark:text-blue-400">{formData.tien_do}%</span>
                  </label>
                  <div className="flex items-center space-x-4">
                    <input 
                      type="range" 
                      min="0" max="100" step="5"
                      value={formData.tien_do}
                      onChange={(e) => setFormData({...formData, tien_do: parseInt(e.target.value)})}
                      className="w-full accent-evn-blue"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nội dung cập nhật / Ghi chú</label>
                  <textarea 
                    rows={3}
                    value={formData.ghi_chu}
                    onChange={(e) => setFormData({...formData, ghi_chu: e.target.value})}
                    placeholder="Mô tả công việc đã làm, khó khăn vướng mắc..."
                    className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-evn-blue" 
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/80 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button 
                type="button"
                onClick={onClose} 
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit" 
                disabled={submitting}
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-evn-blue hover:bg-evn-blue-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-evn-blue disabled:opacity-50 flex items-center"
              >
                {submitting ? 'Đang lưu...' : '💾 Lưu Cập nhật'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
