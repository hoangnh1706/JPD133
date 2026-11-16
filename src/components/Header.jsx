import React from 'react';
import { 
  Menu, 
  Settings, 
  Languages, 
  Volume2, 
  Clock, 
  Image as ImageIcon,
  MessageSquare,
  BookOpen,
  Layers,
  Bot
} from 'lucide-react';

const MODE_TABS = [
  { 
    id: 'image', 
    label: 'Có hình', 
    count: '102', 
    icon: '🖼️', 
    activeClass: 'bg-white text-indigo-700 shadow-xs border-slate-200/60' 
  },
  { 
    id: 'no-image', 
    label: 'Phản xạ', 
    count: '39', 
    icon: '💬', 
    activeClass: 'bg-white text-teal-700 shadow-xs border-slate-200/60' 
  },
  { 
    id: 'reading', 
    label: 'Luyện đọc', 
    count: '16', 
    icon: '📖', 
    activeClass: 'bg-white text-amber-700 shadow-xs border-slate-200/60' 
  },
  { 
    id: 'vocabulary', 
    label: 'Từ vựng', 
    count: 'B1-11', 
    icon: '🗂️', 
    activeClass: 'bg-white text-violet-700 shadow-xs border-slate-200/60' 
  },
  { 
    id: 'ai-lookup', 
    label: 'Dịch AI', 
    count: 'AI', 
    icon: '🤖', 
    activeClass: 'bg-white text-indigo-600 shadow-xs border-slate-200/60' 
  }
];

export default function Header({
  activeTab,
  setActiveTab,
  speed,
  setSpeed,
  showFurigana,
  setShowFurigana,
  toggleSidebar,
  isSidebarOpen,
  masteredCount,
  reviewCount,
  totalCount,
  onOpenMockTest,
  onOpenAiSettings
}) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Left: Menu 3 gạch (☰) & 5 Nút Chuyển Chế Độ nằm ngang hàng */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1 mr-2">
            
            {/* Nút ☰ mở / thu gọn danh sách câu hỏi */}
            <button
              onClick={toggleSidebar}
              className={`p-2 rounded-xl transition-colors flex items-center justify-center shrink-0 focus:outline-none ${
                isSidebarOpen
                  ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                  : 'bg-slate-100 text-slate-700 hover:text-indigo-600 hover:bg-slate-200'
              }`}
              title={isSidebarOpen ? "Thu gọn danh sách bên trái (☰)" : "Mở danh sách bên trái (☰)"}
              aria-label="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo nhỏ */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-xs shrink-0 hidden sm:flex">
              <span className="font-bold text-xs tracking-tighter">JP</span>
            </div>

            {/* Cụm 5 Nút chuyển chế độ học (Cuộn ngang mượt mà trên màn hình nhỏ) */}
            <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/70 overflow-x-auto no-scrollbar scrollbar-none max-w-full">
              {MODE_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border ${
                      isActive
                        ? `${tab.activeClass} font-bold`
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <span className="text-sm leading-none shrink-0">{tab.icon}</span>
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-1 py-0.2 rounded-md ${
                      isActive ? 'bg-slate-100 text-slate-700 font-bold' : 'opacity-65'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Quick Action Controls & AI Settings */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Nút ⚙️ Cài đặt AI */}
            <button
              onClick={onOpenAiSettings}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors shadow-2xs"
              title="Cài đặt API Key & Model AI (Google Gemini / DeepSeek)"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden md:inline">Cài đặt AI</span>
            </button>

            {/* Nút Furigana Toggle */}
            <button
              onClick={() => setShowFurigana(!showFurigana)}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                showFurigana
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              title={showFurigana ? 'Đang bật Furigana' : 'Đang tắt Furigana'}
            >
              <Languages className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Furigana:</span>
              <span>{showFurigana ? 'Bật' : 'Tắt'}</span>
            </button>

            {/* Speed Selector */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
              <span className="px-1 text-slate-400 hidden lg:inline" title="Tốc độ đọc">
                <Volume2 className="w-3.5 h-3.5" />
              </span>
              {[0.5, 0.75, 1.0, 1.25].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-1.5 sm:px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                    speed === s
                      ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title={`Tốc độ đọc ${s}x`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Nút Thi thử */}
            <button
              onClick={onOpenMockTest}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-rose-500 to-amber-500 text-white hover:opacity-95 shadow-2xs transition-all"
              title="Phòng thi thử ngẫu nhiên 30 giây"
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Thi thử</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
