import pool from '../lib/db';

async function run() {
    try {
        const [result] = await pool.query<any>(
            `UPDATE vehicles SET vehicle_type = '중형' WHERE vehicle_type = '대형'`
        );
        console.log(`✅ 업데이트 완료: ${result.affectedRows}개 차량의 구분을 '대형' → '중형'으로 변경했습니다.`);
    } catch (e: any) {
        console.error('❌ 오류:', e.message);
    } finally {
        process.exit(0);
    }
}

run();
