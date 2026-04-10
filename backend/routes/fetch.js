import { Router } from 'express';
import { getDb } from '../db/database.js';
import { fetchAllSources } from '../services/fetcher.js';
import { summarizeBatch } from '../services/summarizer.js';

const router = Router();

/**
 * POST /api/fetch
 * Manually trigger a fetch + summarize cycle.
 */
router.post('/', async (req, res) => {
  try {
    const db = getDb();

    // Get active sources
    const sources = db.prepare('SELECT * FROM sources WHERE active = 1').all();
    if (sources.length === 0) {
      return res.json({ message: 'No active sources configured', articles: 0 });
    }

    // Fetch articles
    const rawArticles = await fetchAllSources(sources);

    // Deduplicate against existing articles
    const existingLinks = new Set(
      db.prepare('SELECT original_link FROM articles').all().map((r) => r.original_link)
    );

    const newArticles = rawArticles.filter(
      (a) => a.original_link && !existingLinks.has(a.original_link)
    );

    if (newArticles.length === 0) {
      return res.json({ message: 'No new articles found', articles: 0 });
    }

    // Summarize
    const summarized = await summarizeBatch(newArticles.slice(0, 30)); // Cap at 30

    // Insert into database
    const insert = db.prepare(`
      INSERT OR IGNORE INTO articles (title, source_name, source_url, original_link, original_content, summary, narration, published_at, summarized_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((articles) => {
      for (const a of articles) {
        insert.run(
          a.title, a.source_name, a.source_url, a.original_link,
          a.original_content, a.summary, a.narration || null, a.published_at, a.summarized_at
        );
      }
    });

    insertMany(summarized);

    res.json({
      message: `Fetched and summarized ${summarized.length} new articles`,
      articles: summarized.length,
    });
  } catch (err) {

    res.status(500).json({ error: err.message });
  }
});

export default router;
