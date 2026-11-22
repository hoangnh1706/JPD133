import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Mic, MicOff, Shuffle, Volume2 } from 'lucide-react';
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

export default function SpeakingExam({ progress, record, markLearned = () => {} }) {
  const [tab, setTab] = useState('exam'); // 'exam' | 'picture' | 'no-image'
  const [examIndex, setExamIndex] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(-1);
  const [prep, setPrep] = useState(20);
  const [showQuestion, setShowQuestion] = useState(false);
  const [answer, setAnswer] = useState(false);
  const [translation, setTranslation] = useState(false);

  // Luyện có tranh
  const [picLesson, setPicLesson] = useState('all');
  const [picIndex, setPicIndex] = useState(0);
  const [picShowQ, setPicShowQ] = useState({});
  const [picShowA, setPicShowA] = useState({});

  // Luyện không tranh (2 câu / 1 lượt)
  const [noImgLesson, setNoImgLesson] = useState('all');
  const [turnIndex, setTurnIndex] = useState(0);
  const [randomPair, setRandomPair] = useState(null);
  const [noImgShowQ, setNoImgShowQ] = useState([false, false]);
  const [noImgShowA, setNoImgShowA] = useState([false, false]);

  // Ghi âm chung
  const [recording, setRecording] = useState(false);
  const [audio, setAudio] = useState('');
  const [error, setError] = useState('');
  const recorder = useRef(null);
  const stream = useRef(null);
  const audioRef = useRef('');

  const exam = useMemo(() => getExam(examIndex), [examIndex]);
  const phase = phases[phaseIndex];
  const learned = getLearnedSet(progress, 'speaking-exam');
  const learnedSpeaking = getLearnedSet(progress, 'speaking');

  const picList = useMemo(
    () => imageQuestions.filter(item => (picLesson === 'all' || item.lesson === Number(picLesson)) && item.qa?.length),
    [picLesson]
  );
  const currentPic = picList[picIndex % Math.max(picList.length, 1)];

  const noImgList = useMemo(
    () => noImageQuestions.filter(item => noImgLesson === 'all' || item.lesson === Number(noImgLesson)),
    [noImgLesson]
  );
  const currentPair = useMemo(() => {
    if (!noImgList.length) return [];
    if (randomPair && randomPair.length) return randomPair;
    const first = noImgList[(turnIndex * 2) % noImgList.length];
    const second = noImgList.length > 1 ? noImgList[(turnIndex * 2 + 1) % noImgList.length] : null;
    return second && second.id !== first.id ? [first, second] : [first];
  }, [noImgList, turnIndex, randomPair]);

  useEffect(() => {
    if (tab !== 'exam' || phaseIndex < 0 || phase === 'done') return;
    markLearned('speaking-exam', examIndex + 1, exam.lesson);
    if (phase.startsWith('reading')) markLearned('reading', exam.reading.id);
    if (phase === 'picture') markLearned('speaking', `i-${exam.picture.id}-0`, exam.lesson);
    if (phase === 'free-1') markLearned('speaking', `n-${exam.free[0].id}`, exam.lesson);
    if (phase === 'free-2') markLearned('speaking', `n-${exam.free[1].id}`, exam.lesson);
  }, [tab, phase, phaseIndex, examIndex, exam.lesson, exam.reading.id, exam.picture.id, exam.free, markLearned]);

  useEffect(() => {
    if (tab === 'picture' && currentPic) {
      markLearned('speaking', `i-${currentPic.id}-0`, currentPic.lesson);
    }
  }, [tab, currentPic, markLearned]);

  useEffect(() => {
    if (tab === 'no-image' && currentPair.length) {
      currentPair.forEach(q => markLearned('speaking', `n-${q.id}`, q.lesson));
    }
  }, [tab, currentPair, markLearned]);

  useEffect(() => { if (phaseIndex !== -2 || prep <= 0) return; const timer = setTimeout(() => setPrep(value => value - 1), 1000); return () => clearTimeout(timer); }, [phaseIndex, prep]);
  useEffect(() => { if (phaseIndex === -2 && prep === 0) setPhaseIndex(0); }, [phaseIndex, prep]);
  useEffect(() => () => { if (recorder.current?.state === 'recording') recorder.current.stop(); stream.current?.getTracks().forEach(track => track.stop()); if (audioRef.current) URL.revokeObjectURL(audioRef.current); window.speechSynthesis?.cancel(); }, []);

  const clearAudio = () => { if (audioRef.current) URL.revokeObjectURL(audioRef.current); audioRef.current = ''; setAudio(''); };
  const speak = text => {
    if (!window.speechSynthesis) { setError('Trình duyệt chưa hỗ trợ đọc tiếng Nhật.'); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanForTTS(text));
    utterance.lang = 'ja-JP';
    utterance.rate = progress?.settings?.rate ?? 1;
    window.speechSynthesis.speak(utterance);
  };
  const startRecord = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error('Thiết bị chưa hỗ trợ ghi âm.');
      clearAudio();
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = media;
      const chunks = [];
      const current = new MediaRecorder(media);
      recorder.current = current;
      current.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      current.onstop = () => {
        media.getTracks().forEach(track => track.stop());
        if (chunks.length) {
          const url = URL.createObjectURL(new Blob(chunks, { type: current.mimeType }));
          audioRef.current = url;
          setAudio(url);
        }
      };
      current.start();
      setRecording(true);
      setError('');
    } catch (cause) { setError(cause.message || 'Không thể mở microphone.'); }
  };
  const stopRecord = () => {
    if (recorder.current?.state === 'recording') recorder.current.stop();
    stream.current?.getTracks().forEach(track => track.stop());
    setRecording(false);
  };

  const switchTab = nextTab => {
    window.speechSynthesis?.cancel();
    if (recording) stopRecord();
    clearAudio();
    setError('');
    setTab(nextTab);
  };

  const next = () => {
    setShowQuestion(false);
    setAnswer(false);
    setTranslation(false);
    window.speechSynthesis?.cancel();
    setPhaseIndex(value => value + 1);
    if (phaseIndex === 5) {
      if (recording) stopRecord();
      record('speaking-exam', { exam: examIndex + 1, lesson: exam.lesson });
    }
  };
  const prev = () => {
    setShowQuestion(false);
    setAnswer(false);
    setTranslation(false);
    window.speechSynthesis?.cancel();
    setPhaseIndex(value => value - 1);
  };
  const restart = () => {
    setPhaseIndex(-1);
    setPrep(20);
    setShowQuestion(false);
    setAnswer(false);
    setTranslation(false);
    setError('');
    clearAudio();
  };

  const nextPic = offset => {
    window.speechSynthesis?.cancel();
    setPicShowQ({});
    setPicShowA({});
    setPicIndex(i => (i + offset + picList.length) % picList.length);
  };

  const nextTurn = offset => {
    window.speechSynthesis?.cancel();
    setRandomPair(null);
    setNoImgShowQ([false, false]);
    setNoImgShowA([false, false]);
    const totalTurns = Math.max(1, Math.ceil(noImgList.length / 2));
    setTurnIndex(i => (i + offset + totalTurns) % totalTurns);
  };

  const shuffleTurn = () => {
    window.speechSynthesis?.cancel();
    if (noImgList.length <= 2) {
      setRandomPair(null);
    } else {
      const pool = [...noImgList].sort(() => Math.random() - 0.5);
      setRandomPair([pool[0], pool[1]]);
    }
    setNoImgShowQ([false, false]);
    setNoImgShowA([false, false]);
  };

  const furigana = progress?.settings?.furigana ?? true;
  const readingQuestion = phase === 'reading-1' ? exam.reading.questions[0] : exam.reading.questions[1];
  const qa = phase === 'picture' ? exam.picture.qa[0] : phase === 'free-1' ? exam.free[0] : exam.free[1];

  return <>
    <div className="eyebrow">SPEAKING · ÔN THI NÓI JPD133</div>
    <h1>Luyện thi nói như thi thật<span className="pink">.</span></h1>
    <p className="lead">Nghe âm thanh câu hỏi trước khi trả lời (ẩn chữ câu hỏi mặc định như thi thật). Bao gồm đề mẫu đầy đủ, luyện tranh cô Na / tài liệu (102 tranh) và luyện câu hỏi không tranh 2 câu/lượt.</p>

    <div className="toolbar" style={{ marginBottom: 20 }}>
      <div className="segmented" role="tablist" aria-label="Chế độ luyện nói">
        <button role="tab" aria-selected={tab === 'exam'} className={tab === 'exam' ? 'selected' : ''} onClick={() => switchTab('exam')}>Đề mẫu đầy đủ (20 đề)</button>
        <button role="tab" aria-selected={tab === 'picture'} className={tab === 'picture' ? 'selected' : ''} onClick={() => switchTab('picture')}>Luyện Có Tranh ({imageQuestions.length} tranh)</button>
        <button role="tab" aria-selected={tab === 'no-image'} className={tab === 'no-image' ? 'selected' : ''} onClick={() => switchTab('no-image')}>Câu hỏi Không Tranh (2 câu/lượt)</button>
      </div>
    </div>

    {tab === 'exam' && <>
      <div className="panel exam-setup">
        <div className="form-grid">
          <label>Chọn đề mẫu
            <select value={examIndex} disabled={phaseIndex >= 0 || phaseIndex === -2} onChange={event => { setExamIndex(Number(event.target.value)); restart(); }}>
              {readingLibrary.map((reading, index) => <option value={index} key={reading.id}>Đề {index + 1} · {reading.title}{learned.has(String(index + 1)) ? ' · Đã học' : ''}</option>)}
            </select>
          </label>
          <div>
            <strong>Bài ngữ pháp {exam.lesson}</strong> {learned.has(String(examIndex + 1)) && <span className="learned-badge">✓ Đã học</span>}
            <p className="muted">1 Reading · 2 câu hỏi · 1 Tranh · 2 Câu không tranh</p>
          </div>
        </div>
        {phaseIndex === -1 && <button className="primary-button" onClick={() => { setPrep(20); setPhaseIndex(-2); }}>Bắt đầu đề mẫu <ArrowRight size={18}/></button>}
        {phaseIndex === -2 && <div className="prep-count"><strong>{prep}</strong><span>giây chuẩn bị</span><button className="secondary-button" onClick={() => setPhaseIndex(0)}>Bắt đầu ngay</button></div>}
      </div>

      {phaseIndex >= 0 && <div className="speaking-exam-layout">
        <div className="panel">
          <div className="exam-bar">
            <span className="pill">{phase === 'reading' ? 'PHẦN 1 · ĐỌC ĐOẠN VĂN' : phase.startsWith('reading-') ? `PHẦN 1 · CÂU ${phaseIndex}/2` : phase === 'done' ? 'HOÀN THÀNH' : `PHẦN 2 · Q&A ${phaseIndex - 2}/3`}</span>
            <span className="muted">Đề {examIndex + 1}/{readingLibrary.length}</span>
          </div>

          {phase === 'reading' && <>
            <h2>{exam.reading.title}</h2>
            <p className="jp-passage" lang="ja">{renderJapaneseWithFurigana(exam.reading.jp_text, furigana)}</p>
            <div className="button-row">
              <button className="secondary-button" onClick={() => speak(exam.reading.jp_text)}><Volume2 size={17}/> Nghe mẫu</button>
              <button className="secondary-button" onClick={() => setTranslation(!translation)}>{translation ? 'Ẩn' : 'Xem'} bản dịch</button>
            </div>
            {translation && <p className="translation">{exam.reading.vi_text}</p>}
          </>}

          {phase.startsWith('reading-') && <>
            <span className="eyebrow">TRẢ LỜI THEO ĐOẠN VĂN</span>
            <p className="muted">Bấm nghe câu hỏi và tự trả lời như thi thật.</p>
            <div className="button-row">
              <button className="primary-button" onClick={() => speak(readingQuestion.q_jp)}><Volume2 size={17}/> Nghe câu hỏi</button>
              <button className="secondary-button" onClick={() => setShowQuestion(!showQuestion)}>{showQuestion ? <EyeOff size={17}/> : <Eye size={17}/>} {showQuestion ? 'Ẩn chữ câu hỏi' : 'Hiện chữ câu hỏi'}</button>
            </div>
            {showQuestion && <>
              <h2 lang="ja" style={{ marginTop: 16 }}>{renderJapaneseWithFurigana(readingQuestion.q_jp, furigana)}</h2>
              <p>{readingQuestion.q_vi}</p>
              <SpeakingTip reading question={readingQuestion.q_jp} exam/>
            </>}
            {answer && <div className="reference-answer" lang="ja">{renderJapaneseWithFurigana(readingQuestion.a_jp, furigana)}</div>}
          </>}

          {['picture','free-1','free-2'].includes(phase) && <>
            <span className="eyebrow">{phase === 'picture' ? 'CÂU HỎI CÓ TRANH' : 'CÂU HỎI KHÔNG TRANH'}</span>
            {phase === 'picture' && <img className="speaking-image" src={exam.picture.image} alt="Tranh cho câu hỏi thi nói"/>}
            <p className="muted" style={{ marginTop: 10 }}>Bấm nghe câu hỏi rồi trả lời trực tiếp.</p>
            <div className="button-row">
              <button className="primary-button" onClick={() => speak(qa.q_jp)}><Volume2 size={17}/> Nghe câu hỏi</button>
              <button className="secondary-button" onClick={() => setShowQuestion(!showQuestion)}>{showQuestion ? <EyeOff size={17}/> : <Eye size={17}/>} {showQuestion ? 'Ẩn chữ câu hỏi' : 'Hiện chữ câu hỏi'}</button>
            </div>
            {showQuestion && <>
              <h2 lang="ja" style={{ marginTop: 16 }}>{renderJapaneseWithFurigana(qa.q_jp, furigana)}</h2>
              <p>{qa.q_vi}</p>
              <SpeakingTip grammar={phase === 'picture' ? exam.picture.grammar : qa.grammar} question={qa.q_jp} exam/>
            </>}
            {answer && <div className="reference-answer"><div lang="ja">{renderJapaneseWithFurigana(qa.a_jp, furigana)}</div><p>{qa.a_vi}</p></div>}
          </>}

          {phase === 'done' && <>
            <h2>Đã hoàn thành đề mẫu</h2>
            <p>Nghe lại bản ghi và tự đối chiếu câu tham khảo.</p>
            {audio && <audio controls src={audio} aria-label="Bản ghi đề thi nói"/>}
            <div className="button-row">
              <button className="primary-button" onClick={restart}>Làm lại đề này</button>
              <button className="secondary-button" onClick={() => { setExamIndex((examIndex + 1) % readingLibrary.length); restart(); }}>Đề tiếp theo <ArrowRight size={17}/></button>
            </div>
          </>}

          {phase !== 'done' && <div className="exam-controls">
            {phase !== 'reading' && <button className="secondary-button" onClick={prev}><ArrowLeft size={17}/> Trước</button>}
            {phase !== 'reading' && <button className="secondary-button" onClick={() => setAnswer(!answer)}>{answer ? 'Ẩn' : 'Xem'} câu trả lời mẫu</button>}
            <button className="primary-button" onClick={next}>{phase === 'free-2' ? 'Hoàn thành' : 'Tiếp theo'} <ArrowRight size={17}/></button>
          </div>}
        </div>

        <aside className="panel speaking-exam-side">
          <h3>Ghi âm bài thi mẫu</h3>
          <p>Ghi một lượt để nghe lại sau khi làm xong. Âm thanh chỉ nằm trên thiết bị này.</p>
          <button className={`primary-button ${recording ? 'recording' : ''}`} onClick={recording ? stopRecord : startRecord}>{recording ? <MicOff size={18}/> : <Mic size={18}/>} {recording ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}</button>
          {error && <p className="error-text" role="alert">{error}</p>}
          {audio && <audio controls src={audio} aria-label="Bản ghi thi nói"/>}
          <p className="muted">Câu hỏi được ẩn chữ mặc định để bạn luyện nghe và phản xạ giống khi thi thật.</p>
        </aside>
      </div>}
    </>}

    {tab === 'picture' && currentPic && <>
      <div className="toolbar">
        <select aria-label="Lọc theo bài" value={picLesson} onChange={e => { setPicLesson(e.target.value); setPicIndex(0); setPicShowQ({}); setPicShowA({}); }}>
          <option value="all">Tất cả tranh ({imageQuestions.length} tranh)</option>
          {lessonOrder.map(l => <option key={l} value={l}>Bài {l}</option>)}
        </select>
        <select aria-label="Chọn tranh" value={picIndex % picList.length} onChange={e => { setPicIndex(Number(e.target.value)); setPicShowQ({}); setPicShowA({}); }}>
          {picList.map((item, idx) => (
            <option key={item.id} value={idx}>Tranh {idx + 1} · Bài {item.lesson} ({item.qa.length} câu){learnedSpeaking.has(`i-${item.id}-0`) ? ' · Đã học' : ''}</option>
          ))}
        </select>
        <span className="section-note">Tranh {(picIndex % picList.length) + 1}/{picList.length}</span>
      </div>

      <div className="speaking-exam-layout">
        <div className="panel">
          <div className="exam-bar">
            <span className="pill">TRANH #{currentPic.id} · BÀI {currentPic.lesson}</span>
            {learnedSpeaking.has(`i-${currentPic.id}-0`) && <span className="learned-badge">✓ Đã học</span>}
          </div>

          <div style={{ textAlign: 'center', margin: '12px 0 20px' }}>
            <img className="speaking-image" style={{ maxHeight: 340 }} src={currentPic.image} alt={`Tranh luyện nói số ${currentPic.id}`}/>
          </div>

          <div className="speaking-qa-list">
            {currentPic.qa.map((itemQa, qIdx) => {
              const isQShown = !!picShowQ[qIdx];
              const isAShown = !!picShowA[qIdx];
              return (
                <div className="speaking-qa-box" key={qIdx}>
                  <div className="speaking-qa-head">
                    <strong>Câu hỏi {qIdx + 1}</strong>
                    <div className="button-row" style={{ marginTop: 0 }}>
                      <button className="primary-button" onClick={() => speak(itemQa.q_jp)}><Volume2 size={17}/> Nghe câu hỏi</button>
                      <button className="secondary-button" onClick={() => setPicShowQ(s => ({ ...s, [qIdx]: !s[qIdx] }))}>
                        {isQShown ? <EyeOff size={17}/> : <Eye size={17}/>} {isQShown ? 'Ẩn chữ' : 'Hiện chữ câu hỏi'}
                      </button>
                      <button className="secondary-button" onClick={() => setPicShowA(s => ({ ...s, [qIdx]: !s[qIdx] }))}>
                        {isAShown ? 'Ẩn câu trả lời mẫu' : 'Xem câu trả lời mẫu'}
                      </button>
                    </div>
                  </div>
                  {isQShown && (
                    <div className="speaking-q-reveal">
                      <h3 lang="ja">{renderJapaneseWithFurigana(itemQa.q_jp, furigana)}</h3>
                      <p className="muted">{itemQa.q_vi}</p>
                    </div>
                  )}
                  {isAShown && (
                    <div className="reference-answer">
                      <div lang="ja">{renderJapaneseWithFurigana(itemQa.a_jp, furigana)}</div>
                      <p>{itemQa.a_vi}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="exam-controls">
            <button className="secondary-button" onClick={() => nextPic(-1)}><ArrowLeft size={17}/> Tranh trước</button>
            <button className="primary-button" onClick={() => nextPic(1)}>Tranh tiếp theo <ArrowRight size={17}/></button>
          </div>
        </div>

        <aside className="panel speaking-exam-side">
          <h3>Ghi âm trả lời tranh</h3>
          <p>Nhìn tranh, bấm nghe từng câu hỏi và nói câu trả lời của bạn. Có thể thu âm để tự kiểm tra phát âm.</p>
          <button className={`primary-button ${recording ? 'recording' : ''}`} onClick={recording ? stopRecord : startRecord}>{recording ? <MicOff size={18}/> : <Mic size={18}/>} {recording ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}</button>
          {error && <p className="error-text" role="alert">{error}</p>}
          {audio && <audio controls src={audio} aria-label="Bản ghi luyện tranh"/>}
          <p className="muted">Mặc định ẩn chữ câu hỏi để luyện phản xạ nghe giống phòng thi thật.</p>
        </aside>
      </div>
    </>}

    {tab === 'no-image' && currentPair.length > 0 && <>
      <div className="toolbar">
        <select aria-label="Lọc câu hỏi theo bài" value={noImgLesson} onChange={e => { setNoImgLesson(e.target.value); setTurnIndex(0); setRandomPair(null); setNoImgShowQ([false, false]); setNoImgShowA([false, false]); }}>
          <option value="all">Tất cả câu Cô Na ({noImageQuestions.length} câu)</option>
          {lessonOrder.map(l => <option key={l} value={l}>Bài {l}</option>)}
        </select>
        <button className="secondary-button" onClick={shuffleTurn}><Shuffle size={16}/> Bốc ngẫu nhiên 2 câu</button>
        <span className="section-note">Lượt {randomPair ? 'Ngẫu nhiên' : `${(turnIndex % Math.max(1, Math.ceil(noImgList.length / 2))) + 1}/${Math.max(1, Math.ceil(noImgList.length / 2))}`} · 2 câu / lượt</span>
      </div>

      <div className="speaking-exam-layout">
        <div className="panel">
          <div className="exam-bar">
            <span className="pill">LUYỆN CÂU HỎI KHÔNG TRANH · 2 CÂU / LƯỢT</span>
            <span className="muted">Nguồn: Ôn tập Cô Na (Bài 8–11)</span>
          </div>

          <div className="speaking-qa-list">
            {currentPair.map((qItem, idx) => {
              const isQShown = noImgShowQ[idx];
              const isAShown = noImgShowA[idx];
              return (
                <div className="speaking-qa-box" key={qItem.id}>
                  <div className="speaking-qa-head">
                    <div>
                      <span className="pill">CÂU {idx + 1} · BÀI {qItem.lesson}</span>
                      {learnedSpeaking.has(`n-${qItem.id}`) && <span className="learned-badge" style={{ marginLeft: 8 }}>✓ Đã học</span>}
                    </div>
                    <div className="button-row" style={{ marginTop: 0 }}>
                      <button className="primary-button" onClick={() => speak(qItem.q_jp)}><Volume2 size={17}/> Nghe câu {idx + 1}</button>
                      <button className="secondary-button" onClick={() => setNoImgShowQ(s => s.map((v, i) => i === idx ? !v : v))}>
                        {isQShown ? <EyeOff size={17}/> : <Eye size={17}/>} {isQShown ? 'Ẩn chữ' : 'Hiện chữ câu hỏi'}
                      </button>
                      <button className="secondary-button" onClick={() => setNoImgShowA(s => s.map((v, i) => i === idx ? !v : v))}>
                        {isAShown ? 'Ẩn câu trả lời mẫu' : 'Xem câu trả lời mẫu'}
                      </button>
                    </div>
                  </div>
                  {isQShown && (
                    <div className="speaking-q-reveal">
                      <h3 lang="ja">{renderJapaneseWithFurigana(qItem.q_jp, furigana)}</h3>
                      <p className="muted">{qItem.q_vi}</p>
                      <SpeakingTip grammar={qItem.grammar} question={qItem.q_jp} exam/>
                    </div>
                  )}
                  {isAShown && (
                    <div className="reference-answer">
                      <div lang="ja">{renderJapaneseWithFurigana(qItem.a_jp, furigana)}</div>
                      <p>{qItem.a_vi}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="exam-controls">
            <button className="secondary-button" onClick={() => nextTurn(-1)}><ArrowLeft size={17}/> Lượt trước</button>
            <button className="primary-button" onClick={() => nextTurn(1)}>Lượt 2 câu tiếp theo <ArrowRight size={17}/></button>
          </div>
        </div>

        <aside className="panel speaking-exam-side">
          <h3>Ghi âm lượt 2 câu</h3>
          <p>Nghe câu 1 trả lời, sau đó nghe câu 2 và trả lời tiếp giống đúng quy trình thi vấn đáp.</p>
          <button className={`primary-button ${recording ? 'recording' : ''}`} onClick={recording ? stopRecord : startRecord}>{recording ? <MicOff size={18}/> : <Mic size={18}/>} {recording ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}</button>
          {error && <p className="error-text" role="alert">{error}</p>}
          {audio && <audio controls src={audio} aria-label="Bản ghi luyện không tranh"/>}
          <p className="muted">Chữ câu hỏi được ẩn mặc định để luyện khả năng nghe hiểu.</p>
        </aside>
      </div>
    </>}
  </>;
}
