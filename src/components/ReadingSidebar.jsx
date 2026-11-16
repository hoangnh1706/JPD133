import React, { useMemo } from 'react';
import { 
  X, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  RotateCcw
} from 'lucide-react';

export default function ReadingSidebar({
  isOpen,
  onClose,
  passages,
  currentId,
  onSelectPassage,
  groupFilter,
  setGroupFilter,
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
  progress,
  onResetProgress
}) {
  // Lọc danh sách bài đọc
  const filteredPassages = useMemo(() => {
    return passages.filter((p) => {
      // Lọc theo Group
      if (groupFilter !== 'all' && p.group !== groupFilter) {
        return false;
      }

      // Lọc theo trạng thái
      const itemStatus = progress[p.id] || 'unseen';
      if (statusFilter !== 'all' && itemStatus !== statusFilter) {
        return false;
      }

      // Lọc theo tìm kiếm
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const idMatch = String(p.id) === query || `bài ${p.id}`.includes(query) || `bai ${p.id}`.includes(query);
        const titleMatch = p.title.toLowerCase().includes(query);
        const textMatch = p.jp_text.toLowerCase().includes(query) || p.vi_text.toLowerCase().includes(query);
        return idMatch || titleMatch || textMatch;
      }

      return true;
    });
  }, [passages, groupFilter, statusFilter, searchQuery, progress]);

  // Thống kê số lượng
  const counts = useMemo(() => {
    let mastered = 0;
    let review = 0;
    let unseen = 0;
    passages.forEach(p => {
      const s = progress[p.id];
      if (s === 'mastered') mastered++;
      else if (s === 'review') review++;
      else unseen++;
    });
    return { mastered, review, unseen, total: passages.length };
  }, [passages, progress]);

  return (
    <>
      {/* Backdrop (chỉ hiển thị trên mobile khi mở ngăn kéo) */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity animate-fadeIn lg:hidden"
        />
      )}

      {/* Sidebar panel: Mở cố định bên ngoài trên Desktop (lg:), Drawer trượt trên Mobile */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-80 sm:w-88 bg-white border-r border-slate-200/90 flex flex-col transition-all duration-300 ease-in-out lg:sticky lg:top-16 lg:bottom-auto lg:left-auto lg:z-10 lg:shadow-none lg:h-[calc(100vh-4rem)] shrink-0 ${
          isOpen 
            ? 'translate-x-0 shadow-2xl lg:shadow-none lg:flex' 
            : '-translate-x-full lg:hidden'
        }`}
      >
        {/* Top Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600" />
            <h2 className="font-bold text-slate-800 text-sm sm:text-base">16 Bài Luyện Đọc</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Thu gọn danh sách"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress summary bar */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1.5">
            <span>Tiến độ luyện đọc</span>
            <span className="font-bold text-amber-600">
              {Math.round((counts.mastered / counts.total) * 100)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
            <div 
              style={{ width: `${(counts.mastered / counts.total) * 100}%` }} 
              className="bg-emerald-500 h-full transition-all duration-300"
              title={`Đã trôi chảy: ${counts.mastered}`}
            />
            <div 
              style={{ width: `${(counts.review / counts.total) * 100}%` }} 
              className="bg-amber-400 h-full transition-all duration-300"
              title={`Cần luyện thêm: ${counts.review}`}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Đã trôi chảy: <b>{counts.mastered}</b>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              Cần luyện: <b>{counts.review}</b>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />
              Chưa đọc: <b>{counts.unseen}</b>
            </span>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="p-3 border-b border-slate-200 space-y-2.5 shrink-0">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm số bài, tiêu đề, từ khóa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-7 py-1.5 text-xs sm:text-sm bg-slate-100 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Group Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'Tất cả (16)' },
              { id: 'Phần 1: Bài đọc 1–8', label: 'Bài 1–8' },
              { id: 'Phần 2: 問題 I–VII', label: '問題 I–VII' },
              { id: 'Phần 3: Bài đọc bổ sung', label: 'Bổ sung' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setGroupFilter(tab.id)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium whitespace-nowrap transition-colors ${
                  groupFilter === tab.id
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="grid grid-cols-4 gap-1 text-[11px]">
            <button
              onClick={() => setStatusFilter('all')}
              className={`py-1 px-1.5 rounded text-center transition-colors font-medium ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setStatusFilter('review')}
              className={`py-1 px-1.5 rounded text-center transition-colors font-medium flex items-center justify-center gap-1 ${
                statusFilter === 'review'
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              Cần ôn
            </button>
            <button
              onClick={() => setStatusFilter('mastered')}
              className={`py-1 px-1.5 rounded text-center transition-colors font-medium flex items-center justify-center gap-1 ${
                statusFilter === 'mastered'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              Trôi chảy
            </button>
            <button
              onClick={() => setStatusFilter('unseen')}
              className={`py-1 px-1.5 rounded text-center transition-colors font-medium ${
                statusFilter === 'unseen'
                  ? 'bg-slate-400 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Chưa đọc
            </button>
          </div>
        </div>

        {/* Passage List Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
          {filteredPassages.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Không tìm thấy bài đọc nào phù hợp
            </div>
          ) : (
            filteredPassages.map((p) => {
              const isSelected = p.id === currentId;
              const status = progress[p.id];

              return (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelectPassage(p.id);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-amber-50 border-2 border-amber-500/80 shadow-xs'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  {/* ID badge */}
                  <div className="shrink-0 pt-0.5">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-700 text-white text-xs font-bold shadow-xs">
                      #{p.id}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] font-semibold rounded">
                        {p.group.split(':')[0]}
                      </span>
                      {/* Status icon badge */}
                      {status === 'mastered' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-auto" />
                      )}
                      {status === 'review' && (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 ml-auto" />
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-800 line-clamp-1">
                      {p.title}
                    </p>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-sans">
                      {p.jp_text.substring(0, 45)}...
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer: Reset progress */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Tìm thấy: <b>{filteredPassages.length}</b> / 16</span>
          <button
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn đặt lại tiến độ của 16 bài luyện đọc?')) {
                onResetProgress();
              }
            }}
            className="flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-700 hover:underline"
            title="Đặt lại tiến độ đọc"
          >
            <RotateCcw className="w-3 h-3" />
            Reset tiến độ
          </button>
        </div>
      </aside>
    </>
  );
}
