import pool from '../lib/db';

async function checkWorkTypes() {
    try {
        const [history]: any = await pool.query('SELECT DISTINCT work_type FROM driver_work_history');
        console.log("driver_work_history work types:", history);

        const [counts]: any = await pool.query(`
            SELECT work_type, COUNT(*) as cnt 
            FROM (
                SELECT driver_id, work_type
                FROM driver_work_history
                WHERE (driver_id, work_start_date) IN (
                    SELECT driver_id, MAX(work_start_date)
                    FROM driver_work_history
                    GROUP BY driver_id
                )
            ) as latest
            GROUP BY work_type
        `);
        console.log("Latest work type counts:", counts);
        
        const [driversWithoutHistory]: any = await pool.query(`
            SELECT d.id, d.name 
            FROM drivers d 
            LEFT JOIN driver_work_history h ON d.id = h.driver_id 
            WHERE h.id IS NULL
        `);
        console.log("Drivers without history:", driversWithoutHistory.length);
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkWorkTypes();
