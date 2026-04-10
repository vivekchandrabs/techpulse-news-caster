#!/usr/bin/env node

/**
 * TechPulse Daily Fetch Script
 * Run this as a cron job: 0 0 * * * node /path/to/daily-fetch.js
 * Or manually: npm run fetch
 */

import 'dotenv/config';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Ensure we can resolve the database path
const __dirname = dirname(fileURLToPath(import.meta.url));
process.chdir(join(__dirname, '..'));

import { getDb, closeDb } from '../backend/db/database.js';
import { fetchAllSources } from '../backend/services/fetcher.js';
import { summarizeBatch } from '../backend/services/summarizer.js';

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  TechPulse — Daily News Fetch');
  console.log(`  ${new Date().toLocaleString()}`);
  console.log('═══════════════════════════════════════');

  const db = getDb();

  // Get active sources
  const sources = db.prepare('SELECT * FROM sources WHERE active = 1').all();
  console.log(`\n📋 Active sources: ${sources.length}`);
  sources.forEach((s) => console.log(`   • ${s.name} (${s.type})`));

  // Fetch articles
  const rawArticles = await fetchAllSources(sources);

  // Deduplicate
  const existingLinks = new Set(
    db.prepare('SELECT original_link FROM articles').all().map((r) => r.original_link)
  );

  const newArticles = rawArticles.filter(
    (a) => a.original_link && !existingLinks.has(a.original_link)
  );

  console.log(`\n🆕 New articles: ${newArticles.length} (${rawArticles.length - newArticles.length} duplicates skipped)`);

  if (newArticles.length === 0) {
    console.log('\n✅ No new articles to process. Done!');
    closeDb();
    return;
  }

  // Summarize (cap at 30 to manage API costs)
  const toProcess = newArticles.slice(0, 30);
  const summarized = await summarizeBatch(toProcess);

  // Insert into database
  const insert = db.prepare(`
    INSERT OR IGNORE INTO articles (title, source_name, source_url, original_link, original_content, summary, published_at, summarized_at)
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

  console.log(`\n✅ Done! Inserted ${summarized.length} new articles.`);
  closeDb();
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  closeDb();
  process.exit(1);
});
