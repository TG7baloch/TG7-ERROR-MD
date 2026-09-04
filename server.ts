import express from 'express';
import path from 'path';
import fs from 'fs';
import { botManager } from './server/botManager.js';
import { vaultService } from './server/vaultService.js';
import {
  listWorkspaceFiles,
  readWorkspaceFile,
  writeWorkspaceFile,
  deleteWorkspaceFile,
  getWorkspaceMeta
} from './server/fileService.js';
import {
  getAllSlots,
  createSlot,
  deleteSlot,
  updateSlot,
  startSlot,
  stopSlot,
  startAllActiveSlots,
  stopAllSlots
} from './server/slotManager.js';

// Global 24/7 Resilience Crash Guards
process.on('uncaughtException', (err) => {
  console.error('[24/7 Supervisor Guard] Uncaught Exception caught safely:', err?.message || err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[24/7 Supervisor Guard] Unhandled Rejection caught safely:', reason);
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Standard CORS & Body Parsers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Proactive background auto-wake: Wakes and keeps bot connected on any incoming request
  app.use((req, res, next) => {
    if (!botManager.getStatus().connected) {
      botManager.startBot().catch(() => {});
    }
    next();
  });

  // Static public directory
  const publicDir = path.join(process.cwd(), 'public');
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
  }

// REST API Endpoints

  // 1. Status, 24/7 Keep-Alive & Health Ping Endpoints (UptimeRobot / Cron-Job Compatible)
  const handleHealthPing = async (req: express.Request, res: express.Response) => {
    try {
      const keepAlive = await botManager.pingKeepAlive();
      const status = botManager.getStatus();
      const config = botManager.getConfig();

      // If bot is not connected and not explicitly stopped, proactively wake it up
      if (!status.connected) {
        botManager.startBot().catch(() => {});
      }

      res.status(200).json({
        status: 'ok',
        engine: 'TG7 ERROR MD 24/7 Supervisor',
        online: status.connected,
        botNumber: status.botNumber || config.ownerNumber || null,
        uptimeSeconds: status.uptimeSeconds,
        processUptimeSeconds: Math.floor(process.uptime()),
        pingsReceived: keepAlive.pings,
        memoryMb: keepAlive.memoryMb,
        timestamp: new Date().toISOString()
      });
    } catch (e: any) {
      res.status(200).json({
        status: 'warning',
        error: e?.message || 'Minor heartbeat glitch',
        timestamp: new Date().toISOString()
      });
    }
  };

app.get('/api/ping', handleHealthPing);
app.head('/api/ping', handleHealthPing);
app.get('/ping', handleHealthPing);
app.head('/ping', handleHealthPing);
app.get('/api/health', handleHealthPing);
app.get('/health', handleHealthPing);

app.get('/api/status', (req, res) => {
  const status = botManager.getStatus();
  const config = botManager.getConfig();
  const meta = getWorkspaceMeta();
  res.json({
    status,
    config,
    meta,
    hasSession: fs.existsSync(path.join(process.cwd(), 'bot_session', 'creds.json')),
    vaultStats: {
      totalViewOnce: vaultService.getViewOnceList().length,
      hasSavedDp: !!vaultService.getSavedBotDp()
    }
  });
});

// 2. Logs
app.get('/api/logs', (req, res) => {
  res.json({ logs: botManager.getLogs() });
});

app.delete('/api/logs', (req, res) => {
  botManager.clearLogs();
  res.json({ success: true });
});

app.post('/api/logs/clear', (req, res) => {
  botManager.clearLogs();
  res.json({ success: true, message: 'All logs cleared' });
});

// 3. Bot Control (Unified 1-Button Start for Main Bot & All Active Friend Slots)
app.post('/api/start', async (req, res) => {
  try {
    await botManager.startBot();
    const slotRes = await startAllActiveSlots();
    res.json({
      success: true,
      message: `Main Bot engine & ${slotRes.started} active friend slot(s) started successfully`
    });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/stop', async (req, res) => {
  try {
    await botManager.stopBot();
    await stopAllSlots();
    res.json({ success: true, message: 'All Bot engines (Main + Slots) stopped' });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/restart', async (req, res) => {
  try {
    await botManager.restartBot();
    await startAllActiveSlots();
    res.json({ success: true, message: 'All Bot engines restarted' });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/pair', async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    return res.status(400).json({ success: false, error: 'Phone number is required' });
  }
  try {
    const code = await botManager.requestPairingCode(phoneNumber);
    if (code) {
      res.json({ success: true, pairingCode: code });
    } else {
      res.status(500).json({ success: false, error: 'Failed to generate pairing code. Please retry.' });
    }
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Direct Session ID Import & Start
app.post('/api/session/start', async (req, res) => {
  const { sessionString } = req.body;
  if (!sessionString || typeof sessionString !== 'string' || !sessionString.trim()) {
    return res.status(400).json({ success: false, error: 'WhatsApp Session ID / String is required' });
  }
  try {
    const result = await botManager.importSessionAndStart(sessionString.trim());
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/session/clear', async (req, res) => {
  try {
    const success = await botManager.clearSession();
    res.json({ success, message: 'Session data and credentials cleared' });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/session/repair', async (req, res) => {
  try {
    const { targetJid } = req.body || {};
    const count = botManager.autoHealSessionKeys(targetJid);
    // Trigger graceful reconnect if bot is running
    if (botManager.getStatus().connected) {
      await botManager.restartBot();
    }
    res.json({
      success: true,
      clearedKeys: count,
      message: `Successfully repaired Signal session ratchet keys (${count} keys healed). Fresh session handshake will complete seamlessly.`
    });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/session/validate', async (req, res) => {
  const { sessionString } = req.body;
  if (!sessionString || typeof sessionString !== 'string') {
    return res.status(400).json({ valid: false, error: 'Session string required' });
  }
  try {
    const parsed = await botManager.parseSessionCredentials(sessionString.trim());
    if (parsed) {
      const number = parsed.me?.id ? parsed.me.id.split(':')[0].split('@')[0] : undefined;
      res.json({ valid: true, botNumber: number, hasMe: !!parsed.me });
    } else {
      res.json({ valid: false, error: 'Could not decode valid creds.json structure' });
    }
  } catch (e: any) {
    res.status(500).json({ valid: false, error: e.message });
  }
});

app.get('/api/session/export', (req, res) => {
  try {
    const sessionId = botManager.exportSessionId();
    if (sessionId) {
      res.json({
        success: true,
        sessionId,
        length: sessionId.length,
        hasSession: true
      });
    } else {
      res.json({
        success: false,
        hasSession: false,
        error: 'No active WhatsApp session found. Please link with QR code or Pairing Code first.'
      });
    }
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 4. Config
app.get('/api/config', (req, res) => {
  res.json(botManager.getConfig());
});

app.post('/api/config', (req, res) => {
  try {
    const updated = botManager.updateConfig(req.body);
    res.json({ success: true, config: updated });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 5. Commands
app.get('/api/commands', (req, res) => {
  res.json({ commands: botManager.getCommands() });
});

app.post('/api/commands', (req, res) => {
  try {
    const cmd = req.body;
    if (!cmd.name) return res.status(400).json({ success: false, error: 'Command name required' });
    botManager.saveCommand(cmd);
    res.json({ success: true, command: cmd });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/commands/:id/toggle', (req, res) => {
  const state = botManager.toggleCommand(req.params.id);
  res.json({ success: true, enabled: state });
});

app.delete('/api/commands/:id', (req, res) => {
  botManager.deleteCommand(req.params.id);
  res.json({ success: true });
});

// 6. Slots (Multi-Tenant Friend Bot Slots)
app.get('/api/slots', (req, res) => {
  res.json({ slots: getAllSlots() });
});

app.post('/api/slots', (req, res) => {
  const { name, sessionId, phoneNumber, prefix, description } = req.body;
  const created = createSlot(name, sessionId, phoneNumber, prefix, description);
  res.json({ success: true, slot: created });
});

app.put('/api/slots/:id', (req, res) => {
  const updated = updateSlot(req.params.id, req.body);
  if (updated) {
    res.json({ success: true, slot: updated });
  } else {
    res.status(404).json({ success: false, error: 'Slot not found' });
  }
});

app.post('/api/slots/:id/start', async (req, res) => {
  try {
    const result = await startSlot(req.params.id);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/slots/:id/stop', async (req, res) => {
  try {
    const stopped = await stopSlot(req.params.id);
    res.json({ success: stopped });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/slots/start-all', async (req, res) => {
  try {
    const result = await startAllActiveSlots();
    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/slots/stop-all', async (req, res) => {
  try {
    await stopAllSlots();
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.delete('/api/slots/:id', async (req, res) => {
  await deleteSlot(req.params.id);
  res.json({ success: true });
});

// 7. Workspace Files
app.get('/api/files', (req, res) => {
  const sub = (req.query.path as string) || '';
  const files = listWorkspaceFiles(sub);
  res.json({ files });
});

app.get('/api/files/content', (req, res) => {
  const filePath = req.query.path as string;
  if (!filePath) return res.status(400).json({ error: 'Path required' });
  try {
    const content = readWorkspaceFile(filePath);
    res.json({ content });
  } catch (e: any) {
    res.status(404).json({ error: e.message });
  }
});

app.post('/api/files/content', (req, res) => {
  const { path: filePath, content } = req.body;
  if (!filePath) return res.status(400).json({ error: 'Path required' });
  try {
    writeWorkspaceFile(filePath, content || '');
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/files', (req, res) => {
  const filePath = req.query.path as string;
  if (!filePath) return res.status(400).json({ error: 'Path required' });
  try {
    deleteWorkspaceFile(filePath);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 8. Persistent Vault & Saved Media APIs
app.get('/api/vault/viewonce', (req, res) => {
  res.json({ items: vaultService.getViewOnceList() });
});

app.get('/api/vault/viewonce/:id/media', (req, res) => {
  const found = vaultService.getViewOnceByIdOrIndex(req.params.id);
  if (!found || !found.buffer) {
    return res.status(404).send('Media not found');
  }
  res.setHeader('Content-Type', found.item.mimetype || 'application/octet-stream');
  res.send(found.buffer);
});

app.get('/api/vault/dp', (req, res) => {
  const dp = vaultService.getSavedBotDp();
  if (!dp || !dp.buffer) {
    return res.status(404).json({ exists: false });
  }
  res.setHeader('Content-Type', dp.mime || 'image/jpeg');
  res.send(dp.buffer);
});

app.post('/api/bot/dp', async (req, res) => {
  try {
    const { base64Data, isGifOrVideo } = req.body;
    if (!base64Data) {
      return res.status(400).json({ success: false, error: 'base64Data required' });
    }
    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const success = await botManager.updateBotProfilePicture(buffer, !!isGifOrVideo);
    res.json({ success });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 9. Command & Menu Banner APIs
app.get('/api/banner', (req, res) => {
  const info = botManager.getBannerInfo();
  res.json(info);
});

app.get('/api/banner/media', (req, res) => {
  const vid = botManager.getMenuVideo();
  if (vid && vid.length > 5000) {
    res.setHeader('Content-Type', 'video/mp4');
    return res.send(vid);
  }
  const img = botManager.getMenuImage();
  if (img && img.length > 0) {
    res.setHeader('Content-Type', 'image/jpeg');
    return res.send(img);
  }
  res.status(404).send('Banner media not found');
});

app.post('/api/banner', (req, res) => {
  try {
    const { base64Data, isVideo, mime } = req.body;
    if (!base64Data) {
      return res.status(400).json({ success: false, error: 'base64Data required' });
    }
    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const success = botManager.updateMenuBanner(buffer, !!isVideo, mime || (isVideo ? 'video/mp4' : 'image/jpeg'));
    res.json({ success, bannerInfo: botManager.getBannerInfo() });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.delete('/api/banner', (req, res) => {
  try {
    const success = botManager.resetMenuBanner();
    res.json({ success, bannerInfo: botManager.getBannerInfo() });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Production vs Dev Client Serving
  if (process.env.NODE_ENV !== 'production') {
    // Setup Vite dev server middleware in development mode
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[TG7 MD 24/7 Supervisor] Active on port ${PORT}`);
    // Auto-launch bot on server startup if credentials exist
    botManager.startBot().catch((e) => {
      console.error('[Bot Auto-Start Error]', e?.message || e);
    });

    // 24/7 Self-Heartbeat Worker: Pings itself every 2 minutes so container stays warm and alive
    setInterval(async () => {
      try {
        const pingRes = await fetch(`http://127.0.0.1:${PORT}/api/ping`).catch(() => null);
        if (pingRes && pingRes.ok) {
          // Heartbeat healthy
        }
      } catch (err) {}
    }, 120000);
  });
}

startServer().catch((err) => {
  console.error('[Server Error]', err);
});

