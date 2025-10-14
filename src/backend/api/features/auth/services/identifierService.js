// Ghi chu: Xac dinh kieu dinh danh dang nhap va tra cuu userId tu thong tin lien he.
const { pool } = require('../../../../database/connection');

const PHONE_LOGIN_REGEX = /^\d{10}$/;

// Kiem tra chuoi co dang email don gian.
function looksLikeEmail(value) {
  return typeof value === 'string' && value.includes('@');
}

// Kiem tra chuoi co 10 chu so (SDT).
function looksLikePhone(value) {
  return typeof value === 'string' && PHONE_LOGIN_REGEX.test(value.trim());
}

// Phan loai truong dang nhap de biet cach tra cuu.
function detectLoginIdentifierType(value) {
  const candidate = typeof value === 'string' ? value.trim() : '';
  if (!candidate) {
    return 'userId';
  }

  if (looksLikeEmail(candidate)) {
    return 'email';
  }

  if (looksLikePhone(candidate)) {
    return 'phone';
  }

  return 'userId';
}

// Tim danh sach userId tu email hoac so dien thoai.
async function resolveUserIdsByContact(identifier, type) {
  const normalized = typeof identifier === 'string' ? identifier.trim() : '';
  if (!normalized) {
    return [];
  }

  const queries = [];
  if (type === 'email') {
    queries.push(pool.execute('SELECT user_id FROM students WHERE LOWER(email) = LOWER(?)', [normalized]));
    queries.push(pool.execute('SELECT user_id FROM teachers WHERE LOWER(email) = LOWER(?)', [normalized]));
    queries.push(pool.execute('SELECT user_id FROM admin_profiles WHERE LOWER(email) = LOWER(?)', [normalized]));
  } else if (type === 'phone') {
    queries.push(pool.execute('SELECT user_id FROM students WHERE phone_number = ?', [normalized]));
    queries.push(pool.execute('SELECT user_id FROM teachers WHERE phone_number = ?', [normalized]));
    queries.push(pool.execute('SELECT user_id FROM admin_profiles WHERE phone_number = ?', [normalized]));
  } else {
    return [];
  }

  const results = await Promise.all(queries);
  const userIds = new Set();
  for (const [rows] of results) {
    if (!rows || !rows.length) {
      continue;
    }
    for (const row of rows) {
      if (row && row.user_id) {
        userIds.add(row.user_id);
      }
    }
  }

  return Array.from(userIds);
}

module.exports = {
  detectLoginIdentifierType,
  resolveUserIdsByContact,
};
