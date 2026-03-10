import pool from '../lib/db';

async function dropTables() {
    const connection = await pool.getConnection();

    try {
        console.log('🗑️  기존 테이블 삭제 중...');

        // 외래 키 체크 비활성화
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        // 모든 관련 테이블 삭제
        await connection.query('DROP TABLE IF EXISTS assignments');
        console.log('   - assignments 테이블 삭제');

        await connection.query('DROP TABLE IF EXISTS vehicles');
        console.log('   - vehicles 테이블 삭제');

        await connection.query('DROP TABLE IF EXISTS drivers');
        console.log('   - drivers 테이블 삭제');

        // 외래 키 체크 재활성화
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('✅ 모든 테이블 삭제 완료\n');
    } catch (error) {
        console.error('❌ 테이블 삭제 실패:', error);
        throw error;
    } finally {
        connection.release();
    }
}

dropTables().then(() => {
    console.log('완료!');
    process.exit(0);
}).catch(error => {
    console.error('오류:', error);
    process.exit(1);
});
