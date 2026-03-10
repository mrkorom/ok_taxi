import { testConnection } from '@/lib/db';
import { initializeDatabase } from '@/lib/init-db';

async function main() {
    console.log('=== 데이터베이스 설정 시작 ===\n');

    // 1. 연결 테스트
    const isConnected = await testConnection();
    if (!isConnected) {
        console.error('데이터베이스 연결 실패. 환경 변수를 확인하세요.');
        process.exit(1);
    }

    console.log('');

    // 2. 스키마 초기화
    await initializeDatabase();

    console.log('\n=== 데이터베이스 설정 완료 ===');
    process.exit(0);
}

main();
