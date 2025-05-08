import express from 'express';
import db from '../config/db';
import { auth } from '../middleware/auth';

const router = express.Router();

// 사용자 프로필 조회
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await db.query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [req.user?.id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    res.json({ user: user.rows[0] });
  } catch (error) {
    console.error('프로필 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 사용자 프로필 업데이트
router.put('/profile', auth, async (req, res) => {
  try {
    const { name } = req.body;

    const updatedUser = await db.query(
      'UPDATE users SET name = $1 WHERE id = $2 RETURNING id, email, name',
      [name, req.user?.id]
    );

    if (updatedUser.rows.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    res.json({
      message: '프로필이 업데이트되었습니다.',
      user: updatedUser.rows[0]
    });
  } catch (error) {
    console.error('프로필 업데이트 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 사용자의 통계 정보 조회
router.get('/stats', auth, async (req, res) => {
  try {
    // 사용자의 카드 통계 조회
    const cardStats = await db.query(
      `SELECT 
        COUNT(*) as total_cards,
        SUM(CASE WHEN next_review_date < NOW() THEN 1 ELSE 0 END) as due_cards
      FROM cards
      WHERE user_id = $1`,
      [req.user?.id]
    );

    // 사용자의 과목 수 조회
    const subjectCount = await db.query(
      'SELECT COUNT(*) as total_subjects FROM subjects WHERE user_id = $1',
      [req.user?.id]
    );

    res.json({
      stats: {
        totalCards: parseInt(cardStats.rows[0].total_cards) || 0,
        dueCards: parseInt(cardStats.rows[0].due_cards) || 0,
        totalSubjects: parseInt(subjectCount.rows[0].total_subjects) || 0
      }
    });
  } catch (error) {
    console.error('통계 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

export default router; 