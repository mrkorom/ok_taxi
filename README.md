# 택시 운용 관리 시스템

## 📁 프로젝트 구조

```
TAXI_anicall/
├── app/                    # Next.js App Router
│   ├── globals.css        # 전역 스타일 (Tailwind)
│   ├── layout.tsx         # 루트 레이아웃
│   └── page.tsx           # 홈페이지
├── lib/                   # 유틸리티 라이브러리
│   ├── db.ts              # MySQL 연결 풀
│   └── init-db.ts         # DB 초기화 스크립트
├── scripts/               # 실행 스크립트
│   └── setup-db.ts        # DB 설정 실행
├── db/                    # 데이터베이스
│   └── schema.sql         # SQL 스키마
├── .env.local             # 환경 변수 (로컬)
├── .env.example           # 환경 변수 예제
├── next.config.ts         # Next.js 설정
├── tailwind.config.js     # Tailwind CSS 설정
├── tsconfig.json          # TypeScript 설정
└── package.json           # 프로젝트 의존성
```

## 🚀 시작하기

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.local` 파일이 이미 설정되어 있습니다:
```
DB_HOST=korom.myasustor.com
DB_PORT=3306
DB_USER=vault04
DB_PASSWORD=mrkorom2400
DB_NAME=txi_op
```

### 3. 데이터베이스 초기화
```bash
npm run setup-db
```

이 명령은:
- MySQL 연결 테스트
- `drivers`, `vehicles`, `assignments` 테이블 생성
- Admin 계정 생성 (전화번호: 01000000000, 비밀번호: 1234)

### 4. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 🗄️ 데이터베이스 스키마

### drivers (기사)
- `id`: 자동 증가 ID
- `driver_number`: 고유번호
- `name`: 이름
- `phone`: 연락처 (로그인 ID)
- `password`: 비밀번호 (bcrypt 해시)
- `photo_url`: 사진 URL
- `status`: 운용 상태 (운행/휴직/퇴사)
- `work_type`: 운용 방식 (격일/일차/아르바이트)
- `start_date`: 운용 시작일
- `role`: 권한 (admin/manager/driver)

### vehicles (차량)
- `id`: 자동 증가 ID
- `vehicle_number`: 차량번호 (경남20바1201~1249)
- `vehicle_type`: 차량 종류
- `registration_date`: 등록일
- `status`: 상태 (운행가능/정비중/폐차)

### assignments (배차)
- `id`: 자동 증가 ID
- `assignment_date`: 배차 날짜
- `driver_id`: 기사 ID (FK)
-`vehicle_id`: 차량 ID (FK)
- `shift`: 근무 시간대 (주간/야간/전일)
- `notes`: 비고

## 🔑 초기 Admin 계정
- **전화번호**: 01000000000
- **비밀번호**: 1234
- **권한**: admin

## 📝 다음 단계

✅ **완료된 작업**:
- Next.js 프로젝트 초기화
- TypeScript, Tailwind CSS 설정
- MySQL 연결 코드 작성
- 데이터베이스 스키마 정의
- 환경 변수 설정

🔄 **진행 중**:
- MySQL 서버 연결 권한 설정 필요
- 데이터베이스 초기화 대기

⏭️ **예정**:
- 로그인 페이지 구현
- 기사 관리 CRUD
- 차량 관리 CRUD
- 배차표 시스템

## 🛠️ 사용 기술

- **Frontend**: Next.js 16, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: MySQL 8.0
- **Auth**: bcryptjs, jsonwebtoken
- **ORM**: mysql2 (connection pool)

## 📌 현재 상태

**MySQL 연결 권한 문제 발생**

접근 거부 오류:
```
Access denied for user 'vault04'@'1.254.80.126'
```

**해결 방법**:
1. MySQL 서버에서 원격 접속 권한 부여
2. 또는 SSH 터널링을 통한 접속 설정
3. 또는 VPN 사용

자세한 내용은 아래 문서를 참조하세요.
