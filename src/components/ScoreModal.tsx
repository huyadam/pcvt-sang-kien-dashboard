import React, { useState, useEffect } from 'react';
import { SangKien, ScorePayload } from '../types';
import { getXepLoai } from '../lib/utils';
import StatusConfirmModal from './StatusConfirmModal';

interface ScoreModalProps {
  item: SangKien;
  onClose: () => void;
  appData: any;
}

export default function ScoreModal({ item, onClose, appData }: ScoreModalProps) {
  const [scores, setScores] = useState({ d1: 15, d2: 8, d3: 8, d4: 10, d5: 10 });
  const [reviewer, setReviewer] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [finalTotal, setFinalTotal] = useState(0);
  const [finalGrade, setFinalGrade] = useState<'A'|'B'|'C'>('C');

  // Check if there are existing scores in gsheetData
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
      // Auto-suggest based on AI score (approximate)
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

  const handleSubmit = async () => {
    if (!reviewer.trim()) {
      alert("Vui lòng nhập tên Người chấm.");
      return;
    }
    
    setSubmitting(true);
    try {
      const phongDoi = item.source_dept || 'Văn phòng'; // Fallback
      
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
      if (res.success) {
        setFinalTotal(total);
        setFinalGrade(grade);
        setShowConfirm(true); // Open next step
      } else {
        alert("Lỗi: " + res.message);
      }
    } catch (err: any) {
      alert("Lỗi khi lưu điểm: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateScore = (key: string, val: number, max: number) => {
    let v = isNaN(val) ? 0 : val;
    if (v < 0) v = 0;
    if (v > max) v = max;
    setScores(prev => ({ ...prev, [key]: v }));
  };

  if (showConfirm) {
    return (
      <StatusConfirmModal 
        maSk={item.ma}
        phongDoi={item.source_dept || 'Văn phòng'}
        total={finalTotal}
        grade={finalGrade}
        reviewer={reviewer}
        onClose={() => {
          setShowConfirm(false);
          onClose(); // Close both
        }}
        appData={appData}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl w-full border border-gray-200 dark:border-gray-700 animate-fade-in relative z-[60]">
          
          <div className="bg-evn-blue px-6 py-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>✏️ Hội đồng Chấm điểm: {item.ma}</span>
            </h3>
          </div>

          <div className="px-6 py-6 space-y-5">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex justify-between items-center border border-blue-100 dark:border-blue-800">
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Điểm AI Đề xuất</p>
                <p className="text-2xl font-bold text-evn-blue dark:text-blue-400">{item.diem.toFixed(1)}/10</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Tổng điểm Hội đồng</p>
                <div className="flex items-baseline justify-end space-x-2">
                  <span className={`text-4xl font-black ${
                    grade === 'A' ? 'text-green-600 dark:text-green-400' :
                    grade === 'B' ? 'text-blue-600 dark:text-blue-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {total}
                  </span>
                  <span className="text-gray-500 font-medium">/100</span>
                  <span className={`ml-2 px-3 py-1 rounded-full text-lg font-bold ${
                    grade === 'A' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                    grade === 'B' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                    'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    Loại {grade}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
              {[
                { k: 'd1', label: '1. Tính mới & Sáng tạo', max: 30 },
                { k: 'd2', label: '2. Khả năng Tự chủ / Nguồn lực', max: 15 },
                { k: 'd3', label: '3. Tiết kiệm Chi phí triển khai', max: 15 },
                { k: 'd4', label: '4. Hiệu quả Kinh tế', max: 20 },
                { k: 'd5', label: '5. Hiệu quả An toàn - Dịch vụ', max: 20 },
              ].map(crit => (
                <div key={crit.k} className="flex items-center space-x-4">
                  <div className="w-1/2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{crit.label}</label>
                  </div>
                  <div className="w-1/3">
                    <input 
                      type="range" 
                      min="0" max={crit.max} step="1" 
                      value={(scores as any)[crit.k]} 
                      onChange={(e) => handleUpdateScore(crit.k, parseInt(e.target.value), crit.max)}
                      className="w-full accent-evn-orange"
                    />
                  </div>
                  <div className="w-1/6 flex items-center justify-end space-x-1">
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
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Người chấm (Bắt buộc)</label>
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

          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/80 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
            <button 
              onClick={onClose} 
              disabled={submitting}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Hủy
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={submitting}
              className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-evn-orange hover:bg-evn-orange-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-evn-orange disabled:opacity-50 flex items-center"
            >
              {submitting ? 'Đang lưu...' : '💾 Lưu Kết quả'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
