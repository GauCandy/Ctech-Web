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
  uploadServiceImage,
} = require('./controllers/serviceController');
const {
  listVouchersHandler,
  getVoucherHandler,
  createVoucherHandler,
  updateVoucherHandler,
  deleteVoucherHandler,
} = require('./controllers/voucherController');
const {
  getAdminStats,
  getAllUsers,
  deleteUser,
  updateUser,
} = require('./controllers/statsController');
const { upload } = require('../../../middleware/uploadImage');

const router = express.Router();

// GET /api/admin/stats - Lay thong ke tong quan cho admin dashboard.
router.get('/stats', requireAdminAuth, getAdminStats);

// GET /api/admin/users - Lay danh sach tat ca users (phan trang).
router.get('/users', requireAdminAuth, getAllUsers);
// PUT /api/admin/users/:userId - Cap nhat thong tin user.
router.put('/users/:userId', requireAdminAuth, updateUser);
// DELETE /api/admin/users/:userId - Xoa user.
router.delete('/users/:userId', requireAdminAuth, deleteUser);

// POST /api/admin/accounts - Tao tai khoan moi, chi cho admin da xac thuc.
router.post('/accounts', requireAdminAuth, createAccount);
// POST /api/admin/accounts/:userId/reset-password - Admin dat lai mat khau cho nguoi dung.
router.post('/accounts/:userId/reset-password', requireAdminAuth, resetAccountPassword);

// POST /api/admin/services - Admin tao dich vu moi.
router.post('/services', requireAdminAuth, createService);
// PUT /api/admin/services/:code - Admin cap nhat thong tin dich vu.
router.put('/services/:code', requireAdminAuth, updateServiceDetails);
// POST /api/admin/services/:code/upload-image - Admin upload hinh anh cho dich vu.
router.post('/services/:code/upload-image', requireAdminAuth, upload.single('image'), uploadServiceImage);
// DELETE /api/admin/services/:code - Admin xoa dich vu.
router.delete('/services/:code', requireAdminAuth, removeService);

// GET /api/admin/vouchers - Admin lay danh sach voucher.
router.get('/vouchers', requireAdminAuth, listVouchersHandler);
// GET /api/admin/vouchers/:code - Admin lay chi tiet voucher.
router.get('/vouchers/:code', requireAdminAuth, getVoucherHandler);
// POST /api/admin/vouchers - Admin tao voucher moi.
router.post('/vouchers', requireAdminAuth, createVoucherHandler);
// PUT /api/admin/vouchers/:code - Admin cap nhat voucher.
router.put('/vouchers/:code', requireAdminAuth, updateVoucherHandler);
// DELETE /api/admin/vouchers/:code - Admin xoa voucher.
router.delete('/vouchers/:code', requireAdminAuth, deleteVoucherHandler);

module.exports = {
  adminRouter: router,
};
