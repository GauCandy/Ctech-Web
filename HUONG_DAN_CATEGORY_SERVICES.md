# Hướng Dẫn Sử Dụng Tính Năng Phân Loại Dịch Vụ

## Tổng Quan

Tính năng phân loại dịch vụ cho phép nhóm các dịch vụ theo danh mục (category), giúp người dùng dễ dàng tìm kiếm và quản lý dịch vụ.

## API Endpoints

### 1. Lấy Danh Sách Categories

**Endpoint:** `GET /api/services/categories`

**Mô tả:** Trả về danh sách tất cả các danh mục dịch vụ đang có.

**Response:**
```json
{
  "categories": ["Học tập", "Hành chính", "Thư viện", "Sinh hoạt", "Khác"]
}
```

### 2. Lấy Danh Sách Dịch Vụ (có filter theo category)

**Endpoint:** `GET /api/services`

**Query Parameters:**
- `q` (string, optional): Tìm kiếm theo từ khóa
- `active` (boolean, optional): Lọc theo trạng thái hoạt động (true/false)
- `category` (string, optional): **MỚI** - Lọc theo danh mục

**Ví dụ:**
```
GET /api/services?category=Học tập
GET /api/services?category=Hành chính&active=true
GET /api/services?q=đăng ký&category=Học tập
```

**Response:**
```json
{
  "services": [
    {
      "serviceCode": "DV001",
      "name": "Đăng ký học phần",
      "description": "Dịch vụ đăng ký học phần trực tuyến",
      "category": "Học tập",
      "price": 0,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## Cập Nhật Database

### Nếu Bạn Có Database Mới (chưa có dữ liệu)

Chỉ cần chạy file schema.sql như bình thường:

```bash
mysql -u root -p your_database < src/backend/database/schema.sql
```

### Nếu Bạn Có Database Cũ (đã có dữ liệu services)

Chạy file migration để thêm cột category:

```bash
mysql -u root -p your_database < src/backend/database/migrations/add_category_to_services.sql
```

## Cập Nhật Dữ Liệu Mẫu

Sau khi chạy migration, bạn cần cập nhật category cho các dịch vụ hiện có:

```sql
-- Ví dụ phân loại dịch vụ
UPDATE services SET category = 'Học tập' WHERE service_code IN ('DV001', 'DV002', 'DV003');
UPDATE services SET category = 'Hành chính' WHERE service_code IN ('DV004', 'DV005');
UPDATE services SET category = 'Thư viện' WHERE service_code IN ('DV006');
UPDATE services SET category = 'Sinh hoạt' WHERE service_code IN ('DV007', 'DV008');
```

## Các Danh Mục Gợi Ý

- **Học tập**: Đăng ký học phần, xem điểm, lịch thi, ...
- **Hành chính**: Xin giấy xác nhận, đơn từ, ...
- **Thư viện**: Mượn/trả sách, gia hạn, ...
- **Sinh hoạt**: Đăng ký ký túc xá, hoạt động ngoại khóa, ...
- **Tài chính**: Học phí, học bổng, ...
- **Khác**: Các dịch vụ không thuộc nhóm nào

## Sử Dụng Trong Frontend

### 1. Lấy danh sách categories để hiển thị menu

```javascript
fetch('/api/services/categories')
  .then(res => res.json())
  .then(data => {
    console.log('Categories:', data.categories);
    // Hiển thị menu phân loại
  });
```

### 2. Lọc dịch vụ theo category

```javascript
function loadServicesByCategory(category) {
  fetch(`/api/services?category=${encodeURIComponent(category)}`)
    .then(res => res.json())
    .then(data => {
      console.log('Services:', data.services);
      // Hiển thị danh sách dịch vụ
    });
}
```

### 3. Hiển thị tất cả dịch vụ theo từng nhóm

```javascript
async function loadServicesGrouped() {
  // Lấy danh sách categories
  const categoriesRes = await fetch('/api/services/categories');
  const { categories } = await categoriesRes.json();

  // Lấy dịch vụ cho từng category
  for (const category of categories) {
    const servicesRes = await fetch(`/api/services?category=${encodeURIComponent(category)}`);
    const { services } = await servicesRes.json();

    // Hiển thị nhóm category và các dịch vụ
    console.log(`\n=== ${category} ===`);
    services.forEach(s => console.log(`- ${s.name}`));
  }
}
```

## Testing

### Test endpoint categories

```bash
curl http://localhost:3000/api/services/categories
```

### Test filter theo category

```bash
curl "http://localhost:3000/api/services?category=Học%20tập"
```

### Test kết hợp nhiều filter

```bash
curl "http://localhost:3000/api/services?category=Học%20tập&active=true&q=đăng%20ký"
```

## Lưu Ý

1. **Thứ tự route quan trọng**: Endpoint `/api/services/categories` phải đặt TRƯỚC `/api/services/:code` trong router để tránh nhầm lẫn.

2. **Giá trị mặc định**: Nếu không chỉ định category khi tạo dịch vụ mới, giá trị mặc định là "Khác".

3. **Sắp xếp**: Danh sách dịch vụ hiện được sắp xếp theo category trước, sau đó đến service_code.

4. **Case-sensitive**: Category là case-sensitive, hãy đảm bảo viết đúng chính tả khi filter.
