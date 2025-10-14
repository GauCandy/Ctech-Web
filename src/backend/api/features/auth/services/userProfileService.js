// Ghi chú: Dịch vụ truy vấn hồ sơ người dùng để lấy thông tin hiển thị.
const { pool } = require('../../../../database/connection');

const PROFILE_QUERY = `
  SELECT
    ua.user_id,
    ua.password_sha,
    ua.role,
    ua.is_active,
    s.full_name AS student_full_name,
    s.email AS student_email,
    s.phone_number AS student_phone,
    s.class_code AS student_class_code,
    s.department AS student_department,
    t.full_name AS teacher_full_name,
    t.email AS teacher_email,
    t.phone_number AS teacher_phone,
    t.department AS teacher_department,
    t.position AS teacher_position,
    ap.full_name AS admin_full_name,
    ap.email AS admin_email,
    ap.phone_number AS admin_phone,
    ap.department AS admin_department
  FROM user_accounts ua
  LEFT JOIN students s ON s.user_id = ua.user_id
  LEFT JOIN teachers t ON t.user_id = ua.user_id
  LEFT JOIN admin_profiles ap ON ap.user_id = ua.user_id
  WHERE ua.user_id = ?
  LIMIT 1
`;

async function loadAccountProfileRow(userId) {
  const [rows] = await pool.execute(PROFILE_QUERY, [userId]);
  return rows.length ? rows[0] : null;
}

function buildProfilePayload(row) {
  if (!row) {
    return null;
  }

  const base = {
    userId: row.user_id,
    role: row.role,
    displayName: row.user_id,
    fullName: null,
    email: null,
    phoneNumber: null,
    department: null,
    classCode: null,
    position: null,
  };

  if (row.role === 'student') {
    base.fullName = row.student_full_name || null;
    base.email = row.student_email || null;
    base.phoneNumber = row.student_phone || null;
    base.department = row.student_department || null;
    base.classCode = row.student_class_code || null;
  } else if (row.role === 'teacher') {
    base.fullName = row.teacher_full_name || null;
    base.email = row.teacher_email || null;
    base.phoneNumber = row.teacher_phone || null;
    base.department = row.teacher_department || null;
    base.position = row.teacher_position || null;
  } else if (row.role === 'admin') {
    base.fullName = row.admin_full_name || null;
    base.email = row.admin_email || null;
    base.phoneNumber = row.admin_phone || null;
    base.department = row.admin_department || null;
  }

  if (base.fullName && typeof base.fullName === 'string') {
    base.displayName = base.fullName;
  }

  return base;
}

module.exports = {
  loadAccountProfileRow,
  buildProfilePayload,
};

