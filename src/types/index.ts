export type TrangThai = 'chua_xet' | 'chua_cham' | 'da_cham' | 'da_xet' | 'dang_tk' | 'trien_khai' | 'hoan_thanh' | 'huy' | 'khong_trien_khai';

export interface SangKien {
  ma: string;
  ten: string;
  donvi: string;
  diem: number;
  score: number;
  explain: string;
  giaiphap: string;
  hard_filtered: boolean;
  need_review: boolean;
  gdrive_url: string;
  source_dept: string;
  trang_thai: TrangThai;
}

export interface Department {
  name: string;
  count: number;
  items: SangKien[];
}

export interface MasterData {
  generated_at: string;
  method: string;
  total: number;
  classified: number;
  departments: Record<string, Department>;
}

export interface ScorePayload {
  action: 'score';
  ma_sk: string;
  phong_doi: string;
  d1_tinhmoi: number;
  d2_tuchu: number;
  d3_chiphi: number;
  d4_kinhte: number;
  d5_antoan: number;
  nguoi_cham: string;
  ghi_chu: string;
}

export interface TrackingPayload {
  action: 'tracking';
  ma_sk: string;
  phong_doi: string;
  nguoi_phu_trach?: string;
  ngay_bat_dau?: string;
  deadline?: string;
  tien_do?: number;
  trang_thai: TrangThai;
  ghi_chu?: string;
}

export interface TrackingRecord {
  ma_sk: string;
  phong_doi: string;
  nguoi_phu_trach: string;
  ngay_bat_dau: string;
  deadline: string;
  tien_do: number;
  trang_thai: TrangThai;
  ghi_chu: string;
  timestamp: string;
}

export interface GSheetData {
  master: any[];
  scores: any[];
  tracking: TrackingRecord[];
}

export type UserRole = 'admin' | 'dept';

export interface User {
  username: string;
  displayName: string;
  role: UserRole;
  deptKey: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface AppData {
  user: User | null;
  masterData: MasterData | null;
  gsheetData: GSheetData;
  loading: boolean;
  error: string | null;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  sortConfig: { key: string; direction: 'asc' | 'desc' };
  setSortConfig: (c: any) => void;
  refreshData: () => Promise<void>;
  handleSubmitScore: (p: ScorePayload) => Promise<{success: boolean; message?: string}>;
  handleSubmitTracking: (p: TrackingPayload) => Promise<{success: boolean; message?: string}>;
  quickStatusChange: (maSk: string, st: TrangThai) => Promise<{success: boolean; message?: string}>;
}
