import { useState } from 'react';
import { ArrowRight, Flower2 } from 'lucide-react';
import '../styles/auth.css';

export default function Auth({ mode, onSuccess, go, notice = '' }) {
  const register = mode === 'register';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async event => {
    event.preventDefault();
    if (register && password !== confirm) { setError('Mật khẩu nhập lại chưa khớp.'); return; }
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/auth/${register ? 'register' : 'login'}`, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không thể tiếp tục.');
      onSuccess(data);
    } catch (cause) { setError(cause.message || 'Không kết nối được máy chủ.'); }
    finally { setBusy(false); }
  };
  return <div className="auth-page"><div className="auth-top"><a href="/nihongo" onClick={event => { event.preventDefault(); go('/landing'); }} className="auth-brand"><Flower2 size={27}/> JPD133 <span>· 日本語</span></a><button className="text-button" onClick={() => go('/landing')}>Về trang giới thiệu</button></div><main className="auth-main"><div className="auth-intro"><span className="eyebrow">HỌC TIẾNG NHẬT CÙNG NHAU</span><h1>Mỗi ngày một chút.<br/><span className="pink">Tiến bộ theo cách của bạn.</span></h1><p>Học bài 1–11, luyện nói, làm FE và xem lại tiến độ của riêng bạn trên mọi lần đăng nhập.</p><div className="auth-art" aria-hidden="true"><span>日本語</span><span>✿</span></div></div><div className="auth-card panel"><span className="eyebrow">{register ? 'TẠO TÀI KHOẢN' : 'CHÀO MỪNG TRỞ LẠI'}</span><h2>{register ? 'Bắt đầu hành trình học' : 'Đăng nhập'}</h2><p>{register ? 'Tạo tài khoản để lưu bài học và kết quả luyện tập.' : 'Tiếp tục đúng nơi bạn đã dừng.'}</p>{notice && <div className="auth-notice">{notice}</div>}<form onSubmit={submit}>{register && <label>Họ và tên<input autoComplete="name" required minLength={2} maxLength={80} value={name} onChange={event => setName(event.target.value)} placeholder="Tên của bạn"/></label>}<label>Email<input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="ban@example.com"/></label><label>Mật khẩu<input type="password" autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? 10 : undefined} value={password} onChange={event => setPassword(event.target.value)} placeholder={register ? 'Ít nhất 10 ký tự' : 'Nhập mật khẩu'}/></label>{register && <label>Nhập lại mật khẩu<input type="password" autoComplete="new-password" required value={confirm} onChange={event => setConfirm(event.target.value)} placeholder="Nhập lại mật khẩu"/></label>}{error && <div className="auth-error" role="alert">{error}</div>}<button className="primary-button full" disabled={busy}>{busy ? 'Đang xử lý…' : register ? 'Tạo tài khoản' : 'Đăng nhập'} <ArrowRight size={18}/></button></form><p className="auth-switch">{register ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'} <button className="text-button" onClick={() => go(register ? '/login' : '/register')}>{register ? 'Đăng nhập' : 'Đăng ký'}</button></p></div></main></div>;
}
