// Controller cho admin orders management
const { pool } = require('../../../../database/connection');

/**
 * GET /api/admin/orders
 * Lấy tất cả đơn hàng (admin) với phân trang
 */
async function getAllOrdersHandler(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status || ''; // '', 'pending', 'completed'
    const offset = (page - 1) * limit;

    let query = `
      SELECT
        o.order_code,
        o.user_id,
        o.service_code,
        o.transaction_code,
        o.amount,
        o.payment_status,
        o.notes,
        o.created_at,
        o.updated_at,
        u.full_name as user_name,
        u.email as user_email,
        s.name as service_name
      FROM orders o
      LEFT JOIN user_accounts u ON o.user_id = u.user_id
      LEFT JOIN services s ON o.service_code = s.service_code
    `;

    let countQuery = 'SELECT COUNT(*) as total FROM orders';
    const params = [];
    const countParams = [];

    if (status) {
      query += ' WHERE o.payment_status = ?';
      countQuery += ' WHERE payment_status = ?';
      params.push(status);
      countParams.push(status);
    }

    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [orders] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, countParams);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error getting all orders:', error);
    res.status(500).json({ error: 'Không thể lấy danh sách đơn hàng' });
  }
}

/**
 * PATCH /api/admin/orders/:orderCode/status
 * Cập nhật trạng thái thanh toán đơn hàng
 */
async function updateOrderStatusHandler(req, res) {
  try {
    const { orderCode } = req.params;
    const { paymentStatus } = req.body;

    if (!paymentStatus || !['pending', 'completed'].includes(paymentStatus)) {
      return res.status(400).json({ error: 'Trạng thái thanh toán không hợp lệ' });
    }

    const [result] = await pool.execute(
      'UPDATE orders SET payment_status = ?, updated_at = NOW() WHERE order_code = ?',
      [paymentStatus, orderCode]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }

    res.json({
      message: 'Đã cập nhật trạng thái đơn hàng thành công',
      orderCode,
      paymentStatus
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Không thể cập nhật trạng thái đơn hàng' });
  }
}

module.exports = {
  getAllOrdersHandler,
  updateOrderStatusHandler,
};
