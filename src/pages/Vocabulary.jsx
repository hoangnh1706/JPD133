import { useEffect, useMemo, useState } from 'react';
import { Heart, RotateCcw, Search, Volume2 } from 'lucide-react';
import { vocabulary } from '../data/catalog';
import { getLearnedSet } from '../services/progress';

const DAY = 86_400_000;
function latestReviews(events) {
  const latest = new Map();
  events.filter(event => event.type === 'vocab-review').forEach(event => latest.set(event.id, event));
  return latest;
}
function quizOptions(word, list, direction) {
  const value = item => direction === 'jp-vi' ? item.meaning_vi : item.word_jp;
  const correct = value(word);
  const alternatives = list.filter(item => item.id !== word.id && value(item) !== correct)
    .sort((a, b) => Math.abs(a.id - word.id) - Math.abs(b.id - word.id))
    .map(value);
  const unique = [...new Set(alternatives)].slice(0, 3);
  const options = [correct, ...unique];
  const offset = word.id % options.length;
  return [...options.slice(offset), ...options.slice(0, offset)];
}

export default function Vocabulary({ progress, update, record, markLearned }) {
  const [lesson, setLesson] = useState('all');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState('cards');
  const [direction, setDirection] = useState('jp-vi');
  const [answer, setAnswer] = useState(null);
  const [openedAt] = useState(() => Date.now());
  const reviews = useMemo(() => latestReviews(progress.events), [progress.events]);
  const list = useMemo(() => vocabulary.filter(word => {
    if (lesson !== 'all' && word.lesson !== Number(lesson)) return false;
    if (filter === 'favorites' && !progress.favorites.includes(word.id)) return false;
    if (filter === 'due' && (!reviews.has(word.id) || Date.parse(reviews.get(word.id).due) > openedAt)) return false;
    return `${word.word_jp} ${word.reading} ${word.meaning_vi} ${word.topic}`.toLowerCase().includes(query.toLowerCase());
  }), [lesson, filter, progress.favorites, reviews, query, openedAt]);
  const word = list[Math.min(index, list.length - 1)];
  const learned = getLearnedSet(progress, 'vocab');
  useEffect(() => { if (mode !== 'list' && word) markLearned('vocab', word.id, word.lesson); }, [mode, word, markLearned]);
  const options = word ? quizOptions(word, list.length >= 4 ? list : vocabulary, direction) : [];
  const resetCard = () => { setIndex(0); setFlipped(false); setAnswer(null); };
  const next = () => { setIndex(current => list.length ? (current + 1) % list.length : 0); setFlipped(false); setAnswer(null); };
  const favorite = id => update({ favorites: progress.favorites.includes(id) ? progress.favorites.filter(item => item !== id) : [...progress.favorites, id] });
  const speak = text => { if (window.speechSynthesis) { window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'ja-JP'; utterance.rate = progress.settings.rate; window.speechSynthesis.speak(utterance); } };
  const review = grade => {
    const previous = reviews.get(word.id);
    const interval = grade === 'again' ? 1 : previous?.grade === 'known' ? Math.min((previous.interval || 1) * 2, 30) : 3;
    record('vocab-review', { id: word.id, lesson: word.lesson, grade, interval, due: new Date(Date.now() + interval * DAY).toISOString() });
    next();
  };
  const choose = option => { if (answer !== null) return; setAnswer(option); record('vocab-quiz', { id: word.id, lesson: word.lesson, correct: option === (direction === 'jp-vi' ? word.meaning_vi : word.word_jp) }); };
  return <>
    <div className="eyebrow">TỪ VỰNG JPD133</div><h1>Học từ, nhớ lâu hơn<span className="pink">.</span></h1>
    <p className="lead">{vocabulary.length} mục từ trong dữ liệu dự án. Lật thẻ, nghe cách đọc, luyện trắc nghiệm và lên lịch ôn lại.</p>
    <div className="toolbar"><div className="segmented">{[['cards','Flashcard'],['quiz','Trắc nghiệm'],['list','Danh sách']].map(([key,label]) => <button className={mode === key ? 'selected' : ''} key={key} onClick={() => { setMode(key); resetCard(); }}>{label}</button>)}</div><label className="search-box"><Search size={18}/><input placeholder="Tìm tiếng Nhật hoặc nghĩa Việt" value={query} onChange={event => { setQuery(event.target.value); resetCard(); }}/></label><select aria-label="Lọc theo bài" value={lesson} onChange={event => { setLesson(event.target.value); resetCard(); }}><option value="all">Tất cả bài</option>{Array.from({length:11},(_,i) => <option key={i} value={i+1}>Bài {i+1}</option>)}</select><select aria-label="Lọc từ vựng" value={filter} onChange={event => { setFilter(event.target.value); resetCard(); }}><option value="all">Tất cả từ</option><option value="favorites">Từ yêu thích</option><option value="due">Đến hạn ôn</option></select><span className="section-note">{learned.size}/{vocabulary.length} từ đã học</span></div>
    {mode === 'cards' ? word ? <div className="flashcard-area"><div className="flashcard-count">THẺ {Math.min(index+1,list.length)} / {list.length} · BÀI {word.lesson} {learned.has(String(word.id)) && <span className="learned-badge">✓ Đã học</span>}</div><button className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => { if (!flipped) record('vocab', { id: word.id, lesson: word.lesson }); setFlipped(!flipped); }} aria-label={flipped ? 'Xem mặt trước' : 'Lật thẻ xem nghĩa'}><span className="flashcard-kicker">{flipped ? 'NGHĨA TIẾNG VIỆT' : 'TỪ TIẾNG NHẬT'}</span><strong lang={flipped ? 'vi' : 'ja'}>{flipped ? word.meaning_vi : word.word_jp}</strong><small lang="ja">{flipped ? word.reading : 'Nhấn để lật thẻ'}</small></button><div className="card-controls"><button className="secondary-button" onClick={() => favorite(word.id)}><Heart size={18} fill={progress.favorites.includes(word.id) ? 'currentColor' : 'none'}/> {progress.favorites.includes(word.id) ? 'Đã lưu' : 'Lưu từ'}</button><button className="secondary-button" onClick={() => speak(word.word_jp)}><Volume2 size={18}/> Nghe đọc</button>{flipped ? <><button className="secondary-button" onClick={() => review('again')}>Cần ôn</button><button className="primary-button" onClick={() => review('known')}>Đã nhớ</button></> : <button className="primary-button" onClick={next}>Thẻ tiếp theo <RotateCcw size={17}/></button>}</div><p className="muted">“Cần ôn” nhắc lại sau 1 ngày; “Đã nhớ” giãn dần 3–30 ngày.</p></div> : <div className="empty-state">Không có từ phù hợp với bộ lọc.</div>
    : mode === 'quiz' ? word ? <div className="panel practice-panel"><div className="practice-head"><span className="pill">BÀI {word.lesson} · CÂU {Math.min(index+1,list.length)}/{list.length}</span>{learned.has(String(word.id)) && <span className="learned-badge">✓ Đã học</span>}<select aria-label="Chiều luyện" value={direction} onChange={event => { setDirection(event.target.value); setAnswer(null); }}><option value="jp-vi">Nhật → Việt</option><option value="vi-jp">Việt → Nhật</option></select></div><h2 className="question-title">{direction === 'jp-vi' ? word.word_jp : word.meaning_vi}</h2>{direction === 'jp-vi' && <p className="muted">{word.reading}</p>}<div className="options">{options.map((option,i) => <button key={`${i}-${option}`} className={`option ${answer === option ? 'chosen' : ''} ${answer !== null && option === (direction === 'jp-vi' ? word.meaning_vi : word.word_jp) ? 'correct' : ''} ${answer === option && option !== (direction === 'jp-vi' ? word.meaning_vi : word.word_jp) ? 'incorrect' : ''}`} onClick={() => choose(option)} disabled={answer !== null}><span>{String.fromCharCode(65+i)}</span>{option}</button>)}</div>{answer !== null && <div className="feedback" role="status">{answer === (direction === 'jp-vi' ? word.meaning_vi : word.word_jp) ? 'Chính xác!' : `Đáp án: ${direction === 'jp-vi' ? word.meaning_vi : word.word_jp}`}</div>}<div className="exam-controls"><button className="primary-button" onClick={next}>Câu tiếp theo →</button></div></div> : <div className="empty-state">Không có từ phù hợp với bộ lọc.</div>
    : <div className="word-list">{list.map(item => <div className="word-row" key={item.id}><div><strong lang="ja">{item.word_jp}</strong><small lang="ja">{item.reading}</small></div><span>{item.meaning_vi}</span>{learned.has(String(item.id)) ? <span className="learned-badge">✓ Đã học</span> : <button className="text-button" onClick={() => markLearned('vocab', item.id, item.lesson)}>Đánh dấu đã học</button>}<button className="icon-button" aria-label={`Lưu ${item.word_jp}`} onClick={() => favorite(item.id)}><Heart size={18} fill={progress.favorites.includes(item.id) ? 'currentColor' : 'none'}/></button><button className="icon-button" aria-label={`Nghe ${item.word_jp}`} onClick={() => speak(item.word_jp)}><Volume2 size={18}/></button></div>)}</div>}
  </>;
}
