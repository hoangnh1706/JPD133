import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Volume2 } from 'lucide-react';
import { readingLibrary } from '../data/catalog';
import { getLearnedSet } from '../services/progress';
import { cleanForTTS, renderJapaneseWithFurigana } from '../utils/japanese';
import { getReadingVocabulary } from '../utils/readingVocabulary';

function WordGroup({ title, words }) {
  if (!words.length) return null;
  return <div className="reading-word-group"><h3>{title} <small>{words.length} từ</small></h3><div className="reading-word-grid">{words.map(item =>
    <div className="reading-word" key={item.word}><strong lang="ja">{item.word}</strong><span lang="ja">{item.reading}</span><span>{item.meaning}</span><small>Bài {item.lesson}</small></div>
  )}</div></div>;
}

export default function Reading({ progress, record, markLearned = () => {} }) {
  const [id, setId] = useState(1);
  const [translation, setTranslation] = useState(false);
  const [answers, setAnswers] = useState(false);
  const [audioError, setAudioError] = useState('');
  const item = readingLibrary.find(reading => reading.id === id) || readingLibrary[0];
  const learned = getLearnedSet(progress, 'reading');
  const finished = new Set(progress.events.filter(event => event.type === 'reading').map(event => String(event.id)));
  const vocabulary = getReadingVocabulary(item);
  useEffect(() => { markLearned('reading', item.id, item.lesson); }, [item, markLearned]);

  const select = nextId => { setId(nextId); setTranslation(false); setAnswers(false); setAudioError(''); window.speechSynthesis?.cancel(); };
  const move = offset => {
    if (offset > 0 && !finished.has(String(item.id))) record('reading', { id: item.id, lesson: item.lesson });
    const index = readingLibrary.findIndex(reading => reading.id === item.id);
    select(readingLibrary[(index + offset + readingLibrary.length) % readingLibrary.length].id);
  };
  const speak = text => {
    if (!window.speechSynthesis) { setAudioError('Trình duyệt không hỗ trợ phát âm. Hãy thử trình duyệt khác.'); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanForTTS(text));
    utterance.lang = 'ja-JP';
    utterance.rate = progress.settings.rate;
    utterance.onerror = event => { if (event.error !== 'canceled') setAudioError('Không phát được âm thanh. Hãy kiểm tra âm lượng hoặc thử trình duyệt khác.'); };
    setAudioError('');
    window.speechSynthesis.speak(utterance);
  };
  const questionCard = (question, index) => <div className="reading-question" key={index}>
    <span className="pill">Câu {index + 1}</span>
    <button className="secondary-button" onClick={() => speak(question.q_jp)} aria-label={`Nghe câu hỏi ${index + 1}`}><Volume2 size={17}/> Nghe câu hỏi {index + 1}</button>
    {answers && <div className="reference-answer" lang="ja">{renderJapaneseWithFurigana(question.a_jp, progress.settings.furigana)}</div>}
  </div>;

  return <><div className="eyebrow">ĐỌC HIỂU JPD133</div>
    <h1>Đọc và hiểu từng đoạn<span className="pink">.</span></h1>
    <p className="lead">{readingLibrary.length} bài đọc, gồm văn bản gốc và các bài luyện Bài 8–11 có nhiều từ Katakana, Kanji trong phạm vi từng bài. Mỗi bài có câu hỏi theo mẫu thi Speaking.</p>
    <div className="toolbar"><select aria-label="Chọn bài đọc" value={id} onChange={event => select(Number(event.target.value))}>
      <optgroup label="Bài luyện theo Bài 8–11">{readingLibrary.filter(reading => reading.lesson).map(reading => <option key={reading.id} value={reading.id}>{reading.title}{learned.has(String(reading.id)) ? ' · Đã học' : ''}</option>)}</optgroup>
      <optgroup label="Bài đọc từ tài liệu gốc">{readingLibrary.filter(reading => !reading.lesson).map(reading => <option key={reading.id} value={reading.id}>{reading.title}{learned.has(String(reading.id)) ? ' · Đã học' : ''}</option>)}</optgroup>
    </select><span className="section-note">{learned.size}/{readingLibrary.length} bài đã học</span></div>
    <div className="reading-layout"><article className="panel reading-passage">
      <span className="pill">BÀI ĐỌC {item.id}</span> {item.lesson && <span className="pill">TỪ VỰNG BÀI {item.lesson}</span>} {learned.has(String(item.id)) && <span className="learned-badge">✓ Đã học</span>}
      <h2>{item.title}</h2><p className="jp-passage" lang="ja">{renderJapaneseWithFurigana(item.jp_text, progress.settings.furigana)}</p>
      <div className="button-row"><button className="secondary-button" onClick={() => speak(item.jp_text)}><Volume2 size={17}/> Nghe đọc</button><button className="secondary-button" onClick={() => setTranslation(!translation)}>{translation ? 'Ẩn' : 'Xem'} bản dịch</button></div>
      {audioError && <p className="error-text" role="alert">{audioError}</p>}
      {translation && <p className="translation">{item.vi_text}</p>}
    </article><aside className="panel"><span className="eyebrow">READING · 2 CÂU HỎI</span><h3>Nghe câu hỏi theo mẫu thi</h3><p className="muted">Nghe và tự trả lời trước khi xem đáp án. Nội dung câu hỏi không hiển thị bằng chữ.</p>
      {item.questions.slice(0, 2).map(questionCard)}
      {item.questions.length > 2 && <details className="reading-extra"><summary>{item.questions.length - 2} câu luyện thêm</summary>{item.questions.slice(2).map((question, index) => questionCard(question, index + 2))}</details>}
      <button className="secondary-button" onClick={() => setAnswers(!answers)}>{answers ? 'Ẩn' : 'Xem'} đáp án</button>
      <div className="button-row"><button className="secondary-button" onClick={() => move(-1)}><ArrowLeft size={17}/> Bài trước</button><button className="primary-button" onClick={() => move(1)}>Đã đọc · bài tiếp <ArrowRight size={17}/></button></div>
    </aside></div>
    {(vocabulary.katakana.length > 0 || vocabulary.kanji.length > 0) && <section className="panel reading-glossary"><span className="eyebrow">TỪ CẦN CHÚ Ý</span><h2>Đọc từ lạ trong bài</h2><p className="muted">Xem cách đọc và nghĩa của những từ nằm trong phạm vi Bài 8–11.</p><WordGroup title="Katakana" words={vocabulary.katakana}/><WordGroup title="Kanji" words={vocabulary.kanji}/></section>}
  </>;
}
