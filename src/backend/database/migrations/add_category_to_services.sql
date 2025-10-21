-- Migration: Them truong category vao bang services
-- Chay file nay neu ban da co database cu va muon them tinh nang phan loai dich vu

-- Them cot category vao bang services
ALTER TABLE services
ADD COLUMN category VARCHAR(50) DEFAULT 'Khác' AFTER description;

-- Cap nhat mot so gia tri mau cho category (tuy chinh theo du lieu thuc te cua ban)
-- UPDATE services SET category = 'Học tập' WHERE service_code IN ('DV001', 'DV002');
-- UPDATE services SET category = 'Hành chính' WHERE service_code IN ('DV003', 'DV004');
-- UPDATE services SET category = 'Thư viện' WHERE service_code IN ('DV005');
-- UPDATE services SET category = 'Sinh hoạt' WHERE service_code IN ('DV006', 'DV007');

-- Kiem tra ket qua
SELECT service_code, name, category FROM services ORDER BY category, service_code;
