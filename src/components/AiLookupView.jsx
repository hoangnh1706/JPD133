import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  Search, 
  Volume2, 
  VolumeX, 
  ClipboardPaste, 
  Trash2, 
  BookmarkPlus, 
  Check, 
  Clock, 
  Languages, 
  BookOpen, 
  Loader2, 
  AlertCircle, 
  Settings, 
  ArrowRight,
  HelpCircle,
  Lightbulb,
  XCircle,
  Zap,
  RefreshCw
} from 'lucide-react';
import { 
  getAiConfig, 
  translateAndAnalyzeWithAi, 
  getAiLookupHistory, 
  saveAiLookupHistory, 
  clearAiLookupHistory,
  saveCustomVocab,
  getCustomVocab,
  searchInCurriculum,
  getCachedAiResult
} from '../utils/aiService';

export default function AiLookupView({ speech, speed, onOpenAiSettings }) {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [savedWordIds, setSavedWordIds] = useState(new Set());

  // Ref lưu AbortController để cho phép hủy yêu cầu AI tức thì
  const abortControllerRef = useRef(null);

  // Tải lịch sử tra cứu & danh sách từ vựng custom đã lưu
  useEffect(() => {
    setHistory(getAiLookupHistory());
    const customList = getCustomVocab();
    const set = new Set(customList.map(item => item.word_jp));
    setSavedWordIds(set);
  }, []);

  // Cleanup abort controller khi unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputText(text.trim());
      }
    } catch {
      // Ignore
    }
  };

  const handleClear = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setInputText('');
    setAnalysisResult(null);
    setErrorMessage('');
    setIsLoading(false);
  };

  // Hủy yêu cầu AI đang chạy
  const handleCancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setErrorMessage('Đã hủy yêu cầu phân tích AI.');
  };

  // Luồng tra cứu thông minh 3 tầng: Curriculum (0ms) -> Cache (0ms) -> AI Fast Call (~1s)
  const handleLookup = async (textToSearch, forceAi = false) => {
    const target = (textToSearch || inputText).trim();
    if (!target) return;

    setErrorMessage('');

    // BƯỚC 1: Nếu không ép gọi AI, kiểm tra Giáo trình nội bộ & Cache trước (0ms)
    if (!forceAi) {
      // 1.1 Kiểm tra trong giáo trình nội bộ nếu là từ ngắn (1-3 từ)
      const curriculumMatch = searchInCurriculum(target);
      if (curriculumMatch) {
        setAnalysisResult(curriculumMatch);

        // Lưu vào lịch sử
        const historyItem = {
          id: 'hist_' + Date.now(),
          query: target,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
          result: curriculumMatch
        };
        const updatedHistory = saveAiLookupHistory(historyItem);
        setHistory(updatedHistory);
        return;
      }

      // 1.2 Kiểm tra trong bộ nhớ đệm Cache
      const cached = getCachedAiResult(target);
      if (cached) {
        setAnalysisResult({ ...cached, isCached: true });

        const historyItem = {
          id: 'hist_' + Date.now(),
          query: target,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
          result: cached
        };
        const updatedHistory = saveAiLookupHistory(historyItem);
        setHistory(updatedHistory);
        return;
      }
    }

    // BƯỚC 2: Gọi AI với cấu hình siêu tốc (thinkingBudget: 0)
    const config = getAiConfig();
    if (!config.apiKey || !config.apiKey.trim()) {
      setErrorMessage('Bạn chưa cài đặt API Key. Hãy bấm nút "Cài đặt AI (⚙️)" bên dưới để nhập Key.');
      return;
    }

    // Khởi tạo AbortController mới
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);

    try {
      const result = await translateAndAnalyzeWithAi(target, controller.signal, forceAi);
      setAnalysisResult(result);

      // Lưu vào lịch sử 20 lần gần nhất
      const historyItem = {
        id: 'hist_' + Date.now(),
        query: target,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
        result
      };
      const updatedHistory = saveAiLookupHistory(historyItem);
      setHistory(updatedHistory);

    } catch (error) {
      if (error.name === 'AbortError' || error.message?.includes('hủy')) {
        setErrorMessage('Đã hủy yêu cầu tra cứu AI.');
      } else {
        console.error(error);
        setErrorMessage(error.message || 'Lỗi khi gọi AI. Vui lòng kiểm tra lại kết nối mạng hoặc API Key.');
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleSelectHistory = (item) => {
    setInputText(item.query);
    setAnalysisResult(item.result);
    setErrorMessage('');
  };

  const handleSaveToFlashcard = (vocab) => {
    const saved = saveCustomVocab({
      word: vocab.word,
      reading: vocab.reading,
      han_viet: vocab.han_viet,
      meaning: vocab.meaning,
      grammar: analysisResult?.grammar_explanation || ''
    });

    if (saved) {
      setSavedWordIds(prev => new Set([...prev, vocab.word]));
    }
  };

  const sampleQueries = [
    '図書館',
    'nhà ga',
    'これはいくらですか。',
    '週末、友達と映画を見に行きます。',
    'お腹が痛いですから、病院へ行きます。'
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Banner Giới thiệu Chế độ Tra cứu AI */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Translation & Grammar Breakdown</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Trợ lý Tra cứu & Dịch thuật AI (Nhật ↔ Việt)
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed">
            Nhập hoặc dán bất kỳ câu, từ vựng hoặc chữ Hán ngoài giáo trình. AI phản hồi tức thì (~1s) với Furigana chuẩn, dịch nghĩa và giải thích ngữ pháp.
          </p>
        </div>

        {/* Nút Cài đặt AI góc trên */}
        <button
          onClick={onOpenAiSettings}
          className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-xs font-semibold text-white border border-white/20 transition-colors"
        >
          <Settings className="w-3.5 h-3.5 text-indigo-200" />
          <span>Cài đặt AI</span>
        </button>
      </div>

      {/* Input Box Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-4">
        
        {/* Action Toolbar on Top of Textarea */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <Languages className="w-4 h-4 text-indigo-600" />
            <span>Nhập tiếng Nhật hoặc tiếng Việt</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePaste}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
              title="Dán văn bản từ clipboard"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Dán nhanh</span>
            </button>

            {inputText && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-semibold transition-colors"
                title="Xóa nội dung"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa</span>
              </button>
            )}
          </div>
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleLookup();
              }
            }}
            placeholder="Ví dụ: 図書館, nhà ga, 駅までの道を教えてください..."
            rows={3}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm sm:text-base font-japanese text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white resize-none transition-all"
          />
        </div>

        {/* Example Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 flex items-center gap-1 mr-1">
            <Lightbulb className="w-3 h-3 text-amber-500" />
            <span>Gợi ý:</span>
          </span>
          {sampleQueries.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputText(sample);
                handleLookup(sample);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 text-[11px] font-japanese transition-colors"
            >
              {sample}
            </button>
          ))}
        </div>

        {/* Action Controls: Submit + Nút Hủy Yêu Cầu */}
        <div className="pt-2 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Mẹo: Nhấn <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono">Ctrl + Enter</kbd> để tra nhanh
          </span>

          <div className="flex items-center gap-2 ml-auto">
            {isLoading ? (
              <>
                {/* NÚT HỦY YÊU CẦU KHI AI ĐANG PHÂN TÍCH */}
                <button
                  type="button"
                  onClick={handleCancelRequest}
                  className="flex items-center gap-1.5 px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-2xs"
                  title="Hủy ngay yêu cầu AI đang phân tích để nhập từ khác"
                >
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Hủy yêu cầu</span>
                </button>

                <div className="flex items-center gap-2 px-5 py-3 bg-indigo-600/80 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md cursor-wait">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI đang phân tích...</span>
                </div>
              </>
            ) : (
              <button
                onClick={() => handleLookup()}
                disabled={!inputText.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-100 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>Tra cứu & Phân tích</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs sm:text-sm flex items-start gap-3 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Thông báo</p>
            <p>{errorMessage}</p>
            {errorMessage.includes('API Key') && (
              <button
                onClick={onOpenAiSettings}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-rose-700"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Mở Cài đặt AI ngay</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* RESULTS DISPLAY SECTION */}
      {analysisResult && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6 animate-fadeIn">
          
          {/* BANNER 1: NẾU TÌM THẤY TRONG GIÁO TRÌNH NỘI BỘ (0 GIÂY) */}
          {analysisResult.isFromCurriculum && (
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-2 border-emerald-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2.5 text-emerald-950">
                <span className="text-2xl">📚</span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs sm:text-sm text-emerald-900">Tìm thấy trong giáo trình JPD133</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-extrabold">0 giây • Miễn phí</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 font-medium mt-0.5">Nguồn: {analysisResult.source}</p>
                </div>
              </div>

              {/* Nút phụ: Vẫn muốn nhờ AI đặt câu ví dụ & phân tích sâu */}
              <button
                onClick={() => handleLookup(inputText || analysisResult.input_text, true)}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-emerald-100/70 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all shadow-2xs shrink-0 self-start sm:self-auto"
                title="Bấm để gọi AI tạo thêm câu ví dụ phong phú và phân tích ngữ pháp chuyên sâu"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Vẫn muốn nhờ AI đặt câu ví dụ & phân tích sâu</span>
              </button>
            </div>
          )}

          {/* BANNER 2: NẾU TẢI TỪ BỘ NHỚ ĐỆM CACHE (0MS) */}
          {analysisResult.isCached && !analysisResult.isFromCurriculum && (
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs text-indigo-950 animate-fadeIn">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                <span>
                  <b>Bộ nhớ đệm Cache (0ms):</b> Tải tức thì kết quả đã phân tích từ trước mà không cần gọi lại mạng.
                </span>
              </div>
              <button
                onClick={() => handleLookup(inputText || analysisResult.input_text, true)}
                disabled={isLoading}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 underline shrink-0"
                title="Yêu cầu AI phân tích lại mới hoàn toàn"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Phân tích lại</span>
              </button>
            </div>
          )}

          {/* 1. Câu tiếng Nhật chuẩn & Furigana */}
          <div className="space-y-3 p-5 sm:p-6 bg-gradient-to-br from-indigo-50/70 via-indigo-50/30 to-slate-50 border border-indigo-100 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>Câu tiếng Nhật chuẩn & Furigana</span>
              </span>

              {/* Nút phát âm */}
              <button
                onClick={() => speech.speak(analysisResult.japanese_plain || analysisResult.reading_hiragana, speed)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all"
                title="Nghe phát âm chuẩn giọng Nhật"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Phát âm ({speed}x)</span>
              </button>
            </div>

            {/* Render Ruby HTML */}
            <div 
              className="text-2xl sm:text-3xl font-black text-slate-800 font-japanese leading-loose py-2 tracking-wide"
              dangerouslySetInnerHTML={{ __html: analysisResult.japanese_ruby_html || analysisResult.japanese_plain }}
            />

            {/* Reading Hiragana */}
            {analysisResult.reading_hiragana && (
              <p className="text-xs sm:text-sm text-indigo-600 font-bold font-japanese border-t border-indigo-100/80 pt-2">
                Cách đọc: {analysisResult.reading_hiragana}
              </p>
            )}
          </div>

          {/* 2. Bản dịch tiếng Việt */}
          <div className="p-4 sm:p-5 bg-emerald-50/70 border border-emerald-100 rounded-2xl space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Bản dịch tiếng Việt
            </span>
            <p className="text-base sm:text-lg font-bold text-slate-800">
              {analysisResult.vietnamese_translation}
            </p>
          </div>

          {/* 3. Câu ví dụ trong giáo trình (nếu có từ giáo trình nội bộ) */}
          {analysisResult.example_jp && (
            <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Câu ví dụ trong giáo trình
              </span>
              <p className="text-sm sm:text-base font-japanese font-bold text-slate-800">
                {analysisResult.example_jp}
              </p>
              {analysisResult.example_vi && (
                <p className="text-xs sm:text-sm text-slate-600">
                  {analysisResult.example_vi}
                </p>
              )}
            </div>
          )}

          {/* 4. Vocabulary Breakdown (Bóc tách từ vựng & Âm Hán Việt) */}
          {analysisResult.breakdown && analysisResult.breakdown.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Bóc tách từ vựng ({analysisResult.breakdown.length})</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  Bấm <span className="font-bold text-indigo-600">+ Lưu</span> để ôn lại trong Flashcard
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analysisResult.breakdown.map((item, idx) => {
                  const isSaved = savedWordIds.has(item.word);
                  return (
                    <div 
                      key={idx}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-baseline gap-2">
                          <span className="text-base sm:text-lg font-bold font-japanese text-slate-900">
                            {item.word}
                          </span>
                          <span className="text-xs font-semibold text-indigo-600 font-japanese">
                            {item.reading}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                          {item.han_viet && (
                            <span className="px-1.5 py-0.2 bg-indigo-100/70 text-indigo-800 rounded font-semibold text-[10px]">
                              {item.han_viet}
                            </span>
                          )}
                          <span>{item.meaning}</span>
                        </div>
                      </div>

                      {/* Speaker & Save to Flashcard */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => speech.speak(item.reading || item.word, speed)}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
                          title="Nghe phát âm từ này"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleSaveToFlashcard(item)}
                          disabled={isSaved}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            isSaved
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
                          }`}
                          title={isSaved ? 'Đã lưu vào Flashcard' : 'Lưu từ này vào Flashcard để ôn'}
                        >
                          {isSaved ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-[11px]">Đã lưu</span>
                            </>
                          ) : (
                            <>
                              <BookmarkPlus className="w-3 h-3" />
                              <span className="text-[11px]">+ Lưu</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. Giải thích ngữ pháp & Cấu trúc câu */}
          {analysisResult.grammar_explanation && (
            <div className="p-4 sm:p-5 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                <span>Giải thích ngữ pháp & Cấu trúc câu</span>
              </span>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {analysisResult.grammar_explanation}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 6. Lịch sử tra cứu gần nhất (Tối đa 20 lần) */}
      {history.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Lịch sử tra cứu gần đây ({history.length}/20)</span>
            </span>

            <button
              onClick={() => {
                clearAiLookupHistory();
                setHistory([]);
              }}
              className="text-[11px] text-slate-400 hover:text-rose-600 font-semibold"
            >
              Xóa lịch sử
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {history.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectHistory(item)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 text-xs text-slate-700 font-japanese transition-all flex items-center gap-2"
                title={`Tra lại: ${item.query}`}
              >
                <span className="truncate max-w-[200px]">{item.query}</span>
                <span className="text-[10px] text-slate-400 font-sans">{item.timestamp}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
