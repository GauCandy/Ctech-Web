// Ghi chu: Xu ly cac request CRUD doc thong tin dich vu va tao ma thanh toan gia lap.
const crypto = require('crypto');
const { listServices, getServiceByCode } = require('../services/serviceCatalogService');
const { createOrder } = require('../../orders/services/orderService');

// Tao ma giao dich 6 ky tu ngau nhien (chi chu cai hoa va so)
function generateTransactionCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Tao URL QR VietQR
function generateVietQRUrl(amount, transactionCode) {
  const bankBin = process.env.BANK_BIN || '970422';
  const bankNumber = process.env.BANK_NUMBER || '0372360619';
  const bankOwner = process.env.BANK_OWNER || 'Tran Tuan Tu';

  // VietQR quick link format - su dung qr_only de chi hien thi ma QR
  const qrUrl = `https://img.vietqr.io/image/${bankBin}-${bankNumber}-qr_only.png?amount=${amount}&addInfo=${encodeURIComponent(transactionCode)}&accountName=${encodeURIComponent(bankOwner)}`;

  return qrUrl;
}

// Lay danh sach dich vu, ho tro tim kiem theo tu khoa va trang thai.
async function listServicesHandler(req, res, next) {
  try {
    const { q, active } = req.query || {};
    const services = await listServices({
      searchTerm: q,
      activeFilter: active,
    });

    res.json({ services });
  } catch (error) {
    next(error);
  }
}

// Lay chi tiet mot dich vu theo ma.
async function getServiceHandler(req, res, next) {
  try {
    const code = String(req.params.code || '').trim();
    if (!code) {
      return res.status(400).json({ error: 'Service code is required.' });
    }

    const service = await getServiceByCode(code.toUpperCase());
    if (!service) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    return res.json(service);
  } catch (error) {
    return next(error);
  }
}

// Tao ma thanh toan cho giao vien/sinh vien mua dich vu.
async function purchaseServiceHandler(req, res, next) {
  try {
    const code = String(req.params.code || '').trim();
    if (!code) {
      return res.status(400).json({ error: 'Service code is required.' });
    }

    const normalizedCode = code.toUpperCase();
    const role = req.auth && req.auth.role;
    if (role !== 'teacher' && role !== 'student') {
      return res.status(403).json({ error: 'Only teacher or student accounts can purchase services.' });
    }

    const service = await getServiceByCode(normalizedCode);
    if (!service) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    if (!service.isActive) {
      return res.status(400).json({ error: 'Service is not currently active.' });
    }

    const transactionCode = generateTransactionCode();
    const amount = service.price || 0;
    const qrCodeUrl = generateVietQRUrl(amount, transactionCode);

    const notes = req.body && typeof req.body.notes === 'string'
      ? req.body.notes.trim()
      : null;

    // Tao don hang trong database
    const order = await createOrder({
      userId: req.auth.userId,
      serviceCode: normalizedCode,
      transactionCode,
      amount,
      notes,
    });

    const response = {
      orderCode: order.orderCode,
      transactionCode,
      qrCodeUrl,
      amount,
      bankInfo: {
        bankName: process.env.BANK_NAME || 'MB Bank',
        bankOwner: process.env.BANK_OWNER || 'Tran Tuan Tu',
        bankNumber: process.env.BANK_NUMBER || '0372360619',
      },
      issuedAt: new Date().toISOString(),
      service,
      user: {
        userId: req.auth.userId,
        role,
      },
    };

    if (notes) {
      response.notes = notes;
    }

    console.log('[PURCHASE SERVICE] Tao don hang thanh cong:', order.orderCode, '- Ma GD:', transactionCode);

    return res.status(201).json(response);
  } catch (error) {
    console.error('[PURCHASE SERVICE] Loi tao ma thanh toan:', error);
    return next(error);
  }
}

module.exports = {
  listServicesHandler,
  getServiceHandler,
  purchaseServiceHandler,
};
