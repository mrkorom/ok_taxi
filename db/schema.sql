-- 택시 운용 관리 시스템 데이터베이스 스키마

-- 1. 기사 테이블
CREATE TABLE IF NOT EXISTS drivers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  driver_number VARCHAR(20) UNIQUE NOT NULL COMMENT '고유번호',
  name VARCHAR(50) NOT NULL COMMENT '기사 이름',
  phone VARCHAR(15) UNIQUE NOT NULL COMMENT '연락처 (로그인 ID)',
  password VARCHAR(255) NOT NULL COMMENT '비밀번호 (해시화)',
  photo_url VARCHAR(255) COMMENT '사진 URL',
  status ENUM('운행', '휴직', '퇴사') DEFAULT '운행' COMMENT '현재 운용 여부',
  work_type ENUM('격일', '일차', '아르바이트') NOT NULL COMMENT '운용 방식',
  start_date DATE NOT NULL COMMENT '운용 시작일',
  role ENUM('admin', 'manager', 'driver') DEFAULT 'driver' COMMENT '권한',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_phone (phone),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='기사 정보';

-- 2. 차량 테이블
CREATE TABLE IF NOT EXISTS vehicles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vehicle_number VARCHAR(20) UNIQUE NOT NULL COMMENT '차량번호 (경남20바1201)',
  vehicle_type VARCHAR(50) COMMENT '차량 종류',
  registration_date DATE NOT NULL COMMENT '등록일',
  status ENUM('운행가능', '정비중', '폐차') DEFAULT '운행가능' COMMENT '차량 상태',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vehicle_number (vehicle_number),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='차량 정보';

-- 3. 배차 테이블
CREATE TABLE IF NOT EXISTS assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  assignment_date DATE NOT NULL COMMENT '배차 날짜',
  driver_id INT NOT NULL COMMENT '기사 ID',
  vehicle_id INT NOT NULL COMMENT '차량 ID',
  shift ENUM('주간', '야간', '전일') DEFAULT '전일' COMMENT '근무 시간대',
  notes TEXT COMMENT '비고',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  UNIQUE KEY unique_assignment (assignment_date, driver_id),
  INDEX idx_date (assignment_date),
  INDEX idx_driver (driver_id),
  INDEX idx_vehicle (vehicle_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='배차 정보';

-- Admin 계정 초기 데이터 삽입
-- 비밀번호: 1234 (bcrypt 해시)
INSERT INTO drivers (driver_number, name, phone, password, status, work_type, start_date, role)
VALUES (
  'ADMIN001',
  '관리자',
  '01000000000',
  '$2a$10$YourHashedPasswordHere',  -- 실제로는 bcrypt로 해시된 값
  '운행',
  '일차',
  CURDATE(),
  'admin'
) ON DUPLICATE KEY UPDATE phone = phone;
