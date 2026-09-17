import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { runAutonomousResearch } from './server/agent.ts';
import { executeSerpApiSearch, getCacheStats } from './server/serpapi.ts';
import { getAiClient } from './server/gemini.ts';
import { SerpApiEngine } from './src/types.ts';

dotenv.config();

const currentDir = process.cwd();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  // System and API status
  app.get('/api/status', (req, res) => {
    const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
    const hasSerpApi = Boolean(process.env.SERPAPI_API_KEY && process.env.SERPAPI_API_KEY !== 'MY_SERPAPI_API_KEY');
    const activeEngines: SerpApiEngine[] = [
      'google',
      'google_news',
      'google_scholar',
      'google_shopping',
      'google_jobs',
    ];

    res.json({
      geminiConfigured: hasGemini,
      serpapiConfigured: hasSerpApi,
      activeEngines,
      cacheStats: getCacheStats(),
      mode: hasSerpApi ? 'live_serpapi' : 'grounded_simulation',
      note: hasSerpApi
        ? 'Live SerpApi Search Active'
        : 'Running with AI Grounded SerpApi Engine (Compliant with SerpApi Output Schema). Add SERPAPI_API_KEY in Settings > Secrets for direct live scraping.',
    });
  });

  // Live Deep Research SSE streaming endpoint
  app.post('/api/research/stream', async (req, res) => {
    const { query, depth = 'deep', engines } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();
    res.write(': stream-connected\n\n');

    let isClientDisconnected = false;
    const heartbeatTimer = setInterval(() => {
      if (!isClientDisconnected && !res.writableEnded) {
        try {
          res.write(': keep-alive\n\n');
        } catch (e) {
          // Socket write failed
        }
      }
    }, 2000);

    res.on('close', () => {
      isClientDisconnected = true;
      clearInterval(heartbeatTimer);
    });

    try {
      const generator = runAutonomousResearch({
        query,
        depth: depth === 'fast' ? 'fast' : 'deep',
        engines: Array.isArray(engines) ? engines : undefined,
      });

      for await (const event of generator) {
        if (isClientDisconnected || res.writableEnded) break;
        console.log(`[SSE Emit] ${event.type}`);
        try {
          res.write(`data: ${JSON.stringify(event)}\n\n`);
        } catch (writeErr) {
          console.warn('[Stream Write Error]', writeErr);
          break;
        }
      }

      if (!isClientDisconnected && !res.writableEnded) {
        res.write(`data: [DONE]\n\n`);
        res.end();
      }
    } catch (err: any) {
      console.error('[Stream Error]', err);
      if (!isClientDisconnected && !res.writableEnded) {
        try {
          res.write(`data: ${JSON.stringify({ type: 'error', payload: { message: err.message } })}\n\n`);
          res.end();
        } catch (e) {}
      }
    } finally {
      clearInterval(heartbeatTimer);
    }
  });

  // Direct SerpApi Engine Inspector endpoint
  app.post('/api/serpapi/inspect', async (req, res) => {
    const { query, engine = 'google' } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
      const ai = getAiClient();
      const output = await executeSerpApiSearch(query, engine as SerpApiEngine, ai);
      res.json(output);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Fallback for HTML requests in dev middleware mode
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      // Skip API routes
      if (url.startsWith('/api/')) {
        return next();
      }
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace?.(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DeepVerify server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
