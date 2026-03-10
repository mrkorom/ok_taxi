import pool from './db';
import bcrypt from 'bcryptjs';

export async function initializeDatabase() {
  const connection = await pool.getConnection();

  try {
    console.log('🔄 데이터베이스 스키마 초기화 중...');

    // 기존 테이블 구조 확인
    console.log('\n📊 기존 테이블 확인 중...');

    // 1. drivers 테이블 확인 및 생성/변경
    try {
      const [tables] = await connection.query(
        "SHOW TABLES LIKE 'drivers'"
      );

      if ((tables as any[]).length > 0) {
        console.log('⚠️  drivers 테이블이 이미 존재합니다. 테이블을 삭제하고 재생성합니다.');
        await connection.query('DROP TABLE IF EXISTS assignments');
        await connection.query('DROP TABLE IF EXISTS drivers');
      }
    } catch (error) {
      console.log('drivers 테이블 확인 중 오류 (무시하고 계속):', error);
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS drivers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        driver_number VARCHAR(20) UNIQUE NOT NULL COMMENT '고유번호',
        name VARCHAR(50) NOT NULL COMMENT '기사 이름',
        phone VARCHAR(15) UNIQUE NOT NULL COMMENT '연락처',
        password VARCHAR(255) NOT NULL COMMENT '비밀번호',
        photo_url VARCHAR(255) COMMENT '사진 URL',
        status ENUM('운행', '휴직', '퇴사') DEFAULT '운행',
        work_type ENUM('격일', '일차', '아르바이트') NOT NULL,
        start_date DATE NOT NULL COMMENT '운용 시작일',
        role ENUM('admin', 'manager', 'driver') DEFAULT 'driver',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_phone (phone),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ drivers 테이블 생성 완료');

    // 2. vehicles 테이블 확인 및 생성
    try {
      const [tables] = await connection.query(
        "SHOW TABLES LIKE 'vehicles'"
      );

      if ((tables as any[]).length > 0) {
        console.log('⚠️  vehicles 테이블이 이미 존재합니다. 테이블을 삭제하고 재생성합니다.');
        await connection.query('DROP TABLE IF EXISTS vehicles');
      }
    } catch (error) {
      console.log('vehicles 테이블 확인 중 오류 (무시하고 계속):', error);
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        vehicle_number VARCHAR(20) UNIQUE NOT NULL,
        vehicle_type VARCHAR(50),
        registration_date DATE NOT NULL,
        status ENUM('운행가능', '정비중', '폐차') DEFAULT '운행가능',
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

    // 4. Admin 계정 생성 (중복 체크)
    const [existingAdmin] = await connection.query(
      'SELECT id FROM drivers WHERE phone = ?',
      ['01000000000']
    );

    if ((existingAdmin as any[]).length === 0) {
      const hashedPassword = await bcrypt.hash('1234', 10);
      await connection.query(
        `INSERT INTO drivers (driver_number, name, phone, password, status, work_type, start_date, role)
         VALUES (?, ?, ?, ?, ?, ?, CURDATE(), ?)`,
        ['ADMIN001', '관리자', '01000000000', hashedPassword, '운행', '일차', 'admin']
      );
      console.log('✅ Admin 계정 생성 완료');
      console.log('   📱 전화번호: 01000000000');
      console.log('   🔐 비밀번호: 1234');
    } else {
      console.log('ℹ️  Admin 계정이 이미 존재합니다');
    }

    console.log('\n🎉 데이터베이스 초기화 완료!');
    return true;
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error);
    throw error;
  } finally {
    connection.release();
  }
}
