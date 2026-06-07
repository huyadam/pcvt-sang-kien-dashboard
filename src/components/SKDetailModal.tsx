import React, { useState } from 'react';
import { SangKien } from '../types';
import { FileText, Edit, X } from 'lucide-react';
import ScoreModal from './ScoreModal';
import { canEditDept } from '../lib/auth';

interface SKDetailModalProps {
  item: SangKien;
  onClose: () => void;
  appData: any;
}

export default function SKDetailModal({ item, onClose, appData }: SKDetailModalProps) {
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showPdf, setShowPdf] = useState(false);

  // Find phong_doi key
  let phongDoi = item.source_dept;
  if (!phongDoi && appData.masterData) {
    for (const [key, dept] of Object.entries(appData.masterData.departments)) {
      if ((dept as any).items.find((i: any) => i.ma === item.ma)) {
        phongDoi = key;
        break;
      }
    }
  }
  const canEdit = appData.user ? canEditDept(appData.user, phongDoi || 'Văn phòng') : false;

  const [activeTab, setActiveTab] = useState<'content' | 'history'>('content');

  const existingScore = appData?.gsheetData?.scores?.find((s: any) => s.ma_sk === item.ma);
  const totalScore = existingScore 
    ? (Number(existingScore.d1_tinhmoi) || 0) + (Number(existingScore.d2_tuchu) || 0) + (Number(existingScore.d3_chiphi) || 0) + (Number(existingScore.d4_kinhte) || 0) + (Number(existingScore.d5_antoan) || 0)
    : 0;

  const history = appData?.gsheetData?.tracking?.filter((t: any) => t.ma_sk === item.ma).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) || [];

  return (
    <>
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500/75 dark:bg-gray-900/80 backdrop-blur-sm" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl w-full border border-gray-200 dark:border-gray-700 animate-fade-in relative z-50">
          
          <div className="flex justify-between items-start p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-evn-blue/10 text-evn-blue dark:bg-evn-blue/20 dark:text-blue-300">
                  {item.ma}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {item.donvi}
                </span>
                {item.hard_filtered && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    🗑️ Lọc tĩnh
                  </span>
                )}
                {item.need_review && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                    ⚠️ Cần review
                  </span>
                )}
              </div>
              <h3 className="text-2xl leading-6 font-bold text-gray-900 dark:text-white mt-2">
                {item.ten}
              </h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
              <X size={24} />
            </button>
          </div>

          <div className="px-6 py-6 bg-gray-50 dark:bg-gray-900/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Cột trái: AI Analysis */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                    Đánh giá AI tự động
                  </h4>
                  
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-700 dark:text-gray-300">Điểm đánh giá sơ bộ</span>
                    <span className="text-2xl font-bold text-evn-blue dark:text-blue-400">
                      {item.diem.toFixed(1)} <span className="text-sm text-gray-500">/10</span>
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 dark:text-gray-300">Độ tin cậy (Confidence)</span>
                      <span className="font-medium text-gray-900 dark:text-white">{(item.score * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-evn-orange h-2 rounded-full" style={{ width: `${item.score * 100}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Cơ sở phân loại:</span>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-gray-900 p-3 rounded border border-gray-100 dark:border-gray-800">
                      {item.explain}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  {item.gdrive_url ? (
                    <button
                      onClick={() => setShowPdf(!showPdf)}
                      className="flex-1 flex items-center justify-center space-x-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-3 py-2.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm"
                    >
                      <FileText size={16} />
                      <span>{showPdf ? 'Đóng' : 'Tài liệu'}</span>
                    </button>
                  ) : (
                    <button disabled className="flex-1 flex items-center justify-center space-x-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 px-3 py-2.5 rounded-md cursor-not-allowed text-sm">
                      <FileText size={16} />
                      <span>Không có File</span>
                    </button>
                  )}
                  
                  <button 
                    onClick={() => setShowScoreModal(true)}
                    disabled={!canEdit}
                    className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      !canEdit 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                        : existingScore 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500' 
                          : 'bg-evn-orange hover:bg-evn-orange-hover text-white focus:ring-evn-orange'
                    }`}
                    title={!canEdit ? 'Không có quyền' : ''}
                  >
                    <Edit size={16} />
                    <span>{existingScore ? `Sửa (${totalScore}đ)` : 'Chấm điểm'}</span>
                  </button>

                  {existingScore && canEdit && (
                    <button
                      onClick={() => {
                        if (confirm('Bạn có chắc muốn xóa điểm của sáng kiến này?')) {
                          appData.handleDeleteScore(item.ma);
                        }
                      }}
                      className="flex items-center justify-center space-x-1 px-3 py-2.5 border border-red-300 dark:border-red-700 rounded-md text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                      title="Xóa điểm đã chấm"
                    >
                      <X size={16} />
                      <span>Xóa điểm</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Cột phải: Content / Tóm tắt giải pháp / PDF Viewer / History */}
              <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">
                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                  <button 
                    onClick={() => setActiveTab('content')}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'content' ? 'border-evn-blue text-evn-blue dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                  >
                    Nội dung Giải pháp
                  </button>
                  <button 
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center space-x-2 ${activeTab === 'history' ? 'border-evn-blue text-evn-blue dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                  >
                    <span>Lịch sử Cập nhật</span>
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-0.5 px-2 rounded-full text-xs">
                      {history.length + (existingScore ? 1 : 0)}
                    </span>
                  </button>
                </div>
                
                <div className="flex-1 min-h-[300px] max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {activeTab === 'content' ? (
                    <>
                      {showPdf ? (
                        <div className="flex flex-col h-full space-y-2">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => {
                                const w = window.open(item.gdrive_url, '_blank');
                                if (w) w.focus();
                              }}
                              className="text-xs flex items-center space-x-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300 transition"
                            >
                              <span>↗ Mở tab mới</span>
                            </button>
                            <button
                              onClick={() => {
                                const el = document.getElementById(`pdf-frame-${item.ma}`);
                                if (el) {
                                  if (el.requestFullscreen) {
                                    el.requestFullscreen();
                                  } else if ((el as any).webkitRequestFullscreen) {
                                    (el as any).webkitRequestFullscreen();
                                  } else if ((el as any).msRequestFullscreen) {
                                    (el as any).msRequestFullscreen();
                                  }
                                }
                              }}
                              className="text-xs flex items-center space-x-1 px-2 py-1 bg-evn-blue hover:bg-evn-blue-hover text-white rounded transition"
                            >
                              <span>⛶ Toàn màn hình</span>
                            </button>
                          </div>
                          <iframe 
                            id={`pdf-frame-${item.ma}`}
                            src={item.gdrive_url.replace('/view', '/preview')} 
                            className="w-full h-full min-h-[400px] rounded border border-gray-200 dark:border-gray-700 bg-white"
                            allow="autoplay; fullscreen"
                            allowFullScreen
                          ></iframe>
                        </div>
                      ) : (
                        <div className="prose dark:prose-invert max-w-none text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {item.giaiphap || 'Sáng kiến này chưa có tóm tắt giải pháp.'}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-6">
                      {history.length === 0 && !existingScore && (
                        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                          Chưa có lịch sử cập nhật nào cho Sáng kiến này.
                        </div>
                      )}

                      {/* Display Score Event if exists */}
                      {existingScore && (
                        <div className="relative pl-6 border-l-2 border-orange-200 dark:border-orange-800">
                          <div className="absolute w-3 h-3 bg-evn-orange rounded-full -left-[7px] top-2"></div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            {new Date(existingScore.timestamp || Date.now()).toLocaleString('vi-VN')}
                          </p>
                          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-100 dark:border-orange-800/50">
                            <p className="text-sm font-semibold text-orange-800 dark:text-orange-400">
                              Đã chấm điểm sơ bộ ({totalScore}đ)
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              Bởi: {existingScore.nguoi_cham}
                            </p>
                            {existingScore.ghi_chu && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-2 border-t border-orange-200 dark:border-orange-800/50 pt-2">
                                "{existingScore.ghi_chu}"
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Display Tracking Events */}
                      {history.map((t: any, idx: number) => (
                        <div key={idx} className="relative pl-6 border-l-2 border-blue-200 dark:border-blue-800">
                          <div className="absolute w-3 h-3 bg-evn-blue rounded-full -left-[7px] top-2"></div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            {new Date(t.timestamp).toLocaleString('vi-VN')}
                          </p>
                          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                Cập nhật trạng thái: {t.trang_thai}
                              </span>
                              <span className="text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded">
                                Tiến độ: {t.tien_do || 0}%
                              </span>
                            </div>
                            {t.nguoi_phu_trach && (
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                Phụ trách: {t.nguoi_phu_trach}
                              </p>
                            )}
                            {t.ghi_chu && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-2 border-t border-gray-200 dark:border-gray-700 pt-2">
                                "{t.ghi_chu}"
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>

    {showScoreModal && (
        <ScoreModal 
          item={item} 
          onClose={() => setShowScoreModal(false)}
          appData={appData}
        />
      )}
    </>
  );
}
