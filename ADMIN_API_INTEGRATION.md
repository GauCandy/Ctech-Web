# 🔧 Admin Dashboard - Tích hợp API thật

## ✅ Hoàn thành

Trang admin dashboard giờ sử dụng **API thật** thay vì dữ liệu fake!

---

## 📝 API mới được tạo

### Backend: [statsController.js](src/backend/api/features/admin/controllers/statsController.js)

#### 1. GET `/api/admin/stats`
Lấy thống kê tổng quan cho dashboard

**Response:**
```json
{
  "summary": {
    "totalUsers": 248,
    "ordersThisMonth": 152,
    "totalRevenue": 45200000,
    "activeServices": 12
  },
  "monthlyOrders": [
    { "month": "2025-05", "orders": 45, "revenue": 15000000 },
    { "month": "2025-06", "orders": 52, "revenue": 18500000 }
  ],
  "topServices": [
    { "serviceCode": "DV001", "name": "Vé gửi xe tháng", "orderCount": 120, "revenue": 36000000 }
  ]
}
```

#### 2. GET `/api/admin/users`
Lấy danh sách users (có phân trang)

**Query params:**
- `page` - Trang hiện tại (mặc định: 1)
- `limit` - Số users mỗi trang (mặc định: 20)
- `search` - Tìm kiếm theo ID/tên/email/SĐT
- `role` - Lọc theo vai trò (admin/teacher/student)

**Response:**
```json
{
  "users": [
    {
      "userId": "U001",
      "fullName": "Nguyễn Văn A",
      "email": "admin@ctech.edu.vn",
      "phoneNumber": "0123456789",
      "role": "admin",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 248,
    "page": 1,
    "limit": 20,
    "totalPages": 13
  }
}
```

#### 3. PUT `/api/admin/users/:userId`
Cập nhật thông tin user

**Body:**
```json
{
  "fullName": "Tên mới",
  "email": "email@moi.com",
  "phoneNumber": "0987654321",
  "role": "teacher"
}
```

#### 4. DELETE `/api/admin/users/:userId`
Xóa user (không cho xóa admin)

**Response:**
```json
{
  "message": "Đã xóa người dùng thành công"
}
```

---

## 🎨 Frontend: [admin.js](src/frontend/js/admin.js)

File JavaScript riêng chứa toàn bộ logic admin dashboard.

### Tính năng đã implement:

#### ✅ Dashboard
- Load stats thật từ `/api/admin/stats`
- Hiển thị: Tổng users, orders tháng này, doanh thu, dịch vụ hoạt động
- Chart dịch vụ bán chạy (top 5)

#### ✅ User Management
- Load danh sách users từ `/api/admin/users`
- Hiển thị table với: ID, Tên, Email, Vai trò, Trạng thái
- **Thêm user** - Qua modal (đã có từ trước)
- **Xóa user** - Với confirm dialog (không cho xóa admin)
- **Reset password** - Qua prompt
- **Edit user** - TODO (chưa làm modal)

#### ✅ Service Management
- Load danh sách dịch vụ từ `/api/services`
- Hiển thị table với: Mã, Tên, Danh mục, Giá, Trạng thái
- **Xóa dịch vụ** - Với confirm dialog
- **Edit dịch vụ** - TODO (chưa làm modal)

#### ✅ Statistics
- Load từ `/api/admin/stats`
- Biểu đồ monthly orders - TODO (chưa visualize)

---

## 🔧 Cấu trúc code mới

### Trước (admin.html):
```html
<script>
  // 500+ dòng code inline trong HTML
  // Khó đọc, khó maintain
</script>
```

### Sau:
```html
<script src="/js/admin.js"></script>
```

File JavaScript riêng biệt [admin.js](src/frontend/js/admin.js):
- Dễ đọc và maintain
- Tách logic khỏi HTML
- Có thể minify khi production
- Dễ debug

---

## 📊 Tính năng đang hoạt động

### ✅ Dashboard Stats (Thật 100%)
- Tổng số người dùng
- Đơn hàng tháng này
- Tổng doanh thu
- Số dịch vụ đang hoạt động
- Top 5 dịch vụ bán chạy

### ✅ User Management
- ✅ Xem danh sách users
- ✅ Thêm user mới
- ✅ Xóa user (trừ admin)
- ✅ Reset password
- ⏳ Edit user info (TODO: cần modal)
- ⏳ Phân trang (TODO: cần UI)

### ✅ Service Management
- ✅ Xem danh sách services
- ✅ Xóa service
- ⏳ Thêm service (TODO: cần modal)
- ⏳ Edit service (TODO: cần modal)

### ⏳ Statistics (Partial)
- ✅ Load data
- ⏳ Visualize charts (TODO: cần chart library)

---

## 🚀 Cách sử dụng

### 1. Đăng nhập admin
```
URL: /login
Username: admin (hoặc tài khoản admin của bạn)
Password: ***
```

### 2. Dashboard
Tự động load khi vào trang `/admin`
- Stats hiển thị số liệu thật từ database
- Chart top services tự động cập nhật

### 3. User Management
Click "Users" trong sidebar:
- Xem danh sách users
- Click "Thêm tài khoản" để tạo user mới
- Click icon ✏️ để sửa (TODO)
- Click icon 🗑️ để xóa
- Click icon 🔒 để reset password

### 4. Service Management
Click "Services" trong sidebar:
- Xem danh sách dịch vụ
- Click icon 🗑️ để xóa dịch vụ

---

## 🛠️ TODO - Tính năng cần hoàn thiện

### High Priority
- [ ] **Edit User Modal** - Sửa thông tin user
- [ ] **Add/Edit Service Modal** - Thêm/sửa dịch vụ
- [ ] **User Pagination UI** - Phân trang danh sách users
- [ ] **Search Users** - Tìm kiếm user theo tên/email

### Medium Priority
- [ ] **Monthly Revenue Chart** - Biểu đồ doanh thu theo tháng (dùng Chart.js)
- [ ] **Service Statistics Chart** - Biểu đồ thống kê dịch vụ
- [ ] **Export Excel** - Xuất báo cáo Excel
- [ ] **User Role Filter** - Lọc users theo vai trò

### Low Priority
- [ ] **Bulk Actions** - Xóa nhiều users cùng lúc
- [ ] **User Activity Log** - Lịch sử hoạt động
- [ ] **Email Notifications** - Gửi email khi tạo user

---

## 📁 Files đã thay đổi

### Backend
- ✅ [statsController.js](src/backend/api/features/admin/controllers/statsController.js) - **MỚI**
- ✅ [router.js](src/backend/api/features/admin/router.js) - Thêm routes

### Frontend
- ✅ [admin.js](src/frontend/js/admin.js) - **MỚI**
- ✅ [admin.html](src/frontend/admin.html) - Thêm IDs, include admin.js, services table

---

## 🐛 Debugging

### Check API trong DevTools

```javascript
// Console
const session = JSON.parse(localStorage.getItem('ctechSession'));

// Test stats API
fetch('/api/admin/stats', {
  headers: { 'Authorization': `Bearer ${session.token}` }
}).then(r => r.json()).then(console.log);

// Test users API
fetch('/api/admin/users?page=1&limit=5', {
  headers: { 'Authorization': `Bearer ${session.token}` }
}).then(r => r.json()).then(console.log);

// Test services API
fetch('/api/services').then(r => r.json()).then(console.log);
```

### Common Issues

**Stats không load?**
- Check console errors
- Verify token trong localStorage
- Check database có data không

**Users table trống?**
- Check `/api/admin/users` response
- Verify tbody id="usersTableBody" có đúng không

**Delete không hoạt động?**
- Check role (không xóa được admin)
- Verify Authorization header

---

## 🎯 Next Steps

Để hoàn thiện admin dashboard:

1. **Tạo Edit User Modal**
   - Form giống Add User
   - Pre-fill dữ liệu hiện tại
   - Call PUT `/api/admin/users/:userId`

2. **Tạo Add/Edit Service Modal**
   - Form: Tên, Mô tả, Giá, Danh mục, Trạng thái
   - Upload ảnh
   - Call POST/PUT `/api/admin/services`

3. **Thêm Chart Library**
   - Install Chart.js hoặc ECharts
   - Visualize monthly revenue
   - Visualize service statistics

4. **Pagination Component**
   - Previous/Next buttons
   - Page numbers
   - Jump to page

---

**✅ Kết quả:** Admin dashboard giờ sử dụng dữ liệu THẬT từ database thay vì fake data!

**Thời gian:** 2025-10-28
**Status:** ✅ Hoàn thành core features, một số tính năng cần bổ sung
