# 🎓 NỘI DUNG THUYẾT TRÌNH - HỆ THỐNG QUẢN LÝ TRƯỜNG CAO ĐẲNG CTECH

> **Dự án:** Website quản lý và dịch vụ trực tuyến Trường Cao đẳng CTECH
> **Công nghệ:** Node.js + Express.js + MySQL + Vanilla JavaScript
> **Thời gian:** 2025

---

## 📋 MỤC LỤC

1. [Giới thiệu dự án](#1-giới-thiệu-dự-án)
2. [Kiến trúc hệ thống](#2-kiến-trúc-hệ-thống)
3. [Các tính năng chính](#3-các-tính-năng-chính)
4. [Demo trực tiếp](#4-demo-trực-tiếp)
5. [Kết luận và hướng phát triển](#5-kết-luận-và-hướng-phát-triển)

---

## 1. GIỚI THIỆU DỰ ÁN

### 🎯 Mục tiêu
Xây dựng hệ thống website toàn diện cho Trường Cao đẳng CTECH, giúp:
- **Sinh viên & Giáo viên:** Tra cứu thông tin, đăng ký dịch vụ, thanh toán trực tuyến
- **Quản trị viên:** Quản lý dịch vụ, người dùng, đơn hàng
- **Khách truy cập:** Tìm hiểu về trường, các chương trình đào tạo

### 📊 Thông tin trường CTECH
- **Tên đầy đủ:** Trường Cao đẳng Kỹ thuật - Công nghệ Bách Khoa
- **Thành lập:** 01/10/2008
- **15+ năm** kinh nghiệm đào tạo
- **100%** sinh viên có việc làm đúng chuyên môn
- **25+ ngành học** chuyên sâu
- **500+ đối tác doanh nghiệp**

---

## 2. KIẾN TRÚC HỆ THỐNG

### 🏗️ Stack công nghệ

**Backend:**
- Node.js + Express.js (RESTful API)
- MySQL (Database)
- JWT (Authentication)
- Multer (Upload files)
- OpenAI API (Chatbot AI)

**Frontend:**
- Vanilla JavaScript (ES6+)
- CSS3 (Custom properties, Grid, Flexbox)
- Material Icons
- Service Worker (PWA)

### 📁 Cấu trúc dự án

```
Api Web/
├── src/
│   ├── backend/
│   │   ├── api/
│   │   │   ├── features/
│   │   │   │   ├── auth/          # Xác thực & phân quyền
│   │   │   │   ├── services/      # Quản lý dịch vụ
│   │   │   │   ├── orders/        # Quản lý đơn hàng
│   │   │   │   ├── chatbot/       # Chatbot AI
│   │   │   │   ├── timetable/     # Thời khóa biểu
│   │   │   │   └── admin/         # Quản trị
│   │   │   └── shared/            # Utilities chung
│   │   └── database/              # Database connection & migration
│   └── frontend/
│       ├── css/                   # Stylesheets
│       ├── js/                    # JavaScript modules
│       ├── img/                   # Images & assets
│       ├── main.html              # Trang chủ
│       ├── services.html          # Trang dịch vụ
│       ├── schedule.html          # Lịch học
│       └── presentation.html      # Trang demo thuyết trình
└── .env                           # Cấu hình môi trường
```

### 🔐 Bảo mật & Phân quyền

**3 vai trò người dùng:**
1. **Admin:** Toàn quyền quản lý hệ thống
2. **Teacher (Giáo viên):** Xem dịch vụ, thanh toán, tra cứu lịch
3. **Student (Sinh viên):** Xem dịch vụ, thanh toán, tra cứu lịch

**Cơ chế bảo mật:**
- JWT token với thời gian hết hạn 5 phút (SESSION_TIMEOUT)
- Password hashing
- CORS protection
- XSS protection (HTML escaping)
- SQL injection prevention (Parameterized queries)

---

## 3. CÁC TÍNH NĂNG CHÍNH

### 3.1. 🏠 TRANG CHỦ (main.html)

**Giới thiệu trường:**
- Hero section với thông tin nổi bật
- Mô hình 5C (Chất lượng, Cơ sở vật chất, Chương trình, Doanh nghiệp, Cơ hội toàn cầu)
- Highlight cards với hiệu ứng shimmer khi hover

**7 Khoa đào tạo:**
1. Cơ khí & Công nghệ (9 chuyên ngành)
2. Du lịch (4 chuyên ngành)
3. Ngoại ngữ (5 ngôn ngữ)
4. Điều dưỡng & Sức khỏe (4 chuyên ngành)
5. Công nghệ Thông tin (3 chuyên ngành)
6. Logistics & Xây dựng (4 chuyên ngành)
7. Truyền thông (3 chuyên ngành)

**Đời sống sinh viên:**
- 25+ câu lạc bộ
- Cơ sở vật chất hiện đại
- Hoạt động ngoại khóa

**Liên hệ:**
- Trụ sở chính: Hà Nội
- Cơ sở đào tạo: Cần Thơ
- 4 văn phòng tuyển sinh
- Hotline: 1800 6770
- Email: contact@ctech.edu.vn

---

### 3.2. 💳 TRANG DỊCH VỤ (services.html)

#### Tính năng người dùng:

**1. Danh sách dịch vụ:**
- Grid layout responsive (tự động điều chỉnh số cột)
- 7 dịch vụ hiện có:
  - Vé gửi xe Oto (theo ngày/tháng)
  - Vé gửi xe Máy (theo ngày/tháng)
  - Nước ép
  - Gà rán
  - Tôm chiên

**2. Tìm kiếm & Lọc:**
- Tìm kiếm theo tên, mã, mô tả
- Lọc theo trạng thái (hoạt động/tạm dừng)
- Lọc theo danh mục (Gửi xe, Ăn uống, etc.)

**3. Chi tiết dịch vụ (Modal):**
- Layout 2 cột:
  - **Cột trái:** Thông tin dịch vụ, mô tả, danh mục, ngày cập nhật
  - **Cột phải:** Thanh toán (QR VietQR + mã giao dịch + thông tin ngân hàng)
- Tự động load payment khi mở modal
- Không có animation delay

**4. Thanh toán VietQR:**
- Tích hợp VietQR API
- Tự động điền số tiền, mã giao dịch
- Hiển thị thông tin ngân hàng từ .env:
  - **Ngân hàng:** MB Bank
  - **Số tài khoản:** 0372360619
  - **Người nhận:** Trần Tuấn Tú

**5. Lịch sử đơn hàng:**
- Xem danh sách đơn hàng đã thanh toán
- Thông tin chi tiết: mã đơn, dịch vụ, số tiền, trạng thái
- Nút "Hoàn thành" để đánh dấu đã nhận hàng/dịch vụ

#### Tính năng quản trị:

**1. Thêm dịch vụ:**
- Form modal với validation
- Upload hình ảnh (sử dụng Multer)
- Tự động generate mã dịch vụ (DV001, DV002, ...)

**2. Sửa dịch vụ:**
- Cập nhật tên, mô tả, danh mục, giá, trạng thái
- Upload/thay đổi hình ảnh
- Preview hình ảnh real-time

**3. Xóa/Tắt dịch vụ:**
- Toggle trạng thái (không xóa hẳn khỏi database)
- Soft delete để giữ lại lịch sử

---

### 3.3. 📅 THỜI KHÓA BIỂU (schedule.html)

**Upload PDF:**
- Hỗ trợ upload file PDF từ Bộ GD
- Parse tự động thành dữ liệu structured

**Hiển thị:**
- Giao diện lịch đẹp mắt
- Lọc theo lớp, giảng viên, phòng học
- Export ra PDF mới hoặc iCal

**Tính năng nổi bật:**
- Tự động phát hiện conflict (trùng lịch)
- Highlight tiết học hiện tại
- Responsive cho mobile

---

### 3.4. 🤖 CHATBOT AI

**Công nghệ:**
- OpenAI GPT-4 API
- Context-aware (biết thông tin trường, dịch vụ, lịch học)
- RAG (Retrieval-Augmented Generation) với knowledge base từ services.md

**Kiến thức Chatbot:**
- Thông tin trường (lịch sử, mô hình 5C, thành tích)
- 7 khoa đào tạo với 40+ chuyên ngành
- Học phí: 10.000.000đ/học kỳ (5 tháng)
- Địa chỉ các cơ sở & văn phòng tuyển sinh
- 7 dịch vụ với giá cả chi tiết
- FAQ về tuyển sinh, học phí, dịch vụ
- Hướng dẫn sử dụng website

**Giao diện:**
- Chat widget floating button "Cần trợ giúp?"
- Typing indicator
- Markdown support
- Auto-scroll
- Suggested questions

**Tính năng:**
- Trả lời câu hỏi về trường, tuyển sinh, học phí
- Hướng dẫn sử dụng website
- Tra cứu dịch vụ
- Hỗ trợ 24/7

---

### 3.5. 🔐 XÁC THỰC & PHÂN QUYỀN

**Đăng nhập:**
- Tài khoản admin: `admin / admin123`
- Tài khoản test student: (từ database)
- JWT token với refresh mechanism
- Session timeout: 5 phút

**Quản lý session:**
- Lưu trong localStorage
- Auto refresh token
- Header dropdown menu
- Avatar + tên người dùng

**Phân quyền API:**
- Middleware `requireAuth` cho tất cả protected routes
- Role-based access control
- Admin-only routes cho management

---

### 3.6. 🎨 GIAO DIỆN & UX

**Design System:**
- Color palette: Blue (#0047ab, #0ea5e9) & Green (#16a34a)
- Typography: Be Vietnam Pro
- Spacing system: 4px base unit
- Border radius: 8px - 20px

**Responsive Design:**
- Mobile-first approach
- Breakpoints:
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px
- Grid auto-adjustment

**Animations:**
- Smooth transitions (cubic-bezier easing)
- Hover effects (shimmer, scale, shadow)
- Loading states
- Modal slide-up animations
- Skeleton screens

**Dark Mode:**
- Toggle trong header
- CSS custom properties
- Lưu preference trong localStorage
- Smooth transition giữa themes

**Presentation Theme:**
- Theme đặc biệt cho trang demo (presentation.html)
- High contrast
- Larger fonts
- Bold borders

---

### 3.7. 📱 PWA (Progressive Web App)

**Service Worker:**
- Cache static assets
- Offline fallback
- Update notification

**Manifest:**
- Install to home screen
- Splash screen
- App icons

---

### 3.8. 🎬 TRANG DEMO THUYẾT TRÌNH (presentation.html)

**Tính năng:**
- Slideshow với navigation
- Auto-play cursor animation (spawn từ góc dưới phải)
- Confetti animation (spawn ngoài viewport)
- Live demo các tính năng:
  - Dịch vụ với QR thanh toán
  - Chatbot AI
  - Thời khóa biểu
  - Admin dashboard

**Slide Content:**
1. **Giới thiệu:** Tên đề tài, thành viên nhóm
2. **Vấn đề:** Pain points của hệ thống hiện tại
3. **Giải pháp:** Website CTECH
4. **Công nghệ:** Tech stack
5. **Demo Dịch vụ:** Live payment flow
6. **Demo Chatbot:** AI conversation
7. **Demo Lịch học:** PDF parser
8. **Kết luận:** Thành quả & hướng phát triển

---

## 4. DEMO TRỰC TIẾP

### 🔴 Kịch bản Demo

**Bước 1: Trang chủ (2 phút)**
```
1. Mở website tại http://localhost:3000
2. Giới thiệu các phần:
   - Hero section với thông tin nổi bật
   - Highlight cards (15+ năm, 100% việc làm, 25+ ngành, 500 đối tác)
   - 7 khoa đào tạo với carousel
   - Đời sống sinh viên
   - Footer với liên hệ
3. Hover vào highlight cards để thấy shimmer effect
4. Scroll qua các section
```

**Bước 2: Chatbot AI (3 phút)**
```
1. Click nút "Cần trợ giúp?" ở góc dưới
2. Chọn suggested question: "Học phí 1 học kỳ là bao nhiêu?"
   → Bot trả lời: "10.000.000đ (5 tháng)"
3. Hỏi: "Trường có bao nhiêu ngành học?"
   → Bot liệt kê 7 khoa với 40+ chuyên ngành
4. Hỏi: "Làm thế nào để mua vé gửi xe?"
   → Bot hướng dẫn vào trang /services
5. Đóng chatbot
```

**Bước 3: Đăng nhập (1 phút)**
```
1. Click "Đăng nhập" ở header
2. Nhập:
   - Username: admin
   - Password: admin123
3. Login thành công → Header hiển thị tên & avatar
4. Menu dropdown: Profile, Đơn hàng, Admin, Logout
```

**Bước 4: Trang dịch vụ - User View (4 phút)**
```
1. Click "Dịch vụ" ở navigation
2. Tìm kiếm: "gửi xe"
   → Hiện 4 dịch vụ gửi xe
3. Lọc danh mục: "Ăn uống"
   → Hiện 3 dịch vụ: Nước ép, Gà rán, Tôm chiên
4. Click vào "Vé gửi xe Oto theo tháng"
   → Modal mở với 2 cột:
      - Trái: Thông tin dịch vụ
      - Phải: QR thanh toán + mã giao dịch + bank info
5. Giải thích:
   - QR code sử dụng VietQR API
   - Tự động điền số tiền (300.000đ), mã giao dịch
   - Bank info từ .env (MB Bank - Trần Tuấn Tú)
6. Đóng modal
```

**Bước 5: Trang dịch vụ - Admin View (3 phút)**
```
1. Ở trang dịch vụ, với tài khoản admin
2. Click nút "✎" ở card dịch vụ
   → Modal edit service mở
3. Thay đổi giá: 300.000 → 350.000
4. Click "Cập nhật"
   → Success message
   → Reload trang, giá đã thay đổi
5. Click "Thêm dịch vụ"
   → Modal thêm service
6. Điền form:
   - Tên: "Trà sữa"
   - Danh mục: "Ăn uống"
   - Giá: 25000
   - Upload ảnh (nếu có)
7. Click "Tạo dịch vụ"
   → Success → Reload → Dịch vụ mới xuất hiện với mã DV008
```

**Bước 6: Lịch sử đơn hàng (2 phút)**
```
1. Click dropdown menu ở header
2. Click "Đơn hàng của tôi"
   → Modal hiện danh sách orders
3. Xem chi tiết:
   - Mã đơn: ORD-xxxxx
   - Dịch vụ: Vé gửi xe Oto theo tháng
   - Số tiền: 300.000đ
   - Trạng thái: Đang xử lý
4. Click "Hoàn thành"
   → Trạng thái chuyển sang "Đã hoàn thành"
```

**Bước 7: Presentation Demo (5 phút)**
```
1. Mở http://localhost:3000/presentation
2. Navigate qua các slide:
   - Slide 1: Title
   - Slide 7: Demo dịch vụ với animation
     - Cursor tự động từ góc dưới phải
     - Click vào service card
     - Animation thanh toán với confetti
3. Show off presentation theme
4. Quay về slide cuối: Kết luận
```

---

## 5. KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

### ✅ Thành quả đạt được

**1. Chức năng hoàn chỉnh:**
- ✅ 7 dịch vụ với thanh toán VietQR
- ✅ Chatbot AI với GPT-4
- ✅ Quản lý đơn hàng
- ✅ Admin dashboard
- ✅ Responsive design
- ✅ PWA support
- ✅ Dark mode

**2. Bảo mật:**
- ✅ JWT authentication
- ✅ Role-based access control
- ✅ SQL injection prevention
- ✅ XSS protection

**3. Hiệu năng:**
- ✅ Service Worker caching
- ✅ Lazy loading
- ✅ Optimized images
- ✅ Minified assets

**4. UX/UI:**
- ✅ Material Design principles
- ✅ Smooth animations
- ✅ Loading states
- ✅ Error handling

### 🚀 Hướng phát triển

**Ngắn hạn (1-3 tháng):**
1. **Notifications:**
   - Push notifications cho đơn hàng
   - Email confirmation
   - SMS OTP

2. **Payment Gateway:**
   - Tích hợp Momo, ZaloPay
   - Auto verify payment
   - Webhook từ ngân hàng

3. **Analytics:**
   - Google Analytics
   - User behavior tracking
   - Revenue dashboard

**Trung hạn (3-6 tháng):**
1. **Mobile App:**
   - React Native / Flutter
   - Native notifications
   - Offline sync

2. **AI Features:**
   - Chatbot voice support
   - Image recognition (upload ảnh thẻ sinh viên)
   - Recommendation system

3. **Social Features:**
   - Forum sinh viên
   - Rating & review dịch vụ
   - Share to social media

**Dài hạn (6-12 tháng):**
1. **Microservices:**
   - Split monolith to microservices
   - Containerization (Docker)
   - Kubernetes orchestration

2. **Blockchain:**
   - Bằng cấp trên blockchain
   - Smart contracts cho thanh toán

3. **IoT Integration:**
   - Smart parking với IoT sensors
   - RFID cho thẻ sinh viên
   - Face recognition

---

## 📝 CÂU HỎI THƯỜNG GẶP (Chuẩn bị trước cho Q&A)

### Q1: Tại sao chọn Vanilla JavaScript thay vì React/Vue?
**A:**
- Hiệu năng tốt hơn (không overhead của framework)
- Bundle size nhỏ hơn (loading nhanh hơn)
- Học được JavaScript thuần, hiểu sâu hơn
- Dự án này không quá phức tạp, không cần framework lớn

### Q2: Chatbot AI có thể trả lời được những gì?
**A:**
- Thông tin về trường (lịch sử, mô hình 5C, thành tích)
- 7 khoa đào tạo với 40+ chuyên ngành
- Học phí, chính sách tài chính
- Địa chỉ các cơ sở, liên hệ
- 7 dịch vụ với giá chi tiết
- Hướng dẫn sử dụng website
- FAQ tuyển sinh

### Q3: Làm thế nào để tích hợp VietQR?
**A:**
- Sử dụng VietQR API: `https://img.vietqr.io/image/{bankBin}-{accountNo}-compact.png`
- Parameters: amount, addInfo (mã giao dịch), accountName
- Bank info từ file .env (bảo mật)
- Tự động generate mã giao dịch unique

### Q4: Xử lý thanh toán như thế nào?
**A:**
- User click dịch vụ → Gọi API `/api/services/:code/purchase`
- Backend generate mã giao dịch → Tạo order trong database
- Trả về QR URL + transaction code + bank info
- Frontend hiển thị QR để user quét
- (Hiện tại chưa có auto verify, cần manual confirm)

### Q5: Bảo mật thông tin ngân hàng?
**A:**
- Bank info trong file `.env` (không commit lên Git)
- API chỉ trả về info cần thiết (không trả về sensitive data)
- HTTPS trong production
- Rate limiting để chống spam

### Q6: Tại sao dùng JWT với timeout 5 phút?
**A:**
- 5 phút là đủ cho 1 session thao tác
- Giảm risk nếu token bị leak
- User vẫn có thể refresh token (nếu implement)
- Balance giữa security và UX

### Q7: Làm thế nào để scale hệ thống khi có nhiều user?
**A:**
Ngắn hạn:
- Tăng connection pool size
- Add Redis caching
- CDN cho static files

Dài hạn:
- Load balancer
- Database replication (master-slave)
- Microservices
- Message queue (RabbitMQ/Kafka)

### Q8: Có xử lý concurrent payment không?
**A:**
- Hiện tại chưa có locking mechanism
- Mỗi request tạo 1 order riêng trong database
- Không có conflict vì mỗi order có unique code
- Nếu cần: implement optimistic locking hoặc database transaction

---

## 🎤 SCRIPT ĐỌC CHO TỪNG SLIDE

### Slide 1 - Title (30s)
```
Xin chào thầy/cô và các bạn!

Hôm nay nhóm em xin phép được trình bày đề tài:
"Hệ thống quản lý và dịch vụ trực tuyến Trường Cao đẳng CTECH"

Nhóm em gồm có:
- [Tên thành viên 1] - [Vai trò]
- [Tên thành viên 2] - [Vai trò]
- ...
```

### Slide 2 - Vấn đề (1 phút)
```
Trước hết, em xin phân tích vấn đề mà dự án này hướng đến giải quyết:

1. Quy trình thủ công: Sinh viên phải đến trực tiếp các phòng ban để đăng ký dịch vụ
2. Thanh toán chậm: Phải xếp hàng, mất thời gian
3. Thiếu thông tin: Khó tra cứu lịch học, dịch vụ
4. Quản lý phân tán: Dữ liệu nằm rải rác nhiều nơi

Từ những vấn đề này, nhóm em đã xây dựng hệ thống website để giải quyết.
```

### Slide 3 - Giải pháp (1 phút)
```
Hệ thống CTECH bao gồm:

1. Website thông tin: Giới thiệu trường, các khoa, chương trình đào tạo
2. Hệ thống dịch vụ trực tuyến: Đăng ký và thanh toán dịch vụ qua VietQR
3. Chatbot AI: Hỗ trợ tư vấn 24/7 với GPT-4
4. Quản lý lịch học: Upload PDF từ Bộ GD, tự động parse
5. Admin dashboard: Quản lý dịch vụ, người dùng, đơn hàng

Tất cả tập trung vào 1 nền tảng duy nhất, dễ sử dụng, responsive trên mọi thiết bị.
```

### Slide 4 - Công nghệ (1 phút)
```
Về mặt công nghệ, nhóm em sử dụng:

Backend:
- Node.js + Express.js để xây dựng RESTful API
- MySQL làm database
- JWT cho authentication
- OpenAI GPT-4 API cho chatbot

Frontend:
- Vanilla JavaScript (không dùng framework để tối ưu hiệu năng)
- CSS3 với Grid và Flexbox cho responsive design
- Material Design principles

Bảo mật:
- Role-based access control (Admin, Teacher, Student)
- Password hashing
- SQL injection prevention
- XSS protection
```

### Slide 5-7 - Demo (10 phút)
```
[Thực hiện demo theo kịch bản ở phần 4]

Bây giờ em xin phép được demo các tính năng chính của hệ thống...
```

### Slide 8 - Kết luận (2 phút)
```
Tóm lại, nhóm em đã hoàn thành được:

✅ Hệ thống website đầy đủ chức năng với 7 dịch vụ
✅ Tích hợp thanh toán VietQR
✅ Chatbot AI với GPT-4
✅ Admin dashboard quản lý toàn diện
✅ Responsive design, hỗ trợ PWA
✅ Bảo mật với JWT và phân quyền

Hướng phát triển:
🚀 Tích hợp payment gateway (Momo, ZaloPay)
🚀 Auto verify payment với webhook
🚀 Push notifications
🚀 Mobile app
🚀 AI voice support cho chatbot

Em xin cảm ơn thầy/cô và các bạn đã lắng nghe.
Nhóm em xin phép được trả lời các câu hỏi!
```

---

## 💡 MẸO THUYẾT TRÌNH

### Chuẩn bị:
- [ ] Test tất cả tính năng trước khi thuyết trình
- [ ] Chuẩn bị 2-3 tài khoản test (admin, student, teacher)
- [ ] Clear browser cache để demo mượt
- [ ] Có backup video demo phòng khi server lỗi
- [ ] In sẵn script để không quên

### Trong lúc thuyết trình:
- ✅ Nói rõ ràng, không nhanh
- ✅ Tương tác với audience (hỏi họ có câu hỏi không)
- ✅ Giải thích từng bước khi demo
- ✅ Highlight điểm mạnh (AI, VietQR, Responsive)
- ✅ Thành thật nếu có tính năng chưa hoàn thiện

### Khi gặp lỗi:
- ❌ Không hoảng
- ✅ Bình tĩnh refresh page
- ✅ Nếu không fix được, chuyển sang video backup
- ✅ Giải thích "Đây là môi trường demo, trong production sẽ có error handling tốt hơn"

---

## 📊 METRICS (Số liệu demo)

- **Database:** 7 services, 3+ users, 5+ orders
- **API Endpoints:** 25+ routes
- **Frontend Pages:** 5 pages (main, services, schedule, login, presentation)
- **Lines of Code:** ~5000+ lines (Backend + Frontend)
- **Dependencies:** 15+ npm packages
- **Features:** 10+ major features

---

## 🎯 KEY TAKEAWAYS

1. **Giải quyết vấn đề thực tế** của nhà trường
2. **Công nghệ hiện đại** (AI, VietQR, PWA)
3. **UX tốt** (Responsive, animations, loading states)
4. **Bảo mật chặt chẽ** (JWT, RBAC, SQL injection prevention)
5. **Scalable** (Kiến trúc module, có thể mở rộng)

---

**Chúc bạn thuyết trình thành công! 🎉**
