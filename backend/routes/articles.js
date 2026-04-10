import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

/**
 * GET /api/articles
 * Fetch articles, optionally filtered by date and topic.
 */
router.get('/', (req, res) => {
  const db = getDb();
  const { date, topic, unread } = req.query;

  let query = 'SELECT * FROM articles WHERE 1=1';
  const params = [];

  if (date) {
    query += ' AND date(fetched_at) = date(?)';
    params.push(date);
  }

  if (topic) {
    query += ' AND topic LIKE ?';
    params.push(`%${topic}%`);
  }

  if (unread === 'true') {
    query += ' AND is_read = 0';
  }

  query += ' ORDER BY published_at DESC LIMIT 100';

  try {
    const articles = db.prepare(query).all(...params);
    res.json({ articles, count: articles.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/articles/today
 * Get today's articles.
 */
router.get('/today', (req, res) => {
  const db = getDb();
  try {
    const articles = db.prepare(`
      SELECT * FROM articles
      WHERE date(fetched_at) >= date('now', '-1 day')
      ORDER BY published_at DESC
      LIMIT 50
    `).all();
    res.json({ articles, count: articles.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/articles/:id/read
 * Mark an article as read/unread.
 */
router.patch('/:id/read', (req, res) => {
  const db = getDb();
  const { is_read } = req.body;
  try {
    db.prepare('UPDATE articles SET is_read = ? WHERE id = ?').run(
      is_read ? 1 : 0,
      req.params.id
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/articles/:id
 */
router.delete('/:id', (req, res) => {
  const db = getDb();
  try {
    db.prepare('DELETE FROM articles WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/articles/stats
 * Get article statistics.
 */
router.get('/stats', (req, res) => {
  const db = getDb();
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM articles').get();
    const unread = db.prepare('SELECT COUNT(*) as count FROM articles WHERE is_read = 0').get();
    const today = db.prepare(`SELECT COUNT(*) as count FROM articles WHERE date(fetched_at) >= date('now', '-1 day')`).get();
    const bySource = db.prepare(`
      SELECT source_name, COUNT(*) as count
      FROM articles
      GROUP BY source_name
      ORDER BY count DESC
    `).all();

    res.json({
      total: total.count,
      unread: unread.count,
      today: today.count,
      bySource,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
