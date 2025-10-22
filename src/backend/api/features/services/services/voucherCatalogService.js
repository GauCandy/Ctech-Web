// Ghi chu: Service layer cho voucher catalog (public API)
const { pool } = require('../../../../database/connection');

// Lay danh sach voucher con hieu luc (cho user xem)
async function listActiveVouchers({ appliesTo, targetCode } = {}) {
  const conditions = ['is_active = 1'];
  const params = [];
  const now = new Date();

  // Chi lay voucher dang trong thoi gian hieu luc
  conditions.push('valid_from <= ?');
  params.push(now);
  conditions.push('valid_until >= ?');
  params.push(now);

  // Loc theo pham vi ap dung
  if (appliesTo) {
    conditions.push('applies_to = ?');
    params.push(appliesTo);
  }

  if (targetCode) {
    conditions.push('(target_code = ? OR applies_to = "all")');
    params.push(targetCode);
  }

  // Chi lay voucher con luot su dung (hoac khong gioi han)
  conditions.push('(usage_limit IS NULL OR used_count < usage_limit)');

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const sql = `SELECT
    voucher_code AS voucherCode,
    name,
    description,
    discount_type AS discountType,
    discount_value AS discountValue,
    max_discount AS maxDiscount,
    min_order_value AS minOrderValue,
    applies_to AS appliesTo,
    target_code AS targetCode,
    valid_from AS validFrom,
    valid_until AS validUntil
  FROM vouchers
  ${whereClause}
  ORDER BY created_at DESC`;

  const [rows] = await pool.execute(sql, params);

  return rows.map(row => ({
    voucherCode: row.voucherCode,
    name: row.name,
    description: row.description,
    discountType: row.discountType,
    discountValue: Number(row.discountValue),
    maxDiscount: row.maxDiscount ? Number(row.maxDiscount) : null,
    minOrderValue: row.minOrderValue ? Number(row.minOrderValue) : null,
    appliesTo: row.appliesTo,
    targetCode: row.targetCode,
    validFrom: row.validFrom,
    validUntil: row.validUntil,
  }));
}

// Lay voucher ap dung cho mot service cu the
async function getVouchersForService(serviceCode) {
  // Lay category cua service
  const [serviceRows] = await pool.execute(
    'SELECT category FROM services WHERE service_code = ?',
    [serviceCode]
  );

  if (serviceRows.length === 0) {
    return [];
  }

  const category = serviceRows[0].category;
  const now = new Date();

  const sql = `SELECT
    voucher_code AS voucherCode,
    name,
    description,
    discount_type AS discountType,
    discount_value AS discountValue,
    max_discount AS maxDiscount,
    min_order_value AS minOrderValue,
    applies_to AS appliesTo,
    target_code AS targetCode,
    valid_from AS validFrom,
    valid_until AS validUntil
  FROM vouchers
  WHERE is_active = 1
    AND valid_from <= ?
    AND valid_until >= ?
    AND (usage_limit IS NULL OR used_count < usage_limit)
    AND (
      applies_to = 'all'
      OR (applies_to = 'service' AND target_code = ?)
      OR (applies_to = 'category' AND target_code = ?)
    )
  ORDER BY discount_value DESC`;

  const [rows] = await pool.execute(sql, [now, now, serviceCode, category]);

  return rows.map(row => ({
    voucherCode: row.voucherCode,
    name: row.name,
    description: row.description,
    discountType: row.discountType,
    discountValue: Number(row.discountValue),
    maxDiscount: row.maxDiscount ? Number(row.maxDiscount) : null,
    minOrderValue: row.minOrderValue ? Number(row.minOrderValue) : null,
    appliesTo: row.appliesTo,
    targetCode: row.targetCode,
    validFrom: row.validFrom,
    validUntil: row.validUntil,
  }));
}

module.exports = {
  listActiveVouchers,
  getVouchersForService,
};
