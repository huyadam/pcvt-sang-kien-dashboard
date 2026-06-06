import { MasterData, TrangThai } from '../types';

// Helper: Parse điểm từ API — xử lý bug Google Sheet chuyển số thập phân thành Date
// Google Sheet (Vietnam locale) đọc 8.5 thành ngày 8/5 → lưu Date → API trả ISO string
// Fix: chuyển UTC → UTC+7 (Vietnam), lấy day.month = điểm gốc
export function parseDiem(val: any): number {
  if (val == null || val === '') return 0;
  const s = String(val).trim();

  // Nếu là ISO date string (chứa 'T' và '-')
  if (s.includes('T') && s.includes('-')) {
    try {
      const d = new Date(s);
      if (!isNaN(d.getTime())) {
        // Chuyển UTC → Vietnam (UTC+7) để khớp timezone Google Sheet
        const vn = new Date(d.getTime() + 7 * 3600000);
        const day = vn.getUTCDate();
        const month = vn.getUTCMonth() + 1;
        const result = parseFloat(day + '.' + month);
        // Sanity check: điểm AI phải từ 0-10
        return result >= 0 && result <= 10 ? result : 0;
      }
    } catch (e) {
      /* fallthrough */
    }
  }

  // Số bình thường
  const num = parseFloat(s);
  return isNaN(num) ? 0 : num >= 0 && num <= 10 ? num : 0;
}

export function getXepLoai(total: number): 'A' | 'B' | 'C' {
  if (total >= 85) return 'A';
  if (total >= 65) return 'B';
  return 'C';
}

import { CSSProperties } from 'react';

export const STATUS_MAP: Record<TrangThai, { label: string; cls: string; style?: CSSProperties }> = {
  chua_xet: { label: '⏳ Chưa xét', cls: 'warning', style: { color: '#ed6c02' } },
  chua_cham: { label: '⏳ Chưa xét', cls: 'warning', style: { color: '#ed6c02' } },
  da_cham: { label: '✏️ Đã chấm', cls: '', style: { background: 'rgba(255,102,0,0.15)', color: '#e65c00' } },
  da_xet: { label: '✅ Đã xét', cls: '', style: { background: 'rgba(0,75,135,0.12)', color: 'var(--color-evn-blue)' } },
  dang_tk: { label: '🚀 Triển khai', cls: 'success', style: { color: '#2e7d32' } },
  trien_khai: { label: '🚀 Triển khai', cls: 'success', style: { color: '#2e7d32' } },
  hoan_thanh: { label: '✅ Hoàn thành', cls: 'success', style: { color: '#2e7d32' } },
  huy: { label: '❌ Không TK', cls: 'danger', style: { color: '#d32f2f' } },
  khong_trien_khai: { label: '❌ Không TK', cls: 'danger', style: { color: '#d32f2f' } },
};

export function transformApiToMasterData(rows: any[]): MasterData {
  const departments: Record<string, any> = {};

  rows.forEach((row) => {
    const deptKey = row.phong_doi || 'UNKNOWN';
    if (!departments[deptKey]) {
      departments[deptKey] = {
        name: row.ten_phong_doi || deptKey,
        count: 0,
        items: [],
      };
    }
    departments[deptKey].items.push({
      ma: row.ma_sk || '',
      ten: row.ten_sk || '',
      donvi: row.don_vi || '',
      diem: parseDiem(row.diem_goc),
      score: 1.0,
      explain: row.ly_do_phan_loai || '',
      giaiphap: row.tom_tat_giai_phap || '',
      hard_filtered: false,
      need_review: false,
      gdrive_url: row.gdrive_url || '',
      source_dept: row.source_dept || '',
      trang_thai: row.trang_thai || 'chua_xet',
    });
    departments[deptKey].count = departments[deptKey].items.length;
  });

  return {
    generated_at: new Date().toISOString(),
    method: 'Google Sheet API (Online)',
    total: rows.length,
    classified: rows.length,
    departments: departments,
  };
}
