// Ghi chu: Cung cap cac handler HTTP cho quan ly don hang
const {
  createOrder,
  updatePaymentStatus,
  getOrdersByUser,
  getAllCompletedOrders,
  getOrderByCode,
} = require('../services/orderService');

// Tao don hang moi (duoc goi khi user nhan "Nhan ma thanh toan")
async function createOrderHandler(req, res, next) {
  try {
    const userId = req.auth && req.auth.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Chua xac thuc nguoi dung' });
    }

    const { serviceCode, transactionCode, amount, notes } = req.body;

    if (!serviceCode || !transactionCode || amount === undefined || amount === null) {
      return res.status(400).json({ error: 'Thieu thong tin bat buoc' });
    }

    const order = await createOrder({
      userId,
      serviceCode,
      transactionCode,
      amount: Number(amount),
      notes: notes || null,
    });

    console.log('[CREATE ORDER] Tao don hang thanh cong:', order.orderCode);

    return res.status(201).json(order);
  } catch (error) {
    console.error('[CREATE ORDER] Loi tao don hang:', error);
    return next(error);
  }
}

// Cap nhat trang thai thanh toan (duoc goi khi user nhan "Hoan thien thanh toan")
async function completePaymentHandler(req, res, next) {
  try {
    const { orderCode } = req.params;

    if (!orderCode) {
      return res.status(400).json({ error: 'Ma don hang bat buoc' });
    }

    const order = await updatePaymentStatus(orderCode, 'completed');

    if (!order) {
      return res.status(404).json({ error: 'Khong tim thay don hang' });
    }

    console.log('[COMPLETE PAYMENT] Hoan thanh thanh toan:', orderCode);

    return res.json(order);
  } catch (error) {
    console.error('[COMPLETE PAYMENT] Loi cap nhat trang thai:', error);
    return next(error);
  }
}

// Lay danh sach don hang cua user hien tai
async function getUserOrdersHandler(req, res, next) {
  try {
    const userId = req.auth && req.auth.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Chua xac thuc nguoi dung' });
    }

    const { status } = req.query;

    const orders = await getOrdersByUser(userId, status || null);

    return res.json({ orders });
  } catch (error) {
    console.error('[GET USER ORDERS] Loi lay danh sach don hang:', error);
    return next(error);
  }
}

// Lay tat ca don hang da thanh toan (chi admin)
async function getCompletedOrdersHandler(req, res, next) {
  try {
    const role = req.auth && req.auth.role;
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Chi admin moi co quyen xem tat ca don hang' });
    }

    const limit = parseInt(req.query.limit, 10) || 100;
    const offset = parseInt(req.query.offset, 10) || 0;

    const orders = await getAllCompletedOrders(limit, offset);

    return res.json({ orders });
  } catch (error) {
    console.error('[GET COMPLETED ORDERS] Loi lay danh sach don hang da thanh toan:', error);
    return next(error);
  }
}

// Lay chi tiet don hang theo ma
async function getOrderDetailsHandler(req, res, next) {
  try {
    const { orderCode } = req.params;

    if (!orderCode) {
      return res.status(400).json({ error: 'Ma don hang bat buoc' });
    }

    const order = await getOrderByCode(orderCode);

    if (!order) {
      return res.status(404).json({ error: 'Khong tim thay don hang' });
    }

    // Kiem tra quyen: chi user so huu hoac admin moi xem duoc
    const userId = req.auth && req.auth.userId;
    const role = req.auth && req.auth.role;

    if (order.userId !== userId && role !== 'admin') {
      return res.status(403).json({ error: 'Khong co quyen xem don hang nay' });
    }

    return res.json(order);
  } catch (error) {
    console.error('[GET ORDER DETAILS] Loi lay chi tiet don hang:', error);
    return next(error);
  }
}

module.exports = {
  createOrderHandler,
  completePaymentHandler,
  getUserOrdersHandler,
  getCompletedOrdersHandler,
  getOrderDetailsHandler,
};
