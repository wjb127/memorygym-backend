import express, { Request, Response } from 'express';
import db from '../config/db';
import { auth } from '../middleware/auth';

const router = express.Router();

// 모든 과목 조회
router.get('/', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const subjects = await db.query(
      'SELECT * FROM subjects WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user?.id]
    );

    res.json({ subjects: subjects.rows });
  } catch (error) {
    console.error('과목 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 특정 과목 조회
router.get('/:id', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const subject = await db.query(
      'SELECT * FROM subjects WHERE id = $1 AND user_id = $2',
      [id, req.user?.id]
    );

    if (subject.rows.length === 0) {
      res.status(404).json({ message: '과목을 찾을 수 없습니다.' });
      return;
    }

    res.json({ subject: subject.rows[0] });
  } catch (error) {
    console.error('과목 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 과목 생성
router.post('/', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, color } = req.body;

    const newSubject = await db.query(
      'INSERT INTO subjects (name, description, color, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, color, req.user?.id]
    );

    res.status(201).json({
      message: '과목이 생성되었습니다.',
      subject: newSubject.rows[0]
    });
  } catch (error) {
    console.error('과목 생성 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 과목 업데이트
router.put('/:id', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;

    // 과목이 사용자의 것인지 확인
    const subjectCheck = await db.query(
      'SELECT * FROM subjects WHERE id = $1 AND user_id = $2',
      [id, req.user?.id]
    );

    if (subjectCheck.rows.length === 0) {
      res.status(404).json({ message: '과목을 찾을 수 없습니다.' });
      return;
    }

    const updatedSubject = await db.query(
      'UPDATE subjects SET name = $1, description = $2, color = $3 WHERE id = $4 AND user_id = $5 RETURNING *',
      [name, description, color, id, req.user?.id]
    );

    res.json({
      message: '과목이 업데이트되었습니다.',
      subject: updatedSubject.rows[0]
    });
  } catch (error) {
    console.error('과목 업데이트 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 과목 삭제
router.delete('/:id', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // 과목이 사용자의 것인지 확인
    const subjectCheck = await db.query(
      'SELECT * FROM subjects WHERE id = $1 AND user_id = $2',
      [id, req.user?.id]
    );

    if (subjectCheck.rows.length === 0) {
      res.status(404).json({ message: '과목을 찾을 수 없습니다.' });
      return;
    }

    // 관련된 카드도 삭제
    await db.query('DELETE FROM cards WHERE subject_id = $1', [id]);

    // 과목 삭제
    await db.query('DELETE FROM subjects WHERE id = $1 AND user_id = $2', [id, req.user?.id]);

    res.json({ message: '과목이 삭제되었습니다.' });
  } catch (error) {
    console.error('과목 삭제 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

export default router; 