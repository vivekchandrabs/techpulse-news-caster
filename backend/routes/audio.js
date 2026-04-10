import { Router } from 'express';
import { textToSpeech } from '../services/tts.js';
import { generateNarration } from '../services/summarizer.js';
import { getDb } from '../db/database.js';

const router = Router();

/**
 * POST /api/audio/article/:id
 * Generate speech for a specific article using OpenAI TTS.
 * Uses the conversational narration text (not the bullet-point summary).
 * If no narration exists, generates one on-demand and caches it.
 * Returns: audio/mpeg stream
 */
router.post('/article/:id', async (req, res) => {
  const db = getDb();

  try {
    const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Get or generate narration text
    let narrationText = article.narration;

    if (!narrationText) {

      narrationText = await generateNarration(article);

      // Cache it in the database for next time
      try {
        db.prepare('UPDATE articles SET narration = ? WHERE id = ?').run(narrationText, article.id);

      } catch {
        // Non-critical — narration column might not exist yet
      }
    }

    // Generate audio from narration
    const response = await textToSpeech(narrationText);

    // Set headers and stream audio
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');

    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {

    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/audio/speak
 * Generate speech from raw text.
 * Body: { text: string }
 * Returns: audio/mpeg stream
 */
router.post('/speak', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const response = await textToSpeech(text);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');

    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {

    res.status(500).json({ error: err.message });
  }
});

export default router;
