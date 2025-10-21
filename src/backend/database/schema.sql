-- ======================================================
-- 🧩 BẢNG TÀI KHOẢN CHUNG (cho sinh viên, giáo viên, admin)
-- ======================================================
CREATE TABLE IF NOT EXISTS user_accounts (
  user_id VARCHAR(20) PRIMARY KEY,         -- Mã người dùng (VD: SV001, GV001, AD001)
  password_sha CHAR(64) NOT NULL,          -- Mật khẩu được mã hóa SHA256
  role ENUM('student', 'teacher', 'admin') DEFAULT 'student', -- Vai trò: sinh viên / giáo viên / quản trị viên
  is_active TINYINT(1) DEFAULT 1,          -- 1 = tài khoản đang hoạt động, 0 = bị khóa
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Thời điểm tạo tài khoản
);

-- ======================================================
-- 🎓 BẢNG HỒ SƠ SINH VIÊN
-- ======================================================
CREATE TABLE IF NOT EXISTS students (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,    -- ID tự tăng
  user_id VARCHAR(20) NOT NULL,            -- Liên kết với bảng user_accounts (mã sinh viên)
  full_name VARCHAR(100) NOT NULL,         -- Họ và tên sinh viên
  gender ENUM('male', 'female', 'other') DEFAULT 'other', -- Giới tính
  birth_date DATE,                         -- Ngày sinh
  phone_number VARCHAR(20),                -- Số điện thoại
  email VARCHAR(120),                      -- Địa chỉ email
  class_code VARCHAR(20),                  -- Mã lớp
  department VARCHAR(100),                 -- Khoa đào tạo
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Ngày tạo hồ sơ
  FOREIGN KEY (user_id) REFERENCES user_accounts(user_id)
    ON DELETE CASCADE                      -- Xóa tài khoản → xóa luôn hồ sơ sinh viên
);

-- ======================================================
-- 👨‍🏫 BẢNG HỒ SƠ GIÁO VIÊN
-- ======================================================
CREATE TABLE IF NOT EXISTS teachers (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,    -- ID tự tăng
  user_id VARCHAR(20) NOT NULL,            -- Liên kết với user_accounts (mã giáo viên)
  full_name VARCHAR(100) NOT NULL,         -- Họ và tên giáo viên
  gender ENUM('male', 'female', 'other') DEFAULT 'other', -- Giới tính
  birth_date DATE,                         -- Ngày sinh
  phone_number VARCHAR(20),                -- Số điện thoại
  email VARCHAR(120),                      -- Địa chỉ email
  department VARCHAR(100),                 -- Khoa giảng dạy
  position VARCHAR(100),                   -- Chức vụ (VD: GV, ThS, TS, PGS, GS...)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Ngày tạo hồ sơ
  FOREIGN KEY (user_id) REFERENCES user_accounts(user_id)
    ON DELETE CASCADE                      -- Xóa tài khoản → xóa hồ sơ giáo viên
);

-- ======================================================
-- 🔐 BẢNG PHIÊN ĐĂNG NHẬP (SESSION TOKEN)
-- ======================================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,    -- ID tự tăng cho mỗi phiên
  user_id VARCHAR(20) NOT NULL,            -- Liên kết đến user_accounts
  token CHAR(64) NOT NULL UNIQUE,          -- Mã token duy nhất (để xác thực)
  issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Thời điểm cấp token
  expires_at DATETIME NOT NULL,            -- Thời điểm hết hạn token
  last_used_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Lần sử dụng gần nhất
  FOREIGN KEY (user_id) REFERENCES user_accounts(user_id)
    ON DELETE CASCADE                      -- Xóa tài khoản → xóa luôn session
);

-- ======================================================
-- 🏫 BẢNG DANH SÁCH DỊCH VỤ (dịch vụ mà trường cung cấp)
-- ======================================================
CREATE TABLE IF NOT EXISTS services (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,    -- ID dịch vụ
  service_code VARCHAR(10) NOT NULL UNIQUE,-- Mã dịch vụ (VD: DV001)
  name VARCHAR(120) NOT NULL,              -- Tên dịch vụ (VD: Đặt phòng học, Đăng ký học phần...)
  description TEXT,                        -- Mô tả chi tiết
  category VARCHAR(50) DEFAULT 'Khác',     -- Danh mục dịch vụ (VD: Học tập, Hành chính, Thư viện, Sinh hoạt, Khác)
  price DECIMAL(12, 2) NOT NULL DEFAULT 0, -- Giá (nếu có phí)
  is_active TINYINT(1) NOT NULL DEFAULT 1, -- 1 = đang hoạt động, 0 = ngừng
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Ngày tạo
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Tự cập nhật khi sửa
);

-- ======================================================
-- 💻 BẢNG QUẢN LÝ THIẾT BỊ SINH VIÊN (giới hạn đăng nhập)
-- ======================================================
CREATE TABLE IF NOT EXISTS student_device_registry (
  device_id VARCHAR(128) PRIMARY KEY,      -- Mã định danh thiết bị (hash hoặc UUID)
  current_user_id VARCHAR(20) NOT NULL,    -- Người dùng hiện tại đăng nhập trên thiết bị này
  last_login_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Lần đăng nhập gần nhất
  FOREIGN KEY (current_user_id) REFERENCES user_accounts(user_id)
    ON DELETE CASCADE                      -- Xóa tài khoản → xóa luôn thiết bị liên quan
);

-- ======================================================
-- 📜 BẢNG GHI NHẬT KÝ ĐĂNG NHẬP THIẾT BỊ SINH VIÊN
-- ======================================================
CREATE TABLE IF NOT EXISTS student_device_logins (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,    -- ID tự tăng
  user_id VARCHAR(20) NOT NULL,            -- Người dùng đăng nhập
  device_id VARCHAR(128) NOT NULL,         -- Mã thiết bị đăng nhập
  login_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Thời điểm đăng nhập
  FOREIGN KEY (user_id) REFERENCES user_accounts(user_id)
    ON DELETE CASCADE,                     -- Xóa tài khoản → xóa lịch sử đăng nhập
  INDEX idx_student_device_logins_device (device_id),  -- Tăng tốc tìm kiếm theo thiết bị
  UNIQUE KEY uq_student_device_logins_user_device (user_id, device_id) -- Mỗi người dùng chỉ lưu 1 bản ghi / thiết bị
);

-- ======================================================
-- 🧑‍💼 BẢNG HỒ SƠ QUẢN TRỊ VIÊN (ADMIN)
-- ======================================================
CREATE TABLE IF NOT EXISTS admin_profiles (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,    -- ID tự tăng
  user_id VARCHAR(20) NOT NULL,            -- Liên kết đến user_accounts
  full_name VARCHAR(100) NOT NULL,         -- Họ và tên quản trị viên
  email VARCHAR(120),                      -- Email liên hệ
  phone_number VARCHAR(20),                -- Số điện thoại
  department VARCHAR(100),                 -- Bộ phận làm việc
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Ngày tạo hồ sơ
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Tự cập nhật khi thay đổi
  FOREIGN KEY (user_id) REFERENCES user_accounts(user_id)
    ON DELETE CASCADE,                     -- Xóa tài khoản → xóa hồ sơ admin
  UNIQUE KEY uq_admin_profiles_user (user_id) -- Mỗi tài khoản admin chỉ có 1 hồ sơ duy nhất
);

-- ======================================================
-- 🛒 BẢNG ĐƠN HÀNG (ORDERS)
-- ======================================================
CREATE TABLE IF NOT EXISTS orders (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,           -- ID đơn hàng tự tăng
  order_code VARCHAR(20) NOT NULL UNIQUE,         -- Mã đơn hàng duy nhất (VD: ORD20250101001)
  user_id VARCHAR(20) NOT NULL,                   -- Người đặt hàng (sinh viên/giáo viên)
  service_code VARCHAR(10) NOT NULL,              -- Mã dịch vụ
  transaction_code VARCHAR(10) NOT NULL,          -- Mã giao dịch (mã chuyển khoản 6 ký tự)
  amount DECIMAL(12, 2) NOT NULL DEFAULT 0,       -- Số tiền thanh toán
  notes TEXT,                                     -- Ghi chú từ người dùng
  payment_status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending', -- Trạng thái thanh toán
  payment_method VARCHAR(50) DEFAULT 'bank_transfer', -- Phương thức thanh toán
  paid_at DATETIME,                               -- Thời điểm thanh toán thành công
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Thời điểm tạo đơn
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Tự cập nhật khi sửa
  FOREIGN KEY (user_id) REFERENCES user_accounts(user_id)
    ON DELETE CASCADE,                            -- Xóa tài khoản → xóa đơn hàng
  FOREIGN KEY (service_code) REFERENCES services(service_code)
    ON DELETE CASCADE,                            -- Xóa dịch vụ → xóa đơn hàng liên quan
  INDEX idx_orders_user (user_id),                -- Tăng tốc truy vấn theo user
  INDEX idx_orders_status (payment_status),       -- Tăng tốc truy vấn theo trạng thái
  INDEX idx_orders_transaction (transaction_code) -- Tăng tốc tìm kiếm theo mã giao dịch
);
