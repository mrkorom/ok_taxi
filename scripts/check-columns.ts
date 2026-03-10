import pool from '../lib/db';

async function checkColumns() {
    try {
        const [rows]: any = await pool.query("SHOW COLUMNS FROM drivers");
        console.table(rows);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkColumns();
