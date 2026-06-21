import * as XLSX from 'xlsx';
import { DEPT_GROUPS } from './constants';

const STATUS_VI: Record<string, string> = {
  chua_xet: 'Chưa xét',
  chua_cham: 'Chưa chấm',
  da_cham: 'Đã chấm',
  da_xet: 'Đã duyệt',
  dang_tk: 'Đang triển khai',
  trien_khai: 'Đang triển khai',
  hoan_thanh: 'Hoàn thành',
  huy: 'Hủy',
  khong_trien_khai: 'Không triển khai',
};

function getKhoi(deptName: string): string {
  for (const g of DEPT_GROUPS) {
    if (g.depts.some(d => deptName.includes(d) || d.includes(deptName))) return g.label;
  }
  return 'Khác';
}

export function exportExcel(masterData: any, gsheetData: any) {
  const wb = XLSX.utils.book_new();
  const today = new Date().toLocaleDateString('vi-VN');

  // ── Sheet 1: Tổng quan ──────────────────────────────────────────────────
  const overviewRows: any[][] = [
    [`BÁO CÁO TỔNG HỢP SÁNG KIẾN PCVT 2026 — ${today}`],
    [],
    ['Khối', 'Số SK', 'Hợp lệ', 'Đã chấm', 'Đang TK', 'Hoàn thành', '% Hoàn thành'],
  ];

  const khoiMap: Record<string, { total: number; valid: number; daCham: number; dangTK: number; hoanThanh: number }> = {};
  DEPT_GROUPS.forEach(g => {
    khoiMap[g.label] = { total: 0, valid: 0, daCham: 0, dangTK: 0, hoanThanh: 0 };
  });
  khoiMap['Khác'] = { total: 0, valid: 0, daCham: 0, dangTK: 0, hoanThanh: 0 };

  Object.values(masterData.departments).forEach((dept: any) => {
    const khoi = getKhoi(dept.name);
    dept.items.forEach((item: any) => {
      if (!khoiMap[khoi]) khoiMap[khoi] = { total: 0, valid: 0, daCham: 0, dangTK: 0, hoanThanh: 0 };
      khoiMap[khoi].total++;
      if (!item.hard_filtered) {
        khoiMap[khoi].valid++;
        if (item.trang_thai === 'da_cham' || item.trang_thai === 'da_xet') khoiMap[khoi].daCham++;
        else if (item.trang_thai === 'dang_tk' || item.trang_thai === 'trien_khai') khoiMap[khoi].dangTK++;
        else if (item.trang_thai === 'hoan_thanh') khoiMap[khoi].hoanThanh++;
      }
    });
  });

  Object.entries(khoiMap).forEach(([label, s]) => {
    const pct = s.valid > 0 ? `${Math.round((s.hoanThanh / s.valid) * 100)}%` : '0%';
    overviewRows.push([label, s.total, s.valid, s.daCham, s.dangTK, s.hoanThanh, pct]);
  });

  const wsOverview = XLSX.utils.aoa_to_sheet(overviewRows);
  wsOverview['!cols'] = [{ wch: 22 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Tổng quan');

  // ── Sheet 2+: Chi tiết từng khối ──────────────────────────────────────
  DEPT_GROUPS.forEach(group => {
    const header = ['STT', 'Mã SK', 'Tên Sáng kiến', 'Đơn vị', 'Phòng/Đội', 'Điểm AI', 'Điểm HĐ', 'Trạng thái', 'Ghi chú'];
    const rows: any[][] = [header];
    let stt = 1;

    const scoreMap = new Map<string, number>();
    gsheetData?.scores?.forEach((s: any) => {
      scoreMap.set(s.ma_sk, (Number(s.d1_tinhmoi)||0)+(Number(s.d2_tuchu)||0)+(Number(s.d3_chiphi)||0)+(Number(s.d4_kinhte)||0)+(Number(s.d5_antoan)||0));
    });

    Object.values(masterData.departments).forEach((dept: any) => {
      if (!group.depts.some(gd => dept.name.includes(gd) || gd.includes(dept.name))) return;
      dept.items.forEach((item: any) => {
        rows.push([
          stt++,
          item.ma,
          item.ten,
          item.donvi,
          dept.name,
          item.diem.toFixed(1),
          scoreMap.has(item.ma) ? scoreMap.get(item.ma) : '',
          STATUS_VI[item.trang_thai] || item.trang_thai,
          item.hard_filtered ? 'Lọc tĩnh' : (item.need_review ? 'Cần review' : ''),
        ]);
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 6 }, { wch: 14 }, { wch: 52 }, { wch: 22 }, { wch: 22 }, { wch: 10 }, { wch: 10 }, { wch: 18 }, { wch: 14 }];
    // Giới hạn tên sheet <= 31 ký tự
    const sheetName = group.label.slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  // ── Sheet cuối: Tất cả danh sách ─────────────────────────────────────
  const allHeader = ['STT', 'Mã SK', 'Tên Sáng kiến', 'Đơn vị', 'Phòng/Đội', 'Khối', 'Điểm AI', 'Điểm HĐ', 'Trạng thái'];
  const allRows: any[][] = [allHeader];
  let stt = 1;
  const scoreMap = new Map<string, number>();
  gsheetData?.scores?.forEach((s: any) => {
    scoreMap.set(s.ma_sk, (Number(s.d1_tinhmoi)||0)+(Number(s.d2_tuchu)||0)+(Number(s.d3_chiphi)||0)+(Number(s.d4_kinhte)||0)+(Number(s.d5_antoan)||0));
  });

  Object.values(masterData.departments).forEach((dept: any) => {
    dept.items.forEach((item: any) => {
      allRows.push([
        stt++, item.ma, item.ten, item.donvi, dept.name,
        getKhoi(dept.name),
        item.diem.toFixed(1),
        scoreMap.has(item.ma) ? scoreMap.get(item.ma) : '',
        STATUS_VI[item.trang_thai] || item.trang_thai,
      ]);
    });
  });

  const wsAll = XLSX.utils.aoa_to_sheet(allRows);
  wsAll['!cols'] = [{ wch: 6 }, { wch: 14 }, { wch: 52 }, { wch: 22 }, { wch: 22 }, { wch: 18 }, { wch: 10 }, { wch: 10 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsAll, 'Toàn bộ danh sách');

  XLSX.writeFile(wb, `BaoCao_SangKien_PCVT_${new Date().toISOString().split('T')[0]}.xlsx`);
}
