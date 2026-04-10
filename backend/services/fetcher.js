import RssParser from 'rss-parser';

const parser = new RssParser({
  timeout: 10000,
  headers: {
    'User-Agent': 'TechPulse/1.0 News Aggregator',
  },
});

/**
 * Fetch articles from a single RSS feed URL.
 * Returns an array of normalized article objects.
 */
export async function fetchRssFeed(source) {
  try {
    const feed = await parser.parseURL(source.url);
    const articles = (feed.items || []).slice(0, 15).map((item) => ({
      title: item.title || 'Untitled',
      source_name: source.name || feed.title || 'Unknown',
      source_url: source.url,
      original_link: item.link || '',
      original_content: cleanHtml(item.contentSnippet || item.content || item.summary || ''),
      published_at: item.isoDate || item.pubDate || new Date().toISOString(),
    }));

    console.log(`  ✓ Fetched ${articles.length} articles from ${source.name}`);
    return articles;
  } catch (err) {
    console.error(`  ✗ Failed to fetch ${source.name}: ${err.message}`);
    return [];
  }
}

/**
 * Fetch articles from all active sources.
 */
export async function fetchAllSources(sources) {
  console.log(`\n📡 Fetching from ${sources.length} sources...`);
  const results = await Promise.allSettled(
    sources.map((source) => fetchRssFeed(source))
  );

  const articles = results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value);

  console.log(`📦 Total articles collected: ${articles.length}`);
  return articles;
}

/**
 * Strip HTML tags and clean up whitespace.
 */
function cleanHtml(text) {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2000); // Cap content length
}
