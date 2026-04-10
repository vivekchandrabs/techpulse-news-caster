import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

/**
 * GET /api/topics
 */
router.get('/', (req, res) => {
  const db = getDb();
  try {
    const topics = db.prepare('SELECT * FROM topics ORDER BY is_must_follow DESC, keyword ASC').all();
    res.json({ topics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/topics
 */
router.post('/', (req, res) => {
  const db = getDb();
  const { keyword, is_must_follow = false } = req.body;

  if (!keyword) {
    return res.status(400).json({ error: 'Keyword is required' });
  }

  try {
    const result = db.prepare(
      'INSERT INTO topics (keyword, is_must_follow) VALUES (?, ?)'
    ).run(keyword, is_must_follow ? 1 : 0);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Topic already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/topics/:id
 */
router.patch('/:id', (req, res) => {
  const db = getDb();
  const { is_must_follow } = req.body;
  try {
    db.prepare('UPDATE topics SET is_must_follow = ? WHERE id = ?').run(
      is_must_follow ? 1 : 0,
      req.params.id
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/topics/:id
 */
router.delete('/:id', (req, res) => {
  const db = getDb();
  try {
    db.prepare('DELETE FROM topics WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
