import pool from '../lib/db';
import bcrypt from 'bcryptjs';

async function createDummyDrivers() {
    console.log('🚗 더미 기사 데이터 생성 시작...\n');

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const hashedPassword = await bcrypt.hash('1234', 10);

        // 65명의 더미 기사 생성 (9001-9065)
        const dummyDrivers = [];
        const workTypes = ['격일', '일차', '아르바이트'];
        const statuses = ['운행', '운행', '운행', '휴직']; // 운행이 더 많도록

        // 한국 성씨와 이름
        const lastNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '홍'];
        const firstNames = ['민수', '서준', '지훈', '현우', '준호', '도윤', '시우', '하준', '주원', '지안',
            '수빈', '예준', '승우', '민준', '건우', '유준', '연우', '정우', '승현', '동현',
            '준서', '은우', '태양', '시윤', '지후', '승민', '우진', '시후', '재윤', '태현',
            '지환', '민호', '재현', '우빈', '성민', '준혁', '민재', '태윤', '윤서', '서진',
            '민지', '서윤', '지우', '하윤', '서현', '수아', '지유', '서영', '채원', '예은',
            '지민', '다은', '수현', '은서', '가은', '소율', '채은', '윤아', '나은', '수진',
            '혜진', '영희', '순자', '미숙', '경숙'];

        for (let i = 1; i <= 65; i++) {
            const driverCode = `9${String(i).padStart(3, '0')}`; // 9001-9065
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const name = `${lastName}${firstName}`;
            const phone = `010${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
            const status = statuses[Math.floor(Math.random() * statuses.length)];

            dummyDrivers.push({
                code: driverCode,
                name,
                phone,
                password: hashedPassword,
                status
            });
        }

        console.log(`📝 ${dummyDrivers.length}명의 기사 정보 생성 완료\n`);

        // 기사 정보 삽입
        console.log('💾 데이터베이스에 저장 중...\n');
        let successCount = 0;

        for (const driver of dummyDrivers) {
            try {
                // 운용방식 히스토리 추가 (랜덤한 과거 날짜부터 시작)
                const year = 24 + Math.floor(Math.random() * 2); // 24 or 25
                const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
                const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
                const workStartDate = `${year}${month}${day}`;
                const workType = workTypes[Math.floor(Math.random() * workTypes.length)];
                
                const dbStartDate = `20${year}-${month}-${day}`;

                // 기사 기본 정보 삽입
                const [result] = await connection.query<any>(
                    `INSERT INTO drivers (driver_code, name, phone, password, status, role, start_date)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [driver.code, driver.name, driver.phone, driver.password, driver.status, 'driver', dbStartDate]
                );

                const driverId = result.insertId;

                await connection.query(
                    `INSERT INTO driver_work_history (driver_id, work_start_date, work_type)
                     VALUES (?, ?, ?)`,
                    [driverId, workStartDate, workType]
                );

                // 일부 기사는 운용방식 변경 이력 추가 (30% 확률)
                if (Math.random() < 0.3) {
                    const changeYear = 25;
                    const changeMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
                    const changeDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
                    const changeDate = `${changeYear}${changeMonth}${changeDay}`;
                    const newWorkType = workTypes[Math.floor(Math.random() * workTypes.length)];

                    await connection.query(
                        `INSERT INTO driver_work_history (driver_id, work_start_date, work_type)
                         VALUES (?, ?, ?)`,
                        [driverId, changeDate, newWorkType]
                    );
                }

                successCount++;
                if (successCount % 10 === 0) {
                    console.log(`   ✅ ${successCount}명 처리 완료...`);
                }
            } catch (error: any) {
                console.error(`   ❌ ${driver.name} (${driver.code}) 추가 실패:`, error.message);
            }
        }

        await connection.commit();

        console.log(`\n✅ 총 ${successCount}명의 더미 기사 데이터 생성 완료!\n`);
        console.log('ℹ️ 더미 데이터 삭제 방법:');
        console.log('   DELETE FROM drivers WHERE driver_code LIKE "9%";\n');

    } catch (error) {
        await connection.rollback();
        console.error('❌ 오류 발생:', error);
        throw error;
    } finally {
        connection.release();
        await pool.end();
    }
}

createDummyDrivers().catch(console.error);
