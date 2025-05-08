import express from 'express';
import db from '../config/db';
import { auth } from '../middleware/auth';

const router = express.Router();

// 모든 카드 조회
router.get('/', auth, async (req, res) => {
  try {
    const { subject_id } = req.query;
    let query = 'SELECT * FROM cards WHERE user_id = $1';
    const queryParams: any[] = [req.user?.id];

    if (subject_id) {
      query += ' AND subject_id = $2';
      queryParams.push(subject_id);
    }

    query += ' ORDER BY created_at DESC';
    const cards = await db.query(query, queryParams);

    res.json({ cards: cards.rows });
  } catch (error) {
    console.error('카드 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 특정 카드 조회
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const card = await db.query(
      'SELECT * FROM cards WHERE id = $1 AND user_id = $2',
      [id, req.user?.id]
    );

    if (card.rows.length === 0) {
      return res.status(404).json({ message: '카드를 찾을 수 없습니다.' });
    }

    res.json({ card: card.rows[0] });
  } catch (error) {
    console.error('카드 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 카드 생성
router.post('/', auth, async (req, res) => {
  try {
    const { subject_id, front, back, difficulty } = req.body;

    // 과목이 사용자의 것인지 확인
    const subjectCheck = await db.query(
      'SELECT * FROM subjects WHERE id = $1 AND user_id = $2',
      [subject_id, req.user?.id]
    );

    if (subjectCheck.rows.length === 0) {
      return res.status(404).json({ message: '과목을 찾을 수 없습니다.' });
    }

    const newCard = await db.query(
      `INSERT INTO cards 
        (subject_id, front, back, difficulty, user_id, next_review_date) 
      VALUES 
        ($1, $2, $3, $4, $5, NOW() + INTERVAL '1 day') 
      RETURNING *`,
      [subject_id, front, back, difficulty, req.user?.id]
    );

    res.status(201).json({
      message: '카드가 생성되었습니다.',
      card: newCard.rows[0]
    });
  } catch (error) {
    console.error('카드 생성 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 카드 업데이트
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { subject_id, front, back, difficulty } = req.body;

    // 카드가 사용자의 것인지 확인
    const cardCheck = await db.query(
      'SELECT * FROM cards WHERE id = $1 AND user_id = $2',
      [id, req.user?.id]
    );

    if (cardCheck.rows.length === 0) {
      return res.status(404).json({ message: '카드를 찾을 수 없습니다.' });
    }

    // 과목이 사용자의 것인지 확인
    const subjectCheck = await db.query(
      'SELECT * FROM subjects WHERE id = $1 AND user_id = $2',
      [subject_id, req.user?.id]
    );

    if (subjectCheck.rows.length === 0) {
      return res.status(404).json({ message: '과목을 찾을 수 없습니다.' });
    }

    const updatedCard = await db.query(
      'UPDATE cards SET subject_id = $1, front = $2, back = $3, difficulty = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
      [subject_id, front, back, difficulty, id, req.user?.id]
    );

    res.json({
      message: '카드가 업데이트되었습니다.',
      card: updatedCard.rows[0]
    });
  } catch (error) {
    console.error('카드 업데이트 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 카드 삭제
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // 카드가 사용자의 것인지 확인
    const cardCheck = await db.query(
      'SELECT * FROM cards WHERE id = $1 AND user_id = $2',
      [id, req.user?.id]
    );

    if (cardCheck.rows.length === 0) {
      return res.status(404).json({ message: '카드를 찾을 수 없습니다.' });
    }

    await db.query('DELETE FROM cards WHERE id = $1 AND user_id = $2', [id, req.user?.id]);

    res.json({ message: '카드가 삭제되었습니다.' });
  } catch (error) {
    console.error('카드 삭제 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 카드 복습 업데이트
router.post('/:id/review', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { performance } = req.body;

    // 카드가 사용자의 것인지 확인
    const cardCheck = await db.query(
      'SELECT * FROM cards WHERE id = $1 AND user_id = $2',
      [id, req.user?.id]
    );

    if (cardCheck.rows.length === 0) {
      return res.status(404).json({ message: '카드를 찾을 수 없습니다.' });
    }

    const card = cardCheck.rows[0];
    let interval;
    let easeFactor = card.ease_factor || 2.5;
    let consecutiveCorrect = card.consecutive_correct || 0;

    // SM-2 알고리즘 기반 간격 계산
    if (performance < 3) {
      // 잘 기억하지 못함
      consecutiveCorrect = 0;
      interval = 1; // 1일 후 다시 복습
    } else {
      // 잘 기억함
      consecutiveCorrect += 1;
      
      if (consecutiveCorrect === 1) {
        interval = 1;
      } else if (consecutiveCorrect === 2) {
        interval = 6;
      } else {
        // 이전 간격에 ease factor를 곱함
        interval = Math.round(card.interval * easeFactor);
      }
      
      // ease factor 조정
      easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - performance) * (0.08 + (5 - performance) * 0.02)));
    }

    // 카드 업데이트
    const updatedCard = await db.query(
      `UPDATE cards 
      SET 
        last_reviewed = NOW(),
        next_review_date = NOW() + INTERVAL '${interval} days',
        interval = $1,
        ease_factor = $2,
        consecutive_correct = $3,
        review_count = review_count + 1
      WHERE id = $4 AND user_id = $5
      RETURNING *`,
      [interval, easeFactor, consecutiveCorrect, id, req.user?.id]
    );

    res.json({
      message: '카드 복습 정보가 업데이트되었습니다.',
      card: updatedCard.rows[0]
    });
  } catch (error) {
    console.error('카드 복습 업데이트 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 오늘의 복습할 카드 조회
router.get('/due/today', auth, async (req, res) => {
  try {
    const { subject_id } = req.query;
    let query = 'SELECT * FROM cards WHERE user_id = $1 AND next_review_date <= NOW()';
    const queryParams: any[] = [req.user?.id];

    if (subject_id) {
      query += ' AND subject_id = $2';
      queryParams.push(subject_id);
    }

    query += ' ORDER BY next_review_date ASC';
    const dueCards = await db.query(query, queryParams);

    res.json({ cards: dueCards.rows });
  } catch (error) {
    console.error('오늘의 카드 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

export default router; 