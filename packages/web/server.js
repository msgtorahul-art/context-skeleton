/**
 * Zero-Dependency Local HTTP Dev Server for ContextSkeleton Web Visualizer
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8080;
const HOST = '127.0.0.1';
const ROOT_DIR = __dirname;
const CORE_SRC_DIR = path.resolve(__dirname, '../core/src');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';

  let filePath = path.join(ROOT_DIR, reqPath);

  // Alias imports from core
  if (reqPath.startsWith('/../../core/src/') || reqPath.startsWith('/core/src/')) {
    const coreRel = reqPath.replace('/../../core/src/', '').replace('/core/src/', '');
    filePath = path.join(CORE_SRC_DIR, coreRel);
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`500 Internal Server Error: ${err.message}`);
      }
      return;
    }

    // Rewrite import paths for browser compatibility if serving ES module
    if (ext === '.js') {
      let jsContent = data.toString('utf8');
      jsContent = jsContent.replace(/from '\.\.\/\.\.\/core\/src\/index\.js'/g, "from '/core/src/index.js'");
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(jsContent);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`\n⚡ ContextSkeleton Web Visualizer running live at:\n   👉 http://${HOST}:${PORT}\n`);
});
