import pool from '../../lib/db';

async function migrateDatabase() {
    try {
        console.log('Creating dedicated_drivers table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS dedicated_drivers (
                id INT PRIMARY KEY AUTO_INCREMENT,
                vehicle_id INT NOT NULL,
                driver_id INT NOT NULL,
                start_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_vehicle (vehicle_id),
                FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
                FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='차량�??�속 기사 관�?;
        `);
        console.log('dedicated_drivers table created or verified.');

    } catch (e: any) {
        console.error('Migration failed:', e);
    } finally {
        process.exit(0);
    }
}

migrateDatabase();
