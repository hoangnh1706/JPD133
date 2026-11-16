import { useState } from 'react';
import { BookOpen, ExternalLink } from 'lucide-react';
import { getLearnedSet } from '../services/progress';

const grammarLessons = [
  { lesson: 8, pages: 6, focus: 'Nơi ở, đặc điểm người, cho và nhận đồ vật' },
  { lesson: 9, pages: 6, focus: 'Sở thích, khả năng, tần suất và cách làm' },
  { lesson: 10, pages: 6, focus: 'Chỉ đường, xin phép và lời nhờ' },
  { lesson: 11, pages: 8, focus: 'Trải nghiệm, hoạt động và mẫu ～とき' },
];

export default function GrammarWorkbook({ lesson = 'all', title = 'Bài tập ngữ pháp 8–11', progress, markLearned }) {
  const [selected, setSelected] = useState(lesson === 'all' ? 8 : Number(lesson));
  const [open, setOpen] = useState(false);
  const current = grammarLessons.find(item => item.lesson === selected) || grammarLessons[0];
  const url = `/grammar-pdf/${String(current.lesson).padStart(2, '0')}.pdf`;
  const learned = getLearnedSet(progress, 'workbook');
  return <section className="panel grammar-workbook"><div className="workbook-head"><div><span className="eyebrow">TÀI LIỆU GỐC · DEKIRU</span><h2>{title}</h2><p>Bốn tập ảnh gốc, tổng 26 trang. Chọn bài để đọc toàn bộ bài tập và tự đối chiếu ngữ pháp trước khi luyện FE hoặc Speaking.</p></div><BookOpen size={26}/></div><div className="workbook-tabs" role="group" aria-label="Chọn bài ngữ pháp">{grammarLessons.map(item => <button key={item.lesson} className={`secondary-button ${selected === item.lesson ? 'selected' : ''}`} onClick={() => { setSelected(item.lesson); setOpen(false); }}>Bài {item.lesson}{learned.has(String(item.lesson)) ? ' · Đã học' : ''}</button>)}</div><p className="muted"><strong>Bài {current.lesson}</strong> {learned.has(String(current.lesson)) && <span className="learned-badge">✓ Đã học</span>} · {current.pages} trang · {current.focus}</p><div className="button-row"><button className="primary-button" onClick={() => { if (!open) markLearned('workbook', current.lesson, current.lesson); setOpen(!open); }}>{open ? 'Đóng tài liệu' : 'Đọc bài tập gốc'}</button><a className="secondary-button" href={url} onClick={() => markLearned('workbook', current.lesson, current.lesson)} target="_blank" rel="noreferrer">Mở toàn trang <ExternalLink size={16}/></a></div>{open && <iframe className="grammar-pdf" title={`Bài tập ngữ pháp bài ${current.lesson}`} src={url}/>}<p className="workbook-note">Tài liệu là bản quét ảnh. Các câu chưa có đáp án được xác thực sẽ dùng để tự luyện, không tính vào điểm trắc nghiệm.</p></section>;
}
