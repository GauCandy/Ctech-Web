// Controller cho admin stats và users
const { pool } = require('../../../../database/connection');

/**
 * GET /api/admin/stats
 * Lấy thống kê tổng quan cho admin dashboard
 */
async function getAdminStats(req, res) {
  try {
    // Lấy tổng số users
    const [usersCount] = await pool.execute(
      'SELECT COUNT(*) as total FROM users'
    );

    // Lấy tổng số orders tháng này
    const [ordersThisMonth] = await pool.execute(
      `SELECT COUNT(*) as total
       FROM orders
       WHERE MONTH(created_at) = MONTH(CURRENT_DATE())
       AND YEAR(created_at) = YEAR(CURRENT_DATE())`
    );

    // Lấy tổng doanh thu
    const [revenue] = await pool.execute(
      `SELECT SUM(amount) as total
       FROM orders
       WHERE payment_status = 'completed'`
    );

    // Lấy tổng số dịch vụ đang hoạt động
    const [activeServices] = await pool.execute(
      'SELECT COUNT(*) as total FROM services WHERE is_active = 1'
    );

    // Lấy thống kê orders theo tháng (6 tháng gần nhất)
    const [monthlyOrders] = await pool.execute(
      `SELECT
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as total,
        SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END) as revenue
       FROM orders
       WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month ASC`
    );

    // Lấy top dịch vụ bán chạy
    const [topServices] = await pool.execute(
      `SELECT
        s.service_code,
        s.name,
        COUNT(o.order_code) as order_count,
        SUM(o.amount) as revenue
       FROM services s
       LEFT JOIN orders o ON s.service_code = o.service_code
       WHERE o.payment_status = 'completed'
       GROUP BY s.service_code, s.name
       ORDER BY order_count DESC
       LIMIT 5`
    );

    res.json({
      summary: {
        totalUsers: usersCount[0].total,
        ordersThisMonth: ordersThisMonth[0].total,
        totalRevenue: revenue[0].total || 0,
        activeServices: activeServices[0].total,
      },
      monthlyOrders: monthlyOrders.map(row => ({
        month: row.month,
        orders: row.total,
        revenue: row.revenue || 0,
      })),
      topServices: topServices.map(row => ({
        serviceCode: row.service_code,
        name: row.name,
        orderCount: row.order_count,
        revenue: row.revenue || 0,
      })),
    });
  } catch (error) {
    console.error('Error getting admin stats:', error);
    res.status(500).json({ error: 'Không thể lấy thống kê' });
  }
}

/**
 * GET /api/admin/users
 * Lấy danh sách tất cả users (phân trang)
 */
async function getAllUsers(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const role = req.query.role || '';

    let whereClauses = [];
    let params = [];

    if (search) {
      whereClauses.push('(user_id LIKE ? OR full_name LIKE ? OR email LIKE ? OR phone_number LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (role) {
      whereClauses.push('role = ?');
      params.push(role);
    }

    const whereClause = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    // Lấy tổng số users
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      params
    );

    // Lấy danh sách users
    const [users] = await pool.execute(
      `SELECT
        user_id as userId,
        full_name as fullName,
        email,
        phone_number as phoneNumber,
        role,
        created_at as createdAt
       FROM users
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      users,
      pagination: {
        total: countResult[0].total,
        page,
        limit,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Không thể lấy danh sách người dùng' });
  }
}

/**
 * DELETE /api/admin/users/:userId
 * Xóa user
 */
async function deleteUser(req, res) {
  try {
    const { userId } = req.params;

    // Không cho phép xóa admin
    const [user] = await pool.execute(
      'SELECT role FROM users WHERE user_id = ?',
      [userId]
    );

    if (!user.length) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    if (user[0].role === 'admin') {
      return res.status(403).json({ error: 'Không thể xóa tài khoản admin' });
    }

    await pool.execute('DELETE FROM users WHERE user_id = ?', [userId]);

    res.json({ message: 'Đã xóa người dùng thành công' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Không thể xóa người dùng' });
  }
}

/**
 * PUT /api/admin/users/:userId
 * Cập nhật thông tin user
 */
async function updateUser(req, res) {
  try {
    const { userId } = req.params;
    const { fullName, email, phoneNumber, role } = req.body;

    const updates = [];
    const params = [];

    if (fullName !== undefined) {
      updates.push('full_name = ?');
      params.push(fullName);
    }

    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email);
    }

    if (phoneNumber !== undefined) {
      updates.push('phone_number = ?');
      params.push(phoneNumber);
    }

    if (role !== undefined) {
      updates.push('role = ?');
      params.push(role);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Không có thông tin để cập nhật' });
    }

    params.push(userId);

    const [result] = await pool.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    res.json({ message: 'Cập nhật thông tin thành công' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Không thể cập nhật thông tin người dùng' });
  }
}

module.exports = {
  getAdminStats,
  getAllUsers,
  deleteUser,
  updateUser,
};
