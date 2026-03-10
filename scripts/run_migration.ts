import pool from '../lib/db';

async function migrate() {
    try {
        const sql = `
        CREATE TABLE IF NOT EXISTS daily_vehicle_statuses (
            id INT PRIMARY KEY AUTO_INCREMENT,
            status_date DATE NOT NULL,
            vehicle_id INT NOT NULL,
            status ENUM('정상', '점검', '부제', '대기') DEFAULT '정상',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_status (status_date, vehicle_id),
            FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='일일 차량 상태';
        `;
        
        await pool.query(sql);
        console.log('Migration successful: daily_vehicle_statuses table created');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        process.exit(0);
    }
}

migrate();
