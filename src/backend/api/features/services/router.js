// Ghi chu: Dinh nghia cac endpoint dich vu cho nguoi dung tra cuu va mua dich vu.
const express = require('express');
const { requireUserAuth } = require('../auth/middleware/requireAuth');
const {
  listServicesHandler,
  getServiceHandler,
  purchaseServiceHandler,
  listCategoriesHandler,
} = require('./controllers/serviceController');
const {
  listActiveVouchersHandler,
  getVouchersForServiceHandler,
} = require('./controllers/voucherController');
const {
  getC5Images,
} = require('./controllers/c5ImagesController');

const router = express.Router();

// GET /api/services/categories - Tra ve danh sach tat ca cac danh muc dich vu.
router.get('/categories', listCategoriesHandler);
// GET /api/services/vouchers - Tra ve danh sach voucher con hieu luc.
router.get('/vouchers', listActiveVouchersHandler);
// GET /api/services/5c-images/:id - Tra ve danh sach hinh anh cho 5C card.
router.get('/5c-images/:id', getC5Images);
// GET /api/services - Tra ve danh sach dich vu co the loc theo tu khoa/trang thai/danh muc.
router.get('/', listServicesHandler);
// GET /api/services/:code/vouchers - Tra ve voucher ap dung cho dich vu.
router.get('/:code/vouchers', getVouchersForServiceHandler);
// GET /api/services/:code - Tra ve chi tiet mot dich vu.
router.get('/:code', getServiceHandler);
// POST /api/services/:code/purchase - Tao thong tin mua dich vu, yeu cau dang nhap.
router.post('/:code/purchase', requireUserAuth, purchaseServiceHandler);

module.exports = {
  servicesRouter: router,
};
