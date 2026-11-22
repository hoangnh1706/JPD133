import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Bookmark, Clock3, Flag, RotateCcw, Send } from 'lucide-react';
import { exercises } from '../data/catalog';
import { getLearnedSet } from '../services/progress';

const draftKey=userId=>`jpd133_exam_draft_v1_${userId}`;
const shuffle=list=>[...list].sort(()=>Math.random()-0.5);

export default function Practice({ mode, initialLesson='all', progress, update, record, markLearned = () => {}, go, userId }) {
  const DRAFT_KEY=draftKey(userId);
  const [lesson,setLesson]=useState(initialLesson);
  const [count,setCount]=useState(10);
  const [minutes,setMinutes]=useState(15);
  const [session,setSession]=useState(()=>{if(mode!=='mock')return null;try{const saved=JSON.parse(localStorage.getItem(DRAFT_KEY));return saved?.ids?.every(id=>exercises.some(q=>q.id===id))?saved:null;}catch{return null;}});
  const [now,setNow]=useState(Date.now());
  const [practiceIndex,setPracticeIndex]=useState(0);
  const [selected,setSelected]=useState(null);
  const [answered,setAnswered]=useState(false);
  const [confirm,setConfirm]=useState(false);
  const autoLogged=useRef(false);
  const wrongIds=useMemo(()=>{const latest=new Map();progress.events.filter(e=>e.type==='answer'||e.type==='exam-answer').forEach(e=>latest.set(e.id,e.correct));return new Set([...latest].filter(([,correct])=>!correct).map(([id])=>id));},[progress.events]);
  const pool=useMemo(()=>exercises.filter(q=>(lesson==='all'||q.lesson===Number(lesson))&&(mode!=='mistakes'||wrongIds.has(q.id))),[lesson,mode,wrongIds]);
  const learned=getLearnedSet(progress,'fe');
  const currentLearnedCount=exercises.filter(q=>learned.has(String(q.id))).length;
  const activeId=mode==='mock' ? (session?.status==='running' ? session.ids[session.index] : null) : pool[practiceIndex%Math.max(pool.length,1)]?.id;
  const activeQuestion=exercises.find(q=>q.id===activeId);
  useEffect(()=>{if(activeQuestion)markLearned('fe',activeQuestion.id,activeQuestion.lesson);},[activeQuestion,markLearned]);
  useEffect(()=>{if(mode==='mock'){if(session&&session.status==='running')localStorage.setItem(DRAFT_KEY,JSON.stringify(session));else localStorage.removeItem(DRAFT_KEY);}},[session,mode]);
  useEffect(()=>{if(!session||session.status!=='running')return;const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[session?.status]);
  const remaining=session?Math.max(0,Math.ceil((session.endsAt-now)/1000)):0;
  useEffect(()=>{if(session?.status==='running'&&remaining===0&&!autoLogged.current){autoLogged.current=true;const entries=session.ids.map(id=>{const q=exercises.find(item=>item.id===id);return {id,lesson:q.lesson,correct:session.answers[id]===q.correct_answer,answered:session.answers[id]!==undefined};});entries.filter(e=>e.answered).forEach(e=>record('exam-answer',e));record('exam',{total:entries.length,correct:entries.filter(e=>e.correct).length});setSession(s=>({...s,status:'finished',auto:true}));}},[remaining,session,record]);
  const start=()=>{const questions=shuffle(pool).slice(0,Math.min(Number(count),pool.length));if(!questions.length)return;autoLogged.current=false;setSession({ids:questions.map(q=>q.id),answers:{},flags:[],index:0,endsAt:Date.now()+Number(minutes)*60000,status:'running'});setNow(Date.now());};
  const saveAnswer=option=>setSession(s=>({...s,answers:{...s.answers,[s.ids[s.index]]:option}}));
  const finish=()=>{const entries=session.ids.map(id=>{const q=exercises.find(item=>item.id===id);return {id,lesson:q.lesson,correct:session.answers[id]===q.correct_answer,answered:session.answers[id]!==undefined};});entries.filter(e=>e.answered).forEach(e=>record('exam-answer',e));record('exam',{total:entries.length,correct:entries.filter(e=>e.correct).length});setSession(s=>({...s,status:'finished'}));setConfirm(false);};
  if(mode==='mock')return <>{!session?<><div className="eyebrow">THI THỬ · MÔ PHỎNG TỰ LUYỆN</div><h1>Thi thử theo nhịp của bạn<span className="pink">.</span></h1><p className="lead">Chọn cách viết Kanji đúng cho từ được đánh dấu trong câu tiếng Nhật. Số câu và thời gian do bạn tự đặt; đây không phải quy định thi chính thức.</p><div className="panel exam-setup"><h2>Thiết lập bài luyện</h2><div className="form-grid"><label>Bài học<select value={lesson} onChange={e=>setLesson(e.target.value)}><option value="all">Tất cả bài</option>{Array.from({length:11},(_,i)=><option key={i} value={i+1}>Bài {i+1}</option>)}</select></label><label>Số câu<input type="number" min="1" max={pool.length} value={count} onChange={e=>setCount(e.target.value)}/></label><label>Thời gian (phút)<input type="number" min="1" max="180" value={minutes} onChange={e=>setMinutes(e.target.value)}/></label></div><p className="muted">{pool.length} câu có thể chọn. Bài làm được lưu tạm trên thiết bị này.</p><button className="primary-button" disabled={!pool.length||Number(count)<1||Number(minutes)<1} onClick={start}>Bắt đầu thi thử <ArrowRight size={18}/></button></div></>:session.status==='running'?<div className="exam-layout"><div className="panel exam-main-card"><div className="exam-bar"><span className="pill">TIẾN ĐỘ: {session.index+1}/{session.ids.length}</span>{learned.has(String(activeId)) && <span className="learned-badge">✓ Đã học</span>}<strong className={remaining<60?'time-warning':''}><Clock3 size={18}/> {Math.floor(remaining/60)}:{String(remaining%60).padStart(2,'0')}</strong></div><Question question={exercises.find(q=>q.id===session.ids[session.index])} questionNumber={session.index+1} selected={session.answers[session.ids[session.index]]} onSelect={saveAnswer} showFeedback={false}/><div className="exam-controls"><button className="secondary-button" disabled={session.index===0} onClick={()=>setSession(s=>({...s,index:s.index-1}))}><ArrowLeft size={17}/> Trước</button><button className="secondary-button" onClick={()=>setSession(s=>({...s,flags:s.flags.includes(s.ids[s.index])?s.flags.filter(id=>id!==s.ids[s.index]):[...s.flags,s.ids[s.index]]}))}><Flag size={17}/> {session.flags.includes(session.ids[session.index])?'Bỏ cờ':'Đánh dấu'}</button><button className="primary-button" disabled={session.index===session.ids.length-1} onClick={()=>setSession(s=>({...s,index:s.index+1}))}>Tiếp <ArrowRight size={17}/></button></div></div><div className="panel exam-nav"><h3>Điều hướng câu hỏi</h3><div className="question-grid">{session.ids.map((id,i)=><button key={id} className={`${session.index===i?'current':''} ${session.answers[id]!==undefined?'has-answer':''} ${session.flags.includes(id)?'flagged':''} ${learned.has(String(id))?'learned-question':''}`} onClick={()=>setSession(s=>({...s,index:i}))} aria-label={`Câu ${i+1}${learned.has(String(id))?', đã học':''}${session.answers[id]!==undefined?', đã trả lời':''}`}>{i+1}</button>)}</div><button className="primary-button full" onClick={()=>setConfirm(true)}><Send size={18}/> Nộp bài</button>{confirm&&<div className="confirm-box" role="dialog" aria-label="Xác nhận nộp bài"><p>Bạn đã trả lời {Object.keys(session.answers).length}/{session.ids.length} câu. Nộp bài ngay?</p><button className="primary-button" onClick={finish}>Xác nhận nộp</button><button className="text-button" onClick={()=>setConfirm(false)}>Tiếp tục làm</button></div>}</div></div>:<Results session={session} go={go} restart={()=>setSession(null)}/> }</>;
  const question=pool[practiceIndex%Math.max(pool.length,1)];
  return <><div className="eyebrow">{mode==='mistakes'?'ÔN CÂU SAI':'FINAL EXAM PRACTICE'}</div><h1>{mode==='mistakes'?'Xem lại để nhớ lâu':'Luyện từng câu, hiểu từng đáp án'}<span className="pink">.</span></h1><p className="lead">Chọn cách viết Kanji đúng cho từ được đánh dấu trong câu tiếng Nhật. Giải thích hiển thị ngay sau khi bạn chọn.</p><div className="toolbar"><select aria-label="Chọn bài" value={lesson} onChange={e=>{setLesson(e.target.value);setPracticeIndex(0);setAnswered(false);setSelected(null);}}><option value="all">Tất cả bài</option>{Array.from({length:11},(_,i)=><option key={i} value={i+1}>Bài {i+1}</option>)}</select><span className="section-note">{pool.length} câu · Câu {question?practiceIndex%pool.length+1:0} · Đã học {currentLearnedCount}/{exercises.length}</span></div>{question?<div className="panel practice-panel"><div className="practice-head"><div className="practice-head-meta"><span className="pill">BÀI {question.lesson}</span>{learned.has(String(question.id)) && <span className="learned-badge">✓ Đã học</span>}</div><button className="icon-button" aria-label="Lưu câu hỏi" onClick={()=>update({bookmarks:progress.bookmarks.includes(question.id)?progress.bookmarks.filter(id=>id!==question.id):[...progress.bookmarks,question.id]})}><Bookmark size={19} fill={progress.bookmarks.includes(question.id)?'currentColor':'none'}/></button></div><Question question={question} questionNumber={practiceIndex%pool.length+1} selected={selected} onSelect={option=>{if(answered)return;setSelected(option);setAnswered(true);record('answer',{id:question.id,lesson:question.lesson,correct:option===question.correct_answer});}} showFeedback={answered}/><div className="exam-controls"><span className="muted">Câu luyện FE · mã {question.id}</span><button className="primary-button" onClick={()=>{setPracticeIndex(i=>i+1);setSelected(null);setAnswered(false);}}>Câu tiếp theo <ArrowRight size={18}/></button></div></div>:<div className="empty-state"><RotateCcw size={28}/><h3>Chưa có câu cần ôn</h3><p>Hãy làm câu FE để tạo danh sách câu sai.</p><button className="primary-button" onClick={()=>go('/practice')}>Bắt đầu luyện FE</button></div>}</>;
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
            {question.explanation && <p>{question.explanation}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
function Results({session,go,restart}) {const rows=session.ids.map(id=>({q:exercises.find(item=>item.id===id),answer:session.answers[id]}));const correct=rows.filter(({q,answer})=>answer===q.correct_answer).length;return <div className="panel results"><span className="eyebrow">KẾT QUẢ THI THỬ</span><h2>{correct}/{rows.length} câu đúng</h2><p>{session.auto?'Hết thời gian. Bài thi thử đã tự kết thúc.':'Bạn đã hoàn thành bài thi thử.'} Tỉ lệ đúng: {Math.round(correct/rows.length*100)}%.</p><div className="button-row"><button className="primary-button" onClick={restart}>Làm đề khác</button><button className="secondary-button" onClick={()=>go('/mistakes')}>Ôn câu sai</button></div><h3>Xem lại đáp án</h3>{rows.map(({q,answer},i)=><div className="result-row" key={q.id}><strong>Câu {i+1} · Bài {q.lesson}</strong><p>{q.question}</p><small>{answer===undefined?'Chưa trả lời':answer===q.correct_answer?'Đúng':'Sai'} · Bạn chọn: {answer??'—'} · Đáp án: {q.correct_answer}</small><p>{q.explanation}</p></div>)}</div>}

