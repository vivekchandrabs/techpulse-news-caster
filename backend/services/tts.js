import OpenAI from 'openai';

let openai;

function getClient() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

/**
 * OpenAI TTS Service using gpt-4o-mini-tts with coral voice.
 * Generates natural-sounding female narration for news articles.
 */

const NARRATION_INSTRUCTIONS = `Affect: Warm, professional, and engaging, like a polished podcast host delivering a morning tech briefing.

Tone: Confident, clear, and conversational — informative without being dry. Think of a trusted tech journalist.

Emotion: Genuine curiosity and enthusiasm for technology, tempered with calm authority. Convey the significance of each story naturally.

Pronunciation: Crisp and natural. Technical terms, company names, and acronyms should be pronounced clearly and correctly.

Pace: Moderate and steady, with slight pauses between bullet points to let information land. Speed up slightly for exciting developments, slow down for critical security or policy news.

Pause: Brief pauses after the article title before starting the summary. Natural breathing pauses between bullet points.`;

/**
 * Generate speech audio from text using OpenAI TTS.
 * Returns a Response object with audio/mpeg body.
 */
export async function textToSpeech(text) {
  const client = getClient();
  if (!client) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const response = await client.audio.speech.create({
    model: 'gpt-4o-mini-tts',
    voice: 'coral',
    input: text.slice(0, 4096), // API character limit
    instructions: NARRATION_INSTRUCTIONS,
    response_format: 'mp3',
  });

  return response;
}
