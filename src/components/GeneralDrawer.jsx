import React, { useMemo } from 'react';
import { X, BookOpen, Layers, Bot, Settings, Sparkles, CheckCircle2, BookmarkCheck, KeyRound } from 'lucide-react';
import vocabData from '../data/vocabulary_b1_11.json';

const VOCAB_STATUS_KEY = 'jpd133_vocab_status_v1';

export default function GeneralDrawer({ isOpen, onClose, activeTab, onOpenAiSettings }) {
  if (!isOpen) return null;

  // Tính thống kê từ vựng nếu ở tab vocabulary
  const vocabStats = useMemo(() => {
    try {
      const saved = localStorage.getItem(VOCAB_STATUS_KEY);
      const statusMap = saved ? JSON.parse(saved) : {};
      let mastered = 0;
      let review = 0;
      Object.values(statusMap).forEach((st) => {
        if (st === 'mastered') mastered++;
        else if (st === 'review') review++;
      });
      return {
        total: vocabData.length,
        mastered,
        review,
        unseen: Math.max(0, vocabData.length - mastered - review)
      };
    } catch {
      return { total: vocabData.length, mastered: 0, review: 0, unseen: vocabData.length };
    }
  }, [isOpen]);

  // Gom số lượng từ theo từng bài
  const lessonCounts = useMemo(() => {
    const counts = {};
    vocabData.forEach((v) => {
      counts[v.lesson] = (counts[v.lesson] || 0) + 1;
    });
    return counts;
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity animate-fadeIn"
      />

      {/* Drawer */}
      <aside className="fixed top-0 bottom-0 left-0 z-50 w-84 sm:w-92 bg-white border-r border-slate-200/90 shadow-2xl flex flex-col animate-slideIn">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            {activeTab === 'vocabulary' ? (
              <>
                <Layers className="w-5 h-5 text-violet-600" />
                <h2 className="font-bold text-slate-800 text-sm sm:text-base">Tiến độ Từ vựng (B1-11)</h2>
              </>
            ) : (
              <>
                <Bot className="w-5 h-5 text-indigo-600" />
                <h2 className="font-bold text-slate-800 text-sm sm:text-base">Trợ lý AI JPD133</h2>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung bên trong Drawer tương ứng với chế độ đang chọn */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {activeTab === 'vocabulary' && (
            <>
              {/* Thống kê tiến độ */}
              <div className="p-3.5 bg-violet-50/70 border border-violet-100 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-violet-900">
                  <span>Tiến độ học thuộc</span>
                  <span className="font-bold text-violet-700">
                    {Math.round((vocabStats.mastered / vocabStats.total) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-violet-200/60 h-2.5 rounded-full overflow-hidden flex">
                  <div 
                    style={{ width: `${(vocabStats.mastered / vocabStats.total) * 100}%` }} 
                    className="bg-emerald-500 h-full transition-all duration-300"
                  />
                  <div 
                    style={{ width: `${(vocabStats.review / vocabStats.total) * 100}%` }} 
                    className="bg-amber-400 h-full transition-all duration-300"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                  <span>Đã thuộc: <b className="text-emerald-600">{vocabStats.mastered}</b></span>
                  <span>Cần ôn: <b className="text-amber-600">{vocabStats.review}</b></span>
                  <span>Tổng từ: <b>{vocabStats.total}</b></span>
                </div>
              </div>

              {/* Danh sách 11 Bài học */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                  Phân bố từ vựng theo bài
                </h3>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {Array.from({ length: 11 }, (_, i) => i + 1).map((lesson) => (
                    <div
                      key={lesson}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/70"
                    >
                      <span className="font-semibold text-slate-700">Bài {lesson}</span>
                      <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                        {lessonCounts[lesson] || 0} từ
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Phím tắt tiện lợi */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs text-slate-600">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Phím tắt Flashcard</span>
                </p>
                <div className="text-[11px] space-y-1 text-slate-500">
                  <div>• <kbd className="px-1 bg-white border rounded">Space</kbd> : Lật mặt trước / sau</div>
                  <div>• <kbd className="px-1 bg-white border rounded">←</kbd> <kbd className="px-1 bg-white border rounded">→</kbd> : Chuyển từ trước / sau</div>
                  <div>• <kbd className="px-1 bg-white border rounded">S</kbd> : Nghe phát âm tiếng Nhật</div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'ai-lookup' && (
            <>
              {/* Giới thiệu tính năng AI */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Cơ chế ưu tiên 2 tầng</span>
                </div>
                <p className="text-xs text-indigo-800 leading-relaxed">
                  <b>Tầng 1:</b> Tự động tra cứu trong kho 102 câu hình, 39 câu phản xạ, 16 bài đọc và 733 từ vựng có sẵn (hoàn toàn miễn phí, không tốn API).
                </p>
                <p className="text-xs text-indigo-800 leading-relaxed">
                  <b>Tầng 2:</b> Nếu từ hoặc câu nằm ngoài giáo trình, AI sẽ phân tích Furigana, dịch nghĩa và bóc tách Kanji chi tiết.
                </p>
              </div>

              {/* Nút cấu hình API Key */}
              {onOpenAiSettings && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAiSettings();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-xs"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Cài đặt API Key (Gemini / DeepSeek)</span>
                </button>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}
