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
  const narrationPrompt = `You are a tech podcast host delivering a segment to your listeners. Based on the article below, craft an engaging conversational narration in under 500 words.

CRITICAL RULES:
- This is a SPOKEN narration — write exactly how you would SAY this out loud to someone
- Create an ORIGINAL story from the facts. Do NOT just read or rephrase the article content line by line
- Do NOT include any URLs, links, web addresses, or references like "click here" or "link below"
- Do NOT use bullet points, numbered lists, dashes, or any visual formatting
- Do NOT say things like "according to the article" or "the article mentions" or "the report states"
- Do NOT start with generic phrases like "Here's an interesting story" or "So here's something interesting" or "Let me tell you about"
- Instead, open with a punchy, context-specific hook that grabs attention immediately. Jump right into what happened or why it matters. Examples:
  * "Apple just dropped something big..."
  * "If you're running Linux, you'll want to hear this..."
  * "The EU is about to change how every tech company operates..."
  * "A seventeen-year-old just outsmarted one of the biggest security firms..."
  The opening must be specific to THIS article — never generic.
- Weave the key facts into a flowing narrative — explain what happened, who's involved, why it matters, and what comes next
- Use natural spoken transitions like "Now what's really interesting is..." or "And that's not all..." or "The bigger picture here is..."
- End with a brief forward-looking thought or takeaway
- Sound like a real human having a conversation, not a news anchor reading a teleprompter

Article Title: ${article.title}
Source: ${article.source_name || 'Unknown'}

Source Material:
${content}`;

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

  return `${article.title}. ${sentences.join(' ')}`;
}

/**
 * Generate a narration script for an article on-demand (for articles that don't have one).
 * Uses original_content first for richer narration, falls back to summary.
 */
export async function generateNarration(article) {
  const model = getClient();
  if (!model) {
    return extractiveNarration(article);
  }

  // Prefer original content over summary — summary is bullet points which leads to robotic narration
  const sourceContent = article.original_content || article.summary || article.title;

  try {
    const prompt = `You are a tech podcast host delivering a segment to your listeners. Based on the source material below, craft an engaging conversational narration in under 500 words.

CRITICAL RULES:
- This is a SPOKEN narration — write exactly how you would SAY this out loud to someone
- Create an ORIGINAL story from the facts. Do NOT just read or rephrase the source material line by line
- Do NOT include any URLs, links, web addresses, or references like "click here" or "link below"
- Do NOT use bullet points, numbered lists, dashes, or any visual formatting
- Do NOT start with generic phrases like "Here's an interesting story" or "So here's something interesting" or "Let me tell you about"
- Instead, open with a punchy, context-specific hook that grabs attention immediately. Jump right into what happened or why it matters
- Weave the key facts into a flowing narrative — explain what happened, who's involved, why it matters, and what comes next
- Use natural spoken transitions like "Now what's really interesting is..." or "And that's not all..." or "The bigger picture here is..."
- End with a brief forward-looking thought or takeaway
- Sound like a real human having a conversation, not a news anchor reading a teleprompter

Article Title: ${article.title}
Source: ${article.source_name || 'Unknown'}

Source Material:
${sourceContent}`;

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
