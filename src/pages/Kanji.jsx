import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, Search, Volume2 } from 'lucide-react';
import { kanji, vocabulary } from '../data/catalog';
import { getLearnedSet } from '../services/progress';

function examplesFor(item) {
  return vocabulary.filter(word => word.lesson <= item.lesson && word.word_jp.includes(item.kanji) && word.reading && word.meaning_vi)
    .sort((a, b) => Number(b.lesson === item.lesson) - Number(a.lesson === item.lesson) || a.word_jp.length - b.word_jp.length)
    .slice(0, 3);
}

function optionsFor(item, list) {
  const sameLesson = kanji.filter(row => row.lesson === item.lesson);
  const pool = list.length >= 4 ? list : sameLesson;
  const candidates = pool.filter(row => row.id !== item.id && row.meaning !== item.meaning);
  const start = Number(item.id.slice(2)) % candidates.length;
  const distractors = [...candidates.slice(start), ...candidates.slice(0, start)].slice(0, 3);
  const options = [...distractors];
  options.splice(Number(item.id.slice(2)) % 4, 0, item);
  return options;
}

export default function Kanji({ initialLesson = 'all', progress, record, markLearned }) {
  const [mode, setMode] = useState('cards');
  const [lesson, setLesson] = useState(initialLesson);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [chosen, setChosen] = useState(null);
  const [answeredId, setAnsweredId] = useState(null);
  const learned = getLearnedSet(progress, 'kanji');
  const needsReview = useMemo(() => {
    const latest = new Map();
    progress.events.filter(event => event.type === 'kanji-review' || event.type === 'kanji-quiz')
      .forEach(event => latest.set(String(event.id), event.type === 'kanji-review' ? event.grade === 'again' : !event.correct));
    return new Set([...latest].filter(([, needs]) => needs).map(([id]) => id));
  }, [progress.events]);
  const list = useMemo(() => kanji.filter(item =>
    (lesson === 'all' || item.lesson === Number(lesson))
    && (filter !== 'review' || needsReview.has(item.id))
    && `${item.kanji} ${item.han_viet} ${item.meaning} ${item.on_reading} ${item.kun_reading}`.toLowerCase().includes(query.toLowerCase().trim())
  ), [lesson, filter, needsReview, query]);
  const item = chosen !== null && answeredId ? kanji.find(row => row.id === answeredId) : list[Math.min(index, list.length - 1)];
  const examples = item ? examplesFor(item) : [];
  const options = item ? optionsFor(item, kanji.filter(row => row.lesson === item.lesson)) : [];
  const attempts = progress.events.filter(event => event.type === 'kanji-quiz');
  useEffect(() => { if (mode !== 'list' && item) markLearned('kanji', item.id, item.lesson); }, [mode, item, markLearned]);

  const reset = () => { setIndex(0); setRevealed(false); setChosen(null); setAnsweredId(null); };
  const move = offset => { setIndex(current => list.length ? (current + offset + list.length) % list.length : 0); setRevealed(false); setChosen(null); setAnsweredId(null); };
  const speak = word => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const voice = new SpeechSynthesisUtterance(word);
    voice.lang = 'ja-JP';
    voice.rate = progress.settings.rate;
    window.speechSynthesis.speak(voice);
  };
  const review = grade => { record('kanji-review', { id: item.id, lesson: item.lesson, grade }); if (filter === 'review' && grade === 'known') { setRevealed(false); setChosen(null); } else move(1); };
  const answer = option => {
    if (chosen !== null) return;
    setAnsweredId(item.id);
    setChosen(option.id);
    record('kanji-quiz', { id: item.id, lesson: item.lesson, correct: option.id === item.id });
  };

  return <><div className="eyebrow">ÔN CHỮ HÁN · BÀI 1–11</div>
    <h1>Nhìn chữ, nhớ nghĩa<span className="pink">.</span></h1>
    <p className="lead">{kanji.length} chữ Hán từ tài liệu Bài 1–11. Xem âm On, âm Kun và ví dụ; lật thẻ hoặc chọn chữ đúng để tự kiểm tra.</p>
    <div className="toolbar kanji-toolbar">
      <div className="segmented">{[['cards', 'Thẻ ôn'], ['quiz', 'Trắc nghiệm'], ['list', 'Danh sách']].map(([key, label]) => <button key={key} className={mode === key ? 'selected' : ''} onClick={() => { setMode(key); reset(); }}>{label}</button>)}</div>
      <select aria-label="Chọn bài chữ Hán" value={lesson} onChange={event => { setLesson(event.target.value); reset(); }}><option value="all">Tất cả Bài 1–11</option>{Array.from({ length: 11 }, (_, i) => { const number = i + 1; const rows = kanji.filter(row => row.lesson === number); return <option key={number} value={number}>Bài {number} · {rows.filter(row => learned.has(row.id)).length}/{rows.length} đã học</option>; })}</select>
      <select aria-label="Lọc chữ Hán" value={filter} onChange={event => { setFilter(event.target.value); reset(); }}><option value="all">Tất cả chữ</option><option value="review">Cần ôn lại</option></select>
      <label className="search-box"><Search size={18}/><input value={query} onChange={event => { setQuery(event.target.value); reset(); }} placeholder="Tìm chữ, âm hoặc nghĩa"/></label>
      <span className="section-note">{learned.size}/{kanji.length} chữ đã học</span>
    </div>
    {mode === 'list' ? <div className="kanji-list">{list.length ? list.map((row, position) => <button className="kanji-list-item" key={row.id} onClick={() => { setIndex(position); setRevealed(false); setMode('cards'); }}>
      <strong lang="ja">{row.kanji}</strong><span>Bài {row.lesson} · {row.han_viet}</span><small>{row.meaning}</small>{learned.has(row.id) && <span className="learned-badge">✓ Đã học</span>}{needsReview.has(row.id) && <span className="kanji-review-label">Cần ôn</span>}
    </button>) : <div className="empty-state">Không có chữ Hán phù hợp.</div>}</div>
      : item ? mode === 'cards' ? <section className="panel kanji-card-panel">
        <div className="kanji-meta"><span className="pill">BÀI {item.lesson} · THẺ {Math.min(index + 1, list.length)}/{list.length}</span>{learned.has(item.id) && <span className="learned-badge">✓ Đã học</span>}</div>
        <button className="kanji-flip" onClick={() => setRevealed(value => !value)} aria-label={revealed ? `Ẩn nghĩa chữ ${item.kanji}` : `Xem nghĩa chữ ${item.kanji}`}><strong lang="ja">{item.kanji}</strong><span>{revealed ? item.han_viet : 'Nhấn để xem cách đọc và nghĩa'}</span></button>
        {revealed && <div className="kanji-detail"><h2>{item.meaning}</h2><div className="kanji-readings"><div><small>ÂM ON</small><strong lang="ja">{item.on_reading || '—'}</strong></div><div><small>ÂM KUN</small><strong lang="ja">{item.kun_reading || '—'}</strong></div></div><h3>Ví dụ trong bài học</h3><div className="kanji-examples">{examples.map(word => <div key={word.id}><strong lang="ja">{word.word_jp}</strong><span lang="ja">{word.reading}</span><span>{word.meaning_vi}</span><button className="icon-button" aria-label={`Nghe ${word.word_jp}`} onClick={() => speak(word.word_jp)}><Volume2 size={17}/></button></div>)}</div></div>}
        <div className="kanji-actions"><button className="secondary-button" onClick={() => move(-1)}><ArrowLeft size={17}/> Chữ trước</button>{revealed && <><button className="secondary-button" onClick={() => review('again')}>Cần ôn</button><button className="secondary-button" onClick={() => review('known')}>Đã nhớ</button></>}<button className="primary-button" onClick={() => move(1)}>Chữ tiếp <ArrowRight size={17}/></button></div>
      </section> : <section className="panel kanji-quiz-panel">
        <div className="kanji-meta"><span className="pill">BÀI {item.lesson} · CÂU {Math.min(index + 1, list.length)}/{list.length}</span><span className="section-note">Đúng {attempts.filter(event => event.correct).length}/{attempts.length}</span></div>
        <span className="eyebrow">CHỌN CHỮ HÁN ĐÚNG</span><h2>{item.meaning}</h2>
        <div className="kanji-quiz-options">{options.map(option => <button key={option.id} className={`kanji-quiz-option ${chosen === option.id ? 'chosen' : ''} ${chosen !== null && option.id === item.id ? 'correct' : ''} ${chosen === option.id && option.id !== item.id ? 'incorrect' : ''}`} disabled={chosen !== null} onClick={() => answer(option)} lang="ja">{option.kanji}</button>)}</div>
        {chosen !== null && <div className={`feedback ${chosen === item.id ? 'good' : 'bad'}`} role="status"><strong>{chosen === item.id ? 'Chính xác!' : `Đáp án: ${item.kanji}`}</strong><p>{item.han_viet} · Âm On: {item.on_reading || '—'} · Âm Kun: {item.kun_reading || '—'}</p></div>}
        <div className="kanji-actions"><button className="secondary-button" onClick={() => move(-1)}><ArrowLeft size={17}/> Câu trước</button><button className="primary-button" onClick={() => move(1)}>Câu tiếp <ArrowRight size={17}/></button></div>
      </section> : <div className="empty-state"><RotateCcw size={28}/><h3>Chưa có chữ cần ôn</h3><p>Hãy làm trắc nghiệm hoặc đánh dấu “Cần ôn” trên thẻ.</p><button className="primary-button" onClick={() => { setFilter('all'); reset(); }}>Xem tất cả chữ</button></div>}
  </>;
}
