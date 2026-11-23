import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Bookmark, Check, Clock3, Flag, RotateCcw, Send } from 'lucide-react';
import { allFeExercises as exercises } from '../data/catalog';
import ssgExams from '../data/ssg105_exams.json';
import { addMistake, getMistakes, removeMistake } from '../services/mistakes';
import { getLearnedSet } from '../services/progress';

const allSsgQuestions = ssgExams.flatMap(ex => ex.questions);

const draftKey=userId=>`jpd133_exam_draft_v1_${userId}`;
const practiceKey=(userId,mode)=>`jpd133_fe_practice_v1_${userId}_${mode}`;
const loadSavedPractice=(userId,mode)=>{try{return JSON.parse(localStorage.getItem(practiceKey(userId,mode)))||{};}catch{return {};}};
const shuffle=list=>[...list].sort(()=>Math.random()-0.5);

export default function Practice({ mode, initialLesson='all', progress, update, record, markLearned = () => {}, go, userId }) {
  const DRAFT_KEY=draftKey(userId);
  const PRACTICE_KEY=practiceKey(userId,mode);
  const savedPractice=useMemo(()=>loadSavedPractice(userId,mode),[userId,mode]);
  const [lesson,setLesson]=useState(initialLesson !== 'all' ? initialLesson : (savedPractice.lesson || 'all'));
  const [category,setCategory]=useState(savedPractice.category || 'all');
  const [count,setCount]=useState(10);
  const [minutes,setMinutes]=useState(15);
  const [session,setSession]=useState(()=>{if(mode!=='mock')return null;try{const saved=JSON.parse(localStorage.getItem(DRAFT_KEY));return saved?.ids?.every(id=>exercises.some(q=>q.id===id))?saved:null;}catch{return null;}});
  const [now,setNow]=useState(Date.now());
  const [practiceIndex,setPracticeIndex]=useState(Number(savedPractice.practiceIndex || 0));
  const [practiceAnswers,setPracticeAnswers]=useState(()=>savedPractice.answers || {});
  const [confirm,setConfirm]=useState(false);
  const autoLogged=useRef(false);
  const wrongIds=useMemo(()=>{const latest=new Map();progress.events.filter(e=>e.type==='answer'||e.type==='exam-answer').forEach(e=>latest.set(e.id,e.correct));return new Set([...latest].filter(([,correct])=>!correct).map(([id])=>id));},[progress.events]);

  // Mistakes mode state (separated JPD133 & SSG105)
  const [mistakeTab, setMistakeTab] = useState('jpd'); // 'jpd' | 'ssg'
  const [jpdMistakeIds, setJpdMistakeIds] = useState(() => {
    const stored = getMistakes('jpd');
    if (stored.length > 0 || localStorage.getItem('jpd133_mistakes_v1_jpd') !== null) return stored;
    const seeded = [...wrongIds];
    seeded.forEach(id => addMistake('jpd', id));
    return seeded;
  });
  const [ssgMistakeIds, setSsgMistakeIds] = useState(() => getMistakes('ssg'));
  const [mistakeIndex, setMistakeIndex] = useState(0);
  const [mistakeAnswers, setMistakeAnswers] = useState({});
  const pool=useMemo(()=>exercises.filter(q=>{
    if (lesson !== 'all' && q.lesson !== Number(lesson)) return false;
    if (category === 'fe-format' && q.id < 20000) return false;
    if (category === 'kanji-only' && q.id >= 20000 && q.category !== 'Kanji') return false;
    if (['Ngữ pháp & Trợ từ', 'Từ vựng & Hội thoại', 'Đọc hiểu'].includes(category) && q.category !== category) return false;
    if (mode === 'mistakes' && !wrongIds.has(q.id)) return false;
    return true;
  }),[lesson,category,mode,wrongIds]);
  const learned=getLearnedSet(progress,'fe');
  const currentLearnedCount=exercises.filter(q=>learned.has(String(q.id))).length;
  const activeId=mode==='mock' ? (session?.status==='running' ? session.ids[session.index] : null) : pool[practiceIndex%Math.max(pool.length,1)]?.id;
  const activeQuestion=exercises.find(q=>q.id===activeId);
  useEffect(()=>{if(activeQuestion)markLearned('fe',activeQuestion.id,activeQuestion.lesson);},[activeQuestion,markLearned]);
  useEffect(()=>{if(mode==='mock'){if(session&&session.status==='running')localStorage.setItem(DRAFT_KEY,JSON.stringify(session));else localStorage.removeItem(DRAFT_KEY);}},[session,mode]);
  useEffect(()=>{if(mode!=='mock'){try{localStorage.setItem(PRACTICE_KEY,JSON.stringify({lesson,category,practiceIndex,answers:practiceAnswers}));}catch{}}},[mode,PRACTICE_KEY,lesson,category,practiceIndex,practiceAnswers]);
  useEffect(()=>{if(!session||session.status!=='running')return;const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[session?.status]);
  const remaining=session?Math.max(0,Math.ceil((session.endsAt-now)/1000)):0;
  useEffect(()=>{if(session?.status==='running'&&remaining===0&&!autoLogged.current){autoLogged.current=true;const entries=session.ids.map(id=>{const q=exercises.find(item=>item.id===id);return {id,lesson:q.lesson,correct:session.answers[id]===q.correct_answer,answered:session.answers[id]!==undefined};});entries.filter(e=>e.answered).forEach(e=>record('exam-answer',e));record('exam',{total:entries.length,correct:entries.filter(e=>e.correct).length});setSession(s=>({...s,status:'finished',auto:true}));}},[remaining,session,record]);
  const start=()=>{const questions=shuffle(pool).slice(0,Math.min(Number(count),pool.length));if(!questions.length)return;autoLogged.current=false;setSession({ids:questions.map(q=>q.id),answers:{},flags:[],index:0,endsAt:Date.now()+Number(minutes)*60000,status:'running'});setNow(Date.now());};
  const saveAnswer=option=>setSession(s=>({...s,answers:{...s.answers,[s.ids[s.index]]:option}}));
  const finish=()=>{const entries=session.ids.map(id=>{const q=exercises.find(item=>item.id===id);return {id,lesson:q.lesson,correct:session.answers[id]===q.correct_answer,answered:session.answers[id]!==undefined};});entries.filter(e=>e.answered).forEach(e=>record('exam-answer',e));record('exam',{total:entries.length,correct:entries.filter(e=>e.correct).length});setSession(s=>({...s,status:'finished'}));setConfirm(false);};
  if(mode==='mock')return <>{!session?<><div className="eyebrow">THI THỬ · MÔ PHỎNG TỰ LUYỆN</div><h1>Thi thử theo nhịp của bạn<span className="pink">.</span></h1><p className="lead">Chọn cách viết Kanji đúng cho từ được đánh dấu trong câu tiếng Nhật. Số câu và thời gian do bạn tự đặt; đây không phải quy định thi chính thức.</p><div className="panel exam-setup"><h2>Thiết lập bài luyện</h2><div className="form-grid"><label>Bài học<select value={lesson} onChange={e=>setLesson(e.target.value)}><option value="all">Tất cả bài</option>{Array.from({length:11},(_,i)=><option key={i} value={i+1}>Bài {i+1}</option>)}</select></label><label>Số câu<input type="number" min="1" max={pool.length} value={count} onChange={e=>setCount(e.target.value)}/></label><label>Thời gian (phút)<input type="number" min="1" max="180" value={minutes} onChange={e=>setMinutes(e.target.value)}/></label></div><p className="muted">{pool.length} câu có thể chọn. Bài làm được lưu tạm trên thiết bị này.</p><button className="primary-button" disabled={!pool.length||Number(count)<1||Number(minutes)<1} onClick={start}>Bắt đầu thi thử <ArrowRight size={18}/></button></div></>:session.status==='running'?<div className="exam-layout"><div className="panel exam-main-card"><div className="exam-bar"><span className="pill">TIẾN ĐỘ: {session.index+1}/{session.ids.length}</span>{learned.has(String(activeId)) && <span className="learned-badge">✓ Đã học</span>}<strong className={remaining<60?'time-warning':''}><Clock3 size={18}/> {Math.floor(remaining/60)}:{String(remaining%60).padStart(2,'0')}</strong></div><Question question={exercises.find(q=>q.id===session.ids[session.index])} questionNumber={session.index+1} selected={session.answers[session.ids[session.index]]} onSelect={saveAnswer} showFeedback={false}/><div className="exam-controls"><button className="secondary-button" disabled={session.index===0} onClick={()=>setSession(s=>({...s,index:s.index-1}))}><ArrowLeft size={17}/> Trước</button><button className="secondary-button" onClick={()=>setSession(s=>({...s,flags:s.flags.includes(s.ids[s.index])?s.flags.filter(id=>id!==s.ids[s.index]):[...s.flags,s.ids[s.index]]}))}><Flag size={17}/> {session.flags.includes(session.ids[session.index])?'Bỏ cờ':'Đánh dấu'}</button><button className="primary-button" disabled={session.index===session.ids.length-1} onClick={()=>setSession(s=>({...s,index:s.index+1}))}>Tiếp <ArrowRight size={17}/></button></div></div><div className="panel exam-nav"><h3>Điều hướng câu hỏi</h3><div className="question-grid">{session.ids.map((id,i)=><button key={id} className={`${session.index===i?'current':''} ${session.answers[id]!==undefined?'has-answer':''} ${session.flags.includes(id)?'flagged':''} ${learned.has(String(id))?'learned-question':''}`} onClick={()=>setSession(s=>({...s,index:i}))} aria-label={`Câu ${i+1}${learned.has(String(id))?', đã học':''}${session.answers[id]!==undefined?', đã trả lời':''}`}>{i+1}</button>)}</div><button className="primary-button full" onClick={()=>setConfirm(true)}><Send size={18}/> Nộp bài</button>{confirm&&<div className="confirm-box" role="dialog" aria-label="Xác nhận nộp bài"><p>Bạn đã trả lời {Object.keys(session.answers).length}/{session.ids.length} câu. Nộp bài ngay?</p><button className="primary-button" onClick={finish}>Xác nhận nộp</button><button className="text-button" onClick={()=>setConfirm(false)}>Tiếp tục làm</button></div>}</div></div>:<Results session={session} go={go} restart={()=>setSession(null)}/> }</>;
  if(mode==='mistakes') {
    const jpdList = exercises.filter(q => jpdMistakeIds.includes(q.id));
    const ssgList = allSsgQuestions.filter(q => ssgMistakeIds.includes(q.id));
    const activeList = mistakeTab === 'jpd' ? jpdList : ssgList;
    const safeIdx = activeList.length ? mistakeIndex % activeList.length : 0;
    const q = activeList[safeIdx];
    const mKey = `${mistakeTab}_${q?.id}`;
    const chosen = q ? mistakeAnswers[mKey] : undefined;
    const isAnswered = chosen !== undefined;

    const handleRemembered = () => {
      if (!q) return;
      const updated = removeMistake(mistakeTab, q.id);
      if (mistakeTab === 'jpd') setJpdMistakeIds(updated);
      else setSsgMistakeIds(updated);
      setMistakeAnswers(prev => {
        const copy = { ...prev };
        delete copy[mKey];
        return copy;
      });
      setMistakeIndex(idx => (updated.length ? idx % updated.length : 0));
    };

    return (
      <>
        <div className="eyebrow">ÔN CÂU SAI</div>
        <h1>Xem lại câu sai để nhớ lâu<span className="pink">.</span></h1>
        <p className="lead">Tổng hợp các câu bạn từng chọn sai. Bấm <strong>Đã nhớ</strong> sau khi ôn xong để ẩn câu đó khỏi danh sách.</p>

        <div className="toolbar">
          <div className="segmented" role="tablist" aria-label="Chọn môn ôn câu sai">
            <button
              role="tab"
              aria-selected={mistakeTab === 'jpd'}
              className={mistakeTab === 'jpd' ? 'selected' : ''}
              onClick={() => { setMistakeTab('jpd'); setMistakeIndex(0); }}
            >
              JPD133 ({jpdList.length} câu sai)
            </button>
            <button
              role="tab"
              aria-selected={mistakeTab === 'ssg'}
              className={mistakeTab === 'ssg' ? 'selected' : ''}
              onClick={() => { setMistakeTab('ssg'); setMistakeIndex(0); }}
            >
              SSG105 ({ssgList.length} câu sai)
            </button>
          </div>
          {q && <span className="section-note">Câu {safeIdx + 1}/{activeList.length}</span>}
        </div>

        {q ? (
          <div className="panel practice-panel">
            <div className="practice-head">
              <div className="practice-head-meta">
                <span className="pill">
                  {mistakeTab === 'jpd' ? `JPD133 · BÀI ${q.lesson}${q.category ? ` · ${q.category.toUpperCase()}` : ''}` : `SSG105 · ĐỀ ${q.examId} · ${q.unit}`}
                </span>
              </div>
              <button
                type="button"
                className="primary-button"
                style={{ minHeight: 38, padding: '0 14px', background: '#10b981', boxShadow: 'none' }}
                onClick={handleRemembered}
              >
                <Check size={17} /> Đã nhớ
              </button>
            </div>

            <Question
              question={q}
              questionNumber={safeIdx + 1}
              selected={chosen}
              onSelect={option => {
                if (isAnswered) return;
                setMistakeAnswers(prev => ({ ...prev, [mKey]: option }));
              }}
              showFeedback={isAnswered}
            />

            <div className="exam-controls">
              <button
                type="button"
                className="secondary-button"
                disabled={activeList.length <= 1}
                onClick={() => setMistakeIndex(i => (i - 1 + activeList.length) % activeList.length)}
              >
                <ArrowLeft size={18} /> Câu trước
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleRemembered}
              >
                <Check size={17} /> Đã nhớ (Xóa khỏi danh sách)
              </button>
              <button
                type="button"
                className="primary-button"
                disabled={activeList.length <= 1}
                onClick={() => setMistakeIndex(i => (i + 1) % activeList.length)}
              >
                Câu tiếp theo <ArrowRight size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <RotateCcw size={28} />
            <h3>Chưa có câu sai nào ở mục {mistakeTab === 'jpd' ? 'JPD133' : 'SSG105'}</h3>
            <p>Khi bạn làm sai câu hỏi ở phần Luyện FE {mistakeTab === 'jpd' ? 'JPD133' : 'SSG105'}, câu đó sẽ tự động được lưu vào đây để bạn ôn lại.</p>
            <button className="primary-button" onClick={() => go(mistakeTab === 'jpd' ? '/practice' : '/ssg')}>
              {mistakeTab === 'jpd' ? 'Bắt đầu luyện FE JPD133' : 'Bắt đầu luyện FE SSG105'}
            </button>
          </div>
        )}
      </>
    );
  }
  const question=pool[practiceIndex%Math.max(pool.length,1)];
  const currentSelected = question ? practiceAnswers[question.id] : undefined;
  const currentAnswered = currentSelected !== undefined;
  return <><div className="eyebrow">FINAL EXAM PRACTICE</div><h1>Luyện đề thi FE tổng hợp<span className="pink">.</span></h1><p className="lead">Bao gồm 114 câu đề thi FE thực tế (Ngữ pháp, Từ vựng, Trợ từ, Đọc hiểu, Kanji) và 66 câu ôn Kanji Bài 1–11.</p><div className="toolbar"><select aria-label="Chọn dạng câu hỏi" value={category} onChange={e=>{setCategory(e.target.value);setPracticeIndex(0);}}><option value="all">Tất cả ({exercises.length} câu)</option><option value="fe-format">Đề FE Format tổng hợp (114 câu)</option><option value="Ngữ pháp & Trợ từ">Ngữ pháp & Trợ từ</option><option value="Từ vựng & Hội thoại">Từ vựng & Hội thoại</option><option value="Đọc hiểu">Đọc hiểu FE</option><option value="kanji-only">Kanji</option></select><select aria-label="Chọn bài" value={lesson} onChange={e=>{setLesson(e.target.value);setPracticeIndex(0);}}><option value="all">Tất cả bài</option>{Array.from({length:11},(_,i)=><option key={i} value={i+1}>Bài {i+1}</option>)}</select><button type="button" className="secondary-button" onClick={()=>{setPracticeAnswers({});setPracticeIndex(0);}}><RotateCcw size={16}/> Làm lại</button><span className="section-note">{pool.length} câu · Câu {question?practiceIndex%pool.length+1:0} · Đã học {currentLearnedCount}/{exercises.length}</span></div>{question?<div className="panel practice-panel"><div className="practice-head"><div className="practice-head-meta"><span className="pill">BÀI {question.lesson}{question.category ? ` · ${question.category.toUpperCase()}` : ''}</span>{learned.has(String(question.id)) && <span className="learned-badge">✓ Đã học</span>}</div><button className="icon-button" aria-label="Lưu câu hỏi" onClick={()=>update({bookmarks:progress.bookmarks.includes(question.id)?progress.bookmarks.filter(id=>id!==question.id):[...progress.bookmarks,question.id]})}><Bookmark size={19} fill={progress.bookmarks.includes(question.id)?'currentColor':'none'}/></button></div><Question question={question} questionNumber={practiceIndex%pool.length+1} selected={currentSelected} onSelect={option=>{if(currentAnswered)return;setPracticeAnswers(prev=>({...prev,[question.id]:option}));if(option!==question.correct_answer){setJpdMistakeIds(addMistake('jpd',question.id));}record('answer',{id:question.id,lesson:question.lesson,correct:option===question.correct_answer});}} showFeedback={currentAnswered}/><div className="exam-controls"><button className="secondary-button" disabled={pool.length <= 1} onClick={()=>setPracticeIndex(i=>(i-1+pool.length)%pool.length)}><ArrowLeft size={18}/> Câu trước</button><button className="primary-button" disabled={pool.length <= 1} onClick={()=>setPracticeIndex(i=>(i+1)%pool.length)}>Câu tiếp theo <ArrowRight size={18}/></button></div></div>:<div className="empty-state"><RotateCcw size={28}/><h3>Chưa có câu hỏi phù hợp</h3><p>Hãy thử chọn bài học hoặc dạng câu hỏi khác.</p></div>}</>;
}
function displayQuestion(value) {
  if (!value) return '';
  return value
    .replaceAll('$rightarrow$', '→')
    .replaceAll('【', '「')
    .replaceAll('】', '」');
}
function Question({question,questionNumber=1,selected,onSelect,showFeedback}) {
  if (!question) return null;
  return (
    <div className="eos-card">
      <div className="eos-header">
        <span className="eos-blue-accent" />
        <h2 className="eos-title">Câu {questionNumber}</h2>
      </div>
      <div className="eos-body">
        <p className="eos-instruction">(Choose 1 answer)</p>
        <div className="eos-question-prompt" lang="ja">
          {displayQuestion(question.question)}
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
                <span className="eos-text" lang="ja">{option}</span>
              </button>
            );
          })}
        </div>
        {showFeedback && (
          <div className={`feedback ${selected === question.correct_answer ? 'good' : 'bad'}`} role="status">
            <strong>{selected === question.correct_answer ? 'Chính xác!' : 'Cần ôn lại'}</strong>
            <p>Đáp án đúng: {question.correct_answer}</p>
            {question.explanation && <p style={{ whiteSpace: 'pre-line', marginTop: 6 }}>{question.explanation}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
function Results({session,go,restart}) {const rows=session.ids.map(id=>({q:exercises.find(item=>item.id===id),answer:session.answers[id]}));const correct=rows.filter(({q,answer})=>answer===q.correct_answer).length;return <div className="panel results"><span className="eyebrow">KẾT QUẢ THI THỬ</span><h2>{correct}/{rows.length} câu đúng</h2><p>{session.auto?'Hết thời gian. Bài thi thử đã tự kết thúc.':'Bạn đã hoàn thành bài thi thử.'} Tỉ lệ đúng: {Math.round(correct/rows.length*100)}%.</p><div className="button-row"><button className="primary-button" onClick={restart}>Làm đề khác</button><button className="secondary-button" onClick={()=>go('/mistakes')}>Ôn câu sai</button></div><h3>Xem lại đáp án</h3>{rows.map(({q,answer},i)=><div className="result-row" key={q.id}><strong>Câu {i+1} · Bài {q.lesson}</strong><p>{q.question}</p><small>{answer===undefined?'Chưa trả lời':answer===q.correct_answer?'Đúng':'Sai'} · Bạn chọn: {answer??'—'} · Đáp án: {q.correct_answer}</small><p>{q.explanation}</p></div>)}</div>}

