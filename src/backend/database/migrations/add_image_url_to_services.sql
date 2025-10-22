-- Migration: Thêm trường image_url vào bảng services
-- Ngày tạo: 2025-01-21
-- Mục đích: Cho phép dịch vụ có hình ảnh minh họa (VD: đồ ăn ở căn tin)

ALTER TABLE services
ADD COLUMN image_url VARCHAR(255) COMMENT 'Đường dẫn hình ảnh dịch vụ' AFTER price;
