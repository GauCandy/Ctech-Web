// Ghi chu: Quan ly session dang nhap bang token va co so du lieu.
const crypto = require('crypto');
const { pool } = require('../../../../database/connection');
const { loadAccountProfileRow, buildProfilePayload } = require('./userProfileService');

const DEFAULT_SESSION_TIMEOUT_SECONDS = 60 * 60;
const SESSION_TIMEOUT_ENV = process.env.SESSION_TIMEOUT;
const SESSION_TTL_MS = (() => {
  if (!SESSION_TIMEOUT_ENV) {
    return DEFAULT_SESSION_TIMEOUT_SECONDS * 1000;
  }

  const parsed = Number(SESSION_TIMEOUT_ENV);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    console.warn('Invalid SESSION_TIMEOUT value, using default:', SESSION_TIMEOUT_ENV);
    return DEFAULT_SESSION_TIMEOUT_SECONDS * 1000;
  }

  return Math.floor(parsed * 1000);
})();

// Lay token tu header Authorization hoac query.
function extractToken(req) {
  const authHeader = req.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }

  return req.get('x-admin-token') || req.query.token || null;
}

// Tao token ngau nhien 64 ky tu hex.
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Xoa tat ca session cua nguoi dung cu the.
async function destroyUserSessions(userId) {
  await pool.execute('DELETE FROM user_sessions WHERE user_id = ?', [userId]);
}

// Xoa session het han de don sach bang.
async function pruneExpiredSessions() {
  await pool.execute('DELETE FROM user_sessions WHERE expires_at <= NOW()');
}

// Tao session moi va gia han thoi gian het han mac dinh.
async function createSession(userId) {
  await pruneExpiredSessions();
  await destroyUserSessions(userId);

  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await pool.execute(
    'INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt]
  );

  return {
    token,
    expiresAt: expiresAt.toISOString(),
  };
}

// Kiem tra token, gia han thoi gian neu hop le va nguoi dung dang hoat dong.
async function validateSessionToken(token) {
  const [rows] = await pool.execute(
    `SELECT us.id, us.user_id, us.expires_at, ua.role, ua.is_active
     FROM user_sessions us
     JOIN user_accounts ua ON ua.user_id = us.user_id
     WHERE us.token = ?`,
    [token]
  );

  if (!rows.length) {
    return null;
  }

  const record = rows[0];

  if (!record.is_active) {
    await pool.execute('DELETE FROM user_sessions WHERE id = ?', [record.id]);
    return null;
  }

  const expiresMs = new Date(record.expires_at).getTime();
  const nowMs = Date.now();

  if (Number.isNaN(expiresMs) || expiresMs <= nowMs) {
    await pool.execute('DELETE FROM user_sessions WHERE id = ?', [record.id]);
    return null;
  }

  const newExpiry = new Date(nowMs + SESSION_TTL_MS);
  await pool.execute(
    'UPDATE user_sessions SET expires_at = ?, last_used_at = CURRENT_TIMESTAMP WHERE id = ?',
    [newExpiry, record.id]
  );

  return {
    id: record.id,
    userId: record.user_id,
    role: record.role,
    expiresAt: newExpiry.toISOString(),
  };
}

// Xac thuc request dua tren token va tra ve thong tin nguoi dung.
async function authenticateRequest(req) {
  const token = extractToken(req);
  if (!token) {
    return null;
  }

  const session = await validateSessionToken(token);
  if (!session) {
    return null;
  }

  let profile = null;
  try {
    const accountRow = await loadAccountProfileRow(session.userId);
    if (accountRow) {
      profile = buildProfilePayload(accountRow);
    }
  } catch (error) {
    console.warn('Unable to load user profile for session:', error && error.message ? error.message : error);
  }

  return {
    userId: session.userId,
    role: session.role,
    token,
    expiresAt: session.expiresAt,
    displayName: profile ? profile.displayName : session.userId,
    profile,
  };
}

module.exports = {
  SESSION_TTL_MS,
  extractToken,
  generateToken,
  pruneExpiredSessions,
  destroyUserSessions,
  createSession,
  validateSessionToken,
  authenticateRequest,
};
