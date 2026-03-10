import pool from '../lib/db';

async function checkAdmin() {
    const connection = await pool.getConnection();

    try {
        console.log('=== Admin 계정 확인 ===\n');

        // Admin 계정 조회
        const [rows] = await connection.query(
            'SELECT id, driver_number, name, phone, role, status, created_at FROM drivers WHERE phone = ?',
            ['01000000000']
        );

        const users = rows as any[];

        if (users.length === 0) {
            console.log('❌ Admin 계정이 존재하지 않습니다!');
            console.log('해결: npm run setup-db 명령으로 다시 생성하세요.');
        } else {
            console.log('✅ Admin 계정이 존재합니다:');
            console.log(JSON.stringify(users[0], null, 2));

            // 비밀번호 해시 확인
            const [pwRows] = await connection.query(
                'SELECT password FROM drivers WHERE phone = ?',
                ['01000000000']
            );
            const pwData = pwRows as any[];
            console.log('\n비밀번호 해시 (앞 20자):', pwData[0].password.substring(0, 20) + '...');
        }

        // 전체 기사 수 확인
        const [countRows] = await connection.query('SELECT COUNT(*) as total FROM drivers');
        const countData = countRows as any[];
        console.log('\n전체 기사 수:', countData[0].total);

    } catch (error) {
        console.error('❌ 오류:', error);
    } finally {
        connection.release();
        process.exit(0);
    }
}

checkAdmin();
