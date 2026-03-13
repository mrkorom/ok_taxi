import pool from '../lib/db';

async function run() {
    try {
        await pool.query(
            `ALTER TABLE vehicles MODIFY COLUMN status ENUM('운행가능','정비중','폐차','말소') DEFAULT '운행가능'`
        );
        console.log("✅ DB ENUM 변경 완료: vehicles.status에 '말소' 추가");
    } catch (e: any) {
        console.error('❌ 오류:', e.message);
    } finally {
        process.exit(0);
    }
}

run();
