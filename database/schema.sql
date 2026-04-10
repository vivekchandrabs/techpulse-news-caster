-- TechPulse Database Schema

CREATE TABLE IF NOT EXISTS sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'rss' CHECK(type IN ('rss', 'newsapi')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT NOT NULL UNIQUE,
  is_must_follow INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  source_name TEXT,
  source_url TEXT,
  original_link TEXT UNIQUE,
  original_content TEXT,
  summary TEXT,
  topic TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
  summarized_at TEXT
);

-- Default sources
INSERT OR IGNORE INTO sources (name, url, type) VALUES
  ('TechCrunch', 'https://techcrunch.com/feed/', 'rss'),
  ('The Verge', 'https://www.theverge.com/rss/index.xml', 'rss'),
  ('Ars Technica', 'https://feeds.arstechnica.com/arstechnica/index', 'rss'),
  ('Hacker News', 'https://hnrss.org/frontpage', 'rss'),
  ('MIT Tech Review', 'https://www.technologyreview.com/feed/', 'rss');

-- Default topics
INSERT OR IGNORE INTO topics (keyword, is_must_follow) VALUES
  ('AI', 1),
  ('Cybersecurity', 0),
  ('Space', 0),
  ('Startups', 0),
  ('Programming', 0);
