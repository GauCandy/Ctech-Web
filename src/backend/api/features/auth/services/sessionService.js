// Ghi chu: Quan ly session dang nhap bang token va co so du lieu.
const crypto = require('crypto');
const { pool } = require('../../../../database/connection');
const { loadAccountProfileRow, buildProfilePayload } = require('./userProfileService');

const DEFAULT_SESSION_TIMEOUT_SECONDS = 60 * 60; // 1 hour
const DEFAULT_REMEMBER_SESSION_TIMEOUT_SECONDS = 60 * 60 * 24 * 30; // 30 days

const SESSION_TIMEOUT_ENV = process.env.SESSION_TIMEOUT;
const SESSION_REMEMBER_TIMEOUT_ENV = process.env.SESSION_REMEMBER_TIMEOUT;

const resolveTimeoutMs = (envValue, fallbackSeconds, label) => {
  if (!envValue) {
    return fallbackSeconds * 1000;
  }

  const parsed = Number(envValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    console.warn(`Invalid ${label} value, using fallback:`, envValue);
    return fallbackSeconds * 1000;
  }

  return Math.floor(parsed * 1000);
};

const SESSION_TTL_MS = resolveTimeoutMs(
  SESSION_TIMEOUT_ENV,
  DEFAULT_SESSION_TIMEOUT_SECONDS,
  'SESSION_TIMEOUT'
);

const REMEMBER_SESSION_TTL_MS = resolveTimeoutMs(
  SESSION_REMEMBER_TIMEOUT_ENV,
  DEFAULT_REMEMBER_SESSION_TIMEOUT_SECONDS,
  'SESSION_REMEMBER_TIMEOUT'
);

// Lay token tu header Authorization hoac query.
function extractToken(req) {
  const authHeader = req.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }

  return req.get('x-admin-token') || req.query.token || null;
}

// Tao token ngau nhien 64 ky tu hex.
function generateToken(options = {}) {
  const remember = Boolean(options.remember);
  const randomHex = crypto.randomBytes(32).toString('hex');
  const prefix = remember ? 'R' : 'S';
  return prefix + randomHex.slice(1);
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
async function createSession(userId, options = {}) {
  const remember = Boolean(options.remember);

  await pruneExpiredSessions();
  await destroyUserSessions(userId);

  const token = generateToken({ remember });
  const ttlMs = remember ? REMEMBER_SESSION_TTL_MS : SESSION_TTL_MS;
  const expiresAt = new Date(Date.now() + ttlMs);

  await pool.execute(
    'INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt]
  );

  return {
    token,
    expiresAt: expiresAt.toISOString(),
    remember,
  };
}

// Kiem tra token, gia han thoi gian neu hop le va nguoi dung dang hoat dong.
async function validateSessionToken(token) {
  const rememberToken = typeof token === 'string' && token.startsWith('R');

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

  const ttlMs = rememberToken ? REMEMBER_SESSION_TTL_MS : SESSION_TTL_MS;
  const updatedExpiry = new Date(nowMs + ttlMs);
  await pool.execute(
    'UPDATE user_sessions SET expires_at = ?, last_used_at = CURRENT_TIMESTAMP WHERE id = ?',
    [updatedExpiry, record.id]
  );

  return {
    id: record.id,
    userId: record.user_id,
    role: record.role,
    expiresAt: updatedExpiry.toISOString(),
    remember: rememberToken,
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
    remember: session.remember,
    displayName: profile ? profile.displayName : session.userId,
    profile,
  };
}

module.exports = {
  SESSION_TTL_MS,
  REMEMBER_SESSION_TTL_MS,
  extractToken,
  generateToken,
  pruneExpiredSessions,
  destroyUserSessions,
  createSession,
  validateSessionToken,
  authenticateRequest,
};
