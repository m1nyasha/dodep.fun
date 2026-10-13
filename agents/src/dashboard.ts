import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { GameClient } from './game-client.js';

export async function startDashboard(game: GameClient, experimentId: string, port: number): Promise<void> {
  const html = await readFile(fileURLToPath(new URL('../public/index.html', import.meta.url)));
  const server = createServer(async (req, res) => {
    try {
      if (req.url === '/api/snapshot') {
        const data = await game.monitor(experimentId);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify(data));
      } else if (req.url === '/api/decisions') {
        const data = await game.decisions(experimentId);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify(data));
      } else if (req.url === '/') {
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Security-Policy':
            "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'",
        });
        res.end(html);
      } else {
        res.writeHead(404).end();
      }
    } catch (error) {
      res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unavailable' }));
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve());
  });
}
