import pool from '../../lib/db';

async function migrate() {
    try {
        const sql = `
        CREATE TABLE IF NOT EXISTS daily_notices (
            id INT PRIMARY KEY AUTO_INCREMENT,
            notice_date DATE NOT NULL UNIQUE COMMENT 'Í≥µÏ? ?†Ïßú',
            content TEXT COMMENT 'Í≥µÏ? ?¥Ïö©',
            is_active BOOLEAN DEFAULT TRUE COMMENT '?úÏÑ±???¨Î?',
            created_by INT COMMENT '?ëÏÑ±??(drivers.id)',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES drivers(id) ON DELETE SET NULL,
            INDEX idx_notice_date (notice_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='?ºÏùº Î∞∞Ï∞® Í≥µÏ??¨Ìï≠';
        `;

        await pool.query(sql);
        console.log('??Migration successful: daily_notices table created');
    } catch (e) {
        console.error('??Migration failed:', e);
    } finally {
        process.exit(0);
    }
}

migrate();
