# CTECH Backend API Documentation

**Base URL:** `http://localhost:3000/api`

API documentation dựa trên source code thực tế. Tất cả endpoints, request/response format, và business logic đều được extract từ controllers và routers.

---

## Authentication System

### Token-Based Authentication

Hệ thống sử dụng **session tokens** được lưu trong database (bảng `user_sessions`).

**Token Format:**
- Normal session: `S` + 63 hex characters (e.g., `S1a2b3c...`)
- Remember session: `R` + 63 hex characters (e.g., `R1a2b3c...`)

**Token TTL:**
- Normal session: **1 hour** (auto-extend mỗi lần sử dụng)
- Remember session: **30 days** (auto-extend mỗi lần sử dụng)

**Gửi token trong request:**
```http
Authorization: Bearer <token>
```

Hoặc:
```http
X-Admin-Token: <token>
```

---

## 🔐 Auth Endpoints

### POST /api/auth/login

Đăng nhập và nhận session token.

**Request Body:**
```json
{
  "username": "SV001",          // Có thể là: user_id, email, hoặc phone
  "password": "mypassword",
  "remember": true,             // Optional: true = 30 days, false = 1 hour
  "deviceId": "device-uuid"     // Optional: chỉ cho student role
}
```

**Success Response (200):**
```json
{
  "token": "S1a2b3c4d5e6f...",
  "expiresAt": "2025-10-29T10:00:00.000Z",
  "remember": false,
  "user": {
    "userId": "SV001",
    "role": "student",          // student | teacher | admin
    "displayName": "Nguyen Van A",
    "fullName": "Nguyen Van A",
    "email": "student@example.com",
    "phoneNumber": "0123456789",
    "department": "Công nghệ thông tin",
    "classCode": "CNTT2024A",
    "position": null            // Chỉ có với teacher
  },
  "deviceId": "normalized-device-id",  // Chỉ có với student
  "deviceIdIssued": true                // true nếu deviceId được tạo mới
}
```

**Error Responses:**
- `400` - Missing identifier or password
- `401` - Invalid credentials
- `403` - Account is disabled / Device policy violation
- `409` - Multiple accounts share this email/phone (phải dùng user_id)

**Business Logic:**
1. Nhận username (có thể là user_id, email, hoặc phone)
2. Detect loại identifier và resolve về user_id
3. Nếu email/phone → query database để tìm user_id
4. Nếu có multiple accounts → trả 409 conflict
5. Hash password với SHA256 và so sánh
6. **Student role:** enforce device policy (1 device per account)
7. Xóa tất cả sessions cũ của user
8. Tạo session token mới (S hoặc R prefix)
9. Lưu vào database với expires_at
10. Trả token + user profile

---

### POST /api/auth/register

Sinh viên tự đăng ký tài khoản mới.

**Request Body:**
```json
{
  "fullName": "Nguyen Van B",
  "email": "student@example.com",
  "phoneNumber": "0987654321",
  "classCode": "CNTT2024B",
  "department": "Công nghệ thông tin",
  "password": "strong-password"
}
```

**Success Response (201):**
```json
{
  "message": "Đăng ký tài khoản sinh viên thành công.",
  "user": {
    "userId": "SV002",
    "role": "student"
  }
}
```

**Error Responses:**
- `400` - Missing required fields / Password too weak
- `409` - Email or phone already exists

**Business Logic:**
1. Validate password strength (min 8 chars, complexity rules)
2. Generate user_id (format: `SV` + auto-increment number)
3. Hash password với SHA256
4. Insert vào `user_accounts` và `students` tables
5. Trả userId mới tạo

---

### GET /api/auth/me

Lấy thông tin user hiện tại (requires authentication).

**Headers:**
```http
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "token": "S1a2b3c4d5e6f...",
  "expiresAt": "2025-10-29T10:00:00.000Z",
  "remember": false,
  "user": {
    "userId": "SV001",
    "role": "student",
    "displayName": "Nguyen Van A",
    "fullName": "Nguyen Van A",
    "email": "student@example.com",
    "phoneNumber": "0123456789",
    "department": "Công nghệ thông tin",
    "classCode": "CNTT2024A"
  },
  "device": {
    "deviceId": "device-uuid",
    "lastLoginAt": "2025-10-29T09:00:00.000Z"
  }
}
```

**Error Responses:**
- `401` - Invalid or expired token
- `404` - Account not found

---

### POST /api/auth/logout

Đăng xuất và xóa session token.

**Headers:**
```http
Authorization: Bearer <token>
```

**Success Response (204):**
No content.

**Error Responses:**
- `400` - Session token is required

**Business Logic:**
1. Extract token từ header
2. Xóa token khỏi `user_sessions` table
3. Trả 204 No Content

---

### POST /api/auth/change-password

Đổi mật khẩu (requires authentication).

**Headers:**
```http
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "old-password",
  "newPassword": "new-strong-password"
}
```

**Success Response (200):**
```json
{
  "message": "Password updated successfully."
}
```

**Error Responses:**
- `400` - Missing password / Password too weak / Same password
- `401` - Invalid current password
- `403` - Cannot change admin account password via API

**Business Logic:**
1. Validate current password
2. Validate new password strength
3. Check new password khác current password
4. Hash new password với SHA256
5. Update `user_accounts` table
6. **Xóa tất cả sessions** của user (force re-login)
7. Trả success message

---

## 🏫 Services Endpoints

### GET /api/services

Lấy danh sách dịch vụ (có cache 5 phút).

**Query Parameters:**
- `q` (string, optional) - Search keyword
- `active` (string, optional) - Filter by active status ("true" / "false")
- `category` (string, optional) - Filter by category name

**Success Response (200):**
```json
{
  "services": [
    {
      "serviceCode": "DV001",
      "name": "Vé gửi xe ngày",
      "description": "Vé gửi xe một ngày cho học sinh, sinh viên",
      "category": "Gửi xe",
      "price": 5000,
      "imageUrl": "/uploads/services/DV001.jpg",
      "isActive": true,
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

**Cache Behavior:**
```
[Cache] MISS: GET:/api/services?category=Gửi xe
[Cache] CACHED: GET:/api/services?category=Gửi xe (TTL: 300s)
[Cache] HIT: GET:/api/services?category=Gửi xe
```

---

### GET /api/services/categories

Lấy danh sách các category (có cache 5 phút).

**Success Response (200):**
```json
{
  "categories": [
    "Gửi xe",
    "Căn tin",
    "Học phí",
    "Thư viện",
    "Khác"
  ]
}
```

---

### GET /api/services/:code

Lấy chi tiết một dịch vụ theo mã.

**Path Parameters:**
- `code` (string) - Service code (e.g., "DV001")

**Success Response (200):**
```json
{
  "serviceCode": "DV001",
  "name": "Vé gửi xe ngày",
  "description": "Vé gửi xe một ngày cho học sinh, sinh viên",
  "category": "Gửi xe",
  "price": 5000,
  "imageUrl": "/uploads/services/DV001.jpg",
  "isActive": true,
  "createdAt": "2025-01-15T10:00:00.000Z",
  "updatedAt": "2025-01-15T10:00:00.000Z"
}
```

**Error Responses:**
- `400` - Service code is required
- `404` - Service not found

---

### POST /api/services/:code/purchase

Mua dịch vụ và tạo mã thanh toán QR (requires authentication, chỉ student/teacher).

**Headers:**
```http
Authorization: Bearer <token>
```

**Path Parameters:**
- `code` (string) - Service code (e.g., "DV001")

**Request Body:**
```json
{
  "notes": "Ghi chú đơn hàng"  // Optional
}
```

**Success Response (201):**
```json
{
  "orderCode": "ORD20250129001",
  "transactionCode": "A1B2C3",     // 6 ký tự random (A-Z, 0-9)
  "qrCodeUrl": "https://img.vietqr.io/image/970422-0372360619-qr_only.png?amount=5000&addInfo=A1B2C3&accountName=Tran%20Tuan%20Tu",
  "amount": 5000,
  "bankInfo": {
    "bankName": "MB Bank",
    "bankOwner": "Tran Tuan Tu",
    "bankNumber": "0372360619"
  },
  "issuedAt": "2025-10-29T10:00:00.000Z",
  "service": {
    "serviceCode": "DV001",
    "name": "Vé gửi xe ngày",
    "price": 5000
  },
  "user": {
    "userId": "SV001",
    "role": "student"
  },
  "notes": "Ghi chú đơn hàng"
}
```

**Error Responses:**
- `400` - Service code is required / Service is not active
- `403` - Only teacher or student accounts can purchase services
- `404` - Service not found

**Business Logic:**
1. Validate role (chỉ student hoặc teacher)
2. Lấy service từ database
3. Check service isActive
4. Generate transaction code 6 ký tự random (A-Z, 0-9)
5. Generate VietQR URL với bank info từ .env
6. Tạo order trong database với status "pending"
7. Trả order + QR code URL

**VietQR Format:**
```
https://img.vietqr.io/image/{BANK_BIN}-{BANK_NUMBER}-qr_only.png
  ?amount={amount}
  &addInfo={transactionCode}
  &accountName={bankOwner}
```

---

### GET /api/services/vouchers

Lấy danh sách vouchers còn hiệu lực (public, có cache).

**Success Response (200):**
```json
{
  "vouchers": [
    {
      "voucherCode": "DISCOUNT10",
      "name": "Giảm 10% cho đơn đầu",
      "description": "Áp dụng cho đơn hàng đầu tiên",
      "discountType": "percentage",
      "discountValue": 10,
      "maxDiscount": 50000,
      "minOrderValue": 0,
      "appliesTo": "all",
      "targetCode": null,
      "validFrom": "2025-01-01T00:00:00.000Z",
      "validUntil": "2025-12-31T23:59:59.000Z"
    }
  ]
}
```

---

### GET /api/services/:code/vouchers

Lấy vouchers áp dụng cho một dịch vụ cụ thể.

**Path Parameters:**
- `code` (string) - Service code

**Success Response (200):**
```json
{
  "vouchers": [
    {
      "voucherCode": "PARKING20",
      "name": "Giảm 20% vé gửi xe",
      "discountType": "percentage",
      "discountValue": 20,
      "appliesTo": "service",
      "targetCode": "DV001"
    }
  ]
}
```

---

### GET /api/services/5c-images/:id

Lấy danh sách hình ảnh cho 5C card (Class, Club, Community, Creative, Career).

**Path Parameters:**
- `id` (string) - 5C card ID

**Success Response (200):**
```json
{
  "images": [
    "/img/5C/class1.jpg",
    "/img/5C/class2.jpg"
  ]
}
```

---

## 🛒 Orders Endpoints

### POST /api/orders

Tạo đơn hàng mới (requires authentication).

**Headers:**
```http
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "serviceCode": "DV001",
  "transactionCode": "A1B2C3",
  "amount": 5000,
  "notes": "Ghi chú"           // Optional
}
```

**Success Response (201):**
```json
{
  "orderCode": "ORD20250129001",
  "userId": "SV001",
  "serviceCode": "DV001",
  "transactionCode": "A1B2C3",
  "amount": 5000,
  "notes": "Ghi chú",
  "paymentStatus": "pending",
  "paymentMethod": "bank_transfer",
  "createdAt": "2025-10-29T10:00:00.000Z"
}
```

**Error Responses:**
- `400` - Missing required fields
- `401` - Unauthorized

**Business Logic:**
1. Validate required fields
2. Generate orderCode (format: `ORD` + YYYYMMDD + sequential number)
3. Insert vào `orders` table với status "pending"
4. Trả order details

---

### GET /api/orders/my-orders

Lấy danh sách đơn hàng của user hiện tại (requires authentication).

**Headers:**
```http
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (string, optional) - Filter by status: "pending", "completed", "failed", "cancelled"

**Success Response (200):**
```json
{
  "orders": [
    {
      "orderCode": "ORD20250129001",
      "userId": "SV001",
      "serviceCode": "DV001",
      "serviceName": "Vé gửi xe ngày",
      "transactionCode": "A1B2C3",
      "amount": 5000,
      "paymentStatus": "completed",
      "paidAt": "2025-10-29T10:05:00.000Z",
      "createdAt": "2025-10-29T10:00:00.000Z"
    }
  ]
}
```

---

### GET /api/orders/:orderCode

Lấy chi tiết đơn hàng theo mã (requires authentication).

**Headers:**
```http
Authorization: Bearer <token>
```

**Path Parameters:**
- `orderCode` (string) - Order code

**Success Response (200):**
```json
{
  "orderCode": "ORD20250129001",
  "userId": "SV001",
  "serviceCode": "DV001",
  "serviceName": "Vé gửi xe ngày",
  "transactionCode": "A1B2C3",
  "amount": 5000,
  "notes": "Ghi chú",
  "paymentStatus": "completed",
  "paymentMethod": "bank_transfer",
  "paidAt": "2025-10-29T10:05:00.000Z",
  "createdAt": "2025-10-29T10:00:00.000Z",
  "updatedAt": "2025-10-29T10:05:00.000Z"
}
```

**Error Responses:**
- `400` - Order code is required
- `403` - Not authorized to view this order
- `404` - Order not found

**Authorization:**
- User chỉ xem được orders của chính mình
- Admin xem được tất cả orders

---

### PATCH /api/orders/:orderCode/complete

Hoàn thành thanh toán (requires authentication).

**Headers:**
```http
Authorization: Bearer <token>
```

**Path Parameters:**
- `orderCode` (string) - Order code

**Success Response (200):**
```json
{
  "orderCode": "ORD20250129001",
  "paymentStatus": "completed",
  "paidAt": "2025-10-29T10:05:00.000Z",
  "updatedAt": "2025-10-29T10:05:00.000Z"
}
```

**Error Responses:**
- `400` - Order code is required
- `404` - Order not found

**Business Logic:**
1. Update `payment_status` = "completed"
2. Set `paid_at` = current timestamp
3. Trả updated order

---

### GET /api/orders/completed

Lấy tất cả đơn hàng đã thanh toán (requires authentication, chỉ admin).

**Headers:**
```http
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (number, optional, default: 100) - Limit results
- `offset` (number, optional, default: 0) - Offset for pagination

**Success Response (200):**
```json
{
  "orders": [
    {
      "orderCode": "ORD20250129001",
      "userId": "SV001",
      "serviceCode": "DV001",
      "amount": 5000,
      "paymentStatus": "completed",
      "paidAt": "2025-10-29T10:05:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `403` - Chi admin moi co quyen xem tat ca don hang

---

## 🎟️ Vouchers Endpoints

### POST /api/vouchers/validate

Validate voucher (requires authentication).

**Headers:**
```http
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "voucherCode": "DISCOUNT10",
  "serviceCode": "DV001",
  "amount": 50000
}
```

**Success Response (200):**
```json
{
  "voucherCode": "DISCOUNT10",
  "name": "Giảm 10% cho đơn đầu",
  "discountType": "percentage",
  "discountValue": 10,
  "maxDiscount": 50000,
  "discountAmount": 5000,          // Số tiền được giảm
  "finalAmount": 45000             // Số tiền sau giảm
}
```

**Error Responses:**
- `400` - Missing required fields / Voucher invalid (expired, usage limit, min order value, etc.)

**Business Logic:**
1. Check voucher tồn tại và is_active
2. Check valid date range (valid_from -> valid_until)
3. Check usage limit (used_count < usage_limit)
4. Check min order value
5. Check applies_to (all / service / category)
6. Calculate discount:
   - **percentage:** `min(amount * discountValue / 100, maxDiscount)`
   - **fixed:** `discountValue`
7. Trả voucher info + discount amount + final amount

---

## 🤖 Chatbot Endpoints

### POST /api/chatbot/chat

Gửi tin nhắn đến AI chatbot (có cache 10 phút).

**Request Body:**
```json
{
  "message": "Học phí học kỳ này là bao nhiêu?",
  "history": [                    // Optional: conversation history
    {
      "role": "user",
      "content": "Xin chào"
    },
    {
      "role": "assistant",
      "content": "Xin chào! Tôi có thể giúp gì cho bạn?"
    }
  ],
  "model": "gpt-4o-mini",         // Optional: OpenAI model
  "messages": [],                 // Optional: custom messages array
  "context": {}                   // Optional: additional context
}
```

**Success Response (200):**
```json
{
  "reply": "Học phí học kỳ này là 10,000,000 VND cho sinh viên hệ chính quy...",
  "role": "assistant",
  "model": "gpt-4o-mini",
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 50,
    "total_tokens": 200
  }
}
```

**Error Responses:**
- `400` - Message is required / Message too long (limit 1500 chars)
- `429` - OpenAI rate limit exceeded
- `500` - Chat service is not configured (missing API key)

**Business Logic:**
1. Check OPENAI_API_KEY configured
2. Build messages array từ history + user message
3. Gọi OpenAI API với system prompt + user messages
4. Cache response (TTL: 600s = 10 phút)
5. Trả AI reply + usage statistics

---

## 📅 Timetable Endpoints

### POST /api/timetable/parse

Upload và parse PDF thời khóa biểu.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file` (file) - PDF file (max 25MB)

**Success Response (200):**
```json
{
  "fileName": "timetable.pdf",
  "schedule": [
    {
      "day": "Thứ 2",
      "period": "1-2",
      "subject": "Lập trình Web",
      "teacher": "Nguyễn Văn A",
      "room": "A101",
      "time": "07:00 - 08:30"
    }
  ],
  "parsedAt": "2025-10-29T10:00:00.000Z"
}
```

**Error Responses:**
- `400` - Vui lòng tải lên một file PDF hợp lệ
- `415` - Chỉ hỗ trợ định dạng PDF
- `422` - Không tìm thấy dữ liệu thời khóa biểu trong file PDF
- `500` - Không thể xử lý file thời khóa biểu

**Business Logic:**
1. Validate file exists và mimetype = "application/pdf"
2. Parse PDF buffer với pdfjs-dist
3. Extract text từ PDF
4. Parse thời khóa biểu structure (day, period, subject, teacher, room, time)
5. Trả schedule data

---

## 👨‍💼 Admin Endpoints

Tất cả admin endpoints yêu cầu `Authorization: Bearer <token>` với role = "admin".

### GET /api/admin/stats

Lấy thống kê tổng quan cho admin dashboard.

**Headers:**
```http
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "users": {
    "total": 1250,
    "students": 1000,
    "teachers": 200,
    "admins": 50
  },
  "services": {
    "total": 15,
    "active": 12,
    "inactive": 3
  },
  "orders": {
    "total": 5000,
    "pending": 50,
    "completed": 4900,
    "failed": 50
  },
  "revenue": {
    "total": 250000000,
    "thisMonth": 50000000
  }
}
```

**Error Responses:**
- `401` - Invalid or expired token
- `403` - Admin role required

---

### GET /api/admin/users

Lấy danh sách tất cả users (có phân trang).

**Headers:**
```http
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (number, optional, default: 50) - Limit results
- `offset` (number, optional, default: 0) - Offset for pagination

**Success Response (200):**
```json
{
  "users": [
    {
      "userId": "SV001",
      "role": "student",
      "fullName": "Nguyen Van A",
      "email": "student@example.com",
      "phoneNumber": "0123456789",
      "department": "Công nghệ thông tin",
      "classCode": "CNTT2024A",
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 1250,
  "limit": 50,
  "offset": 0
}
```

---

### PUT /api/admin/users/:userId

Cập nhật thông tin user.

**Headers:**
```http
Authorization: Bearer <token>
```

**Path Parameters:**
- `userId` (string) - User ID

**Request Body:**
```json
{
  "fullName": "Nguyen Van A Updated",
  "email": "newemail@example.com",
  "phoneNumber": "0987654321",
  "department": "Điện - Điện tử",
  "isActive": true
}
```

**Success Response (200):**
```json
{
  "message": "User updated successfully.",
  "user": {
    "userId": "SV001",
    "fullName": "Nguyen Van A Updated",
    "email": "newemail@example.com"
  }
}
```

**Error Responses:**
- `404` - User not found

---

### DELETE /api/admin/users/:userId

Xóa user.

**Headers:**
```http
Authorization: Bearer <token>
```

**Path Parameters:**
- `userId` (string) - User ID

**Success Response (200):**
```json
{
  "message": "User deleted successfully."
}
```

**Error Responses:**
- `404` - User not found

---

### POST /api/admin/accounts

Tạo tài khoản mới (admin, teacher, hoặc student).

**Headers:**
```http
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userId": "GV001",              // Optional: auto-generate if not provided
  "role": "teacher",
  "password": "strong-password",
  "fullName": "Nguyen Van Teacher",
  "email": "teacher@example.com",
  "phoneNumber": "0123456789",
  "department": "Công nghệ thông tin",
  "position": "Giảng viên"        // Chỉ cho teacher
}
```

**Success Response (201):**
```json
{
  "message": "Tạo tài khoản thành công.",
  "user": {
    "userId": "GV001",
    "role": "teacher"
  }
}
```

**Error Responses:**
- `400` - Missing required fields / Invalid data
- `409` - User ID already exists

---

### POST /api/admin/accounts/:userId/reset-password

Admin đặt lại mật khẩu cho user.

**Headers:**
```http
Authorization: Bearer <token>
```

**Path Parameters:**
- `userId` (string) - User ID

**Request Body:**
```json
{
  "newPassword": "new-password"
}
```

**Success Response (200):**
```json
{
  "message": "Password reset successfully."
}
```

**Error Responses:**
- `400` - Invalid password
- `404` - User not found

---

### POST /api/admin/services

Tạo dịch vụ mới.

**Headers:**
```http
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Vé gửi xe tháng",
  "description": "Vé gửi xe cả tháng",
  "category": "Gửi xe",
  "price": 100000,
  "isActive": true
}
```

**Success Response (201):**
```json
{
  "serviceCode": "DV002",
  "name": "Vé gửi xe tháng",
  "description": "Vé gửi xe cả tháng",
  "category": "Gửi xe",
  "price": 100000,
  "isActive": true,
  "createdAt": "2025-10-29T10:00:00.000Z"
}
```

**Business Logic:**
1. Validate tên dịch vụ (required)
2. Normalize price (parse số, default = 0)
3. Generate serviceCode (format: `DV` + auto-increment 3-digit number)
4. Insert vào `services` table
5. Trả service details

---

### PUT /api/admin/services/:code

Cập nhật thông tin dịch vụ.

**Headers:**
```http
Authorization: Bearer <token>
```

**Path Parameters:**
- `code` (string) - Service code

**Request Body (all fields optional):**
```json
{
  "name": "Vé gửi xe tháng updated",
  "description": "Mô tả mới",
  "category": "Gửi xe",
  "price": 120000,
  "isActive": false
}
```

**Success Response (200):**
```json
{
  "serviceCode": "DV002",
  "name": "Vé gửi xe tháng updated",
  "price": 120000,
  "isActive": false,
  "updatedAt": "2025-10-29T10:00:00.000Z"
}
```

**Error Responses:**
- `400` - Service code is required / Invalid data
- `404` - Service not found

---

### POST /api/admin/services/:code/upload-image

Upload hình ảnh cho dịch vụ.

**Headers:**
```http
Authorization: Bearer <token>
```

**Content-Type:** `multipart/form-data`

**Path Parameters:**
- `code` (string) - Service code

**Form Data:**
- `image` (file) - Image file (jpg, png, gif, webp, max 5MB)

**Success Response (200):**
```json
{
  "imageUrl": "/uploads/services/DV002-1738156800000.jpg",
  "message": "Upload hinh anh thanh cong."
}
```

**Error Responses:**
- `400` - Service code required / No file uploaded
- `404` - Service not found

**Business Logic:**
1. Multer middleware handles file upload
2. File saved to `uploads/services/` directory
3. Filename format: `{serviceCode}-{timestamp}.{ext}`
4. Update `image_url` field trong database
5. Trả imageUrl

---

### DELETE /api/admin/services/:code

Toggle trạng thái active/inactive của dịch vụ (soft delete).

**Headers:**
```http
Authorization: Bearer <token>
```

**Path Parameters:**
- `code` (string) - Service code

**Success Response (200):**
```json
{
  "message": "Dịch vụ đã được cập nhật trạng thái.",
  "serviceCode": "DV002",
  "isActive": false
}
```

**Error Responses:**
- `400` - Service code is required
- `404` - Service not found

**Business Logic:**
1. Query current `is_active` status
2. Toggle: `1 -> 0`, `0 -> 1`
3. Update database
4. Trả new status

---

### GET /api/admin/vouchers

Lấy danh sách vouchers (admin view).

**Headers:**
```http
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "vouchers": [
    {
      "voucherCode": "DISCOUNT10",
      "name": "Giảm 10%",
      "discountType": "percentage",
      "discountValue": 10,
      "usageLimit": 100,
      "usedCount": 25,
      "isActive": true,
      "validFrom": "2025-01-01T00:00:00.000Z",
      "validUntil": "2025-12-31T23:59:59.000Z"
    }
  ]
}
```

---

### GET /api/admin/vouchers/:code

Lấy chi tiết voucher.

**Headers:**
```http
Authorization: Bearer <token>
```

**Path Parameters:**
- `code` (string) - Voucher code

**Success Response (200):**
```json
{
  "voucherCode": "DISCOUNT10",
  "name": "Giảm 10%",
  "description": "Voucher giảm 10% cho đơn hàng đầu tiên",
  "discountType": "percentage",
  "discountValue": 10,
  "maxDiscount": 50000,
  "minOrderValue": 0,
  "appliesTo": "all",
  "targetCode": null,
  "usageLimit": 100,
  "usedCount": 25,
  "validFrom": "2025-01-01T00:00:00.000Z",
  "validUntil": "2025-12-31T23:59:59.000Z",
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `404` - Voucher not found

---

### POST /api/admin/vouchers

Tạo voucher mới.

**Headers:**
```http
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "voucherCode": "SUMMER2025",
  "name": "Ưu đãi hè 2025",
  "description": "Giảm 20% cho tất cả dịch vụ mùa hè",
  "discountType": "percentage",        // "percentage" | "fixed"
  "discountValue": 20,
  "maxDiscount": 100000,               // Chỉ cho percentage
  "minOrderValue": 50000,
  "appliesTo": "all",                  // "all" | "service" | "category"
  "targetCode": null,                  // Service code hoặc category name
  "usageLimit": 500,
  "validFrom": "2025-06-01T00:00:00.000Z",
  "validUntil": "2025-08-31T23:59:59.000Z",
  "isActive": true
}
```

**Success Response (201):**
```json
{
  "message": "Voucher created successfully.",
  "voucher": {
    "voucherCode": "SUMMER2025",
    "name": "Ưu đãi hè 2025",
    "isActive": true
  }
}
```

**Error Responses:**
- `400` - Missing required fields / Invalid data
- `409` - Voucher code already exists

---

### PUT /api/admin/vouchers/:code

Cập nhật voucher.

**Headers:**
```http
Authorization: Bearer <token>
```

**Path Parameters:**
- `code` (string) - Voucher code

**Request Body (all fields optional):**
```json
{
  "name": "Ưu đãi hè 2025 updated",
  "discountValue": 25,
  "usageLimit": 1000,
  "isActive": false
}
```

**Success Response (200):**
```json
{
  "message": "Voucher updated successfully.",
  "voucher": {
    "voucherCode": "SUMMER2025",
    "name": "Ưu đãi hè 2025 updated",
    "discountValue": 25,
    "updatedAt": "2025-10-29T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `404` - Voucher not found

---

### DELETE /api/admin/vouchers/:code

Xóa voucher.

**Headers:**
```http
Authorization: Bearer <token>
```

**Path Parameters:**
- `code` (string) - Voucher code

**Success Response (200):**
```json
{
  "message": "Voucher deleted successfully."
}
```

**Error Responses:**
- `404` - Voucher not found

---

## 🏥 System Endpoint

### GET /api/status

Kiểm tra trạng thái hệ thống (health check, không cần authentication).

**Success Response (200):**
```json
{
  "status": "ok",                     // "ok" | "degraded"
  "uptime": {
    "seconds": 3600.500,
    "startedAt": "2025-10-29T09:00:00.000Z"
  },
  "database": {
    "connected": true
  },
  "timestamp": "2025-10-29T10:00:00.000Z"
}
```

**Degraded Response (200):**
```json
{
  "status": "degraded",
  "uptime": {
    "seconds": 3600.500,
    "startedAt": "2025-10-29T09:00:00.000Z"
  },
  "database": {
    "connected": false,
    "error": "Connection refused"
  },
  "timestamp": "2025-10-29T10:00:00.000Z"
}
```

**Business Logic:**
1. Calculate uptime seconds từ process start time
2. Ping database connection
3. Nếu database fail → status = "degraded"
4. Trả system status + uptime + db status

---

## 🔄 Cache System

### Cache Configuration

**Cached Endpoints:**
- `GET /api/services` - TTL: **300s** (5 phút)
- `GET /api/services/categories` - TTL: **300s** (5 phút)
- `POST /api/chatbot/chat` - TTL: **600s** (10 phút)

**Cache Implementation:**
- In-memory cache với Map
- TTL-based expiration
- Auto cleanup every 5 minutes
- Fallback support on 5xx errors

**Cache Logs:**
```
[Cache] MISS: GET:/api/services
[Cache] CACHED: GET:/api/services (TTL: 300s)
[Cache] HIT: GET:/api/services
[Cache] FALLBACK: GET:/api/services (khi server error)
```

**Cache Invalidation:**
- Cache tự động expire sau TTL
- Admin actions (create/update/delete services) không tự động clear cache
- Cache clear toàn bộ khi restart server

---

## 📁 File Upload

### Upload Configuration

**Multer Settings:**

**Services Images:**
- Path: `uploads/services/`
- Max size: **5MB**
- Allowed types: `jpg`, `jpeg`, `png`, `gif`, `webp`
- Filename format: `{serviceCode}-{timestamp}.{ext}`

**Timetable PDFs:**
- Max size: **25MB**
- Allowed types: `application/pdf`, `application/octet-stream`
- Storage: Memory (không save file, chỉ parse)

**URL Format:**
```
/uploads/services/DV001-1738156800000.jpg
```

---

## 🗄️ Database Schema

### Main Tables

**user_accounts:**
- `user_id` (PK) - Mã người dùng (SV001, GV001, AD001)
- `password_sha` - SHA256 hash
- `role` - student | teacher | admin
- `is_active` - 1 = active, 0 = disabled

**students / teachers:**
- `user_id` (FK) - Link to user_accounts
- `full_name`, `email`, `phone_number`
- `department`, `class_code` (students), `position` (teachers)

**user_sessions:**
- `token` (UNIQUE) - Session token (64 chars)
- `user_id` (FK) - Link to user_accounts
- `expires_at` - Token expiration time
- `last_used_at` - Auto-updated on each use

**services:**
- `service_code` (PK) - DV001, DV002, ...
- `name`, `description`, `category`
- `price`, `image_url`
- `is_active` - 1 = active, 0 = inactive

**orders:**
- `order_code` (PK) - ORD20250129001
- `user_id` (FK), `service_code` (FK)
- `transaction_code` - 6-char payment code
- `payment_status` - pending | completed | failed | cancelled
- `paid_at` - Timestamp khi completed

**vouchers:**
- `voucher_code` (PK) - DISCOUNT10, SUMMER2025
- `discount_type` - percentage | fixed
- `discount_value`, `max_discount`, `min_order_value`
- `applies_to` - all | service | category
- `usage_limit`, `used_count`
- `valid_from`, `valid_until`

**student_device_registry:**
- `device_id` (PK) - Device UUID
- `current_user_id` (FK) - Student currently using device
- 1 device = 1 student (device lock policy)

---

## 🔒 Security Features

### Password Security
- **SHA256 hashing** (note: bcrypt recommended for production)
- Password strength validation:
  - Min 8 characters
  - Complexity rules enforced

### Session Security
- Token stored in database
- Auto-expire after TTL
- Token prefix: `S` (normal), `R` (remember)
- All old sessions deleted on login/password change

### Student Device Policy
- **1 device per student** account
- deviceId required on login
- Server generates deviceId if not provided
- Prevents account sharing

### Authorization
- **requireUserAuth**: Any authenticated user
- **requireAdminAuth**: Only admin role
- Order access: User sees own orders, admin sees all
- Service purchase: Only student/teacher roles

---

## ⚠️ Error Handling

### Standard Error Format

```json
{
  "error": "Error message in Vietnamese"
}
```

### HTTP Status Codes

- **200** - OK (success)
- **201** - Created (resource created)
- **204** - No Content (success with no response body)
- **400** - Bad Request (invalid input)
- **401** - Unauthorized (invalid/missing token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found (resource not found)
- **409** - Conflict (duplicate resource)
- **415** - Unsupported Media Type (wrong file type)
- **422** - Unprocessable Entity (cannot process)
- **429** - Too Many Requests (rate limit)
- **500** - Internal Server Error

### Common Error Messages

**Authentication:**
- "Invalid or expired token."
- "Invalid credentials."
- "Account is disabled."
- "Admin role required."

**Validation:**
- "Missing identifier or password."
- "Message is required."
- "Service code is required."

**Business Logic:**
- "Only teacher or student accounts can purchase services."
- "Service is not currently active."
- "Voucher invalid" (expired, usage limit, etc.)

---

## 🌍 Environment Variables

Required in `.env`:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ctech_db

# Server
PORT=3000

# Session TTL (in seconds)
SESSION_TIMEOUT=3600                # 1 hour
SESSION_REMEMBER_TIMEOUT=2592000   # 30 days

# OpenAI (for chatbot)
OPENAI_API_KEY=sk-...

# Bank Info (for VietQR)
BANK_BIN=970422                     # MB Bank
BANK_NUMBER=0372360619
BANK_OWNER=Tran Tuan Tu
BANK_NAME=MB Bank
```

---

## 📝 Notes

1. **Token Auto-Extension**: Mỗi lần sử dụng token, `expires_at` được gia hạn thêm TTL
2. **Cache Fallback**: Khi server error (5xx), trả cached data cũ nếu có
3. **Service Code Format**: `DV` + 3-digit number (DV001, DV002, ...)
4. **Order Code Format**: `ORD` + YYYYMMDD + sequential number
5. **Transaction Code**: 6 random uppercase letters/numbers (A-Z, 0-9)
6. **Student Device Lock**: Enforced on login, prevent account sharing
7. **Password Hashing**: Currently SHA256, recommend bcrypt for production
8. **Soft Delete**: Admin delete service → toggle `is_active`, not hard delete
9. **VietQR Integration**: Generate QR code URL, actual payment verification manual

---

## 🔗 Related Documentation

- [README.md](../../README.md) - Project overview
- [Backend README.md](README.md) - Backend architecture
- [Frontend README.md](../frontend/README.md) - Frontend architecture
- [Database Schema](database/schema.sql) - Complete SQL schema
