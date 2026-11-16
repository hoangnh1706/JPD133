import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { mkdirSync, existsSync, createReadStream, statSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dataDir = resolve(process.env.JPD133_DATA_DIR || join(root, 'server', 'data'));
mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(join(dataDir, 'nihongo.sqlite'));
db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, salt TEXT NOT NULL, password_hash TEXT NOT NULL, progress TEXT NOT NULL, created_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL);');
const defaultProgress = { events: [], bookmarks: [], favorites: [], settings: { theme: 'light', furigana: true, sakura: true, sakuraIntensity: 'normal', rate: 1 } };
const cookieName = 'nihongo_session';
const maxAge = 30 * 24 * 60 * 60;
const attempts = new Map();
const hashToken = token => createHash('sha256').update(token).digest('hex');
const passwordHash = (password, salt) => scryptSync(password, salt, 64).toString('hex');
const json = (res, status, body) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(body)); };
const cookie = (res, token, req) => res.setHeader('Set-Cookie', `${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/; ${req.socket.encrypted || process.env.COOKIE_SECURE === '1' ? 'Secure; ' : ''}Max-Age=${token ? maxAge : 0}`);
const parseCookie = req => (req.headers.cookie || '').split(';').map(part => part.trim()).find(part => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
const currentUser = req => {
  const token = parseCookie(req);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  return db.prepare('SELECT users.id, users.name, users.email, users.progress FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.token_hash=? AND sessions.expires_at>?').get(hashToken(token), Date.now()) || null;
};
const publicUser = user => ({ id: user.id, name: user.name, email: user.email });
const issueSession = (res, req, user) => {
  const token = randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,?)').run(hashToken(token), user.id, Date.now() + maxAge * 1000);
  cookie(res, token, req);
};
const readBody = async req => {
  if (!req.headers['content-type']?.startsWith('application/json')) throw new Error('JSON_REQUIRED');
  let body = '';
  for await (const chunk of req) { body += chunk; if (body.length > 1_000_000) throw new Error('BODY_TOO_LARGE'); }
  return JSON.parse(body);
};
const sameOrigin = req => {
  const origin = req.headers.origin;
  if (!origin) return false;
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
};
const rateLimited = req => {
  const key = req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const row = attempts.get(key);
  if (!row || row.until < now) { attempts.set(key, { count: 1, until: now + 15 * 60_000 }); return false; }
  row.count++;
  return row.count > 30;
};
const validProgress = value => value && typeof value === 'object' && !Array.isArray(value)
  && Array.isArray(value.events) && value.events.length <= 10000 && value.events.every(event => event && typeof event.type === 'string' && typeof event.at === 'string')
  && Array.isArray(value.bookmarks) && value.bookmarks.every(Number.isInteger)
  && Array.isArray(value.favorites) && value.favorites.every(Number.isInteger)
  && value.settings && ['light', 'dark'].includes(value.settings.theme)
  && typeof value.settings.furigana === 'boolean' && typeof value.settings.sakura === 'boolean'
  && ['slow', 'normal', 'fast'].includes(value.settings.sakuraIntensity || 'normal')
  && typeof value.settings.rate === 'number' && value.settings.rate >= .6 && value.settings.rate <= 1.4;

const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.pdf': 'application/pdf' };
const serveFile = (res, file) => { res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' }); createReadStream(file).pipe(res); };

export function createAppServer() { return createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const path = url.pathname;
    if (path.startsWith('/api/')) {
      if (!['GET', 'HEAD'].includes(req.method) && !sameOrigin(req)) return json(res, 403, { error: 'Nguồn yêu cầu không hợp lệ.' });
      if (path === '/api/auth/me' && req.method === 'GET') { const user = currentUser(req); return json(res, 200, { user: user ? publicUser(user) : null, progress: user ? JSON.parse(user.progress) : null }); }
      if (path === '/api/auth/register' && req.method === 'POST') {
        if (rateLimited(req)) return json(res, 429, { error: 'Vui lòng thử lại sau.' });
        const body = await readBody(req); const name = String(body.name || '').trim(); const email = String(body.email || '').trim().toLowerCase(); const password = String(body.password || '');
        if (name.length < 2 || name.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || password.length < 10 || password.length > 128) return json(res, 400, { error: 'Tên, email hoặc mật khẩu không hợp lệ. Mật khẩu cần ít nhất 10 ký tự.' });
        if (db.prepare('SELECT id FROM users WHERE email=?').get(email)) return json(res, 409, { error: 'Email này đã được sử dụng.' });
        const salt = randomBytes(16).toString('hex');
        const result = db.prepare('INSERT INTO users (name,email,salt,password_hash,progress,created_at) VALUES (?,?,?,?,?,?)').run(name, email, salt, passwordHash(password, salt), JSON.stringify(defaultProgress), new Date().toISOString());
        const user = { id: Number(result.lastInsertRowid), name, email }; issueSession(res, req, user); return json(res, 201, { user, progress: defaultProgress });
      }
      if (path === '/api/auth/login' && req.method === 'POST') {
        if (rateLimited(req)) return json(res, 429, { error: 'Vui lòng thử lại sau.' });
        const body = await readBody(req); const email = String(body.email || '').trim().toLowerCase(); const password = String(body.password || '');
        const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
        const expected = user?.password_hash || passwordHash('invalid', '00000000000000000000000000000000');
        const actual = passwordHash(password, user?.salt || '00000000000000000000000000000000');
        if (!user || !timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'))) return json(res, 401, { error: 'Email hoặc mật khẩu chưa đúng.' });
        issueSession(res, req, user); return json(res, 200, { user: publicUser(user), progress: JSON.parse(user.progress) });
      }
      if (path === '/api/auth/logout' && req.method === 'POST') { const token = parseCookie(req); if (token) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hashToken(token)); cookie(res, '', req); return json(res, 200, { ok: true }); }
      const match = path.match(/^\/api\/grammar-pdf\/(08|09|10|11)$/);
      if (match && req.method === 'GET') { const file = join(root, 'documents', 'pdf', `Dekiru so cap BT Ngu phap ${match[1]}.pdf`); if (!existsSync(file)) return json(res, 404, { error: 'Không tìm thấy tài liệu.' }); res.writeHead(200, { 'Content-Type': 'application/pdf', 'Content-Length': statSync(file).size, 'Content-Disposition': `inline; filename="grammar-${match[1]}.pdf"`, 'Cache-Control': 'private, max-age=3600', 'X-Content-Type-Options': 'nosniff' }); return createReadStream(file).pipe(res); }
      const user = currentUser(req);
      if (!user) return json(res, 401, { error: 'Vui lòng đăng nhập.' });
      if (path === '/api/progress' && req.method === 'PUT') { const body = await readBody(req); if (!validProgress(body)) return json(res, 400, { error: 'Dữ liệu tiến độ không hợp lệ.' }); db.prepare('UPDATE users SET progress=? WHERE id=?').run(JSON.stringify(body), user.id); return json(res, 200, { ok: true }); }
      return json(res, 404, { error: 'Không tìm thấy API.' });
    }
    if (req.method !== 'GET') return json(res, 405, { error: 'Phương thức không được hỗ trợ.' });
    if (path === '/') { res.writeHead(302, { Location: '/nihongo' }); return res.end(); }
    const dist = join(root, 'dist');
    if (!existsSync(dist)) return json(res, 503, { error: 'Hãy chạy npm run build trước khi khởi động bản production.' });
    const requested = resolve(dist, '.' + path);
    if (requested.startsWith(dist + '\\') || requested.startsWith(dist + '/')) { if (existsSync(requested) && statSync(requested).isFile()) return serveFile(res, requested); }
    if (path === '/nihongo' || path.startsWith('/nihongo/')) return serveFile(res, join(dist, 'index.html'));
    return json(res, 404, { error: 'Không tìm thấy trang.' });
  } catch (error) { if (error instanceof SyntaxError || ['JSON_REQUIRED', 'BODY_TOO_LARGE'].includes(error.message)) return json(res, 400, { error: 'Dữ liệu yêu cầu không hợp lệ.' }); console.error(error); return json(res, 500, { error: 'Có lỗi máy chủ. Vui lòng thử lại.' }); }
}); }
export function closeDatabase() { db.close(); }

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3001);
  createAppServer().listen(port, () => console.log(`Nihongo server: http://localhost:${port}/nihongo`));
}
