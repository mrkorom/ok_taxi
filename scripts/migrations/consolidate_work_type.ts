import pool from '../../lib/db';

async function fixWorkTypes() {
    let connection;
    try {
        connection = await pool.getConnection();

        console.log("Migrating latest work_type from driver_work_history back to drivers table...");
        
        // Update all drivers with their latest work_type from history
        await connection.query(`
            UPDATE drivers d
            JOIN (
                SELECT driver_id, work_type
                FROM driver_work_history
                WHERE (driver_id, work_start_date) IN (
                    SELECT driver_id, MAX(work_start_date)
                    FROM driver_work_history
                    GROUP BY driver_id
                )
            ) h ON d.id = h.driver_id
            SET d.work_type = h.work_type
        `);

        // Convert any remaining '격일' to '격일A'
        await connection.query(`UPDATE drivers SET work_type = '격일A' WHERE work_type = '격일'`);
        await connection.query(`UPDATE drivers SET work_type = '일차' WHERE work_type = '아르바이트'`);
        
        // Just in case any driver has empty work_type
        await connection.query(`UPDATE drivers SET work_type = '일차' WHERE work_type IS NULL OR work_type = ''`);

        console.log("Work types standardized in drivers table.");
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        if (connection) connection.release();
    }
}
fixWorkTypes();
