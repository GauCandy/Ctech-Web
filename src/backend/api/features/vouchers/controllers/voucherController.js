// Ghi chu: Controller xu ly HTTP request cho voucher validation (user)
const { validateVoucher } = require('../services/voucherValidationService');

// Validate voucher
async function validateVoucherHandler(req, res) {
  try {
    const { voucherCode, serviceCode, amount } = req.body;

    if (!voucherCode || !serviceCode || !amount) {
      return res.status(400).json({ error: 'Thieu thong tin bat buoc.' });
    }

    const result = await validateVoucher(voucherCode, serviceCode, Number(amount));

    if (!result.valid) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result.voucher);
  } catch (error) {
    console.error('[VALIDATE VOUCHER] Loi:', error);
    res.status(500).json({ error: 'Khong the validate voucher.' });
  }
}

module.exports = {
  validateVoucherHandler,
};
