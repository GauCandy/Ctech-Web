# Backend - CTECH API Server

## Tổng Quan

Backend server cho CTECH website, sử dụng Node.js + Express.js và MySQL database.

## Cấu Trúc Thư Mục

```
backend/
├── api/              # API endpoints & routes
│   ├── auth/        # Authentication routes
│   ├── features/    # Feature-specific APIs
│   └── routes/      # Route definitions
├── database/        # Database configuration
│   └── db.js       # MySQL connection
├── middleware/      # Express middleware
│   ├── auth.js     # JWT authentication
│   └── upload.js   # File upload handling
└── server/          # Server setup
    └── server.js   # Main server file
```

## API Endpoints

### 🔐 Authentication
- `POST /api/auth/register` - Đăng ký tài khoản mới
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Lấy thông tin user (protected)

### 💬 Chatbot
- `POST /api/chatbot/message` - Gửi message tới AI chatbot
- `GET /api/chatbot/history` - Lấy lịch sử chat (protected)

### 📅 Schedule (Thời Khóa Biểu)
- `GET /api/schedule` - Lấy thời khóa biểu
- `POST /api/schedule` - Tạo lịch mới (admin)
- `PUT /api/schedule/:id` - Cập nhật lịch (admin)
- `DELETE /api/schedule/:id` - Xóa lịch (admin)

### 🛍️ Services
- `GET /api/services` - Lấy danh sách dịch vụ
- `GET /api/services/:id` - Chi tiết dịch vụ
- `POST /api/services/purchase` - Mua dịch vụ (protected)
- `GET /api/services/history` - Lịch sử mua hàng (protected)

### 📤 Upload
- `POST /api/upload/qr` - Upload QR code image
- `POST /api/upload/avatar` - Upload avatar

## Database Schema

### Users Table
```sql
users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE,
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  role ENUM('user', 'admin'),
  created_at TIMESTAMP
)
```

### Services Table
```sql
services (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100),
  description TEXT,
  price DECIMAL(10,2),
  category VARCHAR(50),
  qr_code_url VARCHAR(255),
  created_at TIMESTAMP
)
```

### Schedule Table
```sql
schedule (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  subject VARCHAR(100),
  day_of_week INT,
  start_time TIME,
  end_time TIME,
  room VARCHAR(50),
  teacher VARCHAR(100)
)
```

## Middleware

### Authentication (auth.js)
```javascript
// Verify JWT token
verifyToken(req, res, next)

// Check admin role
isAdmin(req, res, next)
```

### File Upload (upload.js)
```javascript
// Multer configuration
uploadQR.single('qrCode')
uploadAvatar.single('avatar')
```

## Environment Variables

```env
# MySQL Database
DB_HOST=vn1.whitecat.cloud
DB_PORT=3307
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=ctech
DB_POOL_SIZE=10
DB_CONNECT_TIMEOUT=20000
DB_SSL=false

# Server
PORT=3000
NODE_ENV=development

# OpenAI Chatbot API
OPENAI_API_KEY=your_openai_api_key

# Admin Credentials
ADMIN_USER=admin
ADMIN_PASSWORD=admin123

# Session & Security
SESSION_TIMEOUT=300
AUTH=your_auth_token

# Bank Info (for payment services)
BANK_NAME=MB Bank
BANK_OWNER=Your Name
BANK_NUMBER=0372360619
BANK_BIN=970422

# Debug
DEBUG=false
```

## Chạy Backend

### Development mode
```bash
npm run dev
```

### Production mode
```bash
npm start
```

## Testing API

Sử dụng tool như Postman hoặc Thunder Client:

### Example: Login
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "username": "user123",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": 1,
    "username": "user123",
    "role": "user"
  }
}
```

## Security

- JWT tokens với expiration time
- Password hashing với bcrypt
- CORS configuration
- Input validation & sanitization
- SQL injection prevention với prepared statements

## Troubleshooting

### Database connection failed
```bash
# Check MySQL service
mysql -u root -p

# Verify credentials in .env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=correct_password
```

### JWT token invalid
- Token đã hết hạn → Refresh token
- Token không đúng format → Kiểm tra header format
- Secret key không khớp → Verify JWT_SECRET

## API Documentation Chi Tiết

Xem thêm: [API Documentation](api/README.md)
