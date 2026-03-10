import pool from '../lib/db';

async function createDummyVehicles() {
    console.log('차량 더미 데이터 생성 시작...\n');

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const dummyVehicles = [];
        const statuses = ['운행가능', '운행가능', '운행가능', '운행가능', '정비중']; // 운행가능이 많도록
        const fuelTypes = ['LPG', 'LPG', 'LPG', '전기', '가솔린']; // LPG가 많도록

        for (let i = 1200; i <= 1245; i++) {
            const vehicleNumber = `경남20바${i}`;
            const vehicleType = Math.random() > 0.5 ? '중형' : '대형';
            const fuelType = fuelTypes[Math.floor(Math.random() * fuelTypes.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const date = new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
            const registrationDate = date.toISOString().split('T')[0];

            dummyVehicles.push({
                vehicleNumber,
                vehicleType,
                fuelType,
                registrationDate,
                status
            });
        }

        console.log(`총 ${dummyVehicles.length}대의 차량 정보 준비 완료\n`);

        console.log('데이터베이스에 삽입 중...\n');
        let successCount = 0;

        for (const vehicle of dummyVehicles) {
            try {
                await connection.query(
                    `INSERT INTO vehicles (vehicle_number, vehicle_type, fuel_type, registration_date, status)
                     VALUES (?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE vehicle_type = VALUES(vehicle_type), fuel_type = VALUES(fuel_type), status = VALUES(status)`,
                    [vehicle.vehicleNumber, vehicle.vehicleType, vehicle.fuelType, vehicle.registrationDate, vehicle.status]
                );
                successCount++;
                if (successCount % 10 === 0) {
                    console.log(`  ${successCount}건 처리 완료...`);
                }
            } catch (error: any) {
                console.error(`  ${vehicle.vehicleNumber} 추가 실패:`, error.message);
            }
        }

        await connection.commit();

        console.log(`\n총 ${successCount}대의 차량 데이터 생성 완료!\n`);
        
    } catch (error) {
        await connection.rollback();
        console.error('오류 발생:', error);
        throw error;
    } finally {
        connection.release();
        // 애플리케이션 종료를 위해 풀 닫기 필요 (단, 다른 곳에서 사용 중이면 문제될 수 있으나 스크립트 실행이므로 무방)
        process.exit(0);
    }
}

createDummyVehicles().catch((err) => {
    console.error(err);
    process.exit(1);
});
