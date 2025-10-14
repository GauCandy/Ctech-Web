// Ghi chu: Dam bao tai khoan admin mac dinh duoc tao va luu tru thong tin moi truong.
const { pool } = require('../../../../database/connection');
const { hashPassword } = require('../../../shared/password');

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_DISPLAY_NAME = process.env.ADMIN_DISPLAY_NAME || ADMIN_USER;

if (!ADMIN_USER || !ADMIN_PASSWORD) {
  throw new Error('Missing ADMIN_USER or ADMIN_PASSWORD environment variables.');
}

// Kiem tra xem userId co phai admin duoc khai bao trong moi truong khong.
function isEnvAdmin(userId) {
  return userId === ADMIN_USER;
}

// Tao hoac cap nhat tai khoan admin mac dinh trong co so du lieu.
async function ensureAdminAccountSeeded() {
  const adminHash = hashPassword(ADMIN_PASSWORD);

  await pool.execute(
    `INSERT INTO user_accounts (user_id, password_sha, role, is_active)
     VALUES (?, ?, 'admin', 1)
     ON DUPLICATE KEY UPDATE password_sha = VALUES(password_sha), role = VALUES(role), is_active = VALUES(is_active)`,
    [ADMIN_USER, adminHash]
  );

  await pool.execute(
    `INSERT INTO admin_profiles (user_id, full_name)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)`,
    [ADMIN_USER, ADMIN_DISPLAY_NAME]
  );
}

module.exports = {
  ADMIN_USER,
  isEnvAdmin,
  ensureAdminAccountSeeded,
};
