# Hệ Thống Quản Lý Trường CTECH - Tài Liệu Kỹ Thuật

## Mục Lục

1. [Tổng Quan Dự Án](#tổng-quan-dự-án)
2. [Kiến Trúc Hệ Thống](#kiến-trúc-hệ-thống)
3. [Công Nghệ Sử Dụng](#công-nghệ-sử-dụng)
4. [Cấu Trúc Thư Mục](#cấu-trúc-thư-mục)
5. [Tính Năng Chi Tiết](#tính-năng-chi-tiết)
6. [Hướng Dẫn Cài Đặt](#hướng-dẫn-cài-đặt)
7. [Cấu Hình Môi Trường](#cấu-hình-môi-trường)
8. [Database Schema](#database-schema)
9. [API Endpoints](#api-endpoints)
10. [Frontend Architecture](#frontend-architecture)
11. [Security & Authentication](#security--authentication)
12. [Cache System](#cache-system)
13. [File Upload & Processing](#file-upload--processing)
14. [Deployment Guide](#deployment-guide)
15. [Troubleshooting](#troubleshooting)

---

## Tổng Quan Dự Án

**CTECH Web System** là hệ thống quản lý trường học toàn diện được xây dựng với kiến trúc Full-stack hiện đại, bao gồm:

- **Backend API**: Node.js + Express.js + MySQL
- **Frontend**: Vanilla JavaScript + CSS3 + HTML5
- **AI Chatbot**: Tích hợp OpenAI GPT
- **Payment Integration**: VietQR cho thanh toán trực tuyến
- **Timetable Parser**: Tự động parse PDF thời khóa biểu

### Đối Tượng Sử Dụng

- **Sinh viên**: Xem dịch vụ, đặt hàng, xem lịch học, chat với AI
- **Giáo viên**: Quản lý thông tin cá nhân, xem lịch giảng dạy
- **Admin**: Quản lý users, services, orders, vouchers, thống kê

### Các Tính Năng Nổi Bật

✅ Hệ thống đăng nhập/đăng ký với session tokens
✅ Quản lý dịch vụ trường học (gửi xe, căn tin, học phí...)
✅ Đặt hàng và thanh toán qua VietQR
✅ Hệ thống voucher giảm giá
✅ Upload và parse PDF thời khóa biểu
✅ AI Chatbot hỗ trợ sinh viên 24/7
✅ Admin dashboard với thống kê
✅ Presentation mode với remote control
✅ Theme system (light/dark/blue/green)
✅ In-memory caching cho performance
✅ Device management cho sinh viên

---

## Kiến Trúc Hệ Thống

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Browser                          │
│  (HTML5 + CSS3 + Vanilla JS + Presentation Mode)           │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/HTTPS
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   Express.js Server                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Routes                                          │  │
│  │  /api/auth, /api/services, /api/orders, /api/admin  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Middleware Layer                                    │  │
│  │  - CORS, Body Parser, Auth, Cache, File Upload      │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Business Logic (Controllers & Services)             │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬──────────────┐
        │            │            │              │
┌───────▼──────┐ ┌──▼──────┐ ┌──▼──────────┐  ┌▼──────────┐
│   MySQL      │ │ OpenAI  │ │  VietQR     │  │  Local    │
│   Database   │ │   API   │ │    API      │  │  Storage  │
└──────────────┘ └─────────┘ └─────────────┘  └───────────┘
```

### Technology Stack

**Backend:**
- Node.js v16+
- Express.js v5
- MySQL v8+ (với mysql2 driver)
- OpenAI SDK v6
- Puppeteer (web scraping)
- PDF.js (PDF parsing)

**Frontend:**
- Vanilla JavaScript (ES6+)
- CSS3 với CSS Variables
- HTML5 với Semantic markup
- No frameworks (lightweight)

**Development Tools:**
- dotenv (environment variables)
- Multer (file uploads)
- Axios (HTTP client)
- Cheerio (HTML parsing)
- ExcelJS (export data)

---

## Công Nghệ Sử Dụng

### Backend Dependencies

```json
{
  "dependencies": {
    "axios": "^1.12.2",           // HTTP client
    "cheerio": "^1.1.2",          // HTML parser
    "dotenv": "^17.2.3",          // Environment config
    "exceljs": "^4.4.0",          // Excel export
    "express": "^5.1.0",          // Web framework
    "multer": "^2.0.2",           // File upload
    "mysql2": "^3.15.1",          // MySQL driver
    "openai": "^6.1.0",           // OpenAI API
    "pdfjs-dist": "^4.7.76",      // PDF parser
    "puppeteer": "^24.25.0"       // Browser automation
  }
}
```

### System Requirements

- **Node.js**: >= 16.x
- **MySQL**: >= 8.0
- **RAM**: Minimum 2GB
- **Storage**: 500MB (tùy số lượng uploads)
- **OS**: Windows, Linux, macOS

---

## Cấu Trúc Thư Mục

```
Api Web/
├── src/
│   ├── backend/                      # Backend source code
│   │   ├── api/                     # API layer
│   │   │   ├── features/           # Feature modules
│   │   │   │   ├── auth/          # Authentication
│   │   │   │   │   ├── controllers/
│   │   │   │   │   ├── services/
│   │   │   │   │   ├── middleware/
│   │   │   │   │   └── router.js
│   │   │   │   ├── admin/         # Admin management
│   │   │   │   ├── services/      # Service catalog
│   │   │   │   ├── orders/        # Order management
│   │   │   │   ├── vouchers/      # Voucher system
│   │   │   │   ├── chatbot/       # AI chatbot
│   │   │   │   └── timetable/     # Schedule parser
│   │   │   └── shared/            # Shared utilities
│   │   │       ├── cacheService.js
│   │   │       ├── cacheMiddleware.js
│   │   │       ├── password.js
│   │   │       └── value.js
│   │   ├── database/               # Database layer
│   │   │   ├── connection.js      # MySQL pool
│   │   │   ├── setupdb.js         # DB initialization
│   │   │   └── serviceExporter.js # Export catalog
│   │   ├── middleware/             # Global middleware
│   │   │   └── uploadImage.js
│   │   └── server/                # Server config
│   │       └── app.js             # Express app
│   │
│   └── frontend/                    # Frontend source code
│       ├── css/                    # Stylesheets
│       │   ├── main.css           # Global styles
│       │   ├── login.css
│       │   ├── services.css
│       │   ├── schedule.css
│       │   ├── presentation-*.css # Theme styles
│       │   ├── departments.css
│       │   ├── responsive-*.css   # Responsive
│       │   └── ...
│       ├── js/                    # JavaScript modules
│       │   ├── themeManager.js    # Theme switching
│       │   ├── presentationMode.js
│       │   ├── presentationSlides.js
│       │   ├── remoteGestures.js  # Remote control
│       │   ├── headerManager.js
│       │   ├── c5Modal.js
│       │   ├── departmentCarousel.js
│       │   └── ...
│       ├── img/                   # Images & assets
│       │   └── 5C/               # 5C department images
│       ├── main.html             # Home page
│       ├── login.html            # Login page
│       ├── services.html         # Services page
│       ├── schedule.html         # Timetable page
│       ├── admin.html            # Admin panel
│       └── presentation.html     # Presentation mode
│
├── uploads/                        # Uploaded files
│   └── services/                  # Service images
│
├── node_modules/                   # Dependencies
├── .env                           # Environment config
├── .env.example                   # Environment template
├── index.js                       # Application entry
├── package.json                   # NPM config
├── README.md                      # Quick start guide
├── DOCUMENTATION.md               # This file
└── api.md                         # API documentation
```

---

## Tính Năng Chi Tiết

### 1. Authentication & Authorization

#### Hệ thống đăng nhập

- **Token-based authentication** với session tokens
- Tokens được lưu trong database (bảng `user_sessions`)
- Token format: `S{63 chars}` (normal) hoặc `R{63 chars}` (remember)
- TTL: 1 giờ (normal) hoặc 30 ngày (remember)
- Auto-extend TTL mỗi lần sử dụng

#### Device Management (Sinh viên)

- **1 device per student** policy
- Device ID được lưu trong database
- Prevent account sharing
- Admin có thể reset device link

#### Roles & Permissions

- **Student**: Xem services, đặt hàng, xem lịch học
- **Teacher**: Xem services, đặt hàng
- **Admin**: Full access, quản lý users/services/orders

### 2. Service Management

#### Service Catalog

- Quản lý dịch vụ trường học (gửi xe, căn tin, học phí...)
- Categories: Gửi xe, Căn tin, Học phí, Thư viện, Khác
- Upload images (jpg, png, gif, webp, max 5MB)
- Active/Inactive status (soft delete)

#### Service Features

- Search by keyword
- Filter by category
- Filter by active status
- Price management
- Image upload

### 3. Order & Payment System

#### Order Creation

- Tạo đơn hàng từ service
- Order code format: `ORD{YYYYMMDD}{sequential}`
- Transaction code: 6 random chars (A-Z, 0-9)
- Support notes

#### VietQR Integration

- Generate QR code tự động
- Bank info từ environment variables
- Transaction code trong QR content
- Payment status: pending, completed, failed, cancelled

#### Payment Flow

```
1. User chọn service → Click "Mua"
2. Server generate transaction code & QR code
3. User scan QR → Transfer money
4. Admin verify payment → Mark as completed
5. User nhận confirmation
```

### 4. Voucher System

#### Voucher Types

- **Percentage**: Giảm X% (có max discount)
- **Fixed**: Giảm cố định X VND

#### Voucher Rules

- Valid date range (valid_from → valid_until)
- Usage limit (total uses)
- Min order value
- Applies to: all / specific service / category
- Active/Inactive status

#### Validation Logic

```javascript
// Check voucher validity
✅ Tồn tại và is_active
✅ Trong date range
✅ Chưa vượt usage limit
✅ Order value >= min order value
✅ Áp dụng cho service/category đúng
```

### 5. Timetable Parser

#### PDF Upload & Parsing

- Upload PDF thời khóa biểu (max 25MB)
- Parse với pdfjs-dist
- Extract: Day, Period, Subject, Teacher, Room, Time
- Lưu JSON vào database
- Display trong grid layout

#### Schedule Display

- Week view (Thứ 2 → Chủ nhật)
- Subject details
- Teacher info
- Room numbers
- Time slots

### 6. AI Chatbot

#### OpenAI Integration

- Model: gpt-4o-mini (configurable)
- Conversation history support
- System prompt với school context
- Knowledge base từ services catalog

#### Features

- Answer questions về học phí, dịch vụ, lịch học
- Conversation memory (history)
- Response caching (10 minutes TTL)
- Usage statistics tracking

### 7. Admin Dashboard

#### User Management

- List all users (paginated)
- Create new accounts (student/teacher/admin)
- Update user info
- Delete users
- Reset passwords
- View statistics

#### Service Management

- CRUD operations
- Upload images
- Toggle active status
- Export to Excel

#### Order Management

- View all orders
- Filter by status
- Mark as completed
- Revenue statistics

#### Voucher Management

- CRUD operations
- Usage tracking
- Expiration management

### 8. Presentation Mode

#### Features

- Fullscreen mode với Fullscreen API
- Slide-based layout
- Auto-advance slides (configurable)
- Manual navigation (arrow keys)
- Multiple themes: Professional, Creative, Projector
- Remote control support (Skycolor T230)

#### Themes

1. **Professional**: Blue gradient, formal style
2. **Creative**: Vibrant colors, animations
3. **Projector**: High contrast, large fonts

#### Remote Gestures

- **Enter x2**: Toggle theme / Exit presentation
- **Enter x3**: Enter presentation mode
- **Up x2**: Navigate to another page
- **Arrow keys**: Navigate slides

---

## Hướng Dẫn Cài Đặt

### Bước 1: Clone Project

```bash
git clone https://github.com/GauCandy/Ctech-Web
cd "Api Web"
```

### Bước 2: Cài Đặt Dependencies

```bash
npm install
```

### Bước 3: Setup MySQL Database

```sql
-- Tạo database
CREATE DATABASE ctech CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant permissions (nếu cần)
GRANT ALL PRIVILEGES ON ctech.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

### Bước 4: Cấu Hình Environment

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Sửa thông tin trong `.env`:

```env
# MySQL Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ctech
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_POOL_SIZE=10
DB_CONNECT_TIMEOUT=20000
DB_SSL=false

# Server Configuration
PORT=3000

# Security
ADMIN_USER=admin
ADMIN_PASSWORD=admin123
SESSION_TIMEOUT=300        # minutes

# OpenAI (optional)
OPENAI_API_KEY=sk-your-api-key

# Debug
DEBUG=false

# Bank Info (for VietQR)
BANK_NAME=MB Bank
BANK_OWNER=Tran Tuan Tu
BANK_NUMBER=0372360619
BANK_BIN=970422

# Auth Key (for security)
AUTH=GauCandy#7322:)
```

### Bước 5: Tạo Thư Mục Uploads

```bash
mkdir uploads
mkdir uploads\services
```

Hoặc trên Linux/Mac:

```bash
mkdir -p uploads/services
```

### Bước 6: Khởi Động Server

```bash
node index.js
```

Nếu thành công, bạn sẽ thấy:

```
Database connection pool is ready.
Services catalog exported to ... (X services, extraTxt=Y).
API server listening on port 3000
```

### Bước 7: Truy Cập Ứng Dụng

Mở browser và truy cập:

- **Home**: http://localhost:3000
- **Login**: http://localhost:3000/login.html
- **Services**: http://localhost:3000/services.html
- **Admin**: http://localhost:3000/admin.html

---

## Cấu Hình Môi Trường

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_HOST` | ✅ | - | MySQL host address |
| `DB_PORT` | ❌ | 3306 | MySQL port |
| `DB_NAME` | ✅ | - | Database name |
| `DB_USER` | ✅ | - | MySQL username |
| `DB_PASSWORD` | ✅ | - | MySQL password |
| `DB_POOL_SIZE` | ❌ | 10 | Connection pool size |
| `DB_CONNECT_TIMEOUT` | ❌ | 20000 | Connection timeout (ms) |
| `DB_SSL` | ❌ | false | Enable SSL connection |
| `PORT` | ❌ | 3000 | Web server port |
| `ADMIN_USER` | ✅ | - | Default admin username |
| `ADMIN_PASSWORD` | ✅ | - | Default admin password |
| `SESSION_TIMEOUT` | ❌ | 300 | Session timeout (minutes) |
| `OPENAI_API_KEY` | ❌ | - | OpenAI API key (for chatbot) |
| `DEBUG` | ❌ | false | Enable debug mode |
| `BANK_NAME` | ❌ | - | Bank name for VietQR |
| `BANK_OWNER` | ❌ | - | Bank account owner |
| `BANK_NUMBER` | ❌ | - | Bank account number |
| `BANK_BIN` | ❌ | - | Bank BIN code |
| `AUTH` | ❌ | - | Auth secret key |

---

## Database Schema

### Main Tables

#### user_accounts
```sql
CREATE TABLE user_accounts (
  user_id VARCHAR(20) PRIMARY KEY,
  password_sha VARCHAR(64) NOT NULL,
  role ENUM('student', 'teacher', 'admin') NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### students
```sql
CREATE TABLE students (
  user_id VARCHAR(20) PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  phone_number VARCHAR(20) UNIQUE,
  department VARCHAR(100),
  class_code VARCHAR(50),
  FOREIGN KEY (user_id) REFERENCES user_accounts(user_id) ON DELETE CASCADE
);
```

#### teachers
```sql
CREATE TABLE teachers (
  user_id VARCHAR(20) PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  phone_number VARCHAR(20) UNIQUE,
  department VARCHAR(100),
  position VARCHAR(100),
  FOREIGN KEY (user_id) REFERENCES user_accounts(user_id) ON DELETE CASCADE
);
```

#### admin_profiles
```sql
CREATE TABLE admin_profiles (
  user_id VARCHAR(20) PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  phone_number VARCHAR(20) UNIQUE,
  FOREIGN KEY (user_id) REFERENCES user_accounts(user_id) ON DELETE CASCADE
);
```

#### user_sessions
```sql
CREATE TABLE user_sessions (
  token VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(20) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user_accounts(user_id) ON DELETE CASCADE,
  INDEX idx_expires_at (expires_at),
  INDEX idx_user_id (user_id)
);
```

#### services
```sql
CREATE TABLE services (
  service_code VARCHAR(20) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  price DECIMAL(10, 2) DEFAULT 0,
  image_url VARCHAR(255),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_active (is_active)
);
```

#### orders
```sql
CREATE TABLE orders (
  order_code VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(20) NOT NULL,
  service_code VARCHAR(20) NOT NULL,
  transaction_code VARCHAR(10) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  payment_status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
  payment_method VARCHAR(50) DEFAULT 'bank_transfer',
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user_accounts(user_id),
  FOREIGN KEY (service_code) REFERENCES services(service_code),
  INDEX idx_user_id (user_id),
  INDEX idx_status (payment_status),
  INDEX idx_transaction (transaction_code)
);
```

#### vouchers
```sql
CREATE TABLE vouchers (
  voucher_code VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  discount_type ENUM('percentage', 'fixed') NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  max_discount DECIMAL(10, 2),
  min_order_value DECIMAL(10, 2) DEFAULT 0,
  applies_to ENUM('all', 'service', 'category') DEFAULT 'all',
  target_code VARCHAR(50),
  usage_limit INT DEFAULT NULL,
  used_count INT DEFAULT 0,
  valid_from TIMESTAMP NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active (is_active),
  INDEX idx_valid_dates (valid_from, valid_until)
);
```

#### student_device_registry
```sql
CREATE TABLE student_device_registry (
  device_id VARCHAR(100) PRIMARY KEY,
  current_user_id VARCHAR(20) UNIQUE,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (current_user_id) REFERENCES user_accounts(user_id) ON DELETE SET NULL
);
```

### Database Relationships

```
user_accounts (1) ──> (1) students/teachers/admin_profiles
user_accounts (1) ──> (*) user_sessions
user_accounts (1) ──> (*) orders
services (1) ──> (*) orders
students (1) ──> (0..1) student_device_registry
```

---

## API Endpoints

### Authentication

- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký (student)
- `GET /api/auth/me` - Lấy thông tin user hiện tại
- `POST /api/auth/logout` - Đăng xuất
- `POST /api/auth/change-password` - Đổi mật khẩu

### Services

- `GET /api/services` - Lấy danh sách dịch vụ (cached)
- `GET /api/services/categories` - Lấy danh sách categories (cached)
- `GET /api/services/:code` - Lấy chi tiết dịch vụ
- `POST /api/services/:code/purchase` - Mua dịch vụ (tạo order + QR)
- `GET /api/services/vouchers` - Lấy danh sách vouchers
- `GET /api/services/:code/vouchers` - Lấy vouchers cho service
- `GET /api/services/5c-images/:id` - Lấy hình ảnh 5C

### Orders

- `POST /api/orders` - Tạo đơn hàng
- `GET /api/orders/my-orders` - Lấy đơn hàng của user
- `GET /api/orders/:orderCode` - Chi tiết đơn hàng
- `PATCH /api/orders/:orderCode/complete` - Hoàn thành thanh toán
- `GET /api/orders/completed` - Tất cả đơn đã thanh toán (admin)

### Vouchers

- `POST /api/vouchers/validate` - Validate voucher

### Chatbot

- `POST /api/chatbot/chat` - Chat với AI (cached)

### Timetable

- `POST /api/timetable/parse` - Upload và parse PDF

### Admin

- `GET /api/admin/stats` - Thống kê dashboard
- `GET /api/admin/users` - Danh sách users
- `PUT /api/admin/users/:userId` - Cập nhật user
- `DELETE /api/admin/users/:userId` - Xóa user
- `POST /api/admin/accounts` - Tạo tài khoản mới
- `POST /api/admin/accounts/:userId/reset-password` - Reset password
- `POST /api/admin/services` - Tạo service mới
- `PUT /api/admin/services/:code` - Cập nhật service
- `POST /api/admin/services/:code/upload-image` - Upload hình
- `DELETE /api/admin/services/:code` - Toggle active status
- `GET /api/admin/vouchers` - Danh sách vouchers
- `GET /api/admin/vouchers/:code` - Chi tiết voucher
- `POST /api/admin/vouchers` - Tạo voucher
- `PUT /api/admin/vouchers/:code` - Cập nhật voucher
- `DELETE /api/admin/vouchers/:code` - Xóa voucher

### System

- `GET /api/status` - Health check

**Chi tiết API documentation**: Xem [api.md](api.md)

---

## Frontend Architecture

### Page Structure

1. **main.html** - Home page với hero, departments, services preview
2. **login.html** - Login/Register page
3. **services.html** - Service catalog với filter & search
4. **schedule.html** - Timetable display & PDF upload
5. **admin.html** - Admin dashboard
6. **presentation.html** - Presentation mode

### JavaScript Modules

- **themeManager.js** - Theme switching (light/dark/blue/green)
- **presentationMode.js** - Fullscreen presentation mode
- **presentationSlides.js** - Slide navigation
- **remoteGestures.js** - Remote control gestures
- **headerManager.js** - Dynamic header visibility
- **c5Modal.js** - 5C department modals
- **departmentCarousel.js** - Department carousel
- **mobileMenu.js** - Mobile hamburger menu

### CSS Architecture

- **CSS Variables** cho theming
- **Responsive design** với breakpoints
- **Mobile-first** approach
- **Animation** với GPU acceleration
- **Modular CSS** cho từng component

### Theme System

```css
:root {
  --primary-color: #007bff;
  --background: #ffffff;
  --text-color: #333333;
  /* ... */
}

body.theme-dark {
  --background: #1a1a1a;
  --text-color: #ffffff;
  /* ... */
}
```

**Chi tiết Frontend**: Xem [src/frontend/README.md](src/frontend/README.md)

---

## Security & Authentication

### Password Security

- **SHA256 hashing** (production nên dùng bcrypt)
- Password strength validation:
  - Min 8 characters
  - Complexity requirements
- Admin passwords stored in environment

### Session Security

- Token-based authentication
- Tokens stored in database
- Auto-expire with TTL
- Token prefix: `S` (normal), `R` (remember)
- All old sessions deleted on login/password change

### Device Management

- **1 device per student** policy
- Device ID validation
- Prevent account sharing
- Admin can reset device links

### Authorization Levels

1. **Public** - No auth required (services list, login)
2. **User** - Requires valid token (orders, profile)
3. **Admin** - Requires admin role (user management, service CRUD)

### CORS Configuration

```javascript
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token');
  next();
});
```

### Input Validation

- Sanitize all user inputs
- Validate file types & sizes
- Prevent SQL injection với prepared statements
- XSS protection với CSP headers

---

## Cache System

### In-Memory Cache

```javascript
class CacheService {
  constructor() {
    this.cache = new Map();
  }

  get(key) { /* ... */ }
  set(key, value, ttl) { /* ... */ }
  delete(key) { /* ... */ }
  clear() { /* ... */ }
}
```

### Cache Configuration

- **Services**: TTL 300s (5 minutes)
- **Chatbot**: TTL 600s (10 minutes)
- **Fallback on error**: Return stale cache on 5xx errors
- **Auto cleanup**: Every 5 minutes

### Cache Logs

```
[Cache] MISS: GET:/api/services
[Cache] CACHED: GET:/api/services (TTL: 300s)
[Cache] HIT: GET:/api/services
[Cache] FALLBACK: GET:/api/services (on server error)
```

---

## File Upload & Processing

### Multer Configuration

#### Service Images

```javascript
const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/services/',
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${serviceCode}-${Date.now()}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});
```

#### Timetable PDFs

```javascript
const uploadPDF = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files allowed'));
    }
  }
});
```

### PDF Parsing

```javascript
const pdfjs = require('pdfjs-dist');

async function parseTimetable(buffer) {
  const loadingTask = pdfjs.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;

  let schedule = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    // Parse schedule data...
  }

  return schedule;
}
```

---

## Deployment Guide

### Development

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your config

# Start server
node index.js
```

### Production with PM2

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start index.js --name ctech-api

# View logs
pm2 logs ctech-api

# Monitor
pm2 monit

# Restart
pm2 restart ctech-api

# Auto-start on boot
pm2 startup
pm2 save
```

### Docker Deployment

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
```

```bash
# Build image
docker build -t ctech-web .

# Run container
docker run -d -p 3000:3000 --env-file .env --name ctech-web ctech-web
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS (nginx reverse proxy)
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up logging (Winston, Morgan)
- [ ] Use Redis cache instead of in-memory
- [ ] Set up database backups
- [ ] Monitor server health (Uptime Robot)
- [ ] Use PM2 or similar process manager
- [ ] Minify CSS/JS assets
- [ ] Enable Gzip compression
- [ ] Set cache headers
- [ ] Change default admin password
- [ ] Use bcrypt instead of SHA256
- [ ] Set up firewall rules
- [ ] Regular security updates

---

## Troubleshooting

### Cannot connect to MySQL

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solutions:**
1. Check MySQL is running: `mysql -u root -p`
2. Verify credentials in `.env`
3. Check firewall settings
4. Ensure database `ctech` exists

### Port already in use

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions:**
1. Change `PORT` in `.env` to another port
2. Kill process using port 3000:
   - Windows: `netstat -ano | findstr :3000` → `taskkill /PID <PID> /F`
   - Linux/Mac: `lsof -ti:3000 | xargs kill`

### OpenAI API error

**Symptoms:**
```
Chat service is not configured
```

**Solutions:**
1. Add `OPENAI_API_KEY` to `.env`
2. Get API key from https://platform.openai.com/api-keys
3. Check API quota & billing

### File upload errors

**Symptoms:**
```
Multer error: File too large
```

**Solutions:**
1. Check file size < 5MB (images) or 25MB (PDFs)
2. Verify `uploads/services/` directory exists
3. Check file permissions
4. Validate file type

### Cache not working

**Symptoms:**
```
Always seeing [Cache] MISS in logs
```

**Solutions:**
1. Check console logs for MISS/HIT/CACHED
2. Verify TTL settings in middleware
3. Clear cache: restart server
4. Check if route is using cache middleware

### Database schema errors

**Symptoms:**
```
Table 'ctech.services' doesn't exist
```

**Solutions:**
1. Run `setupDatabase()` on first start
2. Manually import schema: `mysql -u root -p ctech < schema.sql`
3. Check MySQL user permissions

---

## Performance Tips

### Database Optimization

1. **Indexing**: Create indexes on frequently queried columns
2. **Connection pooling**: Use pool size 10-20
3. **Prepared statements**: Prevent SQL injection + performance
4. **Query optimization**: Use EXPLAIN to analyze queries

### Caching Strategy

1. **Cache frequently accessed data**: Services, categories
2. **Set appropriate TTL**: 5-10 minutes for dynamic data
3. **Cache invalidation**: Clear on data updates
4. **Redis for production**: Replace in-memory cache

### Frontend Optimization

1. **Lazy loading images**: Use Intersection Observer
2. **Minify CSS/JS**: Use UglifyJS, cssnano
3. **Compress images**: Use WebP format
4. **Enable Gzip**: Server-side compression
5. **CDN**: Serve static assets from CDN

---

## Browser Support

- Chrome/Edge >= 90
- Firefox >= 88
- Safari >= 14
- Mobile Chrome (Android)
- Mobile Safari (iOS)

---

## Contributing

### Code Style

- Use ES6+ features
- 2 spaces indentation
- Semicolons required
- Single quotes for strings
- Descriptive variable names

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes
git add .
git commit -m "feat: add your feature"

# Push to remote
git push origin feature/your-feature

# Create Pull Request
```

### Commit Message Format

```
<type>: <subject>

Types: feat, fix, docs, style, refactor, test, chore
```

---

## License

Proprietary - CTECH School Management System

---

## Support & Contact

Nếu gặp vấn đề:

1. Check [Troubleshooting](#troubleshooting) section
2. View logs: `node index.js` output
3. Check [API.md](api.md) for API details
4. Review MySQL logs
5. Contact: GauCandy#7322

---

## Changelog

### Version 1.0.0 (Current)

- ✅ Authentication system với session tokens
- ✅ Service catalog với categories
- ✅ Order & payment system (VietQR)
- ✅ Voucher system
- ✅ Timetable PDF parser
- ✅ AI Chatbot (OpenAI)
- ✅ Admin dashboard
- ✅ Presentation mode
- ✅ Theme system
- ✅ Cache system
- ✅ Device management

### Future Roadmap

- [ ] Real-time notifications (WebSocket)
- [ ] Mobile app (React Native)
- [ ] Payment gateway integration
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Dark mode improvements
- [ ] PWA features
- [ ] Unit & E2E testing

---

**Cuối tài liệu - Tổng 15 sections**
