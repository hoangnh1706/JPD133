import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Eye, 
  EyeOff, 
  ChevronLeft, 
  ChevronRight, 
  Shuffle, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  BookOpen, 
  HelpCircle, 
  Languages, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  MousePointer,
  Highlighter, 
  Eraser, 
  Trash2, 
  Check,
  BookmarkPlus,
  Loader2,
  Bot,
  BookmarkCheck,
  Settings
} from 'lucide-react';
import { renderJapaneseWithFurigana, cleanForTTS } from '../utils/japanese';
import vocabData from '../data/vocabulary_b1_11.json';
import { 
  searchInLocalKnowledge, 
  explainWordOrPhraseWithAi, 
  saveCustomVocab, 
  getAiConfig,
  getCustomVocab 
} from '../utils/aiService';

export default function ReadingPracticeCard({
  passage,
  totalCount,
  onPrev,
  onNext,
  onRandom,
  onStatusChange,
  status,
  showFurigana,
  setShowFurigana,
  speech,
  speed,
  setSpeed,
  onOpenAiSettings
}) {
  // Trạng thái Chế độ phòng thi: Mặc định ẩn hoàn toàn Dịch nghĩa và Câu hỏi đọc hiểu
  const [showViText, setShowViText] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [showKanjiCheck, setShowKanjiCheck] = useState(false);
  const [showHighlightedWords, setShowHighlightedWords] = useState(false);
  
  // Trạng thái mở chi tiết dịch & đáp án của từng câu hỏi { [index]: boolean }
  const [revealedAnswers, setRevealedAnswers] = useState({});

  // Công cụ: 'cursor' (Con trỏ / Copy) | 'highlighter' (Bút bôi) | 'eraser' (Tẩy)
  const [toolMode, setToolMode] = useState('cursor');

  // Danh sách các đoạn text đã bôi đánh dấu
  const [highlights, setHighlights] = useState(() => {
    try {
      const saved = localStorage.getItem(`jpd133_highlights_p${passage.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Đồng hồ bấm giờ đọc bài (Stopwatch)
  const [seconds, setSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef(null);

  // Khi chuyển bài mới: reset đồng hồ, nạp lại vết bôi và ẩn các mục phụ
  useEffect(() => {
    setShowViText(false);
    setShowQuestions(false);
    setShowKanjiCheck(false);
    setShowHighlightedWords(false);
    setRevealedAnswers({});
    setSeconds(0);
    setIsTimerRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    speech.stop();

    try {
      const saved = localStorage.getItem(`jpd133_highlights_p${passage.id}`);
      setHighlights(saved ? JSON.parse(saved) : []);
    } catch {
      setHighlights([]);
    }
  }, [passage.id]);

  // Lưu highlights vào localStorage
  const saveHighlights = (newHighlights) => {
    setHighlights(newHighlights);
    try {
      localStorage.setItem(`jpd133_highlights_p${passage.id}`, JSON.stringify(newHighlights));
    } catch (e) {
      console.warn('Cannot save highlights to localStorage', e);
    }
  };

  // Stopwatch effect
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setSeconds(0);
  };

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Nghe đọc mẫu toàn bộ bài đọc
  const handleSpeakPassage = () => {
    if (speech.isSpeaking && speech.currentText === passage.jp_text) {
      speech.stop();
    } else {
      speech.speak(passage.jp_text, speed);
    }
  };

  // Nghe đọc từng câu hỏi
  const handleSpeakQuestion = (q_jp) => {
    if (speech.isSpeaking && speech.currentText === q_jp) {
      speech.stop();
    } else {
      speech.speak(q_jp, speed);
    }
  };

  // Nghe đọc câu trả lời mẫu
  const handleSpeakAnswer = (a_jp) => {
    if (speech.isSpeaking && speech.currentText === a_jp) {
      speech.stop();
    } else {
      speech.speak(a_jp, speed);
    }
  };

  const toggleRevealAnswer = (index) => {
    setRevealedAnswers((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // ==========================================
  // XỬ LÝ BÚT BÔI & CỤC TẨY
  // ==========================================
  const handleTextSelection = () => {
    // CHỈ khi đang ở chế độ 'highlighter' mới đánh dấu màu hồng
    if (toolMode !== 'highlighter') return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const rawText = selection.toString().trim();
    if (!rawText || rawText.length === 0) return;

    // Tránh thêm rỗng hoặc trùng lặp hoàn toàn
    if (!highlights.includes(rawText)) {
      const updated = [...highlights, rawText];
      saveHighlights(updated);
    }

    selection.removeAllRanges();
  };

  const handleHighlightClick = (sliceText) => {
    if (toolMode === 'eraser') {
      const cleanSlice = sliceText.replace(/<rt>.*?<\/rt>/g, '').replace(/<[^>]+>/g, '').replace(/[（\(].*?[）\)]/g, '').trim();
      const updated = highlights.filter(h => 
        h !== sliceText && 
        h !== cleanSlice && 
        !sliceText.includes(h) && 
        !h.includes(cleanSlice)
      );
      saveHighlights(updated);
    }
  };

  const handleClearAllHighlights = () => {
    if (highlights.length === 0) return;
    if (window.confirm('Bạn có muốn xóa toàn bộ vết bôi đánh dấu trong bài này không?')) {
      saveHighlights([]);
    }
  };

  // Khi bấm "✓ Đã nhớ" ở thẻ từ bên dưới
  const handleRememberWord = (word) => {
    const updated = highlights.filter(h => !h.includes(word) && !word.includes(h));
    saveHighlights(updated);
  };

  // ==========================================
  // XỬ LÝ KIỂM TRA 2 TẦNG: TÀI LIỆU TRƯỚC - AI SAU
  // ==========================================
  const [aiResults, setAiResults] = useState({});
  const [loadingAiPhrases, setLoadingAiPhrases] = useState({});
  const [savedFlashcards, setSavedFlashcards] = useState(new Set());
  const [isTranslatingAll, setIsTranslatingAll] = useState(false);
  const [aiError, setAiError] = useState('');

  // Duyệt qua từng vết bôi theo 2 tầng:
  // Tầng 1: Tra cứu tài liệu (all_kanji_words, kanji_check, vocabulary_b1_11.json, localStorage)
  // Tầng 2: Ngoài tài liệu (sẵn sàng gọi AI)
  const processedHighlightedItems = useMemo(() => {
    if (!highlights || highlights.length === 0) return [];

    const items = [];
    const seenWords = new Set();

    highlights.forEach(h => {
      if (!h || !h.trim()) return;
      const clean = h.replace(/<rt>.*?<\/rt>/g, '').replace(/<[^>]+>/g, '').replace(/（[^）]*）|\([^)]*\)/g, '').trim();
      if (!clean || seenWords.has(clean)) return;
      seenWords.add(clean);

      // Tầng 1: Tra cứu tài liệu có sẵn (Ưu tiên 100% không tốn API)
      const local = searchInLocalKnowledge(clean, passage, vocabData);
      if (local) {
        items.push({
          rawText: h,
          cleanWord: local.word || clean,
          reading: local.reading,
          meaning: local.meaning,
          han_viet: local.han_viet,
          on_reading: local.on_reading,
          kun_reading: local.kun_reading,
          lesson: local.lesson,
          examples: local.examples,
          isKanji: !!local.isKanji,
          source: local.source,
          isLocal: true
        });
      } else {
        // Tầng 2: Ngoài tài liệu
        items.push({
          rawText: h,
          cleanWord: clean,
          isLocal: false,
          aiData: aiResults[clean] || null,
          isTranslating: !!loadingAiPhrases[clean]
        });
      }
    });

    return items;
  }, [highlights, passage, aiResults, loadingAiPhrases]);

  // Đếm số từ ngoài tài liệu chưa dịch
  const unTranslatedCount = useMemo(() => {
    return processedHighlightedItems.filter(item => !item.isLocal && !item.aiData).length;
  }, [processedHighlightedItems]);

  // Dịch 1 từ ngoài tài liệu bằng AI
  const handleTranslateSingleItem = async (cleanWord) => {
    const config = getAiConfig();
    if (!config.apiKey || !config.apiKey.trim()) {
      if (onOpenAiSettings) onOpenAiSettings();
      else alert('Vui lòng cài đặt API Key trước khi dịch AI.');
      return;
    }

    setLoadingAiPhrases(prev => ({ ...prev, [cleanWord]: true }));
    setAiError('');

    try {
      const res = await explainWordOrPhraseWithAi(cleanWord, passage.jp_text);
      setAiResults(prev => ({ ...prev, [cleanWord]: res }));
    } catch (err) {
      console.error(err);
      setAiError(err.message || 'Lỗi khi gọi AI');
    } finally {
      setLoadingAiPhrases(prev => ({ ...prev, [cleanWord]: false }));
    }
  };

  // Dịch tất cả từ ngoài tài liệu
  const handleTranslateAllExternal = async () => {
    const config = getAiConfig();
    if (!config.apiKey || !config.apiKey.trim()) {
      if (onOpenAiSettings) onOpenAiSettings();
      else alert('Vui lòng cài đặt API Key trước khi dịch AI.');
      return;
    }

    const needTranslate = processedHighlightedItems.filter(item => !item.isLocal && !item.aiData);
    if (needTranslate.length === 0) return;

    setIsTranslatingAll(true);
    setAiError('');

    for (const it of needTranslate) {
      setLoadingAiPhrases(prev => ({ ...prev, [it.cleanWord]: true }));
      try {
        const res = await explainWordOrPhraseWithAi(it.cleanWord, passage.jp_text);
        setAiResults(prev => ({ ...prev, [it.cleanWord]: res }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingAiPhrases(prev => ({ ...prev, [it.cleanWord]: false }));
      }
    }

    setIsTranslatingAll(false);
  };

  // Lưu từ AI vào Flashcard
  const handleSaveToFlashcard = (cleanWord, aiData) => {
    saveCustomVocab({
      word: cleanWord,
      reading: aiData.reading,
      meaning: aiData.meaning_vi,
      han_viet: aiData.han_viet,
      grammar: aiData.grammar_notes
    });
    setSavedFlashcards(prev => new Set([...prev, cleanWord]));
  };

  // Phân tách jp_text thành các lát cắt (slices) có đánh dấu highlight
  const textSlices = useMemo(() => {
    const text = passage.jp_text;
    if (!highlights || highlights.length === 0) {
      return [{ text, isHighlight: false }];
    }

    let intervals = [];
    highlights.forEach(h => {
      if (!h) return;
      let idx = 0;
      while ((idx = text.indexOf(h, idx)) !== -1) {
        let start = idx;
        let end = idx + h.length;

        // Nếu từ này được bọc bởi thẻ <ruby>...</ruby>: mở rộng start và end bao trọn thẻ ruby
        if (start >= 6 && text.substring(start - 6, start) === '<ruby>') {
          const rubyCloseIdx = text.indexOf('</ruby>', end);
          if (rubyCloseIdx !== -1) {
            start = start - 6;
            end = rubyCloseIdx + 7;
          }
        } else {
          // Hoặc kiểm tra nếu ngay sau đó là cụm furigana trong ngoặc cũ (dự phòng)
          const rem = text.substring(end);
          const fm = rem.match(/^[（\(][ぁ-んァ-ヶー0-9]+[）\)]/);
          if (fm) {
            end += fm[0].length;
          }
        }

        intervals.push({ start, end, text: text.substring(start, end) });
        idx = end;
      }
    });

    if (intervals.length === 0) {
      return [{ text, isHighlight: false }];
    }

    // Sắp xếp và hợp nhất các khoảng chồng chéo
    intervals.sort((a, b) => a.start - b.start);
    let merged = [];
    for (let iv of intervals) {
      if (merged.length === 0) {
        merged.push({ ...iv });
      } else {
        let last = merged[merged.length - 1];
        if (iv.start <= last.end) {
          last.end = Math.max(last.end, iv.end);
          last.text = text.substring(last.start, last.end);
        } else {
          merged.push({ ...iv });
        }
      }
    }

    let slices = [];
    let curr = 0;
    for (let iv of merged) {
      if (iv.start > curr) {
        slices.push({ text: text.substring(curr, iv.start), isHighlight: false });
      }
      slices.push({ text: text.substring(iv.start, iv.end), isHighlight: true });
      curr = iv.end;
    }
    if (curr < text.length) {
      slices.push({ text: text.substring(curr), isHighlight: false });
    }

    return slices;
  }, [passage.jp_text, highlights]);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Top Action Bar: Navigation & Quick Status & Stopwatch */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs">
        
        {/* Navigation buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onPrev}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium transition-colors"
            title="Bài trước (Phím ←)"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Trước</span>
          </button>

          <span className="px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200/60 rounded-lg">
            Bài {passage.id} / {totalCount}
          </span>

          <button
            onClick={onNext}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium transition-colors"
            title="Bài sau (Phím →)"
          >
            <span className="hidden sm:inline">Sau</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={onRandom}
            className="p-2 rounded-xl bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-600 transition-colors ml-1"
            title="Bài đọc ngẫu nhiên"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Stopwatch */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono">
          <Clock className={`w-4 h-4 ${isTimerRunning ? 'text-amber-600 animate-spin' : 'text-slate-400'}`} />
          <span className="font-bold text-slate-800 text-sm">{formatTime(seconds)}</span>
          <button
            onClick={toggleTimer}
            className={`p-1 rounded-md transition-colors ${
              isTimerRunning 
                ? 'bg-amber-500 text-white' 
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
            title={isTimerRunning ? 'Tạm dừng bấm giờ' : 'Bắt đầu bấm giờ đọc'}
          >
            {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={resetTimer}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200"
            title="Đặt lại đồng hồ"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Status markers: Đã đọc trôi chảy / Cần luyện thêm */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onStatusChange(passage.id, status === 'review' ? 'unseen' : 'review')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              status === 'review'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            <span>Cần luyện thêm</span>
          </button>

          <button
            onClick={() => onStatusChange(passage.id, status === 'mastered' ? 'unseen' : 'mastered')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              status === 'mastered'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Đã trôi chảy</span>
          </button>
        </div>
      </div>

      {/* Main Reading Card (Mô phỏng màn hình đề thi phòng thi) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        
        {/* Card Header: Group & Title */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-50 via-amber-50/40 to-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 bg-amber-600 text-white text-xs font-bold rounded-lg shadow-xs">
              {passage.group}
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-900">
              {passage.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-lg font-medium">
              📖 Đọc thành tiếng & Trả lời câu hỏi
            </span>
          </div>
        </div>

        {/* Card Body: Japanese Text Display (Hero Reading Box) */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Main Reading Passage Text Box */}
          <div className="bg-amber-50/20 rounded-3xl p-6 sm:p-8 border-2 border-amber-200/70 shadow-xs relative">
            
            {/* Top Toolbar inside Reading Box: Description & Bút bôi / Tẩy */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-amber-200/50 text-xs text-amber-900/70 font-semibold">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-600" />
                Đề bài đọc tiếng Nhật (Chế độ thi):
              </span>

              {/* Toolbar: Con trỏ, Bút bôi, Tẩy, Xóa hết */}
              <div className="flex items-center gap-1.5 bg-white/95 p-1 rounded-xl border border-amber-200/80 shadow-2xs">
                {/* 🖱️ Nút Con trỏ (Chọn / Copy) */}
                <button
                  onClick={() => setToolMode('cursor')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    toolMode === 'cursor'
                      ? 'bg-slate-700 text-white shadow-2xs ring-2 ring-slate-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Chế độ Con trỏ: Bôi đen văn bản bình thường để copy (Ctrl + C), không dính vết bôi hồng"
                >
                  <MousePointer className="w-3.5 h-3.5" />
                  <span>Con trỏ</span>
                </button>

                {/* 🖍️ Nút Bút bôi */}
                <button
                  onClick={() => setToolMode(toolMode === 'highlighter' ? 'cursor' : 'highlighter')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    toolMode === 'highlighter'
                      ? 'bg-rose-500 text-white shadow-2xs ring-2 ring-rose-300'
                      : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50'
                  }`}
                  title="Chế độ Bút bôi: Quét chuột qua chữ để đánh dấu màu hồng (Bấm lại để tắt về Con trỏ)"
                >
                  <Highlighter className="w-3.5 h-3.5" />
                  <span>Bút bôi</span>
                </button>

                {/* 🧹 Nút Tẩy */}
                <button
                  onClick={() => setToolMode(toolMode === 'eraser' ? 'cursor' : 'eraser')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    toolMode === 'eraser'
                      ? 'bg-amber-500 text-white shadow-2xs ring-2 ring-amber-300'
                      : 'text-slate-600 hover:text-amber-600 hover:bg-amber-50'
                  }`}
                  title="Chế độ Tẩy: Click vào chữ đã bôi để xóa vết bôi"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Tẩy</span>
                </button>

                {highlights.length > 0 && (
                  <button
                    onClick={handleClearAllHighlights}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-0.5"
                    title="Xóa toàn bộ vết bôi trong bài này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Paragraph Text with Large Font & Japanese Typography */}
            <div 
              onMouseUp={handleTextSelection}
              onTouchEnd={handleTextSelection}
              className={`text-lg sm:text-xl md:text-2xl font-medium leading-[2.4] text-slate-900 tracking-wide font-sans select-text ${
                toolMode === 'eraser' ? 'cursor-crosshair' : 'cursor-text'
              }`}
            >
              {textSlices.map((slice, index) => {
                if (slice.isHighlight) {
                  return (
                    <mark
                      key={index}
                      onClick={() => handleHighlightClick(slice.text)}
                      className={`bg-rose-300/70 text-rose-950 rounded px-0.5 transition-colors ${
                        toolMode === 'eraser' 
                          ? 'cursor-crosshair hover:bg-rose-400 hover:line-through' 
                          : 'cursor-text'
                      }`}
                      title={toolMode === 'eraser' ? 'Bấm để xóa vết bôi này' : 'Từ đã bôi'}
                    >
                      {renderJapaneseWithFurigana(slice.text, showFurigana)}
                    </mark>
                  );
                }
                return (
                  <React.Fragment key={index}>
                    {renderJapaneseWithFurigana(slice.text, showFurigana)}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Tip note under reading box */}
            <div className="mt-3 text-[11px] text-slate-400 text-right italic">
              {toolMode === 'cursor' && '🖱️ Chế độ Con trỏ: Kéo bôi đen văn bản để copy (Ctrl + C) • Bấm 🖍️ Bút bôi để đánh dấu'}
              {toolMode === 'highlighter' && '🖍️ Chế độ Bút bôi: Kéo chuột để đánh dấu màu hồng • Bấm lại nút Bút bôi để tắt về Con trỏ'}
              {toolMode === 'eraser' && '🧹 Chế độ Tẩy: Click vào chữ đã bôi để xóa'}
            </div>
          </div>

          {/* Action Bar under Passage: Audio & Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex flex-wrap items-center gap-2">
              {/* TTS Listen Button */}
              <button
                onClick={handleSpeakPassage}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all ${
                  speech.isSpeaking && speech.currentText === passage.jp_text
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-amber-600 text-white hover:bg-amber-700'
                }`}
                title="Nghe máy đọc mẫu đoạn văn (Phím Space)"
              >
                {speech.isSpeaking && speech.currentText === passage.jp_text ? (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span>Dừng đọc</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span>Nghe đọc mẫu ({speed}x)</span>
                  </>
                )}
              </button>

              {/* In-place Speed Selector */}
              {setSpeed && (
                <div className="flex items-center bg-white p-0.5 rounded-xl border border-slate-200 shadow-2xs">
                  {[0.5, 0.75, 1.0, 1.25].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSpeed(s)}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                        speed === s
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                      title={`Tốc độ đọc ${s}x`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Smart Expand Toggles: Dịch nghĩa, Từ đã bôi, Kanji Bài 8-11 & Câu hỏi đọc hiểu */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Nút Kiểm tra từ đã bôi (2 Tầng: Tài liệu trước - AI sau) */}
              <button
                onClick={() => setShowHighlightedWords(!showHighlightedWords)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  showHighlightedWords
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : processedHighlightedItems.length > 0
                    ? 'bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100 font-bold'
                    : 'bg-white text-slate-400 border-slate-200 opacity-60'
                }`}
                title="Kiểm tra các từ đã bôi đánh dấu (Tài liệu trước - AI sau)"
              >
                <Highlighter className="w-3.5 h-3.5" />
                <span>Kiểm tra từ đã bôi ({processedHighlightedItems.length})</span>
              </button>

              {/* Nút Hiện / Ẩn Dịch nghĩa */}
              <button
                onClick={() => setShowViText(!showViText)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  showViText
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{showViText ? 'Ẩn dịch' : 'Hiện dịch nghĩa'}</span>
              </button>

              {/* Nút Kanji Bài 8-11 */}
              <button
                onClick={() => setShowKanjiCheck(!showKanjiCheck)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  showKanjiCheck
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
                }`}
                title="Kiểm tra cách đọc các chữ Hán Bài 8 – Bài 11 trong bài"
              >
                <span>🈷️</span>
                <span>{showKanjiCheck ? 'Ẩn Kanji' : `Kanji Bài 8–11 (${passage.kanji_check?.length || 0})`}</span>
              </button>

              {/* Nút Câu hỏi đọc hiểu */}
              <button
                onClick={() => setShowQuestions(!showQuestions)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  showQuestions
                    ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                    : 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showQuestions ? 'Ẩn phần nghe' : 'Nghe giám khảo hỏi'}</span>
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* KHU VỰC: KIỂM TRA TỪ ĐÃ BÔI (2 TẦNG: TÀI LIỆU TRƯỚC - AI SAU) */}
          {/* ========================================================= */}
          {showHighlightedWords && (
            <div className="p-5 rounded-3xl bg-gradient-to-br from-rose-50/70 via-indigo-50/30 to-slate-50 border-2 border-rose-200/90 space-y-4 animate-fadeIn shadow-xs">
              
              {/* Header của khu vực kiểm tra */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-200/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-500 text-white shadow-xs">
                    <Highlighter className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                      Kiểm tra cách đọc & Dịch nghĩa các từ đã bôi
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Nguyên tắc: <b>Ưu tiên tra cứu tài liệu trước</b> • Từ/câu ngoài tài liệu dùng <b>Trợ lý AI</b>
                    </p>
                  </div>
                </div>

                {/* Các nút tác vụ đầu bảng */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Nút Dịch tất cả từ ngoài tài liệu */}
                  {unTranslatedCount > 0 && (
                    <button
                      onClick={handleTranslateAllExternal}
                      disabled={isTranslatingAll}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50"
                      title="Gửi tất cả các từ ngoài giáo trình đến AI để dịch cùng lúc"
                    >
                      {isTranslatingAll ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang dịch...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>✨ Dịch tất cả từ ngoài tài liệu ({unTranslatedCount})</span>
                        </>
                      )}
                    </button>
                  )}

                  {highlights.length > 0 && (
                    <button
                      onClick={handleClearAllHighlights}
                      className="px-2.5 py-1 text-xs text-rose-700 hover:text-rose-900 hover:bg-rose-100/80 rounded-xl border border-rose-200/80 transition-colors flex items-center gap-1"
                      title="Xóa hết toàn bộ vết bôi đánh dấu"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa hết bôi</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Thông báo lỗi AI nếu có */}
              {aiError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center justify-between gap-2">
                  <span>{aiError}</span>
                  {onOpenAiSettings && (
                    <button 
                      onClick={onOpenAiSettings}
                      className="font-bold underline text-indigo-600 shrink-0"
                    >
                      Cài đặt AI
                    </button>
                  )}
                </div>
              )}

              {/* Danh sách các thẻ từ vựng đã bôi */}
              {processedHighlightedItems.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs sm:text-sm space-y-1.5 bg-white/60 rounded-2xl border border-dashed border-slate-200">
                  <p className="font-bold text-slate-700">Bạn chưa bôi đen từ nào trong bài đọc này.</p>
                  <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                    Kéo chuột hoặc quét tay bôi đen bất kỳ từ hoặc cụm câu nào trong bài đọc. Khi đọc xong, bấm vào đây để tra cứu và dịch ngay!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {processedHighlightedItems.map((item, idx) => {
                    const isSavedFlashcard = savedFlashcards.has(item.cleanWord);

                    return (
                      <div 
                        key={idx}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-start space-y-2.5 bg-white shadow-2xs ${
                          item.isLocal 
                            ? 'border-emerald-200 hover:border-emerald-300' 
                            : 'border-amber-200 hover:border-amber-300'
                        }`}
                      >
                        {/* Header Thẻ: Nhãn Tầng 1 / Tầng 2 & Nút Đã nhớ */}
                        <div className="flex items-center justify-between gap-2">
                          {item.isLocal ? (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <span>📚 Trong tài liệu</span>
                              {item.source && <span className="opacity-70">({item.source})</span>}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                              <span>⚠️ Ngoài tài liệu</span>
                            </span>
                          )}

                          <button
                            onClick={() => handleRememberWord(item.rawText)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 border border-slate-200 transition-colors"
                            title="Xóa vết bôi của từ này khi đã thuộc"
                          >
                            <Check className="w-3 h-3" />
                            <span>Đã nhớ</span>
                          </button>
                        </div>

                        {/* Thân Thẻ: Từ Kanji / Cụm từ */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xl sm:text-2xl font-black text-slate-900 font-japanese tracking-wide">
                              {item.cleanWord}
                            </span>
                            <button
                              onClick={() => speech.speak(item.reading || item.aiData?.reading || item.cleanWord, speed)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Nghe phát âm"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* TẦNG 1: Dữ liệu Kanji chi tiết */}
                          {item.isLocal && item.isKanji && (
                            <div className="space-y-1.5 pt-1 border-t border-slate-100 text-xs">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {item.han_viet && (
                                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-md text-[11px] border border-indigo-100">
                                    Hán Việt: {item.han_viet}
                                  </span>
                                )}
                                {item.lesson && (
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded-md text-[10px]">
                                    Bài {item.lesson}
                                  </span>
                                )}
                              </div>

                              <div className="space-y-0.5 text-slate-700">
                                {item.kun_reading && item.kun_reading !== '—' && (
                                  <p className="text-[11px]">
                                    <span className="font-semibold text-slate-500">Âm Kun:</span>{' '}
                                    <span className="font-bold text-indigo-600 font-japanese">{item.kun_reading}</span>
                                  </p>
                                )}
                                {item.on_reading && item.on_reading !== '—' && (
                                  <p className="text-[11px]">
                                    <span className="font-semibold text-slate-500">Âm On:</span>{' '}
                                    <span className="font-bold text-amber-700 font-japanese">{item.on_reading}</span>
                                  </p>
                                )}
                                <p className="text-xs font-bold text-slate-900 pt-0.5">
                                  <span className="font-semibold text-slate-500">Nghĩa:</span> {item.meaning}
                                </p>
                              </div>

                              {item.examples && item.examples.length > 0 && (
                                <div className="pt-1 border-t border-slate-100">
                                  <p className="text-[10px] font-semibold text-slate-400 mb-1">Ví dụ liên quan:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {item.examples.slice(0, 4).map((ex, eIdx) => (
                                      <span 
                                        key={eIdx}
                                        className="px-1.5 py-0.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 rounded text-[10px] text-slate-700 font-japanese transition-colors"
                                        title={`${ex.word} (${ex.reading}): ${ex.meaning || item.meaning}`}
                                      >
                                        <span className="font-bold">{ex.word}</span>
                                        {ex.reading && ex.reading !== ex.word && <span className="text-slate-500 ml-0.5">({ex.reading})</span>}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* TẦNG 1: Dữ liệu từ vựng thông thường */}
                          {item.isLocal && !item.isKanji && (
                            <div className="space-y-1 pt-1 border-t border-slate-100">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-indigo-600 font-japanese">
                                  Cách đọc: {item.reading}
                                </p>
                                {item.han_viet && (
                                  <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-800 rounded font-semibold text-[10px]">
                                    {item.han_viet}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-medium text-slate-700 leading-snug">
                                {item.meaning}
                              </p>
                            </div>
                          )}

                          {/* TẦNG 2: Chưa dịch bằng AI */}
                          {!item.isLocal && !item.aiData && (
                            <div className="pt-1.5">
                              <button
                                onClick={() => handleTranslateSingleItem(item.cleanWord)}
                                disabled={item.isTranslating}
                                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50"
                              >
                                {item.isTranslating ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>AI đang dịch...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                    <span>✨ Dịch & Phân tích bằng AI</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          {/* TẦNG 2: Đã dịch bằng AI */}
                          {!item.isLocal && item.aiData && (
                            <div className="space-y-1.5 pt-1.5 border-t border-slate-100 text-xs animate-fadeIn">
                              <div className="flex items-center justify-between">
                                <p className="font-bold text-indigo-600 font-japanese">
                                  {item.aiData.reading}
                                </p>
                                {item.aiData.han_viet && (
                                  <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-800 rounded font-semibold text-[10px]">
                                    {item.aiData.han_viet}
                                  </span>
                                )}
                              </div>

                              <p className="font-bold text-slate-800 leading-snug">
                                {item.aiData.meaning_vi}
                              </p>

                              {item.aiData.grammar_notes && (
                                <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100 leading-relaxed">
                                  💡 {item.aiData.grammar_notes}
                                </p>
                              )}

                              {/* Nút Lưu vào Flashcard */}
                              <div className="pt-1 flex justify-end">
                                <button
                                  onClick={() => handleSaveToFlashcard(item.cleanWord, item.aiData)}
                                  disabled={isSavedFlashcard}
                                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                    isSavedFlashcard
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                                  }`}
                                >
                                  {isSavedFlashcard ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-600" />
                                      <span>Đã lưu vào Flashcard</span>
                                    </>
                                  ) : (
                                    <>
                                      <BookmarkPlus className="w-3 h-3" />
                                      <span>+ Lưu vào Flashcard</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Vietnamese Translation (Hidden by default) */}
          {showViText && (
            <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2 animate-fadeIn">
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider block">
                Bản dịch đối chiếu:
              </span>
              <p className="text-sm sm:text-base text-indigo-950 leading-relaxed font-sans">
                {passage.vi_text}
              </p>
            </div>
          )}

          {/* Kanji Check Section (Hidden by default) */}
          {showKanjiCheck && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50/70 via-indigo-50/40 to-purple-50/50 border border-purple-200 space-y-3.5 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-200/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🈷️</span>
                  <div>
                    <h3 className="font-bold text-purple-950 text-sm sm:text-base leading-tight">
                      Kiểm tra cách đọc chữ Hán Bài 8 – Bài 11
                    </h3>
                    <p className="text-[11px] text-purple-800/80">
                      Có <b>{passage.kanji_check?.length || 0} từ</b> trong bài đọc này không có Furigana
                    </p>
                  </div>
                </div>
                <span className="text-xs text-purple-700 font-medium hidden sm:inline">
                  *Bấm icon loa 🔊 để nghe phát âm từng từ
                </span>
              </div>

              {/* Grid of Kanji Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {passage.kanji_check?.map((item, idx) => (
                  <div 
                    key={idx}
                    className="bg-white p-3 rounded-2xl border border-purple-100 shadow-2xs hover:shadow-xs hover:border-purple-300 transition-all flex flex-col justify-between space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        item.lesson === 'Bài 8' ? 'bg-indigo-100 text-indigo-700' :
                        item.lesson === 'Bài 9' ? 'bg-emerald-100 text-emerald-700' :
                        item.lesson === 'Bài 10' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {item.lesson}
                      </span>
                      <button
                        onClick={() => speech.speak(item.reading || item.word, speed)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                        title="Nghe phát âm từ này"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <div className="text-xl sm:text-2xl font-black text-slate-900 font-sans tracking-wide">
                        {item.word}
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-purple-700 font-mono mt-0.5">
                        {item.reading}
                      </div>
                    </div>

                    <div className="text-[11px] font-medium text-slate-600 truncate border-t border-slate-100 pt-1.5" title={item.meaning}>
                      {item.meaning}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reading comprehension questions are audio-only, including after answers are revealed. */}
          {showQuestions && (
            <div className="space-y-4 pt-2 border-t border-slate-200 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-ping" />
                  <h3 className="font-bold text-slate-900 text-base">
                    Nghe câu hỏi đọc hiểu ({passage.questions.length} câu)
                  </h3>
                </div>
                <span className="text-xs text-slate-500 italic">
                  *Tự trả lời thành tiếng trước khi xem gợi ý
                </span>
              </div>

              <div className="space-y-3">
                {passage.questions.map((q, idx) => {
                  const isRevealed = revealedAnswers[idx];

                  return (
                    <div 
                      key={idx}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3"
                    >
                      {/* Question row: audio only */}
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleSpeakQuestion(q.q_jp)}
                          className="p-2 rounded-xl bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors shrink-0"
                          title={`Nghe câu hỏi ${idx + 1}`}
                          aria-label={`Nghe câu hỏi ${idx + 1}`}
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>

                        <span className="flex-1 text-sm font-bold text-amber-700">Câu hỏi {idx + 1} · chỉ nghe âm thanh</span>

                        {/* Toggle Reveal Answer Button */}
                        <button
                          onClick={() => toggleRevealAnswer(idx)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                            isRevealed
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span>{isRevealed ? 'Ẩn đáp án' : 'Xem đáp án'}</span>
                          {isRevealed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Revealed model answer */}
                      {isRevealed && (
                        <div className="ml-11 pt-3 border-t border-slate-200 space-y-2 animate-fadeIn">
                          {/* Suggested Model Answer */}
                          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-2.5">
                            <button
                              onClick={() => handleSpeakAnswer(q.a_jp)}
                              className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors shrink-0"
                              title="Nghe câu trả lời mẫu"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-emerald-800 block">
                                → Gợi ý trả lời:
                              </span>
                              <div className="text-sm sm:text-base font-medium text-emerald-950 font-sans">
                                {renderJapaneseWithFurigana(q.a_jp, showFurigana)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
