import pool from '../lib/db';
import bcrypt from 'bcryptjs';

async function updateDriversTable() {
    console.log('🔧 기사 테이블 업데이트 시작...\n');

    try {
        // 1. drivers 테이블 수정 - driver_number를 driver_code로 변경하고 4자리로
        console.log('1️⃣ drivers 테이블 컬럼 수정 중...');

        // driver_id 컬럼을 driver_code로 변경
        await pool.query(`
            ALTER TABLE drivers 
            CHANGE COLUMN driver_id driver_code VARCHAR(4) UNIQUE NOT NULL COMMENT '고유코드 (4자리 숫자)'
        `);

        console.log('   ✅ driver_id → driver_code 변경 완료\n');

        // 2. 기존 데이터의 driver_code 값 업데이트 (ADMIN001 → 0001)
        console.log('2️⃣ 기존 데이터 업데이트 중...');
        await pool.query(`
            UPDATE drivers 
            SET driver_code = LPAD(id, 4, '0')
            WHERE id <= 9000
        `);
        console.log('   ✅ 기존 기사 코드 업데이트 완료\n');

        // 3. work_type, work_start_date 컬럼 제거 (나중에 별도 테이블로)
        console.log('3️⃣ 불필요한 컬럼 제거 중...');
        try {
            await pool.query(`ALTER TABLE drivers DROP COLUMN work_type`);
            await pool.query(`ALTER TABLE drivers DROP COLUMN work_start_date`);
            console.log('   ✅ work_type, work_start_date 컬럼 제거 완료\n');
        } catch (error: any) {
            if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
                console.log('   ℹ️ 컬럼이 이미 제거되었거나 존재하지 않습니다.\n');
            } else {
                throw error;
            }
        }

        // 4. driver_work_history 테이블 생성
        console.log('4️⃣ driver_work_history 테이블 생성 중...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS driver_work_history (
                id INT PRIMARY KEY AUTO_INCREMENT,
                driver_id INT NOT NULL COMMENT '기사 ID',
                work_start_date VARCHAR(6) NOT NULL COMMENT '운용시작일 (YYMMDD)',
                work_type ENUM('격일', '일차', '아르바이트') NOT NULL COMMENT '운용방식',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
                INDEX idx_driver_date (driver_id, work_start_date DESC)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('   ✅ driver_work_history 테이블 생성 완료\n');

        // 5. 기존 Admin 계정에 운용방식 추가
        console.log('5️⃣ Admin 계정 운용방식 추가 중...');
        const [adminDriver] = await pool.query<any[]>(
            'SELECT id FROM drivers WHERE role = ? LIMIT 1',
            ['admin']
        );

        if (adminDriver.length > 0) {
            const adminId = adminDriver[0].id;
            await pool.query(`
                INSERT INTO driver_work_history (driver_id, work_start_date, work_type)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE work_type = work_type
            `, [adminId, '260101', '일차']);
            console.log('   ✅ Admin 계정 운용방식 추가 완료\n');
        }

        console.log('✅ 데이터베이스 스키마 업데이트 완료!\n');

    } catch (error) {
        console.error('❌ 오류 발생:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

updateDriversTable().catch(console.error);
