import { getDb, closeDb } from '../../backend/db/database.js';
import { fetchAllSources } from '../../backend/services/fetcher.js';
import { summarizeBatch } from '../../backend/services/summarizer.js';

/**
 * Vercel Cron Job Handler
 *
 * This endpoint is called automatically by Vercel Cron at midnight UTC daily.
 * Configured in vercel.json: { "path": "/api/cron", "schedule": "0 0 * * *" }
 *
 * It performs the full news pipeline:
 *   1. Fetch articles from active RSS sources
 *   2. Deduplicate against existing articles
 *   3. Summarize new articles using Gemini
 *   4. Store in database
 *
 * Security: Vercel sets the `CRON_SECRET` env var and sends it as
 * an `Authorization` header. We validate this to prevent unauthorized triggers.
 */
export default async function handler(req, res) {
  // ── Security: Only allow GET (Vercel cron) and POST (manual trigger) ──
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Verify Vercel Cron secret (prevents external abuse) ──
  if (process.env.CRON_SECRET) {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  console.log(`⏰ Cron triggered at ${new Date().toISOString()}`);

  try {
    const db = getDb();

    // 1. Get active sources
    const sources = db.prepare('SELECT * FROM sources WHERE active = 1').all();
    if (sources.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No active sources configured',
        articles: 0,
      });
    }

    // 2. Fetch articles from RSS feeds
    const rawArticles = await fetchAllSources(sources);

    // 3. Deduplicate against existing articles
    const existingLinks = new Set(
      db.prepare('SELECT original_link FROM articles').all().map((r) => r.original_link)
    );

    const newArticles = rawArticles.filter(
      (a) => a.original_link && !existingLinks.has(a.original_link)
    );

    if (newArticles.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No new articles found',
        fetched: rawArticles.length,
        new: 0,
      });
    }

    // 4. Summarize using Gemini (cap at 30 to stay within limits)
    const summarized = await summarizeBatch(newArticles.slice(0, 30));

    // 5. Insert into database
    const insert = db.prepare(`
      INSERT OR IGNORE INTO articles
        (title, source_name, source_url, original_link, original_content, summary, published_at, summarized_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((articles) => {
      for (const a of articles) {
        insert.run(
          a.title, a.source_name, a.source_url, a.original_link,
          a.original_content, a.summary, a.published_at, a.summarized_at
        );
      }
    });

    insertMany(summarized);

    const result = {
      success: true,
      message: `Fetched and summarized ${summarized.length} new articles`,
      fetched: rawArticles.length,
      duplicatesSkipped: rawArticles.length - newArticles.length,
      new: summarized.length,
      timestamp: new Date().toISOString(),
    };

    console.log(`✅ Cron complete:`, result);
    return res.status(200).json(result);
  } catch (err) {
    console.error('❌ Cron failed:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}
