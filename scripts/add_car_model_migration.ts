import pool from '../lib/db';

async function migrateCarModel() {
    try {
        const sql1 = `
            ALTER TABLE vehicles 
            ADD COLUMN car_model VARCHAR(50) DEFAULT '' COMMENT '차종/모델 (예: 쏘나타, K5)';
        `;
        const sql2 = `
            ALTER TABLE vehicles 
            ADD COLUMN model_year VARCHAR(10) DEFAULT '' COMMENT '연식 (예: 2023)';
        `;
        
        console.log('Adding car_model column...');
        await pool.query(sql1);
        
        console.log('Adding model_year column...');
        await pool.query(sql2);
        
        console.log('Migration successful: car_model and model_year columns added to vehicles table');
    } catch (e: any) {
        // If column already exists (ER_DUP_FIELDNAME), we can ignore
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('Columns already exist, skipping.');
        } else {
            console.error('Migration failed:', e);
        }
    } finally {
        process.exit(0);
    }
}

migrateCarModel();
