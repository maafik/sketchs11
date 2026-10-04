'use strict';
/**
 * Любимец — сервер сайта и приём заявок в мессенджер MAX.
 * Без внешних зависимостей, нужен Node.js 18+.
 *
 *   npm start            — запуск (http://localhost:3000)
 *   npm run get-chat-id  — узнать chat_id / user_id для .env
 */
require('./env');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.PORT) || 3000;
const MAX_BASE = (process.env.MAX_API_BASE || 'https://platform-api2.max.ru').replace(/\/+$/, '');
const TOKEN = (process.env.MAX_BOT_TOKEN || '').trim();
const CHAT_ID = (process.env.MAX_CHAT_ID || '').trim();
const USER_ID = (process.env.MAX_USER_ID || '').trim();
const TRUST_PROXY = process.env.TRUST_PROXY === '1';

const FORMATS = ['Художественная печать', 'Деревянный блок', 'Цифровой портрет'];
const MAX_PHOTOS = 3;
const MAX_PHOTO_BYTES = 6 * 1024 * 1024;
const MAX_BODY_BYTES = 14 * 1024 * 1024;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- защита от спама ---------- */
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const list = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  if (list.length >= 5) { hits.set(ip, list); return true; }
  list.push(now);
  hits.set(ip, list);
  return false;
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, list] of hits) {
    if (!list.some((t) => now - t < 15 * 60 * 1000)) hits.delete(ip);
  }
}, 10 * 60 * 1000).unref();

function clientIp(req) {
  if (TRUST_PROXY) {
    const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    if (fwd) return fwd;
  }
  return req.socket.remoteAddress || 'unknown';
}

/* ---------- MAX Bot API ---------- */
async function maxApi(method, pathname, body) {
  const res = await fetch(MAX_BASE + pathname, {
    method,
    headers: {
      Authorization: TOKEN, // токен без префикса Bearer
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* не JSON */ }
  return { ok: res.ok, status: res.status, json, text };
}

async function uploadPhoto(buf, mime, index) {
  const ticket = await maxApi('POST', '/uploads?type=image');
  if (!ticket.ok || !ticket.json || !ticket.json.url) {
    throw new Error(`uploads: ${ticket.status} ${ticket.text.slice(0, 200)}`);
  }
  const ext = mime === 'image/png' ? 'png' : mime === 'image/gif' ? 'gif' : 'jpg';
  const form = new FormData();
  form.append('data', new Blob([buf], { type: mime }), `photo-${index + 1}.${ext}`);
  const up = await fetch(ticket.json.url, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(30000),
  });
  const upJson = await up.json().catch(() => null);
  if (!up.ok) throw new Error(`upload url: ${up.status}`);

  let token = ticket.json.token;
  if (upJson && upJson.photos) {
    const first = Object.values(upJson.photos)[0];
    if (first && first.token) token = first.token;
  }
  if (!token && upJson && upJson.token) token = upJson.token;
  if (!token) throw new Error('upload: токен вложения не получен');
  return token;
}

async function sendMessage(text, tokens) {
  const target = CHAT_ID ? `chat_id=${encodeURIComponent(CHAT_ID)}` : `user_id=${encodeURIComponent(USER_ID)}`;
  const attachments = tokens.map((token) => ({ type: 'image', payload: { token } }));
  for (let i = 0; i < 6; i += 1) {
    const r = await maxApi('POST', `/messages?${target}`, attachments.length ? { text, attachments } : { text });
    if (r.ok) return;
    const notReady = (r.json && r.json.code === 'attachment.not.ready') || /not\.ready/.test(r.text);
    if (notReady) { await sleep(500 * 2 ** i); continue; } // файл ещё обрабатывается
    throw new Error(`messages: ${r.status} ${r.text.slice(0, 300)}`);
  }
  throw new Error('messages: вложения не успели обработаться');
}

/* ---------- приём заявки ---------- */
const oneLine = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const multiLine = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f]/g, '').replace(/\r\n?/g, '\n').trim().slice(0, max);

function sniff(buf) {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.length > 6 && buf.subarray(0, 3).toString('latin1') === 'GIF') return 'image/gif';
  return null;
}

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function readJson(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(new HttpError(413, 'Файлы слишком большие.')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { reject(new HttpError(400, 'Некорректный запрос.')); }
    });
    req.on('error', reject);
  });
}

function send(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

async function hostPublic(buf, mime, index) {
  const ext = mime === 'image/png' ? 'png' : 'jpg';
  const name = `photo-${index + 1}.${ext}`;
  const blob = new Blob([buf], { type: mime });

  try {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', blob, name);
    const res = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(30000),
    });
    const url = String(await res.text()).trim();
    if (res.ok && /^https?:\/\//i.test(url)) return url;
  } catch (e) {
    console.error('[host] catbox:', e.message);
  }

  const form = new FormData();
  form.append('file', blob, name);
  const res = await fetch('https://tmpfiles.org/api/v1/upload', {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(30000),
  });
  const json = await res.json().catch(() => null);
  let url = json && json.data && json.data.url;
  if (!url) throw new Error('Не удалось выложить фото');
  url = String(url).replace('http://', 'https://');
  if (!url.includes('/dl/')) url = url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
  return url;
}

async function handleHostPhotos(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Метод не поддерживается.' });
  if (rateLimited(clientIp(req))) {
    return send(res, 429, { error: 'Слишком много заявок подряд. Попробуйте позже.' });
  }
  let body;
  try { body = await readJson(req, MAX_BODY_BYTES); }
  catch (e) { return send(res, e.status || 400, { error: e.message }); }

  const rawPhotos = Array.isArray(body && body.photos) ? body.photos.slice(0, MAX_PHOTOS) : [];
  if (!rawPhotos.length) return send(res, 400, { error: 'Нет фото.' });

  const urls = [];
  for (let i = 0; i < rawPhotos.length; i += 1) {
    const b64 = String((rawPhotos[i] && rawPhotos[i].data) || '').replace(/^data:[^,]*,/, '');
    const buf = Buffer.from(b64, 'base64');
    const mime = sniff(buf) || 'image/jpeg';
    if (!buf.length || buf.length > MAX_PHOTO_BYTES) {
      return send(res, 400, { error: 'Фото не подошло. Загрузите JPG или PNG до 6 МБ.' });
    }
    urls.push(await hostPublic(buf, mime, i));
  }
  return send(res, 200, { ok: true, urls });
}

async function handleOrder(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Метод не поддерживается.' });
  if (rateLimited(clientIp(req))) {
    return send(res, 429, { error: 'Слишком много заявок подряд. Попробуйте позже.' });
  }

  let body;
  try { body = await readJson(req, MAX_BODY_BYTES); }
  catch (e) { return send(res, e.status || 400, { error: e.message }); }
  if (!body || typeof body !== 'object') return send(res, 400, { error: 'Некорректный запрос.' });

  if (body.website) return send(res, 200, { ok: true }); // заполнено скрытое поле — это бот

  const name = oneLine(body.name, 80);
  const contact = oneLine(body.contact, 120);
  const style = oneLine(body.style, 80) || 'Подобрать за меня';
  const format = FORMATS.includes(body.format) ? body.format : '';
  const comment = multiLine(body.comment, 1000);

  if (name.length < 2) return send(res, 400, { error: 'Укажите ваше имя.' });
  if (contact.length < 3) return send(res, 400, { error: 'Укажите, как с вами связаться.' });
  if (!format) return send(res, 400, { error: 'Выберите формат портрета.' });
  if (body.consent !== true) return send(res, 400, { error: 'Нужно согласие на обработку персональных данных.' });

  const rawPhotos = Array.isArray(body.photos) ? body.photos.slice(0, MAX_PHOTOS) : [];
  if (!rawPhotos.length) return send(res, 400, { error: 'Добавьте хотя бы одно фото.' });
  const photos = [];
  for (const p of rawPhotos) {
    const b64 = String((p && p.data) || '').replace(/^data:[^,]*,/, '');
    const buf = Buffer.from(b64, 'base64');
    const mime = sniff(buf);
    if (!buf.length || buf.length > MAX_PHOTO_BYTES || !mime) {
      return send(res, 400, { error: 'Фото не подошло. Загрузите JPG или PNG до 6 МБ.' });
    }
    photos.push({ buf, mime });
  }

  if (!TOKEN || !(CHAT_ID || USER_ID)) {
    console.error('[order] MAX_BOT_TOKEN и MAX_CHAT_ID/MAX_USER_ID не заданы в .env');
    return send(res, 503, { error: 'Приём заявок временно недоступен. Напишите нам в MAX.' });
  }

  // Фото грузим по очереди. Если какое-то не загрузилось, заявка всё равно уходит.
  const tokens = [];
  let failed = 0;
  for (let i = 0; i < photos.length; i += 1) {
    try { tokens.push(await uploadPhoto(photos[i].buf, photos[i].mime, i)); }
    catch (e) { failed += 1; console.error('[order] фото не загрузилось:', e.message); }
  }

  const when = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
  const lines = [
    '🆕 Новая заявка · Любимец',
    '',
    `Имя: ${name}`,
    `Связь: ${contact}`,
    `Стиль: ${style}`,
    `Формат: ${format}`,
    `Фото: ${photos.length}${failed ? ` (приложить не удалось: ${failed})` : ''}`,
  ];
  if (comment) lines.push('', `Комментарий: ${comment}`);
  lines.push('', `Получена: ${when} (МСК)`);
  const text = lines.join('\n');

  try {
    try { await sendMessage(text, tokens); }
    catch (e) {
      if (!tokens.length) throw e;
      console.error('[order] со вложениями не ушло, шлём без них:', e.message);
      await sendMessage(text + '\n\n⚠️ Фото приложить не удалось, запросите их у клиента.', []);
    }
  } catch (e) {
    console.error('[order] MAX не принял заявку:', e.message);
    return send(res, 502, { error: 'Не удалось отправить заявку. Попробуйте ещё раз или напишите нам в MAX.' });
  }
  return send(res, 200, { ok: true });
}

/* ---------- статические файлы (только сайт, без server.js и .env) ---------- */
const ROOT = __dirname;
const ALLOWED = /^\/(?:index\.html|favicon\.svg|ps-[a-z0-9-]+\.jpg|css\/[\w.-]+\.css|js\/[\w.-]+\.js)?$/;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
};

function serveStatic(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname); }
  catch { res.writeHead(400); return res.end(); }
  if (pathname === '/') pathname = '/index.html';
  if (!ALLOWED.test(pathname)) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Не найдено'); }

  const file = path.join(ROOT, pathname);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Не найдено'); }
    const ext = path.extname(file);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': data.length,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
}

const server = http.createServer((req, res) => {
  const pathname = (req.url || '').split('?')[0];
  if (pathname === '/api/host-photos') {
    handleHostPhotos(req, res).catch((e) => {
      console.error('[host] ошибка:', e);
      if (!res.headersSent) send(res, 500, { error: 'Не удалось выложить фото.' });
    });
    return;
  }
  if (pathname === '/api/order') {
    handleOrder(req, res).catch((e) => {
      console.error('[order] ошибка:', e);
      if (!res.headersSent) send(res, 500, { error: 'Ошибка сервера. Попробуйте позже.' });
    });
    return;
  }
  if (pathname === '/api/health') return send(res, 200, { ok: true, max: Boolean(TOKEN && (CHAT_ID || USER_ID)) });
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Любимец: http://localhost:${PORT}`);
  if (!TOKEN || !(CHAT_ID || USER_ID)) {
    console.warn('⚠️  MAX не настроен: заполните MAX_BOT_TOKEN и MAX_CHAT_ID (или MAX_USER_ID) в файле .env');
  }
});
