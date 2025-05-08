import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';
import cardsRoutes from './routes/cards';
import subjectsRoutes from './routes/subjects';
import usersRoutes from './routes/users';

// 환경 변수 로드
dotenv.config({ path: '.env.server' });

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// 라우트
app.use('/api/auth', authRoutes);
app.use('/api/cards', cardsRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/users', usersRoutes);

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
}); 