/**
 * Thu tu Phong/Doi chuan theo QD 09/QD-PCVT ngay 14/07/2025
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
 * Sap xep danh sach department entries theo thu tu QD 09.
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

/**
 * Nhom Khoi - dung de gom phong/doi trong sidebar va overview
 */
export const DEPT_GROUPS: { label: string; icon: string; color: string; depts: string[] }[] = [
  {
    label: 'Khối Kỹ thuật',
    icon: '⚡',
    color: 'text-yellow-600 dark:text-yellow-400',
    depts: ['Kỹ thuật An toàn', 'Vận hành Lưới điện', 'Quản lý Lưới điện'],
  },
  {
    label: 'Khối Kinh doanh',
    icon: '💼',
    color: 'text-green-600 dark:text-green-400',
    depts: ['Kinh doanh', 'Dịch vụ Khách hàng', 'Quản lý Thu ghi', 'QL Hệ thống Đo đếm'],
  },
  {
    label: 'Khối ĐTXD',
    icon: '🏗️',
    color: 'text-blue-600 dark:text-blue-400',
    depts: ['Quản lý Đầu tư'],
  },
  {
    label: 'Khối Hành chính',
    icon: '🏢',
    color: 'text-purple-600 dark:text-purple-400',
    depts: ['Văn Phòng', 'Tổ chức Nhân sự', 'Kế hoạch Vật tư', 'Tài chính Kế toán', 'QL Vận hành Côn Đảo'],
  },
];

/** Tra ve ten khoi cua mot phong/doi, hoac null neu khong thuoc khoi nao */
export function getDeptGroup(deptName: string): string | null {
  for (const g of DEPT_GROUPS) {
    if (g.depts.some(d => deptName.includes(d) || d.includes(deptName))) return g.label;
  }
  return null;
}
