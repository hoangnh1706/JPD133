import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Mic, MicOff, Volume2 } from 'lucide-react';
import { imageQuestions, noImageQuestions, readingLibrary } from '../data/catalog';
import { getLearnedSet } from '../services/progress';
import { cleanForTTS, renderJapaneseWithFurigana } from '../utils/japanese';
import SpeakingTip from '../components/SpeakingTip';

const phases = ['reading', 'reading-1', 'reading-2', 'picture', 'free-1', 'free-2', 'done'];
const lessonOrder = [8, 9, 10, 11];
const getExam = index => {
  const reading = readingLibrary[index];
  const lesson = lessonOrder[index % 4];
  const pictures = imageQuestions.filter(item => item.lesson === lesson && item.qa.length);
  const free = noImageQuestions.filter(item => item.lesson === lesson);
  return { reading, lesson, picture: pictures[Math.floor(index / 4) % pictures.length], free: [free[(index * 2) % free.length], free[(index * 2 + 1) % free.length]] };
};

export default function SpeakingExam({ progress, record, markLearned }) {
  const [examIndex, setExamIndex] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(-1);
  const [prep, setPrep] = useState(20);
  const [answer, setAnswer] = useState(false);
  const [translation, setTranslation] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audio, setAudio] = useState('');
  const [error, setError] = useState('');
  const recorder = useRef(null);
  const stream = useRef(null);
  const audioRef = useRef('');
  const exam = useMemo(() => getExam(examIndex), [examIndex]);
  const phase = phases[phaseIndex];
  const learned = getLearnedSet(progress, 'speaking-exam');
  useEffect(() => {
    if (phaseIndex < 0 || phase === 'done') return;
    markLearned('speaking-exam', examIndex + 1, exam.lesson);
    if (phase.startsWith('reading')) markLearned('reading', exam.reading.id);
    if (phase === 'picture') markLearned('speaking', `i-${exam.picture.id}-0`, exam.lesson);
    if (phase === 'free-1') markLearned('speaking', `n-${exam.free[0].id}`, exam.lesson);
    if (phase === 'free-2') markLearned('speaking', `n-${exam.free[1].id}`, exam.lesson);
  }, [phase, phaseIndex, examIndex, exam.lesson, exam.reading.id, exam.picture.id, exam.free, markLearned]);
  useEffect(() => { if (phaseIndex !== -2 || prep <= 0) return; const timer = setTimeout(() => setPrep(value => value - 1), 1000); return () => clearTimeout(timer); }, [phaseIndex, prep]);
  useEffect(() => { if (phaseIndex === -2 && prep === 0) setPhaseIndex(0); }, [phaseIndex, prep]);
  useEffect(() => () => { if (recorder.current?.state === 'recording') recorder.current.stop(); stream.current?.getTracks().forEach(track => track.stop()); if (audioRef.current) URL.revokeObjectURL(audioRef.current); window.speechSynthesis?.cancel(); }, []);
  const clearAudio = () => { if (audioRef.current) URL.revokeObjectURL(audioRef.current); audioRef.current = ''; setAudio(''); };
  const next = () => { setAnswer(false); setTranslation(false); window.speechSynthesis?.cancel(); setPhaseIndex(value => value + 1); if (phaseIndex === 5) { if (recording) stopRecord(); record('speaking-exam', { exam: examIndex + 1, lesson: exam.lesson }); } };
  const restart = () => { setPhaseIndex(-1); setPrep(20); setAnswer(false); setTranslation(false); setError(''); clearAudio(); };
  const speak = text => { if (!window.speechSynthesis) { setError('Trình duyệt chưa hỗ trợ đọc tiếng Nhật.'); return; } window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(cleanForTTS(text)); utterance.lang = 'ja-JP'; utterance.rate = progress.settings.rate; window.speechSynthesis.speak(utterance); };
  const startRecord = async () => { try { if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error('Thiết bị chưa hỗ trợ ghi âm.'); clearAudio(); const media = await navigator.mediaDevices.getUserMedia({ audio: true }); stream.current = media; const chunks = []; const current = new MediaRecorder(media); recorder.current = current; current.ondataavailable = event => { if (event.data.size) chunks.push(event.data); }; current.onstop = () => { media.getTracks().forEach(track => track.stop()); if (chunks.length) { const url = URL.createObjectURL(new Blob(chunks, { type: current.mimeType })); audioRef.current = url; setAudio(url); } }; current.start(); setRecording(true); setError(''); } catch (cause) { setError(cause.message || 'Không thể mở microphone.'); } };
  const stopRecord = () => { if (recorder.current?.state === 'recording') recorder.current.stop(); stream.current?.getTracks().forEach(track => track.stop()); setRecording(false); };
  const readingQuestion = phase === 'reading-1' ? exam.reading.questions[0] : exam.reading.questions[1];
  const qa = phase === 'picture' ? exam.picture.qa[0] : phase === 'free-1' ? exam.free[0] : exam.free[1];
  return <><div className="eyebrow">SPEAKING · ĐỀ MẪU</div><h1>Luyện theo trình tự thi nói<span className="pink">.</span></h1><p className="lead">20 đề mẫu từ 16 bài đọc gốc và 4 bài luyện theo Bài 8–11. Mỗi đề: đọc 1 đoạn, trả lời 2 câu về đoạn đọc, rồi 1 câu có tranh và 2 câu không tranh. Có 20 giây chuẩn bị theo tài liệu hướng dẫn.</p><div className="panel exam-setup"><div className="form-grid"><label>Chọn đề mẫu<select value={examIndex} disabled={phaseIndex >= 0 || phaseIndex === -2} onChange={event => { setExamIndex(Number(event.target.value)); restart(); }}>{readingLibrary.map((reading, index) => <option value={index} key={reading.id}>Đề {index + 1} · {reading.title}{learned.has(String(index + 1)) ? ' · Đã học' : ''}</option>)}</select></label><div><strong>Bài ngữ pháp {exam.lesson}</strong> {learned.has(String(examIndex + 1)) && <span className="learned-badge">✓ Đã học</span>}<p className="muted">1 Reading · 2 câu hỏi · 3 Q&A</p></div></div>{phaseIndex === -1 && <button className="primary-button" onClick={() => { setPrep(20); setPhaseIndex(-2); }}>Bắt đầu đề mẫu <ArrowRight size={18}/></button>}{phaseIndex === -2 && <div className="prep-count"><strong>{prep}</strong><span>giây chuẩn bị</span><button className="secondary-button" onClick={() => setPhaseIndex(0)}>Bắt đầu ngay</button></div>}</div>{phaseIndex >= 0 && <div className="speaking-exam-layout"><div className="panel"><div className="exam-bar"><span className="pill">{phase === 'reading' ? 'PHẦN 1 · ĐỌC ĐOẠN VĂN' : phase.startsWith('reading-') ? `PHẦN 1 · CÂU ${phaseIndex}/2` : phase === 'done' ? 'HOÀN THÀNH' : `PHẦN 2 · Q&A ${phaseIndex - 2}/3`}</span><span className="muted">Đề {examIndex + 1}/{readingLibrary.length}</span></div>{phase === 'reading' && <><h2>{exam.reading.title}</h2><p className="jp-passage" lang="ja">{renderJapaneseWithFurigana(exam.reading.jp_text, progress.settings.furigana)}</p><div className="button-row"><button className="secondary-button" onClick={() => speak(exam.reading.jp_text)}><Volume2 size={17}/> Nghe mẫu</button><button className="secondary-button" onClick={() => setTranslation(!translation)}>{translation ? 'Ẩn' : 'Xem'} bản dịch</button></div>{translation && <p className="translation">{exam.reading.vi_text}</p>}</>}{phase.startsWith('reading-') && <><span className="eyebrow">TRẢ LỜI THEO ĐOẠN VĂN</span><h2 lang="ja">{renderJapaneseWithFurigana(readingQuestion.q_jp, progress.settings.furigana)}</h2><p>{readingQuestion.q_vi}</p><SpeakingTip reading question={readingQuestion.q_jp} exam/><button className="secondary-button" onClick={() => speak(readingQuestion.q_jp)}><Volume2 size={17}/> Nghe câu hỏi</button>{answer && <div className="reference-answer" lang="ja">{renderJapaneseWithFurigana(readingQuestion.a_jp, progress.settings.furigana)}</div>}</>}{['picture','free-1','free-2'].includes(phase) && <><span className="eyebrow">{phase === 'picture' ? 'CÂU HỎI CÓ TRANH' : 'CÂU HỎI KHÔNG TRANH'}</span>{phase === 'picture' && <img className="speaking-image" src={exam.picture.image} alt="Tranh cho câu hỏi thi nói"/>}<h2 lang="ja">{renderJapaneseWithFurigana(qa.q_jp, progress.settings.furigana)}</h2><p>{qa.q_vi}</p><SpeakingTip grammar={phase === 'picture' ? exam.picture.grammar : qa.grammar} question={qa.q_jp} exam/><button className="secondary-button" onClick={() => speak(qa.q_jp)}><Volume2 size={17}/> Nghe câu hỏi</button>{answer && <div className="reference-answer"><div lang="ja">{renderJapaneseWithFurigana(qa.a_jp, progress.settings.furigana)}</div><p>{qa.a_vi}</p></div>}</>}{phase === 'done' && <><h2>Đã hoàn thành đề mẫu</h2><p>Nghe lại bản ghi và tự đối chiếu câu tham khảo. Ứng dụng chưa chấm phát âm, phản xạ hoặc điểm thi nói.</p>{audio && <audio controls src={audio} aria-label="Bản ghi đề thi nói"/>}<div className="button-row"><button className="primary-button" onClick={restart}>Làm lại đề này</button><button className="secondary-button" onClick={() => { setExamIndex((examIndex + 1) % readingLibrary.length); restart(); }}>Đề tiếp theo <ArrowRight size={17}/></button></div></>}{phase !== 'done' && <div className="exam-controls">{phase !== 'reading' && <button className="secondary-button" onClick={() => setPhaseIndex(value => value - 1)}><ArrowLeft size={17}/> Trước</button>}{phase !== 'reading' && <button className="secondary-button" onClick={() => setAnswer(!answer)}>{answer ? 'Ẩn' : 'Xem'} câu tham khảo</button>}<button className="primary-button" onClick={next}>{phase === 'free-2' ? 'Hoàn thành' : 'Tiếp theo'} <ArrowRight size={17}/></button></div>}</div><aside className="panel speaking-exam-side"><h3>Ghi âm bài thi mẫu</h3><p>Ghi một lượt để nghe lại sau khi làm xong. Âm thanh chỉ nằm trên thiết bị này.</p><button className={`primary-button ${recording ? 'recording' : ''}`} onClick={recording ? stopRecord : startRecord}>{recording ? <MicOff size={18}/> : <Mic size={18}/>} {recording ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}</button>{error && <p className="error-text" role="alert">{error}</p>}{audio && <audio controls src={audio} aria-label="Bản ghi thi nói"/>}<p className="muted">Mẫu thi tham khảo dựa trên cấu trúc tài liệu, không phải đề thi chính thức.</p></aside></div>}</>;
}
