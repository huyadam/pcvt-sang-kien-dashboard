import { User } from '../types';

export const ACCOUNTS: { username: string; password: string; displayName: string; role: 'admin' | 'dept'; deptKey: string; aliases: string[] }[] = [
  { username: 'admin', password: 'pcvt2026@admin', displayName: 'Quản trị viên', role: 'admin', deptKey: '', aliases: [] },
  { username: 'vp',    password: 'pcvt.vp2026',    displayName: 'Văn Phòng',            role: 'dept', deptKey: 'Văn Phòng', aliases: ['VP', 'Văn phòng'] },
  { username: 'tcns',  password: 'pcvt.tcns2026',  displayName: 'Tổ chức Nhân sự',      role: 'dept', deptKey: 'Tổ chức Nhân sự', aliases: ['TCNS', 'Nhân sự'] },
  { username: 'khvt',  password: 'pcvt.khvt2026',  displayName: 'Kế hoạch Vật tư',      role: 'dept', deptKey: 'Kế hoạch Vật tư', aliases: ['KHVT', 'Vật tư'] },
  { username: 'qldt',  password: 'pcvt.qldt2026',  displayName: 'Quản lý Đầu tư',       role: 'dept', deptKey: 'Quản lý Đầu tư', aliases: ['QLĐT', 'Đầu tư', 'QLDT'] },
  { username: 'ktat',  password: 'pcvt.ktat2026',  displayName: 'Kỹ thuật An toàn',     role: 'dept', deptKey: 'Kỹ thuật An toàn', aliases: ['KTAT', 'Kỹ thuật', 'An toàn'] },
  { username: 'kd',    password: 'pcvt.kd2026',    displayName: 'Kinh doanh',            role: 'dept', deptKey: 'Kinh doanh', aliases: ['KD'] },
  { username: 'tckt',  password: 'pcvt.tckt2026',  displayName: 'Tài chính Kế toán',    role: 'dept', deptKey: 'Tài chính Kế toán', aliases: ['TCKT', 'Tài chính', 'Kế toán'] },
  { username: 'vhld',  password: 'pcvt.vhld2026',  displayName: 'Vận hành Lưới điện',   role: 'dept', deptKey: 'Vận hành Lưới điện', aliases: ['VHLĐ', 'VHLD'] },
  { username: 'qlld',  password: 'pcvt.qlld2026',  displayName: 'Quản lý Lưới điện',    role: 'dept', deptKey: 'Quản lý Lưới điện', aliases: ['QLLĐ', 'QLLD'] },
  { username: 'dvkh',  password: 'pcvt.dvkh2026',  displayName: 'Dịch vụ Khách hàng',   role: 'dept', deptKey: 'Dịch vụ Khách hàng', aliases: ['DVKH'] },
  { username: 'qltg',  password: 'pcvt.qltg2026',  displayName: 'Quản lý Thu ghi',      role: 'dept', deptKey: 'Quản lý Thu ghi', aliases: ['QLTG', 'Thu ghi'] },
  { username: 'qlhtdd',password: 'pcvt.qlhtdd2026', displayName: 'QL Hệ thống Đo đếm', role: 'dept', deptKey: 'QL Hệ thống Đo đếm', aliases: ['QLHTĐĐ', 'Đo đếm', 'QLHTDD'] },
  { username: 'qlcd',  password: 'pcvt.qlcd2026',  displayName: 'QL Vận hành Côn Đảo', role: 'dept', deptKey: 'QL Vận hành Côn Đảo', aliases: ['QLCĐ', 'Côn Đảo', 'QLCD'] },
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
  
  const targetLower = targetDeptName.toLowerCase();
  const userDeptLower = user.deptKey.toLowerCase();
  
  if (targetLower.includes(userDeptLower) || userDeptLower.includes(targetLower)) return true;
  
  // Kiểm tra bằng aliases
  const account = ACCOUNTS.find(a => a.username === user.username);
  if (account && account.aliases) {
    for (const alias of account.aliases) {
      if (targetLower.includes(alias.toLowerCase()) || alias.toLowerCase().includes(targetLower)) {
        return true;
      }
    }
  }
  
  return false;
}
