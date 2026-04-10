import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

/**
 * GET /api/sources
 */
router.get('/', (req, res) => {
  const db = getDb();
  try {
    const sources = db.prepare('SELECT * FROM sources ORDER BY created_at DESC').all();
    res.json({ sources });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/sources
 */
router.post('/', (req, res) => {
  const db = getDb();
  const { name, url, type = 'rss' } = req.body;

  if (!name || !url) {
    return res.status(400).json({ error: 'Name and URL are required' });
  }

  try {
    const result = db.prepare(
      'INSERT INTO sources (name, url, type) VALUES (?, ?, ?)'
    ).run(name, url, type);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Source URL already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/sources/:id
 */
router.patch('/:id', (req, res) => {
  const db = getDb();
  const { active } = req.body;
  try {
    db.prepare('UPDATE sources SET active = ? WHERE id = ?').run(
      active ? 1 : 0,
      req.params.id
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/sources/:id
 */
router.delete('/:id', (req, res) => {
  const db = getDb();
  try {
    db.prepare('DELETE FROM sources WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
