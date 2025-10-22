// Ghi chu: Controller xu ly HTTP request cho quan ly voucher (admin)
const {
  listVouchers,
  getVoucherByCode,
  createVoucher,
  updateVoucher,
  deleteVoucher,
} = require('../services/voucherService');

// Lay danh sach voucher
async function listVouchersHandler(req, res) {
  try {
    const { isActive, appliesTo } = req.query;

    const filters = {};
    if (isActive !== undefined) {
      filters.isActive = isActive === 'true' || isActive === '1';
    }
    if (appliesTo) {
      filters.appliesTo = appliesTo;
    }

    const vouchers = await listVouchers(filters);
    res.json({ vouchers });
  } catch (error) {
    console.error('[LIST VOUCHERS] Loi:', error);
    res.status(500).json({ error: 'Khong the lay danh sach voucher.' });
  }
}

// Lay chi tiet voucher
async function getVoucherHandler(req, res) {
  try {
    const { code } = req.params;
    const voucher = await getVoucherByCode(code);

    if (!voucher) {
      return res.status(404).json({ error: 'Khong tim thay voucher.' });
    }

    res.json(voucher);
  } catch (error) {
    console.error('[GET VOUCHER] Loi:', error);
    res.status(500).json({ error: 'Khong the lay thong tin voucher.' });
  }
}

// Tao voucher moi
async function createVoucherHandler(req, res) {
  try {
    const body = req.body || {};

    // Validate required fields
    if (!body.voucherCode || !body.name || !body.discountType || !body.discountValue || !body.validFrom || !body.validUntil) {
      return res.status(400).json({ error: 'Thieu thong tin bat buoc.' });
    }

    // Validate discount type
    if (!['percentage', 'fixed'].includes(body.discountType)) {
      return res.status(400).json({ error: 'discount_type phai la percentage hoac fixed.' });
    }

    // Validate applies_to
    if (body.appliesTo && !['all', 'service', 'category'].includes(body.appliesTo)) {
      return res.status(400).json({ error: 'applies_to phai la all, service hoac category.' });
    }

    const voucherData = {
      voucherCode: String(body.voucherCode).trim().toUpperCase(),
      name: String(body.name).trim(),
      description: body.description ? String(body.description).trim() : null,
      discountType: body.discountType,
      discountValue: Number(body.discountValue),
      maxDiscount: body.maxDiscount ? Number(body.maxDiscount) : null,
      minOrderValue: body.minOrderValue ? Number(body.minOrderValue) : null,
      appliesTo: body.appliesTo || 'all',
      targetCode: body.targetCode ? String(body.targetCode).trim() : null,
      usageLimit: body.usageLimit ? Number(body.usageLimit) : null,
      validFrom: body.validFrom,
      validUntil: body.validUntil,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    };

    console.log('[CREATE VOUCHER] Du lieu:', JSON.stringify(voucherData, null, 2));
    const voucher = await createVoucher(voucherData);
    console.log('[CREATE VOUCHER] Thanh cong:', voucher.voucherCode);

    res.status(201).json(voucher);
  } catch (error) {
    console.error('[CREATE VOUCHER] Loi:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ma voucher da ton tai.' });
    }
    res.status(500).json({ error: 'Khong the tao voucher.' });
  }
}

// Cap nhat voucher
async function updateVoucherHandler(req, res) {
  try {
    const { code } = req.params;
    const body = req.body || {};

    const updates = {};
    if (body.name !== undefined) updates.name = String(body.name).trim();
    if (body.description !== undefined) updates.description = body.description ? String(body.description).trim() : null;
    if (body.discountType !== undefined) {
      if (!['percentage', 'fixed'].includes(body.discountType)) {
        return res.status(400).json({ error: 'discount_type phai la percentage hoac fixed.' });
      }
      updates.discountType = body.discountType;
    }
    if (body.discountValue !== undefined) updates.discountValue = Number(body.discountValue);
    if (body.maxDiscount !== undefined) updates.maxDiscount = body.maxDiscount ? Number(body.maxDiscount) : null;
    if (body.minOrderValue !== undefined) updates.minOrderValue = body.minOrderValue ? Number(body.minOrderValue) : null;
    if (body.appliesTo !== undefined) {
      if (!['all', 'service', 'category'].includes(body.appliesTo)) {
        return res.status(400).json({ error: 'applies_to phai la all, service hoac category.' });
      }
      updates.appliesTo = body.appliesTo;
    }
    if (body.targetCode !== undefined) updates.targetCode = body.targetCode ? String(body.targetCode).trim() : null;
    if (body.usageLimit !== undefined) updates.usageLimit = body.usageLimit ? Number(body.usageLimit) : null;
    if (body.validFrom !== undefined) updates.validFrom = body.validFrom;
    if (body.validUntil !== undefined) updates.validUntil = body.validUntil;
    if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive);

    console.log('[UPDATE VOUCHER] Ma:', code, '- Cap nhat:', JSON.stringify(updates, null, 2));
    const voucher = await updateVoucher(code, updates);

    if (!voucher) {
      return res.status(404).json({ error: 'Khong tim thay voucher.' });
    }

    console.log('[UPDATE VOUCHER] Thanh cong:', code);
    res.json(voucher);
  } catch (error) {
    console.error('[UPDATE VOUCHER] Loi:', error);
    res.status(500).json({ error: 'Khong the cap nhat voucher.' });
  }
}

// Xoa voucher
async function deleteVoucherHandler(req, res) {
  try {
    const { code } = req.params;

    console.log('[DELETE VOUCHER] Xoa:', code);
    const deleted = await deleteVoucher(code);

    if (!deleted) {
      return res.status(404).json({ error: 'Khong tim thay voucher.' });
    }

    console.log('[DELETE VOUCHER] Thanh cong:', code);
    res.status(204).send();
  } catch (error) {
    console.error('[DELETE VOUCHER] Loi:', error);
    res.status(500).json({ error: 'Khong the xoa voucher.' });
  }
}

module.exports = {
  listVouchersHandler,
  getVoucherHandler,
  createVoucherHandler,
  updateVoucherHandler,
  deleteVoucherHandler,
};
