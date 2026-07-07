import pool from './db';
import bcrypt from 'bcryptjs';

export async function initializeDatabase() {
  const connection = await pool.getConnection();

  try {
    console.log('🔄 데이터베이스 스키마 초기화 중...');

    // 외래 키 검사 일시 비활성화
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    console.log('\n🗑️ 기존 테이블 삭제 중...');
    await connection.query('DROP TABLE IF EXISTS daily_notices');
    await connection.query('DROP TABLE IF EXISTS daily_vehicle_statuses');
    await connection.query('DROP TABLE IF EXISTS assignments');
    await connection.query('DROP TABLE IF EXISTS vehicles');
    await connection.query('DROP TABLE IF EXISTS drivers');

    console.log('✅ 기존 테이블 삭제 완료');

    // 1. drivers 테이블 생성
    await connection.query(`
      CREATE TABLE IF NOT EXISTS drivers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        driver_code VARCHAR(4) UNIQUE NOT NULL COMMENT '고유코드 (4자리 숫자)',
        name VARCHAR(50) NOT NULL COMMENT '기사 이름',
        phone VARCHAR(15) UNIQUE NOT NULL COMMENT '연락처',
        password VARCHAR(255) NOT NULL COMMENT '비밀번호',
        photo_url VARCHAR(255) COMMENT '사진 URL',
        status ENUM('운행', '휴직', '퇴사') DEFAULT '운행',
        work_type ENUM('일차', '격일A', '격일B') DEFAULT NULL COMMENT '운용방식',
        start_date DATE NOT NULL COMMENT '운용 시작일',
        role ENUM('admin', 'manager', 'driver') DEFAULT 'driver',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_phone (phone),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ drivers 테이블 생성 완료');

    // 2. vehicles 테이블 생성
    await connection.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        vehicle_number VARCHAR(20) UNIQUE NOT NULL,
        vehicle_type VARCHAR(50),
        fuel_type ENUM('LPG', '전기', '가솔린', '디젤') DEFAULT 'LPG' COMMENT '차량 연료',
        car_model VARCHAR(50) DEFAULT '' COMMENT '차종/모델 (예: 쏘나타, K5)',
        model_year VARCHAR(10) DEFAULT '' COMMENT '연식 (예: 2023)',
        status ENUM('운행가능', '정비중', '폐차', '말소') DEFAULT '운행가능',
        registration_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_vehicle_number (vehicle_number),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ vehicles 테이블 생성 완료');

    // 3. assignments 테이블 생성
    await connection.query(`
      CREATE TABLE IF NOT EXISTS assignments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        assignment_date DATE NOT NULL,
        driver_id INT NOT NULL,
        vehicle_id INT NOT NULL,
        shift ENUM('주간', '야간', '전일') DEFAULT '전일',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
        UNIQUE KEY unique_assignment (assignment_date, driver_id),
        INDEX idx_date (assignment_date),
        INDEX idx_driver (driver_id),
        INDEX idx_vehicle (vehicle_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ assignments 테이블 생성 완료');

    // 4. daily_vehicle_statuses 테이블 생성
    await connection.query(`
      CREATE TABLE IF NOT EXISTS daily_vehicle_statuses (
        id INT PRIMARY KEY AUTO_INCREMENT,
        status_date DATE NOT NULL,
        vehicle_id INT NOT NULL,
        status ENUM('정상', '점검', '부제', '대기') DEFAULT '정상',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_status (status_date, vehicle_id),
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ daily_vehicle_statuses 테이블 생성 완료');

    // 5. daily_notices 테이블 생성
    await connection.query(`
      CREATE TABLE IF NOT EXISTS daily_notices (
        id INT PRIMARY KEY AUTO_INCREMENT,
        notice_date DATE NOT NULL UNIQUE COMMENT '공지 날짜',
        content TEXT COMMENT '공지 내용',
        is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
        created_by INT COMMENT '작성자 (drivers.id)',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES drivers(id) ON DELETE SET NULL,
        INDEX idx_notice_date (notice_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ daily_notices 테이블 생성 완료');

    // 6. Admin 계정 생성 (중복 체크)
    const hashedPassword = await bcrypt.hash('1234', 10);
    const [existingAdmin] = await connection.query(
      'SELECT id FROM drivers WHERE phone = ?',
      ['01000000000']
    );

    if ((existingAdmin as any[]).length === 0) {
      await connection.query(
        `INSERT INTO drivers (driver_code, name, phone, password, status, work_type, start_date, role)
         VALUES (?, ?, ?, ?, ?, ?, CURDATE(), ?)`,
        ['0001', '관리자', '01000000000', hashedPassword, '운행', '일차', 'admin']
      );
      console.log('✅ Admin 계정 생성 완료 (📱 01000000000 / 🔐 1234)');
    }

    // 7. 더미 기사 데이터 생성 (65명)
    const workTypes = ['일차', '격일A', '격일B'];
    const statuses = ['운행', '운행', '운행', '휴직'];
    const lastNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '홍'];
    const firstNames = ['민수', '서준', '지훈', '현우', '준호', '도윤', '시우', '하준', '주원', '지안',
        '수빈', '예준', '승우', '민준', '건우', '유준', '연우', '정우', '승현', '동현',
        '준서', '은우', '태양', '시윤', '지후', '승민', '우진', '시후', '재윤', '태현',
        '지환', '민호', '재현', '우빈', '성민', '준혁', '민재', '태윤', '윤서', '서진',
        '민지', '서윤', '지우', '하윤', '서현', '수아', '지유', '서영', '채원', '예은',
        '지민', '다은', '수현', '은서', '가은', '소율', '채은', '윤아', '나은', '수진',
        '혜진', '영희', '순자', '미숙', '경숙'];

    for (let i = 1; i <= 65; i++) {
      const driverCode = `9${String(i).padStart(3, '0')}`;
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const name = `${lastName}${firstName}`;
      const phone = `010${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const workType = workTypes[Math.floor(Math.random() * workTypes.length)];
      const year = 24 + Math.floor(Math.random() * 2);
      const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
      const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
      const dbStartDate = `20${year}-${month}-${day}`;

      await connection.query(
        `INSERT INTO drivers (driver_code, name, phone, password, status, role, start_date, work_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [driverCode, name, phone, hashedPassword, status, 'driver', dbStartDate, workType]
      );
    }
    console.log('✅ 65명의 더미 기사 데이터 생성 완료');

    // 8. 더미 차량 데이터 생성 (46대)
    const vehicleStatuses = ['운행가능', '운행가능', '운행가능', '운행가능', '정비중'];
    const fuelTypes = ['LPG', 'LPG', 'LPG', '전기', '가솔린'];
    const carModels = ['쏘나타', 'K5', '그랜저', '아이오닉5', 'EV6'];

    for (let i = 1200; i <= 1245; i++) {
      const vehicleNumber = `경남20바${i}`;
      const vehicleType = Math.random() > 0.5 ? '중형' : '대형';
      const fuelType = fuelTypes[Math.floor(Math.random() * fuelTypes.length)];
      const status = vehicleStatuses[Math.floor(Math.random() * vehicleStatuses.length)];
      const carModel = carModels[Math.floor(Math.random() * carModels.length)];
      const modelYear = String(2020 + Math.floor(Math.random() * 5));
      const date = new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      const registrationDate = date.toISOString().split('T')[0];

      await connection.query(
        `INSERT INTO vehicles (vehicle_number, vehicle_type, fuel_type, car_model, model_year, status, registration_date)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [vehicleNumber, vehicleType, fuelType, carModel, modelYear, status, registrationDate]
      );
    }
    console.log('✅ 46대의 더미 차량 데이터 생성 완료');

    // 외래 키 검사 다시 활성화
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n🎉 데이터베이스 초기화 및 샘플 데이터 복구 완료!');
    return true;
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error);
    throw error;
  } finally {
    connection.release();
  }
}
