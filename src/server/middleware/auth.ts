import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface UserPayload {
  id: number;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export const auth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // 쿠키에서 토큰 가져오기
    const token = req.cookies.token;
    
    if (!token) {
      res.status(401).json({ message: '인증 토큰이 없습니다.' });
      return;
    }

    // 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as UserPayload;
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('인증 오류:', error);
    res.status(401).json({ message: '인증에 실패했습니다.' });
  }
}; 