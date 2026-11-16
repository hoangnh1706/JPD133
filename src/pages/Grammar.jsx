import { useState } from 'react';
import { noImageQuestions } from '../data/catalog';
import { renderJapaneseWithFurigana } from '../utils/japanese';

export default function Grammar({ progress, record }) {
  const [lesson,setLesson]=useState('all');
  const items = noImageQuestions.filter(item=>lesson==='all'||item.lesson===Number(lesson));
  const seen = new Set(progress.events.filter(e=>e.type==='grammar').map(e=>e.id));
  return <><div className="eyebrow">NGỮ PHÁP QUA CÂU HỎI</div><h1>Hiểu mẫu câu qua ngữ cảnh<span className="pink">.</span></h1><p className="lead">Các mẫu câu và lời giải thích lấy từ bộ câu phản xạ hiện có. Đây là ghi chú ôn tập, chưa phải giáo trình ngữ pháp đầy đủ.</p><div className="toolbar"><select aria-label="Lọc bài ngữ pháp" value={lesson} onChange={e=>setLesson(e.target.value)}><option value="all">Tất cả bài</option>{Array.from({length:11},(_,i)=><option key={i} value={i+1}>Bài {i+1}</option>)}</select><span className="section-note">{seen.size}/{noImageQuestions.length} mẫu đã xem</span></div><div className="grammar-grid">{items.map(item=><article className="grammar-card" key={item.id}><div className="grammar-top"><span className="pill">BÀI {item.lesson}</span><span>{seen.has(item.id)?'Đã xem':'Mẫu câu'}</span></div><h3 lang="ja">{item.grammar}</h3><p>{item.grammar_meaning}</p><div className="grammar-example" lang="ja">{renderJapaneseWithFurigana(item.q_jp,progress.settings.furigana)}</div><small>{item.q_vi}</small><button className="text-button" onClick={()=>record('grammar',{id:item.id,lesson:item.lesson})}>Đánh dấu đã xem →</button></article>)}</div></>;
}
