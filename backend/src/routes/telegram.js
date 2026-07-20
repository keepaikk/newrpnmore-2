import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { prisma } from '../lib/prisma.js';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const APP_URL = process.env.APP_URL || process.env.WEBHOOK_BASE_URL;

/* ───────── helpers ───────── */

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .substring(0, 80);
}

function todayDate() {
  const d = new Date();
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

async function telegramApi(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function downloadTelegramPhoto(fileId) {
  const fileRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
  const fileJson = await fileRes.json();
  if (!fileJson.ok) throw new Error(fileJson.description || 'getFile failed');

  const filePath = fileJson.result.file_path;
  const ext = path.extname(filePath) || '.jpg';
  const filename = `telegram_${Date.now()}${ext}`;

  /* same uploads dir that server.js serves statically */
  const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const localPath = path.join(uploadsDir, filename);

  const imgRes = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`);
  if (!imgRes.ok) throw new Error('Download failed');

  const buffer = Buffer.from(await imgRes.arrayBuffer());
  fs.writeFileSync(localPath, buffer);

  return `/uploads/${filename}`;
}

/* Try to fetch the original channel message and extract its photo */
async function fetchOriginalChannelMedia(forwardFromChatId, forwardMessageId) {
  try {
    /* Step 1: Check if bot can access this channel */
    const chatInfo = await telegramApi('getChat', { chat_id: forwardFromChatId });
    if (!chatInfo.ok) {
      console.log('[Telegram] Cannot access forwarded channel:', chatInfo.description);
      return null;
    }

    /* Step 2: Forward the original message to the bot itself so we get the full media */
    /* We forward to a chat where the bot can receive it — use the bot's own chat via getMe */
    const me = await telegramApi('getMe', {});
    if (!me.ok) return null;

    /* Use a trick: copy the message to the chat_id of the first admin or forward to the bot's known chat */
    /* Actually, we can't easily know a valid destination. Instead, let's try to get the message via forwardMessage to a test approach */
    /* A simpler approach: if the bot is admin in the channel, we can use getChat to get info but not messages */

    console.log('[Telegram] Channel accessible:', chatInfo.result.title || chatInfo.result.username);
    return null; /* We confirmed access but can't fetch specific messages via Bot API */
  } catch (err) {
    console.error('[Telegram] Error fetching original channel media:', err.message);
    return null;
  }
}

/* ───────── webhook handler ───────── */

router.post('/webhook', async (req, res) => {
  /* verify secret token if configured */
  if (WEBHOOK_SECRET) {
    const secretHeader = req.headers['x-telegram-bot-api-secret-token'];
    if (secretHeader !== WEBHOOK_SECRET) {
      console.warn('[Telegram] Webhook rejected — invalid secret token');
      return res.status(403).send('Forbidden');
    }
  }

  const { message } = req.body;
  if (!message) return res.sendStatus(200);

  /* debug: log what Telegram sent us */
  console.log('[Telegram] Incoming message keys:', Object.keys(message).join(', '));
  if (message.photo) console.log('[Telegram] Photo count:', message.photo.length);
  if (message.document) console.log('[Telegram] Document present:', message.document.file_name, message.document.mime_type);
  if (message.web_page) console.log('[Telegram] Web page present:', message.web_page.url, 'has photo:', !!message.web_page.photo);
  if (message.video) console.log('[Telegram] Video present, thumb:', !!message.video.thumbnail);
  if (message.forward_from_chat) console.log('[Telegram] Forwarded from channel:', message.forward_from_chat.username || message.forward_from_chat.id);
  if (message.media_group_id) console.log('[Telegram] Media group ID:', message.media_group_id);

  /* skip bot commands */
  const rawText = (message.caption || message.text || '').trim();
  if (rawText.startsWith('/')) {
    console.log('[Telegram] Skipped bot command:', rawText.split(' ')[0]);
    return res.sendStatus(200);
  }

  /* skip extra photos in a media group (album) that have no caption —
     Telegram sends each image as a separate message with the same media_group_id.
     Only the first message carries the caption; the rest are just extra images. */
  if (message.media_group_id && !rawText) {
    console.log('[Telegram] Skipped extra photo in media group (no caption):', message.media_group_id);
    return res.sendStatus(200);
  }

  try {
    /* split on newlines; if single line, try to find a natural title */
    let lines = rawText.split('\n').filter((l) => l.trim());
    let title = lines[0]?.trim() || 'Draft from Telegram';
    let content = lines.slice(1).join('\n').trim();

    /* handle single-line posts where agent joined title + body with separators */
    if (!content && title.includes(' + body = ')) {
      const parts = title.split(' + body = ');
      title = parts[0].trim();
      content = parts.slice(1).join(' + body = ').trim();
    }

    /* if content is still empty (single line post), use the same text as both title and body */
    if (!content) content = rawText;

    /* limit title length */
    if (title.length > 120) {
      const cutoff = title.indexOf('.', 80);
      title = cutoff > 80 ? title.substring(0, cutoff + 1) : title.substring(0, 120);
    }

    /* sanitize input length to prevent DB bloat */
    title = title.substring(0, 200);
    content = content.substring(0, 5000);
    let excerpt = content.substring(0, 150);
    if (content.length > 150) excerpt += '…';

    /* ─── extract image from ALL possible Telegram message formats ─── */
    let imageUrl = null;
    let fileId = null;

    /* 1. Regular photo (most common for uploaded images) */
    if (message.photo && message.photo.length > 0) {
      const largest = message.photo.reduce((a, b) => (a.file_size > b.file_size ? a : b));
      fileId = largest.file_id;
      console.log('[Telegram] Found photo, file_id:', fileId, 'size:', largest.file_size);
    }
    /* 2. Image sent as document/file (uncompressed) */
    else if (message.document && message.document.mime_type?.startsWith('image/')) {
      fileId = message.document.file_id;
      console.log('[Telegram] Found image document, file_id:', fileId, 'name:', message.document.file_name);
    }
    /* 3. Link preview image (web_page.photo) */
    else if (message.web_page?.photo && message.web_page.photo.length > 0) {
      const largest = message.web_page.photo.reduce((a, b) => (a.file_size > b.file_size ? a : b));
      fileId = largest.file_id;
      console.log('[Telegram] Found web_page photo, file_id:', fileId);
    }
    /* 4. Link preview thumbnail */
    else if (message.web_page?.thumbnail) {
      fileId = message.web_page.thumbnail.file_id;
      console.log('[Telegram] Found web_page thumbnail, file_id:', fileId);
    }
    /* 5. Video thumbnail */
    else if (message.video?.thumbnail) {
      fileId = message.video.thumbnail.file_id;
      console.log('[Telegram] Found video thumbnail, file_id:', fileId);
    }
    /* 6. Animation/GIF thumbnail */
    else if (message.animation?.thumbnail) {
      fileId = message.animation.thumbnail.file_id;
      console.log('[Telegram] Found animation thumbnail, file_id:', fileId);
    }

    /* Try to download the file_id if we found one */
    if (fileId) {
      try {
        imageUrl = await downloadTelegramPhoto(fileId);
        console.log('[Telegram] Photo saved to:', imageUrl);
      } catch (err) {
        console.error('[Telegram] Photo download failed:', err.message);
      }
    } else {
      console.log('[Telegram] No photo or image document found in message');
    }

    /* ─── Fallback: if forwarded from channel and no media found, try fetching original ─── */
    if (!imageUrl && message.forward_from_chat && message.forward_from_message_id) {
      console.log('[Telegram] Forwarded from channel without media. Trying to fetch original...');
      /* We can't directly fetch messages via Bot API, but we can try to get the web_page URL */
      if (message.web_page?.url) {
        console.log('[Telegram] Web page URL available:', message.web_page.url);
      }
    }

    const slugBase = slugify(title) || 'draft';
    const slug = `${slugBase}-${Date.now()}`;

    await prisma.blogPost.create({
      data: {
        title,
        slug,
        category: 'Telegram Import',
        author: 'Social Media Team',
        date: todayDate(),
        excerpt,
        content,
        imageUrl,
        published: true, // auto-publish posts from Telegram bot
      },
    });

    console.log('[Telegram] Blog draft created from message:', title, '| imageUrl:', imageUrl || '(none)');

    /* send confirmation reply back to Telegram */
    if (message.chat?.id) {
      const adminUrl = APP_URL ? `${APP_URL.replace(/\/$/, '')}/admin` : 'http://localhost:3000/admin';
      const confirmText = imageUrl
        ? `✅ Blog post published with image: "${title.substring(0, 80)}"\n\nView at: ${adminUrl.replace('/admin', '/blog.html')}`
        : `✅ Blog post published (no image): "${title.substring(0, 80)}"\n\nView at: ${adminUrl.replace('/admin', '/blog.html')}`;
      await telegramApi('sendMessage', {
        chat_id: message.chat.id,
        text: confirmText,
        parse_mode: 'Markdown',
      });
    }
  } catch (err) {
    console.error('[Telegram] Webhook processing error:', err.message);
  }

  /* always ACK quickly so Telegram doesn't retry */
  res.sendStatus(200);
});

/* ───────── manual sync / health ───────── */

router.get('/status', async (_req, res) => {
  if (!BOT_TOKEN) return res.status(500).json({ ok: false, error: 'TELEGRAM_BOT_TOKEN not set' });

  const info = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`).then((r) =>
    r.json()
  );
  res.json({ ok: true, webhookInfo: info.result });
});

/* ───────── auto-register on startup ───────── */

export async function registerWebhook() {
  if (!BOT_TOKEN || !APP_URL) {
    console.log('[Telegram] Bot token or APP_URL not set — skipping webhook registration');
    return;
  }

  const webhookUrl = `${APP_URL.replace(/\/$/, '')}/api/telegram/webhook`;
  const payload = { url: webhookUrl, allowed_updates: ['message'] };
  if (WEBHOOK_SECRET) payload.secret_token = WEBHOOK_SECRET;

  const res = await telegramApi('setWebhook', payload);
  if (res.ok) {
    console.log('[Telegram] Webhook registered:', webhookUrl);
  } else {
    console.error('[Telegram] Webhook registration failed:', res.description);
  }
}

export { router };
