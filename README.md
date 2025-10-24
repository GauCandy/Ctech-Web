# CTECH - Cổng Thông Tin Trường Cao Đẳng Kỹ Thuật Bách Khoa

## Tổng Quan Dự Án

Website thông tin và quản lý cho Trường Cao Đẳng Kỹ Thuật - Công Nghệ Bách Khoa (CTECH).

## Công Nghệ Sử Dụng

### Backend
- **Node.js** với Express.js
- **MySQL** database
- JWT Authentication
- Middleware: CORS, body-parser, multer

### Frontend
- **Vanilla JavaScript** (ES6+)
- **CSS3** với responsive design
- Theme system (Light/Dark/Presentation modes)
- Scroll animations

## Cấu Trúc Thư Mục

```
Api Web/
├── src/
│   ├── backend/          # Backend server & APIs
│   │   ├── api/         # API endpoints
│   │   ├── database/    # Database configs
│   │   ├── middleware/  # Middleware functions
│   │   └── server/      # Server setup
│   └── frontend/         # Frontend files
│       ├── css/         # Stylesheets
│       ├── js/          # JavaScript files
│       └── img/         # Images & assets
├── node_modules/         # Dependencies
└── package.json         # Project config
```

## Các Tính Năng Chính

### 🎨 Frontend
- Hero section với background động
- Theme switcher (Sáng/Tối/Trình chiếu)
- Mô hình 5C với scroll animations
- Chat widget với chatbot AI
- Responsive design cho mọi thiết bị
- Presentation mode cho máy chiếu

### 🔐 Backend
- Authentication & Authorization (JWT)
- User management
- Chatbot API (OpenAI GPT)
- Service management
- Schedule management
- File upload (QR codes, images)

## Cài Đặt & Chạy

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình môi trường
Tạo file `.env` với các biến môi trường cần thiết:
```
# MySQL Database
DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ctech

# Server
PORT=3000

# OpenAI Chatbot
OPENAI_API_KEY=your_openai_api_key

# Admin
ADMIN_USER=admin
ADMIN_PASSWORD=admin123
```

### 3. Chạy server
```bash
npm start
```

Server sẽ chạy tại: `http://localhost:3000`

## Documentation Chi Tiết

- [Backend Documentation](src/backend/README.md)
- [Frontend Documentation](src/frontend/README.md)
- [API Documentation](src/backend/api/README.md)

## Git Workflow

### Branches
- `main` - Production-ready code
- Feature branches cho các tính năng mới

### Commit Messages
Sử dụng format rõ ràng:
- `feat:` - Tính năng mới
- `fix:` - Bug fixes
- `style:` - CSS/UI changes
- `refactor:` - Code refactoring
- `docs:` - Documentation updates

## License

© 2024 CTECH - Cao Đẳng Kỹ Thuật - Công Nghệ Bách Khoa
