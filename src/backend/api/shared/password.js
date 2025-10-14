// Ghi chu: Cac ham tien ich lam viec voi mat khau (hash, sinh, kiem tra do manh).
const crypto = require('crypto');

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

// Bam SHA-256 de luu mat khau an toan o dang hash.
function hashPassword(plain) {
  return crypto.createHash('sha256').update(plain).digest('hex');
}

// Sinh mat khau ngau nhien dung cho tai khoan moi.
function generatePassword() {
  return crypto.randomBytes(12).toString('hex');
}

// Kiem tra do dai mat khau co nam trong khoang cho phep.
function validatePasswordStrength(password) {
  if (typeof password !== 'string') {
    return { valid: false, message: 'Password must be a string.' };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, message: 'Password must be at least ' + MIN_PASSWORD_LENGTH + ' characters.' };
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return { valid: false, message: 'Password must be at most ' + MAX_PASSWORD_LENGTH + ' characters.' };
  }

  return { valid: true };
}

module.exports = {
  hashPassword,
  generatePassword,
  validatePasswordStrength,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
};
