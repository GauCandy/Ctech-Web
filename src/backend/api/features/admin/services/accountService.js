// Ghi chu: Cac ham ho tro admin tao tai khoan va quan ly thong tin nguoi dung.
const { pool } = require('../../../../database/connection');
const { hashPassword, generatePassword, validatePasswordStrength } = require('../../../shared/password');
const { toNullableString } = require('../../../shared/value');
const { destroyUserSessions } = require('../../auth/services/sessionService');

const ROLE_PREFIXES = {
  admin: 'AD',
  teacher: 'GV',
  student: 'SV',
};

const VALID_GENDERS = new Set(['male', 'female', 'other']);

// Chuan hoa vai tro, chi chap nhan cac gia tri hop le.
function normalizeRole(role) {
  if (!role) {
    return null;
  }
  const value = String(role).trim().toLowerCase();
  return ROLE_PREFIXES[value] ? value : null;
}

// Chuan hoa gioi tinh, mac dinh la other neu khong hop le.
function normalizeGender(value) {
  if (!value) {
    return 'other';
  }
  const gender = String(value).trim().toLowerCase();
  return VALID_GENDERS.has(gender) ? gender : 'other';
}

// Dam bao dinh dang ngay thang YYYY-MM-DD, tra ve null neu khong dung.
function toDateString(value) {
  if (!value) {
    return null;
  }
  const str = String(value).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(str) ? str : null;
}

// Chuan hoa thong tin sinh vien truoc khi luu DB.
function buildStudentInfo(student) {
  if (!student) {
    return null;
  }

  const fullName = toNullableString(student.fullName);
  if (!fullName) {
    return null;
  }

  return {
    fullName,
    gender: normalizeGender(student.gender),
    birthDate: toDateString(student.birthDate),
    phoneNumber: toNullableString(student.phoneNumber),
    email: toNullableString(student.email),
    classCode: toNullableString(student.classCode),
    department: toNullableString(student.department),
  };
}

// Chuan hoa thong tin giang vien.
function buildTeacherInfo(teacher) {
  if (!teacher) {
    return null;
  }

  const fullName = toNullableString(teacher.fullName);
  if (!fullName) {
    return null;
  }

  return {
    fullName,
    gender: normalizeGender(teacher.gender),
    birthDate: toDateString(teacher.birthDate),
    phoneNumber: toNullableString(teacher.phoneNumber),
    email: toNullableString(teacher.email),
    department: toNullableString(teacher.department),
    position: toNullableString(teacher.position),
  };
}

// Chuan hoa thong tin admin.
function buildAdminInfo(admin) {
  if (!admin) {
    return null;
  }

  const fullName = toNullableString(admin.fullName);
  if (!fullName) {
    return null;
  }

  return {
    fullName,
    email: toNullableString(admin.email),
    phoneNumber: toNullableString(admin.phoneNumber),
    department: toNullableString(admin.department),
  };
}

// Sinh ma nguoi dung moi dua tren vai tro va so thu tu.
async function generateNextUserId(connection, role) {
  const prefix = ROLE_PREFIXES[role];
  const [rows] = await connection.execute(
    'SELECT user_id FROM user_accounts WHERE user_id LIKE ? ORDER BY user_id DESC LIMIT 1',
    [`${prefix}%`]
  );

  let sequence = 1;
  if (rows.length) {
    const existing = rows[0].user_id.slice(prefix.length);
    const parsed = parseInt(existing, 10);
    if (!Number.isNaN(parsed)) {
      sequence = parsed + 1;
    }
  }

  return `${prefix}${String(sequence).padStart(3, '0')}`;
}

// Tao tai khoan nguoi dung moi va tao mat khau ngau nhien.
async function createUserAccount(connection, role) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const userId = await generateNextUserId(connection, role);
    const plainPassword = generatePassword();
    const passwordSha = hashPassword(plainPassword);

    try {
      await connection.execute(
        'INSERT INTO user_accounts (user_id, password_sha, role, is_active) VALUES (?, ?, ?, 1)',
        [userId, passwordSha, role]
      );

      return { userId, plainPassword };
    } catch (error) {
      if (error && error.code === 'ER_DUP_ENTRY') {
        continue;
      }
      throw error;
    }
  }

  throw new Error('Unable to generate a unique user id.');
}

// Tao tai khoan kem theo thong tin ho so tuong ung.
async function createAccountWithProfile(role, studentInfo, teacherInfo, adminInfo) {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const { userId, plainPassword } = await createUserAccount(connection, role);

    if (role === 'student' && studentInfo) {
      await connection.execute(
        `INSERT INTO students (user_id, full_name, gender, birth_date, phone_number, email, class_code, department)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          studentInfo.fullName,
          studentInfo.gender,
          studentInfo.birthDate,
          studentInfo.phoneNumber,
          studentInfo.email,
          studentInfo.classCode,
          studentInfo.department,
        ]
      );
    }

    if (role === 'teacher' && teacherInfo) {
      await connection.execute(
        `INSERT INTO teachers (user_id, full_name, gender, birth_date, phone_number, email, department, position)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          teacherInfo.fullName,
          teacherInfo.gender,
          teacherInfo.birthDate,
          teacherInfo.phoneNumber,
          teacherInfo.email,
          teacherInfo.department,
          teacherInfo.position,
        ]
      );
    }

    if (role === 'admin' && adminInfo) {
      await connection.execute(
        `INSERT INTO admin_profiles (user_id, full_name, email, phone_number, department)
         VALUES (?, ?, ?, ?, ?)`,
        [
          userId,
          adminInfo.fullName,
          adminInfo.email,
          adminInfo.phoneNumber,
          adminInfo.department,
        ]
      );
    }

    await connection.commit();

    return { userId, plainPassword };
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Failed to rollback transaction:', rollbackError);
      }
    }
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Admin goi ham nay de tao tai khoan moi dua tren loai vai tro va du lieu ho so.
async function createAccountForAdmin(payload) {
  const role = normalizeRole(payload.role);
  if (!role) {
    throw { status: 400, message: 'Vai tro khong hop le.' };
  }

  const studentInfo = role === 'student' ? buildStudentInfo(payload.student) : null;
  if (role === 'student' && !studentInfo) {
    throw { status: 400, message: 'Thong tin sinh vien khong du hoac khong hop le.' };
  }

  const teacherInfo = role === 'teacher' ? buildTeacherInfo(payload.teacher) : null;
  if (role === 'teacher' && !teacherInfo) {
    throw { status: 400, message: 'Thong tin giang vien khong du hoac khong hop le.' };
  }

  const adminInfo = role === 'admin' ? buildAdminInfo(payload.admin) : null;
  if (role === 'admin' && !adminInfo) {
    throw { status: 400, message: 'Thong tin admin khong du hoac khong hop le.' };
  }

  const result = await createAccountWithProfile(role, studentInfo, teacherInfo, adminInfo);
  return {
    message: 'Tao tai khoan thanh cong.',
    user: {
      userId: result.userId,
      role,
    },
    initialPassword: result.plainPassword,
  };
}

// Admin dat lai mat khau va huy phien dang nhap cu neu co.
async function resetPasswordForUser({ userId, newPassword }) {
  const normalizedId = typeof userId === 'string' ? userId.trim() : '';
  if (!normalizedId) {
    throw { status: 400, message: 'Ma nguoi dung khong hop le.' };
  }

  const passwordSha = hashPassword(newPassword);
  const [result] = await pool.execute(
    'UPDATE user_accounts SET password_sha = ? WHERE user_id = ?',
    [passwordSha, normalizedId]
  );

  if (result.affectedRows === 0) {
    return false;
  }

  await destroyUserSessions(normalizedId);
  return true;
}

// Cho phép sinh viên tự đăng ký tài khoản với mật khẩu do họ chọn.
async function registerStudentAccount(payload) {
  const fullName = toNullableString(payload.fullName);
  if (!fullName) {
    throw { status: 400, message: 'Ho va ten bat buoc.' };
  }

  const password = typeof payload.password === 'string' ? payload.password : '';
  const strength = validatePasswordStrength(password);
  if (!strength.valid) {
    throw { status: 400, message: strength.message };
  }

  const email = toNullableString(payload.email);
  const phoneNumber = toNullableString(payload.phoneNumber);

  if (!email) {
    throw { status: 400, message: 'Email bat buoc.' };
  }

  if (!phoneNumber) {
    throw { status: 400, message: 'So dien thoai bat buoc.' };
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const userId = await generateNextUserId(connection, 'student');
    const passwordHash = hashPassword(password);

    await connection.execute(
      'INSERT INTO user_accounts (user_id, password_sha, role) VALUES (?, ?, ?)',
      [userId, passwordHash, 'student']
    );

      const emailCheck = await connection.execute(
        'SELECT 1 FROM students WHERE email = ? LIMIT 1',
        [email]
      );
      if (emailCheck[0].length) {
        throw { status: 409, message: 'Email da duoc su dung.' };
      }

      const phoneCheck = await connection.execute(
        'SELECT 1 FROM students WHERE phone_number = ? LIMIT 1',
        [phoneNumber]
      );
      if (phoneCheck[0].length) {
        throw { status: 409, message: 'So dien thoai da duoc su dung.' };
      }

      await connection.execute(
        `INSERT INTO students (user_id, full_name, gender, birth_date, phone_number, email, class_code, department)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          fullName,
          'other',
          null,
          phoneNumber,
          email,
          null,
          null,
        ]
      );

    await connection.commit();
    return { userId };
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Failed to rollback student self-registration:', rollbackError);
      }
    }

    if (error && error.code === 'ER_DUP_ENTRY') {
      throw { status: 409, message: 'Email hoac so dien thoai da duoc su dung.' };
    }

    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

/**
 * Lay danh sach tat ca users kem theo thong tin profile
 * Su dung UNION de ket hop students, teachers, admin_profiles
 */
async function getAllUsersWithProfiles({ page = 1, limit = 20, search = '', role = '' }) {
  const offset = (page - 1) * limit;

  // Build WHERE clauses
  let whereConditions = [];
  let countWhereConditions = [];
  let params = [];
  let countParams = [];

  if (search) {
    whereConditions.push('(u.user_id LIKE ? OR full_name LIKE ? OR email LIKE ? OR phone_number LIKE ?)');
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  if (role) {
    whereConditions.push('u.role = ?');
    countWhereConditions.push('role = ?');
    params.push(role);
    countParams.push(role);
  }

  const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
  const countWhereClause = countWhereConditions.length > 0 ? 'WHERE ' + countWhereConditions.join(' AND ') : '';

  // Count total
  const [countResult] = await pool.execute(
    `SELECT COUNT(*) as total FROM user_accounts ${countWhereClause}`,
    countParams
  );

  // Get users with profiles using UNION
  const query = `
    SELECT
      u.user_id,
      u.role,
      u.is_active,
      u.created_at,
      COALESCE(s.full_name, t.full_name, a.full_name) as full_name,
      COALESCE(s.email, t.email, a.email) as email,
      COALESCE(s.phone_number, t.phone_number, a.phone_number) as phone_number
    FROM user_accounts u
    LEFT JOIN students s ON u.user_id = s.user_id AND u.role = 'student'
    LEFT JOIN teachers t ON u.user_id = t.user_id AND u.role = 'teacher'
    LEFT JOIN admin_profiles a ON u.user_id = a.user_id AND u.role = 'admin'
    ${whereClause}
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const [users] = await pool.execute(query, [...params, limit, offset]);

  return {
    users: users.map(user => ({
      userId: user.user_id,
      fullName: user.full_name || '-',
      email: user.email || '-',
      phoneNumber: user.phone_number || '-',
      role: user.role,
      isActive: Boolean(user.is_active),
      createdAt: user.created_at,
    })),
    pagination: {
      total: countResult[0].total,
      page,
      limit,
      totalPages: Math.ceil(countResult[0].total / limit),
    },
  };
}

/**
 * Xoa user account va profile lien quan
 */
async function deleteUserAccount(userId) {
  // Check role
  const [user] = await pool.execute(
    'SELECT role FROM user_accounts WHERE user_id = ?',
    [userId]
  );

  if (!user.length) {
    return { success: false, error: 'Khong tim thay nguoi dung' };
  }

  if (user[0].role === 'admin') {
    return { success: false, error: 'Khong the xoa tai khoan admin' };
  }

  // Delete (CASCADE will handle profile deletion)
  await pool.execute('DELETE FROM user_accounts WHERE user_id = ?', [userId]);

  return { success: true };
}

/**
 * Cap nhat thong tin user
 */
async function updateUserProfile(userId, updates) {
  const [user] = await pool.execute(
    'SELECT role FROM user_accounts WHERE user_id = ?',
    [userId]
  );

  if (!user.length) {
    return { success: false, error: 'Khong tim thay nguoi dung' };
  }

  const role = user[0].role;
  const { fullName, email, phoneNumber, isActive } = updates;

  // Update user_accounts if isActive is provided
  if (isActive !== undefined) {
    await pool.execute(
      'UPDATE user_accounts SET is_active = ? WHERE user_id = ?',
      [isActive ? 1 : 0, userId]
    );
  }

  // Update profile table based on role
  const profileUpdates = [];
  const profileParams = [];

  if (fullName !== undefined) {
    profileUpdates.push('full_name = ?');
    profileParams.push(fullName);
  }
  if (email !== undefined) {
    profileUpdates.push('email = ?');
    profileParams.push(email);
  }
  if (phoneNumber !== undefined) {
    profileUpdates.push('phone_number = ?');
    profileParams.push(phoneNumber);
  }

  if (profileUpdates.length > 0) {
    profileParams.push(userId);

    let tableName;
    if (role === 'student') tableName = 'students';
    else if (role === 'teacher') tableName = 'teachers';
    else if (role === 'admin') tableName = 'admin_profiles';

    if (tableName) {
      await pool.execute(
        `UPDATE ${tableName} SET ${profileUpdates.join(', ')} WHERE user_id = ?`,
        profileParams
      );
    }
  }

  return { success: true };
}

module.exports = {
  normalizeRole,
  toNullableString,
  buildStudentInfo,
  buildTeacherInfo,
  buildAdminInfo,
  createAccountWithProfile,
  createAccountForAdmin,
  resetPasswordForUser,
  registerStudentAccount,
  getAllUsersWithProfiles,
  deleteUserAccount,
  updateUserProfile,
};

