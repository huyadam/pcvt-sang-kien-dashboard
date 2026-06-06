import React, { useState } from 'react';
import { TrangThai } from '../types';
import { STATUS_MAP } from '../lib/utils';

interface StatusDropdownProps {
  maSk: string;
  currentStatus: TrangThai;
  onChange: (maSk: string, newStatus: TrangThai) => Promise<any>;
}

export default function StatusDropdown({ maSk, currentStatus, onChange }: StatusDropdownProps) {
  const [loading, setLoading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const newStatus = e.target.value as TrangThai;
    if (newStatus === currentStatus) return;

    if (!confirm(`Bạn có chắc muốn chuyển Sáng kiến ${maSk} sang trạng thái: ${STATUS_MAP[newStatus].label}?`)) {
      e.target.value = currentStatus;
      return;
    }

    setLoading(true);
    try {
      const res = await onChange(maSk, newStatus);
      if (!res.success) {
        alert('Lỗi: ' + res.message);
        e.target.value = currentStatus;
      }
    } catch (err: any) {
      alert('Lỗi cập nhật: ' + err.message);
      e.target.value = currentStatus;
    } finally {
      setLoading(false);
    }
  };

  const currentDef = STATUS_MAP[currentStatus] || STATUS_MAP['chua_xet'];

  return (
    <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      {loading ? (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Đang lưu...
        </span>
      ) : (
        <select
          value={currentStatus}
          onChange={handleChange}
          className="text-xs font-medium rounded-full px-2.5 py-1 border-none focus:ring-2 focus:ring-evn-blue appearance-none cursor-pointer pr-6 bg-no-repeat"
          style={{
            ...currentDef.style,
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: 'right 0.25rem center',
            backgroundSize: '1.2em 1.2em',
          }}
        >
          <option value="chua_xet">⏳ Chưa xét / Chưa chấm</option>
          <option value="da_cham">✏️ Đã chấm điểm</option>
          <option value="da_xet">✅ Đã xét duyệt</option>
          <option value="dang_tk">🚀 Đang triển khai</option>
          <option value="hoan_thanh">✅ Đã hoàn thành</option>
          <option value="khong_trien_khai">❌ Không triển khai</option>
        </select>
      )}
    </div>
  );
}
