// Ghi chu: Xu ly validate va apply voucher cho user
const { pool } = require('../../../../database/connection');

// Kiem tra voucher co hop le khong
async function validateVoucher(voucherCode, serviceCode, orderAmount) {
  // Lay thong tin voucher
  const [rows] = await pool.execute(
    `SELECT * FROM vouchers WHERE voucher_code = ?`,
    [voucherCode]
  );

  if (rows.length === 0) {
    return { valid: false, error: 'Ma voucher khong ton tai.' };
  }

  const voucher = rows[0];

  // Kiem tra trang thai active
  if (!voucher.is_active) {
    return { valid: false, error: 'Ma voucher khong kha dung.' };
  }

  // Kiem tra thoi han
  const now = new Date();
  const validFrom = new Date(voucher.valid_from);
  const validUntil = new Date(voucher.valid_until);

  if (now < validFrom) {
    return { valid: false, error: 'Ma voucher chua den thoi gian su dung.' };
  }

  if (now > validUntil) {
    return { valid: false, error: 'Ma voucher da het han.' };
  }

  // Kiem tra so lan su dung
  if (voucher.usage_limit !== null && voucher.used_count >= voucher.usage_limit) {
    return { valid: false, error: 'Ma voucher da het luot su dung.' };
  }

  // Kiem tra gia tri don hang toi thieu
  if (voucher.min_order_value && orderAmount < voucher.min_order_value) {
    return {
      valid: false,
      error: `Don hang phai toi thieu ${voucher.min_order_value} VND de su dung voucher nay.`
    };
  }

  // Kiem tra pham vi ap dung
  if (voucher.applies_to === 'service' && voucher.target_code !== serviceCode) {
    return {
      valid: false,
      error: 'Ma voucher khong ap dung cho dich vu nay.'
    };
  }

  if (voucher.applies_to === 'category') {
    // Lay category cua service
    const [serviceRows] = await pool.execute(
      'SELECT category FROM services WHERE service_code = ?',
      [serviceCode]
    );

    if (serviceRows.length === 0 || serviceRows[0].category !== voucher.target_code) {
      return {
        valid: false,
        error: 'Ma voucher khong ap dung cho nhom dich vu nay.'
      };
    }
  }

  // Tinh discount
  let discountAmount = 0;
  if (voucher.discount_type === 'percentage') {
    discountAmount = (orderAmount * voucher.discount_value) / 100;
    // Ap dung max discount neu co
    if (voucher.max_discount && discountAmount > voucher.max_discount) {
      discountAmount = voucher.max_discount;
    }
  } else if (voucher.discount_type === 'fixed') {
    discountAmount = voucher.discount_value;
  }

  // Discount khong duoc lon hon gia tri don hang
  if (discountAmount > orderAmount) {
    discountAmount = orderAmount;
  }

  return {
    valid: true,
    voucher: {
      voucherCode: voucher.voucher_code,
      name: voucher.name,
      discountType: voucher.discount_type,
      discountValue: Number(voucher.discount_value),
      discountAmount: Number(discountAmount.toFixed(2)),
      finalAmount: Number((orderAmount - discountAmount).toFixed(2)),
    }
  };
}

// Tang used_count sau khi apply voucher thanh cong
async function incrementVoucherUsage(voucherCode) {
  await pool.execute(
    'UPDATE vouchers SET used_count = used_count + 1 WHERE voucher_code = ?',
    [voucherCode]
  );
}

module.exports = {
  validateVoucher,
  incrementVoucherUsage,
};
