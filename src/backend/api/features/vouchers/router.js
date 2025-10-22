// Ghi chu: Router cho voucher validation (public API)
const express = require('express');
const { requireUserAuth } = require('../auth/middleware/requireAuth');
const { validateVoucherHandler } = require('./controllers/voucherController');

const router = express.Router();

// POST /api/vouchers/validate - Validate voucher (can dang nhap)
router.post('/validate', requireUserAuth, validateVoucherHandler);

module.exports = {
  vouchersRouter: router,
};
