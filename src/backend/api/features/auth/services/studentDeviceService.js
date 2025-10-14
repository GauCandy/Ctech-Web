// Ghi chu: Giam sat thiet bi dang nhap cua sinh vien de tranh chia se tai khoan.
const crypto = require('crypto');
const { pool } = require('../../../../database/connection');

const STUDENT_DEVICE_INACTIVITY_MS = 7 * 24 * 60 * 60 * 1000;

// Chuan hoa deviceId tu client, loai bo khoang trang va gia tri rong.
function normalizeDeviceId(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const str = String(value).trim();
  return str.length ? str : null;
}

// Sinh ma thiet bi ngau nhien cho sinh vien.
function generateDeviceId() {
  return 'dev_' + crypto.randomBytes(12).toString('hex');
}

// Dam bao ma thiet bi moi khong bi trung lap.
async function generateUniqueDeviceId(connection) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateDeviceId();
    const [existing] = await connection.execute(
      'SELECT device_id FROM student_device_registry WHERE device_id = ?',
      [candidate]
    );

    if (!existing.length) {
      return candidate;
    }
  }

  throw new Error('Failed to allocate unique device ID.');
}

// Ap dung chinh sach 1 sinh vien - 1 thiet bi trong khoang thoi gian quy dinh.
async function enforceStudentDevicePolicy(userId, deviceId) {
  let normalizedDeviceId = normalizeDeviceId(deviceId);
  const connection = await pool.getConnection();
  const now = new Date();

  let generated = false;
  let allowed = true;
  let denialStatus = 403;
  let denialMessage = null;

  try {
    await connection.beginTransaction();

    if (!normalizedDeviceId) {
      normalizedDeviceId = await generateUniqueDeviceId(connection);
      generated = true;

      await connection.execute(
        'INSERT INTO student_device_registry (device_id, current_user_id, last_login_at) VALUES (?, ?, ?)',
        [normalizedDeviceId, userId, now]
      );
    } else {
      const [records] = await connection.execute(
        'SELECT current_user_id, last_login_at FROM student_device_registry WHERE device_id = ? FOR UPDATE',
        [normalizedDeviceId]
      );

      if (records.length) {
        const deviceRecord = records[0];

        if (deviceRecord.current_user_id !== userId) {
          const lastLoginMs = deviceRecord.last_login_at ? new Date(deviceRecord.last_login_at).getTime() : 0;
          const threshold = now.getTime() - STUDENT_DEVICE_INACTIVITY_MS;

          if (lastLoginMs && lastLoginMs > threshold) {
            allowed = false;
            denialMessage = 'This device is assigned to another student within the past 7 days.';
          } else {
            await connection.execute(
              'UPDATE student_device_registry SET current_user_id = ?, last_login_at = ? WHERE device_id = ?',
              [userId, now, normalizedDeviceId]
            );
          }
        } else {
          await connection.execute(
            'UPDATE student_device_registry SET last_login_at = ? WHERE device_id = ?',
            [now, normalizedDeviceId]
          );
        }
      } else {
        await connection.execute(
          'INSERT INTO student_device_registry (device_id, current_user_id, last_login_at) VALUES (?, ?, ?)',
          [normalizedDeviceId, userId, now]
        );
      }
    }

    if (!allowed) {
      await connection.rollback();
      return {
        allowed: false,
        status: denialStatus,
        message: denialMessage || 'This device is not permitted to use this account.',
      };
    }

    await connection.execute(
      'INSERT INTO student_device_logins (user_id, device_id, login_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE login_at = VALUES(login_at)',
      [userId, normalizedDeviceId, now]
    );

    await connection.commit();

    return {
      allowed: true,
      normalizedDeviceId,
      generated,
    };
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error('Failed to rollback student device transaction:', rollbackError);
    }
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  enforceStudentDevicePolicy,
};
