import { User } from '../types';

// Token dùng cho auto-login (nhúng vào URL: ?token=xxx)
export const AUTO_LOGIN_TOKENS: Record<string, string> = {
  'pcvt-sk-nntuyen-2026': 'nntuyen',
  'pcvt-sk-admin-2026':   'admin',
};

export const ACCOUNTS: { username: string; password: string; displayName: string; role: 'admin' | 'dept'; deptKey: string; aliases: string[] }[] = [
  { username: 'admin',   password: '@A12345678', displayName: 'Quản trị viên',  role: 'admin', deptKey: '', aliases: [] },
  { username: 'nntuyen', password: 'nntuyen@654', displayName: 'Nguyễn Ngọc Tuyền', role: 'admin', deptKey: '', aliases: [] },
  { username: 'vp',     password: 'vp',      displayName: 'Văn Phòng',            role: 'dept', deptKey: 'Văn Phòng',           aliases: ['VP', 'Văn phòng'] },
  { username: 'tcns',   password: 'tcns',    displayName: 'Tổ chức Nhân sự',      role: 'dept', deptKey: 'Tổ chức Nhân sự',     aliases: ['TCNS', 'Nhân sự'] },
  { username: 'khvt',   password: 'khvt',    displayName: 'Kế hoạch Vật tư',      role: 'dept', deptKey: 'Kế hoạch Vật tư',     aliases: ['KHVT', 'Vật tư'] },
  { username: 'qldt',   password: 'qldt',    displayName: 'Quản lý Đầu tư',       role: 'dept', deptKey: 'Quản lý Đầu tư',      aliases: ['QLĐT', 'Đầu tư', 'QLDT'] },
  { username: 'ktat',   password: 'ktat',    displayName: 'Kỹ thuật An toàn',     role: 'dept', deptKey: 'Kỹ thuật An toàn',    aliases: ['KTAT', 'Kỹ thuật', 'An toàn'] },
  { username: 'kd',     password: 'kd',      displayName: 'Kinh doanh',            role: 'dept', deptKey: 'Kinh doanh',          aliases: ['KD'] },
  { username: 'tckt',   password: 'tckt',    displayName: 'Tài chính Kế toán',    role: 'dept', deptKey: 'Tài chính Kế toán',   aliases: ['TCKT', 'Tài chính', 'Kế toán'] },
  { username: 'vhld',   password: 'vhld',    displayName: 'Vận hành Lưới điện',   role: 'dept', deptKey: 'Vận hành Lưới điện',  aliases: ['VHLĐ', 'VHLD'] },
  { username: 'qlld',   password: 'qlld',    displayName: 'Quản lý Lưới điện',    role: 'dept', deptKey: 'Quản lý Lưới điện',   aliases: ['QLLĐ', 'QLLD'] },
  { username: 'dvkh',   password: 'dvkh',    displayName: 'Dịch vụ Khách hàng',   role: 'dept', deptKey: 'Dịch vụ Khách hàng',  aliases: ['DVKH'] },
  { username: 'qltg',   password: 'qltg',    displayName: 'Quản lý Thu ghi',      role: 'dept', deptKey: 'Quản lý Thu ghi',     aliases: ['QLTG', 'Thu ghi'] },
  { username: 'qlhtdd', password: 'qlhtdd',  displayName: 'QL Hệ thống Đo đếm',  role: 'dept', deptKey: 'QL Hệ thống Đo đếm',  aliases: ['QLHTĐĐ', 'Đo đếm', 'QLHTDD'] },
  { username: 'qlcd',   password: 'qlcd',    displayName: 'QL Vận hành Côn Đảo', role: 'dept', deptKey: 'QL Vận hành Côn Đảo', aliases: ['QLCĐ', 'Côn Đảo', 'QLCD'] },
];

export function getMergedAccounts(gsheetAccounts?: any[]) {
  if (!gsheetAccounts || gsheetAccounts.length === 0) return ACCOUNTS;
  
  return ACCOUNTS.map(baseAcc => {
    const sheetAcc = gsheetAccounts.find(s => s.username === baseAcc.username);
    if (sheetAcc && sheetAcc.password) {
      return { ...baseAcc, password: sheetAcc.password.toString().trim() };
    }
    return baseAcc;
  });
}

/** Auto-login qua URL token — không cần nhập password */
export function authenticateByToken(token: string): User | null {
  const username = AUTO_LOGIN_TOKENS[token];
  if (!username) return null;
  const account = ACCOUNTS.find(a => a.username === username);
  if (!account) return null;
  return {
    username: account.username,
    displayName: account.displayName,
    role: account.role,
    deptKey: account.deptKey,
  };
}

export function authenticate(username: string, password: string, dynamicAccounts?: any[]): User | null {
  const accountsToUse = getMergedAccounts(dynamicAccounts);
  const account = accountsToUse.find(a => a.username === username && a.password === password);
  if (!account) return null;
  return {
    username: account.username,
    displayName: account.displayName,
    role: account.role,
    deptKey: account.deptKey,
  };
}

export function getDeptKeyForUser(username: string): string {
  const account = ACCOUNTS.find(a => a.username === username);
  if (!account || account.role === 'admin') return 'overview';
  // Lấy alias đầu tiên làm key chính xác của masterData.departments (ví dụ 'KTAT')
  // Nếu không có thì lấy tên đầy đủ
  return account.aliases.length > 0 ? account.aliases[0] : account.deptKey;
}

/**
 * So sánh 2 department identifier có thuộc cùng 1 phòng đội không.
 * Dùng alias table từ ACCOUNTS. KHÔNG phụ thuộc user đang login.
 */
export function isSameDept(deptA: string, deptB: string): boolean {
  if (!deptA || !deptB) return false;
  const a = deptA.toLowerCase().trim();
  const b = deptB.toLowerCase().trim();
  if (a === b) return true;

  // Tìm account mà deptA thuộc về
  const findAccount = (name: string) => {
    return ACCOUNTS.find(acc => {
      if (acc.username.toLowerCase() === name) return true;
      if (acc.deptKey.toLowerCase().trim() === name) return true;
      if (acc.displayName.toLowerCase().trim() === name) return true;
      return acc.aliases.some(alias => alias.toLowerCase().trim() === name);
    });
  };

  const accA = findAccount(a);
  const accB = findAccount(b);

  // Nếu cả 2 đều tìm được account và cùng 1 account → cùng phòng đội
  if (accA && accB) return accA.username === accB.username;
  // Nếu chỉ 1 bên tìm được → không match
  return false;
}

export function canEditDept(user: User, targetDeptName: string): boolean {
  if (user.role === 'admin') return true;
  if (!targetDeptName || !user.username) return false;
  
  const targetLower = targetDeptName.toLowerCase().trim();
  
  // Kiểm tra bảng lookup cố định từ tài khoản
  const account = ACCOUNTS.find(a => a.username === user.username);
  if (account) {
    if (targetLower === account.username.toLowerCase()) return true;
    if (targetLower === account.deptKey.toLowerCase().trim()) return true;
    
    if (account.aliases) {
      for (const alias of account.aliases) {
        const aliasLower = alias.toLowerCase().trim();
        if (targetLower === aliasLower) {
          return true;
        }
      }
    }
  }
  
  // Rơi lại phương pháp fallback
  const userDeptLower = user.deptKey.toLowerCase().trim();
  if (targetLower.includes(userDeptLower) || userDeptLower.includes(targetLower)) return true;
  
  return false;
}
