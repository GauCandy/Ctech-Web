// Ghi chu: Dinh nghia cac endpoint danh cho quan tri vien va lien ket den cac controller tuong ung.
const express = require('express');
const { requireAdminAuth } = require('../auth/middleware/requireAuth');
const {
  createAccount,
  resetAccountPassword,
} = require('./controllers/accountController');
const {
  createService,
  updateServiceDetails,
  removeService,
} = require('./controllers/serviceController');

const router = express.Router();

// POST /api/admin/accounts - Tao tai khoan moi, chi cho admin da xac thuc.
router.post('/accounts', requireAdminAuth, createAccount);
// POST /api/admin/accounts/:userId/reset-password - Admin dat lai mat khau cho nguoi dung.
router.post('/accounts/:userId/reset-password', requireAdminAuth, resetAccountPassword);

// POST /api/admin/services - Admin tao dich vu moi.
router.post('/services', requireAdminAuth, createService);
// PUT /api/admin/services/:code - Admin cap nhat thong tin dich vu.
router.put('/services/:code', requireAdminAuth, updateServiceDetails);
// DELETE /api/admin/services/:code - Admin xoa dich vu.
router.delete('/services/:code', requireAdminAuth, removeService);

module.exports = {
  adminRouter: router,
};
