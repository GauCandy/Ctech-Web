// Controller xử lý webhook từ SePay
const { pool } = require('../../database/connection');

/**
 * POST /hooks/sepay-payment
 * Nhận webhook từ SePay khi có giao dịch chuyển tiền vào
 *
 * Payload mẫu từ SePay:
 * {
 *   "id": "123456",
 *   "gateway": "MBBank",
 *   "transactionDate": "2024-01-01 12:00:00",
 *   "accountNumber": "0372360619",
 *   "code": "TXN123456",
 *   "content": "Ma thanh toan ABC123 chuyen khoan",
 *   "transferType": "in",
 *   "transferAmount": 100000,
 *   "accumulated": 1000000,
 *   "subAccId": "",
 *   "referenceCode": "ABC123"
 * }
 */
async function handleSepayWebhook(req, res) {
  try {
    const webhookData = req.body;

    console.log('[SEPAY WEBHOOK] Received webhook:', JSON.stringify(webhookData, null, 2));

    // Validate required fields
    if (!webhookData || !webhookData.content || !webhookData.transferAmount) {
      console.error('[SEPAY WEBHOOK] Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Chỉ xử lý giao dịch IN (tiền vào)
    if (webhookData.transferType !== 'in') {
      console.log('[SEPAY WEBHOOK] Skipping non-incoming transaction');
      return res.status(200).json({ message: 'Skipped - not incoming transaction' });
    }

    // Trích xuất mã thanh toán từ nội dung
    // SePay sẽ parse sẵn code vào field referenceCode hoặc code
    const transactionCode = webhookData.referenceCode || webhookData.code || extractCodeFromContent(webhookData.content);

    if (!transactionCode) {
      console.log('[SEPAY WEBHOOK] No transaction code found in content');
      return res.status(200).json({ message: 'No transaction code found' });
    }

    console.log('[SEPAY WEBHOOK] Transaction code:', transactionCode);

    // Tìm đơn hàng theo transaction_code
    const [orders] = await pool.execute(
      'SELECT order_code, payment_status, amount FROM orders WHERE transaction_code = ? AND payment_status = ?',
      [transactionCode, 'pending']
    );

    if (orders.length === 0) {
      console.log('[SEPAY WEBHOOK] No pending order found for transaction code:', transactionCode);
      return res.status(200).json({ message: 'No pending order found' });
    }

    const order = orders[0];

    // Kiểm tra số tiền có khớp không (cho phép sai lệch nhỏ)
    const expectedAmount = parseFloat(order.amount);
    const receivedAmount = parseFloat(webhookData.transferAmount);

    if (Math.abs(expectedAmount - receivedAmount) > 1000) {
      console.error(`[SEPAY WEBHOOK] Amount mismatch - Expected: ${expectedAmount}, Received: ${receivedAmount}`);
      return res.status(200).json({
        message: 'Amount mismatch',
        expected: expectedAmount,
        received: receivedAmount
      });
    }

    // Cập nhật trạng thái đơn hàng thành completed
    const [updateResult] = await pool.execute(
      'UPDATE orders SET payment_status = ?, updated_at = NOW() WHERE order_code = ?',
      ['completed', order.order_code]
    );

    if (updateResult.affectedRows > 0) {
      console.log(`[SEPAY WEBHOOK] ✓ Order ${order.order_code} auto-confirmed successfully`);

      return res.status(200).json({
        success: true,
        message: 'Payment confirmed successfully',
        orderCode: order.order_code,
        transactionCode: transactionCode,
        amount: receivedAmount
      });
    } else {
      console.error('[SEPAY WEBHOOK] Failed to update order status');
      return res.status(500).json({ error: 'Failed to update order' });
    }

  } catch (error) {
    console.error('[SEPAY WEBHOOK] Error processing webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Trích xuất mã thanh toán từ nội dung chuyển khoản
 * Tìm pattern: chữ + số, độ dài 6-20 ký tự
 */
function extractCodeFromContent(content) {
  if (!content) return null;

  // Loại bỏ dấu và chuyển thành chữ hoa
  const normalized = content
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Tìm các pattern có thể là mã thanh toán
  // Ví dụ: "Ma thanh toan ABC123XYZ" -> tìm "ABC123XYZ"
  const patterns = [
    /\b([A-Z0-9]{6,20})\b/g,  // Tìm chuỗi chữ số 6-20 ký tự
    /MA\s*THANH\s*TOAN\s*([A-Z0-9]+)/i,
    /CODE\s*([A-Z0-9]+)/i,
    /PAYMENT\s*CODE\s*([A-Z0-9]+)/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      // Lấy nhóm capture đầu tiên (nếu có), nếu không thì lấy toàn bộ match
      const code = match[1] || match[0];
      if (code && code.length >= 6 && code.length <= 20) {
        return code;
      }
    }
  }

  return null;
}

module.exports = {
  handleSepayWebhook,
};
