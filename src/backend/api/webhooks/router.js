// Router cho các webhooks
const express = require('express');
const { verifySepayApiKey } = require('../shared/sepayAuth');
const { handleSepayWebhook } = require('./sepayController');

const router = express.Router();

// POST /hooks/sepay-payment - Nhận webhook từ SePay
router.post('/sepay-payment', verifySepayApiKey, handleSepayWebhook);

module.exports = {
  webhooksRouter: router,
};
