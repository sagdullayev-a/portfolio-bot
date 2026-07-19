import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { SYSTEM_PROMPT } from '../constants/systemPrompt';

export interface ChatHistoryItem {
  role: 'user' | 'model';
  parts: Array<{ text: string }> | string;
}

// Daily quota ceiling to protect free-tier API limits
const DAILY_LIMIT = 1000;
let dailyCounter = 0;
let currentDay = new Date().getUTCDay();

function checkAndResetDailyCounter(): void {
  const today = new Date().getUTCDay();
  if (today !== currentDay) {
    currentDay = today;
    dailyCounter = 0;
    console.log('[aiChat] Daily quota counter reset for new day.');
  }
}

export function getQuotaStatus(): { count: number; limit: number; remaining: number } {
  checkAndResetDailyCounter();
  return {
    count: dailyCounter,
    limit: DAILY_LIMIT,
    remaining: Math.max(0, DAILY_LIMIT - dailyCounter),
  };
}

export async function generateAiReply(
  message: string,
  rawHistory?: ChatHistoryItem[],
): Promise<string> {
  if (!env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY_MISSING');
  }

  checkAndResetDailyCounter();

  if (dailyCounter >= DAILY_LIMIT) {
    throw new Error('DAILY_QUOTA_EXCEEDED');
  }

  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const modelsToTry = ['gemini-3.5-flash', 'gemini-3.1-pro', 'gemini-2.5-pro', 'gemini-2.0-flash'];

  // Format history for Gemini SDK
  const formattedHistory = (rawHistory || [])
    .filter((item) => item && (typeof item.parts === 'string' || Array.isArray(item.parts)))
    .map((item) => {
      let text = '';
      if (typeof item.parts === 'string') {
        text = item.parts;
      } else if (Array.isArray(item.parts) && item.parts[0]?.text) {
        text = item.parts[0].text;
      }
      return {
        role: item.role === 'model' ? 'model' : 'user',
        parts: [{ text }],
      };
    })
    .filter((item) => item.parts[0].text.trim() !== '');

  let lastError: unknown = null;
  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_PROMPT,
      });

      const chat = model.startChat({ history: formattedHistory });
      const result = await chat.sendMessage(message);
      const reply = result.response.text();

      dailyCounter++;
      console.log(
        `[aiChat] Request processed successfully using ${modelName}. Daily usage: ${dailyCounter}/${DAILY_LIMIT}`,
      );

      return reply;
    } catch (err: any) {
      lastError = err;
      if (err?.status === 404) {
        console.warn(`[aiChat] Model ${modelName} returned 404, trying next model...`);
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}
