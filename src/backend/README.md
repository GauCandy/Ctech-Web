# Backend Architecture

Backend API server cho CTECH Web System sử dụng Node.js + Express.js với MySQL database.

## Cấu trúc thư mục

```
src/backend/
├── api/                      # API layer
│   ├── features/            # Feature modules (domain-driven design)
│   │   ├── auth/           # Authentication (login, JWT)
│   │   ├── admin/          # Admin management (users)
│   │   ├── services/       # Services catalog (CRUD)
│   │   ├── chatbot/        # AI chatbot với OpenAI
│   │   ├── timetable/      # Timetable upload/parse
│   │   ├── orders/         # Order management
│   │   └── vouchers/       # Voucher system
│   │
│   └── shared/             # Shared middleware và utilities
│       ├── cacheMiddleware.js    # Cache middleware
│       ├── cacheService.js       # In-memory cache service
│       └── authMiddleware.js     # JWT authentication (if exists)
│
├── database/               # Database layer
│   ├── connection.js      # MySQL connection pool
│   ├── setupdb.js         # Database setup và initialization
│   └── serviceExporter.js # Export services catalog
│
└── server/                # Server configuration
    └── app.js            # Express app setup, routing, middleware
```

## Feature Module Pattern

Mỗi feature được tổ chức theo pattern:

```
features/<feature-name>/
├── router.js              # Express router với routes
├── controller.js          # Business logic (optional)
├── service.js             # Database queries (optional)
└── middleware.js          # Feature-specific middleware (optional)
```

### Example: Services Feature
```
features/services/
├── router.js              # Routes: GET/POST/PUT/DELETE /api/services
└── (logic inline hoặc trong controller)
```

## Core Components

### 1. Express App (`server/app.js`)

Main application setup:

```javascript
const app = express();

// CORS configuration
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token');
  next();
});

// Body parser
app.use(express.json());

// Static files
app.use(express.static(frontendDir));
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/services', servicesRouter); // NO CACHE - real-time updates
app.use('/api/chatbot', cacheMiddleware({ ttl: 600 }), chatbotRouter); // 10 min cache
app.use('/api/timetable', timetableRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/vouchers', vouchersRouter);
```

**Key Features:**
- CORS enabled cho tất cả origins
- Static file serving cho frontend
- Cache middleware chỉ cho chatbot (10 minutes)
- Services load trực tiếp từ database (no cache - real-time updates)
- Error handling middleware

### 2. Database Connection (`database/connection.js`)

MySQL2 connection pool:

```javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
```

**Connection Pool Benefits:**
- Reuse connections
- Auto-reconnect on failure
- Connection queueing

### 3. Cache System (`api/shared/`)

#### Cache Service (`cacheService.js`)
In-memory cache với TTL:

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

#### Cache Middleware (`cacheMiddleware.js`)
Intercepts Express responses:

```javascript
function cacheMiddleware(options = {}) {
  const { ttl = 300, fallbackOnError = true } = options;

  return (req, res, next) => {
    if (req.method !== 'GET') return next();

    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      console.log(`[Cache] HIT: ${cacheKey}`);
      return res.json(cachedData);
    }

    console.log(`[Cache] MISS: ${cacheKey}`);
    // Cache response before sending
    next();
  };
}
```

**Features:**
- Only caches GET requests
- TTL-based expiration
- Fallback on 5xx errors
- Console logging (MISS/HIT/CACHED/FALLBACK)

### 4. Database Setup (`database/setupdb.js`)

Auto-creates tables on first run:

- `users` table với username, password, role
- `services` table với serviceCode, name, price, category
- `orders` table với userId, serviceId, quantity, status
- `vouchers` table với code, discount, validity
- `timetables` table với userId, fileName, parsedData

**Setup Flow:**
1. Connect to database
2. Check if tables exist
3. Create tables if missing
4. Insert default data (admin user, sample services)

### 5. Service Exporter (`database/serviceExporter.js`)

Exports services catalog cho chatbot:

```javascript
async function exportServicesCatalog() {
  const services = await queryDatabase('SELECT * FROM services');
  const catalog = JSON.stringify(services, null, 2);
  fs.writeFileSync('services_catalog.json', catalog);
  return { servicesCount: services.length };
}
```

## API Features

### Authentication (`features/auth/`)

**Routes:**
- `POST /api/auth/login` - Login với username/password
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/change-password` - Change password

**Authentication Flow:**
1. User sends credentials
2. Validate against database
3. Generate JWT token
4. Return token + user info
5. Client stores token in localStorage
6. Client sends token in `Authorization: Bearer <token>` header

**Security:**
- JWT tokens với expiration
- Password hashing (recommended: bcrypt)
- Token validation middleware

### Admin (`features/admin/`)

**Routes:**
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/:userId` - Update user
- `DELETE /api/admin/users/:userId` - Delete user

**Authorization:**
- Requires `X-Admin-Token` header
- Validates admin role
- Only accessible by admins

### Services (`features/services/`)

**Routes:**
- `GET /api/services` - List services (NO CACHE - real-time from DB)
- `GET /api/services/categories` - List categories (NO CACHE)
- `GET /api/services/:code` - Get service details
- `GET /api/services/:code/vouchers` - Get vouchers for service
- `GET /api/services/vouchers` - List active vouchers
- `GET /api/services/5c-images/:id` - Get 5C department images
- `POST /api/services/:code/purchase` - Purchase service (requires auth)

**Features:**
- Query params: `q` (search), `active` (filter), `category` (filter)
- Real-time data - no caching để admin changes hiển thị ngay
- Image upload với Multer (admin routes)

**Why No Cache:**
Services cần real-time updates khi admin thay đổi. Cache được disable để đảm bảo users luôn thấy data mới nhất.

### Chatbot (`features/chatbot/`)

**Routes:**
- `POST /api/chatbot/chat` - Send message to AI

**Request:**
```json
{
  "message": "Học phí học kỳ này là bao nhiêu?",
  "history": [
    { "role": "user", "content": "Xin chào" },
    { "role": "assistant", "content": "Xin chào!" }
  ]
}
```

**Implementation:**
- OpenAI API integration
- Conversation history support
- Knowledge base từ services catalog
- Cache responses (10 min TTL)

### Timetable (`features/timetable/`)

**Routes:**
- `POST /api/timetable/upload` - Upload PDF timetable (multipart/form-data)
- `GET /api/timetable` - Get user's timetable
- `DELETE /api/timetable/:timetableId` - Delete timetable

**Features:**
- PDF upload với Multer
- PDF parsing với pdfjs-dist
- Extract schedule data (subject, teacher, room, time)
- Store parsed data as JSON

### Orders (`features/orders/`)

**Routes:**
- `GET /api/orders` - List user's orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:orderId` - Get order details

**Business Logic:**
- Calculate total price (quantity × service price)
- Apply voucher discount if provided
- Support payment methods: cash, bank_transfer
- Order statuses: pending, completed, cancelled

### Vouchers (`features/vouchers/`)

**Routes:**
- `GET /api/vouchers` - List available vouchers
- `POST /api/vouchers/validate` - Validate voucher code

**Validation:**
- Check voucher code exists
- Check valid date range
- Check usage limit not exceeded
- Check minimum order value
- Calculate discount amount

**Discount Types:**
- `percentage` - Discount % (e.g., 10%)
- `fixed` - Fixed amount (e.g., 20,000đ)

## Middleware

### Cache Middleware
- Applied to: **Chatbot only** (services không dùng cache)
- TTL: 600s (10 minutes) cho chatbot
- Fallback on 5xx errors
- Logging: MISS/HIT/CACHED/FALLBACK

### CORS Middleware
- Allow all origins: `*`
- Allow methods: GET, POST, PUT, DELETE, OPTIONS
- Allow headers: Content-Type, Authorization, X-Admin-Token
- Handle preflight requests

### Auth Middleware (if implemented)
- Validate JWT token from `Authorization: Bearer` header
- Decode token to get userId and role
- Attach `req.user` for downstream use
- Return 401 if invalid/missing token

### Admin Middleware
- Validate `X-Admin-Token` header
- Check admin role
- Return 403 if not admin

### Multer Middleware (File Upload)
- Services: Accept images (jpg, png, gif, webp), max 5MB
- Timetable: Accept PDF, max 10MB
- Store in `uploads/` directory

## Database Queries

### Connection Pattern
```javascript
let connection;
try {
  connection = await pool.getConnection();
  const [rows] = await connection.query('SELECT * FROM services WHERE status = ?', ['active']);
  return rows;
} catch (error) {
  console.error('Database error:', error);
  throw error;
} finally {
  if (connection) connection.release();
}
```

### Prepared Statements
Always use prepared statements để prevent SQL injection:

```javascript
// Good
await connection.query('SELECT * FROM users WHERE username = ?', [username]);

// Bad
await connection.query(`SELECT * FROM users WHERE username = '${username}'`);
```

## Error Handling

### Standard Error Responses

```javascript
// 400 Bad Request
res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });

// 401 Unauthorized
res.status(401).json({ error: 'Chưa đăng nhập' });

// 403 Forbidden
res.status(403).json({ error: 'Không có quyền truy cập' });

// 404 Not Found
res.status(404).json({ error: 'Không tìm thấy' });

// 500 Internal Server Error
res.status(500).json({ error: 'Lỗi hệ thống' });
```

### Global Error Handler
```javascript
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});
```

## Environment Variables

Required in `.env`:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ctech_db

# Server
PORT=3000

# Authentication
JWT_SECRET=your_jwt_secret_key
ADMIN_TOKEN=your_admin_token

# OpenAI
OPENAI_API_KEY=sk-...
```

## Performance Optimization

### 1. Connection Pooling
- Reuse database connections
- Limit: 10 concurrent connections
- Auto-reconnect on failure

### 2. Caching
- In-memory cache chỉ cho chatbot (TTL: 10 minutes)
- Services load trực tiếp từ DB (no cache)
- Fallback on errors cho cached routes

### 3. Async/Await
- Non-blocking I/O
- Parallel requests handled efficiently

### 4. Prepared Statements
- Query plan caching
- Prevent SQL injection

## Testing

### Manual Testing với curl

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"student01","password":"password123"}'
```

**Get Services:**
```bash
curl http://localhost:3000/api/services
```

**Create Service (Admin):**
```bash
curl -X POST http://localhost:3000/api/services \
  -H "X-Admin-Token: your-admin-token" \
  -F "serviceCode=SV001" \
  -F "serviceName=Vé gửi xe" \
  -F "price=5000" \
  -F "category=Gửi xe" \
  -F "image=@parking.jpg"
```

## Security Best Practices

1. **Password Hashing**: Use bcrypt với salt rounds >= 10
2. **JWT Secret**: Use strong, random secret key
3. **SQL Injection**: Always use prepared statements
4. **CORS**: Configure properly for production
5. **File Upload**: Validate file type, size, sanitize filenames
6. **Rate Limiting**: Implement rate limiting cho login, API calls
7. **HTTPS**: Use HTTPS in production
8. **Environment Variables**: Never commit `.env` to git

## Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up logging (Winston, Morgan)
- [ ] Use Redis cache thay cho in-memory
- [ ] Set up database backups
- [ ] Monitor server health
- [ ] Use PM2 hoặc similar process manager

### PM2 Example
```bash
pm2 start index.js --name ctech-api
pm2 logs ctech-api
pm2 restart ctech-api
```

## Troubleshooting

### Database Connection Errors
- Check `.env` credentials
- Ensure MySQL is running
- Check firewall settings

### Cache Not Working
- Check console logs: MISS/HIT/CACHED
- Verify TTL settings
- Clear cache: restart server

### File Upload Errors
- Check `uploads/` directory exists
- Verify file size < limit
- Check file type validation

### JWT Errors
- Check JWT_SECRET in `.env`
- Verify token format: `Bearer <token>`
- Check token expiration

## API Documentation

Xem chi tiết tại [API.md](API.md)
