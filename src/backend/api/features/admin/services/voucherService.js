// Ghi chu: Xu ly nghiep vu lien quan den voucher cho admin
const { pool } = require('../../../../database/connection');

const VOUCHER_SELECT_COLUMNS = `SELECT
  id,
  voucher_code AS voucherCode,
  name,
  description,
  discount_type AS discountType,
  discount_value AS discountValue,
  max_discount AS maxDiscount,
  min_order_value AS minOrderValue,
  applies_to AS appliesTo,
  target_code AS targetCode,
  usage_limit AS usageLimit,
  used_count AS usedCount,
  valid_from AS validFrom,
  valid_until AS validUntil,
  is_active AS isActive,
  created_at AS createdAt,
  updated_at AS updatedAt
FROM vouchers`;

// Chuyen doi dong du lieu SQL sang doi tuong voucher
function mapVoucherRow(row) {
  if (!row) return null;

  return {
    id: row.id,
    voucherCode: row.voucherCode,
    name: row.name,
    description: row.description,
    discountType: row.discountType,
    discountValue: Number(row.discountValue),
    maxDiscount: row.maxDiscount ? Number(row.maxDiscount) : null,
    minOrderValue: row.minOrderValue ? Number(row.minOrderValue) : null,
    appliesTo: row.appliesTo,
    targetCode: row.targetCode,
    usageLimit: row.usageLimit,
    usedCount: row.usedCount,
    validFrom: row.validFrom,
    validUntil: row.validUntil,
    isActive: Boolean(row.isActive),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// Lay danh sach tat ca voucher
async function listVouchers({ isActive, appliesTo } = {}) {
  const conditions = [];
  const params = [];

  if (isActive !== undefined && isActive !== null) {
    conditions.push('is_active = ?');
    params.push(isActive ? 1 : 0);
  }

  if (appliesTo) {
    conditions.push('applies_to = ?');
    params.push(appliesTo);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `${VOUCHER_SELECT_COLUMNS} ${whereClause} ORDER BY created_at DESC`;

  const [rows] = await pool.execute(sql, params);
  return rows.map(mapVoucherRow);
}

// Lay thong tin chi tiet 1 voucher theo code
async function getVoucherByCode(voucherCode) {
  const sql = `${VOUCHER_SELECT_COLUMNS} WHERE voucher_code = ?`;
  const [rows] = await pool.execute(sql, [voucherCode]);
  return mapVoucherRow(rows[0]);
}

// Tao voucher moi
async function createVoucher(voucherData) {
  const {
    voucherCode,
    name,
    description,
    discountType,
    discountValue,
    maxDiscount,
    minOrderValue,
    appliesTo,
    targetCode,
    usageLimit,
    validFrom,
    validUntil,
    isActive,
  } = voucherData;

  const sql = `INSERT INTO vouchers (
    voucher_code, name, description, discount_type, discount_value,
    max_discount, min_order_value, applies_to, target_code,
    usage_limit, valid_from, valid_until, is_active
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  await pool.execute(sql, [
    voucherCode,
    name,
    description || null,
    discountType,
    discountValue,
    maxDiscount || null,
    minOrderValue || null,
    appliesTo || 'all',
    targetCode || null,
    usageLimit || null,
    validFrom,
    validUntil,
    isActive ? 1 : 0,
  ]);

  return getVoucherByCode(voucherCode);
}

// Cap nhat voucher
async function updateVoucher(voucherCode, updates) {
  const assignments = [];
  const params = [];

  const fieldMap = {
    name: 'name',
    description: 'description',
    discountType: 'discount_type',
    discountValue: 'discount_value',
    maxDiscount: 'max_discount',
    minOrderValue: 'min_order_value',
    appliesTo: 'applies_to',
    targetCode: 'target_code',
    usageLimit: 'usage_limit',
    validFrom: 'valid_from',
    validUntil: 'valid_until',
    isActive: 'is_active',
  };

  for (const [key, dbColumn] of Object.entries(fieldMap)) {
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      assignments.push(`${dbColumn} = ?`);
      let value = updates[key];
      if (key === 'isActive') {
        value = value ? 1 : 0;
      }
      params.push(value);
    }
  }

  if (assignments.length === 0) {
    return null;
  }

  params.push(voucherCode);
  const sql = `UPDATE vouchers SET ${assignments.join(', ')} WHERE voucher_code = ?`;
  const [result] = await pool.execute(sql, params);

  if (result.affectedRows === 0) {
    return null;
  }

  return getVoucherByCode(voucherCode);
}

// Xoa voucher
async function deleteVoucher(voucherCode) {
  const [result] = await pool.execute('DELETE FROM vouchers WHERE voucher_code = ?', [voucherCode]);
  return result.affectedRows > 0;
}

// Tang used_count khi voucher duoc su dung
async function incrementVoucherUsage(voucherCode) {
  const sql = 'UPDATE vouchers SET used_count = used_count + 1 WHERE voucher_code = ?';
  await pool.execute(sql, [voucherCode]);
}

module.exports = {
  listVouchers,
  getVoucherByCode,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  incrementVoucherUsage,
};
