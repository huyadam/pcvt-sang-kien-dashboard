import { User } from '../types';

export const ACCOUNTS: { username: string; password: string; displayName: string; role: 'admin' | 'dept'; deptKey: string }[] = [
  { username: 'admin', password: 'pcvt2026@admin', displayName: 'Quản trị viên', role: 'admin', deptKey: '' },
  { username: 'vp',    password: 'pcvt.vp2026',    displayName: 'Văn Phòng',            role: 'dept', deptKey: 'Văn Phòng' },
  { username: 'tcns',  password: 'pcvt.tcns2026',  displayName: 'Tổ chức Nhân sự',      role: 'dept', deptKey: 'Tổ chức Nhân sự' },
  { username: 'khvt',  password: 'pcvt.khvt2026',  displayName: 'Kế hoạch Vật tư',      role: 'dept', deptKey: 'Kế hoạch Vật tư' },
  { username: 'qldt',  password: 'pcvt.qldt2026',  displayName: 'Quản lý Đầu tư',       role: 'dept', deptKey: 'Quản lý Đầu tư' },
  { username: 'ktat',  password: 'pcvt.ktat2026',  displayName: 'Kỹ thuật An toàn',     role: 'dept', deptKey: 'Kỹ thuật An toàn' },
  { username: 'kd',    password: 'pcvt.kd2026',    displayName: 'Kinh doanh',            role: 'dept', deptKey: 'Kinh doanh' },
  { username: 'tckt',  password: 'pcvt.tckt2026',  displayName: 'Tài chính Kế toán',    role: 'dept', deptKey: 'Tài chính Kế toán' },
  { username: 'vhld',  password: 'pcvt.vhld2026',  displayName: 'Vận hành Lưới điện',   role: 'dept', deptKey: 'Vận hành Lưới điện' },
  { username: 'qlld',  password: 'pcvt.qlld2026',  displayName: 'Quản lý Lưới điện',    role: 'dept', deptKey: 'Quản lý Lưới điện' },
  { username: 'dvkh',  password: 'pcvt.dvkh2026',  displayName: 'Dịch vụ Khách hàng',   role: 'dept', deptKey: 'Dịch vụ Khách hàng' },
  { username: 'qltg',  password: 'pcvt.qltg2026',  displayName: 'Quản lý Thu ghi',      role: 'dept', deptKey: 'Quản lý Thu ghi' },
  { username: 'qlhtdd',password: 'pcvt.qlhtdd2026', displayName: 'QL Hệ thống Đo đếm', role: 'dept', deptKey: 'QL Hệ thống Đo đếm' },
  { username: 'qlcd',  password: 'pcvt.qlcd2026',  displayName: 'QL Vận hành Côn Đảo', role: 'dept', deptKey: 'QL Vận hành Côn Đảo' },
];

export function authenticate(username: string, password: string): User | null {
  const account = ACCOUNTS.find(a => a.username === username && a.password === password);
  if (!account) return null;
  return {
    username: account.username,
    displayName: account.displayName,
    role: account.role,
    deptKey: account.deptKey,
  };
}

export function canEditDept(user: User, targetDeptName: string): boolean {
  if (user.role === 'admin') return true;
  if (!targetDeptName || !user.deptKey) return false;
  return targetDeptName.includes(user.deptKey) || user.deptKey.includes(targetDeptName);
}
