# 🔧 Sửa lỗi Admin Login Redirect Loop

## ❌ Vấn đề

Khi đăng nhập với tài khoản admin, trang web bị **redirect vô hạn** giữa `/login` và `/admin`.

## 🔍 Nguyên nhân

**Conflict về localStorage key** giữa 2 file:

### login.html
```javascript
const sessionKey = 'ctechSession';
localStorage.setItem(sessionKey, JSON.stringify(payload));
// Lưu: { token, user: { role, fullName, ... } }
```

### admin.html (CŨ - SAI)
```javascript
const token = localStorage.getItem('authToken');  // ❌ Key khác!
const user = JSON.parse(localStorage.getItem('user') || '{}');  // ❌ Key khác!
```

### Kết quả
```
Admin login → Lưu vào 'ctechSession'
    ↓
Redirect tới /admin
    ↓
admin.html kiểm tra 'authToken' → Không tìm thấy ❌
    ↓
Redirect về /login
    ↓
login.html kiểm tra 'ctechSession' → Tìm thấy ✅
    ↓
Redirect tới /admin
    ↓
LOOP VÔ HẠN! 🔁
```

## ✅ Giải pháp

Sửa `admin.html` để dùng **cùng key** `ctechSession` như `login.html`.

### Các thay đổi

#### 1. Thêm constant SESSION_KEY
```javascript
const SESSION_KEY = 'ctechSession';
```

#### 2. Sửa hàm `checkAdminAuth()`
**Trước:**
```javascript
const token = localStorage.getItem('authToken');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token || user.role !== 'admin') {
  window.location.href = '/login';
  return false;
}
```

**Sau:**
```javascript
const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');

if (!session || !session.token || !session.user || session.user.role !== 'admin') {
  window.location.href = '/login';
  return false;
}

document.getElementById('adminName').textContent = session.user.fullName || 'Admin';
```

#### 3. Sửa hàm `logout()`
**Trước:**
```javascript
localStorage.removeItem('authToken');
localStorage.removeItem('user');
```

**Sau:**
```javascript
localStorage.removeItem(SESSION_KEY);
localStorage.removeItem('ctechDisplayName');
```

#### 4. Sửa hàm `addUser()`
**Trước:**
```javascript
const token = localStorage.getItem('authToken');
```

**Sau:**
```javascript
const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
if (!session || !session.token) {
  alert('Phiên đăng nhập hết hạn');
  window.location.href = '/login';
  return;
}

// Sử dụng session.token
const response = await fetch('/api/admin/accounts', {
  headers: {
    'Authorization': `Bearer ${session.token}`
  },
  // ...
});
```

## 🧪 Cách test

### 1. Clear localStorage
```javascript
// Mở DevTools Console (F12)
localStorage.clear();
```

### 2. Đăng nhập với tài khoản admin
- Username: `admin` (hoặc tài khoản admin của bạn)
- Password: mật khẩu admin

### 3. Kiểm tra redirect
- ✅ Phải redirect tới `/admin` và **DỪNG LẠI**
- ✅ Hiển thị Admin Dashboard
- ✅ Tên admin hiển thị ở header

### 4. Kiểm tra logout
- Click nút "Đăng xuất"
- ✅ Phải redirect về `/login`
- ✅ localStorage bị xóa sạch

### 5. Kiểm tra thêm tài khoản
- Vào trang Users
- Click "Thêm tài khoản"
- Điền form và submit
- ✅ API call thành công với Bearer token

## 📝 Cấu trúc Session mới

```javascript
// Key: 'ctechSession'
{
  "token": "eyJhbGc...",
  "user": {
    "userId": "U001",
    "role": "admin",
    "fullName": "Quản trị viên",
    "email": "admin@ctech.edu.vn"
  }
}
```

## 🔧 Files đã sửa

- ✅ [admin.html](src/frontend/admin.html) - Sửa localStorage keys
- ✅ [services.txt](src/backend/api/features/chatbot/services.txt) - Đã xóa (không dùng nữa)

## ⚠️ Lưu ý

### Nếu vẫn bị loop sau khi sửa:

1. **Clear browser cache:**
   ```
   Ctrl + Shift + Delete → Xóa cache
   ```

2. **Clear localStorage:**
   ```javascript
   // DevTools Console
   localStorage.clear();
   ```

3. **Hard reload:**
   ```
   Ctrl + Shift + R (hoặc Ctrl + F5)
   ```

4. **Kiểm tra localStorage key:**
   ```javascript
   // DevTools Console
   console.log(Object.keys(localStorage));
   // Phải thấy: ['ctechSession']
   ```

### Đăng nhập lại sau khi sửa:

Nếu đã đăng nhập trước khi sửa, cần:
1. Logout (hoặc clear localStorage)
2. Đăng nhập lại
3. Session mới sẽ dùng key đúng

## ✅ Kết quả

- ✅ Admin login thành công → `/admin`
- ✅ Không còn redirect loop
- ✅ Logout hoạt động bình thường
- ✅ API calls có token đúng
- ✅ User name hiển thị chính xác

---

**Sửa lúc:** 2025-10-28
**Vấn đề:** Redirect loop khi login admin
**Nguyên nhân:** Conflict localStorage keys
**Giải pháp:** Thống nhất key `ctechSession`
