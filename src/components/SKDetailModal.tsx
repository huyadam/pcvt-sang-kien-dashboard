import React, { useState } from 'react';
import { SangKien } from '../types';
import { FileText, Edit, X } from 'lucide-react';
import ScoreModal from './ScoreModal';

interface SKDetailModalProps {
  item: SangKien;
  onClose: () => void;
  appData: any;
}

export default function SKDetailModal({ item, onClose, appData }: SKDetailModalProps) {
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showPdf, setShowPdf] = useState(false);

  return (
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

                <div className="flex space-x-3">
                  {item.gdrive_url ? (
                    <button
                      onClick={() => setShowPdf(!showPdf)}
                      className="flex-1 flex items-center justify-center space-x-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                    >
                      <FileText size={18} />
                      <span>{showPdf ? 'Đóng Tài liệu' : 'Xem Tài liệu gốc'}</span>
                    </button>
                  ) : (
                    <button disabled className="flex-1 flex items-center justify-center space-x-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 px-4 py-2.5 rounded-md cursor-not-allowed">
                      <FileText size={18} />
                      <span>Không có File</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowScoreModal(true)}
                    className="flex-1 flex items-center justify-center space-x-2 bg-evn-orange text-white px-4 py-2.5 rounded-md hover:bg-evn-orange-hover transition-colors font-medium shadow-sm"
                  >
                    <Edit size={18} />
                    <span>Chấm điểm</span>
                  </button>
                </div>
              </div>

              {/* Cột phải: Content / Tóm tắt giải pháp / PDF Viewer */}
              <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                  {showPdf ? 'Tài liệu Gốc (Google Drive)' : 'Tóm tắt Nội dung Giải pháp'}
                </h4>
                
                <div className="flex-1 min-h-[300px] max-h-[500px] overflow-y-auto">
                  {showPdf ? (
                    <iframe 
                      src={item.gdrive_url.replace('/view', '/preview')} 
                      className="w-full h-full min-h-[400px] rounded border border-gray-200 dark:border-gray-700"
                      allow="autoplay"
                    ></iframe>
                  ) : (
                    <div className="prose dark:prose-invert max-w-none text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {item.giaiphap || 'Sáng kiến này chưa có tóm tắt giải pháp.'}
                    </div>
                  )}
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
    </div>
  );
}
