import pool from '../../lib/db';

async function migrateDatabase() {
    try {
        console.log('Altering driver_work_history table work_type enumerations...');
        await pool.query(`
            ALTER TABLE driver_work_history 
            MODIFY COLUMN work_type VARCHAR(20) NOT NULL COMMENT '?�용 방식 (?�차, 격일A, 격일B ??';
        `);
        console.log('Schema updated successfully.');

    } catch (e: any) {
        console.error('Migration failed:', e);
    } finally {
        process.exit(0);
    }
}

migrateDatabase();
