import pool from '../lib/db';

async function updateVehiclesSchema() {
    console.log('🔧 차량 테이블 업데이트 시작...\n');

    try {
        console.log('1️⃣ vehicles 테이블 컬럼 확인 중...');
        
        // fuel_type 컬럼이 있는지 확인
        const [columns] = await pool.query<any[]>(`SHOW COLUMNS FROM vehicles LIKE 'fuel_type'`);
        
        if (columns.length === 0) {
            console.log('2️⃣ fuel_type 컬럼 추가 중...');
            await pool.query(`
                ALTER TABLE vehicles
                ADD COLUMN fuel_type ENUM('LPG', '전기', '가솔린', '디젤') DEFAULT 'LPG' COMMENT '차량 연료' AFTER vehicle_type
            `);
            console.log('   ✅ fuel_type 컬럼 추가 완료\n');
        } else {
            console.log('   ℹ️ fuel_type 컬럼이 이미 존재합니다.\n');
        }

        console.log('✅ 데이터베이스 스키마 수정 완료!\n');

    } catch (error) {
        console.error('❌ 스키마 수정 중 오류 발생:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

updateVehiclesSchema().catch(console.error);
