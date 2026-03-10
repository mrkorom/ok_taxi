import pool from '../../lib/db';

async function fixColumn() {
    try {
        console.log("Adding work_type column to drivers...");
        await pool.query(`
            ALTER TABLE drivers 
            ADD COLUMN work_type VARCHAR(20) DEFAULT '일차' COMMENT '운용 방식'
        `);
        console.log("Added work_type to drivers.");
        process.exit(0);
    } catch (e: any) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("work_type already exists, ignoring.");
            process.exit(0);
        } else {
            console.error(e);
            process.exit(1);
        }
    }
}
fixColumn();
