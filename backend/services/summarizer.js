import { GoogleGenerativeAI } from '@google/generative-ai';

let geminiModel;

function getClient() {
  if (!geminiModel && process.env.GEMINI_API_KEY) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }
  return geminiModel;
}

/**
 * Summarize article content using an LLM.
 * Falls back to a basic extractive summary if no API key is configured.
 */
export async function summarizeArticle(article) {
  const model = getClient();

  if (model) {
    return await geminiSummarize(model, article);
  } else {
    return extractiveSummary(article);
  }
}

/**
 * Use Google Gemini to generate a concise summary.
 */
async function geminiSummarize(model, article) {
  try {
    const prompt = `You are a professional tech news summarizer. Create a concise summary of the given article in under 200 words. Use 3-5 bullet points. Be factual, clear, and informative. Start with a one-line headline summary, then bullet points. Do NOT use markdown formatting — use plain text with "•" for bullets.

Summarize this article:

Title: ${article.title}

Content: ${article.original_content || 'No content available. Summarize based on the title.'}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return text.trim();
  } catch (err) {
    console.error(`  ✗ Gemini summary failed for "${article.title}": ${err.message}`);
    return extractiveSummary(article);
  }
}

/**
 * Fallback: Create a basic extractive summary from the content.
 */
function extractiveSummary(article) {
  const content = article.original_content || '';
  if (!content) {
    return `${article.title}\n\n• Full article available at the source link.\n• No detailed content was available for summarization.`;
  }

  // Take the first few sentences
  const sentences = content
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.length > 20)
    .slice(0, 5);

  if (sentences.length === 0) {
    return `${article.title}\n\n• ${content.slice(0, 200)}...`;
  }

  const bullets = sentences.map((s) => `• ${s.trim()}`).join('\n');
  return `${article.title}\n\n${bullets}`;
}

/**
 * Summarize a batch of articles with rate limiting.
 */
export async function summarizeBatch(articles) {
  const model = getClient();
  const hasLLM = !!model;

  console.log(`\n🤖 Summarizing ${articles.length} articles ${hasLLM ? '(Gemini)' : '(extractive fallback)'}...`);

  const results = [];
  for (const article of articles) {
    const summary = await summarizeArticle(article);
    results.push({ ...article, summary, summarized_at: new Date().toISOString() });

    // Rate limit for API calls
    if (hasLLM) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log(`✅ Summarized ${results.length} articles`);
  return results;
}
