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
  Maximize2, 
  Minimize2,
  HelpCircle,
  Sparkles,
  ArrowRight,
  MessageSquare,
  BookmarkCheck
} from 'lucide-react';
import { renderJapaneseWithFurigana } from '../utils/japanese';

export default function PracticeCard({
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
  // Trạng thái ẩn/hiện thông minh của thẻ
  // Mặc định khi chuyển sang thẻ mới: chỉ hiện Hình ảnh và nút Nghe câu hỏi
  const [showQuestionText, setShowQuestionText] = useState(false);
  const [showVietnamese, setShowVietnamese] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isZoomImage, setIsZoomImage] = useState(false);

  // Khi question thay đổi, reset lại trạng thái ẩn/hiện
  useEffect(() => {
    setShowQuestionText(false);
    setShowVietnamese(false);
    setShowAnswer(false);
    setIsZoomImage(false);
    speech.stop();
  }, [question.id]);

  const toggleAll = (show) => {
    setShowQuestionText(show);
    setShowVietnamese(show);
    setShowAnswer(show);
  };

  const isAllShowing = showQuestionText && showVietnamese && showAnswer;

  // Phát âm toàn bộ câu hỏi trong hình theo thứ tự
  const handleSpeakAllQuestions = () => {
    if (speech.isSpeaking) {
      speech.stop();
      return;
    }
    // Gộp các câu hỏi lại và đọc lần lượt
    const allQuestionsText = question.qa.map(item => item.q_jp).join(' ... ');
    speech.speak(allQuestionsText, speed);
  };

  const speeds = [0.5, 0.75, 1.0, 1.25];
  const handleCycleSpeed = (e) => {
    e.stopPropagation();
    if (!setSpeed) return;
    const currentIdx = speeds.indexOf(speed);
    const nextIdx = currentIdx === -1 ? 2 : (currentIdx + 1) % speeds.length;
    setSpeed(speeds[nextIdx]);
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

          <span className="px-2 py-1 text-xs font-bold text-slate-700 bg-slate-100 rounded-lg">
            {question.id} / {totalCount}
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
            title="Hình ngẫu nhiên"
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
        
        {/* Card Header: Lesson & Grammar Info */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-xs">
              Lesson {question.lesson}
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-800">
              Hình {question.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">Mẫu ngữ pháp:</span>
            <span className="px-3 py-1 bg-white text-indigo-900 border border-indigo-100 rounded-xl text-xs sm:text-sm font-semibold shadow-2xs">
              {question.grammar}
            </span>
          </div>
        </div>

        {/* Card Body: Image & Controls */}
        <div className="p-5 sm:p-7 space-y-6">
          
          {/* Image Display */}
          <div className="relative group bg-slate-900/5 rounded-2xl p-3 border border-slate-200/80 flex items-center justify-center min-h-[220px] sm:min-h-[300px] overflow-hidden">
            <img
              src={question.image}
              alt={`Minh họa Hình ${question.id}`}
              className="max-h-[360px] w-auto max-w-full object-contain rounded-xl shadow-xs transition-transform duration-300 group-hover:scale-[1.01]"
              loading="eager"
            />

            {/* Click to zoom button */}
            <button
              onClick={() => setIsZoomImage(true)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/80 backdrop-blur-md text-slate-700 hover:bg-white hover:text-indigo-600 shadow-md transition-all opacity-0 group-hover:opacity-100"
              title="Phóng to ảnh"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Listening Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex rounded-xl shadow-xs overflow-hidden border border-indigo-600">
                <button
                  onClick={handleSpeakAllQuestions}
                  className={`flex items-center gap-2 px-3.5 py-2 font-bold text-xs sm:text-sm transition-all ${
                    speech.isSpeaking
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
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

                {/* Badge bấm đổi tốc độ nhanh */}
                {setSpeed && (
                  <button
                    onClick={handleCycleSpeed}
                    className="bg-indigo-700 hover:bg-indigo-800 text-white font-mono font-bold text-xs px-2.5 py-2 border-l border-indigo-500/60 transition-colors"
                    title="Bấm để đổi nhanh tốc độ đọc (0.5x -> 0.75x -> 1x -> 1.25x)"
                  >
                    {speed}x
                  </button>
                )}
              </div>

              {/* In-place Speed Selector: 4 nút bấm trực tiếp */}
              {setSpeed && (
                <div className="flex items-center gap-1 bg-white/95 px-2 py-1 rounded-xl border border-indigo-200 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden sm:inline">Tốc độ:</span>
                  {[0.5, 0.75, 1.0, 1.25].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSpeed(s)}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                        speed === s
                          ? 'bg-indigo-600 text-white shadow-2xs scale-105'
                          : 'text-indigo-900/70 hover:text-indigo-900 hover:bg-indigo-50'
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
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {showQuestionText ? 'Ẩn câu hỏi' : 'Hiện câu hỏi'}
              </button>

              <button
                onClick={() => setShowVietnamese(!showVietnamese)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  showVietnamese
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {showVietnamese ? 'Ẩn dịch VI' : 'Hiện dịch VI'}
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

          {/* QA List Section */}
          <div className="space-y-4">
            {question.qa.map((item, index) => {
              const isSpeakingThisQ = speech.isSpeaking && speech.currentText === item.q_jp;
              const isSpeakingThisA = speech.isSpeaking && speech.currentText === item.a_jp;

              return (
                <div 
                  key={index}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 hover:border-indigo-200 transition-colors space-y-3"
                >
                  {/* Question Row */}
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => {
                        if (isSpeakingThisQ) speech.stop();
                        else speech.speak(item.q_jp, speed);
                      }}
                      className={`p-2 rounded-xl shrink-0 transition-colors ${
                        isSpeakingThisQ
                          ? 'bg-indigo-600 text-white animate-bounce'
                          : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                      }`}
                      title="Nghe câu hỏi này"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-600">
                          Câu {index + 1}:
                        </span>
                        {!showQuestionText && (
                          <span className="text-xs text-slate-400 italic">
                            (Nội dung câu hỏi đang ẩn • Bấm loa để nghe hoặc bật Hiện câu hỏi)
                          </span>
                        )}
                      </div>

                      {/* Japanese Question Text */}
                      {showQuestionText && (
                        <div className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed font-sans">
                          {renderJapaneseWithFurigana(item.q_jp, showFurigana)}
                        </div>
                      )}

                      {/* Vietnamese Translation */}
                      {showVietnamese && (
                        <p className="text-xs sm:text-sm text-slate-600 bg-white/80 p-2 rounded-lg border border-slate-200/60 inline-block">
                          {item.q_vi}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Answer Row (Conditional) */}
                  {showAnswer && (
                    <div className="ml-11 pt-3 border-t border-slate-200/60 flex items-start gap-3 bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100">
                      <button
                        onClick={() => {
                          if (isSpeakingThisA) speech.stop();
                          else speech.speak(item.a_jp, speed);
                        }}
                        className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                          isSpeakingThisA
                            ? 'bg-emerald-600 text-white animate-pulse'
                            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        }`}
                        title="Nghe phát âm câu trả lời mẫu"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex-1 space-y-1">
                        <span className="text-xs font-bold text-emerald-800 block">
                          → Trả lời mẫu:
                        </span>
                        <div className="text-sm sm:text-base font-medium text-emerald-950 leading-relaxed">
                          {renderJapaneseWithFurigana(item.a_jp, showFurigana)}
                        </div>
                        {showVietnamese && (
                          <p className="text-xs text-emerald-700 italic">
                            {item.a_vi}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* Lightbox Modal when zooming image */}
      {isZoomImage && (
        <div 
          onClick={() => setIsZoomImage(false)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img 
              src={question.image} 
              alt={`Hình ${question.id}`} 
              className="max-h-[85vh] w-auto rounded-2xl shadow-2xl object-contain bg-white p-2"
            />
            <button
              onClick={() => setIsZoomImage(false)}
              className="absolute -top-3 -right-3 p-2 bg-white text-slate-800 rounded-full shadow-lg hover:bg-rose-50 hover:text-rose-600 transition-colors"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
