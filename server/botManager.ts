import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  proto,
  jidNormalizedUser,
  downloadContentFromMessage,
  BufferJSON,
  type WASocket,
  type ConnectionState,
  Browsers
} from '@whiskeysockets/baileys';
import pino from 'pino';
import NodeCache from 'node-cache';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import QRCode from 'qrcode';
import axios from 'axios';
import type { BotConfig, BotStatus, LogEntry, BotCommand } from './types.js';
import { getWorkspaceMeta } from './fileService.js';
import { INITIAL_EXTENDED_COMMANDS, generateExtendedCommands } from './commandRegistry.js';
import { downloadYouTubeAudio, downloadYouTubeVideo, downloadTikTokVideo, downloadTikTokSlideshow, downloadAdultVideo, searchPopularImages, generateTtsAudioBuffer, ensureValidWhatsAppMp4, extractMediaFromMessage, unwrapAllMessageLayers, generateSquareDpBuffer, addWatermarkToImageBuffer, convertAudioToWhatsAppVoice, fetchRealAudioClip, AUDIO_URL_MAP, AUDIO_VAULT_200 } from './mediaDownloader.js';
import { EMBEDDED_BANNER_BASE64 } from './embeddedBanner.js';
import { transformText, getAllFontPreviews, FONT_STYLES } from './fontEngine.js';
import { REACTION_ACTIONS, getReactionMediaUrl, fetchMediaBuffer, convertGifToMp4, getGuaranteedReactionVideo } from './reactionService.js';
import { processImageEffects, enhanceImageSuperResolution } from './photoEditorService.js';
import { vaultService } from './vaultService.js';
import {
  fetchLiveWeather,
  translateText,
  generateQrPngBuffer,
  calculateMathExpression,
  getRandomShayari,
  fetchQuranAyah,
  getRandomJoke,
  fetchWikipedia,
  fetchGitHubUser,
  fetchCryptoPrice,
  getRandomTruth,
  getRandomDare,
  getRandomHadith,
  textToBinary,
  textToMorse,
  get8BallAnswer
} from './commandUtils.js';
import { generateAiText, generateAiImageBuffer } from './aiService.js';
import { extractTwoEmojis, getEmojiMixSticker } from './emojiKitchenService.js';
import { fetchDirectMoodAudio, MOOD_AUDIO_DATABASE } from './moodAudioService.js';
import { searchMovie, searchAnime, searchTVSeries } from './mediaStreamingService.js';

const CONFIG_FILE = path.join(process.cwd(), 'bot_config.json');
const COMMANDS_FILE = path.join(process.cwd(), 'bot_commands.json');
const SESSION_DIR = path.join(process.cwd(), 'bot_session');
const BACKUP_SESSION_DIR = path.join(process.cwd(), 'session_backup');
const VAULT_DIR = path.join(process.cwd(), 'bot_vault');

if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });
if (!fs.existsSync(BACKUP_SESSION_DIR)) fs.mkdirSync(BACKUP_SESSION_DIR, { recursive: true });
if (!fs.existsSync(VAULT_DIR)) fs.mkdirSync(VAULT_DIR, { recursive: true });

const DEFAULT_CONFIG: BotConfig = {
  botName: 'TG7 ERROR MD Bot',
  ownerName: 'TG7 ERROR',
  ownerNumber: '923327306747',
  prefix: '.',
  workMode: 'public',
  autoRead: false,
  autoStatusView: false,
  alwaysOnline: true,
  antiLink: false,
  antiDelete: true,
  antiEdit: true,
  antiSpam: true,
  antiBadword: false,
  antiBot: false,
  antiViewOnce: true,
  antiTelegram: false,
  antiUrl: false,
  antiCall: false,
  antiFake: false,
  antiBug: true,
  antiTagAll: false,
  antiStickerSpam: false,
  antiAudioSpam: false,
  antiDocument: false,
  antiNsfw: false,
  antiDemote: false,
  antiPromote: false,
  antiGhost: false,
  antiInvite: false,
  antiForeign: false,
  antiDeleteStatus: true,
  antiReact: false,
  antiDeleteForwardToDm: true,
  autoReact: false,
  autoReactEmoji: '⚡',
  geminiAiEnabled: true,
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  welcomeMessage: 'Assalam o Alaikum! Welcome to TG7 ERROR Cyber Realm ⚡',
  customStatus: 'TG7 ERROR 24/7 Cyber MD Engine',
  autoRestartOnCrash: true,
  maxRestartRetries: 100,
  restartDelaySeconds: 3,
  runnerMode: 'integrated',
  customEntryFile: 'index.js',
  savedSessionId: 'Silva~H4sIAAAAAAAAA5VW207jSBD9l36lNNtVfY+EtCHcGe7MLGHEg4k7iQfHCbZDCCP+fVVtYOZhd5aNZMVpV7pPn3PqtH+Ial408SiuRe+HWNTFY9ZGvm3Xiyh6Yms5HsdagMizNhO9b4qAFJAyEDSQlqANkPSAjr8DeAWIBEFCQCDUoDQYBRYBnQfSFjBIQO8AVQDSGqwFr8Eb8AFQWyBN4Pi/CEHfvoBYLO/KYvQbTBgArQR0AVAZIPSAygMSYIKbsCoE1BocoHGA0gGGbn2UCpSDYMFpBh0clwcCdCo9TKBJgTMQPOjbF8aUFXVRTXYW0ziLdVYexfVZVtQf45AJYp6CS9QRpX0jWkBmUvF2CEhaIJJAZMAwLSoNo9TMlNagPaBNu+VtaQLjITCHBsgo4HoZINCHOPQsqgMFxPKiAjQakFXxYBVQAJLEP0IiNYmHCGgdkOqckEQlCYY5RzDYYeaHBkg7IAcIRMxyIrEpJlXMD/JYtUW7/rAFHQEhL0uMzCpgnUiDs8lw2kEAI4GrgCEyT1oDSXy1iUsbZI6S3ySwaTQzzcg75gxz69WHuCNpAIMFVK6TAwEl+0cDujS7Smoal9j07DJvAD0BMj0MlglmXhmGSlZExuAkew6tTlvwGpAcyF/YO6vfevf+/1iw851OGmo2lQGUgBQAEcF3WGXqakbK1L2WOA2ssyMuSVJoQGUBNTL1jJo3wv2nJbd+ajf7sUZmz3D3ArGJpARkJzpuWpOcn1ZjFjyQkokmb9O6nsUOrDppwMAxYJKiqLuLOmGs7UhnA1vQ5p3LrF3Wv+3awBmGPEkw4ImFtNwNOrFBKcnQe0DjEyK+HCZSifPG+JSQ1oDmVqXOwl5x1qQCStOisTwTGexcYJPbvU2Q0Sc+rWQvUOBudASWGAm7w1hgEnUqUSqpiTqkEOQseY1iRqlVWj94cCzOfVwf5KKHLyDqOCmats7aYl7xGAegyPLHyziqY5vsJrZ3t67b2fj8Zn6Ho7A7a5+HetooXFZmHffujvfLwhQrs/29HW0KEIt6PopNE/P9omnn9fo4Nk02iY3ofbsFUcWntjMyL6cQxLiom/ZLtVyU8yx/c/nbw2w0mi+r9nJdjQZ8E2vRkz+HY9sW1aRhKZdVVo+mxWMcTLO2Eb1xVjbxfYexjrnotfUyvgf6YJ6z9pf6aufEy4EAMUueKHLRE4GUIqekDdr1DP3ZfFrxtNli8amKrQBRpjKDQRqFThk0XnEhj7+8A+T58thmRdmInhicfL+ZDuR5/TBbYX847F/2+0f9PpP2tqE3c3bMf6XFYHGNW7tPT8/l3ux4Fg8vxu14+3Dvqx1MR/cnp+vDg437cfXPk4ieeBg+ZPbZjMvV03buDlvXmI2hPI3FYF9r3Lsexuvh9OtfencuNw7MxJaz59X+w/Z2vrF6PsuD3lvtrAc7Z2TDH/3gytn2aKm3+5u8Wh4fi1H8dbFy197tHNSkbWkadZRfnA76N99r+3ysTharLzH4u4OZewxPz/r5883R1fnN6d6XM/e425xdUKM/D/ORO588XJur8mKkpkeT63o5mGxuire2LV8PkCK5iaXin+MipiisMhbwv6XrgLPD5Av8MsdruP5LJpiUhTI1LFqTWtia9IbkuwDnw4eTk89Hw6erBU4qsimfOKc4OzlfOao4/HkgHaHdgcKNq1R6fTE2Rf8tiEWZteN5PRM9kVV5PS9yAaKeL9n4B9V4/ruDnjPEgwEP6c2gzJq2/7OhropZbNpsthA9dN4Za0h5ELN1f7G4bLP2rQ9Fnz9bJ/fi5W/Q2nSyQwoAAA==',
  keepAlive24_7: true
};

export class BotManager {
  private sock: WASocket | null = null;
  private config: BotConfig = DEFAULT_CONFIG;
  private status: BotStatus = {
    connected: false,
    pairingCode: null,
    qrCode: null,
    botNumber: null,
    pushName: null,
    uptimeSeconds: 0,
    restartCount: 0,
    memoryUsageMb: 0,
    totalCommandsExecuted: 0,
    totalMessagesProcessed: 0,
    totalGroupsCount: 0,
    totalChatsCount: 0,
    lastSeenTimestamp: null,
    runnerMode: 'integrated',
    customBotRunning: false,
    antiDeleteVaultCount: 0,
    keepAliveStatus: {
      enabled: true,
      lastPing: Date.now(),
      pingIntervalSeconds: 45,
      consecutiveHealthyPings: 0
    }
  };
  private logs: LogEntry[] = [];
  private commands: BotCommand[] = [];
  private messageVault: Map<string, any> = new Map();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private connectionWatchdog: NodeJS.Timeout | null = null;
  private keepAliveInterval: NodeJS.Timeout | null = null;
  private uptimeInterval: NodeJS.Timeout | null = null;
  private isExplicitlyStopped = false;
  private isConnecting = false;
  private lastKeepAliveAttempt: number = 0;
  private menuImageBuffer: Buffer | null = null;
  private menuVideoBuffer: Buffer | null = null;
  private botConnectTime: number = Date.now();
  private processedMessageIds: Set<string> = new Set<string>();
  private recentDeletedMsgIds: Map<string, number> = new Map<string, number>();
  private commandFastMap: Map<string, BotCommand> = new Map<string, BotCommand>();
  private compiledFunctionMap: Map<string, Function> = new Map<string, Function>();
  private lastPresencePing: number = 0;
  private lastDpSniffed: Map<string, number> = new Map<string, number>();

  public channelJid = '120363385750000000@newsletter';
  public channelName = 'TG7 ERROR OFFICIAL';
  public channelLink = 'https://whatsapp.com/channel/0029Vb8yUWfDjiOdpRKwzx15';

  constructor() {
    this.loadConfig();
    this.loadCommands();
    this.loadMenuImage();
    this.loadMenuVideo();
    this.initHeartbeats();
    this.status.antiDeleteVaultCount = vaultService.getViewOnceList().length;
  }

  private initHeartbeats() {
    // 1. Uptime Counter & Memory Monitor
    if (this.uptimeInterval) clearInterval(this.uptimeInterval);
    this.uptimeInterval = setInterval(() => {
      if (this.status.connected) {
        this.status.uptimeSeconds++;
      }
      const mem = process.memoryUsage();
      this.status.memoryUsageMb = Math.round(mem.rss / (1024 * 1024));
      this.status.antiDeleteVaultCount = vaultService.getViewOnceList().length;
    }, 1000);

    // 2. 24/7 Keep-Alive & Self-Healing Heartbeat (Running every 25s for 24/7 uptime)
    if (this.keepAliveInterval) clearInterval(this.keepAliveInterval);
    this.keepAliveInterval = setInterval(async () => {
      await this.performKeepAliveCheck();
    }, 25000);
  }

  public async pingKeepAlive(): Promise<{ connected: boolean; uptimeSeconds: number; pings: number; memoryMb: number }> {
    await this.performKeepAliveCheck();
    return {
      connected: this.status.connected,
      uptimeSeconds: this.status.uptimeSeconds,
      pings: this.status.keepAliveStatus.consecutiveHealthyPings,
      memoryMb: this.status.memoryUsageMb
    };
  }

  private async performKeepAliveCheck() {
    const now = Date.now();
    this.status.keepAliveStatus.lastPing = now;

    if (this.sock && this.status.connected) {
      // Check if underlying WebSocket is actually active (readyState: 1 is OPEN)
      const wsState = (this.sock as any)?.ws?.readyState;
      if (wsState !== undefined && wsState !== 1) {
        this.log('warn', `⚠️ Detected stale WhatsApp socket connection (readyState: ${wsState}). Auto-reconnecting immediately...`);
        this.status.connected = false;
        try {
          (this.sock as any)?.end?.(undefined);
        } catch {}
        this.sock = null;
        this.startBot();
        return;
      }

      this.status.keepAliveStatus.consecutiveHealthyPings++;

      // Send proactive WhatsApp presence update every 50s to keep WhatsApp server-side session warm
      if (now - (this.lastPresencePing || 0) > 50000) {
        this.lastPresencePing = now;
        try {
          this.sock.sendPresenceUpdate('available').catch(() => {});
        } catch {}
      }
    } else if (!this.isExplicitlyStopped && !this.reconnectTimeout && !this.status.connected) {
      // If isConnecting has been stuck for more than 40s, clear the stuck flag
      if (this.isConnecting && now - (this.lastKeepAliveAttempt || 0) > 40000) {
        this.log('warn', '⚠️ Detected stuck connecting state. Forcing clean restart...');
        this.isConnecting = false;
        if (this.sock) {
          try { this.sock.end(undefined); } catch {}
          this.sock = null;
        }
      }

      if (!this.isConnecting) {
        this.lastKeepAliveAttempt = now;
        const credsExist = fs.existsSync(path.join(SESSION_DIR, 'creds.json')) || fs.existsSync(path.join(BACKUP_SESSION_DIR, 'creds.json'));
        if (credsExist || this.config.savedSessionId) {
          this.log('info', '🔄 24/7 Auto-Guard detected offline socket, launching instant session re-connection...');
          this.startBot();
        }
      }
    }

    this.backupSessionCredentials();
  }

  private toBuffer(val: any): Buffer | null {
    if (!val) return null;
    if (Buffer.isBuffer(val)) return val;
    if (val instanceof Uint8Array) return Buffer.from(val);
    if (typeof val === 'string') {
      try {
        const buf = Buffer.from(val, 'base64');
        if (buf.length > 0) return buf;
      } catch {}
      return Buffer.from(val, 'utf-8');
    }
    if (Array.isArray(val) && val.every(x => typeof x === 'number')) {
      return Buffer.from(val);
    }
    if (typeof val === 'object') {
      if (val.type === 'Buffer') {
        if (typeof val.data === 'string') {
          return Buffer.from(val.data, 'base64');
        }
        if (Array.isArray(val.data)) {
          return Buffer.from(val.data);
        }
        if (val.data && typeof val.data === 'object') {
          const vals = Object.values(val.data);
          if (vals.every(v => typeof v === 'number')) {
            return Buffer.from(vals as number[]);
          }
        }
      }
      if (val.data && Array.isArray(val.data)) {
        return Buffer.from(val.data);
      }
      const keys = Object.keys(val);
      if (keys.length > 0 && keys.every(k => !isNaN(parseInt(k, 10)))) {
        const vals = Object.values(val);
        if (vals.every(v => typeof v === 'number')) {
          return Buffer.from(vals as number[]);
        }
      }
    }
    return null;
  }

  public sanitizeAuthStateCreds(creds: any): any {
    if (!creds || typeof creds !== 'object') return creds;

    // 1. routingInfo - must be a real Buffer or removed completely (prevents NaN error in Baileys makeNoiseHandler)
    if (creds.routingInfo !== undefined && creds.routingInfo !== null) {
      const routingBuf = this.toBuffer(creds.routingInfo);
      if (routingBuf && typeof routingBuf.byteLength === 'number' && routingBuf.byteLength > 0) {
        creds.routingInfo = routingBuf;
      } else {
        delete creds.routingInfo;
      }
    }

    // 2. noiseKey
    if (creds.noiseKey && typeof creds.noiseKey === 'object') {
      if (creds.noiseKey.private) creds.noiseKey.private = this.toBuffer(creds.noiseKey.private) || creds.noiseKey.private;
      if (creds.noiseKey.public) creds.noiseKey.public = this.toBuffer(creds.noiseKey.public) || creds.noiseKey.public;
    }

    // 3. pairingEphemeralKeyPair
    if (creds.pairingEphemeralKeyPair && typeof creds.pairingEphemeralKeyPair === 'object') {
      if (creds.pairingEphemeralKeyPair.private) creds.pairingEphemeralKeyPair.private = this.toBuffer(creds.pairingEphemeralKeyPair.private) || creds.pairingEphemeralKeyPair.private;
      if (creds.pairingEphemeralKeyPair.public) creds.pairingEphemeralKeyPair.public = this.toBuffer(creds.pairingEphemeralKeyPair.public) || creds.pairingEphemeralKeyPair.public;
    }

    // 4. signedIdentityKey
    if (creds.signedIdentityKey && typeof creds.signedIdentityKey === 'object') {
      if (creds.signedIdentityKey.private) creds.signedIdentityKey.private = this.toBuffer(creds.signedIdentityKey.private) || creds.signedIdentityKey.private;
      if (creds.signedIdentityKey.public) creds.signedIdentityKey.public = this.toBuffer(creds.signedIdentityKey.public) || creds.signedIdentityKey.public;
    }

    // 5. signedPreKey
    if (creds.signedPreKey && typeof creds.signedPreKey === 'object') {
      if (creds.signedPreKey.keyPair && typeof creds.signedPreKey.keyPair === 'object') {
        if (creds.signedPreKey.keyPair.private) creds.signedPreKey.keyPair.private = this.toBuffer(creds.signedPreKey.keyPair.private) || creds.signedPreKey.keyPair.private;
        if (creds.signedPreKey.keyPair.public) creds.signedPreKey.keyPair.public = this.toBuffer(creds.signedPreKey.keyPair.public) || creds.signedPreKey.keyPair.public;
      }
      if (creds.signedPreKey.signature) {
        creds.signedPreKey.signature = this.toBuffer(creds.signedPreKey.signature) || creds.signedPreKey.signature;
      }
    }

    return creds;
  }

  public autoHealSessionKeys(targetJidOrId?: string): number {
    try {
      if (!fs.existsSync(SESSION_DIR)) return 0;
      const files = fs.readdirSync(SESSION_DIR);
      let count = 0;
      for (const file of files) {
        if (targetJidOrId) {
          const clean = targetJidOrId.split('@')[0].split(':')[0].replace(/[^0-9a-zA-Z_-]/g, '');
          if (clean && clean.length >= 3 && (file.startsWith('session-') || file.startsWith('sender-key-')) && file.includes(clean)) {
            try {
              fs.unlinkSync(path.join(SESSION_DIR, file));
              count++;
            } catch {}
          }
        } else {
          // Global heal: delete corrupted session and sender-key files, keep creds.json, pre-key-*, identity-key-*
          if (file.startsWith('session-') || file.startsWith('sender-key-') || file.startsWith('app-state-sync-')) {
            try {
              fs.unlinkSync(path.join(SESSION_DIR, file));
              count++;
            } catch {}
          }
        }
      }
      if (count > 0) {
        this.log('info', `🛡️ Auto-healed ${count} Signal decryption session key(s) ${targetJidOrId ? 'for ' + targetJidOrId : 'globally'}. Bad MAC cleared!`);
      }
      return count;
    } catch (e: any) {
      this.log('warn', `Auto-heal session notice: ${e.message}`);
      return 0;
    }
  }

  public writeCredsSafely(filePath: string, creds: any) {
    try {
      const sanitized = this.sanitizeAuthStateCreds(creds);
      const serialized = JSON.stringify(sanitized, BufferJSON.replacer, 2);
      fs.writeFileSync(filePath, serialized, 'utf-8');
    } catch (e: any) {
      this.log('error', `Failed to write creds file: ${e.message}`);
    }
  }

  private backupSessionCredentials() {
    try {
      const srcCreds = path.join(SESSION_DIR, 'creds.json');
      const dstCreds = path.join(BACKUP_SESSION_DIR, 'creds.json');
      if (fs.existsSync(srcCreds)) {
        const stat = fs.statSync(srcCreds);
        if (stat.size > 50) {
          fs.copyFileSync(srcCreds, dstCreds);

          // Auto-encode into persistent TG7~ Session ID string
          try {
            const raw = fs.readFileSync(srcCreds, 'utf-8');
            if (raw && raw.length > 50) {
              const b64 = Buffer.from(raw, 'utf-8').toString('base64');
              const newSessionId = `TG7~${b64}`;
              if (!this.config.savedSessionId || this.config.savedSessionId.length < 50) {
                this.config.savedSessionId = newSessionId;
                this.persistConfig();
              }
            }
          } catch {}
        }
      }
    } catch (e) {}
  }

  public exportSessionId(): string | null {
    try {
      const srcCreds = path.join(SESSION_DIR, 'creds.json');
      const dstCreds = path.join(BACKUP_SESSION_DIR, 'creds.json');
      const targetFile = fs.existsSync(srcCreds) ? srcCreds : (fs.existsSync(dstCreds) ? dstCreds : null);
      if (targetFile) {
        const raw = fs.readFileSync(targetFile, 'utf-8');
        if (raw && raw.length > 50) {
          const b64 = Buffer.from(raw, 'utf-8').toString('base64');
          return `TG7~${b64}`;
        }
      }
      if (this.config.savedSessionId && this.config.savedSessionId.length > 30) {
        return this.config.savedSessionId;
      }
      if (process.env.SESSION_ID && process.env.SESSION_ID.trim().length > 30) {
        return process.env.SESSION_ID.trim();
      }
    } catch {}
    return null;
  }

  public async parseSessionCredentials(rawInput: string): Promise<any | null> {
    if (!rawInput || typeof rawInput !== 'string') return null;
    let input = rawInput.trim();

    // 1. If user provided a URL (e.g. pastebin, raw github)
    if (input.startsWith('http://') || input.startsWith('https://')) {
      try {
        const res = await axios.get(input, { timeout: 15000 });
        if (typeof res.data === 'string') {
          input = res.data.trim();
        } else if (typeof res.data === 'object') {
          return this.sanitizeAuthStateCreds(res.data.creds || res.data);
        }
      } catch (e: any) {
        this.log('error', `Failed to fetch session from URL: ${e.message}`);
      }
    }

    // URL decode if percent-encoded
    if (input.includes('%')) {
      try {
        input = decodeURIComponent(input);
      } catch {}
    }

    // Clean common wrappers (quotes, brackets, backticks, prefixes like SESSION_ID=)
    input = input.replace(/^(SESSION_ID|SESSION|ID|BOT_SESSION)\s*[:=]\s*/i, '');
    input = input.replace(/^["'`]|["'`]$/g, '').trim();

    // Helper to test if an object is valid creds
    const isValidCreds = (obj: any): boolean => {
      if (!obj || typeof obj !== 'object') return false;
      const target = obj.creds || obj;
      return !!(
        target.noiseKey ||
        target.registrationId ||
        target.signedIdentityKey ||
        target.signedPreKey ||
        target.me ||
        target.pairingCode ||
        target.account
      );
    };

    // 2. Direct JSON check with BufferJSON reviver
    if (input.startsWith('{') && input.endsWith('}')) {
      try {
        const directJson = JSON.parse(input, BufferJSON.reviver);
        if (isValidCreds(directJson)) {
          return this.sanitizeAuthStateCreds(directJson.creds ? directJson.creds : directJson);
        }
      } catch (e) {}
    }

    // 3. Extract candidate payloads (Silva~..., TG7~..., prefix;;;..., etc.)
    const candidates: string[] = [input];
    if (input.includes('~')) {
      const parts = input.split('~');
      if (parts[1]) candidates.push(parts.slice(1).join('~').trim());
      if (parts[0]) candidates.push(parts[0].trim());
    }
    if (input.includes(';;;')) {
      const parts = input.split(';;;');
      if (parts[1]) candidates.push(parts.slice(1).join(';;;').trim());
    }
    if (input.includes(':') && !input.startsWith('http')) {
      const parts = input.split(':');
      if (parts[1]) candidates.push(parts.slice(1).join(':').trim());
    }

    for (const candidate of candidates) {
      const cleanCandidate = candidate.replace(/\s+/g, '');
      if (!cleanCandidate) continue;

      // Try Direct JSON on candidate
      if (cleanCandidate.startsWith('{')) {
        try {
          const direct = JSON.parse(cleanCandidate, BufferJSON.reviver);
          if (isValidCreds(direct)) return this.sanitizeAuthStateCreds(direct.creds || direct);
        } catch (e) {}
      }

      // Try Base64 Decoding + Gzip / Inflate / Brotli / Raw String / Double Base64
      try {
        const buffer = Buffer.from(cleanCandidate, 'base64');
        if (buffer && buffer.length > 5) {
          // Decompression Attempt 1: Gzip
          try {
            const unzipped = zlib.gunzipSync(buffer).toString('utf-8');
            const parsed = JSON.parse(unzipped, BufferJSON.reviver);
            if (isValidCreds(parsed)) return this.sanitizeAuthStateCreds(parsed.creds || parsed);
          } catch (e) {}

          // Decompression Attempt 2: Inflate (zlib)
          try {
            const inflated = zlib.inflateSync(buffer).toString('utf-8');
            const parsed = JSON.parse(inflated, BufferJSON.reviver);
            if (isValidCreds(parsed)) return this.sanitizeAuthStateCreds(parsed.creds || parsed);
          } catch (e) {}

          // Decompression Attempt 3: Brotli
          try {
            const unbrotli = zlib.brotliDecompressSync(buffer).toString('utf-8');
            const parsed = JSON.parse(unbrotli, BufferJSON.reviver);
            if (isValidCreds(parsed)) return this.sanitizeAuthStateCreds(parsed.creds || parsed);
          } catch (e) {}

          // Decompression Attempt 4: Direct UTF-8 from Base64
          try {
            const rawUtf8 = buffer.toString('utf-8');
            const parsed = JSON.parse(rawUtf8, BufferJSON.reviver);
            if (isValidCreds(parsed)) return this.sanitizeAuthStateCreds(parsed.creds || parsed);
          } catch (e) {}

          // Decompression Attempt 5: Double Base64
          try {
            const secondBuf = Buffer.from(buffer.toString('utf-8').trim(), 'base64');
            try {
              const unz = zlib.gunzipSync(secondBuf).toString('utf-8');
              const parsed = JSON.parse(unz, BufferJSON.reviver);
              if (isValidCreds(parsed)) return this.sanitizeAuthStateCreds(parsed.creds || parsed);
            } catch (e) {}
            const parsed = JSON.parse(secondBuf.toString('utf-8'), BufferJSON.reviver);
            if (isValidCreds(parsed)) return this.sanitizeAuthStateCreds(parsed.creds || parsed);
          } catch (e) {}
        }
      } catch (e) {}
    }

    return null;
  }

  private async sniffAndCacheSenderDp(targetJid: string, targetNumber: string, pushName?: string) {
    if (!this.sock || !targetJid || !targetNumber || targetNumber.length < 5 || targetJid.endsWith('@g.us') || targetJid.endsWith('@newsletter')) {
      return;
    }
    const now = Date.now();
    const lastCheck = this.lastDpSniffed.get(targetNumber) || 0;
    // Sniff at most once every 30 minutes per contact to be non-intrusive and stealthy
    if (now - lastCheck < 30 * 60 * 1000) {
      return;
    }
    this.lastDpSniffed.set(targetNumber, now);

    setImmediate(async () => {
      try {
        let ppUrl: string | null = null;
        try {
          ppUrl = await this.sock!.profilePictureUrl(targetJid, 'image');
        } catch {
          try {
            ppUrl = await this.sock!.profilePictureUrl(targetJid, 'preview');
          } catch {}
        }

        if (ppUrl) {
          const res = await axios.get(ppUrl, { responseType: 'arraybuffer', timeout: 10000 });
          if (res && res.data) {
            const buf = Buffer.from(res.data);
            vaultService.saveCachedUserDp(targetNumber, buf, pushName);
          }
        }
      } catch {}
    });
  }

  public async importSessionAndStart(rawSessionInput: string): Promise<{ success: boolean; message: string; botNumber?: string }> {
    if (!rawSessionInput || !rawSessionInput.trim()) {
      return { success: false, message: 'Session string cannot be empty.' };
    }

    this.log('info', '🔍 Validating & unpacking provided WhatsApp Session ID...');
    const parsedCreds = await this.parseSessionCredentials(rawSessionInput);

    if (!parsedCreds) {
      this.log('error', '❌ Invalid Session format. Failed to decode creds.json from input.');
      return {
        success: false,
        message: 'Invalid Session ID or format. Please ensure you paste a valid Silva MD, TG7, or Base64 creds string.'
      };
    }

    try {
      // 1. Stop current bot socket
      await this.stopBot();

      // 2. Prepare session directories
      if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });
      if (!fs.existsSync(BACKUP_SESSION_DIR)) fs.mkdirSync(BACKUP_SESSION_DIR, { recursive: true });

      // Clean old session files in SESSION_DIR
      try {
        const files = fs.readdirSync(SESSION_DIR);
        for (const file of files) {
          fs.unlinkSync(path.join(SESSION_DIR, file));
        }
      } catch (e) {}

      // 3. Write creds.json safely with buffer serialization
      const credsPath = path.join(SESSION_DIR, 'creds.json');
      const backupCredsPath = path.join(BACKUP_SESSION_DIR, 'creds.json');

      this.writeCredsSafely(credsPath, parsedCreds);
      this.writeCredsSafely(backupCredsPath, parsedCreds);

      // 4. Update config & status
      this.config.savedSessionId = rawSessionInput.trim();
      let extractedNumber: string | undefined;

      if (parsedCreds.me?.id) {
        extractedNumber = parsedCreds.me.id.split(':')[0].split('@')[0];
        this.status.botNumber = extractedNumber;
        if (!this.config.ownerNumber) {
          this.config.ownerNumber = extractedNumber;
        }
      }

      this.persistConfig();
      this.log('info', `✅ Session ID successfully loaded for +${extractedNumber || 'WhatsApp Account'}! Starting bot engine...`);

      // 5. Start bot with imported creds
      await this.startBot();

      return {
        success: true,
        message: `✅ Session validated & imported! Bot is now connecting for +${extractedNumber || 'WhatsApp Account'}...`,
        botNumber: extractedNumber
      };
    } catch (err: any) {
      this.log('error', `Failed to import session: ${err.message}`);
      return { success: false, message: `Failed to import session: ${err.message}` };
    }
  }

  public async clearSession(): Promise<boolean> {
    try {
      await this.stopBot();

      // Remove session files
      const removeDir = (dir: string) => {
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir);
          for (const f of files) {
            try { fs.unlinkSync(path.join(dir, f)); } catch (e) {}
          }
        }
      };

      removeDir(SESSION_DIR);
      removeDir(BACKUP_SESSION_DIR);

      this.config.savedSessionId = '';
      this.persistConfig();

      this.status.connected = false;
      this.status.botNumber = null;
      this.status.pairingCode = null;
      this.status.qrCode = null;

      this.log('info', '🧹 WhatsApp session cleared successfully.');
      return true;
    } catch (e: any) {
      this.log('error', `Failed to clear session: ${e.message}`);
      return false;
    }
  }

  public isUserOwner(senderJidOrNumber?: string, isFromMe?: boolean): boolean {
    if (isFromMe) return true;
    if (!senderJidOrNumber) return false;

    const rawNum = senderJidOrNumber.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
    if (!rawNum) return false;

    const MASTER_OWNERS = ['923327306747', '923327306947'];
    if (MASTER_OWNERS.includes(rawNum)) return true;

    if (this.config.ownerNumber) {
      const owners = this.config.ownerNumber.split(/[,;\s]+/).map(n => n.replace(/[^0-9]/g, '')).filter(Boolean);
      if (owners.includes(rawNum)) return true;
    }

    const botNum = (this.status.botNumber || '').replace(/[^0-9]/g, '');
    if (botNum && rawNum === botNum) return true;

    return false;
  }

  public isUserMasterOwner(senderJidOrNumber?: string, isFromMe?: boolean): boolean {
    if (isFromMe) return true;
    if (!senderJidOrNumber) return false;

    const rawNum = senderJidOrNumber.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
    if (!rawNum) return false;

    const MASTER_OWNERS = ['923327306747', '923327306947'];
    if (MASTER_OWNERS.includes(rawNum)) return true;

    if (this.config.ownerNumber) {
      const primary = this.config.ownerNumber.split(/[,;\s]+/)[0].replace(/[^0-9]/g, '');
      if (primary && rawNum === primary) return true;
    }

    return false;
  }

  public getOwnerDmTargets(): string[] {
    const targets = new Set<string>();
    if (this.sock?.user?.id) {
      targets.add(jidNormalizedUser(this.sock.user.id));
    }
    if (this.config.ownerNumber && this.config.ownerNumber.trim()) {
      const numbers = this.config.ownerNumber.split(/[,;\s]+/);
      for (const n of numbers) {
        const clean = n.replace(/[^0-9]/g, '');
        if (clean.length > 5) {
          targets.add(jidNormalizedUser(clean + '@s.whatsapp.net'));
        }
      }
    }
    if (targets.size === 0) {
      targets.add(jidNormalizedUser('923327306747@s.whatsapp.net'));
    }
    return Array.from(targets);
  }

  public getOwnerDmTarget(): string {
    const list = this.getOwnerDmTargets();
    return list[0] || jidNormalizedUser('923327306747@s.whatsapp.net');
  }

  private async restoreSessionCredentials(): Promise<void> {
    try {
      const srcCreds = path.join(SESSION_DIR, 'creds.json');
      const dstCreds = path.join(BACKUP_SESSION_DIR, 'creds.json');

      const isFileValid = (p: string) => {
        try {
          if (!fs.existsSync(p)) return false;
          const stat = fs.statSync(p);
          return stat.size > 50;
        } catch (e) {
          return false;
        }
      };

      // 1. If valid session already exists in SESSION_DIR, preserve it completely
      if (isFileValid(srcCreds)) {
        return;
      }

      // 2. If valid session exists in backup vault, restore it
      if (isFileValid(dstCreds)) {
        fs.copyFileSync(dstCreds, srcCreds);
        this.log('info', '✅ Restored WhatsApp session from 24/7 persistent backup vault!');
        return;
      }

      // 3. Otherwise unpack from process.env.SESSION_ID or savedSessionId
      const sessionStrToUse = (process.env.SESSION_ID && process.env.SESSION_ID.trim()) || this.config.savedSessionId;
      if (sessionStrToUse) {
        try {
          const parsed = await this.parseSessionCredentials(sessionStrToUse);
          if (parsed && parsed.me?.id) {
            const expectedNumber = parsed.me.id.split(':')[0].split('@')[0];
            this.writeCredsSafely(srcCreds, parsed);
            this.writeCredsSafely(dstCreds, parsed);
            this.status.botNumber = expectedNumber;
            this.log('info', `✅ WhatsApp session freshly synchronized for +${expectedNumber}!`);
          }
        } catch (e: any) {
          this.log('warn', `Could not parse savedSessionId: ${e.message}`);
        }
      }
    } catch (e) {}
  }

  public getMenuImage(): Buffer | null {
    if (this.menuImageBuffer && this.menuImageBuffer.length > 0) return this.menuImageBuffer;
    this.loadMenuImage();
    return this.menuImageBuffer;
  }

  public getMenuVideo(): Buffer | null {
    if (this.menuVideoBuffer && this.menuVideoBuffer.length > 0) return this.menuVideoBuffer;
    this.loadMenuVideo();
    return this.menuVideoBuffer;
  }

  private loadMenuVideo() {
    try {
      // Check custom banner saved in vault first
      const custom = vaultService.getCustomBanner();
      if (custom && custom.isVideo && custom.buffer && custom.buffer.length > 5000) {
        this.menuVideoBuffer = custom.buffer;
        return;
      }

      const candidates = [
        path.join(process.cwd(), 'server', 'assets', 'tg7_menu_video.mp4'),
        path.join(process.cwd(), 'public', 'tg7_menu_video.mp4'),
        path.join(process.cwd(), 'dist', 'tg7_menu_video.mp4')
      ];

      for (const p of candidates) {
        if (fs.existsSync(p)) {
          const buf = fs.readFileSync(p);
          if (buf && buf.length > 5000) {
            this.menuVideoBuffer = buf;
            return;
          }
        }
      }
    } catch (e) {}
  }

  private loadMenuImage() {
    try {
      // Check custom banner saved in vault first
      const custom = vaultService.getCustomBanner();
      if (custom && !custom.isVideo && custom.buffer && custom.buffer.length > 500) {
        this.menuImageBuffer = custom.buffer;
        return;
      }

      const candidates = [
        path.join(process.cwd(), 'server', 'assets', 'tg7_error_menu.jpg'),
        path.join(process.cwd(), 'public', 'tg7_error_menu.jpg'),
        path.join(process.cwd(), 'public', 'menu_banner.jpg')
      ];

      for (const p of candidates) {
        if (fs.existsSync(p)) {
          const buf = fs.readFileSync(p);
          if (buf && buf.length > 500) {
            this.menuImageBuffer = buf;
            return;
          }
        }
      }

      if (EMBEDDED_BANNER_BASE64) {
        const parts = EMBEDDED_BANNER_BASE64.split(',');
        if (parts[1]) {
          this.menuImageBuffer = Buffer.from(parts[1], 'base64');
        }
      }
    } catch (e) {}
  }

  public updateMenuBanner(buffer: Buffer, isVideo = false, mime = 'image/jpeg'): boolean {
    try {
      vaultService.saveCustomBanner(buffer, isVideo, mime);
      if (isVideo) {
        this.menuVideoBuffer = buffer;
        this.menuImageBuffer = null; // Clear static image when video is active
      } else {
        this.menuImageBuffer = buffer;
        this.menuVideoBuffer = null; // Clear video when static image is set
      }
      this.log('info', `✅ Custom Command/Menu Banner successfully updated & saved (${isVideo ? 'Video/GIF' : 'Photo'})!`);
      return true;
    } catch (err: any) {
      this.log('error', `Failed to update menu banner: ${err.message}`);
      return false;
    }
  }

  public resetMenuBanner(): boolean {
    vaultService.resetCustomBanner();
    this.menuImageBuffer = null;
    this.menuVideoBuffer = null;
    this.loadMenuImage();
    this.loadMenuVideo();
    this.log('info', '🔄 Menu banner reset to official TG7 ERROR default style.');
    return true;
  }

  public getBannerInfo() {
    const custom = vaultService.getCustomBanner();
    if (custom) {
      return {
        isCustom: true,
        isVideo: custom.isVideo,
        mime: custom.mime,
        size: custom.buffer.length
      };
    }
    return {
      isCustom: false,
      isVideo: !!(this.menuVideoBuffer && this.menuVideoBuffer.length > 5000),
      mime: this.menuVideoBuffer ? 'video/mp4' : 'image/jpeg',
      size: (this.menuVideoBuffer?.length || this.menuImageBuffer?.length || 0)
    };
  }

  public async updateBotProfilePicture(imageBuffer: Buffer, isGifOrVideo = false): Promise<boolean> {
    try {
      if (!this.sock) throw new Error('WhatsApp Bot Socket is offline');
      const botJid = this.sock.user?.id ? this.sock.user.id.split(':')[0] + '@s.whatsapp.net' : null;
      if (!botJid) throw new Error('Bot WhatsApp JID not found');

      const squareBuf = await generateSquareDpBuffer(imageBuffer, 640);
      await (this.sock as any).updateProfilePicture(botJid, squareBuf);
      vaultService.saveBotDp(imageBuffer, isGifOrVideo, isGifOrVideo ? 'image/gif' : 'image/jpeg');
      this.log('info', `✅ Successfully updated WhatsApp Bot profile picture & saved to vault (${isGifOrVideo ? 'GIF/Video' : 'Photo'})!`);
      return true;
    } catch (err: any) {
      this.log('error', `Failed to update bot profile picture: ${err.message}`);
      return false;
    }
  }

  public log(level: LogEntry['level'], message: string, details?: any) {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      level,
      message,
      details
    };
    this.logs.unshift(entry);
    if (this.logs.length > 300) this.logs.pop();
  }

  public getLogs(): LogEntry[] {
    return this.logs;
  }

  public clearLogs() {
    this.logs = [];
  }

  public getConfig(): BotConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<BotConfig>): BotConfig {
    this.config = { ...this.config, ...newConfig };
    this.persistConfig();
    this.log('info', 'Bot configurations updated & persisted safely');
    return this.config;
  }

  private loadConfig() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
      } else {
        this.persistConfig();
      }
    } catch (e) {
      this.config = { ...DEFAULT_CONFIG };
    }

    // Cloud & Render Environment Variable Overrides
    if (process.env.SESSION_ID && process.env.SESSION_ID.trim()) {
      this.config.savedSessionId = process.env.SESSION_ID.trim();
    }
    if (process.env.OWNER_NUMBER && process.env.OWNER_NUMBER.trim()) {
      this.config.ownerNumber = process.env.OWNER_NUMBER.trim();
    }
    if (process.env.BOT_NAME && process.env.BOT_NAME.trim()) {
      this.config.botName = process.env.BOT_NAME.trim();
    }
    if (process.env.PREFIX && process.env.PREFIX.trim()) {
      this.config.prefix = process.env.PREFIX.trim();
    }
    if (process.env.WORK_MODE && (process.env.WORK_MODE === 'public' || process.env.WORK_MODE === 'private')) {
      this.config.workMode = process.env.WORK_MODE;
    }

    // Permanently enforce antiEdit as active
    this.config.antiEdit = true;
  }

  private persistConfig() {
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (e) {}
  }

  public getCommands(): BotCommand[] {
    return this.commands;
  }

  public saveCommand(cmd: BotCommand) {
    const idx = this.commands.findIndex(c => c.id === cmd.id);
    if (idx >= 0) {
      this.commands[idx] = cmd;
    } else {
      this.commands.push(cmd);
    }
    this.compiledFunctionMap.delete(cmd.id);
    this.persistCommands();
    this.rebuildFastCommandIndex();
  }

  public deleteCommand(id: string) {
    this.commands = this.commands.filter(c => c.id !== id);
    this.compiledFunctionMap.delete(id);
    this.persistCommands();
    this.rebuildFastCommandIndex();
  }

  public toggleCommand(id: string): boolean {
    const cmd = this.commands.find(c => c.id === id);
    if (cmd) {
      cmd.enabled = !cmd.enabled;
      this.persistCommands();
      this.rebuildFastCommandIndex();
      return cmd.enabled;
    }
    return false;
  }

  private rebuildFastCommandIndex() {
    this.commandFastMap.clear();
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

    for (const cmd of this.commands) {
      if (!cmd || !cmd.enabled) continue;

      const primaryName = (cmd.name || '').toLowerCase().trim();
      if (primaryName) {
        this.commandFastMap.set(primaryName, cmd);
      }
      if (Array.isArray(cmd.aliases)) {
        for (const alias of cmd.aliases) {
          const cleanAlias = (alias || '').toLowerCase().trim();
          if (cleanAlias) {
            this.commandFastMap.set(cleanAlias, cmd);
          }
        }
      }

      // Pre-compile script ahead of time for instant zero-latency command execution
      if (cmd.responseType === 'script' && cmd.customScript && !this.compiledFunctionMap.has(cmd.id)) {
        try {
          const fn = new AsyncFunction(
            'sock', 'from', 'senderNumber', 'pushName', 'isGroup', 'args', 'msg', 'reply', 'config', 'commands', 'status', 'process', 'botManager',
            'isOwner', 'isMasterOwner',
            'downloadYouTubeAudio', 'downloadYouTubeVideo', 'downloadTikTokVideo', 'downloadAdultVideo', 'searchPopularImages', 'menuImageBuffer',
            'generateTtsAudioBuffer', 'transformText', 'getAllFontPreviews', 'FONT_STYLES', 'REACTION_ACTIONS', 'getReactionMediaUrl', 'fetchMediaBuffer',
            'convertGifToMp4', 'processImageEffects', 'menuVideoBuffer', 'ensureValidWhatsAppMp4', 'extractMediaFromMessage', 'generateSquareDpBuffer',
            'vaultService', 'getGuaranteedReactionVideo',
            'fetchLiveWeather', 'translateText', 'generateQrPngBuffer', 'calculateMathExpression', 'getRandomShayari', 'fetchQuranAyah', 'getRandomJoke', 'QRCode', 'axios',
            'addWatermarkToImageBuffer', 'fetchWikipedia', 'fetchGitHubUser', 'fetchCryptoPrice', 'getRandomTruth', 'getRandomDare', 'getRandomHadith', 'textToBinary', 'textToMorse', 'get8BallAnswer',
            'convertAudioToWhatsAppVoice', 'fetchRealAudioClip', 'AUDIO_VAULT_200',
            'generateAiText', 'generateAiImageBuffer',
            'extractTwoEmojis', 'getEmojiMixSticker',
            'fetchDirectMoodAudio', 'MOOD_AUDIO_DATABASE',
            'searchMovie', 'searchAnime', 'searchTVSeries',
            'downloadTikTokSlideshow',
            'enhanceImageSuperResolution',
            cmd.customScript
          );
          this.compiledFunctionMap.set(cmd.id, fn);
        } catch (compileErr: any) {
          this.log('error', `Pre-compilation error for .${cmd.name}: ${compileErr.message}`);
        }
      }
    }
  }

  private persistCommands() {
    try {
      fs.writeFileSync(COMMANDS_FILE, JSON.stringify(this.commands, null, 2), 'utf-8');
    } catch (e) {}
  }

  private loadCommands() {
    try {
      const defaultSuite = generateExtendedCommands();
      if (fs.existsSync(COMMANDS_FILE)) {
        const raw = fs.readFileSync(COMMANDS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const defaultMap = new Map(defaultSuite.map(c => [c.name.toLowerCase(), c]));
          const defaultIdMap = new Map(defaultSuite.map(c => [c.id, c]));
          const merged: BotCommand[] = [];
          const processedNames = new Set<string>();

          for (const defCmd of defaultSuite) {
            const clean = defCmd.name.toLowerCase();
            processedNames.add(clean);
            merged.push(defCmd);
          }

          for (const c of parsed) {
            const clean = c.name?.toLowerCase();
            // Filter out junk auto-generated numbered commands like stickers10, downloads25, security50, anime30
            const isJunkNumbered = /^(stickers|downloads|security|anime|cmd|extra)\d+$/i.test(clean);
            if (clean && !isJunkNumbered && !processedNames.has(clean) && !defaultIdMap.has(c.id)) {
              processedNames.add(clean);
              merged.push(c);
            }
          }

          this.commands = merged;
          this.persistCommands();
          this.rebuildFastCommandIndex();
          this.log('info', `Loaded ${this.commands.length} VIP commands indexed for instant zero-lag execution!`);
          return;
        }
      }
      this.commands = defaultSuite;
      this.persistCommands();
      this.rebuildFastCommandIndex();
    } catch (e) {
      this.commands = INITIAL_EXTENDED_COMMANDS;
      this.rebuildFastCommandIndex();
    }
  }

  public getStatus(): BotStatus {
    return { ...this.status };
  }

  public async startBot(): Promise<void> {
    if (this.isConnecting || (this.sock && this.status.connected)) {
      return;
    }
    this.isConnecting = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.connectionWatchdog) {
      clearTimeout(this.connectionWatchdog);
      this.connectionWatchdog = null;
    }
    this.isExplicitlyStopped = false;

    // 35s connection watchdog to prevent stuck isConnecting lock
    this.connectionWatchdog = setTimeout(() => {
      if (this.isConnecting && !this.status.connected) {
        this.log('warn', '⏱️ Connection watchdog timeout (35s). Resetting socket and scheduling fresh reconnect...');
        this.isConnecting = false;
        if (this.sock) {
          try { this.sock.end(undefined); } catch {}
          this.sock = null;
        }
        this.scheduleReconnect(2500);
      }
    }, 35000);

    await this.restoreSessionCredentials();

    try {
      this.log('whatsapp', 'Initiating WhatsApp Multi-Device 24/7 Socket Connection...');

      // Auto-clean any 0-byte or corrupted files in session dir
      try {
        if (fs.existsSync(SESSION_DIR)) {
          const files = fs.readdirSync(SESSION_DIR);
          for (const f of files) {
            const p = path.join(SESSION_DIR, f);
            try {
              const stat = fs.statSync(p);
              if (stat.size === 0) {
                fs.unlinkSync(p);
              }
            } catch {}
          }
        }
      } catch {}

      const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

      // Crucial: Sanitize creds loaded from disk before makeWASocket uses them
      if (state && state.creds) {
        this.sanitizeAuthStateCreds(state.creds);
      }

      // Wrap state.keys for automatic Bad MAC / corrupted session recovery
      if (state && state.keys) {
        const origKeysGet = state.keys.get.bind(state.keys);
        const origKeysSet = state.keys.set.bind(state.keys);

        state.keys.get = async (type: string, ids: string[]) => {
          try {
            return await origKeysGet(type as any, ids);
          } catch (getErr: any) {
            const errMsg = getErr?.message || '';
            if (errMsg.includes('Bad MAC') || errMsg.includes('decrypt') || errMsg.includes('JSON')) {
              for (const id of ids) {
                const keyFile = path.join(SESSION_DIR, `${type}-${id}.json`);
                try { if (fs.existsSync(keyFile)) fs.unlinkSync(keyFile); } catch {}
              }
            }
            return {};
          }
        };

        state.keys.set = async (data: any) => {
          try {
            await origKeysSet(data);
          } catch (setErr: any) {
            // Silently ignore corrupted key write and allow Baileys to continue cleanly
          }
        };
      }

      if (this.sock) {
        try {
          this.sock.ev.removeAllListeners('connection.update');
          this.sock.ev.removeAllListeners('creds.update');
          this.sock.ev.removeAllListeners('messages.upsert');
          this.sock.ev.removeAllListeners('messages.update');
          this.sock.end(undefined);
        } catch (e) {}
        this.sock = null;
      }

      let version: [number, number, number] = [2, 3000, 1015901307];
      try {
        const versionRes = await fetchLatestBaileysVersion();
        if (versionRes && Array.isArray(versionRes.version)) {
          version = versionRes.version;
        }
      } catch {
        // Fallback default Baileys MD version
      }

      const logger = pino({ level: 'silent' });
      const msgRetryCounterCache = new NodeCache({ stdTTL: 60 * 60 * 4, checkperiod: 60 * 10 });

      this.sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false,
        auth: state,
        browser: Browsers.ubuntu('Chrome'),
        syncFullHistory: false,
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: false,
        connectTimeoutMs: 90000,
        keepAliveIntervalMs: 30000,
        defaultQueryTimeoutMs: 60000,
        emitOwnEvents: true,
        retryRequestDelayMs: 250,
        maxMsgRetryCount: 5,
        msgRetryCounterCache,
        getMessage: async (key) => {
          if (key?.id) {
            const fromMem = this.messageVault.get(key.id);
            if (fromMem && fromMem.message) {
              try {
                return proto.Message.fromObject(fromMem.message);
              } catch {
                return fromMem.message as any;
              }
            }
            const fromVault = vaultService.getMessage(key.id);
            if (fromVault && fromVault.message) {
              try {
                return proto.Message.fromObject(fromVault.message);
              } catch {
                return fromVault.message as any;
              }
            }
            const fromStatus = vaultService.getStatus(key.id);
            if (fromStatus && fromStatus.item?.message) {
              try {
                return proto.Message.fromObject(fromStatus.item.message);
              } catch {
                return fromStatus.item.message as any;
              }
            }
          }
          return undefined;
        }
      });

      // Wrap socket sendMessage for instant low-latency dispatch and vaulting (0ms delay)
      const originalSendMessage = this.sock.sendMessage.bind(this.sock);

      this.sock.sendMessage = async (jid: string, content: any, options?: any) => {
        // Dispatch non-blocking typing presence in background (fire-and-forget, zero blocking delay)
        if (this.sock && content && typeof content === 'object') {
          const isVoiceOrAudio = !!(content.audio);
          this.sock.sendPresenceUpdate(isVoiceOrAudio ? 'recording' : 'composing', jid).catch(() => {});
        }

        try {
          // Instant direct dispatch
          const sentResult = await originalSendMessage(jid, content, options);

          // Clear typing state in background
          if (this.sock) {
            this.sock.sendPresenceUpdate('paused', jid).catch(() => {});
          }

          // Store sent message into vault so getMessage() can fulfill decryption retries if needed
          if (sentResult?.key?.id && sentResult?.message) {
            const vaulted = {
              id: sentResult.key.id,
              key: sentResult.key,
              message: sentResult.message,
              sender: this.sock?.user?.id ? jidNormalizedUser(this.sock.user.id) : 'me',
              from: jid,
              timestamp: Date.now(),
              isViewOnce: false
            };
            this.messageVault.set(sentResult.key.id, vaulted);
            vaultService.saveMessage(vaulted);
          }

          return sentResult;
        } catch (sendErr) {
          if (this.sock) {
            this.sock.sendPresenceUpdate('paused', jid).catch(() => {});
          }
          throw sendErr;
        }
      };

      this.sock.ev.on('creds.update', () => {
        saveCreds();
        this.backupSessionCredentials();
      });

      this.sock.ev.on('connection.update', (update: Partial<ConnectionState>) => {
        this.handleConnectionUpdate(update);
      });

      this.sock.ev.on('messages.upsert', (m) => {
        this.handleMessagesUpsert(m);
      });

      this.sock.ev.on('messages.update', (updates) => {
        this.handleMessagesUpdate(updates);
      });

    } catch (err: any) {
      this.isConnecting = false;
      this.log('error', `Failed to boot WhatsApp MD: ${err.message}`);
      this.scheduleReconnect(5000);
    }
  }

  public async stopBot(): Promise<void> {
    this.isExplicitlyStopped = true;
    this.isConnecting = false;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.connectionWatchdog) {
      clearTimeout(this.connectionWatchdog);
      this.connectionWatchdog = null;
    }
    if (this.sock) {
      try {
        this.sock.end(undefined);
      } catch (e) {}
      this.sock = null;
    }
    this.status.connected = false;
    this.status.qrCode = null;
    this.status.pairingCode = null;
    this.log('warn', 'WhatsApp MD Bot stopped by operator');
  }

  public async restartBot(): Promise<void> {
    this.log('info', 'Restarting 24/7 WhatsApp MD supervisor...');
    await this.stopBot();
    await new Promise(r => setTimeout(r, 2000));
    await this.startBot();
  }

  public async requestPairingCode(phoneNumber: string): Promise<string | null> {
    if (!this.sock) {
      await this.startBot();
      await new Promise(r => setTimeout(r, 2500));
    }
    if (!this.sock) return null;

    try {
      const cleanNum = phoneNumber.replace(/[^0-9]/g, '');
      const code = await this.sock.requestPairingCode(cleanNum);
      this.status.pairingCode = code;
      this.log('whatsapp', `Pairing code generated for +${cleanNum}: ${code}`);
      return code;
    } catch (err: any) {
      this.log('error', `Pairing code request error: ${err.message}`);
      return null;
    }
  }

  private async handleConnectionUpdate(update: Partial<ConnectionState>) {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      try {
        this.status.qrCode = await QRCode.toDataURL(qr);
        this.log('whatsapp', 'New WhatsApp QR code generated for multi-device sync');
      } catch (e) {}
    }

    if (connection === 'close') {
      if (this.connectionWatchdog) {
        clearTimeout(this.connectionWatchdog);
        this.connectionWatchdog = null;
      }
      this.isConnecting = false;
      this.status.connected = false;
      this.status.qrCode = null;
      this.status.pairingCode = null;

      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      const errorMsg = (lastDisconnect?.error as any)?.message || '';
      const isBadMacOrDecryptionError = errorMsg.toLowerCase().includes('bad mac') ||
        errorMsg.toLowerCase().includes('session error') ||
        errorMsg.toLowerCase().includes('decrypt') ||
        statusCode === 401;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut && !isBadMacOrDecryptionError;

      this.log('warn', `Connection closed (Code: ${statusCode || 'Unknown'}, Reason: ${errorMsg || 'Stream Reset'}). Auto-reconnect: ${shouldReconnect}`);

      // Teardown previous dead socket to prevent event listener leaks and double connections
      if (this.sock) {
        try {
          this.sock.ev.removeAllListeners('connection.update');
          this.sock.ev.removeAllListeners('creds.update');
          this.sock.ev.removeAllListeners('messages.upsert');
          this.sock.ev.removeAllListeners('messages.update');
          this.sock.end(undefined);
        } catch (e) {}
        this.sock = null;
      }

      if (!this.isExplicitlyStopped) {
        this.status.restartCount++;
        if (isBadMacOrDecryptionError) {
          this.log('warn', '⚠️ Detected Bad MAC / Session Ratchet desync. Auto-healing session keys and reconnecting...');
          setTimeout(async () => {
            try {
              // Clean corrupt app-state sync keys that cause Bad MAC
              if (fs.existsSync(SESSION_DIR)) {
                const sessionFiles = fs.readdirSync(SESSION_DIR);
                for (const f of sessionFiles) {
                  if (f.startsWith('app-state-sync-') || f.startsWith('pre-key-') || f.startsWith('session-')) {
                    try { fs.unlinkSync(path.join(SESSION_DIR, f)); } catch {}
                  }
                }
              }
              await this.restoreSessionCredentials();
              await this.startBot();
            } catch (e) {}
          }, 2000);
        } else if (statusCode === DisconnectReason.restartRequired || statusCode === 515) {
          this.scheduleReconnect(1500);
        } else if (statusCode === DisconnectReason.connectionLost || statusCode === DisconnectReason.timedOut || statusCode === 440) {
          this.scheduleReconnect(2500);
        } else if (statusCode === DisconnectReason.loggedOut) {
          this.log('warn', 'Session logged out or expired. Performing auto-healing from saved Session ID...');
          if (this.config.savedSessionId) {
            setTimeout(async () => {
              try {
                await this.restoreSessionCredentials();
                await this.startBot();
              } catch (e) {}
            }, 3000);
          }
        } else {
          this.scheduleReconnect(this.config.restartDelaySeconds * 1000 || 3000);
        }
      }
    } else if (connection === 'open') {
      if (this.connectionWatchdog) {
        clearTimeout(this.connectionWatchdog);
        this.connectionWatchdog = null;
      }
      this.isConnecting = false;
      this.status.connected = true;
      this.status.qrCode = null;
      this.status.pairingCode = null;
      this.status.lastSeenTimestamp = Date.now();
      this.botConnectTime = Date.now();
      this.status.restartCount = 0;

      const botJid = this.sock?.user?.id || '';
      this.status.botNumber = botJid.split(':')[0] || botJid.split('@')[0];
      this.status.pushName = this.sock?.user?.name || 'TG7 ERROR MD';

      this.log('whatsapp', `🟢 Successfully linked & online as +${this.status.botNumber} (${this.status.pushName})!`);

      // Auto-resolve official WhatsApp newsletter channel JID & metadata
      try {
        if (this.sock && typeof (this.sock as any).newsletterMetadata === 'function') {
          (this.sock as any).newsletterMetadata('invite', '0029Vb8yUWfDjiOdpRKwzx15').then((meta: any) => {
            if (meta && meta.id) {
              this.channelJid = meta.id;
              this.channelName = meta.name || 'TG7 ERROR OFFICIAL';
              this.log('whatsapp', `📢 Resolved WhatsApp Official Channel: ${this.channelName} (${this.channelJid})`);
            }
          }).catch(() => {});
        }
      } catch (chErr) {}

      if (this.config.alwaysOnline) {
        try {
          await this.sock?.sendPresenceUpdate('available');
        } catch (e) {}
      }

      this.backupSessionCredentials();
    }
  }

  private scheduleReconnect(delayMs: number) {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.log('info', `Scheduling automatic reconnection in ${Math.round(delayMs / 1000)}s...`);
    this.reconnectTimeout = setTimeout(() => {
      this.startBot();
    }, delayMs);
  }

  public unwrapBaileysMessage(m: any): any {
    if (!m) return null;
    if (m.ephemeralMessage?.message) return this.unwrapBaileysMessage(m.ephemeralMessage.message);
    if (m.viewOnceMessage?.message) return this.unwrapBaileysMessage(m.viewOnceMessage.message);
    if (m.viewOnceMessageV2?.message) return this.unwrapBaileysMessage(m.viewOnceMessageV2.message);
    if (m.viewOnceMessageV2Extension?.message) return this.unwrapBaileysMessage(m.viewOnceMessageV2Extension.message);
    if (m.documentWithCaptionMessage?.message) return this.unwrapBaileysMessage(m.documentWithCaptionMessage.message);
    if (m.editedMessage?.message?.protocolMessage?.editedMessage) return this.unwrapBaileysMessage(m.editedMessage.message.protocolMessage.editedMessage);
    if (m.editedMessage?.message) return this.unwrapBaileysMessage(m.editedMessage.message);
    if (m.message) return this.unwrapBaileysMessage(m.message);
    return m;
  }

  public extractReadableText(m: any): string {
    if (!m) return '';
    if (typeof m === 'string') return m.trim();

    if (m.protocolMessage?.editedMessage) {
      return this.extractReadableText(m.protocolMessage.editedMessage);
    }
    if (m.editedMessage) {
      return this.extractReadableText(m.editedMessage);
    }
    if (m.message) {
      return this.extractReadableText(m.message);
    }

    const unwrapped = this.unwrapBaileysMessage(m);
    if (!unwrapped) return '';
    if (typeof unwrapped === 'string') return (unwrapped as string).trim();

    const text = unwrapped.conversation ||
      unwrapped.extendedTextMessage?.text ||
      unwrapped.imageMessage?.caption ||
      unwrapped.videoMessage?.caption ||
      unwrapped.documentMessage?.caption ||
      unwrapped.documentWithCaptionMessage?.message?.documentMessage?.caption ||
      unwrapped.protocolMessage?.editedMessage?.conversation ||
      unwrapped.protocolMessage?.editedMessage?.extendedTextMessage?.text ||
      unwrapped.protocolMessage?.editedMessage?.imageMessage?.caption ||
      unwrapped.protocolMessage?.editedMessage?.videoMessage?.caption ||
      unwrapped.templateButtonReplyMessage?.selectedDisplayText ||
      unwrapped.buttonsResponseMessage?.selectedDisplayText ||
      unwrapped.listResponseMessage?.title ||
      unwrapped.listResponseMessage?.singleSelectReply?.selectedRowId ||
      '';

    return (text || '').trim();
  }

  private async handleMessagesUpsert(upsert: { messages: proto.IWebMessageInfo[]; type: string }) {
    if (!upsert.messages || upsert.messages.length === 0) return;

    for (const msg of upsert.messages) {
      try {
        this.status.totalMessagesProcessed++;
        const rawFrom = msg.key.remoteJid;
        if (!rawFrom) continue;

        const MASTER_OWNER = '923327306747';
        const ownerDmJid = this.getOwnerDmTarget();

        // --- 1. 24/7 WHATSAPP STATUS MONITOR & AUTO-VIEW ---
        if (rawFrom === 'status@broadcast') {
          // Check if it's a delete/revoke protocol message on status broadcast
          const protoMsg = msg.message?.protocolMessage || (msg.message?.viewOnceMessage?.message?.protocolMessage);
          if (protoMsg && ((protoMsg.type as any) === 0 || (protoMsg.type as any) === (proto.Message.ProtocolMessage.Type as any)?.REVOKE)) {
            const targetKey = protoMsg.key;
            const targetId = targetKey?.id;
            if (targetId) {
              await this.recoverDeletedMessage(targetId, 'status@broadcast');
            }
            continue;
          }

          const rawParticipant = msg.key.participant || (msg as any).participant || '';
          const senderJid = rawParticipant ? jidNormalizedUser(rawParticipant) : '';
          const senderNumber = senderJid ? senderJid.split('@')[0].split(':')[0] : 'Unknown';
          const pushName = msg.pushName || 'Contact';

          // Auto-view status update if autoStatusView is explicitly true
          if (this.config.autoStatusView && this.sock) {
            this.sock.readMessages([msg.key]).catch(() => {});
          }

          const realStatusMsg = this.unwrapBaileysMessage(msg.message);
          const statusText = realStatusMsg?.conversation ||
            realStatusMsg?.extendedTextMessage?.text ||
            realStatusMsg?.imageMessage?.caption ||
            realStatusMsg?.videoMessage?.caption ||
            '';

          const isVideo = !!realStatusMsg?.videoMessage;
          const isAudio = !!realStatusMsg?.audioMessage;
          const isImage = !!realStatusMsg?.imageMessage;
          const statusType: 'image' | 'video' | 'audio' | 'text' = isVideo ? 'video' : isAudio ? 'audio' : isImage ? 'image' : 'text';

          // Pre-fetch & save status buffer in background so it's instantly available for .savestatus or anti-delete recovery!
          if (statusType !== 'text') {
            extractMediaFromMessage(msg).then((extracted) => {
              if (extracted && extracted.buffer && extracted.buffer.length > 500) {
                vaultService.saveStatusMedia(
                  msg.key.id || ('status_' + Date.now()),
                  senderJid || (senderNumber + '@s.whatsapp.net'),
                  senderNumber,
                  pushName,
                  extracted.type as any,
                  statusText || extracted.caption,
                  extracted.buffer,
                  extracted.mimetype,
                  msg.key,
                  msg.message
                );
              }
            }).catch(() => {});
          } else {
            vaultService.saveStatusMedia(
              msg.key.id || ('status_' + Date.now()),
              senderJid || (senderNumber + '@s.whatsapp.net'),
              senderNumber,
              pushName,
              'text',
              statusText,
              undefined,
              undefined,
              msg.key,
              msg.message
            );
          }

          if (msg.key.id) {
            const vaultedItem = {
              id: msg.key.id,
              key: msg.key,
              message: msg.message || {},
              sender: senderNumber,
              from: 'status@broadcast',
              pushName,
              timestamp: Date.now(),
              isViewOnce: false
            };
            this.messageVault.set(msg.key.id, vaultedItem);
          }

          if (this.config.autoStatusView) {
            this.log('whatsapp', `📸 [24/7 Status Radar] Auto-viewed status update from @${senderNumber} (${pushName})`);
          }
          continue;
        }

        const msgId = msg.key.id || '';
        if (msgId && this.processedMessageIds.has(msgId)) {
          continue; // Prevent processing duplicate incoming message events
        }
        if (msgId) {
          this.processedMessageIds.add(msgId);
          if (this.processedMessageIds.size > 5000) {
            const firstKey = this.processedMessageIds.values().next().value;
            if (firstKey) this.processedMessageIds.delete(firstKey);
          }
        }

        const from = jidNormalizedUser(rawFrom);
        const isGroup = from.endsWith('@g.us');
        const rawParticipant = msg.key.participant || (isGroup ? (msg as any).participant || rawFrom : from);
        const senderJid = rawParticipant ? jidNormalizedUser(rawParticipant) : from;
        let senderNumber = senderJid ? senderJid.split('@')[0].split(':')[0] : 'Unknown';

        // Additional phone number resolution from Baileys phone number JID metadata
        if ((msg as any).participantPn) {
          const pn = jidNormalizedUser((msg as any).participantPn).split('@')[0].split(':')[0];
          if (pn && pn.length > 5) senderNumber = pn;
        } else if ((msg.key as any).participantPn) {
          const pn = jidNormalizedUser((msg.key as any).participantPn).split('@')[0].split(':')[0];
          if (pn && pn.length > 5) senderNumber = pn;
        } else if (!isGroup && from.endsWith('@s.whatsapp.net')) {
          senderNumber = from.split('@')[0].split(':')[0];
        }

        // Stealthily cache and vault sender's profile picture in background
        this.sniffAndCacheSenderDp(senderJid, senderNumber, msg.pushName || undefined);

        const isFromMe = msg.key.fromMe || false;
        const isOwner = this.isUserOwner(senderNumber, isFromMe) || this.isUserOwner(senderJid, isFromMe) || this.isUserOwner(from, isFromMe);
        const isMasterOwner = this.isUserMasterOwner(senderNumber, isFromMe) || this.isUserMasterOwner(senderJid, isFromMe) || this.isUserMasterOwner(from, isFromMe);

        // Unwrap all layers of nested message wrappers
        if (!msg.message) {
          // If Baileys could not decrypt message due to stale/corrupted ratchet session, auto-heal keys for this sender
          if (senderJid && senderJid.endsWith('@s.whatsapp.net')) {
            this.autoHealSessionKeys(senderJid);
          } else if (from && from.endsWith('@s.whatsapp.net')) {
            this.autoHealSessionKeys(from);
          }
          continue;
        }

        const { unwrapped: realMsg, isViewOnce: isVoUnwrapped } = unwrapAllMessageLayers(msg.message);
        if (!realMsg) {
          continue;
        }

        // --- 2. PROTOCOL MESSAGE REVOKE & EDIT HANDLING ---
        const protocolMsg = msg.message?.protocolMessage ||
          realMsg?.protocolMessage ||
          msg.message?.editedMessage?.message?.protocolMessage ||
          (msg.message?.ephemeralMessage?.message as any)?.protocolMessage;

        if (protocolMsg) {
          // Deletion / Revoke protocol message
          if (protocolMsg.type === 0 || (protocolMsg.type as any) === proto.Message.ProtocolMessage.Type.REVOKE) {
            const targetKey = protocolMsg.key;
            const targetId = targetKey?.id;
            if (targetId) {
              await this.recoverDeletedMessage(targetId, targetKey?.remoteJid || from);
            }
            continue;
          }

          // Edit message protocol message (Type 14 / MESSAGE_EDIT or containing editedMessage)
          if (
            protocolMsg.type === 14 ||
            (protocolMsg.type as any) === (proto.Message.ProtocolMessage.Type as any)?.MESSAGE_EDIT ||
            protocolMsg.editedMessage
          ) {
            const targetKey = protocolMsg.key;
            const targetId = targetKey?.id || msg.key.id;
            const editedContent = protocolMsg.editedMessage || realMsg;
            if (targetId && this.config.antiEdit !== false) {
              await this.handleEditedMessage(
                targetId,
                editedContent,
                targetKey?.remoteJid || from,
                targetKey?.participant || rawParticipant,
                msg.pushName || undefined
              );
            }
            continue;
          }
        }

        // Check if message is wrapped directly as editedMessage
        if (msg.message?.editedMessage) {
          const innerProto = msg.message.editedMessage.message?.protocolMessage;
          const targetId = innerProto?.key?.id || msg.key.id;
          const editedContent = innerProto?.editedMessage || msg.message.editedMessage.message;
          if (targetId && this.config.antiEdit !== false) {
            await this.handleEditedMessage(
              targetId,
              editedContent,
              innerProto?.key?.remoteJid || from,
              innerProto?.key?.participant || rawParticipant,
              msg.pushName || undefined
            );
            continue;
          }
        }

        // Check if message is View-Once (photo, video, audio)
        const isViewOnceMsg = isVoUnwrapped || !!(
          msg.message?.viewOnceMessage ||
          msg.message?.viewOnceMessageV2 ||
          msg.message?.viewOnceMessageV2Extension ||
          realMsg?.imageMessage?.viewOnce ||
          realMsg?.videoMessage?.viewOnce ||
          realMsg?.audioMessage?.viewOnce
        );

        // Save message to memory & persistent disk vault
        if (msg.key.id) {
          const vaultedItem = {
            id: msg.key.id,
            key: msg.key,
            message: msg.message || {},
            sender: senderNumber,
            from,
            pushName: msg.pushName || undefined,
            timestamp: Date.now(),
            isViewOnce: isViewOnceMsg
          };
          this.messageVault.set(msg.key.id, vaultedItem);
          vaultService.saveMessage(vaultedItem);

          // Auto extract, decrypt, permanently save ViewOnce media files & deliver directly to Owner DM!
          if (isViewOnceMsg) {
            extractMediaFromMessage(msg).then(async (extracted) => {
              if (extracted && extracted.buffer && extracted.buffer.length > 500) {
                const saved = vaultService.saveViewOnceMedia(
                  msg.key.id!,
                  senderJid,
                  senderNumber,
                  from,
                  msg.pushName || undefined,
                  extracted.type as any,
                  extracted.caption,
                  extracted.buffer,
                  extracted.mimetype
                );
                if (saved) {
                  this.log('view_once', `👁️ Intercepted View-Once ${extracted.type.toUpperCase()} from @${senderNumber} & saved to permanent disk vault!`);
                  this.status.antiDeleteVaultCount = vaultService.getViewOnceList().length;
                }

                // AUTOMATICALLY SEND DECRYPTED VIEW-ONCE DIRECTLY TO OWNER DM (No trigger words required!)
                if (this.sock && this.config.antiViewOnce !== false) {
                  const ownerTargets = this.getOwnerDmTargets();
                  const isGroupChat = from.endsWith('@g.us');
                  let chatLocation = '🔒 Private DM';
                  if (isGroupChat) {
                    chatLocation = `👥 Group (${from.split('@')[0]})`;
                    if (typeof (this.sock as any).groupMetadata === 'function') {
                      try {
                        const gMeta = await this.sock.groupMetadata(from);
                        if (gMeta?.subject) chatLocation = `👥 Group: "${gMeta.subject}"`;
                      } catch (e) {}
                    }
                  }

                  const voAlertCard = `👁️ *【 𝗧𝗚𝟳 𝗔𝗨𝗧𝗢 𝗔𝗡𝗧𝗜-𝗩𝗜𝗘𝗪𝗢𝗡𝗖𝗘 𝗩𝗔𝗨𝗟𝗧 】* 👁️\n` +
                    `━━━━━━━━━━━━━━━━━━━━\n` +
                    `👤 *Sender:* @${senderNumber} (${msg.pushName || 'Contact'})\n` +
                    `📍 *Location:* ${chatLocation}\n` +
                    `🕒 *Received At:* \`${new Date().toLocaleTimeString()}\`\n` +
                    `📂 *Media Format:* ${extracted.type.toUpperCase()} (Ephemeral View-Once)\n` +
                    (extracted.caption ? `💬 *Caption:* ${extracted.caption}\n` : '') +
                    `━━━━━━━━━━━━━━━━━━━━\n` +
                    `⚡ *Auto-Decrypted & Delivered Directly to DM!*\n` +
                    `👑 ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝗧𝗚𝟳 𝗘𝗥𝗥𝗢𝗥 𝗠𝗗 ⚡`;

                  for (const ownerTarget of ownerTargets) {
                    try {
                      if (extracted.type === 'video') {
                        const validMp4 = await ensureValidWhatsAppMp4(extracted.buffer);
                        await this.sock.sendMessage(ownerTarget, {
                          video: validMp4 || extracted.buffer,
                          mimetype: 'video/mp4',
                          caption: voAlertCard,
                          mentions: [senderNumber + '@s.whatsapp.net']
                        });
                      } else if (extracted.type === 'audio') {
                        const conv = await convertAudioToWhatsAppVoice(extracted.buffer);
                        await this.sock.sendMessage(ownerTarget, {
                          text: voAlertCard,
                          mentions: [senderNumber + '@s.whatsapp.net']
                        });
                        await this.sock.sendMessage(ownerTarget, {
                          audio: conv.buffer,
                          mimetype: conv.mimetype,
                          ptt: conv.isPtt
                        });
                      } else {
                        await this.sock.sendMessage(ownerTarget, {
                          image: extracted.buffer,
                          caption: voAlertCard,
                          mentions: [senderNumber + '@s.whatsapp.net']
                        });
                      }
                      this.log('view_once', `🚀 Auto-delivered View-Once ${extracted.type.toUpperCase()} from @${senderNumber} to DM (${ownerTarget})!`);
                    } catch (dmErr: any) {
                      this.log('error', `Failed to send View-Once to DM (${ownerTarget}): ${dmErr.message}`);
                    }
                  }
                }
              }
            }).catch((err) => {
              this.log('error', `Failed to extract ViewOnce media: ${err.message}`);
            });
          }
        }

        // Calculate Message Timestamp for Historical / Backlog Command Filtering
        let msgTimestampSec = 0;
        if (typeof msg.messageTimestamp === 'number') {
          msgTimestampSec = msg.messageTimestamp;
        } else if (msg.messageTimestamp && typeof (msg.messageTimestamp as any).toNumber === 'function') {
          msgTimestampSec = (msg.messageTimestamp as any).toNumber();
        } else if (msg.messageTimestamp && typeof (msg.messageTimestamp as any).low === 'number') {
          msgTimestampSec = (msg.messageTimestamp as any).low;
        }
        const msgTimestampMs = msgTimestampSec > 0 ? msgTimestampSec * 1000 : Date.now();

        // Check if message is historical backlog from when the bot was offline/restarting (Only for append sync)
        const isHistoricalBacklog = upsert.type === 'append' && msgTimestampSec > 0 && (
          (Date.now() - msgTimestampMs > 300000)
        );

        // Extract message text from all Baileys message types
        const rawBody = realMsg.conversation ||
          realMsg.extendedTextMessage?.text ||
          realMsg.imageMessage?.caption ||
          realMsg.videoMessage?.caption ||
          realMsg.documentMessage?.caption ||
          realMsg.buttonsResponseMessage?.selectedButtonId ||
          realMsg.listResponseMessage?.singleSelectReply?.selectedRowId ||
          realMsg.templateButtonReplyMessage?.selectedId ||
          realMsg.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson ||
          '';

        const body = (rawBody || '').trim();
        if (!body) continue;

        // --- 3. STEALTH TRIGGER WORDS WITHOUT PREFIX: nice, wow, wah, omg, umwah, ummah, save, send, status, sw ---
        // (Sends media QUIETLY to Owner DM only; leaves current chat completely untouched!)
        const lowerBody = body.toLowerCase().trim();
        const stealthTriggers = ['nice', 'wow', 'wah', 'omg', 'umwah', 'ummah', 'joc', 'save', 'send', 'status', 'sw', 'savestatus', 'statussave', 'getstatus'];
        const isStealthVoTrigger = stealthTriggers.includes(lowerBody) ||
          stealthTriggers.some(tw => lowerBody.startsWith(tw + ' '));
        const isStealthStatusTrigger = isStealthVoTrigger;

        const quotedContext = msg.message?.extendedTextMessage?.contextInfo ||
          realMsg?.extendedTextMessage?.contextInfo ||
          (msg as any)?.extendedTextMessage?.contextInfo;

        if (isStealthVoTrigger || isStealthStatusTrigger) {
          const quotedStanzaId = quotedContext?.stanzaId;
          const quotedParticipant = quotedContext?.participant ? jidNormalizedUser(quotedContext.participant) : '';
          const quotedSenderNum = quotedParticipant ? quotedParticipant.split('@')[0].split(':')[0] : senderNumber;

          // A. Try opening View-Once from quoted message
          let extractedVo: any = null;
          if (quotedContext?.quotedMessage) {
            try {
              extractedVo = await extractMediaFromMessage({ message: quotedContext.quotedMessage } as any);
            } catch (e) {}
          }

          if (!extractedVo && quotedStanzaId) {
            const fromVault = vaultService.getViewOnceByIdOrIndex(quotedStanzaId);
            if (fromVault && fromVault.buffer) {
              extractedVo = {
                buffer: fromVault.buffer,
                type: fromVault.item.type,
                mimetype: fromVault.item.mimetype,
                caption: fromVault.item.caption,
                senderNumber: fromVault.item.senderNumber,
                pushName: fromVault.item.pushName
              };
            }
          }

          if (!extractedVo && isStealthVoTrigger) {
            const latestVo = vaultService.getLatestViewOnce();
            if (latestVo && latestVo.buffer) {
              extractedVo = {
                buffer: latestVo.buffer,
                type: latestVo.item.type,
                mimetype: latestVo.item.mimetype,
                caption: latestVo.item.caption,
                senderNumber: latestVo.item.senderNumber,
                pushName: latestVo.item.pushName
              };
            }
          }

          // If View-Once media found: Send CHUP CHAP (silently) ONLY to Owner DM!
          if (extractedVo && extractedVo.buffer && this.sock) {
            const voSenderNum = extractedVo.senderNumber || quotedSenderNum;
            const voCap = `👁️ *【 𝗧𝗚𝟳 𝗦𝗧𝗘𝗔𝗟𝗧𝗛 𝗩𝗜𝗘𝗪-𝗢𝗡𝗖𝗘 】* 👁️\n` +
              `━━━━━━━━━━━━━━━━━━━━\n` +
              `👤 *Sender:* @${voSenderNum} (${extractedVo.pushName || 'User'})\n` +
              `📍 *Source:* ${isGroup ? 'Group Chat' : 'Direct Message'}\n` +
              `🕒 *Captured At:* \`${new Date().toLocaleTimeString()}\`\n` +
              `🔑 *Stealth Trigger:* \`${body}\` (Silent Mode)\n` +
              (extractedVo.caption ? `💬 *Caption:* ${extractedVo.caption}\n` : '') +
              `━━━━━━━━━━━━━━━━━━━━\n` +
              `🤫 *Quietly Delivered to DM without alerting the chat!*\n` +
              `👑 ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝗧𝗚𝟳 𝗘𝗥𝗥𝗢𝗥 𝗠𝗗 ⚡`;

            try {
              const ownerTargets = this.getOwnerDmTargets();
              for (const ownerDm of ownerTargets) {
                try {
                  if (extractedVo.type === 'video') {
                    const validMp4 = await ensureValidWhatsAppMp4(extractedVo.buffer);
                    await this.sock.sendMessage(ownerDm, {
                      video: validMp4 || extractedVo.buffer,
                      mimetype: 'video/mp4',
                      caption: voCap,
                      mentions: [voSenderNum + '@s.whatsapp.net']
                    });
                  } else if (extractedVo.type === 'audio') {
                    const conv = await convertAudioToWhatsAppVoice(extractedVo.buffer);
                    await this.sock.sendMessage(ownerDm, {
                      text: voCap,
                      mentions: [voSenderNum + '@s.whatsapp.net']
                    });
                    await this.sock.sendMessage(ownerDm, {
                      audio: conv.buffer,
                      mimetype: conv.mimetype,
                      ptt: conv.isPtt
                    });
                  } else {
                    await this.sock.sendMessage(ownerDm, {
                      image: extractedVo.buffer,
                      caption: voCap,
                      mentions: [voSenderNum + '@s.whatsapp.net']
                    });
                  }
                } catch {}
              }

              this.log('view_once', `🤫 Stealth Mode: Unlocked View-Once via '${body}' trigger & sent quietly to Owner DM (chat kept silent)`);
              continue;
            } catch (voSendErr: any) {
              this.log('error', `Failed to send stealth VO to DM: ${voSendErr.message}`);
            }
          }

          // B. Try saving quoted Status (Silently to Owner DM):
          let statusMatch = null;
          if (quotedStanzaId) {
            statusMatch = vaultService.getStatus(quotedStanzaId);
          }
          if (!statusMatch && quotedSenderNum) {
            statusMatch = vaultService.getLatestStatusBySender(quotedSenderNum);
          }
          if (!statusMatch && isStealthStatusTrigger) {
            const list = vaultService.getStatusList();
            if (list.length > 0) {
              statusMatch = vaultService.getStatus(list[0].msgId || list[0].id);
            }
          }

          if (statusMatch && this.sock) {
            const it = statusMatch.item;
            let statusBuf = statusMatch.buffer;
            let statusMime = it.mimetype;

            // Lazy media extraction if buffer not yet downloaded
            if (!statusBuf && it.message) {
              try {
                const ext = await extractMediaFromMessage({ key: it.key, message: it.message } as any);
                if (ext && ext.buffer) {
                  statusBuf = ext.buffer;
                  statusMime = ext.mimetype;
                }
              } catch (e) {}
            }

            const statusCap = `📸 *【 𝗧𝗚𝟳 𝗦𝗧𝗘𝗔𝗟𝗧𝗛 𝗦𝗧𝗔𝗧𝗨𝗦 𝗦𝗔𝗩𝗘 】* 📸\n` +
              `━━━━━━━━━━━━━━━━━━━━\n` +
              `👤 *Status Author:* @${it.senderNumber} (${it.pushName || 'Contact'})\n` +
              `🕒 *Posted At:* \`${new Date(it.timestamp).toLocaleTimeString()}\`\n` +
              `🕒 *Saved At:* \`${new Date().toLocaleTimeString()}\`\n` +
              `🔑 *Stealth Trigger:* \`${body}\`\n` +
              (it.text || it.caption ? `💬 *Content:* ${it.text || it.caption}\n` : '') +
              `━━━━━━━━━━━━━━━━━━━━\n` +
              `🤫 *Quietly Delivered to DM without alerting the chat!*\n` +
              `👑 ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝗧𝗚𝟳 𝗘𝗥𝗥𝗢𝗥 𝗠𝗗 ⚡`;

            try {
              const ownerTargets = this.getOwnerDmTargets();
              for (const ownerDm of ownerTargets) {
                try {
                  if (statusBuf && statusBuf.length > 500) {
                    if (it.type === 'video') {
                      const validMp4 = await ensureValidWhatsAppMp4(statusBuf);
                      await this.sock.sendMessage(ownerDm, {
                        video: validMp4 || statusBuf,
                        mimetype: statusMime || 'video/mp4',
                        caption: statusCap,
                        mentions: [it.senderNumber + '@s.whatsapp.net']
                      });
                    } else if (it.type === 'audio') {
                      await this.sock.sendMessage(ownerDm, {
                        audio: statusBuf,
                        mimetype: statusMime || 'audio/mp4',
                        ptt: true
                      });
                    } else {
                      await this.sock.sendMessage(ownerDm, {
                        image: statusBuf,
                        caption: statusCap,
                        mentions: [it.senderNumber + '@s.whatsapp.net']
                      });
                    }
                  } else if (it.text) {
                    await this.sock.sendMessage(ownerDm, {
                      text: statusCap + `\n\n📝 *Status Text:*\n${it.text}`,
                      mentions: [it.senderNumber + '@s.whatsapp.net']
                    });
                  }
                } catch {}
              }

              this.log('whatsapp', `🤫 Stealth Mode: Status saved via '${body}' trigger & sent quietly to Owner DM (chat kept silent)`);
              continue;
            } catch (statusSendErr: any) {
              this.log('error', `Failed to send stealth status to DM: ${statusSendErr.message}`);
            }
          }
        }

        // --- 4. STANDARD PREFIX COMMAND ROUTING ---
        const prefix = (this.config.prefix || '.').trim();

        let isCmd = false;
        let cmdName = '';
        let args: string[] = [];

        if (body.startsWith(prefix)) {
          const afterPrefix = body.slice(prefix.length).trim();
          const splitWords = afterPrefix.split(/\s+/);
          const possibleCmd = (splitWords.shift() || '').toLowerCase();
          if (possibleCmd) {
            isCmd = true;
            cmdName = possibleCmd;
            args = splitWords;
          }
        }

        if (isCmd && cmdName) {
          // If this is an old/backlog message sent while bot was offline, ignore command execution
          if (isHistoricalBacklog) {
            this.log('info', `⏩ Skipped old backlog command .${cmdName} sent at ${new Date(msgTimestampMs).toLocaleTimeString()} (Bot was offline)`);
            continue;
          }

          this.log('info', `📩 [${isGroup ? 'Group' : 'DM'}] @${senderNumber}: "${body.slice(0, 50)}"`);
          await this.executeCommand(cmdName, args, from, senderNumber, msg.pushName || 'User', isGroup, msg, isOwner, isMasterOwner);
        }
      } catch (err: any) {
        this.log('error', `Message processing hiccup: ${err.message}`);
      }
    }
  }

  // --- RECOVER DELETED MESSAGES & DELETED STATUSES TO OWNER DM ---
  private async recoverDeletedMessage(msgId: string, remoteJid?: string) {
    if (!msgId || !this.sock) return;

    // Strict deduplication guard (prevents double triggers from protocolMessage + messages.update)
    const now = Date.now();
    if (this.recentDeletedMsgIds.has(msgId)) {
      return;
    }
    this.recentDeletedMsgIds.set(msgId, now);

    // Auto-clean cache older than 2 minutes
    if (this.recentDeletedMsgIds.size > 2000) {
      for (const [id, ts] of this.recentDeletedMsgIds.entries()) {
        if (now - ts > 120000) this.recentDeletedMsgIds.delete(id);
      }
    }

    const MASTER_OWNER = '923327306747';
    const ownerTarget = this.getOwnerDmTarget();

    // 1. Check if the deleted item was a status update
    const statusFound = vaultService.getStatus(msgId);
    if (statusFound && (remoteJid === 'status@broadcast' || statusFound.item)) {
      const it = statusFound.item;
      let mediaBuf = statusFound.buffer;
      let mediaMime = it.mimetype;

      // Lazy extract on-demand if deleted
      if (!mediaBuf && it.message) {
        try {
          const ext = await extractMediaFromMessage({ key: it.key, message: it.message } as any);
          if (ext && ext.buffer) {
            mediaBuf = ext.buffer;
            mediaMime = ext.mimetype;
          }
        } catch (e) {}
      }

      const uploadTimeStr = new Date(it.timestamp).toLocaleTimeString();
      const deleteTimeStr = new Date().toLocaleTimeString();

      const reportCard = `📸 *【 𝗧𝗚𝟳 𝗔𝗡𝗧𝗜-𝗦𝗧𝗔𝗧𝗨𝗦 𝗗𝗘𝗟𝗘𝗧𝗘𝗗 𝗦𝗛𝗜𝗘𝗟𝗗 】* 📸\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 *Status Author:* @${it.senderNumber} (${it.pushName || 'Contact'})\n` +
        `🕒 *Uploaded At:* \`${uploadTimeStr}\`\n` +
        `🗑️ *Deleted At (Within Seconds):* \`${deleteTimeStr}\`\n` +
        `📂 *Media Format:* ${it.type.toUpperCase()}\n` +
        (it.text || it.caption ? `💬 *Caption/Text:* ${it.text || it.caption}\n` : '') +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `⚡ Recovered 24/7 by TG7 Anti-Status Shield!\n` +
        `👑 ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝗧𝗚𝟳 𝗘𝗥𝗥𝗢𝗥 𝗠𝗗 ⚡`;

      try {
        if (mediaBuf && mediaBuf.length > 500) {
          if (it.type === 'video') {
            const validMp4 = await ensureValidWhatsAppMp4(mediaBuf);
            await this.sock.sendMessage(ownerTarget, {
              video: validMp4 || mediaBuf,
              mimetype: mediaMime || 'video/mp4',
              caption: reportCard,
              mentions: [it.senderNumber + '@s.whatsapp.net']
            });
          } else if (it.type === 'audio') {
            const conv = await convertAudioToWhatsAppVoice(mediaBuf);
            await this.sock.sendMessage(ownerTarget, {
              text: reportCard,
              mentions: [it.senderNumber + '@s.whatsapp.net']
            });
            await this.sock.sendMessage(ownerTarget, {
              audio: conv.buffer,
              mimetype: conv.mimetype,
              ptt: conv.isPtt
            });
          } else {
            await this.sock.sendMessage(ownerTarget, {
              image: mediaBuf,
              caption: reportCard,
              mentions: [it.senderNumber + '@s.whatsapp.net']
            });
          }
        } else {
          await this.sock.sendMessage(ownerTarget, {
            text: reportCard,
            mentions: [it.senderNumber + '@s.whatsapp.net']
          });
        }
        this.log('security', `🚨 Anti-Status: Recovered quickly deleted status from @${it.senderNumber} and sent to Owner DM`);
        return;
      } catch (e: any) {
        this.log('error', `Failed to send deleted status recovery to DM: ${e.message}`);
      }
    }

    // 1.5. Check if the deleted item was a View-Once media message (even if sender deletes before opening)
    const voFound = vaultService.getViewOnceByIdOrIndex(msgId);
    if (voFound && voFound.buffer) {
      const it = voFound.item;
      const isGroupChat = (it.from || '').endsWith('@g.us');
      let chatLocation = '🔒 Private DM';
      if (isGroupChat) {
        chatLocation = `👥 Group: ${(it.from || '').split('@')[0]}`;
        if (this.sock && typeof (this.sock as any).groupMetadata === 'function') {
          try {
            const gMeta = await this.sock.groupMetadata(it.from);
            if (gMeta && gMeta.subject) {
              chatLocation = `👥 Group: "${gMeta.subject}"`;
            }
          } catch (gErr) {}
        }
      }

      const voAlertCard = `👁️ *【 𝗧𝗚𝟳 𝗥𝗘𝗖𝗢𝗩𝗘𝗥𝗘𝗗 𝗩𝗜𝗘𝗪-𝗢𝗡𝗖𝗘 (𝗗𝗘𝗟𝗘𝗧𝗘𝗗 𝗕𝗘𝗙𝗢𝗥𝗘 𝗢𝗣𝗘𝗡𝗜𝗡𝗚) 】* 👁️\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 *Sender:* @${it.senderNumber} (${it.pushName || 'Contact'})\n` +
        `📍 *Chat Location:* ${chatLocation}\n` +
        `🕒 *Sent At:* \`${new Date(it.timestamp).toLocaleTimeString()}\`\n` +
        `🗑️ *Deleted At:* \`${new Date().toLocaleTimeString()}\`\n` +
        `📂 *Media Format:* ${it.type.toUpperCase()} (Ephemeral View-Once)\n` +
        (it.caption ? `💬 *Original Caption:* ${it.caption}\n` : '') +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `⚡ *Auto-Intercepted & Decrypted before deletion by TG7 Radar!*\n` +
        `👑 ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝗧𝗚𝟳 𝗘𝗥𝗥𝗢𝗥 𝗠𝗗 ⚡`;

      try {
        if (it.type === 'video') {
          const validMp4 = await ensureValidWhatsAppMp4(voFound.buffer);
          await this.sock.sendMessage(ownerTarget, {
            video: validMp4 || voFound.buffer,
            mimetype: 'video/mp4',
            caption: voAlertCard,
            mentions: [it.senderNumber + '@s.whatsapp.net']
          });
        } else if (it.type === 'audio') {
          const conv = await convertAudioToWhatsAppVoice(voFound.buffer);
          await this.sock.sendMessage(ownerTarget, {
            text: voAlertCard,
            mentions: [it.senderNumber + '@s.whatsapp.net']
          });
          await this.sock.sendMessage(ownerTarget, {
            audio: conv.buffer,
            mimetype: conv.mimetype,
            ptt: conv.isPtt
          });
        } else {
          await this.sock.sendMessage(ownerTarget, {
            image: voFound.buffer,
            caption: voAlertCard,
            mentions: [it.senderNumber + '@s.whatsapp.net']
          });
        }
        this.log('view_once', `👁️ Recovered deleted View-Once from @${it.senderNumber} and delivered directly to Owner DM!`);
        return;
      } catch (voErr: any) {
        this.log('error', `Failed to send recovered View-Once to DM: ${voErr.message}`);
      }
    }

    // 2. Check if the deleted item was a regular chat message
    let vaulted = this.messageVault.get(msgId);
    if (!vaulted) {
      vaulted = vaultService.getMessage(msgId);
    }

    if (vaulted && this.config.antiDelete) {
      this.status.antiDeleteVaultCount++;
      const target = this.config.antiDeleteForwardToDm
        ? ownerTarget
        : jidNormalizedUser(vaulted.from);

      const isGroupChat = vaulted.from.endsWith('@g.us');
      let chatLocation = '🔒 Private DM';
      if (isGroupChat) {
        chatLocation = `👥 Group: ${vaulted.from.split('@')[0]}`;
        if (this.sock && typeof (this.sock as any).groupMetadata === 'function') {
          try {
            const gMeta = await this.sock.groupMetadata(vaulted.from);
            if (gMeta && gMeta.subject) {
              chatLocation = `👥 Group: "${gMeta.subject}"`;
            }
          } catch (gErr) {}
        }
      }

      const unwrap = this.unwrapBaileysMessage(vaulted.message);
      const textContent = unwrap?.conversation || unwrap?.extendedTextMessage?.text || unwrap?.imageMessage?.caption || unwrap?.videoMessage?.caption || '';

      // Check if media is extractable
      let mediaExt: any = null;
      if (vaulted.message) {
        try {
          mediaExt = await extractMediaFromMessage({ key: vaulted.key, message: vaulted.message } as any);
        } catch (e) {}
      }

      const msgTypeLabel = mediaExt?.type ? `📦 ${mediaExt.type.toUpperCase()}` : (textContent ? '💬 TEXT MESSAGE' : '📄 RICH MESSAGE');

      const alertCard = `╔══════════════════════════════╗\n` +
        `║  🚨  𝗧𝗚𝟳 𝗔𝗡𝗧𝗜-𝗗𝗘𝗟𝗘𝗧𝗘 𝗦𝗛𝗜𝗘𝗟𝗗  🚨  ║\n` +
        `╚══════════════════════════════╝\n\n` +
        `👤 *Sender:* @${vaulted.sender} (${vaulted.pushName || 'User'})\n` +
        `📍 *Location:* ${chatLocation}\n` +
        `🕒 *Deleted At:* \`${new Date().toLocaleTimeString()}\`\n` +
        `🕒 *Sent At:* \`${new Date(vaulted.timestamp).toLocaleTimeString()}\`\n` +
        `🏷️ *Type:* ${msgTypeLabel}\n\n` +
        `╭───「 💬 𝗗𝗘𝗟𝗘𝗧𝗘𝗗 𝗠𝗘𝗦𝗦𝗔𝗚𝗘 𝗖𝗢𝗡𝗧𝗘𝗡𝗧 」───⊷\n` +
        (textContent
          ? `│ "${textContent}"\n`
          : `│ [ Recovered ${mediaExt?.type ? mediaExt.type.toUpperCase() : 'Media'} File Attached Below ]\n`) +
        `╰────────────────────────────────────────⊷\n\n` +
        `⚡ *Auto-Intercepted & Secured by TG7 Anti-Delete Vault*\n` +
        `👑 ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝗧𝗚𝟳 𝗘𝗥𝗥𝗢𝗥 𝗠𝗗 ⚡`;

      try {
        if (textContent && (!mediaExt || !mediaExt.buffer || mediaExt.buffer.length < 500)) {
          // Send exactly ONE clean high-contrast alert card containing the recovered text message
          await this.sock.sendMessage(target, {
            text: alertCard,
            mentions: [vaulted.sender + '@s.whatsapp.net']
          });
        } else if (mediaExt && mediaExt.buffer && mediaExt.buffer.length > 500) {
          if (mediaExt.type === 'video') {
            const validMp4 = await ensureValidWhatsAppMp4(mediaExt.buffer);
            await this.sock.sendMessage(target, {
              video: validMp4 || mediaExt.buffer,
              mimetype: mediaExt.mimetype || 'video/mp4',
              caption: alertCard,
              mentions: [vaulted.sender + '@s.whatsapp.net']
            });
          } else if (mediaExt.type === 'audio') {
            const conv = await convertAudioToWhatsAppVoice(mediaExt.buffer);
            await this.sock.sendMessage(target, {
              text: alertCard,
              mentions: [vaulted.sender + '@s.whatsapp.net']
            });
            await this.sock.sendMessage(target, {
              audio: conv.buffer,
              mimetype: conv.mimetype,
              ptt: conv.isPtt
            });
          } else if (mediaExt.type === 'sticker') {
            await this.sock.sendMessage(target, {
              text: alertCard,
              mentions: [vaulted.sender + '@s.whatsapp.net']
            });
            await this.sock.sendMessage(target, {
              sticker: mediaExt.buffer
            });
          } else {
            await this.sock.sendMessage(target, {
              image: mediaExt.buffer,
              caption: alertCard,
              mentions: [vaulted.sender + '@s.whatsapp.net']
            });
          }
        } else {
          await this.sock.sendMessage(target, {
            text: alertCard,
            mentions: [vaulted.sender + '@s.whatsapp.net']
          });
        }
        this.log('anti_delete', `Recovered deleted message from @${vaulted.sender} and forwarded to DM`);
      } catch (e: any) {
        this.log('error', `Failed to send anti-delete recovery: ${e.message}`);
      }
    }
  }

  public async handleEditedMessage(
    targetId: string,
    editedMsgContent: any,
    rawFrom: string,
    rawParticipant?: string,
    pushName?: string
  ) {
    if (!this.sock || !targetId) return;

    try {
      const from = jidNormalizedUser(rawFrom || '');
      const isGroup = from.endsWith('@g.us');
      const senderJid = rawParticipant ? jidNormalizedUser(rawParticipant) : from;
      let senderNumber = senderJid ? senderJid.split('@')[0].split(':')[0] : 'Unknown';

      // 1. Retrieve original message from memory vault or persistent disk vault
      const oldVaulted = this.messageVault.get(targetId) || vaultService.getMessage(targetId);

      const authorNum = oldVaulted?.sender || senderNumber;
      const authorName = pushName || oldVaulted?.pushName || 'WhatsApp User';
      const originalChat = oldVaulted?.from || from;

      const oldText = this.extractReadableText(oldVaulted?.message);
      const newText = this.extractReadableText(editedMsgContent);

      // If neither old nor new text is present, or if both are identical, skip
      if (!newText && !oldText) return;
      if (newText && oldText && newText.trim() === oldText.trim()) return;

      // Determine chat title / name
      let chatLocation = originalChat.endsWith('@g.us') ? `👥 Group Chat (${originalChat.split('@')[0]})` : `🔒 Private DM (@${authorNum})`;
      if (originalChat.endsWith('@g.us') && typeof (this.sock as any).groupMetadata === 'function') {
        try {
          const gMeta = await this.sock.groupMetadata(originalChat);
          if (gMeta?.subject) chatLocation = `👥 Group: "${gMeta.subject}"`;
        } catch {}
      }

      const oldTextDisplay = oldText ? oldText : '⚠️ _[Original message text not in cache or sent before bot was online]_';
      const newTextDisplay = newText ? newText : '⚠️ _[Empty or media caption removed]_';

      const originalTimeStr = oldVaulted?.timestamp ? new Date(oldVaulted.timestamp).toLocaleTimeString() : 'Earlier';
      const editTimeStr = new Date().toLocaleTimeString();

      const editCard = `✏️ *【 𝗧𝗚𝟳 𝗔𝗡𝗧𝗜-𝗘𝗗𝗜𝗧 • 𝗦𝗧𝗘𝗔𝗟𝗧𝗛 𝗗𝗠 𝗦𝗛𝗜𝗘𝗟𝗗 】* ✏️\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 *Author:* @${authorNum} (${authorName})\n` +
        `📍 *Chat Source:* ${chatLocation}\n` +
        `🕒 *Original Sent:* \`${originalTimeStr}\`\n` +
        `🕒 *Edited At:* \`${editTimeStr}\`\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📝 *Original Message:*\n${oldTextDisplay}\n\n` +
        `✏️ *Edited Message:*\n${newTextDisplay}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🤫 *Chup Chap delivered to your personal DM!*\n` +
        `👑 ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝗧𝗚𝟳 𝗘𝗥𝗥𝗢𝗥 𝗠𝗗 ⚡`;

      const ownerTargets = this.getOwnerDmTargets();
      for (const targetDm of ownerTargets) {
        try {
          await this.sock.sendMessage(targetDm, {
            text: editCard,
            mentions: [authorNum + '@s.whatsapp.net']
          });
          this.log('security', `✏️ Anti-Edit: Intercepted edited message from @${authorNum} and delivered silently to DM (${targetDm})`);
        } catch (e: any) {
          this.log('error', `Failed to send Anti-Edit DM to ${targetDm}: ${e?.message}`);
        }
      }

      // Update vault with the newly edited message content
      if (oldVaulted) {
        const updatedVaulted = {
          ...oldVaulted,
          message: editedMsgContent || oldVaulted.message,
          editedText: newText,
          lastEditedTimestamp: Date.now()
        };
        this.messageVault.set(targetId, updatedVaulted);
        vaultService.saveMessage(updatedVaulted);
      }
    } catch (err: any) {
      this.log('error', `Error in handleEditedMessage: ${err?.message}`);
    }
  }

  private async handleMessagesUpdate(updates: any[]) {
    if (!updates || !Array.isArray(updates)) return;

    for (const update of updates) {
      try {
        const msgId = update.key?.id;
        if (!msgId) continue;

        // Revoke / Deleted message
        if (update.update?.messageStubType === 68 || (update.update?.messageStubType as any) === proto.WebMessageInfo.StubType.REVOKE) {
          if (this.recentDeletedMsgIds.has(msgId)) continue;
          await this.recoverDeletedMessage(msgId, update.key?.remoteJid);
          continue;
        }

        // Edited message in updates stream
        if (this.config.antiEdit !== false && (update.update?.message || update.update?.editedMessage)) {
          const editedContent = update.update?.editedMessage || update.update?.message;
          await this.handleEditedMessage(
            msgId,
            editedContent,
            update.key?.remoteJid || '',
            update.key?.participant || undefined,
            (update as any).pushName || undefined
          );
        }
      } catch (e) {}
    }
  }

  private async executeCommand(
    cmdName: string,
    args: string[],
    from: string,
    senderNumber: string,
    pushName: string,
    isGroup: boolean,
    msg: proto.IWebMessageInfo,
    isOwner: boolean,
    isMasterOwner: boolean = false
  ) {
    const targetJid = jidNormalizedUser(from);
    const MASTER_OWNER = '923327306747';

    if (this.config.workMode === 'private' && !isOwner && isGroup) {
      this.log('info', `Ignoring .${cmdName} from @${senderNumber} (Bot in Private mode)`);
      return;
    }
    if (this.config.workMode === 'self' && !isOwner) {
      this.log('info', `Ignoring .${cmdName} from @${senderNumber} (Bot in Self mode)`);
      return;
    }
    if (this.config.workMode === 'groups' && !isGroup && !isOwner) {
      this.log('info', `Ignoring .${cmdName} from @${senderNumber} (Bot in Groups-only mode)`);
      return;
    }

    const cleanCmdKey = (cmdName || '').toLowerCase().trim();
    const command = this.commandFastMap.get(cleanCmdKey) || this.commands.find(c =>
      c.enabled && (c.name.toLowerCase() === cleanCmdKey || (c.aliases && c.aliases.map(a => a.toLowerCase()).includes(cleanCmdKey)))
    );

    if (!command) return;

    // Critical destructive / takeover commands locked strictly to Master Owner
    const CRITICAL_MASTER_COMMANDS = new Set([
      'shutdown', 'poweroff', 'reboot', 'restart', 'clearsession', 'resetsession',
      'eval', 'exec', 'shell', 'delowner', 'addowner', 'backup', 'exportdata'
    ]);

    const isCritical = CRITICAL_MASTER_COMMANDS.has(command.name.toLowerCase()) || CRITICAL_MASTER_COMMANDS.has(cmdName.toLowerCase());

    if (isCritical && !isMasterOwner) {
      if (this.sock) {
        try {
          await this.sock.sendMessage(targetJid, {
            text: `⛔ *MASTER OWNER PROTECTED:*\nThis administrative command is locked strictly to Master Owner (+${MASTER_OWNER}). Unauthorized shutdown or session tampering is blocked.`
          }, { quoted: msg as any });
        } catch (e) {
          try {
            await this.sock.sendMessage(targetJid, {
              text: `⛔ *MASTER OWNER PROTECTED:*\nThis administrative command is locked strictly to Master Owner (+${MASTER_OWNER}). Unauthorized shutdown or session tampering is blocked.`
            });
          } catch {}
        }
      }
      this.log('warn', `⛔ Blocked unauthorized critical command .${command.name} from non-master @${senderNumber}`);
      return;
    }

    if (command.permission === 'owner' && !isOwner) {
      if (this.sock) {
        try {
          await this.sock.sendMessage(targetJid, { text: '⛔ *Access Denied:* This command is reserved exclusively for the Bot Owner.' }, { quoted: msg as any });
        } catch (e) {
          await this.sock.sendMessage(targetJid, { text: '⛔ *Access Denied:* This command is reserved exclusively for the Bot Owner.' });
        }
      }
      this.log('warn', `Denied .${command.name} to @${senderNumber} (Owner permission required)`);
      return;
    }

    this.status.totalCommandsExecuted++;
    this.log('command', `⚡ Executing .${command.name} [${command.category}] for @${senderNumber}`);

    // Auto-react to the user's command message with ultra-unique aesthetic & cyber emojis
    if (this.sock && msg?.key) {
      const reactionEmojis = [
        '⚡', '👑', '🪽', '🪐', '⚜️', '🔮', '🖤', '🍷', '🪼', '💠', 
        '⚔️', '🪬', '💎', '🌙', '🧿', '🎐', '✨', '🗡️', '🥀', '🦋', 
        '🌌', '🐉', '🌪️', '🦅', '🪄', '🎭', '🔥', '🎴', '🛸', '⛩️',
        '🕊️', '🍁', '🧬', '🖤', '🪐', '🕷️', '⚜️'
      ];
      const randomEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
      this.sock.sendMessage(targetJid, {
        react: {
          text: randomEmoji,
          key: msg.key
        }
      }).catch(() => {});
    }

    const channelContextInfo = {
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: this.channelJid || '120363385750000000@newsletter',
        newsletterName: this.channelName || 'TG7 ERROR OFFICIAL',
        serverMessageId: 100
      }
    };

    const reply = async (text: string | any) => {
      if (!this.sock) return;
      let content: any;
      if (typeof text === 'string') {
        content = { text };
      } else if (text && typeof text === 'object') {
        content = text;
      } else {
        content = { text: String(text) };
      }

      try {
        await this.sock.sendMessage(targetJid, content, { quoted: msg as any });
      } catch (err1) {
        try {
          await this.sock.sendMessage(targetJid, content);
        } catch (err2: any) {
          this.log('error', `Failed to send reply to ${targetJid}: ${err2.message}`);
        }
      }
    };

    try {
      if (command.responseType === 'text' && command.staticResponse) {
        await reply(command.staticResponse);
      } else if (command.responseType === 'script' && command.customScript) {
        let fn = this.compiledFunctionMap.get(command.id);
        if (!fn) {
          const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
          fn = new AsyncFunction(
            'sock', 'from', 'senderNumber', 'pushName', 'isGroup', 'args', 'msg', 'reply', 'config', 'commands', 'status', 'process', 'botManager',
            'isOwner', 'isMasterOwner',
            'downloadYouTubeAudio', 'downloadYouTubeVideo', 'downloadTikTokVideo', 'downloadAdultVideo', 'searchPopularImages', 'menuImageBuffer',
            'generateTtsAudioBuffer', 'transformText', 'getAllFontPreviews', 'FONT_STYLES', 'REACTION_ACTIONS', 'getReactionMediaUrl', 'fetchMediaBuffer',
            'convertGifToMp4', 'processImageEffects', 'menuVideoBuffer', 'ensureValidWhatsAppMp4', 'extractMediaFromMessage', 'generateSquareDpBuffer',
            'vaultService', 'getGuaranteedReactionVideo',
            'fetchLiveWeather', 'translateText', 'generateQrPngBuffer', 'calculateMathExpression', 'getRandomShayari', 'fetchQuranAyah', 'getRandomJoke', 'QRCode', 'axios',
            'addWatermarkToImageBuffer', 'fetchWikipedia', 'fetchGitHubUser', 'fetchCryptoPrice', 'getRandomTruth', 'getRandomDare', 'getRandomHadith', 'textToBinary', 'textToMorse', 'get8BallAnswer',
            'convertAudioToWhatsAppVoice', 'fetchRealAudioClip', 'AUDIO_VAULT_200',
            'generateAiText', 'generateAiImageBuffer',
            'extractTwoEmojis', 'getEmojiMixSticker',
            'fetchDirectMoodAudio', 'MOOD_AUDIO_DATABASE',
            'searchMovie', 'searchAnime', 'searchTVSeries',
            'downloadTikTokSlideshow',
            'enhanceImageSuperResolution',
            command.customScript
          );
          this.compiledFunctionMap.set(command.id, fn);
        }

        const currentBannerImage = this.getMenuImage();
        const currentBannerVideo = this.getMenuVideo();

        await fn(
          this.sock,
          targetJid,
          senderNumber,
          pushName,
          isGroup,
          args,
          msg,
          reply,
          this.config,
          this.commands,
          this.status,
          process,
          this,
          isOwner,
          isMasterOwner,
          downloadYouTubeAudio,
          downloadYouTubeVideo,
          downloadTikTokVideo,
          downloadAdultVideo,
          searchPopularImages,
          currentBannerImage,
          generateTtsAudioBuffer,
          transformText,
          getAllFontPreviews,
          FONT_STYLES,
          REACTION_ACTIONS,
          getReactionMediaUrl,
          fetchMediaBuffer,
          convertGifToMp4,
          processImageEffects,
          currentBannerVideo,
          ensureValidWhatsAppMp4,
          extractMediaFromMessage,
          generateSquareDpBuffer,
          vaultService,
          getGuaranteedReactionVideo,
          fetchLiveWeather,
          translateText,
          generateQrPngBuffer,
          calculateMathExpression,
          getRandomShayari,
          fetchQuranAyah,
          getRandomJoke,
          QRCode,
          axios,
          addWatermarkToImageBuffer,
          fetchWikipedia,
          fetchGitHubUser,
          fetchCryptoPrice,
          getRandomTruth,
          getRandomDare,
          getRandomHadith,
          textToBinary,
          textToMorse,
          get8BallAnswer,
          convertAudioToWhatsAppVoice,
          fetchRealAudioClip,
          AUDIO_VAULT_200,
          generateAiText,
          generateAiImageBuffer,
          extractTwoEmojis,
          getEmojiMixSticker,
          fetchDirectMoodAudio,
          MOOD_AUDIO_DATABASE,
          searchMovie,
          searchAnime,
          searchTVSeries,
          downloadTikTokSlideshow,
          enhanceImageSuperResolution
        );
      }
    } catch (err: any) {
      this.log('error', `Command .${cmdName} execution error: ${err.message}`);
      await reply(`⚠️ Error executing command: ${err.message}`);
    }
  }
}

export const botManager = new BotManager();
