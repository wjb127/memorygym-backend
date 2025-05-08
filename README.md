# MemoryGym 백엔드

암기 학습을 위한 스페이스드 리피티션(Spaced Repetition) 시스템의 백엔드 API 서버입니다.

## 기술 스택

- Node.js
- Express
- TypeScript
- PostgreSQL
- JWT 인증

## 설치 및 실행

### 필수 요구사항

- Node.js 14 이상
- PostgreSQL 12 이상

### 설치

```bash
# 패키지 설치
npm install
```

### 환경 변수 설정

`.env.server` 파일을 프로젝트 루트에 생성하고 다음 내용을 설정합니다:

```
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/memorygym
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### 데이터베이스 설정

1. PostgreSQL에서 데이터베이스 생성:

```sql
CREATE DATABASE memorygym;
```

2. 스키마 적용:

```bash
# PostgreSQL에 접속
psql -U username -d memorygym

# 스키마 파일 실행
\i src/server/db/migrations/init.sql
```

### 서버 실행

```bash
# 개발 모드로 실행
npm run server

# 빌드
npm run server:build

# 프로덕션 모드로 실행
npm run server:start
```

## API 엔드포인트

### 인증

- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/me` - 현재 사용자 정보

### 사용자

- `GET /api/users/profile` - 사용자 프로필 조회
- `PUT /api/users/profile` - 사용자 프로필 업데이트
- `GET /api/users/stats` - 사용자 통계 정보 조회

### 과목

- `GET /api/subjects` - 모든 과목 조회
- `GET /api/subjects/:id` - 특정 과목 조회
- `POST /api/subjects` - 과목 생성
- `PUT /api/subjects/:id` - 과목 업데이트
- `DELETE /api/subjects/:id` - 과목 삭제

### 카드

- `GET /api/cards` - 모든 카드 조회
- `GET /api/cards/:id` - 특정 카드 조회
- `POST /api/cards` - 카드 생성
- `PUT /api/cards/:id` - 카드 업데이트
- `DELETE /api/cards/:id` - 카드 삭제
- `POST /api/cards/:id/review` - 카드 복습 정보 업데이트
- `GET /api/cards/due/today` - 오늘 복습할 카드 조회

## Render 배포

이 프로젝트는 Render 플랫폼에 쉽게 배포할 수 있도록 `render.yaml` 파일이 포함되어 있습니다. Render에서 Git 저장소를 연결하고 배포하면 자동으로 웹 서비스와 데이터베이스가 생성됩니다. 