# Hướng dẫn đặt ảnh cho 5C Cards

## Cấu trúc thư mục

Mỗi card 5C có một thư mục riêng để chứa hình ảnh minh họa:

```
5C/
├── 1/  (Chất lượng giảng dạy)
├── 2/  (Cơ sở vật chất hiện đại)
├── 3/  (Chương trình thực tiễn)
├── 4/  (Doanh nghiệp hợp tác)
└── 5/  (Hội nhập quốc tế)
```

## Hướng dẫn

1. **Đặt ảnh vào đúng thư mục**:
   - Thư mục `1/`: Hình ảnh về giảng viên, lớp học
   - Thư mục `2/`: Hình ảnh về cơ sở vật chất, phòng lab
   - Thư mục `3/`: Hình ảnh về thực hành, dự án
   - Thư mục `4/`: Hình ảnh về doanh nghiệp, thực tập
   - Thư mục `5/`: Hình ảnh về hợp tác quốc tế

2. **Định dạng file**:
   - **Hỗ trợ tất cả định dạng**: JPG, JPEG, PNG, WebP, GIF
   - Tên file: bất kỳ (ví dụ: `1.jpg`, `giang-vien.png`, `lab.webp`)
   - **Tự động sắp xếp**: Ảnh được sắp xếp theo số trong tên file

3. **Số lượng ảnh**:
   - **Không giới hạn**: Quăng bao nhiêu ảnh cũng được!
   - Layout tự động thay đổi dựa vào số lượng:
     - **1 ảnh**: Hiển thị full width
     - **2 ảnh**: 2 cột cạnh nhau (có thể cắt xén trái phải)
     - **3 ảnh**: 1 ảnh lớn + 2 ảnh nhỏ chồng lên nhau
     - **4 ảnh**: Grid 2x2
     - **5+ ảnh**: Grid 2x2, ảnh cuối hiển thị "+X" (số ảnh còn lại)

4. **Kích thước ảnh đề xuất**:
   - Width: 800-1200px
   - Dung lượng: < 500KB mỗi ảnh (để load nhanh)
   - Aspect ratio: Linh hoạt (layout tự điều chỉnh)

## Ví dụ

```
5C/1/
├── giang-vien-1.jpg
├── giang-vien-2.png
├── lop-hoc.webp
└── thuc-hanh.jpg

5C/2/
├── phong-lab.jpg
└── trang-thiet-bi.png

5C/3/
├── 1.jpg
├── 2.jpg
├── 3.jpg
├── 4.jpg
└── 5.jpg  (→ Sẽ hiển thị "+2" trên ảnh thứ 4)
```

## Lưu ý

- ✅ Quăng file ảnh định dạng nào vào cũng được
- ✅ Không cần đặt tên file theo quy tắc cứng nhắc
- ✅ Số lượng ảnh tùy ý, layout tự động điều chỉnh
- ✅ Ảnh được tải tự động qua API, không cần cấu hình
- ✅ Ảnh nào không load được sẽ tự động bị ẩn
