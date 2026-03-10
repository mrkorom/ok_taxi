import mysql from 'mysql2/promise';

// 환경 변수 확인
const dbConfig = {
    host: process.env.DB_HOST || 'korom.myasustor.com',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'vault04',
    password: process.env.DB_PASSWORD || 'mrkorom@2400',
    database: process.env.DB_NAME || 'txi_op',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
};

console.log('DB 연결 설정:', {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    database: dbConfig.database,
});

// MySQL 연결 풀 생성
const pool = mysql.createPool(dbConfig);

// 연결 테스트 함수
export async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ MySQL 데이터베이스 연결 성공');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ MySQL 데이터베이스 연결 실패:', error);
        return false;
    }
}

export default pool;
