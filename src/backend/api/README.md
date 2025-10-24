# API Documentation - CTECH Backend

## Base URL

```
http://localhost:3000/api
```

---

## 🔐 Authentication Endpoints

### Register New User
**POST** `/auth/register`

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

---

### Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "SecurePass123!"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "role": "user"
  }
}
```

---

### Get User Profile
**GET** `/auth/profile`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Refresh Access Token
**POST** `/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 💬 Chatbot Endpoints

### Send Message to Chatbot
**POST** `/chatbot/message`

**Request Body:**
```json
{
  "message": "Cho tôi biết thông tin về ngành Công Nghệ Thông Tin",
  "conversationId": "conv_123" // Optional
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "response": "Ngành Công Nghệ Thông Tin tại CTECH...",
  "conversationId": "conv_123"
}
```

---

### Get Chat History
**GET** `/chatbot/history?conversationId=conv_123`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "history": [
    {
      "role": "user",
      "message": "Cho tôi biết về ngành CNTT",
      "timestamp": "2024-10-22T10:00:00.000Z"
    },
    {
      "role": "assistant",
      "message": "Ngành CNTT tại CTECH...",
      "timestamp": "2024-10-22T10:00:05.000Z"
    }
  ]
}
```

---

## 📅 Schedule (Thời Khóa Biểu) Endpoints

### Get All Schedules
**GET** `/schedule?userId=1&week=42`

**Query Parameters:**
- `userId` (optional) - Filter by user ID
- `week` (optional) - Filter by week number
- `dayOfWeek` (optional) - Filter by day (0-6)

**Response (Success - 200):**
```json
{
  "success": true,
  "schedules": [
    {
      "id": 1,
      "subject": "Lập Trình Web",
      "day_of_week": 1,
      "start_time": "08:00:00",
      "end_time": "10:00:00",
      "room": "A201",
      "teacher": "TS. Nguyễn Văn A"
    }
  ]
}
```

---

### Create Schedule (Admin Only)
**POST** `/schedule`

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Request Body:**
```json
{
  "userId": 1,
  "subject": "Lập Trình Web",
  "dayOfWeek": 1,
  "startTime": "08:00",
  "endTime": "10:00",
  "room": "A201",
  "teacher": "TS. Nguyễn Văn A"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Tạo lịch thành công",
  "schedule": { ... }
}
```

---

## 🛍️ Services Endpoints

### Get All Services
**GET** `/services?category=food`

**Query Parameters:**
- `category` (optional) - Filter by category

**Response (Success - 200):**
```json
{
  "success": true,
  "services": [
    {
      "id": 1,
      "name": "Cơm Văn Phòng",
      "description": "Cơm văn phòng phần ăn đủ dinh dưỡng",
      "price": 35000,
      "category": "food",
      "qr_code_url": "/uploads/qr/food_1.png"
    }
  ]
}
```

---

### Get Service Detail
**GET** `/services/:id`

**Response (Success - 200):**
```json
{
  "success": true,
  "service": {
    "id": 1,
    "name": "Cơm Văn Phòng",
    "description": "Cơm văn phòng phần ăn đủ dinh dưỡng",
    "price": 35000,
    "category": "food",
    "qr_code_url": "/uploads/qr/food_1.png",
    "created_at": "2024-10-01T00:00:00.000Z"
  }
}
```

---

### Purchase Service
**POST** `/services/purchase`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "serviceId": 1,
  "quantity": 2,
  "paymentMethod": "qr_code"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Đặt hàng thành công",
  "order": {
    "id": 123,
    "serviceId": 1,
    "quantity": 2,
    "totalPrice": 70000,
    "status": "pending"
  }
}
```

---

### Get Purchase History
**GET** `/services/history`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "history": [
    {
      "id": 123,
      "serviceName": "Cơm Văn Phòng",
      "quantity": 2,
      "totalPrice": 70000,
      "status": "completed",
      "purchaseDate": "2024-10-22T12:00:00.000Z"
    }
  ]
}
```

---

## 📤 Upload Endpoints

### Upload QR Code
**POST** `/upload/qr`

**Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer <admin_access_token>
```

**Form Data:**
```
qrCode: <file>
serviceId: 1
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Upload thành công",
  "fileUrl": "/uploads/qr/qr_1698765432.png"
}
```

---

### Upload Avatar
**POST** `/upload/avatar`

**Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer <access_token>
```

**Form Data:**
```
avatar: <file>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Upload avatar thành công",
  "avatarUrl": "/uploads/avatars/user_1_1698765432.jpg"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Missing required fields"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Access denied. Admin role required."
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Database connection failed"
}
```

---

## Rate Limiting

- **Default**: 100 requests per 15 minutes per IP
- **Auth endpoints**: 5 requests per 15 minutes
- **Upload endpoints**: 10 requests per hour

## Authentication Flow

```
1. User registers → POST /auth/register
2. User logs in → POST /auth/login → Receive access + refresh tokens
3. Access protected routes → Include "Authorization: Bearer <token>"
4. Token expires (15m) → Use refresh token → POST /auth/refresh
5. Refresh token expires (7d) → User must log in again
```

## Testing with cURL

### Login Example
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "SecurePass123!"
  }'
```

### Protected Route Example
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer eyJhbGc..."
```
