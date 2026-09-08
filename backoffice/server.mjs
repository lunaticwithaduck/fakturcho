import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';

const ROOT = resolve(join(import.meta.dirname, 'dist'));
const PORT = process.env.PORT ?? 3000;
const API_URL = process.env.API_URL ?? 'http://localhost:3001';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

async function resolveFile(pathname) {
  const candidate = resolve(join(ROOT, pathname));
  if (!candidate.startsWith(ROOT + sep)) {
    return join(ROOT, 'index.html');
  }
  try {
    const info = await stat(candidate);
    if (info.isFile()) return candidate;
  } catch {}
  return join(ROOT, 'index.html');
}

async function proxyApi(req, res) {
  const target = new URL(req.url ?? '/', API_URL);
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined || key === 'host' || key === 'connection' || key === 'accept-encoding')
      continue;
    headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  }

  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body,
    redirect: 'manual',
  });

  const STRIPPED = new Set([
    'set-cookie',
    'content-encoding',
    'content-length',
    'transfer-encoding',
  ]);
  const responseHeaders = {};
  for (const [key, value] of upstream.headers) {
    if (!STRIPPED.has(key.toLowerCase())) responseHeaders[key] = value;
  }
  const setCookie = upstream.headers.getSetCookie?.() ?? [];
  if (setCookie.length > 0) responseHeaders['set-cookie'] = setCookie;

  res.writeHead(upstream.status, responseHeaders);
  res.end(Buffer.from(await upstream.arrayBuffer()));
}

createServer(async (req, res) => {
  if (req.url?.startsWith('/api/')) {
    await proxyApi(req, res);
    return;
  }
  const url = new URL(req.url ?? '/', 'http://localhost');
  const filePath = await resolveFile(decodeURIComponent(url.pathname));
  const body = await readFile(filePath);
  res.writeHead(200, { 'content-type': MIME[extname(filePath)] ?? 'application/octet-stream' });
  res.end(body);
}).listen(PORT, () => {
  console.log(`backoffice listening on ${PORT}`);
});
