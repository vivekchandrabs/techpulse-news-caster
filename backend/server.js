import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getDb, closeDb } from './db/database.js';
import articlesRouter from './routes/articles.js';
import sourcesRouter from './routes/sources.js';
import topicsRouter from './routes/topics.js';
import fetchRouter from './routes/fetch.js';
import audioRouter from './routes/audio.js';
import { fetchAllSources } from './services/fetcher.js';
import { summarizeBatch } from './services/summarizer.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/articles', articlesRouter);
app.use('/api/sources', sourcesRouter);
app.use('/api/topics', topicsRouter);
app.use('/api/fetch', fetchRouter);
app.use('/api/audio', audioRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Schedule daily fetch at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    const db = getDb();
    const sources = db.prepare('SELECT * FROM sources WHERE active = 1').all();
    const rawArticles = await fetchAllSources(sources);

    const existingLinks = new Set(
      db.prepare('SELECT original_link FROM articles').all().map((r) => r.original_link)
    );

    const newArticles = rawArticles.filter(
      (a) => a.original_link && !existingLinks.has(a.original_link)
    );

    if (newArticles.length > 0) {
      const summarized = await summarizeBatch(newArticles.slice(0, 30));

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
      // Daily fetch complete
    } else {
      // No new articles found
    }
  } catch (err) {
    // Daily fetch failed
  }
});

// Initialize database on startup
getDb();

// Start server
app.listen(PORT, () => {
  // Server started
});

// Graceful shutdown
process.on('SIGINT', () => {
  closeDb();
  process.exit(0);
});
