-- Migration: Tạo bảng vouchers
-- Ngày tạo: 2025-01-21
-- Mục đích: Cho phép admin tạo mã giảm giá cho dịch vụ hoặc category

CREATE TABLE IF NOT EXISTS vouchers (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  voucher_code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  discount_type ENUM('percentage', 'fixed') NOT NULL,
  discount_value DECIMAL(12, 2) NOT NULL,
  max_discount DECIMAL(12, 2),
  min_order_value DECIMAL(12, 2),
  applies_to ENUM('all', 'service', 'category') DEFAULT 'all',
  target_code VARCHAR(50),
  usage_limit INT DEFAULT NULL,
  used_count INT DEFAULT 0,
  valid_from DATETIME NOT NULL,
  valid_until DATETIME NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vouchers_code (voucher_code),
  INDEX idx_vouchers_applies (applies_to, target_code)
);
