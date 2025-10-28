# 🤖 CTECH Chatbot System

Hệ thống chatbot tích hợp AI cho Trường Cao đẳng CTECH, sử dụng OpenAI API để trả lời các câu hỏi về dịch vụ và thông tin của trường.

## 📁 Cấu trúc thư mục

```
chatbot/
├── data/                          # Dữ liệu tham chiếu cho chatbot
│   ├── bot_identity.md           # Thông tin nhận dạng và vai trò của bot
│   ├── response_rules.md         # Quy tắc trả lời và xử lý tình huống
│   └── school_info.md            # Thông tin chung về trường (học phí, KTX, tuyển sinh...)
├── services/
│   ├── chatService.js            # Service xử lý gọi OpenAI API
│   └── dataBundle.js             # Service đọc knowledge base
├── controllers/
│   └── chatController.js         # Controller xử lý request từ client
├── router.js                      # Định nghĩa routes cho chatbot API
├── services.md                    # 🎯 KNOWLEDGE BASE - File chính cho AI
└── README.md                      # File này
```

## 🎯 Knowledge Base (`services.md`)

File `services.md` là **nguồn dữ liệu chính** cho chatbot, được tạo tự động từ:
1. **Database** - Danh sách dịch vụ từ bảng `services`
2. **Data files** - Các file `.md` và `.txt` trong thư mục `data/`

### Cấu trúc Knowledge Base

```markdown
# 🤖 CTECH Chatbot Knowledge Base
├── Metadata (ngày cập nhật, số lượng dịch vụ)
├── 📚 Hướng dẫn và Thông tin chung
│   ├── bot_identity - Giới thiệu bot, nhiệm vụ, phong cách
│   ├── response_rules - Quy tắc trả lời, xử lý tình huống
│   └── school_info - Học phí, KTX, tuyển sinh, phòng ban...
├── 🛒 Danh sách dịch vụ
│   ├── ✅ Dịch vụ đang hoạt động
│   └── ⛔ Dịch vụ ngừng cung cấp
└── 📞 Thông tin liên hệ
```

## 🔄 Cách cập nhật Knowledge Base

### 1. Tự động (Khuyến nghị)

Knowledge base được **tự động cập nhật** khi admin:
- ✅ Thêm dịch vụ mới
- ✅ Sửa thông tin dịch vụ
- ✅ Xóa dịch vụ

File `services.md` sẽ được tạo lại tự động.

### 2. Thủ công

Chạy script để tạo lại knowledge base:

```bash
# Tại thư mục gốc của project
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

## 📝 Cách thêm/sửa thông tin chatbot

### Cập nhật thông tin chung

Chỉnh sửa các file trong `data/`:

1. **bot_identity.md** - Sửa lời chào, nhiệm vụ, phong cách trả lời
2. **response_rules.md** - Sửa quy tắc xử lý câu hỏi
3. **school_info.md** - Cập nhật học phí, KTX, quy trình tuyển sinh...

Sau khi sửa, chạy:
```bash
node generate-chatbot-knowledge.js
```

### Cập nhật dịch vụ

Sử dụng **Admin Dashboard** tại `/admin`:
- Thêm/sửa/xóa dịch vụ qua giao diện
- Knowledge base tự động cập nhật

## 🔧 Environment Variables

```env
# OpenAI API
OPENAI_API_KEY=sk-...                    # Primary API key
OPENAI_API_KEY_2=sk-...                  # Backup API key (optional)
OPENAI_MODEL=gpt-4o-mini                 # Model to use

# Chatbot settings
CHATBOT_SYSTEM_PROMPT="You are..."       # System prompt (optional)
CHATBOT_DATA_CACHE_MS=30000             # Cache time for knowledge base (ms)
CHATBOT_SERVICES_PATH=...                # Custom path to services.md (optional)
CHATBOT_DATA_DIR=...                     # Custom data directory (optional)
```

## 🚀 API Endpoints

### POST `/api/chatbot/chat`

Gửi tin nhắn tới chatbot.

**Request:**
```json
{
  "message": "Học phí 1 kỳ bao nhiêu?",
  "history": [
    {"role": "user", "content": "Xin chào"},
    {"role": "assistant", "content": "Xin chào bạn, mình là BotChat Support..."}
  ]
}
```

**Response:**
```json
{
  "message": {
    "role": "assistant",
    "content": "Học phí 1 kỳ tại CTECH là 10-12 triệu VND..."
  },
  "model": "gpt-4o-mini"
}
```

## 💡 Best Practices

### 1. Cấu trúc dữ liệu trong `data/`

✅ **NÊN:**
- Sử dụng Markdown format (.md)
- Chia nhỏ thông tin theo topic (identity, rules, info...)
- Dùng heading, table, list để cấu trúc rõ ràng
- Thêm icon emoji để dễ phân biệt

❌ **KHÔNG NÊN:**
- Lưu dữ liệu dạng plain text không cấu trúc
- Trộn lẫn nhiều topic trong 1 file
- Quá dài (nên tách thành nhiều file nhỏ)

### 2. Viết nội dung cho AI

✅ **NÊN:**
- Rõ ràng, cụ thể, dễ hiểu
- Đưa ra ví dụ cụ thể
- Nêu rõ quy tắc DO/DON'T

❌ **KHÔNG NÊN:**
- Mơ hồ, chung chung
- Chỉ liệt kê không giải thích
- Thiếu context

### 3. Testing

Sau khi cập nhật knowledge base:
1. ✅ Test với câu hỏi cơ bản
2. ✅ Test với edge cases
3. ✅ Kiểm tra tone & style
4. ✅ Xác nhận thông tin chính xác

## 🐛 Troubleshooting

### Knowledge base không cập nhật

```bash
# Tạo lại knowledge base thủ công
node generate-chatbot-knowledge.js

# Kiểm tra file đã được tạo
ls -la src/backend/api/features/chatbot/services.md
```

### Chatbot trả lời sai thông tin

1. Kiểm tra `services.md` có đúng thông tin không
2. Kiểm tra `data/*.md` có cần cập nhật không
3. Chạy lại script generate
4. Clear cache nếu cần (restart server)

### Lỗi OpenAI API

```
Error: OpenAI API key is not configured
```

→ Kiểm tra `.env` có `OPENAI_API_KEY`

```
Error: Rate limit exceeded
```

→ Thêm `OPENAI_API_KEY_2` để backup

## 📚 Tài liệu liên quan

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Markdown Guide](https://www.markdownguide.org/)
- [CTECH Admin Dashboard](../admin/)

---

💡 **Tip:** Chatbot sẽ trả lời tốt hơn khi knowledge base được cập nhật thường xuyên và có cấu trúc rõ ràng!
