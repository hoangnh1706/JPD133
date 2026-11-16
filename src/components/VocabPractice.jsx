import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BookOpen, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  ChevronLeft, 
  ChevronRight, 
  Shuffle, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Sparkles, 
  Award, 
  RefreshCcw, 
  BookmarkCheck, 
  HelpCircle,
  Eye,
  EyeOff,
  Filter,
  Check,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import vocabData from '../data/vocabulary_b1_11.json';
import exercisesData from '../data/vocab_exercises.json';
import { getCustomVocab } from '../utils/aiService';

const VOCAB_STATUS_KEY = 'jpd133_vocab_status_v1';

export default function VocabPractice({ showFurigana, speech, speed, setSpeed }) {
  // Chế độ: 'flashcard' | 'exercise'
  const [subMode, setSubMode] = useState('flashcard');
  const [selectedLesson, setSelectedLesson] = useState('all'); // 'all' | 'custom' | 1..11
  const [searchQuery, setSearchQuery] = useState('');
  const [filterReviewOnly, setFilterReviewOnly] = useState(false);
  const [customVocab, setCustomVocab] = useState([]);

  // Nạp từ vựng tự thêm từ AI (localStorage)
  useEffect(() => {
    setCustomVocab(getCustomVocab());
  }, []);

  // Trạng thái từ vựng (đã nhớ / cần ôn): { [wordId]: 'mastered' | 'review' }
  const [vocabStatus, setVocabStatus] = useState(() => {
    try {
      const saved = localStorage.getItem(VOCAB_STATUS_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Lưu trạng thái vào localStorage
  useEffect(() => {
    try {
      localStorage.setItem(VOCAB_STATUS_KEY, JSON.stringify(vocabStatus));
    } catch (e) {
      console.error(e);
    }
  }, [vocabStatus]);

  // ==========================================
  // FLASHCARD STATE
  // ==========================================
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardShowFurigana, setCardShowFurigana] = useState(showFurigana);

  useEffect(() => {
    setCardShowFurigana(showFurigana);
  }, [showFurigana]);

  // Lọc danh sách từ vựng theo Lesson, Search, Review Filter
  const filteredVocab = useMemo(() => {
    let list = vocabData;

    if (selectedLesson === 'custom') {
      list = customVocab;
    } else if (selectedLesson === 'all') {
      list = [...customVocab, ...vocabData];
    } else {
      const lessonNum = Number(selectedLesson);
      list = list.filter(item => item.lesson === lessonNum);
    }

    if (filterReviewOnly) {
      list = list.filter(item => vocabStatus[item.id] === 'review');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item => 
        (item.word_jp && item.word_jp.toLowerCase().includes(q)) ||
        (item.reading && item.reading.toLowerCase().includes(q)) ||
        (item.meaning_vi && item.meaning_vi.toLowerCase().includes(q)) ||
        (item.han_viet && item.han_viet.toLowerCase().includes(q)) ||
        (item.topic && item.topic.toLowerCase().includes(q))
      );
    }

    return list;
  }, [selectedLesson, filterReviewOnly, searchQuery, vocabStatus, customVocab]);

  // Reset index khi danh sách thay đổi
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [selectedLesson, filterReviewOnly, searchQuery]);

  const currentWord = filteredVocab[currentIndex] || null;

  const handleNextCard = () => {
    if (filteredVocab.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % filteredVocab.length);
  };

  const handlePrevCard = () => {
    if (filteredVocab.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + filteredVocab.length) % filteredVocab.length);
  };

  const handleShuffle = () => {
    if (filteredVocab.length <= 1) return;
    setIsFlipped(false);
    let rand = Math.floor(Math.random() * filteredVocab.length);
    if (rand === currentIndex) {
      rand = (rand + 1) % filteredVocab.length;
    }
    setCurrentIndex(rand);
  };

  const handleToggleStatus = (id, newStatus) => {
    setVocabStatus(prev => {
      const current = prev[id];
      if (current === newStatus) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: newStatus };
    });
  };

  // Keyboard navigation for Flashcard
  useEffect(() => {
    if (subMode !== 'flashcard') return;

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextCard();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevCard();
      } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.key.toLowerCase() === 's' && currentWord) {
        e.preventDefault();
        speech.speak(currentWord.reading || currentWord.word_jp, speed);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [subMode, filteredVocab.length, currentIndex, currentWord, speed, speech]);

  // ==========================================
  // EXERCISES STATE
  // ==========================================
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [userScore, setUserScore] = useState({ correct: 0, wrong: 0 });
  const [wrongAnswersList, setWrongAnswersList] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [onlyWrongMode, setOnlyWrongMode] = useState(false);

  // Lọc bài tập
  const filteredExercises = useMemo(() => {
    let list = exercisesData;
    if (onlyWrongMode) {
      list = wrongAnswersList;
    } else if (selectedLesson !== 'all') {
      const lessonNum = Number(selectedLesson);
      list = list.filter(item => item.lesson === lessonNum);
    }
    return list;
  }, [selectedLesson, onlyWrongMode, wrongAnswersList]);

  const currentExercise = filteredExercises[exerciseIndex] || null;

  // Reset exercise state khi đổi bài
  useEffect(() => {
    setExerciseIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setUserScore({ correct: 0, wrong: 0 });
    setIsCompleted(false);
  }, [selectedLesson, onlyWrongMode]);

  const handleSelectOption = (option) => {
    if (isAnswered || !currentExercise) return;
    setSelectedAnswer(option);
    setIsAnswered(true);

    const isCorrect = option === currentExercise.correct_answer;
    if (isCorrect) {
      setUserScore(prev => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setUserScore(prev => ({ ...prev, wrong: prev.wrong + 1 }));
      setWrongAnswersList(prev => {
        if (!prev.some(x => x.id === currentExercise.id)) {
          return [...prev, currentExercise];
        }
        return prev;
      });
    }
  };

  const handleNextExercise = () => {
    if (exerciseIndex + 1 < filteredExercises.length) {
      setExerciseIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setIsCompleted(true);
      if (userScore.correct + 1 >= filteredExercises.length * 0.7) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    }
  };

  const handleRestartExercises = () => {
    setExerciseIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setUserScore({ correct: 0, wrong: 0 });
    setIsCompleted(false);
    setOnlyWrongMode(false);
  };

  const handleRetryWrongExercises = () => {
    if (wrongAnswersList.length === 0) return;
    setOnlyWrongMode(true);
    setExerciseIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setUserScore({ correct: 0, wrong: 0 });
    setIsCompleted(false);
  };

  // Thống kê tổng số từ đã ôn
  const masteredCount = Object.values(vocabStatus).filter(v => v === 'mastered').length;
  const reviewCount = Object.values(vocabStatus).filter(v => v === 'review').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Controller Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        
        {/* Mode Switcher & Global Stats */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80">
            <button
              onClick={() => setSubMode('flashcard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                subMode === 'flashcard'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <RotateCw className="w-4 h-4" />
              <span>🃏 Flashcard Từ Vựng</span>
            </button>

            <button
              onClick={() => setSubMode('exercise')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                subMode === 'exercise'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>✍️ Bài Tập Thực Hành</span>
            </button>
          </div>

          {/* Quick Info & Stats */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đã nhớ: {masteredCount}</span>
            </span>
            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Cần ôn: {reviewCount}</span>
            </span>
          </div>
        </div>

        {/* Filter Bar: Lesson Selector & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Lesson Scroll Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
            <button
              onClick={() => setSelectedLesson('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedLesson === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tất cả (Bài 1–11)
            </button>
            {/* Nút lọc từ tự thêm từ AI */}
            {customVocab.length > 0 && (
              <button
                onClick={() => setSelectedLesson('custom')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                  selectedLesson === 'custom'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
                }`}
                title="Các từ vựng đã lưu từ Trợ lý Dịch AI"
              >
                <span>✨ Tự thêm ({customVocab.length})</span>
              </button>
            )}

            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num) => (
              <button
                key={num}
                onClick={() => setSelectedLesson(String(num))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedLesson === String(num)
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Bài {num}
              </button>
            ))}
          </div>

          {/* Search Box & Review Filter (Chỉ hiện khi ở tab Flashcard) */}
          {subMode === 'flashcard' && (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm Kanji, Kana, Tiếng Việt..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                onClick={() => setFilterReviewOnly(!filterReviewOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  filterReviewOnly
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
                title="Lọc chỉ những từ cần ôn lại"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Từ cần ôn</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* CHẾ ĐỘ 1: FLASHCARD ÔN TẬP NHANH                          */}
      {/* ========================================================= */}
      {subMode === 'flashcard' && (
        <div className="space-y-4">
          {filteredVocab.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-3">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Không tìm thấy từ vựng phù hợp</h3>
              <p className="text-xs text-slate-500">
                Hãy thử đổi bài học, xóa từ khóa tìm kiếm hoặc tắt bộ lọc "Từ cần ôn".
              </p>
              <button
                onClick={() => {
                  setSelectedLesson('all');
                  setSearchQuery('');
                  setFilterReviewOnly(false);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
              >
                Xem tất cả 740 từ vựng
              </button>
            </div>
          ) : (
            <>
              {/* Flashcard Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200/90 text-xs">
                
                {/* Navigation Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePrevCard}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                    title="Từ trước (Phím ←)"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Trước</span>
                  </button>

                  <span className="px-2.5 py-1 font-bold text-slate-700 bg-slate-100 rounded-lg">
                    {currentIndex + 1} / {filteredVocab.length}
                  </span>

                  <button
                    onClick={handleNextCard}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                    title="Từ sau (Phím →)"
                  >
                    <span className="hidden sm:inline">Sau</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleShuffle}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600"
                    title="Xáo trộn từ ngẫu nhiên"
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>
                </div>

                {/* Furigana Toggle & In-place Speed */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCardShowFurigana(!cardShowFurigana)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-semibold border ${
                      cardShowFurigana 
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {cardShowFurigana ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>Furigana</span>
                  </button>

                  {/* Tốc độ đọc nhanh */}
                  {setSpeed && (
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
                      {[0.5, 0.75, 1.0, 1.25].map((s) => (
                        <button
                          key={s}
                          onClick={() => setSpeed(s)}
                          className={`px-1.5 py-0.5 rounded-lg text-xs font-bold transition-all ${
                            speed === s
                              ? 'bg-white text-indigo-700 shadow-2xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                          title={`Tốc độ đọc ${s}x`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Main 3D Interactive Flashcard */}
              <div 
                onClick={() => setIsFlipped(!isFlipped)}
                className="relative min-h-[320px] sm:min-h-[360px] bg-gradient-to-br from-white via-indigo-50/20 to-slate-50 rounded-3xl border-2 border-indigo-100/90 shadow-md p-6 sm:p-10 flex flex-col justify-between cursor-pointer hover:border-indigo-300 transition-all select-none group"
              >
                {/* Top Badge: Lesson & Topic */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-3 py-1 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-2xs">
                    Bài {currentWord.lesson}
                  </span>
                  <span className="text-xs text-slate-500 font-medium truncate max-w-[240px] sm:max-w-md">
                    {currentWord.topic}
                  </span>
                  <span className="text-xs text-indigo-500 font-semibold flex items-center gap-1 group-hover:scale-105 transition-transform">
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>{isFlipped ? 'Xem mặt trước' : 'Bấm để lật thẻ'}</span>
                  </span>
                </div>

                {/* Center Content: Front (Japanese) or Back (Meaning & Example) */}
                <div className="my-auto text-center space-y-4 py-4">
                  {!isFlipped ? (
                    // MẶT TRƯỚC: Tiếng Nhật
                    <div className="space-y-3">
                      {cardShowFurigana && currentWord.reading && currentWord.reading !== currentWord.word_jp && (
                        <p className="text-sm sm:text-base font-bold text-indigo-500 animate-fadeIn">
                          {currentWord.reading}
                        </p>
                      )}
                      <h2 className="text-3xl sm:text-5xl font-black text-slate-800 tracking-wide font-japanese">
                        {currentWord.word_jp}
                      </h2>
                      <p className="text-xs text-slate-400 italic">
                        (Nhấn phím Space hoặc bấm vào thẻ để xem nghĩa)
                      </p>
                    </div>
                  ) : (
                    // MẶT SAU: Phiên âm + Nghĩa tiếng Việt + Ví dụ
                    <div className="space-y-4 animate-fadeIn">
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-2">
                          <p className="text-base sm:text-lg font-bold text-indigo-600 font-japanese">
                            {currentWord.reading || currentWord.word_jp}
                          </p>
                          {currentWord.han_viet && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-lg text-xs font-bold font-sans">
                              Âm Hán: {currentWord.han_viet}
                            </span>
                          )}
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-black text-slate-800">
                          {currentWord.meaning_vi}
                        </h3>
                      </div>

                      {/* Câu ví dụ nếu có */}
                      {currentWord.example_jp && (
                        <div className="p-3.5 bg-indigo-50/80 border border-indigo-100 rounded-2xl max-w-lg mx-auto text-left space-y-1.5">
                          <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Ví dụ minh họa:</p>
                          <p className="text-sm font-bold text-slate-800 font-japanese">{currentWord.example_jp}</p>
                          {currentWord.example_vi && (
                            <p className="text-xs text-slate-600">{currentWord.example_vi}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Card Controls: Speaker & Mastery Status */}
                <div 
                  onClick={(e) => e.stopPropagation()} 
                  className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100"
                >
                  {/* Speaker Button */}
                  <button
                    onClick={() => speech.speak(currentWord.reading || currentWord.word_jp, speed)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-100/80 hover:bg-indigo-200 text-indigo-800 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-2xs"
                    title="Nghe phát âm (Phím S)"
                  >
                    <Volume2 className="w-4 h-4 text-indigo-600" />
                    <span>Phát âm ({speed}x)</span>
                  </button>

                  {/* Status Toggle Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(currentWord.id, 'review')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        vocabStatus[currentWord.id] === 'review'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>Cần ôn lại</span>
                    </button>

                    <button
                      onClick={() => handleToggleStatus(currentWord.id, 'mastered')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        vocabStatus[currentWord.id] === 'mastered'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Đã nhớ</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Keyboard Shortcuts Hint */}
              <p className="text-center text-xs text-slate-400">
                💡 Phím tắt: <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px]">Space</kbd> Lật thẻ • <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px]">←</kbd> <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px]">→</kbd> Chuyển từ • <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px]">S</kbd> Nghe phát âm
              </p>
            </>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* CHẾ ĐỘ 2: BÀI TẬP THỰC HÀNH TƯƠNG TÁC                     */}
      {/* ========================================================= */}
      {subMode === 'exercise' && (
        <div className="space-y-4">
          {filteredExercises.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-3">
              <Award className="w-12 h-12 text-indigo-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Không có bài tập cho bài này</h3>
              <p className="text-xs text-slate-500">
                Hãy chọn một bài học khác từ thanh chọn phía trên hoặc chọn "Tất cả (Bài 1–11)".
              </p>
            </div>
          ) : isCompleted ? (
            // MÀN HÌNH TỔNG KẾT KẾT QUẢ
            <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200 space-y-6 shadow-sm">
              <div className="w-20 h-20 bg-indigo-50 border border-indigo-200 rounded-3xl flex items-center justify-center mx-auto text-indigo-600">
                <Award className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-800">
                  Hoàn Thành Bài Tập!
                </h2>
                <p className="text-sm text-slate-500">
                  {onlyWrongMode ? 'Bạn đã làm lại các câu bị sai' : `Kết quả ôn tập: Bài ${selectedLesson === 'all' ? '1–11' : selectedLesson}`}
                </p>
              </div>

              {/* Score Display */}
              <div className="flex justify-center gap-6">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl min-w-[120px]">
                  <p className="text-xs font-bold text-emerald-600 uppercase">Đúng</p>
                  <p className="text-3xl font-black text-emerald-700">{userScore.correct}</p>
                </div>
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl min-w-[120px]">
                  <p className="text-xs font-bold text-rose-600 uppercase">Sai</p>
                  <p className="text-3xl font-black text-rose-700">{userScore.wrong}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center gap-3 pt-4">
                <button
                  onClick={handleRestartExercises}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 shadow-md transition-all"
                >
                  <RefreshCcw className="w-4 h-4" />
                  <span>Làm lại từ đầu</span>
                </button>

                {wrongAnswersList.length > 0 && !onlyWrongMode && (
                  <button
                    onClick={handleRetryWrongExercises}
                    className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl text-sm font-bold hover:bg-rose-100 transition-all"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>Làm lại {wrongAnswersList.length} câu sai</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            // GIAO DIỆN LÀM BÀI TẬP HIỆN TẠI
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
              
              {/* Question Header & Progress Bar */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-indigo-600 text-white rounded-xl font-bold shadow-2xs">
                      Bài {currentExercise.lesson}
                    </span>
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-xl font-semibold">
                      {currentExercise.title}
                    </span>
                  </div>
                  <span className="font-bold text-slate-600">
                    Câu {exerciseIndex + 1} / {filteredExercises.length}
                  </span>
                </div>

                {/* Progress Line */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full transition-all duration-300"
                    style={{ width: `${((exerciseIndex + 1) / filteredExercises.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question Prompt */}
              <div className="p-5 sm:p-7 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                <p className="text-base sm:text-xl font-bold text-slate-800 leading-relaxed font-japanese whitespace-pre-line">
                  {currentExercise.question}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <HelpCircle className="w-4 h-4" />
                  <span>Chọn 1 trong các phương án bên dưới để điền vào chỗ trống</span>
                </div>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentExercise.options.map((option, idx) => {
                  const isChosen = selectedAnswer === option;
                  const isCorrect = option === currentExercise.correct_answer;

                  let btnStyle = 'bg-white border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 text-slate-800';

                  if (isAnswered) {
                    if (isCorrect) {
                      btnStyle = 'bg-emerald-500 text-white border-emerald-500 shadow-sm font-bold';
                    } else if (isChosen && !isCorrect) {
                      btnStyle = 'bg-rose-500 text-white border-rose-500 shadow-sm line-through';
                    } else {
                      btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(option)}
                      className={`p-4 rounded-2xl border-2 text-left font-japanese font-bold text-base transition-all flex items-center justify-between ${btnStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-slate-100/80 flex items-center justify-center text-xs text-slate-600 font-sans">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{option}</span>
                      </div>
                      {isAnswered && isCorrect && <Check className="w-5 h-5 text-white" />}
                      {isAnswered && isChosen && !isCorrect && <X className="w-5 h-5 text-white" />}
                    </button>
                  );
                })}
              </div>

              {/* Explanation & Speaker after Answer */}
              {isAnswered && (
                <div className="p-4 sm:p-5 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3 animate-fadeIn">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Giải thích chi tiết</span>
                    </span>

                    {/* Speaker Button for full sentence */}
                    <button
                      onClick={() => speech.speak(currentExercise.full_sentence_jp, speed)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-2xs"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Nghe câu mẫu ({speed}x)</span>
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {currentExercise.explanation}
                  </p>

                  <div className="pt-2 border-t border-indigo-100 flex justify-end">
                    <button
                      onClick={handleNextExercise}
                      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all"
                    >
                      <span>{exerciseIndex + 1 === filteredExercises.length ? 'Xem kết quả' : 'Câu tiếp theo'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
