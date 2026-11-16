import React, { useState, useEffect } from 'react';
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
  Sparkles,
  BookOpen,
  HelpCircle,
  MessageSquareQuote,
  Lightbulb
} from 'lucide-react';
import { renderJapaneseWithFurigana } from '../utils/japanese';

export default function NoImagePracticeCard({
  question,
  totalCount,
  onPrev,
  onNext,
  onRandom,
  onStatusChange,
  status,
  showFurigana,
  speech,
  speed,
  setSpeed
}) {
  // Trạng thái ẩn/hiện thông minh
  // Mặc định khi chuyển câu: Ẩn chữ câu hỏi (để luyện nghe chay), ẩn dịch VI, ẩn ngữ pháp, ẩn đáp án
  const [showQuestionText, setShowQuestionText] = useState(false);
  const [showVietnamese, setShowVietnamese] = useState(false);
  const [showGrammar, setShowGrammar] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  // Khi question thay đổi, reset lại trạng thái ẩn/hiện và dừng TTS
  useEffect(() => {
    setShowQuestionText(false);
    setShowVietnamese(false);
    setShowGrammar(false);
    setShowAnswer(false);
    speech.stop();
  }, [question.id]);

  const toggleAll = (show) => {
    setShowQuestionText(show);
    setShowVietnamese(show);
    setShowGrammar(show);
    setShowAnswer(show);
  };

  const isAllShowing = showQuestionText && showVietnamese && showGrammar && showAnswer;

  const handleSpeakQuestion = () => {
    if (speech.isSpeaking) {
      speech.stop();
    } else {
      speech.speak(question.q_jp, speed);
    }
  };

  const speeds = [0.5, 0.75, 1.0, 1.25];
  const handleCycleSpeed = (e) => {
    e.stopPropagation();
    if (!setSpeed) return;
    const currentIdx = speeds.indexOf(speed);
    const nextIdx = currentIdx === -1 ? 2 : (currentIdx + 1) % speeds.length;
    setSpeed(speeds[nextIdx]);
  };

  const handleSpeakAnswer = () => {
    if (speech.isSpeaking && speech.currentText === question.a_jp) {
      speech.stop();
    } else {
      speech.speak(question.a_jp, speed);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Top Action Bar: Navigation & Quick Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs">
        
        {/* Navigation buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onPrev}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium transition-colors"
            title="Câu trước (Phím ←)"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Trước</span>
          </button>

          <span className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 rounded-lg">
            Câu {question.id} / {totalCount}
          </span>

          <button
            onClick={onNext}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium transition-colors"
            title="Câu sau (Phím →)"
          >
            <span className="hidden sm:inline">Sau</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={onRandom}
            className="p-2 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors ml-1"
            title="Câu ngẫu nhiên"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>

        {/* Status markers: Đã thuộc / Cần ôn lại */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onStatusChange(question.id, status === 'review' ? 'unseen' : 'review')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              status === 'review'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            <span>Cần ôn lại</span>
          </button>

          <button
            onClick={() => onStatusChange(question.id, status === 'mastered' ? 'unseen' : 'mastered')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              status === 'mastered'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Đã thuộc</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        
        {/* Card Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-50 via-teal-50/30 to-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 bg-teal-600 text-white text-xs font-bold rounded-lg shadow-xs">
              Bài {question.lesson}
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-800">
              Câu hỏi phản xạ #{question.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">Chủ điểm:</span>
            <span className="px-3 py-1 bg-white text-teal-900 border border-teal-100 rounded-xl text-xs sm:text-sm font-semibold shadow-2xs">
              {question.grammar}
            </span>
          </div>
        </div>

        {/* Card Body: Reflex Question Box */}
        <div className="p-5 sm:p-7 space-y-6">
          
          {/* Central Reflex Box (Thay cho khung ảnh) */}
          <div className="relative bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-800 flex flex-col items-center justify-center min-h-[220px] sm:min-h-[260px] text-center space-y-4">
            
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              <MessageSquareQuote className="w-4 h-4" />
              <span>Phản xạ Vấn đáp trực tiếp (Không nhìn tranh)</span>
            </div>

            {/* Japanese Question Text */}
            <div className="max-w-2xl min-h-[64px] flex items-center justify-center">
              {showQuestionText ? (
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold leading-relaxed text-slate-50 tracking-wide font-sans animate-fadeIn">
                  {renderJapaneseWithFurigana(question.q_jp, showFurigana)}
                </h3>
              ) : (
                <div className="space-y-1 text-slate-400">
                  <p className="text-base sm:text-lg font-medium italic">
                    🎧 Nội dung câu hỏi đang ẩn để bạn luyện nghe chay
                  </p>
                  <p className="text-xs text-indigo-300">
                    Bấm nút "Nghe câu hỏi" bên dưới để nghe giảng viên hỏi
                  </p>
                </div>
              )}
            </div>

            {/* Vietnamese Translation inside box if active */}
            {showVietnamese && (
              <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl text-xs sm:text-sm text-indigo-100 max-w-xl border border-white/10">
                <b>Dịch nghĩa:</b> {question.q_vi}
              </div>
            )}
          </div>

          {/* Quick Listening & Visibility Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-teal-50/70 border border-teal-100 rounded-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex rounded-xl shadow-xs overflow-hidden border border-teal-600">
                <button
                  onClick={handleSpeakQuestion}
                  className={`flex items-center gap-2 px-3.5 py-2 font-bold text-xs sm:text-sm transition-all ${
                    speech.isSpeaking
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-teal-600 text-white hover:bg-teal-700'
                  }`}
                  title="Nghe máy đọc câu hỏi (Phím Space)"
                >
                  {speech.isSpeaking ? (
                    <>
                      <VolumeX className="w-4 h-4" />
                      <span>Dừng đọc</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" />
                      <span>Nghe câu hỏi</span>
                    </>
                  )}
                </button>

                {/* Badge bấm đổi nhanh tốc độ */}
                {setSpeed && (
                  <button
                    onClick={handleCycleSpeed}
                    className="bg-teal-700 hover:bg-teal-800 text-white font-mono font-bold text-xs px-2.5 py-2 border-l border-teal-500/60 transition-colors"
                    title="Bấm để đổi nhanh tốc độ đọc (0.5x -> 0.75x -> 1x -> 1.25x)"
                  >
                    {speed}x
                  </button>
                )}
              </div>

              {/* In-place Speed Selector: 4 nút bấm trực tiếp */}
              {setSpeed && (
                <div className="flex items-center gap-1 bg-white/95 px-2 py-1 rounded-xl border border-teal-200 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden sm:inline">Tốc độ:</span>
                  {[0.5, 0.75, 1.0, 1.25].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSpeed(s)}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                        speed === s
                          ? 'bg-teal-600 text-white shadow-2xs scale-105'
                          : 'text-teal-900/70 hover:text-teal-900 hover:bg-teal-50'
                      }`}
                      title={`Đổi tốc độ ${s}x`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Smart Visibility Toggles */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowQuestionText(!showQuestionText)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  showQuestionText
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {showQuestionText ? 'Ẩn câu hỏi' : 'Hiện câu hỏi'}
              </button>

              <button
                onClick={() => setShowVietnamese(!showVietnamese)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  showVietnamese
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {showVietnamese ? 'Ẩn dịch VI' : 'Hiện dịch VI'}
              </button>

              <button
                onClick={() => setShowGrammar(!showGrammar)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  showGrammar
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {showGrammar ? 'Ẩn ngữ pháp' : 'Gợi ý ngữ pháp'}
              </button>

              <button
                onClick={() => setShowAnswer(!showAnswer)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  showAnswer
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {showAnswer ? 'Ẩn đáp án' : 'Hiện đáp án'}
              </button>

              <button
                onClick={() => toggleAll(!isAllShowing)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white transition-colors"
                title={isAllShowing ? 'Ẩn tất cả' : 'Hiện tất cả'}
              >
                {isAllShowing ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Grammar Hint Section (Conditional) */}
          {showGrammar && (
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-1.5 animate-fadeIn">
              <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-xs">
                <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Cấu trúc ngữ pháp áp dụng:</span>
                <span className="px-2 py-0.5 bg-indigo-200/60 rounded-md text-indigo-950 font-mono text-[11px]">
                  {question.grammar}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-indigo-800 leading-relaxed pl-5">
                {question.grammar_meaning}
              </p>
            </div>
          )}

          {/* Model Answer Section (Conditional) */}
          {showAnswer && (
            <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3 animate-fadeIn">
              <div className="flex items-start gap-3">
                <button
                  onClick={handleSpeakAnswer}
                  className="p-2 rounded-xl bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors shrink-0"
                  title="Nghe câu trả lời mẫu"
                >
                  <Volume2 className="w-4 h-4" />
                </button>

                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      → Câu trả lời mẫu (kèm Furigana):
                    </span>
                  </div>

                  <div className="text-base sm:text-lg font-medium text-emerald-950 leading-relaxed font-sans">
                    {renderJapaneseWithFurigana(question.a_jp, showFurigana)}
                  </div>

                  <p className="text-xs sm:text-sm text-emerald-700 italic pt-1 border-t border-emerald-200/60">
                    <b>Dịch nghĩa:</b> {question.a_vi}
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
