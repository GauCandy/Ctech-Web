// Ghi chu: Xu ly cac hanh dong cua admin lien quan den tai khoan nguoi dung.
const { createAccountForAdmin, resetPasswordForUser } = require('../services/accountService');
const { validatePasswordStrength } = require('../../../shared/password');

// Ham phan hoi loi dang chung bang tieng Viet cho de doc.
function handleServiceError(res, error) {
  if (error.status && error.message) {
    return res.status(error.status).json({ error: error.message });
  }

  console.error('Loi server tai accountController:', error);
  return res.status(500).json({ error: 'Khong the xu ly yeu cau.' });
}

// Admin tao tai khoan nguoi dung moi.
async function createAccount(req, res) {
  try {
    const payload = req.body || {};
    const result = await createAccountForAdmin(payload);
    return res.status(201).json(result);
  } catch (error) {
    return handleServiceError(res, error);
  }
}

// Admin dat lai mat khau cho nguoi dung.
async function resetAccountPassword(req, res) {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body || {};

    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ error: 'Mat khau moi bat buoc.' });
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return res.status(400).json({ error: strength.message });
    }

    const result = await resetPasswordForUser({ userId, newPassword });
    if (!result) {
      return res.status(404).json({ error: 'Khong tim thay tai khoan.' });
    }

    return res.json({ message: 'Dat lai mat khau thanh cong.' });
  } catch (error) {
    return handleServiceError(res, error);
  }
}

module.exports = {
  createAccount,
  resetAccountPassword,
};
