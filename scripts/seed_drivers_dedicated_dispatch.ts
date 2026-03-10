import pool from '../lib/db';

function randomChoice<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function seedData() {
    let connection;
    try {
        connection = await pool.getConnection();

        console.log('--- 1. Seeding Driver Work Types ---');
        // Get all drivers excluding admin
        const [drivers]: any = await connection.query("SELECT id FROM drivers WHERE status = '운행'");
        
        if (drivers.length < 10) {
            console.warn('Warning: Less than 10 drivers available.');
        }

        // Shuffle drivers
        const shuffledDrivers = [...drivers].sort(() => 0.5 - Math.random());
        
        let i = 0;
        let countIlcha = 0;
        let countGyeokA = 0;
        let countGyeokB = 0;

        for (const driver of shuffledDrivers) {
            let workType = '';
            if (i < 10) {
                workType = '일차';
                countIlcha++;
            } else {
                workType = i % 2 === 0 ? '격일A' : '격일B';
                if (workType === '격일A') countGyeokA++;
                else countGyeokB++;
            }
            
            const todayStr = '260301'; // Using fixed start date
            await connection.query(
                `INSERT INTO driver_work_history (driver_id, work_start_date, work_type) 
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE work_type = VALUES(work_type)`, 
                [driver.id, todayStr, workType]
            );
            i++;
        }
        console.log(`Updated Work Types: 일차(${countIlcha}), 격일A(${countGyeokA}), 격일B(${countGyeokB})`);

        console.log('--- 2. Seeding Dedicated Drivers (전속) ---');
        // Clear existing dedicated drivers
        await connection.query('TRUNCATE TABLE dedicated_drivers');
        
        // Get all vehicles
        const [vehicles]: any = await connection.query("SELECT id FROM vehicles WHERE status = '운행가능'");
        
        // Take up to 40 vehicles
        const dedicatedVehicles = vehicles.slice(0, 40);
        
        // Assign guaranteed unique drivers up to what's available
        for (let j = 0; j < Math.min(dedicatedVehicles.length, shuffledDrivers.length); j++) {
            await connection.query(
                'INSERT INTO dedicated_drivers (vehicle_id, driver_id, start_date) VALUES (?, ?, ?)',
                [dedicatedVehicles[j].id, shuffledDrivers[j].id, '2026-03-01']
            );
        }
        console.log(`Assigned dedicated drivers to ${Math.min(dedicatedVehicles.length, shuffledDrivers.length)} vehicles.`);

        console.log('--- 3. Seeding Sample Assignments (Mar 7 - Mar 10) ---');
        const dates = ['2026-03-07', '2026-03-08', '2026-03-09', '2026-03-10'];
        
        for (const date of dates) {
            console.log(`Seeding assignments for ${date}...`);
            let assignmentsCreated = 0;

            // Ilcha drivers work every day
            const ilchaDrivers = shuffledDrivers.slice(0, 10);
            
            // GyeokA logic: Let's arbitrarily assign them to Mar 7 and Mar 9
            // GyeokB logic: Let's arbitrarily assign them to Mar 8 and Mar 10
            const isGyeokADay = date === '2026-03-07' || date === '2026-03-09';
            
            let driversForToday = [...ilchaDrivers];
            for (let k = 10; k < shuffledDrivers.length; k++) {
                const workType = k % 2 === 0 ? '격일A' : '격일B'; // Logic from loop 1
                if ((isGyeokADay && workType === '격일A') || (!isGyeokADay && workType === '격일B')) {
                    driversForToday.push(shuffledDrivers[k]);
                }
            }

            // Assign them to sequential vehicles just to fill data
            for (let m = 0; m < Math.min(driversForToday.length, vehicles.length); m++) {
                try {
                await connection.query(
                    `INSERT INTO assignments (assignment_date, driver_id, vehicle_id, shift, notes) 
                     VALUES (?, ?, ?, '전일', '')
                     ON DUPLICATE KEY UPDATE driver_id = VALUES(driver_id)`,
                    [date, driversForToday[m].id, vehicles[m].id]
                );
                assignmentsCreated++;
                } catch(err) {
                   // Ignore unique constraint or other minor creation errors in seeding
                }
            }
            console.log(`Created ${assignmentsCreated} assignments for ${date}`);
        }

        console.log('Seeding completed successfully!');
    } catch (e: any) {
        console.error('Seeding failed:', e);
    } finally {
        if (connection) connection.release();
        process.exit(0);
    }
}

seedData();
