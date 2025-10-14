// Ghi chu: Dinh nghia cac endpoint dich vu cho nguoi dung tra cuu va mua dich vu.
const express = require('express');
const { requireUserAuth } = require('../auth/middleware/requireAuth');
const {
  listServicesHandler,
  getServiceHandler,
  purchaseServiceHandler,
} = require('./controllers/serviceController');

const router = express.Router();

// GET /api/services - Tra ve danh sach dich vu co the loc theo tu khoa/trang thai.
router.get('/', listServicesHandler);
// GET /api/services/:code - Tra ve chi tiet mot dich vu.
router.get('/:code', getServiceHandler);
// POST /api/services/:code/purchase - Tao thong tin mua dich vu, yeu cau dang nhap.
router.post('/:code/purchase', requireUserAuth, purchaseServiceHandler);

module.exports = {
  servicesRouter: router,
};
