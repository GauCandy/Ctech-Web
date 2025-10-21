# HƯỚNG DẪN LẤY 20 BÀI ĐĂNG TỪ FACEBOOK TỰ ĐỘNG

## 🎯 Mục tiêu
Script này sẽ **tự động lấy 20 bài đăng gần nhất** từ trang Facebook CTECH và tạo file `events.json`

---

## 📋 Bước 1: Lấy Facebook Access Token

### Cách 1: Dùng Facebook Graph API Explorer (Nhanh nhất)

1. **Truy cập**: https://developers.facebook.com/tools/explorer/

2. **Đăng nhập** bằng tài khoản Facebook có quyền admin page CTECH

3. **Chọn Page** trong dropdown (góc trên bên phải):
   - Click vào dropdown "User or Page"
   - Chọn "Get Page Access Token"
   - Chọn page **CTECH**

4. **Cấp quyền**:
   - Tick vào: `pages_read_engagement`
   - Tick vào: `pages_show_list`
   - Click "Generate Access Token"

5. **Copy Access Token**:
   - Token sẽ xuất hiện ở ô "Access Token"
   - Click "Copy" để copy token
   - Token dạng: `EAABsbCS...` (rất dài)

### Cách 2: Tạo Facebook App (Lâu dài hơn)

<details>
<summary>Click để xem hướng dẫn chi tiết</summary>

1. Truy cập: https://developers.facebook.com/apps/
2. Click "Create App"
3. Chọn "Business" → Next
4. Điền tên app → Create App
5. Dashboard → Add Product → chọn "Facebook Login"
6. Settings → Basic → copy App ID và App Secret
7. Tools → Graph API Explorer → chọn app vừa tạo
8. Generate token như Cách 1

</details>

---

## 📋 Bước 2: Cấu hình Script

Mở file: `scripts/fetch-facebook-posts.js`

Tìm dòng:
```javascript
const CONFIG = {
  PAGE_ACCESS_TOKEN: 'PASTE_YOUR_ACCESS_TOKEN_HERE',
  PAGE_ID: 'ctech.edu.vn',
  LIMIT: 20
};
```

**Thay đổi**:
```javascript
const CONFIG = {
  PAGE_ACCESS_TOKEN: 'EAABsbCS1x...', // PASTE TOKEN VỪA COPY
  PAGE_ID: 'ctech.edu.vn',              // Giữ nguyên
  LIMIT: 20                              // Số posts muốn lấy
};
```

**Lưu file** (Ctrl + S)

---

## 📋 Bước 3: Chạy Script

Mở **Terminal** hoặc **Command Prompt** tại thư mục project:

```bash
cd "C:\Users\gau\Documents\Api Web"
node scripts/fetch-facebook-posts.js
```

### Kết quả mong đợi:

```
🚀 Bắt đầu lấy posts từ Facebook...

📡 Đang gọi Facebook Graph API...
✅ Đã lấy được 20 posts

✅ HOÀN THÀNH!

📁 File đã được lưu tại: C:\Users\gau\Documents\Api Web\src\frontend\data\events.json
📊 Tổng số posts: 20

🎉 Reload trang web để xem kết quả!
```

---

## 📋 Bước 4: Kiểm tra kết quả

1. **Mở file**: `src/frontend/data/events.json`
2. **Kiểm tra**: Có 20 posts với đầy đủ thông tin
3. **Reload trang web** (Ctrl + F5)
4. **Xem sự kiện** hiển thị trên trang!

---

## ⚠️ Xử lý lỗi

### Lỗi: "Invalid OAuth access token"

**Nguyên nhân**: Token hết hạn hoặc sai

**Giải pháp**:
1. Lấy token mới từ Graph API Explorer
2. Copy paste lại vào `CONFIG.PAGE_ACCESS_TOKEN`
3. Chạy lại script

### Lỗi: "Unsupported get request"

**Nguyên nhân**: Page ID sai hoặc không có quyền truy cập

**Giải pháp**:
1. Kiểm tra `PAGE_ID` có đúng không (thử `ctech.edu.vn` hoặc page numeric ID)
2. Đảm bảo tài khoản có quyền admin page CTECH

### Lỗi: "Access token belongs to a user"

**Nguyên nhân**: Dùng User Token thay vì Page Token

**Giải pháp**:
1. Vào Graph API Explorer
2. Chọn "Get Page Access Token" (không phải User Token)
3. Chọn page CTECH
4. Copy token mới

---

## 🔄 Cập nhật thường xuyên

**Để cập nhật posts mới**, chỉ cần:
```bash
node scripts/fetch-facebook-posts.js
```

Script sẽ:
- ✅ Lấy 20 posts mới nhất
- ✅ Cập nhật stats (likes, comments, shares)
- ✅ Tự động ghi đè file `events.json`

---

## 💡 Tips

### Tăng số lượng posts:
```javascript
LIMIT: 50  // Lấy 50 posts
```

### Lọc posts có ảnh:
Thêm vào script sau dòng `const events = posts.map...`:
```javascript
const events = posts
  .filter(post => post.full_picture || post.attachments) // Chỉ lấy posts có ảnh
  .map((post, index) => {
    // ... rest of code
  });
```

### Tự động chạy hàng ngày:
- **Windows**: Dùng Task Scheduler
- **Linux/Mac**: Dùng cron job

---

## 🆘 Cần trợ giúp?

### Test token có hoạt động không:

Truy cập URL này trong browser (thay YOUR_TOKEN):
```
https://graph.facebook.com/v18.0/me?access_token=YOUR_TOKEN
```

Nếu thấy thông tin user → Token hợp lệ ✅

### Debug chi tiết:

Thêm vào script (dòng 30):
```javascript
console.log('Token:', CONFIG.PAGE_ACCESS_TOKEN.substring(0, 20) + '...');
console.log('Page ID:', CONFIG.PAGE_ID);
```

---

**Chúc bạn thành công! 🎉**
