import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Flag, RotateCcw, Send, Shuffle } from 'lucide-react';
import ssgExams from '../data/ssg105_exams.json';
import { addMistake } from '../services/mistakes';

const allQuestions = ssgExams.flatMap(ex => ex.questions);

function makeRandomExam() {
  const shuffled = [...allQuestions].sort(() => Math.random() - 0.5).slice(0, 30);
  return {
    id: 'random',
    title: 'Đề Ngẫu Nhiên · Trộn 30 câu',
    description: '30 câu ngẫu nhiên trích từ toàn bộ ngân hàng 358 câu SSG105 (bao gồm đề thật SU26-FE, SU26-RE & bộ lý thuyết Ôn FE).',
    questions: shuffled
  };
}

function EosQuestionCard({ question, questionNumber, selected, onSelect, showFeedback }) {
  if (!question) return null;
  return (
    <div className="eos-card">
      <div className="eos-header">
        <span className="eos-blue-accent" />
        <h2 className="eos-title">Câu {questionNumber}</h2>
      </div>
      <div className="eos-body">
        <p className="eos-instruction">(Choose 1 answer)</p>
        <div className="eos-question-prompt">
          {question.question}
        </div>
        <div className="eos-options">
          {question.options.map((option, i) => {
            const letter = String.fromCharCode(65 + i);
            const isChosen = selected === option;
            const isCorrect = showFeedback && option === question.correct_answer;
            const isWrong = showFeedback && isChosen && selected !== question.correct_answer;
            return (
              <button
                key={i}
                type="button"
                className={`eos-option ${isChosen ? 'chosen' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
                onClick={() => onSelect(option)}
                disabled={showFeedback}
              >
                <span className="eos-letter">{letter}.</span>
                <span className="eos-text">{option}</span>
              </button>
            );
          })}
        </div>
        {showFeedback && (
          <div className={`feedback ${selected === question.correct_answer ? 'good' : 'bad'}`} role="status">
            <strong>{selected === question.correct_answer ? 'Chính xác!' : 'Chưa chính xác'}</strong>
            <p><strong>Đáp án đúng:</strong> {question.correct_answer}</p>
            {question.option_explanations?.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <strong>Phân tích từng đáp án:</strong>
                <ul style={{ margin: '6px 0 0', paddingLeft: 18, display: 'grid', gap: 6 }}>
                  {question.option_explanations.map((line, idx) => {
                    const displayLine = line.includes('không phù hợp với ngữ cảnh tình huống')
                      ? `${String.fromCharCode(65 + idx)}. ✕ Sai`
                      : line;
                    return <li key={idx}>{displayLine}</li>;
                  })}
                </ul>
              </div>
            )}
            {question.explanation && (
              <p style={{ whiteSpace: 'pre-line', marginTop: 10 }}>
                {question.explanation.includes('📚')
                  ? '📚 ' + question.explanation.split('📚')[1].trim()
                  : question.explanation}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const SSG_STORAGE_KEY = 'ssg105_exam_state_v1';

function loadSsgState() {
  try {
    const raw = localStorage.getItem(SSG_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function SsgExam() {
  const initial = useMemo(() => loadSsgState(), []);
  const [selectedExamId, setSelectedExamId] = useState(() => initial?.selectedExamId || '1');
  const [randomExam, setRandomExam] = useState(() => {
    if (initial?.randomIds?.length) {
      const qs = initial.randomIds.map(id => allQuestions.find(q => q.id === id)).filter(Boolean);
      if (qs.length) {
        return {
          id: 'random',
          title: 'Đề Ngẫu Nhiên · Trộn 30 câu',
          description: '30 câu ngẫu nhiên trích từ toàn bộ ngân hàng 358 câu SSG105 (bao gồm đề thật SU26-FE, SU26-RE & bộ lý thuyết Ôn FE).',
          questions: qs
        };
      }
    }
    return makeRandomExam();
  });
  const [mode, setMode] = useState(() => initial?.mode || 'practice'); // 'practice' | 'mock'

  // Practice mode state (persisted per exam)
  const [qIndexByExam, setQIndexByExam] = useState(() => initial?.qIndexByExam || {});
  const [practiceAnswers, setPracticeAnswers] = useState(() => initial?.practiceAnswers || {});

  // Mock exam mode state (persisted)
  const [mockSession, setMockSession] = useState(() => initial?.mockSession || null);
  const [now, setNow] = useState(Date.now());
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const qIndex = Number(qIndexByExam[selectedExamId] || 0);
  const setQIndex = updater => {
    setQIndexByExam(prev => {
      const currentVal = Number(prev[selectedExamId] || 0);
      const nextVal = typeof updater === 'function' ? updater(currentVal) : updater;
      return { ...prev, [selectedExamId]: nextVal };
    });
  };

  // Save state to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(SSG_STORAGE_KEY, JSON.stringify({
        selectedExamId,
        randomIds: randomExam.questions.map(q => q.id),
        mode,
        qIndexByExam,
        practiceAnswers,
        mockSession
      }));
    } catch {
      // Ignore storage quota errors
    }
  }, [selectedExamId, randomExam, mode, qIndexByExam, practiceAnswers, mockSession]);

  const currentExam = useMemo(() => {
    if (selectedExamId === 'random') return randomExam;
    return ssgExams.find(ex => String(ex.id) === selectedExamId) || ssgExams[0];
  }, [selectedExamId, randomExam]);

  const questions = currentExam.questions;

  const handleExamChange = nextId => {
    setSelectedExamId(nextId);
    setMockSession(null);
    setConfirmSubmit(false);
  };

  const regenerateRandom = () => {
    const next = makeRandomExam();
    setRandomExam(next);
    setSelectedExamId('random');
    setQIndexByExam(prev => ({ ...prev, random: 0 }));
    setPracticeAnswers(prev => {
      const copy = { ...prev };
      next.questions.forEach(q => { delete copy[q.id]; });
      return copy;
    });
    setMockSession(null);
    setConfirmSubmit(false);
  };

  useEffect(() => {
    if (!mockSession || mockSession.status !== 'running') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [mockSession]);

  const remaining = mockSession ? Math.max(0, Math.ceil((mockSession.endsAt - now) / 1000)) : 0;

  useEffect(() => {
    if (mockSession?.status === 'running' && remaining === 0) {
      questions.forEach(q => {
        const ans = mockSession.answers[q.id];
        if (ans !== undefined && ans !== q.correct_answer) addMistake('ssg', q.id);
      });
      setMockSession(s => (s ? { ...s, status: 'finished', auto: true } : s));
    }
  }, [remaining, mockSession?.status, mockSession?.answers, questions]);

  const startMock = () => {
    setMockSession({
      index: 0,
      answers: {},
      flags: [],
      endsAt: Date.now() + 45 * 60000,
      status: 'running'
    });
    setNow(Date.now());
    setConfirmSubmit(false);
  };

  const practiceQ = questions[qIndex % Math.max(questions.length, 1)];
  const practiceChosen = practiceQ ? practiceAnswers[practiceQ.id] : undefined;
  const practiceCorrectCount = questions.filter(q => practiceAnswers[q.id] === q.correct_answer).length;
  const practiceAnsweredCount = questions.filter(q => practiceAnswers[q.id] !== undefined).length;

  return (
    <>
      <div className="eyebrow">SSG105 · FINAL EXAM PRACTICE</div>
      <h1>Ôn thi FE SSG105 (30 câu / đề)<span className="pink">.</span></h1>
      <p className="lead">{currentExam.description} Tổng cộng 12 bộ đề (358 câu hỏi hoàn toàn khác nhau, gồm đề thật SU26-FE, SU26-RE & bộ lý thuyết Ôn FE) + chế độ bốc đề ngẫu nhiên.</p>

      <div className="toolbar">
        <select aria-label="Chọn đề thi SSG105" value={selectedExamId} onChange={e => handleExamChange(e.target.value)}>
          {ssgExams.map(ex => (
            <option key={ex.id} value={String(ex.id)}>{ex.title}</option>
          ))}
          <option value="random">Đề Ngẫu Nhiên · Trộn 30 câu</option>
        </select>

        <button type="button" className="secondary-button" onClick={regenerateRandom}>
          <Shuffle size={16} /> Trộn đề 30 câu mới
        </button>

        <div className="segmented" role="tablist" aria-label="Chế độ làm bài SSG105">
          <button
            role="tab"
            aria-selected={mode === 'practice'}
            className={mode === 'practice' ? 'selected' : ''}
            onClick={() => { setMode('practice'); setMockSession(null); }}
          >
            Ôn từng câu
          </button>
          <button
            role="tab"
            aria-selected={mode === 'mock'}
            className={mode === 'mock' ? 'selected' : ''}
            onClick={() => { setMode('mock'); setMockSession(null); }}
          >
            Thi thử 30 câu (45p)
          </button>
        </div>
      </div>

      {mode === 'practice' && practiceQ && (
        <div className="exam-layout">
          <div className="panel exam-main-card">
            <div className="exam-bar">
              <span className="pill">{practiceQ.unit}</span>
              <span className="muted">
                Đã làm {practiceAnsweredCount}/{questions.length} · Đúng {practiceCorrectCount} ({((practiceCorrectCount / Math.max(questions.length, 1)) * 10).toFixed(1)}/10đ)
              </span>
            </div>

            {practiceAnsweredCount === questions.length && (
              <div className="feedback good" style={{ marginBottom: 16 }}>
                <strong>
                  🎉 Hoàn thành {currentExam.title}: {practiceCorrectCount}/{questions.length} câu đúng ({Math.round((practiceCorrectCount / questions.length) * 100)}% · {((practiceCorrectCount / questions.length) * 10).toFixed(1)}/10 điểm)
                </strong>
                <p style={{ marginTop: 6 }}>
                  Xếp loại: {practiceCorrectCount >= 26 ? 'Xuất sắc' : practiceCorrectCount >= 21 ? 'Khá / Tốt' : practiceCorrectCount >= 15 ? 'Đạt' : 'Cần ôn thêm'} — Các câu làm sai đã được tự động lưu vào tab Ôn câu sai.
                </p>
              </div>
            )}

            <EosQuestionCard
              question={practiceQ}
              questionNumber={qIndex + 1}
              selected={practiceChosen}
              onSelect={option => {
                if (practiceChosen !== undefined) return;
                setPracticeAnswers(prev => ({ ...prev, [practiceQ.id]: option }));
                if (option !== practiceQ.correct_answer) addMistake('ssg', practiceQ.id);
              }}
              showFeedback={practiceChosen !== undefined}
            />

            <div className="exam-controls">
              <button
                type="button"
                className="secondary-button"
                disabled={qIndex === 0}
                onClick={() => setQIndex(i => Math.max(0, i - 1))}
              >
                <ArrowLeft size={17} /> Câu trước
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setPracticeAnswers(prev => {
                    const copy = { ...prev };
                    questions.forEach(q => { delete copy[q.id]; });
                    return copy;
                  });
                  setQIndex(0);
                }}
              >
                <RotateCcw size={16} /> Làm lại đề này
              </button>
              <button
                type="button"
                className="primary-button"
                disabled={qIndex === questions.length - 1}
                onClick={() => setQIndex(i => Math.min(questions.length - 1, i + 1))}
              >
                Câu tiếp theo <ArrowRight size={17} />
              </button>
            </div>
          </div>

          <aside className="panel exam-nav">
            <h3>Danh sách 30 câu</h3>
            <div className="question-grid">
              {questions.map((q, i) => {
                const ans = practiceAnswers[q.id];
                const stateClass = ans === undefined ? '' : ans === q.correct_answer ? 'has-answer' : 'flagged';
                return (
                  <button
                    key={q.id}
                    type="button"
                    className={`${qIndex === i ? 'current' : ''} ${stateClass}`}
                    onClick={() => setQIndex(i)}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <p className="muted" style={{ fontSize: '0.78rem' }}>
              Xanh: Đúng · Dấu chấm đỏ: Sai · Chọn trực tiếp số câu để nhảy nhanh.
            </p>
          </aside>
        </div>
      )}

      {mode === 'mock' && !mockSession && (
        <div className="panel exam-setup">
          <h2>{currentExam.title}</h2>
          <p className="muted" style={{ marginBottom: 20 }}>
            Cấu trúc thi thử: <strong>30 câu trắc nghiệm</strong> · Thời gian làm bài <strong>45 phút</strong>. Đáp án và giải thích chi tiết sẽ hiển thị sau khi bạn bấm Nộp bài.
          </p>
          <button type="button" className="primary-button" onClick={startMock}>
            Bắt đầu làm đề 30 câu <ArrowRight size={18} />
          </button>
        </div>
      )}

      {mode === 'mock' && mockSession?.status === 'running' && (
        <div className="exam-layout">
          <div className="panel exam-main-card">
            <div className="exam-bar">
              <span className="pill">CÂU {mockSession.index + 1}/{questions.length}</span>
              <strong className={remaining < 120 ? 'time-warning' : ''}>
                <Clock3 size={18} /> {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
              </strong>
            </div>

            <EosQuestionCard
              question={questions[mockSession.index]}
              questionNumber={mockSession.index + 1}
              selected={mockSession.answers[questions[mockSession.index].id]}
              onSelect={option => {
                const qid = questions[mockSession.index].id;
                setMockSession(s => ({ ...s, answers: { ...s.answers, [qid]: option } }));
              }}
              showFeedback={false}
            />

            <div className="exam-controls">
              <button
                type="button"
                className="secondary-button"
                disabled={mockSession.index === 0}
                onClick={() => setMockSession(s => ({ ...s, index: s.index - 1 }))}
              >
                <ArrowLeft size={17} /> Trước
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  const qid = questions[mockSession.index].id;
                  setMockSession(s => ({
                    ...s,
                    flags: s.flags.includes(qid) ? s.flags.filter(id => id !== qid) : [...s.flags, qid]
                  }));
                }}
              >
                <Flag size={17} /> {mockSession.flags.includes(questions[mockSession.index].id) ? 'Bỏ cờ' : 'Đánh dấu'}
              </button>
              <button
                type="button"
                className="primary-button"
                disabled={mockSession.index === questions.length - 1}
                onClick={() => setMockSession(s => ({ ...s, index: s.index + 1 }))}
              >
                Tiếp <ArrowRight size={17} />
              </button>
            </div>
          </div>

          <aside className="panel exam-nav">
            <h3>Điều hướng câu hỏi</h3>
            <div className="question-grid">
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  type="button"
                  className={`${mockSession.index === i ? 'current' : ''} ${mockSession.answers[q.id] !== undefined ? 'has-answer' : ''} ${mockSession.flags.includes(q.id) ? 'flagged' : ''}`}
                  onClick={() => setMockSession(s => ({ ...s, index: i }))}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button type="button" className="primary-button full" onClick={() => setConfirmSubmit(true)}>
              <Send size={18} /> Nộp bài
            </button>
            {confirmSubmit && (
              <div className="confirm-box" role="dialog" aria-label="Xác nhận nộp bài">
                <p>Bạn đã trả lời {Object.keys(mockSession.answers).length}/{questions.length} câu. Nộp bài ngay?</p>
                <button type="button" className="primary-button" onClick={() => {
                  questions.forEach(q => {
                    const ans = mockSession.answers[q.id];
                    if (ans !== undefined && ans !== q.correct_answer) addMistake('ssg', q.id);
                  });
                  setMockSession(s => ({ ...s, status: 'finished' }));
                  setConfirmSubmit(false);
                }}>
                  Xác nhận nộp
                </button>
                <button type="button" className="text-button" onClick={() => setConfirmSubmit(false)}>
                  Tiếp tục làm
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {mode === 'mock' && mockSession?.status === 'finished' && (() => {
        const correct = questions.filter(q => mockSession.answers[q.id] === q.correct_answer).length;
        return (
          <div className="panel results">
            <span className="eyebrow">KẾT QUẢ THI THỬ SSG105</span>
            <h2><CheckCircle2 size={28} style={{ verticalAlign: 'middle', marginRight: 8, color: '#10b981' }} />{correct}/{questions.length} câu đúng ({Math.round((correct / questions.length) * 100)}% · {((correct / questions.length) * 10).toFixed(1)}/10 điểm)</h2>
            <p>{mockSession.auto ? 'Hết thời gian 45 phút, hệ thống đã tự động thu bài.' : 'Bạn đã hoàn thành bài thi thử.'}</p>
            <div className="button-row">
              <button type="button" className="primary-button" onClick={startMock}>Làm lại đề này</button>
              <button type="button" className="secondary-button" onClick={regenerateRandom}>Đề ngẫu nhiên khác</button>
            </div>
            <h3>Xem lại đáp án & Mẹo giải thích</h3>
            {questions.map((q, i) => {
              const userAns = mockSession.answers[q.id];
              const isOk = userAns === q.correct_answer;
              return (
                <div className="result-row" key={q.id}>
                  <strong>Câu {i + 1} · {q.unit}</strong>
                  <p>{q.question}</p>
                  <small style={{ color: isOk ? '#059669' : '#dc2626', fontWeight: 600 }}>
                    {userAns === undefined ? 'Chưa trả lời' : isOk ? '✓ Đúng' : '✕ Sai'} · Bạn chọn: {userAns ?? '—'} · Đáp án đúng: {q.correct_answer}
                  </small>
                  <p style={{ whiteSpace: 'pre-line', marginTop: 6 }}>{q.explanation}</p>
                </div>
              );
            })}
          </div>
        );
      })()}
    </>
  );
}
