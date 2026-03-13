import pool from '../lib/db';

async function run() {
    try {
        const [result] = await pool.query<any>(
            `UPDATE vehicles SET fuel_type = 'LPG'`
        );
        console.log(`✅ 완료: ${result.affectedRows}개 차량의 연료방식을 'LPG'로 변경했습니다.`);
    } catch (e: any) {
        console.error('❌ 오류:', e.message);
    } finally {
        process.exit(0);
    }
}

run();
