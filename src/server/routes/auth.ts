import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/db';
import { auth } from '../middleware/auth';

const router = express.Router();

// 회원가입
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    // 이메일 중복 확인
    const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      res.status(400).json({ message: '이미 사용 중인 이메일입니다.' });
      return;
    }

    // 비밀번호 해싱
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 사용자 생성
    const newUser = await db.query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, hashedPassword, name]
    );

    // JWT 토큰 생성
    const token = jwt.sign(
      { id: newUser.rows[0].id, email },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );

    // 쿠키에 토큰 저장
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 1일
    });

    res.status(201).json({
      message: '회원가입 성공',
      user: {
        id: newUser.rows[0].id,
        email: newUser.rows[0].email,
        name: newUser.rows[0].name
      }
    });
  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 로그인
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // 사용자 확인
    const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      res.status(400).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      return;
    }

    // 비밀번호 확인
    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      res.status(400).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      return;
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { id: user.rows[0].id, email },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );

    // 쿠키에 토큰 저장
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 1일
    });

    res.json({
      message: '로그인 성공',
      user: {
        id: user.rows[0].id,
        email: user.rows[0].email,
        name: user.rows[0].name
      }
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 로그아웃
router.post('/logout', (req: Request, res: Response): void => {
  res.clearCookie('token');
  res.json({ message: '로그아웃 성공' });
});

// 현재 사용자 정보 가져오기
router.get('/me', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await db.query('SELECT id, email, name FROM users WHERE id = $1', [req.user?.id]);
    
    if (user.rows.length === 0) {
      res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
      return;
    }

    res.json({ user: user.rows[0] });
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

export default router; 