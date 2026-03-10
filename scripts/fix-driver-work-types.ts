import pool from '../lib/db';

async function fixDriverWorkTypes() {
    let connection;
    try {
        connection = await pool.getConnection();

        // 1. Clear work_type for all non-drivers (admins/managers)
        await connection.query(`UPDATE drivers SET work_type = NULL WHERE role != 'driver'`);
        console.log("Cleared work_type for non-drivers.");

        // 2. Get all drivers
        const [drivers]: any = await connection.query(`SELECT id FROM drivers WHERE role = 'driver' ORDER BY id ASC`);
        
        let countIlcha = 0;
        let countGyeokA = 0;
        let countGyeokB = 0;

        for (let i = 0; i < drivers.length; i++) {
            const driverId = drivers[i].id;
            let newWorkType = '';

            if (countIlcha < 10) {
                newWorkType = '일차';
                countIlcha++;
            } else {
                // Alternating A and B for the rest
                if (i % 2 === 0) {
                    newWorkType = '격일A';
                    countGyeokA++;
                } else {
                    newWorkType = '격일B';
                    countGyeokB++;
                }
            }

            // Update the driver's work_type in the main table
            await connection.query(`UPDATE drivers SET work_type = ? WHERE id = ?`, [newWorkType, driverId]);
        }
        
        console.log(`Updated Work Types strictly: 일차(${countIlcha}), 격일A(${countGyeokA}), 격일B(${countGyeokB})`);

        // Also clean up driver_work_history just to be absolutely clean, though we don't strictly use it anymore it prevents confusion.
        await connection.query(`TRUNCATE TABLE driver_work_history`);
        console.log("Truncated legacy driver_work_history table to remove duplicates.");
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        if (connection) connection.release();
    }
}
fixDriverWorkTypes();
