# 🤖 Nâng cấp Chatbot Knowledge Base

## 📋 Tóm tắt thay đổi

Hệ thống chatbot đã được nâng cấp từ file `.txt` đơn giản sang **Markdown Knowledge Base** có cấu trúc thông minh hơn để AI hiểu tốt hơn.

## ✨ Các cải tiến chính

### 1. Chuyển đổi format: `.txt` → `.md`

**Trước đây:**
- File: `services.txt` - plain text không có cấu trúc rõ ràng
- Khó đọc, khó maintain

**Bây giờ:**
- File: `services.md` - Markdown với cấu trúc rõ ràng
- Có heading, table, emoji icon
- Dễ đọc cho cả người và AI

### 2. Tổ chức dữ liệu thông minh hơn

**Knowledge Base (`services.md`) giờ bao gồm:**

```
🤖 CTECH Chatbot Knowledge Base
│
├── 📚 Hướng dẫn & Thông tin chung
│   ├── bot_identity.md      → Giới thiệu bot, vai trò, phong cách
│   ├── response_rules.md    → Quy tắc trả lời & xử lý tình huống
│   └── school_info.md       → Học phí, KTX, tuyển sinh, phòng ban
│
└── 🛒 Danh sách dịch vụ (từ database)
    ├── ✅ Dịch vụ đang hoạt động
    └── ⛔ Dịch vụ ngừng cung cấp
```

### 3. Chia nhỏ thông tin theo topic

**Trước:**
- 2 file: `about_botchat.txt`, `dichvu.txt`
- Trộn lẫn nhiều loại thông tin

**Sau:**
- 3 file Markdown có cấu trúc:
  - `bot_identity.md` - Nhận dạng & nhiệm vụ bot
  - `response_rules.md` - Quy tắc & mẫu trả lời
  - `school_info.md` - Thông tin trường

### 4. Format dịch vụ tối ưu cho AI

**Trước:**
```
### DV001 - Vé Gửi Xe Oto theo tháng
Trạng thái: Hoạt động
Giá tham khảo: 300.000 VND
Cập nhật lần cuối: 2025-10-22T00:33:07.000Z
Mô tả:
gửi Oto tại trường không phát sinh phí ra vào trong tháng
---
```

**Sau:**
```markdown
### ✅ DV001 - Vé Gửi Xe Oto theo tháng

| Thông tin | Chi tiết |
|-----------|----------|
| **Trạng thái** | Hoạt động |
| **Giá** | 300.000 VND |
| **Cập nhật** | 22/10/2025 |

**Mô tả:**

gửi Oto tại trường không phát sinh phí ra vào trong tháng
```

### 5. Phân loại dịch vụ theo trạng thái

- **Dịch vụ hoạt động** và **dịch vụ ngừng** được tách riêng
- AI được hướng dẫn rõ: KHÔNG đề xuất dịch vụ ngừng
- Dễ quản lý và tra cứu hơn

## 📁 Cấu trúc mới

```
src/backend/
├── api/features/chatbot/
│   ├── data/                           # 📂 Dữ liệu tham chiếu
│   │   ├── bot_identity.md            # 🆕 Nhận dạng bot
│   │   ├── response_rules.md          # 🆕 Quy tắc trả lời
│   │   ├── school_info.md             # 🆕 Thông tin trường
│   │   ├── about_botchat.txt          # ⚠️ Có thể xóa
│   │   └── dichvu.txt                 # ⚠️ Có thể xóa
│   │
│   ├── services/
│   │   ├── dataBundle.js              # ✏️ Đã sửa: đọc .md
│   │   └── chatService.js
│   │
│   ├── services.md                     # 🆕 KNOWLEDGE BASE chính
│   ├── services.txt                    # ⚠️ File cũ - có thể xóa
│   └── README.md                       # 🆕 Hướng dẫn sử dụng
│
├── database/
│   └── serviceExporter.js              # ✏️ Đã sửa: export .md
│
└── generate-chatbot-knowledge.js       # 🆕 Script tạo knowledge base
```

## 🔄 Cách sử dụng

### Tự động (Khuyến nghị)

Knowledge base tự động cập nhật khi admin thêm/sửa/xóa dịch vụ trong Admin Dashboard.

### Thủ công

Chạy một trong các lệnh:

```bash
# Cách 1: npm script
npm run chatbot:generate

# Cách 2: node trực tiếp
node generate-chatbot-knowledge.js
```

Output:
```
🤖 Đang tạo knowledge base cho chatbot...

✅ Tạo thành công!

📄 File: .../chatbot/services.md
📊 Số dịch vụ: 7
📚 Files tham khảo:
   - bot_identity.md
   - response_rules.md
   - school_info.md
```

## 📝 Cách chỉnh sửa

### 1. Cập nhật thông tin chung

Sửa các file trong `data/`:
- `bot_identity.md` - Sửa lời chào, phong cách
- `response_rules.md` - Sửa quy tắc trả lời
- `school_info.md` - Cập nhật học phí, KTX...

Sau đó chạy:
```bash
npm run chatbot:generate
```

### 2. Cập nhật dịch vụ

Sử dụng Admin Dashboard tại `/admin`:
- Tự động cập nhật knowledge base

## ✅ Lợi ích

### Cho AI
- ✅ Hiểu context tốt hơn nhờ cấu trúc Markdown
- ✅ Dễ parse table, list, heading
- ✅ Phân biệt rõ các loại thông tin (dịch vụ hoạt động vs ngừng)
- ✅ Có ví dụ cụ thể về cách trả lời

### Cho Developer
- ✅ Dễ đọc và maintain
- ✅ Chia nhỏ theo topic, dễ tìm kiếm
- ✅ Version control tốt hơn (Git diff rõ ràng)
- ✅ Có documentation đầy đủ

### Cho Admin
- ✅ Không cần chạm vào code
- ✅ Chỉnh sửa qua file Markdown đơn giản
- ✅ Tự động sync khi cập nhật dịch vụ

## 🗑️ File có thể xóa

Các file cũ không còn dùng (sau khi kiểm tra kỹ):
- ❌ `services.txt` - đã thay bằng `services.md`
- ❌ `about_botchat.txt` - đã tách thành `bot_identity.md`
- ❌ `dichvu.txt` - đã tách thành `response_rules.md`

**⚠️ Lưu ý:** Backup trước khi xóa!

## 📚 Tài liệu

Xem thêm tại: `src/backend/api/features/chatbot/README.md`

## 🐛 Troubleshooting

### Knowledge base không cập nhật?
```bash
npm run chatbot:generate
```

### Chatbot trả lời sai?
1. Kiểm tra `services.md`
2. Kiểm tra `data/*.md`
3. Chạy lại generate script
4. Restart server để clear cache

---

**💡 Tip:** Chatbot sẽ thông minh hơn khi knowledge base được cập nhật thường xuyên và có cấu trúc tốt!
