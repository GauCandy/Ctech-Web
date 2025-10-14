// Ghi chu: Xu ly dang nhap, dang xuat va doi mat khau cho nguoi dung.
const { pool } = require('../../../../database/connection');
const { hashPassword, validatePasswordStrength } = require('../../../shared/password');
const { destroyUserSessions, createSession, extractToken } = require('../services/sessionService');
const { ensureAdminAccountSeeded, ADMIN_USER, isEnvAdmin } = require('../services/adminAccountService');
const { detectLoginIdentifierType, resolveUserIdsByContact } = require('../services/identifierService');
const { enforceStudentDevicePolicy } = require('../services/studentDeviceService');
const { registerStudentAccount } = require('../../admin/services/accountService');
const { loadAccountProfileRow, buildProfilePayload } = require('../services/userProfileService');

// Sinh viên tự đăng ký tài khoản.
async function registerStudent(req, res, next) {
  try {
    const payload = req.body || {};

    const result = await registerStudentAccount(payload);

    return res.status(201).json({
      message: 'Đăng ký tài khoản sinh viên thành công.',
      user: {
        userId: result.userId,
        role: 'student',
      },
    });
  } catch (error) {
    if (error && error.status && error.message) {
      return res.status(error.status).json({ error: error.message });
    }
    return next(error);
  }
}

// Dang xuat bang cach xoa session token hien tai.
async function logout(req, res, next) {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(400).json({ error: 'Session token is required.' });
    }

    await pool.execute('DELETE FROM user_sessions WHERE token = ?', [token]);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

// Nguoi dung doi mat khau, dong thoi huy cac phien dang nhap cu.
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || typeof currentPassword !== 'string') {
      return res.status(400).json({ error: 'Current password is required.' });
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ error: 'New password is required.' });
    }

    if (isEnvAdmin(req.auth.userId)) {
      return res.status(403).json({ error: 'The owner account password must be managed outside this API.' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different from the current password.' });
    }

    const strength = validatePasswordStrength(newPassword);

    if (!strength.valid) {
      return res.status(400).json({ error: strength.message });
    }

    const [rows] = await pool.execute('SELECT password_sha FROM user_accounts WHERE user_id = ?', [req.auth.userId]);

    if (!rows.length) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    const currentHash = hashPassword(currentPassword);

    if (currentHash !== rows[0].password_sha) {
      return res.status(401).json({ error: 'Invalid current password.' });
    }

    const newHash = hashPassword(newPassword);

    await pool.execute('UPDATE user_accounts SET password_sha = ? WHERE user_id = ?', [newHash, req.auth.userId]);

    await destroyUserSessions(req.auth.userId);

    return res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    return next(error);
  }
}

// Xac thuc thong tin dang nhap va tao token phien lam viec moi.
async function login(req, res, next) {
  try {
    const { username, password } = req.body || {};
    const identifierRaw = typeof username === 'string' ? username.trim() : '';

    if (!identifierRaw || !password) {
      return res.status(400).json({ error: 'Missing identifier or password.' });
    }

    const identifierType = detectLoginIdentifierType(identifierRaw);
    let resolvedUserId = identifierRaw;

    if (identifierType === 'email' || identifierType === 'phone') {
      const candidates = await resolveUserIdsByContact(identifierRaw, identifierType);
      if (!candidates.length) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      if (candidates.length > 1) {
        const methodLabel = identifierType === 'email' ? 'email address' : 'phone number';
        return res.status(409).json({ error: `Multiple accounts share this ${methodLabel}. Please log in using your user ID or another unique method.` });
      }

      [resolvedUserId] = candidates;
    }

    if (resolvedUserId === ADMIN_USER) {
      await ensureAdminAccountSeeded();
    }

    const accountRow = await loadAccountProfileRow(resolvedUserId);
    if (!accountRow) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    if (!accountRow.is_active) {
      return res.status(403).json({ error: 'Account is disabled.' });
    }

    const hashed = hashPassword(password);
    if (hashed !== accountRow.password_sha) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user = {
      user_id: accountRow.user_id,
      role: accountRow.role,
    };

    let deviceInfo = null;
    if (user.role === 'student') {
      const deviceResult = await enforceStudentDevicePolicy(user.user_id, req.body && req.body.deviceId);
      if (!deviceResult.allowed) {
        return res.status(deviceResult.status || 403).json({ error: deviceResult.message });
      }
      deviceInfo = deviceResult;
    }

    const session = await createSession(user.user_id);
    const profile = buildProfilePayload(accountRow);

    const responsePayload = {
      token: session.token,
      expiresAt: session.expiresAt,
      user: {
        userId: user.user_id,
        role: user.role,
        displayName: profile ? profile.displayName : user.user_id,
      },
    };

    if (profile) {
      responsePayload.user.fullName = profile.fullName;
      responsePayload.user.email = profile.email;
      responsePayload.user.phoneNumber = profile.phoneNumber;
      responsePayload.user.department = profile.department;
      responsePayload.user.classCode = profile.classCode;
      responsePayload.user.position = profile.position;
    }

    if (deviceInfo && deviceInfo.normalizedDeviceId) {
      responsePayload.deviceId = deviceInfo.normalizedDeviceId;
      if (deviceInfo.generated) {
        responsePayload.deviceIdIssued = true;
      }
    }

    res.json(responsePayload);
  } catch (error) {
    next(error);
  }
}

async function getCurrentUser(req, res, next) {
  try {
    const auth = req.auth;
    if (!auth) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    const accountRow = await loadAccountProfileRow(auth.userId);
    if (!accountRow) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    const profile = buildProfilePayload(accountRow);

    let device = null;
    if (profile && profile.role === 'student') {
      const [deviceRows] = await pool.execute(
        'SELECT device_id, last_login_at FROM student_device_registry WHERE current_user_id = ? LIMIT 1',
        [auth.userId]
      );
      if (deviceRows.length) {
        const record = deviceRows[0];
        device = {
          deviceId: record.device_id,
          lastLoginAt: record.last_login_at ? new Date(record.last_login_at).toISOString() : null,
        };
      }
    }

    return res.json({
      token: auth.token,
      expiresAt: auth.expiresAt,
      user: profile || {
        userId: auth.userId,
        role: auth.role,
        displayName: auth.displayName || auth.userId,
      },
      device,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  login,
  logout,
  changePassword,
  registerStudent,
  getCurrentUser,
};
