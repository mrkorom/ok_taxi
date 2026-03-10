-- drivers 테이블 수정
-- driver_number를 driver_code로 변경하고 4자리 숫자로
ALTER TABLE drivers 
CHANGE COLUMN driver_number driver_code VARCHAR(4) UNIQUE NOT NULL COMMENT '고유코드 (4자리 숫자)';

-- 기존 데이터의 driver_code 업데이트
UPDATE drivers 
SET driver_code = LPAD(id, 4, '0')
WHERE id <= 9000;

-- 불필요한 컬럼 제거 (운용방식 관련 - 별도 테이블로)
ALTER TABLE drivers DROP COLUMN IF EXISTS work_type;
ALTER TABLE drivers DROP COLUMN IF EXISTS work_start_date;

-- driver_work_history 테이블 생성
CREATE TABLE IF NOT EXISTS driver_work_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    driver_id INT NOT NULL COMMENT '기사 ID',
    work_start_date VARCHAR(6) NOT NULL COMMENT '운용시작일 (YYMMDD)',
    work_type ENUM('격일', '일차', '아르바이트') NOT NULL COMMENT '운용방식',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
    INDEX idx_driver_date (driver_id, work_start_date DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Admin 계정에 운용방식 추가
INSERT INTO driver_work_history (driver_id, work_start_date, work_type)
SELECT id, '260101', '일차'
FROM drivers 
WHERE role = 'admin' 
LIMIT 1
ON DUPLICATE KEY UPDATE work_type = work_type;
