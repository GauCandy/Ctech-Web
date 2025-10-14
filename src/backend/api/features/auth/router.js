// Ghi chu: Dinh nghia cac duong dan dang nhap, dang xuat va doi mat khau cho nguoi dung.
const express = require('express');
const { login, logout, changePassword, registerStudent, getCurrentUser } = require('./controllers/authController');
const { requireUserAuth } = require('./middleware/requireAuth');

const router = express.Router();

// POST /api/auth/login - Nhan thong tin dang nhap va tra ve token.
router.post('/login', login);
// POST /api/auth/logout - Xoa phien dang nhap bang token hien tai.
router.post('/logout', logout);
// POST /api/auth/change-password - Nguoi dung doi mat khau, can token hop le.
router.post('/change-password', requireUserAuth, changePassword);
// POST /api/auth/register - Sinh vien tu dang ky tai khoan moi.
router.post('/register', registerStudent);
// GET /api/auth/me - Lay thong tin nguoi dang dang nhap.
router.get('/me', requireUserAuth, getCurrentUser);

module.exports = {
  authRouter: router,
};
