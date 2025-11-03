-- ======================================================
-- 📅 BẢNG LỊCH HỌC CHIA SẺ (SHARED SCHEDULES)
-- ======================================================
-- Bảng này lưu trữ thời khóa biểu được chia sẻ giữa người dùng
-- Mỗi bản ghi đại diện cho một TKB đã được upload và chia sẻ

CREATE TABLE IF NOT EXISTS shared_schedules (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,           -- ID tự tăng
  share_id VARCHAR(12) NOT NULL UNIQUE,           -- Mã chia sẻ ngẫu nhiên (VD: abc123xyz)
  schedule_data JSON NOT NULL,                    -- Dữ liệu TKB đầy đủ (JSON format)
  file_name VARCHAR(255),                         -- Tên file PDF gốc
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Thời điểm tạo
  expires_at DATETIME,                            -- Thời điểm hết hạn (NULL = không hết hạn)
  view_count INT DEFAULT 0,                       -- Số lần được xem
  last_viewed_at DATETIME,                        -- Lần xem gần nhất
  INDEX idx_shared_schedules_share_id (share_id), -- Tăng tốc tìm kiếm theo share_id
  INDEX idx_shared_schedules_created (created_at) -- Tăng tốc xóa các bản ghi cũ
);
