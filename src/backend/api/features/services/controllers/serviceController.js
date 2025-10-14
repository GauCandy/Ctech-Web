// Ghi chu: Xu ly cac request CRUD doc thong tin dich vu va tao ma thanh toan gia lap.
const crypto = require('crypto');
const { listServices, getServiceByCode } = require('../services/serviceCatalogService');

// Tao ma thanh toan ket hop ma dich vu va chuoi ngau nhien.
function createPaymentCode(serviceCode) {
  if (typeof crypto.randomUUID === 'function') {
    return `${serviceCode}-${crypto.randomUUID()}`;
  }

  return `${serviceCode}-${crypto.randomBytes(16).toString('hex')}`;
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

    const paymentCode = createPaymentCode(service.serviceCode);
    const notes = req.body && typeof req.body.notes === 'string'
      ? req.body.notes.trim()
      : null;

    const response = {
      paymentCode,
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

    return res.status(201).json(response);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listServicesHandler,
  getServiceHandler,
  purchaseServiceHandler,
};
