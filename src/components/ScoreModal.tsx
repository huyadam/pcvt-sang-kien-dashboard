import React, { useState, useEffect } from 'react';
import { SangKien, ScorePayload, TrangThai } from '../types';
import { getXepLoai } from '../lib/utils';
import { canEditDept } from '../lib/auth';

interface ScoreModalProps {
  item: SangKien;
  onClose: () => void;
  appData: any;
}

export default function ScoreModal({ item, onClose, appData }: ScoreModalProps) {
  const { user, masterData } = appData;
  const [scores, setScores] = useState({ d1: 15, d2: 8, d3: 8, d4: 10, d5: 10 });
  const [reviewer, setReviewer] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [nextStatus, setNextStatus] = useState<TrangThai | null>(null);

  useEffect(() => {
    const existingScore = appData.gsheetData.scores.find((s: any) => s.ma_sk === item.ma);
    if (existingScore) {
      setScores({
        d1: existingScore.d1_tinhmoi || 0,
        d2: existingScore.d2_tuchu || 0,
        d3: existingScore.d3_chiphi || 0,
        d4: existingScore.d4_kinhte || 0,
        d5: existingScore.d5_antoan || 0,
      });
      setReviewer(existingScore.nguoi_cham || '');
      setNotes(existingScore.ghi_chu || '');
    } else {
      const ratio = Math.max(0.5, item.diem / 10);
      setScores({
        d1: Math.round(30 * ratio),
        d2: Math.round(15 * ratio),
        d3: Math.round(15 * ratio),
        d4: Math.round(20 * ratio),
        d5: Math.round(20 * ratio),
      });
    }
  }, [item, appData.gsheetData.scores]);

  const total = scores.d1 + scores.d2 + scores.d3 + scores.d4 + scores.d5;
  const grade = getXepLoai(total);

  // Auto-suggest next status based on grade
  useEffect(() => {
    if (grade === 'A') setNextStatus('dang_tk');
    else if (grade === 'B') setNextStatus('da_xet');
    else setNextStatus('khong_trien_khai');
  }, [grade]);

  const handleSubmit = async () => {
    if (!reviewer.trim()) {
      alert("Vui lòng nhập tên Người chấm.");
      return;
    }
    
    setSubmitting(true);
    try {
      const phongDoi = item.source_dept || (appData.currentTab !== 'overview' && appData.currentTab !== 'tracking' ? appData.currentTab : 'Văn phòng'); 
      
      const payload: ScorePayload = {
        action: 'score',
        ma_sk: item.ma,
        phong_doi: phongDoi,
        d1_tinhmoi: scores.d1,
        d2_tuchu: scores.d2,
        d3_chiphi: scores.d3,
        d4_kinhte: scores.d4,
        d5_antoan: scores.d5,
        nguoi_cham: reviewer,
        ghi_chu: notes
      };
      
      const res = await appData.handleSubmitScore(payload);
      if (!res.success) {
        alert("Lỗi khi lưu điểm: " + res.message);
        setSubmitting(false);
        return;
      }

      if (nextStatus) {
        await appData.handleSubmitTracking({
          action: 'tracking',
          ma_sk: item.ma,
          phong_doi: phongDoi,
          nguoi_phu_trach: reviewer,
          ngay_bat_dau: '',
          deadline: '',
          tien_do: 0,
          trang_thai: nextStatus,
          ghi_chu: `Hệ thống: Chuyển trạng thái sau khi chấm điểm (${total}đ - Loại ${grade})`
        });
      }

      onClose();
    } catch (err: any) {
      alert("Lỗi hệ thống: " + err.message);
      setSubmitting(false);
    }
  };

  const handleUpdateScore = (key: string, val: number, max: number) => {
    let v = isNaN(val) ? 0 : val;
    if (v < 0) v = 0;
    if (v > max) v = max;
    setScores(prev => ({ ...prev, [key]: v }));
  };

  // Tìm đúng phongDoi key từ masterData.departments
  let phongDoi = item.source_dept || '';
  if (!phongDoi && masterData) {
    for (const [key, dept] of Object.entries(masterData.departments)) {
      if ((dept as any).items.find((i: any) => i.ma === item.ma)) {
        phongDoi = key;
        break;
      }
    }
  }
  const hasPermission = user && canEditDept(user, phongDoi || item.donvi);

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl w-full border border-gray-200 dark:border-gray-700 animate-fade-in relative z-[60]">
          
          <div className="bg-evn-blue px-6 py-4 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>✏️ Hội đồng Chấm điểm: {item.ma}</span>
            </h3>
            <button onClick={() => setShowGuide(!showGuide)} className="bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1 rounded-full transition">
              {showGuide ? 'Ẩn Hướng dẫn' : 'ℹ️ Xem Hướng dẫn'}
            </button>
          </div>

          <div className="px-6 py-4 space-y-5">
            {showGuide && (
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800 text-sm text-blue-900 dark:text-blue-200 space-y-2 animate-fade-in">
                <h4 className="font-bold border-b border-blue-200 dark:border-blue-800 pb-2 mb-2">Hướng dẫn Chấm điểm & Xếp loại</h4>
                <ul className="list-disc pl-5 space-y-2 text-xs mt-2">
                  <li><strong>Tính mới (30đ)</strong>: Giải pháp đột phá hoàn toàn (25-30đ) | Có cải tiến quy trình cũ (15-24đ) | Thay đổi nhỏ (&lt;15đ).</li>
                  <li><strong>Tự chủ nguồn lực (15đ)</strong>: Tự làm 100% bằng nội bộ (13-15đ) | Cần mua vật tư (8-12đ) | Phải thuê ngoài (&lt;8đ).</li>
                  <li><strong>Tiết kiệm chi phí (15đ)</strong>: Tiết kiệm lớn &gt;50tr (13-15đ) | Tiết kiệm từ 10-50tr (8-12đ) | Không đáng kể (&lt;8đ).</li>
                  <li><strong>Hiệu quả kinh tế (20đ)</strong>: Tăng doanh thu / giảm tổn thất cực lớn (16-20đ) | Mức độ khá (10-15đ) | Chưa đo đếm được (&lt;10đ).</li>
                  <li><strong>An toàn - Dịch vụ (20đ)</strong>: Giải quyết triệt để rủi ro an toàn hoặc dịch vụ KH (16-20đ) | Có cải thiện (10-15đ) | Rất ít (&lt;10đ).</li>
                </ul>
                <div className="pt-2 flex gap-4 font-bold">
                  <span className="text-green-600 dark:text-green-400">Loại A: ≥85đ</span>
                  <span className="text-blue-600 dark:text-blue-400">Loại B: 65-84đ</span>
                  <span className="text-red-600 dark:text-red-400">Loại C: &lt;65đ</span>
                </div>
              </div>
            )}

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg flex justify-between items-center border border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Điểm AI Đề xuất</p>
                <p className="text-2xl font-bold text-evn-blue dark:text-blue-400">{item.diem.toFixed(1)}/10</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tổng điểm Hội đồng</p>
                <div className="flex items-baseline justify-end space-x-2">
                  <span className={`text-4xl font-black ${
                    grade === 'A' ? 'text-green-600 dark:text-green-400' :
                    grade === 'B' ? 'text-blue-600 dark:text-blue-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {total}
                  </span>
                  <span className="text-gray-500 font-medium">/100</span>
                  <span className={`ml-2 px-3 py-1 rounded-full text-lg font-bold ${
                    grade === 'A' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                    grade === 'B' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                  }`}>
                    Loại {grade}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-bold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">1. Đánh giá Tiêu chí</h4>
                {[
                  { k: 'd1', label: '1. Tính mới & Sáng tạo', max: 30 },
                  { k: 'd2', label: '2. Khả năng Tự chủ', max: 15 },
                  { k: 'd3', label: '3. Tiết kiệm Chi phí', max: 15 },
                  { k: 'd4', label: '4. Hiệu quả Kinh tế', max: 20 },
                  { k: 'd5', label: '5. Hiệu quả An toàn - Dịch vụ', max: 20 },
                ].map(crit => (
                  <div key={crit.k} className="flex flex-col space-y-1">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{crit.label}</label>
                      <div className="flex items-center space-x-1">
                        <input 
                          type="number" 
                          min="0" max={crit.max} 
                          value={(scores as any)[crit.k]}
                          onChange={(e) => handleUpdateScore(crit.k, parseInt(e.target.value), crit.max)}
                          className="w-16 p-1 text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">/{crit.max}</span>
                      </div>
                    </div>
                    <input 
                      type="range" 
                      min="0" max={crit.max} step="1" 
                      value={(scores as any)[crit.k]} 
                      onChange={(e) => handleUpdateScore(crit.k, parseInt(e.target.value), crit.max)}
                      className="w-full accent-evn-orange"
                    />
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Người chấm</label>
                    <input 
                      type="text" 
                      value={reviewer} 
                      onChange={(e) => setReviewer(e.target.value)} 
                      placeholder="Nguyễn Văn A" 
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-evn-blue focus:border-evn-blue" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú thêm</label>
                    <input 
                      type="text" 
                      value={notes} 
                      onChange={(e) => setNotes(e.target.value)} 
                      placeholder="Ghi chú..." 
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-evn-blue focus:border-evn-blue" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">2. Đề xuất Xử lý</h4>
                
                <div className="space-y-3">
                  <label 
                    className={`flex items-start space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      nextStatus === 'dang_tk' 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="nextStatus" 
                      value="dang_tk"
                      checked={nextStatus === 'dang_tk'}
                      onChange={() => setNextStatus('dang_tk')}
                      className="mt-1 accent-green-600"
                    />
                    <div>
                      <p className="font-bold text-green-700 dark:text-green-400">🚀 Triển khai ngay</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Sáng kiến tốt, bắt đầu thực hiện ngay.</p>
                      {grade === 'A' && <span className="inline-block mt-1 text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full uppercase font-bold">Đề xuất cho Loại A</span>}
                    </div>
                  </label>

                  <label 
                    className={`flex items-start space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      nextStatus === 'da_xet' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="nextStatus" 
                      value="da_xet"
                      checked={nextStatus === 'da_xet'}
                      onChange={() => setNextStatus('da_xet')}
                      className="mt-1 accent-blue-600"
                    />
                    <div>
                      <p className="font-bold text-blue-700 dark:text-blue-400">📋 Lên Kế hoạch</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Đã duyệt, cần lập kế hoạch, mua sắm vật tư.</p>
                      {grade === 'B' && <span className="inline-block mt-1 text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase font-bold">Đề xuất cho Loại B</span>}
                    </div>
                  </label>

                  <label 
                    className={`flex items-start space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      nextStatus === 'khong_trien_khai' 
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="nextStatus" 
                      value="khong_trien_khai"
                      checked={nextStatus === 'khong_trien_khai'}
                      onChange={() => setNextStatus('khong_trien_khai')}
                      className="mt-1 accent-red-600"
                    />
                    <div>
                      <p className="font-bold text-red-700 dark:text-red-400">❌ Không triển khai</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Chưa đủ điều kiện, lưu trữ làm tài liệu.</p>
                      {grade === 'C' && <span className="inline-block mt-1 text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full uppercase font-bold">Đề xuất cho Loại C</span>}
                    </div>
                  </label>

                  <label 
                    className={`flex items-start space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      nextStatus === null 
                        ? 'border-gray-400 bg-gray-100 dark:bg-gray-800' 
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="nextStatus" 
                      value=""
                      checked={nextStatus === null}
                      onChange={() => setNextStatus(null)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-bold text-gray-700 dark:text-gray-300">⏭️ Để sau (Chỉ lưu điểm)</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Sáng kiến sẽ mang trạng thái "Đã chấm điểm".</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/80 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
            <button 
              onClick={onClose} 
              disabled={submitting}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Hủy
            </button>
            {hasPermission ? (
              <button 
                onClick={handleSubmit} 
                disabled={submitting}
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-evn-orange hover:bg-evn-orange-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-evn-orange disabled:opacity-50 flex items-center"
              >
                {submitting ? 'Đang lưu...' : '💾 Lưu & Xử lý'}
              </button>
            ) : (
              <div className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-md cursor-not-allowed text-sm font-medium">
                Không có quyền chỉnh sửa
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
