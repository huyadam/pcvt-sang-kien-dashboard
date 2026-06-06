import { useEffect, useState } from 'react';
import { GSheetData, MasterData, ScorePayload, TrackingPayload, TrangThai } from '../types';
import * as api from '../lib/api';
import { transformApiToMasterData } from '../lib/utils';

export function useAppData() {
  const [masterData, setMasterData] = useState<MasterData | null>(null);
  const [gsheetData, setGsheetData] = useState<GSheetData>({ master: [], scores: [], tracking: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentTab, setCurrentTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ col: 'diem', asc: false });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.loadAll();
      setGsheetData(data);
      const transformed = transformApiToMasterData(data.master || []);
      setMasterData(transformed);
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
    const res = await api.submitScore(payload);
    // Score updates status to 'da_cham' automatically by backend (or we could assume it)
    // But we will prompt user for next status via StatusConfirmModal anyway
    return res;
  };

  const handleSubmitTracking = async (payload: TrackingPayload) => {
    const res = await api.submitTracking(payload);
    if (res.success) {
      updateLocalStatus(payload.ma_sk, payload.trang_thai);
      // Silently refresh tracking data in background
      api.loadAll().then(data => {
        setGsheetData(data);
      }).catch(() => {});
    }
    return res;
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
    const res = await api.submitTracking({
      action: 'tracking',
      ma_sk: maSk,
      phong_doi: phongDoi,
      trang_thai: newStatus,
      ghi_chu: 'Chuyển trạng thái thủ công'
    });
    if (res.success) {
      updateLocalStatus(maSk, newStatus);
    }
    return res;
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
