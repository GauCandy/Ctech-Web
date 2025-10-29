# CTECH Web System

Hệ thống quản lý trường học CTECH - Full-stack web application với Node.js + Express backend và Vanilla JavaScript frontend.

## 📋 Yêu cầu hệ thống

Trước khi bắt đầu, đảm bảo máy tính đã cài đặt:

- **Node.js** >= 16.x ([Download](https://nodejs.org/))
- **MySQL** >= 8.0 ([Download](https://dev.mysql.com/downloads/mysql/))
- **Git** (optional, để clone repository)

## 🚀 Hướng dẫn cài đặt

### Bước 1: Clone hoặc download project

```bash
# Nếu dùng Git
git clone https://github.com/GauCandy/Ctech-Web
cd "Api Web"

# Hoặc download ZIP và giải nén
```

### Bước 2: Cài đặt dependencies

```bash
npm install
```

Lệnh này sẽ cài đặt tất cả packages cần thiết:
- express, mysql2, multer
- openai (cho chatbot)
- pdfjs-dist (parse PDF thời khóa biểu)
- dotenv, cors, và các dependencies khác

### Bước 3: Cấu hình database

#### 3.1. Tạo database MySQL

Mở MySQL Command Line hoặc MySQL Workbench và chạy:

```sql
CREATE DATABASE ctech_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 3.2. Tạo file `.env`

Tạo file `.env` ở thư mục gốc với nội dung:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ctech_db

# Server Configuration
PORT=3000

# Session Configuration (optional, có giá trị mặc định)
SESSION_TIMEOUT=3600                # 1 giờ (3600 giây)
SESSION_REMEMBER_TIMEOUT=2592000    # 30 ngày (2592000 giây)

# OpenAI Configuration (cho chatbot)
OPENAI_API_KEY=sk-your-openai-api-key

# Bank Information (cho VietQR payment)
BANK_BIN=970422
BANK_NUMBER=0372360619
BANK_OWNER=Tran Tuan Tu
BANK_NAME=MB Bank
```

**Lưu ý:**
- Thay `your_mysql_password` bằng mật khẩu MySQL của bạn
- Nếu không dùng chatbot, có thể bỏ qua `OPENAI_API_KEY`
- Bank info dùng để tạo VietQR code thanh toán

### Bước 4: Setup database schema

Database schema sẽ được tự động tạo khi chạy server lần đầu tiên. Server sẽ đọc file `src/backend/database/schema.sql` và tạo các bảng:

- `user_accounts` - Tài khoản người dùng
- `students`, `teachers`, `admin_profiles` - Hồ sơ theo role
- `user_sessions` - Session tokens
- `services` - Dịch vụ trường cung cấp
- `orders` - Đơn hàng
- `vouchers` - Mã giảm giá
- `student_device_registry` - Quản lý thiết bị sinh viên

### Bước 5: Tạo thư mục uploads

```bash
mkdir uploads
mkdir uploads\services
```

Hoặc trên Linux/Mac:

```bash
mkdir -p uploads/services
```

## ▶️ Chạy ứng dụng

### Khởi động server

```bash
node index.js
```

Nếu thành công, bạn sẽ thấy:

```
Database connection pool is ready.
Services catalog exported to ... (X services, extraTxt=Y).
API server listening on port 3000
```

### Truy cập ứng dụng

Mở trình duyệt và truy cập:

- **Trang chủ**: http://localhost:3000
- **Đăng nhập**: http://localhost:3000/login
- **Dịch vụ**: http://localhost:3000/services
- **Lịch học**: http://localhost:3000/schedule
- **Admin**: http://localhost:3000/admin

### Kiểm tra API health

```bash
curl http://localhost:3000/api/status
```

Hoặc mở: http://localhost:3000/api/status

## 👤 Tài khoản mặc định

Sau khi setup xong, hệ thống sẽ tự động tạo tài khoản admin từ environment variable. Kiểm tra trong code `src/backend/api/features/auth/services/adminAccountService.js` để biết username/password.

**Tạo tài khoản sinh viên mới:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Nguyen Van A",
    "email": "student@example.com",
    "phoneNumber": "0123456789",
    "classCode": "CNTT2024A",
    "department": "Công nghệ thông tin",
    "password": "password123"
  }'
```

## 🔧 Development

### Cấu trúc thư mục

```
Api Web/
├── src/
│   ├── backend/           # Backend API
│   │   ├── api/          # API routes và controllers
│   │   ├── database/     # Database setup và connection
│   │   └── server/       # Express app configuration
│   └── frontend/         # Frontend static files
│       ├── css/         # Stylesheets
│       ├── js/          # JavaScript modules
│       ├── img/         # Images
│       └── *.html       # HTML pages
├── uploads/              # Uploaded files
├── index.js             # Application entry point
├── package.json         # Dependencies
└── .env                 # Environment configuration
```

### Scripts hữu ích

```bash
# Khởi động server
node index.js

# Hoặc dùng nodemon để auto-restart khi code thay đổi
npm install -g nodemon
nodemon index.js
```

### Test API với curl

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"SV001","password":"password123"}'
```

**Get services:**
```bash
curl http://localhost:3000/api/services
```

**Get services với authentication:**
```bash
curl http://localhost:3000/api/services \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📚 Documentation

- **[API.md](API.md)** - Complete API documentation
- **[src/backend/README.md](src/backend/README.md)** - Backend architecture
- **[src/frontend/README.md](src/frontend/README.md)** - Frontend architecture

## 🎯 Tính năng chính

- ✅ **Authentication** - Login với JWT session tokens
- ✅ **User Management** - Quản lý sinh viên, giáo viên, admin
- ✅ **Services** - Catalog dịch vụ với categories
- ✅ **Orders** - Đặt hàng và thanh toán qua VietQR
- ✅ **Vouchers** - Hệ thống mã giảm giá
- ✅ **Timetable** - Upload và parse PDF thời khóa biểu
- ✅ **Chatbot** - AI chatbot với OpenAI
- ✅ **Admin Panel** - Quản lý users, services, orders
- ✅ **Presentation Mode** - Thuyết trình với điều khiển từ xa
- ✅ **Theme System** - Đổi theme động
- ✅ **Cache System** - In-memory caching

## 🐛 Troubleshooting

### Lỗi: "Cannot connect to MySQL"

**Nguyên nhân:** Database chưa chạy hoặc thông tin kết nối sai

**Giải pháp:**
1. Kiểm tra MySQL đang chạy: `mysql -u root -p`
2. Kiểm tra thông tin trong `.env` (DB_HOST, DB_USER, DB_PASSWORD)
3. Kiểm tra database `ctech_db` đã được tạo chưa

### Lỗi: "Port 3000 already in use"

**Nguyên nhân:** Đã có process khác đang dùng port 3000

**Giải pháp:**
1. Đổi PORT trong `.env` (ví dụ: `PORT=3001`)
2. Hoặc kill process đang dùng port 3000:
   - Windows: `netstat -ano | findstr :3000` rồi `taskkill /PID <PID> /F`
   - Linux/Mac: `lsof -ti:3000 | xargs kill`

### Lỗi: "OPENAI_API_KEY not configured"

**Nguyên nhân:** Thiếu API key để dùng chatbot

**Giải pháp:**
1. Nếu không dùng chatbot: Bỏ qua lỗi này, các tính năng khác vẫn hoạt động
2. Nếu muốn dùng chatbot: Lấy API key tại https://platform.openai.com/api-keys và thêm vào `.env`

### Lỗi: "Cannot find module"

**Nguyên nhân:** Dependencies chưa được cài đặt

**Giải pháp:**
```bash
npm install
```

### Database tables không được tạo

**Nguyên nhân:** File schema.sql không được execute hoặc lỗi quyền

**Giải pháp:**
1. Chạy manual: `mysql -u root -p ctech_db < src/backend/database/schema.sql`
2. Kiểm tra user MySQL có quyền CREATE TABLE không

## 🔒 Security Notes

**Quan trọng cho production:**

1. **Đổi tất cả passwords mặc định**
2. **Dùng HTTPS** thay vì HTTP
3. **Đổi password hashing** từ SHA256 sang bcrypt:
   ```bash
   npm install bcrypt
   ```
4. **Enable CORS properly** cho production domain
5. **Giới hạn upload file size** hợp lý
6. **Dùng Redis** thay cho in-memory cache
7. **Enable rate limiting**
8. **Backup database** thường xuyên

## 📝 Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_HOST` | ✅ | - | MySQL host |
| `DB_USER` | ✅ | - | MySQL username |
| `DB_PASSWORD` | ✅ | - | MySQL password |
| `DB_NAME` | ✅ | - | Database name |
| `PORT` | ❌ | 3000 | Server port |
| `SESSION_TIMEOUT` | ❌ | 3600 | Session TTL (seconds) |
| `SESSION_REMEMBER_TIMEOUT` | ❌ | 2592000 | Remember session TTL (seconds) |
| `OPENAI_API_KEY` | ❌ | - | OpenAI API key (cho chatbot) |
| `BANK_BIN` | ❌ | - | Bank BIN cho VietQR |
| `BANK_NUMBER` | ❌ | - | Bank account number |
| `BANK_OWNER` | ❌ | - | Bank account owner |
| `BANK_NAME` | ❌ | - | Bank name |

## 🌐 Browser Support

- Chrome/Edge >= 90
- Firefox >= 88
- Safari >= 14
- Mobile browsers (iOS Safari, Chrome Android)

## 📞 Support

Nếu gặp vấn đề:

1. Kiểm tra [Troubleshooting](#-troubleshooting) section
2. Xem logs trong console khi chạy `node index.js`
3. Kiểm tra [API.md](API.md) để hiểu cách API hoạt động
4. Kiểm tra MySQL logs nếu có lỗi database

## 📄 License

Proprietary - CTECH School Management System

---

**Quick Start Summary:**

```bash
# 1. Cài dependencies
npm install

# 2. Tạo database
mysql -u root -p
CREATE DATABASE ctech_db;

# 3. Tạo file .env với DB credentials
# (xem mẫu ở trên)

# 4. Chạy server
node index.js

# 5. Mở trình duyệt
# http://localhost:3000
```

**Tới đây là hết rồi bạn đã có thể thiết lập thành công demo! 🎉**
