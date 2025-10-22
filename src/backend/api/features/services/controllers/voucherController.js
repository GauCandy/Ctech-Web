// Ghi chu: Controller xu ly request lien quan den voucher (public API)
const { listActiveVouchers, getVouchersForService } = require('../services/voucherCatalogService');

// Lay danh sach voucher con hieu luc
async function listActiveVouchersHandler(req, res, next) {
  try {
    const { appliesTo, targetCode } = req.query;

    const filters = {};
    if (appliesTo) filters.appliesTo = appliesTo;
    if (targetCode) filters.targetCode = targetCode;

    const vouchers = await listActiveVouchers(filters);
    res.json({ vouchers });
  } catch (error) {
    console.error('Error listing active vouchers:', error);
    next(error);
  }
}

// Lay voucher ap dung cho mot service
async function getVouchersForServiceHandler(req, res, next) {
  try {
    const { serviceCode } = req.params;

    if (!serviceCode) {
      return res.status(400).json({ error: 'Ma dich vu bat buoc.' });
    }

    const vouchers = await getVouchersForService(serviceCode);
    res.json({ vouchers });
  } catch (error) {
    console.error('Error getting vouchers for service:', error);
    next(error);
  }
}

module.exports = {
  listActiveVouchersHandler,
  getVouchersForServiceHandler,
};
