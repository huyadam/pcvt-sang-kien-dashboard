import { useEffect, useState } from 'react';
import { GSheetData, MasterData, ScorePayload, TrackingPayload, TrangThai, User } from '../types';
import * as api from '../lib/api';
import { transformApiToMasterData } from '../lib/utils';
import { canEditDept, getDeptKeyForUser } from '../lib/auth';
import toast from 'react-hot-toast';

export function useAppData(user: User | null) {
  const [masterData, setMasterData] = useState<MasterData | null>(null);
  const [gsheetData, setGsheetData] = useState<GSheetData>({ master: [], scores: [], tracking: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentTab, setCurrentTab] = useState(() => {
    if (!user) return 'overview';
    if (user.role === 'admin') return 'overview';
    return getDeptKeyForUser(user.username);
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ col: 'diem', asc: false });
  // Danh sách trạng thái hợp lệ
  const VALID_STATUSES = ['chua_xet', 'chua_cham', 'da_cham', 'da_xet', 'dang_tk', 'trien_khai', 'hoan_thanh', 'huy', 'khong_trien_khai'];

  // Normalize: map tên cột Sheet -> tên field frontend + lọc dữ liệu rác
  const normalizeApiData = (data: any): any => {
    const normalized = { ...data };
    
    // Tracking: ngay_cap_nhat -> timestamp + validate trang_thai
    if (normalized.tracking) {
      normalized.tracking = normalized.tracking
        .map((t: any) => ({
          ...t,
          timestamp: t.timestamp || t.ngay_cap_nhat || '',
        }))
        .filter((t: any) => {
          // Loại bỏ record có trang_thai không hợp lệ (dữ liệu cũ bị lệch cột)
          return t.ma_sk && VALID_STATUSES.includes(String(t.trang_thai || '').trim().toLowerCase());
        });
    }
    
    // Scores: ngay_cham -> timestamp
    if (normalized.scores) {
      normalized.scores = normalized.scores.map((s: any) => ({
        ...s,
        timestamp: s.timestamp || s.ngay_cham || '',
      }));
    }
    
    return normalized;
  };

  const injectDynamicStatus = (master: any, scores: any[], tracking: any[]) => {
    const tMap = new Map<string, string>();
    if (tracking) {
      tracking.forEach((t: any) => {
        const existTime = tMap.get(t.ma_sk + '_time');
        const tTime = new Date(t.timestamp).getTime();
        if (!existTime || tTime > Number(existTime)) {
          tMap.set(t.ma_sk, t.trang_thai);
          tMap.set(t.ma_sk + '_time', String(tTime));
        }
      });
    }
    
    const sMap = new Set<string>();
    if (scores) {
      scores.forEach((s: any) => sMap.add(s.ma_sk));
    }
    
    Object.values(master.departments).forEach((dept: any) => {
      dept.items.forEach((item: any) => {
        if (tMap.has(item.ma)) {
          item.trang_thai = tMap.get(item.ma);
        } else if (sMap.has(item.ma) && item.trang_thai === 'chua_xet') {
          item.trang_thai = 'da_cham';
        }
      });
    });
    return master;
  };

  const loadData = async () => {
    const cached = localStorage.getItem('pcvt_sk_cache');
    if (cached && !masterData) {
      try {
        const parsed = normalizeApiData(JSON.parse(cached));
        setGsheetData(parsed);
        const master = transformApiToMasterData(parsed.master || []);
        setMasterData(injectDynamicStatus(master, parsed.scores, parsed.tracking));
      } catch(e) {}
    } else {
      setLoading(true);
    }
    
    setError(null);
    try {
      const raw = await api.loadAll();
      const data = normalizeApiData(raw);
      setGsheetData(data);
      
      const master = transformApiToMasterData(data.master || []);
      setMasterData(injectDynamicStatus(master, data.scores, data.tracking));
      
      localStorage.setItem('pcvt_sk_cache', JSON.stringify(data));
    } catch (err: any) {
      setError(err.message || 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshData = () => {
    loadData();
  };

  // Update local masterData when status changes to avoid full reload
  const updateLocalStatus = (maSk: string, newStatus: TrangThai) => {
    setMasterData(prev => {
      if (!prev) return prev;
      const next = { ...prev };
      Object.values(next.departments).forEach(dept => {
        dept.items.forEach(item => {
          if (item.ma === maSk) {
            item.trang_thai = newStatus;
          }
        });
      });
      return next;
    });
  };

  const handleSubmitScore = async (payload: ScorePayload) => {
    if (user && !canEditDept(user, payload.phong_doi)) {
      toast.error('Bạn không có quyền chấm điểm sáng kiến phòng đội khác');
      return { success: false, message: 'Bạn không có quyền chấm điểm sáng kiến phòng đội khác' };
    }

    // Optimistic UI Update: Cập nhật local ngay lập tức
    updateLocalStatus(payload.ma_sk, 'da_cham');
    const toastId = toast.loading('Đang lưu điểm...');
    
    // Gửi API ngầm trong background (fire-and-forget)
    api.submitScore(payload).then(res => {
      if (res.success) {
        toast.success('Đã lưu điểm thành công', { id: toastId });
        api.loadAll().then(raw => {
          const data = normalizeApiData(raw);
          setGsheetData(data);
          localStorage.setItem('pcvt_sk_cache', JSON.stringify(data));
        }).catch(() => {});
      } else {
        toast.error('Lưu thất bại: ' + res.message, { id: toastId });
      }
    }).catch(err => {
      console.error("Lỗi gửi điểm:", err);
      toast.error('Lỗi kết nối khi gửi điểm', { id: toastId });
    });

    return { success: true, message: "Đã gửi lệnh lưu điểm" };
  };

  const handleSubmitTracking = async (payload: TrackingPayload) => {
    if (user && !canEditDept(user, payload.phong_doi)) {
      toast.error('Bạn không có quyền cập nhật tiến độ phòng đội khác');
      return { success: false, message: 'Bạn không có quyền cập nhật tiến độ sáng kiến phòng đội khác' };
    }

    // Optimistic UI Update: Cập nhật local ngay lập tức
    updateLocalStatus(payload.ma_sk, payload.trang_thai);
    const toastId = toast.loading('Đang lưu tiến độ...');
    
    // Gửi API ngầm trong background
    api.submitTracking(payload).then(res => {
      if (res.success) {
        toast.success('Cập nhật tiến độ thành công', { id: toastId });
        api.loadAll().then(raw => {
          const data = normalizeApiData(raw);
          setGsheetData(data);
          localStorage.setItem('pcvt_sk_cache', JSON.stringify(data));
        }).catch(() => {});
      } else {
        toast.error('Lưu thất bại: ' + res.message, { id: toastId });
      }
    }).catch(err => {
      console.error("Lỗi cập nhật tiến độ:", err);
      toast.error('Lỗi kết nối khi cập nhật tiến độ', { id: toastId });
    });

    return { success: true, message: "Đã gửi lệnh cập nhật tiến độ" };
  };

  const quickStatusChange = async (maSk: string, newStatus: TrangThai) => {
    // Find phong_doi
    let phongDoi = currentTab;
    if (phongDoi === 'overview' || phongDoi === 'tracking') {
      if (masterData) {
        for (const [key, dept] of Object.entries(masterData.departments)) {
          if (dept.items.find(item => item.ma === maSk)) {
            phongDoi = key;
            break;
          }
        }
      }
    }
    if (user && !canEditDept(user, phongDoi)) {
      toast.error('Bạn không có quyền đổi trạng thái sáng kiến phòng đội khác');
      return { success: false, message: 'Bạn không có quyền đổi trạng thái sáng kiến phòng đội khác' };
    }

    // Optimistic UI
    updateLocalStatus(maSk, newStatus);
    const toastId = toast.loading('Đang chuyển trạng thái...');

    api.submitTracking({
      action: 'tracking',
      ma_sk: maSk,
      phong_doi: phongDoi,
      nguoi_phu_trach: user?.displayName || '',
      ngay_bat_dau: '',
      deadline: '',
      tien_do: 0,
      trang_thai: newStatus,
      ghi_chu: 'Chuyển trạng thái nhanh'
    }).then(res => {
      if (res.success) {
        toast.success('Đã chuyển trạng thái', { id: toastId });
        api.loadAll().then(raw => {
          const data = normalizeApiData(raw);
          setGsheetData(data);
          localStorage.setItem('pcvt_sk_cache', JSON.stringify(data));
        }).catch(() => {});
      } else {
        toast.error('Lỗi: ' + res.message, { id: toastId });
      }
    }).catch(err => {
      console.error(err);
      toast.error('Lỗi kết nối', { id: toastId });
    });

    return { success: true, message: "Đã gửi lệnh cập nhật trạng thái" };
  };

  return {
    user,
    masterData,
    gsheetData,
    loading,
    error,
    currentTab,
    setCurrentTab,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortConfig,
    setSortConfig,
    refreshData,
    handleSubmitScore,
    handleSubmitTracking,
    quickStatusChange
  };
}
