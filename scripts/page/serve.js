import { watch } from 'node:fs';
import path from 'node:path';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

import bundle from './helpers/build.js';
import { SOURCE_PATH, DIST_PATH } from './helpers/paths.js';

const PORT = 3000;

// MIME type mapping
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
};

await bundle();

const watcher = watch(SOURCE_PATH, { recursive: true }, async (event, filename) => {
  console.log(`Detected ${event} in ${filename}`);
  try {
    await bundle({ debug: true });
    // eslint-disable-next-line no-unused-vars
  } catch (e) {
    // no need to do anything as build logs errors already
  }
});

const server = createServer(async (req, res) => {
  let filePath = new URL(req.url, `http://${req.headers.host}`).pathname;
  if (filePath === '/') {
    filePath += 'index.html';
  }
  try {
    const fullPath = path.join(DIST_PATH, filePath);
    const content = await readFile(fullPath);
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`Starting dev server at port: ${PORT}`);
});

process.on('SIGINT', () => {
  // close watcher and server when Ctrl-C is pressed
  console.log('Closing server...');
  watcher.close();
  server.close(() => {
    process.exit(0);
  });
});
