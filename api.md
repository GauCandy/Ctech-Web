# Tai lieu API

Tai lieu nay mo ta cac endpoint chinh cua he thong API sau khi toi gian hoa. Moi duong dan deu bat dau voi tien to `/api` tren server Express.

## 1. Bat dau nhanh

- **Base URL (mac dinh)**: `http://localhost:3000/api`
- **Dinh dang du lieu**: JSON (`Content-Type: application/json`)
- **Xac thuc**: Bearer token tra ve tu `/api/auth/login`
- **Moc thoi gian**: ISO-8601 (UTC)

### Quy trinh dang nhap lay token

1. Goi `POST /api/auth/login` voi thong tin dang nhap.
2. Doc token trong truong `token` cua phan hoi.
3. Gan header `Authorization: Bearer <token>` cho cac yeu cau can xac thuc.
4. Khi khong su dung nua, goi `POST /api/auth/logout` de thu hoi token.

Vi du request dang nhap:

```http
POST /api/auth/login HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "username": "SV001",
  "password": "matkhau123"
}
```

Phan hoi mau:

```json
{
  "token": "8c9c...",
  "expiresAt": "2025-10-05T13:00:00.000Z",
  "user": {
    "userId": "SV001",
    "role": "student",
    "displayName": "Nguyen Van A",
    "fullName": "Nguyen Van A",
    "email": "sv001@example.com",
    "phoneNumber": "0901234567",
    "department": "CNTT",
    "classCode": "CTK45"
  },
  "deviceId": "dev_f12a...",
  "deviceIdIssued": true
}
```

## 2. Nhom Auth (`/api/auth`)

| Endpoint | Mo ta | Ghi chu |
| --- | --- | --- |
| `POST /auth/login` | Dang nhap bang userId/email/so dien thoai + mat khau | Co kiem tra thiet bi voi sinh vien |
| `POST /auth/logout` | Xoa token hien tai | Can token trong header hoac `X-Admin-Token` |
| `POST /auth/change-password` | Doi mat khau tai khoan dang dang nhap | Body gom `currentPassword`, `newPassword` |
| `GET /auth/me` | Lay thong tin session va ho so nguoi dung tu token | Tra ve user summary va device dang gan |
| `POST /auth/register` | Sinh vien tu dang ky tai khoan moi | Khong can token |

### Vi du doi mat khau

```http
POST /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "matkhau123",
  "newPassword": "MatKhauMoi@2025"
}
```

### Vi du lay thong tin session hien tai

```http
GET /api/auth/me
Authorization: Bearer <token>
```

Phan hoi mau:

```json
{
  "token": "8c9c...",
  "expiresAt": "2025-10-05T13:01:30.000Z",
  "user": {
    "userId": "SV001",
    "role": "student",
    "displayName": "Nguyen Van A",
    "fullName": "Nguyen Van A",
    "email": "sv001@example.com",
    "phoneNumber": "0901234567",
    "department": "CNTT",
    "classCode": "CTK45"
  },
  "device": {
    "deviceId": "dev_f12a...",
    "lastLoginAt": "2025-10-05T12:55:00.000Z"
  }
}
```

## 3. Nhom Admin (`/api/admin`)

> Chi tai khoan co vai tro `admin` moi truy cap duoc cac endpoint nay.

| Endpoint | Mo ta | Body yeu cau |
| --- | --- | --- |
| `POST /admin/accounts` | Tao tai khoan moi (admin/teacher/student) | `{ role, student/teacher/admin }` tuy vai tro |
| `POST /admin/accounts/:userId/reset-password` | Dat lai mat khau cho tai khoan | `{ newPassword }` |
| `POST /admin/services` | Tao dich vu moi | `{ name, description?, price?, isActive? }` |
| `PUT /admin/services/:code` | Cap nhat dich vu | Cac truong hop le trong `{ name, description, price, is_active }` |
| `DELETE /admin/services/:code` | Xoa dich vu | Khong can body |

Vi du tao tai khoan sinh vien:

```http
POST /api/admin/accounts
Authorization: Bearer <token_admin>
Content-Type: application/json

{
  "role": "student",
  "student": {
    "fullName": "Nguyen Van A",
    "gender": "male",
    "birthDate": "2005-09-01",
    "email": "sinhvien@example.com",
    "classCode": "CTK45",
    "department": "CNTT"
  }
}
```

Phan hoi mau:

```json
{
  "message": "Tao tai khoan thanh cong.",
  "user": {
    "userId": "SV123",
    "role": "student"
  },
  "initialPassword": "8f3c1a..."
}
```

## 4. Nhom Dich vu (`/api/services`)

| Endpoint | Mo ta | Ghi chu |
| --- | --- | --- |
| `GET /services` | Liet ke dich vu | Ho tro query `q`, `active` |
| `GET /services/:code` | Lay chi tiet dich vu | Khong can xac thuc |
| `POST /services/:code/purchase` | Sinh ma thanh toan tam thoi | Can token cua sinh vien hoac giao vien |

```http
POST /api/services/DV001/purchase
Authorization: Bearer <token_student>
Content-Type: application/json

{
  "notes": "Mua phuc vu hoc tap"
}
```

Phan hoi mau:

```json
{
  "paymentCode": "DV001-1b3c...",
  "issuedAt": "2025-10-05T13:05:00.000Z",
  "service": {
    "serviceCode": "DV001",
    "name": "Sao ke hoc phi",
    "price": 50000,
    "isActive": true
  },
  "user": {
    "userId": "SV001",
    "role": "student"
  },
  "notes": "Mua phuc vu hoc tap"
}
```

## 5. Bien moi truong can thiet

| Bien | Mo ta |
| --- | --- |
| `OPENAI_API_KEY` | API key cho chatbot (uu tien). Co the dung `API_KEY` hoac `TOKEN` lam fallback |
| `SERVICES_EXPORT_PATH` | Duong dan file tong hop dich vu, mac dinh `./src/backend/api/features/chatbot/services.txt` |
| `ABOUT_BOTCHAT_PATH` | File mo ta BotChat, mac dinh `./src/backend/api/features/chatbot/data/about_botchat.txt` |
| `CHATBOT_DATA_DIR` | Thu muc chua cac file `.txt` lam ngu canh, mac dinh `./src/backend/api/features/chatbot/data` |
| `CHATBOT_SERVICES_PATH` | Duong dan file services.txt cho BotChat, mac dinh trung voi `SERVICES_EXPORT_PATH` |
| `CHATBOT_DATA_CACHE_MS` | Thoi gian cache du lieu BotChat (ms), mac dinh `30000` |
| `PORT` | Cong chay server Express |
| `ADMIN_USER`, `ADMIN_PASSWORD`, `ADMIN_DISPLAY_NAME` | Thong tin seed tai khoan admin |
| `SESSION_TIMEOUT` | Thoi han token (s), mac dinh `3600` |
| `APPLY_SCHEMA_ON_BOOT` | Dat `true` neu muon ung dung tu chay schema khi khoi dong |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Cau hinh ket noi MySQL |
| `DB_POOL_SIZE`, `DB_CONNECT_TIMEOUT`, `DB_SSL` | Tinh nang mo rong cho connection pool |

### Ghi chu ve file tong hop dich vu

- Khi khoi dong API, he thong tao/ghi lai file `src/backend/api/features/chatbot/services.txt` tu bang `services` lam ngu canh cho AI.
- Sau moi thao tac them/cap nhat/xoa dich vu, file duoc lam moi tu dong.
- Co the thay doi vi tri ghi bang bien moi truong `SERVICES_EXPORT_PATH`.
- BotChat tong hop noi dung tu tat ca cac file `.txt` trong thu muc `CHATBOT_DATA_DIR`.

## 6. Mau phan hoi loi

Tat ca loi tra ve JSON theo dang:

```json
{
  "error": "Thong bao loi cu the"
}
```

Mot so ma loi pho bien:

| Ma | Khi nao xay ra |
| --- | --- |
| `400` | Thieu du lieu bat buoc, dinh dang khong hop le |
| `401` | Token khong hop le hoac da het han |
| `403` | Khong du quyen truy cap |
| `404` | Khong tim thay tai nguyen |
| `409` | Xung dot du lieu |
| `500` | Loi noi bo he thong |

## 7. Tinh nang da loai bo

- Cac API diem danh bang QR da duoc loai khoi codebase; cac trang tester tuong ung khong con hieu luc.

## 8. Ghi chu trien khai

- Chay `node index.js` sau khi cau hinh `.env` va khoi tao database bang `setupdb.js`.
- Nen su dung HTTPS trong moi truong thuc de bao ve token.
- Khi doi mat khau, he thong tu dong huy cac session dang hoat dong cua nguoi dung.
