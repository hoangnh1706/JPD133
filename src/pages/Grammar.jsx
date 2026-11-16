import { useEffect, useRef, useState } from 'react';
import { noImageQuestions } from '../data/catalog';
import { getLearnedSet } from '../services/progress';
import { renderJapaneseWithFurigana } from '../utils/japanese';

function GrammarCard({ item, learned, furigana, markLearned }) {
  const ref = useRef(null);
  useEffect(() => {
    if (learned || !ref.current || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        markLearned('grammar', item.id, item.lesson);
        observer.disconnect();
      }
    }, { threshold: 0.25 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [item.id, item.lesson, learned, markLearned]);
  return <article className="grammar-card" ref={ref}>
    <div className="grammar-top"><span className="pill">BÀI {item.lesson}</span>{learned && <span className="learned-badge">✓ Đã học</span>}</div>
    <h3 lang="ja">{item.grammar}</h3><p>{item.grammar_meaning}</p>
    <div className="grammar-example" lang="ja">{renderJapaneseWithFurigana(item.q_jp, furigana)}</div><small>{item.q_vi}</small>
    {!learned && <button className="text-button" onClick={() => markLearned('grammar', item.id, item.lesson)}>Đánh dấu đã học →</button>}
  </article>;
}

export default function Grammar({ progress, markLearned }) {
  const [lesson, setLesson] = useState('all');
  const items = noImageQuestions.filter(item => lesson === 'all' || item.lesson === Number(lesson));
  const learned = getLearnedSet(progress, 'grammar');
  return <><div className="eyebrow">NGỮ PHÁP QUA CÂU HỎI</div><h1>Hiểu mẫu câu qua ngữ cảnh<span className="pink">.</span></h1><p className="lead">Các mẫu câu và lời giải thích lấy từ bộ câu phản xạ hiện có. Đây là ghi chú ôn tập, chưa phải giáo trình ngữ pháp đầy đủ.</p><div className="toolbar"><select aria-label="Lọc bài ngữ pháp" value={lesson} onChange={e => setLesson(e.target.value)}><option value="all">Tất cả bài</option>{Array.from({ length: 11 }, (_, i) => <option key={i} value={i + 1}>Bài {i + 1}</option>)}</select><span className="section-note">{learned.size}/{noImageQuestions.length} mẫu đã học</span></div><div className="grammar-grid">{items.map(item => <GrammarCard key={item.id} item={item} learned={learned.has(String(item.id))} furigana={progress.settings.furigana} markLearned={markLearned}/>)}</div></>;
}

