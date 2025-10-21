# HƯỚNG DẪN THÊM SỰ KIỆN MANUAL (KHÔNG CẦN TOKEN)

## 🎯 Dành cho người KHÔNG có quyền admin page Facebook

---

## ✅ Code đã sẵn sàng!

- ✅ HTML đã có ở `main.html`
- ✅ CSS đã có ở `main.css`
- ✅ JavaScript đã hoạt động
- ✅ Lightbox xem ảnh đã có
- ✅ Layout đẹp, responsive

**Chỉ cần cập nhật file JSON!**

---

## 🚀 Cách NHANH NHẤT (5 phút/post)

### Bước 1: Mở post Facebook
https://www.facebook.com/ctech.edu.vn

### Bước 2: Lấy thông tin

#### A. Lấy URL ảnh:
1. **Click vào ảnh** để xem full size
2. **Chuột phải → Copy image address**
3. Paste vào notepad tạm

Làm tương tự cho **tất cả ảnh** trong post (nếu có nhiều ảnh)

#### B. Copy text:
- **Copy tiêu đề** (dòng đầu tiên của post)
- **Copy toàn bộ nội dung** (Ctrl+A → Ctrl+C)

#### C. Xem stats:
- Đếm số **likes** (👍)
- Đếm số **comments** (💬)
- Đếm số **shares** (↗️)

#### D. Copy link post:
- Click vào **ngày đăng** (ví dụ: "3 giờ trước")
- Copy URL từ address bar

---

### Bước 3: Tạo JSON object

Mở file: `src/frontend/data/events.json`

**Thêm vào đầu array** (sau dấu `[`):

```json
{
  "id": 3,
  "title": "PASTE TIÊU ĐỀ VÀO ĐÂY",
  "content": "PASTE TOÀN BỘ NỘI DUNG VÀO ĐÂY",
  "date": "2025-10-20",
  "images": [
    "PASTE_URL_ẢNH_1",
    "PASTE_URL_ẢNH_2",
    "PASTE_URL_ẢNH_3"
  ],
  "stats": {
    "likes": 42,
    "comments": 8,
    "shares": 3
  },
  "link": "PASTE_LINK_POST_FACEBOOK"
},
```

**Nhớ thêm dấu phẩy `,` ở cuối!**

---

### Bước 4: Sửa text cho đúng format

**⚠️ QUAN TRỌNG:**

Trong phần `content`, thay **TẤT CẢ** dấu ngoặc kép `"` bằng dấu ngoặc đơn `'`

**Sai:**
```json
"content": "Giải "Sản phẩm được yêu thích nhất""
```

**Đúng:**
```json
"content": "Giải 'Sản phẩm được yêu thích nhất'"
```

---

### Bước 5: Lưu & Test

1. **Lưu file** (Ctrl + S)
2. **Reload trang** (Ctrl + F5)
3. ✅ Xem post mới hiển thị!

---

## 📋 TEMPLATE MẪU

Copy template này, điền thông tin vào:

```json
{
  "id": X,
  "title": "",
  "content": "",
  "date": "2025-MM-DD",
  "images": [],
  "stats": {
    "likes": 0,
    "comments": 0,
    "shares": 0
  },
  "link": ""
}
```

---

## 💡 TIPS NHANH

### Tip 1: Tìm URL ảnh nhanh
- URL ảnh Facebook dạng: `https://scontent.fhan2-5.fna.fbcdn.net/...`
- Nếu không copy được → Tải ảnh về folder `img/events/` và dùng `/img/events/ten-anh.jpg`

### Tip 2: Format date
- Format: `YYYY-MM-DD`
- Ví dụ: `2025-10-20` (20/10/2025)
- Lấy từ ngày đăng trên Facebook

### Tip 3: Thêm nhiều posts
Thêm nhiều objects, cách nhau bởi dấu phẩy:

```json
[
  { "id": 1, ... },
  { "id": 2, ... },
  { "id": 3, ... }
]
```

### Tip 4: Kiểm tra JSON hợp lệ
Paste code vào: https://jsonlint.com/
Click "Validate JSON" để check lỗi

---

## 🔥 LÀM NHANH 20 POSTS

**Quy trình tối ưu:**

1. **Mở 2 tab:**
   - Tab 1: Facebook page CTECH
   - Tab 2: Notepad++ hoặc VS Code với `events.json`

2. **Với mỗi post (làm lần lượt):**
   - Copy title → paste vào template
   - Copy content → paste vào template (thay `"` → `'`)
   - Click ảnh → Copy image address → paste
   - Xem stats → ghi số
   - Copy link → paste
   - Thêm dấu phẩy `,` ở cuối

3. **Sau mỗi 5 posts:**
   - Lưu file
   - Reload trang để check
   - Tiếp tục

---

## ⚠️ LỖI THƯỜNG GẶP

### Lỗi: "Expected ,"
→ Thiếu dấu phẩy giữa các objects

### Lỗi: "Unexpected token"
→ Có dấu `"` trong content → đổi thành `'`

### Lỗi: Ảnh không hiển thị
→ URL ảnh sai hoặc Facebook block → tải ảnh về local

### Lỗi: JSON không load
→ Check syntax tại jsonlint.com

---

## 📊 VÍ DỤ THỰC TẾ

```json
[
  {
    "id": 1,
    "title": "HỘI GIẢNG & HỘI THI KỸ NĂNG NGHỀ CẤP TRƯỜNG 2025",
    "content": "🗞️ HỘI GIẢNG NHÀ GIÁO VÀ HỘI THI KỸ NĂNG NGHỀ CẤP TRƯỜNG NĂM 2025 📃\n\nTiếp nối thành công của những mùa thi hàng năm, Trường Cao đẳng Kỹ thuật – Công nghệ Bách Khoa (CTECH) long trọng tổ chức Hội giảng Nhà giáo GDNN và Hội thi Kỹ năng nghề cấp trường năm học 2025-2026.",
    "date": "2025-10-22",
    "images": [
      "https://scontent.fhan2-5.fna.fbcdn.net/v/t39.30808-6/470182915_122157557336194726_8251234567890123456_n.jpg"
    ],
    "stats": {
      "likes": 18,
      "comments": 6,
      "shares": 1
    },
    "link": "https://www.facebook.com/ctech.edu.vn/posts/pfbid026pfw6BjECApnJJnp6uPacLaTt5ZbfRuajbT7tFLgzKbxdmWFqSx6M5fQ57V3FqKRl"
  },
  {
    "id": 2,
    "title": "SINH VIÊN CTECH KHẲNG ĐỊNH TÀI NĂNG",
    "content": "🌿 SINH VIÊN CTECH KHẲNG ĐỊNH TÀI NĂNG – LAN TỎA CẢM HỨNG XANH 💚\n\nNhóm C-green – Đại diện sinh viên Trường Cao đẳng Kỹ thuật – Công nghệ Bách Khoa (CTECH) – đã xuất sắc đạt Giải 'Sản phẩm được yêu thích nhất' và Giải Nhì tại cuộc thi 'Inspire Change – Fight AMR & Microplastic Pollution'",
    "date": "2025-10-18",
    "images": [
      "https://scontent.fhan2-5.fna.fbcdn.net/v/t39.30808-6/image1.jpg",
      "https://scontent.fhan2-5.fna.fbcdn.net/v/t39.30808-6/image2.jpg",
      "https://scontent.fhan2-5.fna.fbcdn.net/v/t39.30808-6/image3.jpg"
    ],
    "stats": {
      "likes": 36,
      "comments": 6,
      "shares": 1
    },
    "link": "https://www.facebook.com/ctech.edu.vn/posts/pfbid05Yr4MAneD7s4moG9RFghfhgyEytYdWNhQVnw4CBo63PVBWd8keBTc3hwMfdhd6XJl"
  }
]
```

---

## ⏱️ THỜI GIAN

- **1 post đơn giản (1 ảnh):** 3-5 phút
- **1 post phức tạp (nhiều ảnh):** 5-10 phút
- **20 posts:** ~2 giờ (nếu làm liên tục)

---

## ✅ CHECKLIST

Trước khi lưu file, check:

- [ ] Tất cả dấu `"` trong content đã đổi thành `'`
- [ ] Mỗi object có dấu phẩy `,` ở cuối (trừ object cuối cùng)
- [ ] Date format đúng `YYYY-MM-DD`
- [ ] URL ảnh bắt đầu bằng `https://`
- [ ] Link Facebook đúng

---

**Chúc bạn làm nhanh! 🚀**

Cần trợ giúp thêm, cứ hỏi nhé!
