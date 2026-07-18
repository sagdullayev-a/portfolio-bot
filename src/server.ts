import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { notifyAdmin } from './services/notifier';
import { generateAiReply, ChatHistoryItem } from './services/aiChat';
import { env } from './config/env';

const app = express();

// ── JSON body parser ──────────────────────────────────────────────────────────
app.use(express.json());

// ── CORS ──────────────────────────────────────────────────────────────────────
// Production: only the real portfolio domain.
// Development: also allow the local Vite dev server.
const allowedOrigins: string[] = [env.PORTFOLIO_WEBSITE_URL];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests (no Origin header) only in development
      if (!origin) {
        if (env.NODE_ENV !== 'production') return callback(null, true);
        return callback(new Error('Origin required in production'));
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Allow any localhost port in development
      if (env.NODE_ENV !== 'production') {
        const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
        if (isLocalhost) {
          return callback(null, true);
        }
      }
      return callback(new Error(`CORS: origin "${origin}" is not allowed`));
    },
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  }),
);

// ── Rate limiting ─────────────────────────────────────────────────────────────
// Max 5 contact-form submissions per minute per IP.
const contactLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please wait a moment and try again.' },
});

// ── POST /notify/contact ──────────────────────────────────────────────────────
app.post('/notify/contact', contactLimiter, async (req, res) => {
  const { name, email, telegramUsername, phone, message } = req.body as Record<string, unknown>;

  // Basic type validation
  if (!name || !message || typeof name !== 'string' || typeof message !== 'string') {
    return res.status(400).json({ error: 'Invalid input: "name" and "message" are required strings.' });
  }

  // Length guards
  if (name.length > 200 || message.length > 2000) {
    return res.status(400).json({ error: 'Input too long.' });
  }
  if (email !== undefined && (typeof email !== 'string' || email.length > 200)) {
    return res.status(400).json({ error: 'Invalid email field.' });
  }
  if (telegramUsername !== undefined && (typeof telegramUsername !== 'string' || telegramUsername.length > 100)) {
    return res.status(400).json({ error: 'Invalid Telegram username field.' });
  }
  if (phone !== undefined && (typeof phone !== 'string' || phone.length > 50)) {
    return res.status(400).json({ error: 'Invalid phone field.' });
  }

  try {
    const details: Record<string, string> = {
      name: name.trim(),
    };
    if (typeof email === 'string' && email.trim()) details.email = email.trim();
    if (typeof telegramUsername === 'string' && telegramUsername.trim()) details.telegramUsername = telegramUsername.trim();
    if (typeof phone === 'string' && phone.trim()) details.phone = phone.trim();
    details.message = message.trim();

    await notifyAdmin({
      type: 'contact_form',
      title: 'New contact form submission',
      details,
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[server] notifyAdmin failed:', err);
    return res.status(500).json({ error: 'Failed to send notification.' });
  }
});

// ── Rate limiting for AI Chat ─────────────────────────────────────────────────
// Max 10 AI chat requests per minute per IP (protecting free tier limits)
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many chat requests — please wait a minute and try again.' },
});

// ── POST /chat ───────────────────────────────────────────────────────────────
app.post('/chat', chatLimiter, async (req, res) => {
  const { message, history } = req.body as Record<string, unknown>;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Invalid message: "message" field is required.' });
  }

  if (message.length > 1000) {
    return res.status(400).json({ error: 'Message too long (max 1000 characters).' });
  }

  try {
    const userMsg = message.trim();
    const reply = await generateAiReply(userMsg, history as ChatHistoryItem[]);
    return res.status(200).json({ reply });
  } catch (err: any) {
    if (err?.message === 'GEMINI_API_KEY_MISSING') {
      return res.status(503).json({ error: 'AI chat service is not configured yet.' });
    }
    if (err?.message === 'DAILY_QUOTA_EXCEEDED') {
      return res.status(429).json({ error: 'AI chat is temporarily unavailable, please try the quick questions instead.' });
    }
    if (err?.status === 429 || String(err?.message).includes('429')) {
      return res.status(429).json({ error: 'AI is temporarily rate limited by Google. Please try again in a few seconds.' });
    }

    console.error('[server] Gemini chat failed:', err);
    return res.status(500).json({ error: 'AI is temporarily unavailable, please try again.' });
  }
});

// ── Health check (useful for uptime monitors) ─────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ── Global error handler (catches CORS rejections etc.) ───────────────────────
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (err.message.startsWith('CORS:')) {
      return res.status(403).json({ error: 'Forbidden: origin not allowed.' });
    }
    console.error('[server] Unhandled error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  },
);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 3001);

export function startServer(): void {
  app.listen(PORT, () => {
    console.log(`[server] Notify server listening on port ${PORT}`);
    console.log(
      `[server] Allowed CORS origins: ${allowedOrigins.join(', ')}${
        env.NODE_ENV !== 'production' ? ' (+ http://localhost:* in dev mode)' : ''
      }`,
    );
  });
}
