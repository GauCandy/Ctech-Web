// Ghi chu: Dinh nghia cac route cho quan ly don hang
const express = require('express');
const { requireUserAuth } = require('../../auth/middleware/requireAuth');
const {
  createOrderHandler,
  completePaymentHandler,
  getUserOrdersHandler,
  getCompletedOrdersHandler,
  getOrderDetailsHandler,
} = require('../controllers/orderController');

const router = express.Router();

// Tao don hang moi (yeu cau dang nhap)
router.post('/', requireUserAuth, createOrderHandler);

// Lay danh sach don hang cua user hien tai (yeu cau dang nhap)
router.get('/my-orders', requireUserAuth, getUserOrdersHandler);

// Lay tat ca don hang da thanh toan (chi admin)
router.get('/completed', requireUserAuth, getCompletedOrdersHandler);

// Cap nhat trang thai thanh toan thanh "completed" (yeu cau dang nhap)
router.patch('/:orderCode/complete', requireUserAuth, completePaymentHandler);

// Lay chi tiet don hang theo ma (yeu cau dang nhap)
router.get('/:orderCode', requireUserAuth, getOrderDetailsHandler);

module.exports = router;
