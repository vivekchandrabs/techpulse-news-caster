import { Router } from 'express';
import { textToSpeech } from '../services/tts.js';
import { getDb } from '../db/database.js';

const router = Router();

/**
 * POST /api/audio/article/:id
 * Generate speech for a specific article using OpenAI TTS.
 * Returns: audio/mpeg stream
 */
router.post('/article/:id', async (req, res) => {
  const db = getDb();

  try {
    const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Compose narration text
    const narrationText = `${article.title}.\n\n${article.summary || article.original_content || ''}`;

    const response = await textToSpeech(narrationText);

    // Set headers for audio streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');

    // Stream the response body to client
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error('TTS Error:', err.message);
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
    console.error('TTS Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
