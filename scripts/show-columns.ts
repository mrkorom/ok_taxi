import pool from '../lib/db';

async function showColumns() {
  try {
    const [rows] = await pool.query('SHOW COLUMNS FROM drivers');
    console.log(rows);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

showColumns();
