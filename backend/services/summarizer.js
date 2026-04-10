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
 * Returns { summary, narration }
 *   - summary: bullet-point format for reading (under 200 words)
 *   - narration: conversational story for TTS (under 500 words, no links)
 */
export async function summarizeArticle(article) {
  const model = getClient();

  if (model) {
    return await geminiSummarize(model, article);
  } else {
    return {
      summary: extractiveSummary(article),
      narration: extractiveNarration(article),
    };
  }
}

/**
 * Use Google Gemini to generate both a reading summary and a narration script.
 */
async function geminiSummarize(model, article) {
  const content = article.original_content || 'No content available. Summarize based on the title.';

  // Generate bullet-point summary for reading
  const summaryPrompt = `You are a professional tech news summarizer. Create a concise summary of the given article in under 200 words. Use 3-5 bullet points. Be factual, clear, and informative. Start with a one-line headline summary, then bullet points. Do NOT use markdown formatting — use plain text with "•" for bullets.

Summarize this article:

Title: ${article.title}

Content: ${content}`;

  // Generate conversational narration for TTS
  const narrationPrompt = `You are a friendly and knowledgeable tech journalist telling a colleague about an interesting news story over coffee. Write a conversational narration of this article in under 500 words.

RULES:
- Write in a natural, spoken style — as if you're verbally explaining the story to someone
- Do NOT include any URLs, links, or web addresses
- Do NOT use bullet points, numbered lists, or any formatting
- Do NOT say things like "according to the article" or "the article mentions"
- Start by naturally introducing the topic (e.g., "So here's something interesting..." or "Big news from...")
- Include the key facts, why it matters, and any implications
- End with a brief takeaway or forward-looking thought
- Keep it engaging but factual — you're informing, not editorializing
- Use natural transitions between ideas

Article Title: ${article.title}
Source: ${article.source_name || 'Unknown'}

Article Content: ${content}`;

  try {
    // Run both prompts in parallel
    const [summaryResult, narrationResult] = await Promise.all([
      model.generateContent(summaryPrompt),
      model.generateContent(narrationPrompt),
    ]);

    return {
      summary: summaryResult.response.text().trim(),
      narration: narrationResult.response.text().trim(),
    };
  } catch (err) {

    return {
      summary: extractiveSummary(article),
      narration: extractiveNarration(article),
    };
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
 * Fallback: Create a basic narration from the content (no links).
 */
function extractiveNarration(article) {
  const content = (article.original_content || '')
    .replace(/https?:\/\/[^\s]+/g, '') // Strip URLs
    .replace(/\s+/g, ' ')
    .trim();

  if (!content) {
    return `Here's an interesting story: ${article.title}. Unfortunately, I don't have more details on this one, but you can check the source for the full article.`;
  }

  const sentences = content
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.length > 15)
    .slice(0, 8);

  return `Here's an interesting story. ${article.title}. ${sentences.join(' ')}`;
}

/**
 * Generate a narration script for an article on-demand (for articles that don't have one).
 */
export async function generateNarration(article) {
  const model = getClient();
  if (!model) {
    return extractiveNarration(article);
  }

  try {
    const prompt = `You are a friendly and knowledgeable tech journalist telling a colleague about an interesting news story over coffee. Write a conversational narration in under 500 words.

RULES:
- Write in a natural, spoken style — as if you're verbally explaining the story to someone
- Do NOT include any URLs, links, or web addresses
- Do NOT use bullet points, numbered lists, or any formatting
- Start by naturally introducing the topic
- Include the key facts, why it matters, and any implications
- End with a brief takeaway or forward-looking thought
- Keep it engaging but factual

Article Title: ${article.title}
Source: ${article.source_name || 'Unknown'}

Article Content: ${article.summary || article.original_content || article.title}`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {

    return extractiveNarration(article);
  }
}

/**
 * Summarize a batch of articles with rate limiting.
 */
export async function summarizeBatch(articles) {
  const model = getClient();
  const hasLLM = !!model;



  const results = [];
  for (const article of articles) {
    const { summary, narration } = await summarizeArticle(article);
    results.push({
      ...article,
      summary,
      narration,
      summarized_at: new Date().toISOString(),
    });

    // Rate limit for API calls
    if (hasLLM) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }


  return results;
}
