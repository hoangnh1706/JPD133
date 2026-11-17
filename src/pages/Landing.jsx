import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, Check, ChevronRight, Flower2, GraduationCap, Layers3, Menu, Mic2, Volume2, X } from 'lucide-react';
import { landingCounts, landingLessons } from '../data/landingMeta';
import '../styles/landing.css';

const YEAR = new Date().getFullYear();

const features = [
  { icon: BookOpen, label: 'BÀI HỌC', title: 'Học đúng phần bạn cần', description: 'Bài 1–11 được sắp xếp theo chủ đề, có từ vựng và câu luyện đi cùng.', href: '/nihongo/lessons', number: '01' },
  { icon: Mic2, label: 'SPEAKING', title: 'Tập nói thành thói quen', description: 'Nghe câu hỏi, ghi âm câu trả lời và nghe lại theo nhịp của riêng bạn.', href: '/nihongo/speaking', number: '02' },
  { icon: GraduationCap, label: 'FE PRACTICE', title: 'Luyện tập có lời giải', description: 'Trả lời câu trắc nghiệm, hiểu đáp án và quay lại những câu làm sai.', href: '/nihongo/practice', number: '03' },
  { icon: Layers3, label: 'TỪ VỰNG', title: 'Nhớ từ theo từng ngày', description: 'Lật flashcard, nghe phát âm và đánh dấu từ cần ôn lại.', href: '/nihongo/vocabulary', number: '04' },
];

const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });

export default function Landing({ user }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [audioError, setAudioError] = useState('');
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  const speak = value => {
    if (!window.speechSynthesis) { setAudioError('Trình duyệt này chưa hỗ trợ phát âm.'); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(value);
    utterance.lang = 'ja-JP'; utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
    setAudioError('');
  };
  return <div className="landing-page">
    <a className="landing-skip" href="#landing-main" onClick={event => { event.preventDefault(); document.getElementById('landing-main')?.focus(); scrollTo('landing-main'); }}>Đến nội dung chính</a>
    <header className="landing-header">
      <a href="/nihongo" className="landing-brand" aria-label="JPD133 - Trang giới thiệu"><span className="landing-brand-icon"><Flower2 size={23} strokeWidth={1.8}/></span><span>JPD<span>133</span><small>JAPANESE LEARNING SPACE</small></span></a>
      <nav className={`landing-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Điều hướng trang giới thiệu">
        <button onClick={() => { scrollTo('landing-features'); setMenuOpen(false); }}>Khám phá</button>
        <button onClick={() => { scrollTo('landing-lessons'); setMenuOpen(false); }}>Lộ trình</button>
        <button onClick={() => { scrollTo('landing-method'); setMenuOpen(false); }}>Cách học</button>
        {!user && <a href="/nihongo/login" onClick={() => setMenuOpen(false)}>Đăng nhập</a>}
        {!user && <a href="/nihongo/register" onClick={() => setMenuOpen(false)}>Đăng ký</a>}
        <a href="/nihongo/dashboard" className="landing-nav-cta" onClick={() => setMenuOpen(false)}>Vào học ngay <ArrowUpRight size={16}/></a>
      </nav>
      <button className="landing-menu-button" type="button" aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={23}/> : <Menu size={23}/>}</button>
    </header>
    <main id="landing-main" tabIndex={-1}>
      <section className="landing-hero" aria-labelledby="landing-hero-title">
        <div className="landing-hero-copy">
          <div className="landing-overline"><span className="landing-overline-line"/> KHÔNG GIAN TỰ HỌC TIẾNG NHẬT</div>
          <h1 id="landing-hero-title">Mỗi ngày một chút.<br/><em>Gần hơn với tiếng Nhật.</em></h1>
          <p>Học từ vựng, ôn chữ Hán, luyện nói và ôn FE trên một hành trình rõ ràng. Bắt đầu từ bài bạn đang học, lưu lại tiến độ và quay về ôn đúng chỗ cần thiết.</p>
          <div className="landing-hero-actions"><a className="landing-primary-link" href="/nihongo/dashboard">Bắt đầu học <ArrowRight size={18}/></a><button className="landing-outline-link" onClick={() => scrollTo('landing-features')}>Khám phá cách học <ChevronRight size={18}/></button></div>
          <div className="landing-hero-note"><Check size={16}/> Dùng ngay không cần đăng nhập · có thể tạo tài khoản sau</div>
        </div>
        <div className="landing-hero-visual" aria-label="Xem trước bài luyện Speaking và từ vựng JPD133">
          <div className="landing-visual-orbit orbit-one"/><div className="landing-visual-orbit orbit-two"/>
          <span className="landing-visual-kanji" aria-hidden="true">学</span>
          <div className="landing-preview-card">
            <div className="landing-preview-top"><span><span className="landing-preview-dot"/> BÀI 08 · SPEAKING</span><Mic2 size={18}/></div>
            <div className="landing-preview-label">CÂU HỎI HÔM NAY</div>
            <p lang="ja">おとうさん/おかあさんは どこで はたらいて いますか。</p>
            <span className="landing-preview-meaning">Bố / Mẹ của bạn đang làm việc ở đâu?</span>
            <button className="landing-sound" onClick={() => speak('おとうさん、おかあさんはどこではたらいていますか。')} aria-label="Nghe câu hỏi mẫu"><Volume2 size={17}/> Nghe câu hỏi</button>
          </div>
          <div className="landing-word-card"><div><small>TỪ VỰNG</small><strong lang="ja">私 <span>わたし</span></strong><span>Tôi</span></div><button onClick={() => speak('わたし')} aria-label="Nghe từ 私"><Volume2 size={18}/></button></div>
          {audioError && <p className="landing-audio-error" role="alert">{audioError}</p>}
          <span className="landing-hero-flower flower-one" aria-hidden="true"><Flower2 size={27}/></span><span className="landing-hero-flower flower-two" aria-hidden="true"><Flower2 size={17}/></span>
        </div>
      </section>
      <section className="landing-proof" aria-label="Nội dung học tập hiện có"><div className="landing-proof-inner"><p>Nội dung hiện có trong dự án</p><div><strong>{landingCounts.vocabulary}</strong><span>mục từ vựng</span></div><div><strong>{landingCounts.exercises}</strong><span>câu ôn tập FE</span></div><div><strong>{landingCounts.speaking}</strong><span>câu luyện nói</span></div><div><strong>{landingCounts.readings}</strong><span>bài đọc hiểu</span></div></div></section>
      <section id="landing-features" className="landing-section landing-features"><div className="landing-section-intro"><span className="landing-kicker">HỌC CÓ MỤC TIÊU</span><h2>Một nơi cho mọi bước tiến<span>.</span></h2><p>Chọn đúng hoạt động cho hôm nay. Mỗi lần luyện tập đều có đường quay lại để xem và ôn.</p></div><div className="landing-feature-grid">{features.map(({ icon: Icon, label, title, description, href, number }) => <a className="landing-feature" href={href} key={number}><div className="landing-feature-head"><span>{number} / {label}</span><ArrowUpRight size={19}/></div><div className="landing-feature-icon"><Icon size={25} strokeWidth={1.75}/></div><h3>{title}</h3><p>{description}</p><span className="landing-feature-more">Khám phá <ArrowRight size={16}/></span></a>)}</div></section>
      <section id="landing-lessons" className="landing-lessons"><div className="landing-lessons-inner"><div className="landing-section-intro"><span className="landing-kicker">BẮT ĐẦU TỪ BÀI HỌC</span><h2>Tập trung vào bài 8–11<span>.</span></h2><p>Bốn bài có câu Speaking theo lesson trong dữ liệu hiện tại. Bạn cũng có thể học từ bài 1 và đi theo nhịp riêng.</p></div><div className="landing-lesson-grid">{landingLessons.map(lesson => <a href={`/nihongo/lessons/${lesson.id}`} className="landing-lesson" key={lesson.id}><span className="landing-lesson-index">{String(lesson.id).padStart(2, '0')}</span><span className="landing-lesson-jp" lang="ja">{lesson.jp}</span><h3>{lesson.title}</h3><p>{lesson.detail}</p><div><span>{lesson.words} từ vựng</span><ArrowUpRight size={18}/></div></a>)}</div><a className="landing-text-link" href="/nihongo/lessons">Xem tất cả 11 bài học <ArrowRight size={17}/></a><a className="landing-text-link" href="/nihongo/kanji">Ôn 119 chữ Hán từ Bài 1–11 <ArrowRight size={17}/></a></div></section>
      <section id="landing-method" className="landing-section landing-method"><div className="landing-section-intro"><span className="landing-kicker">CÁCH HỌC ĐƠN GIẢN</span><h2>Bắt đầu nhỏ. Tiến bộ thật<span>.</span></h2><p>Bạn chủ động chọn bài và thời lượng. Ứng dụng ghi lại những hoạt động bạn thực sự đã làm.</p></div><div className="landing-steps"><div><span>01</span><h3>Chọn một bài</h3><p>Học từ và mẫu câu gắn với chủ đề đang ôn.</p></div><div><span>02</span><h3>Luyện một lượt</h3><p>Nói, đọc hoặc trả lời câu FE với phản hồi rõ ràng.</p></div><div><span>03</span><h3>Quay lại ôn</h3><p>Xem câu sai, từ đã lưu và tiến độ theo từng ngày.</p></div></div></section>
      <section className="landing-bottom"><div><span className="landing-kicker">HÔM NAY, BẮT ĐẦU NHÉ</span><h2>Việc học tốt nhất bắt đầu<br/>từ một bước nhỏ.</h2><p>Bạn có thể học ngay. Nếu đăng nhập, tiến độ sẽ được lưu vào tài khoản.</p><a className="landing-primary-link" href="/nihongo/dashboard">Vào không gian học <ArrowRight size={18}/></a></div><div className="landing-bottom-mark" aria-hidden="true">日本語<span>✿</span></div></section>
    </main>
    <footer className="landing-footer"><div className="landing-brand"><span className="landing-brand-icon"><Flower2 size={21}/></span><span>JPD<span>133</span><small>JAPANESE LEARNING SPACE</small></span></div><p>Nội dung ôn luyện từ tài liệu trong dự án. Thi thử là mô phỏng tự luyện, không phải quy chế thi chính thức.</p><span>© {YEAR} JPD133</span></footer>
  </div>;
}

