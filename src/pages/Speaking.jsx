import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Shuffle, Volume2 } from 'lucide-react';
import { speakingQuestions } from '../data/catalog';
import { cleanForTTS, renderJapaneseWithFurigana } from '../utils/japanese';
import GrammarWorkbook from '../components/GrammarWorkbook';

export default function Speaking({ progress, record }) {
  const [lesson, setLesson] = useState('all');
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [rating, setRating] = useState('');
  const recognition = useRef(null);
  const recorder = useRef(null);
  const stream = useRef(null);
  const audioRef = useRef('');
  const recordingToken = useRef(0);
  const list = speakingQuestions.filter(item => lesson === 'all' || item.lesson === Number(lesson));
  const item = list[Math.min(index, list.length - 1)];
  useEffect(() => () => {
    recognition.current?.stop();
    if (recorder.current?.state === 'recording') recorder.current.stop();
    stream.current?.getTracks().forEach(track => track.stop());
    if (audioRef.current) URL.revokeObjectURL(audioRef.current);
    window.speechSynthesis?.cancel();
  }, []);
  const clearAudio = () => { if (audioRef.current) URL.revokeObjectURL(audioRef.current); audioRef.current = ''; setAudioUrl(''); };
  const stop = () => {
    recognition.current?.stop();
    if (recorder.current?.state === 'recording') recorder.current.stop();
    stream.current?.getTracks().forEach(track => track.stop());
    setRecording(false);
  };
  const next = () => { stop(); recordingToken.current++; clearAudio(); setTranscript(''); setRating(''); setShowAnswer(false); setError(''); setIndex(current => list.length ? (current + 1) % list.length : 0); };
  const speak = text => {
    if (!window.speechSynthesis) { setError('Trình duyệt này chưa hỗ trợ phát âm.'); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanForTTS(text));
    utterance.lang = 'ja-JP'; utterance.rate = progress.settings.rate;
    window.speechSynthesis.speak(utterance);
  };
  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setError('Trình duyệt này chưa hỗ trợ ghi âm. Bạn vẫn có thể nghe và tự luyện trả lời.'); return; }
    try {
      setError(''); setTranscript(''); setRating(''); clearAudio();
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = mediaStream;
      const chunks = [];
      const token = ++recordingToken.current;
      const mediaRecorder = new MediaRecorder(mediaStream);
      recorder.current = mediaRecorder;
      mediaRecorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      mediaRecorder.onstop = () => {
        if (chunks.length && token === recordingToken.current) { const url = URL.createObjectURL(new Blob(chunks, { type: mediaRecorder.mimeType })); audioRef.current = url; setAudioUrl(url); }
        record('speaking', { id: item.id, lesson: item.lesson });
      };
      mediaRecorder.start(); setRecording(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const instance = new SpeechRecognition(); recognition.current = instance;
        instance.lang = 'ja-JP'; instance.interimResults = false; instance.maxAlternatives = 1;
        instance.onresult = event => setTranscript(event.results[0][0].transcript);
        instance.onerror = () => setError('Không thể tạo bản chép lời. Bản ghi âm vẫn có thể nghe lại.');
        try { instance.start(); } catch { setError('Không thể tạo bản chép lời. Bản ghi âm vẫn có thể nghe lại.'); }
      } else setError('Trình duyệt chưa hỗ trợ chép lời tiếng Nhật. Bạn vẫn có thể nghe lại bản ghi.');
    } catch (cause) {
      stream.current?.getTracks().forEach(track => track.stop());
      setRecording(false);
      setError(cause?.name === 'NotAllowedError' ? 'Microphone bị từ chối. Hãy cấp quyền trong trình duyệt rồi thử lại.' : 'Không thể mở microphone. Hãy kiểm tra thiết bị và thử lại.');
    }
  };
  return <>
    <div className="eyebrow">SPEAKING PRACTICE</div><h1>Tự tin nói tiếng Nhật<span className="pink">.</span></h1>
    <p className="lead">Nghe câu hỏi, tự trả lời, nghe lại bản ghi và so sánh với câu tham khảo. Bản chép lời chỉ hỗ trợ tự ôn, không chấm phát âm hay điểm thi.</p>
    <div className="toolbar"><select aria-label="Chọn bài luyện nói" value={lesson} onChange={event => { stop(); recordingToken.current++; clearAudio(); setLesson(event.target.value); setIndex(0); setTranscript(''); setShowAnswer(false); }}><option value="all">Tất cả bài</option>{[8,9,10,11].map(number => <option value={number} key={number}>Bài {number}</option>)}</select><span className="section-note">Câu {Math.min(index + 1, list.length)} / {list.length}</span></div>
    {item && <div className="speaking-layout"><div className="panel speaking-card"><div className="card-label">CÂU HỎI · BÀI {item.lesson}</div>{item.image && <img className="speaking-image" src={item.image} alt="Hình minh họa câu hỏi"/>}<h2 lang="ja">{renderJapaneseWithFurigana(item.japanese, progress.settings.furigana)}</h2><p>{item.vietnamese}</p><div className="button-row"><button className="secondary-button" onClick={() => speak(item.japanese)}><Volume2 size={18}/> Nghe câu hỏi</button><button className="secondary-button" onClick={() => setShowAnswer(!showAnswer)}>{showAnswer ? 'Ẩn' : 'Xem'} câu tham khảo</button></div>{showAnswer && <div className="reference-answer"><strong>Câu tham khảo</strong><div lang="ja">{renderJapaneseWithFurigana(item.answer, progress.settings.furigana)}</div><p>{item.answerVi}</p></div>}</div>
      <div className="panel speaking-side"><div className="mic-orb"><Mic size={32}/></div><h3>Đến lượt bạn trả lời</h3><p>Ghi âm để nghe lại. Nếu trình duyệt hỗ trợ, lời nói sẽ được chép thành chữ.</p><button className={`primary-button ${recording ? 'recording' : ''}`} onClick={recording ? stop : start}>{recording ? <MicOff size={19}/> : <Mic size={19}/>} {recording ? 'Dừng ghi' : 'Bắt đầu nói'}</button>{error && <p className="error-text" role="alert">{error}</p>}{audioUrl && <div className="transcript"><small>NGHE LẠI BẢN GHI</small><audio controls src={audioUrl} aria-label="Bản ghi câu trả lời"/><p>Bản ghi chỉ lưu tạm trong trang hiện tại.</p></div>}{transcript && <div className="transcript"><small>BẢN CHÉP LỜI</small><p lang="ja">{transcript}</p></div>}{audioUrl && <div className="self-rating"><small>TỰ ĐÁNH GIÁ</small><div className="button-row">{['Cần luyện thêm','Tạm ổn','Tự tin'].map(value => <button className={`secondary-button ${rating === value ? 'selected' : ''}`} key={value} onClick={() => { setRating(value); record('speaking-rating', { id: item.id, lesson: item.lesson, rating: value }); }}>{value}</button>)}</div></div>}<button className="text-button next-speaking" onClick={next}><Shuffle size={17}/> Câu tiếp theo</button></div></div>}
    <GrammarWorkbook lesson={lesson} title="Ôn ngữ pháp để luyện nói"/>
  </>;
}
