/**
 * Thứ tự Phòng/Đội chuẩn theo QĐ 09/QĐ-PCVT ngày 14/07/2025
 * Key = phong_doi trong Google Sheet (ThongTinChung)
 */
export const DEPT_ORDER: string[] = [
  'Văn Phòng',
  'Tổ chức Nhân sự',
  'Kế hoạch Vật tư',
  'Quản lý Đầu tư',
  'Kỹ thuật An toàn',
  'Kinh doanh',
  'Tài chính Kế toán',
  'Vận hành Lưới điện',
  'Quản lý Lưới điện',
  'Dịch vụ Khách hàng',
  'Quản lý Thu ghi',
  'QL Hệ thống Đo đếm',
  'QL Vận hành Côn Đảo',
  'Khác (Ngoài PCVT)',
];

/**
 * Sắp xếp danh sách department entries theo thứ tự QĐ 09.
 * Departments không nằm trong danh sách sẽ được đẩy xuống cuối.
 */
export function sortDeptEntries(entries: [string, any][]): [string, any][] {
  return entries.sort((a, b) => {
    const nameA = a[1]?.name || a[0];
    const nameB = b[1]?.name || b[0];
    let idxA = DEPT_ORDER.findIndex(d => nameA.includes(d) || d.includes(nameA));
    let idxB = DEPT_ORDER.findIndex(d => nameB.includes(d) || d.includes(nameB));
    if (idxA === -1) idxA = 999;
    if (idxB === -1) idxB = 999;
    return idxA - idxB;
  });
}
