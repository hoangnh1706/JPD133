import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { BookOpen, LayoutDashboard, Mic, GraduationCap, Layers3, ChartNoAxesCombined, Settings, Menu, X, BookText, Sparkles, RotateCcw, House, Languages } from 'lucide-react';
import { loadProgress, KEY, markLearned as addLearned, recordEvent } from './services/progress';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import GrammarWorkbook from './components/GrammarWorkbook';
import './styles/app.css';
import './styles/refinement.css';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Lessons = lazy(() => import('./pages/Lessons'));
const Vocabulary = lazy(() => import('./pages/Vocabulary'));
const Kanji = lazy(() => import('./pages/Kanji'));
const Grammar = lazy(() => import('./pages/Grammar'));
const Reading = lazy(() => import('./pages/Reading'));
const Speaking = lazy(() => import('./pages/Speaking'));
const SpeakingExam = lazy(() => import('./pages/SpeakingExam'));
const Practice = lazy(() => import('./pages/Practice'));
const Progress = lazy(() => import('./pages/Progress'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const LegacyApp = lazy(() => import('./LegacyApp'));

const nav = [
  ['/', 'Tổng quan', LayoutDashboard], ['/lessons', 'Bài học', BookOpen], ['/vocabulary', 'Từ vựng', Layers3], ['/kanji', 'Ôn chữ Hán', Languages],
  ['/grammar', 'Ngữ pháp', BookText], ['/reading', 'Đọc hiểu', BookOpen], ['/speaking', 'Luyện nói', Mic], ['/speaking-exam', 'Đề mẫu Speaking', Mic], ['/practice', 'Luyện FE', GraduationCap],
  ['/mock', 'Thi thử', Sparkles], ['/mistakes', 'Ôn câu sai', RotateCcw], ['/progress', 'Tiến độ', ChartNoAxesCombined], ['/settings', 'Cài đặt', Settings], ['/legacy', 'Kho luyện gốc', BookOpen], ['/landing', 'Giới thiệu', House]
];
const urlFor = path => path === '/landing' ? '/nihongo' : path === '/' ? '/nihongo/dashboard' : `/nihongo${path}`;
const readRoute = () => {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (path === '/nihongo') return '/landing';
  if (path === '/nihongo/dashboard') return '/';
  if (path.startsWith('/nihongo/')) return path.slice('/nihongo'.length) + window.location.search;
  return '/landing';
};

export default function App() {
  const [route, setRoute] = useState(readRoute);
  const [mobile, setMobile] = useState(false);
  const [progress, setProgress] = useState(loadProgress);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [progressReady, setProgressReady] = useState(false);
  const [saveError, setSaveError] = useState('');
  useEffect(() => {
    if (window.location.hash.startsWith('#/')) { const old = window.location.hash.slice(1); window.history.replaceState({}, '', urlFor(old)); setRoute(readRoute()); }
    else if (window.location.pathname === '/') { window.history.replaceState({}, '', '/nihongo'); setRoute('/landing'); }
    const change = () => { setRoute(readRoute()); setMobile(false); };
    window.addEventListener('popstate', change);
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (data?.user) {
          setUser(data.user);
          setProgress(data.progress);
          setProgressReady(true);
        }
      })
      .catch(() => {})
      .finally(() => setAuthReady(true));
    return () => window.removeEventListener('popstate', change);
  }, []);
  useEffect(() => { if (!user || !progressReady) return; const timer = setTimeout(() => { fetch('/api/progress', { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(progress) }).then(response => { if (!response.ok) throw new Error(); setSaveError(''); }).catch(() => setSaveError('Chưa lưu được tiến độ. Vui lòng kiểm tra kết nối.')); }, 450); return () => clearTimeout(timer); }, [progress, progressReady, user]);
  useEffect(() => { if (authReady && !user) localStorage.setItem(KEY, JSON.stringify(progress)); }, [progress, authReady, user]);
  useEffect(() => { document.documentElement.dataset.theme = progress.settings.theme; document.documentElement.dataset.sakura = progress.settings.sakura ? 'on' : 'off'; document.documentElement.dataset.sakuraIntensity = progress.settings.sakuraIntensity; }, [progress.settings.theme, progress.settings.sakura, progress.settings.sakuraIntensity]);
  const go = path => { window.history.pushState({}, '', urlFor(path)); setRoute(path); setMobile(false); window.scrollTo(0, 0); };
  const signedIn = data => { setUser(data.user); setProgress(data.progress); setProgressReady(true); setSaveError(''); go('/'); };
  const logout = async () => { await fetch('/api/progress', { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(progress) }).catch(() => {}); await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: '{}' }); setUser(null); setProgress(loadProgress()); setProgressReady(false); go('/landing'); };
  const record = (type, detail) => setProgress(current => recordEvent(current, type, detail));
  const markLearned = useCallback((section, id, lesson) => setProgress(current => addLearned(current, section, id, lesson)), []);
  const update = patch => setProgress(current => ({ ...current, ...patch }));
  const baseRoute = route.split('?')[0];
  const active = nav.find(([path]) => path === baseRoute)?.[1] || 'Bài học';
  if (baseRoute === '/landing') return <Landing user={user}/>;
  if (baseRoute === '/login' || baseRoute === '/register') return <Auth mode={baseRoute.slice(1)} onSuccess={signedIn} go={go}/>;
  return <div className="app-shell">
    <a className="app-skip" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>Đến nội dung chính</a>
    <aside className={`app-sidebar ${mobile ? 'open' : ''}`}>
      <div className="brand"><span className="brand-mark">桜</span><span><strong>JPD133</strong><small>Japanese learning space</small></span><button className="icon-button mobile-close" onClick={() => setMobile(false)} aria-label="Đóng menu"><X size={20}/></button></div>
      <div className="nav-label">HỌC TẬP</div>
      <nav aria-label="Điều hướng chính">{nav.map(([path, label, Icon]) => <a key={path} href={urlFor(path)} className={baseRoute === path ? 'active' : ''} onClick={event => { event.preventDefault(); go(path); }}><Icon size={19}/>{label}</a>)}</nav>
      <div className="sidebar-foot"><div className="sakura-icon">✿</div><strong>Mỗi ngày một chút</strong><p>Học đều đặn, ghi nhớ lâu hơn.</p></div>
    </aside>
    {mobile && <button className="mobile-shade" aria-label="Đóng menu" onClick={() => setMobile(false)}/>}
    <div className="app-content"><header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMobile(true)} aria-label="Mở menu"><Menu size={22}/></button><div className="breadcrumb">JPD133 <span>/</span> <strong>{active}</strong></div><div className="top-actions"><span className="study-dot"/> {user ? <>{user.name} <button className="text-button" onClick={logout}>Đăng xuất</button></> : <>Khách <button className="text-button" onClick={() => go('/login')}>Đăng nhập</button> <button className="text-button" onClick={() => go('/register')}>Đăng ký</button></>}</div></header>
      {saveError && <div className="save-error" role="alert">{saveError}</div>}
      <main id="main-content" tabIndex={-1} className="main-area"><Suspense fallback={<div className="page-loading" role="status">Đang mở nội dung học…</div>}>
        {route === '/' && <Dashboard progress={progress} go={go} user={user}/>}
        {route.startsWith('/lessons') && <Lessons progress={progress} record={record} markLearned={markLearned} go={go} route={route}/>}
        {route === '/vocabulary' && <Vocabulary progress={progress} update={update} record={record} markLearned={markLearned}/>}
        {baseRoute === '/kanji' && <Kanji key={route} initialLesson={new URLSearchParams(route.split('?')[1] || '').get('lesson') || 'all'} progress={progress} record={record} markLearned={markLearned}/>}
        {route === '/grammar' && <Grammar progress={progress} record={record} markLearned={markLearned}/>}
        {route === '/reading' && <Reading progress={progress} record={record} markLearned={markLearned}/>}
        {route === '/speaking' && <Speaking progress={progress} record={record} markLearned={markLearned}/>}
        {route === '/speaking-exam' && <SpeakingExam progress={progress} record={record} markLearned={markLearned}/>}
        {['/practice','/mock','/mistakes'].includes(baseRoute) && <><Practice key={route} mode={baseRoute.slice(1)} initialLesson={new URLSearchParams(route.split('?')[1] || '').get('lesson') || 'all'} progress={progress} update={update} record={record} markLearned={markLearned} go={go} userId={user?.id || 'guest'}/><GrammarWorkbook progress={progress} markLearned={markLearned} lesson={new URLSearchParams(route.split('?')[1] || '').get('lesson') || 'all'} title="Ôn ngữ pháp cho bài FE"/></>}
        {route === '/progress' && <Progress progress={progress} go={go} user={user}/>}
        {route === '/settings' && <SettingsPage progress={progress} update={update} user={user}/>}
        {route === '/legacy' && <LegacyApp/>}
      </Suspense></main>
    </div>
  </div>;
}
