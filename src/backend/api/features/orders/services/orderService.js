// Ghi chu: Xu ly nghiep vu quan ly don hang (orders)
const { pool } = require('../../../../database/connection');

// Tao ma don hang duy nhat theo dinh dang ORD + YYYYMMDD + so thu tu 3 chu so
async function generateOrderCode() {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');

  const prefix = `ORD${dateStr}`;

  const [rows] = await pool.execute(
    'SELECT order_code FROM orders WHERE order_code LIKE ? ORDER BY order_code DESC LIMIT 1',
    [`${prefix}%`]
  );

  let sequence = 0;
  if (rows.length) {
    const lastCode = rows[0].order_code;
    const suffix = lastCode.slice(prefix.length);
    const parsed = parseInt(suffix, 10);
    if (!isNaN(parsed)) {
      sequence = parsed;
    }
  }

  return `${prefix}${String(sequence + 1).padStart(3, '0')}`;
}

// Tao don hang moi
async function createOrder({ userId, serviceCode, transactionCode, amount, notes }) {
  const orderCode = await generateOrderCode();

  const [result] = await pool.execute(
    `INSERT INTO orders (order_code, user_id, service_code, transaction_code, amount, notes, payment_status)
     VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
    [orderCode, userId, serviceCode, transactionCode, amount, notes || null]
  );

  if (result.affectedRows === 0) {
    throw new Error('Khong the tao don hang');
  }

  return {
    orderId: result.insertId,
    orderCode,
    userId,
    serviceCode,
    transactionCode,
    amount,
    notes,
    paymentStatus: 'pending',
  };
}

// Cap nhat trang thai thanh toan
async function updatePaymentStatus(orderCode, status) {
  const validStatuses = ['pending', 'completed', 'failed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new Error('Trang thai khong hop le');
  }

  const paidAt = status === 'completed' ? new Date() : null;

  const [result] = await pool.execute(
    `UPDATE orders SET payment_status = ?, paid_at = ? WHERE order_code = ?`,
    [status, paidAt, orderCode]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  const [rows] = await pool.execute(
    `SELECT
      id,
      order_code AS orderCode,
      user_id AS userId,
      service_code AS serviceCode,
      transaction_code AS transactionCode,
      amount,
      notes,
      payment_status AS paymentStatus,
      payment_method AS paymentMethod,
      paid_at AS paidAt,
      created_at AS createdAt,
      updated_at AS updatedAt
     FROM orders WHERE order_code = ?`,
    [orderCode]
  );

  return rows[0] || null;
}

// Lay danh sach don hang theo user_id va status
async function getOrdersByUser(userId, status = null) {
  let query = `
    SELECT
      o.id,
      o.order_code AS orderCode,
      o.user_id AS userId,
      o.service_code AS serviceCode,
      s.name AS serviceName,
      o.transaction_code AS transactionCode,
      o.amount,
      o.notes,
      o.payment_status AS paymentStatus,
      o.payment_method AS paymentMethod,
      o.paid_at AS paidAt,
      o.created_at AS createdAt,
      o.updated_at AS updatedAt
    FROM orders o
    LEFT JOIN services s ON o.service_code = s.service_code
    WHERE o.user_id = ?
  `;

  const params = [userId];

  if (status) {
    query += ' AND o.payment_status = ?';
    params.push(status);
  }

  query += ' ORDER BY o.created_at DESC';

  const [rows] = await pool.execute(query, params);
  return rows;
}

// Lay tat ca don hang da thanh toan (cho admin)
async function getAllCompletedOrders(limit = 100, offset = 0) {
  const [rows] = await pool.execute(
    `SELECT
      o.id,
      o.order_code AS orderCode,
      o.user_id AS userId,
      o.service_code AS serviceCode,
      s.name AS serviceName,
      o.transaction_code AS transactionCode,
      o.amount,
      o.notes,
      o.payment_status AS paymentStatus,
      o.payment_method AS paymentMethod,
      o.paid_at AS paidAt,
      o.created_at AS createdAt,
      o.updated_at AS updatedAt
    FROM orders o
    LEFT JOIN services s ON o.service_code = s.service_code
    WHERE o.payment_status = 'completed'
    ORDER BY o.paid_at DESC
    LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  return rows;
}

// Lay chi tiet don hang theo order_code
async function getOrderByCode(orderCode) {
  const [rows] = await pool.execute(
    `SELECT
      o.id,
      o.order_code AS orderCode,
      o.user_id AS userId,
      o.service_code AS serviceCode,
      s.name AS serviceName,
      o.transaction_code AS transactionCode,
      o.amount,
      o.notes,
      o.payment_status AS paymentStatus,
      o.payment_method AS paymentMethod,
      o.paid_at AS paidAt,
      o.created_at AS createdAt,
      o.updated_at AS updatedAt
    FROM orders o
    LEFT JOIN services s ON o.service_code = s.service_code
    WHERE o.order_code = ?`,
    [orderCode]
  );

  return rows[0] || null;
}

module.exports = {
  createOrder,
  updatePaymentStatus,
  getOrdersByUser,
  getAllCompletedOrders,
  getOrderByCode,
};
