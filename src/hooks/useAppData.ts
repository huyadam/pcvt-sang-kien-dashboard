import { useEffect, useState } from 'react';
import { GSheetData, MasterData, ScorePayload, TrackingPayload, TrangThai, User } from '../types';
import * as api from '../lib/api';
import { transformApiToMasterData } from '../lib/utils';
import { canEditDept } from '../lib/auth';

export function useAppData(user: User | null) {
  const [masterData, setMasterData] = useState<MasterData | null>(null);
  const [gsheetData, setGsheetData] = useState<GSheetData>({ master: [], scores: [], tracking: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentTab, setCurrentTab] = useState(() => {
    if (!user) return 'overview';
    if (user.role === 'admin') return 'overview';
    return user.deptKey || 'overview';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ col: 'diem', asc: false });

  const loadData = async () => {
    const cached = localStorage.getItem('pcvt_sk_cache');
    if (cached && !masterData) {
      try {
        const parsed = JSON.parse(cached);
        setGsheetData(parsed);
        setMasterData(transformApiToMasterData(parsed.master || []));
      } catch(e) {}
    } else {
      setLoading(true);
    }
    
    setError(null);
    try {
      const data = await api.loadAll();
      setGsheetData(data);
      setMasterData(transformApiToMasterData(data.master || []));
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
      return { success: false, message: 'Bạn không có quyền chấm điểm sáng kiến phòng đội khác' };
    }

    // Optimistic UI Update: Cập nhật local ngay lập tức
    updateLocalStatus(payload.ma_sk, 'da_cham');
    
    // Gửi API ngầm trong background (fire-and-forget)
    api.submitScore(payload).then(res => {
      if (res.success) {
        api.loadAll().then(data => {
          setGsheetData(data);
          localStorage.setItem('pcvt_sk_cache', JSON.stringify(data));
        }).catch(() => {});
      }
    }).catch(err => console.error("Lỗi gửi điểm:", err));

    return { success: true, message: "Đã lưu điểm thành công" };
  };

  const handleSubmitTracking = async (payload: TrackingPayload) => {
    if (user && !canEditDept(user, payload.phong_doi)) {
      return { success: false, message: 'Bạn không có quyền cập nhật tiến độ sáng kiến phòng đội khác' };
    }

    // Optimistic UI Update: Cập nhật local ngay lập tức
    updateLocalStatus(payload.ma_sk, payload.trang_thai);
    
    // Gửi API ngầm trong background
    api.submitTracking(payload).then(res => {
      if (res.success) {
        api.loadAll().then(data => {
          setGsheetData(data);
          localStorage.setItem('pcvt_sk_cache', JSON.stringify(data));
        }).catch(() => {});
      }
    }).catch(err => console.error("Lỗi cập nhật tiến độ:", err));

    return { success: true, message: "Đã cập nhật trạng thái thành công" };
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
      return { success: false, message: 'Bạn không có quyền đổi trạng thái sáng kiến phòng đội khác' };
    }

    // Optimistic UI
    updateLocalStatus(maSk, newStatus);

    api.submitTracking({
      action: 'tracking',
      ma_sk: maSk,
      phong_doi: phongDoi,
      trang_thai: newStatus,
      ghi_chu: 'Chuyển trạng thái thủ công'
    }).then(res => {
      if (res.success) {
        api.loadAll().then(data => {
          setGsheetData(data);
          localStorage.setItem('pcvt_sk_cache', JSON.stringify(data));
        }).catch(() => {});
      }
    }).catch(err => console.error(err));

    return { success: true, message: "Đã cập nhật trạng thái" };
  };

  return {
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
