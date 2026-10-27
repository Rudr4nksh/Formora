const path = require('path');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const Database = require('better-sqlite3');

const app = express();
const db = new Database(path.join(__dirname, 'formora.db'));
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS profiles (
    user_id INTEGER PRIMARY KEY,
    full_name TEXT NOT NULL,
    date_of_birth TEXT,
    phone TEXT,
    bio TEXT,
    accessibility_needs TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

app.use(express.urlencoded({ extended: false }));
app.use(session({ secret: process.env.SESSION_SECRET || 'change-this-before-production', resave: false, saveUninitialized: false, cookie: { httpOnly: true, sameSite: 'lax' } }));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'landing.html')));
app.use(express.static(path.join(__dirname, 'public')));

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function passwordMatches(password, stored) {
  const [salt, hash] = stored.split(':');
  const attempt = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(attempt, 'hex'));
}
function signedIn(req, res, next) {
  if (!req.session.userId) return res.redirect('/?error=Please%20sign%20in%20first');
  next();
}

app.post('/register', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8) return res.redirect('/?error=Enter%20a%20valid%20email%20and%20an%208%2B%20character%20password');
  try {
    const result = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(email, hashPassword(password));
    req.session.userId = result.lastInsertRowid;
    res.redirect('/welcome.html?event=signup');
  } catch (error) {
    res.redirect('/?error=An%20account%20with%20that%20email%20already%20exists');
  }
});

app.post('/login', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !passwordMatches(String(req.body.password || ''), user.password_hash)) return res.redirect('/?error=Incorrect%20email%20or%20password');
  req.session.userId = user.id;
  res.redirect('/welcome.html?event=login');
});

app.post('/profile', signedIn, (req, res) => {
  const fullName = String(req.body.fullName || '').trim();
  if (!fullName) return res.redirect('/profile.html?error=Your%20name%20is%20required');
  db.prepare(`INSERT INTO profiles (user_id, full_name, date_of_birth, phone, bio, accessibility_needs, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET full_name=excluded.full_name, date_of_birth=excluded.date_of_birth, phone=excluded.phone, bio=excluded.bio, accessibility_needs=excluded.accessibility_needs, updated_at=CURRENT_TIMESTAMP`)
    .run(req.session.userId, fullName, req.body.dateOfBirth || null, req.body.phone || null, req.body.bio || null, req.body.accessibilityNeeds || null);
  res.redirect('/dashboard.html');
});

app.get('/api/me', signedIn, (req, res) => {
  const user = db.prepare('SELECT id, email, created_at FROM users WHERE id = ?').get(req.session.userId);
  const profile = db.prepare('SELECT full_name, date_of_birth, phone, bio, accessibility_needs, updated_at FROM profiles WHERE user_id = ?').get(req.session.userId);
  res.json({ user, profile });
});
app.post('/logout', (req, res) => req.session.destroy(() => res.redirect('/')));
app.listen(process.env.PORT || 3000, () => console.log('Formora running on http://localhost:3000'));
