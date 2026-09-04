import fs from 'fs';
import path from 'path';

export interface ViewOnceItem {
  id: string;
  msgId: string;
  sender: string;
  senderNumber: string;
  from: string;
  pushName?: string;
  timestamp: number;
  type: 'image' | 'video' | 'audio';
  caption?: string;
  fileName: string;
  fileSize: number;
  filePath: string;
  mimetype: string;
}

export interface VaultedMessage {
  id: string;
  key: any;
  message: any;
  sender: string;
  from: string;
  pushName?: string;
  timestamp: number;
  isViewOnce?: boolean;
}

export interface StatusVaultItem {
  id: string;
  msgId: string;
  sender: string;
  senderNumber: string;
  pushName?: string;
  timestamp: number;
  type: 'image' | 'video' | 'audio' | 'text';
  text?: string;
  caption?: string;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  mimetype?: string;
  key?: any;
  message?: any;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const VAULT_DIR = path.join(DATA_DIR, 'vault');
const MEDIA_DIR = path.join(VAULT_DIR, 'media');
const STATUS_DIR = path.join(VAULT_DIR, 'status');
const DP_DIR = path.join(VAULT_DIR, 'dp_cache');
const VIEWONCE_INDEX_FILE = path.join(VAULT_DIR, 'viewonce_index.json');
const MESSAGES_VAULT_FILE = path.join(VAULT_DIR, 'messages_vault.json');
const STATUS_INDEX_FILE = path.join(VAULT_DIR, 'status_index.json');
const DP_INDEX_FILE = path.join(VAULT_DIR, 'dp_index.json');
const BOT_DP_FILE = path.join(DATA_DIR, 'bot_dp.jpg');
const BOT_DP_META = path.join(DATA_DIR, 'bot_dp.json');

export interface DpVaultItem {
  phoneNumber: string;
  jid: string;
  pushName?: string;
  timestamp: number;
  fileName: string;
  filePath: string;
  fileSize: number;
}

export class VaultService {
  private viewOnceIndex: ViewOnceItem[] = [];
  private messagesVault: Map<string, VaultedMessage> = new Map();
  private statusIndex: StatusVaultItem[] = [];
  private statusMap: Map<string, StatusVaultItem> = new Map();
  private dpIndex: Map<string, DpVaultItem> = new Map();

  private messagesVaultDirty = false;
  private statusIndexDirty = false;
  private viewOnceIndexDirty = false;
  private dpIndexDirty = false;
  private saveDebounceTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.ensureDirectories();
    this.loadIndices();
    this.startPeriodicFlusher();
  }

  private startPeriodicFlusher() {
    setInterval(() => {
      this.flushDirtyIndices();
    }, 10000);
  }

  private async flushDirtyIndices() {
    if (this.messagesVaultDirty) {
      this.messagesVaultDirty = false;
      try {
        const arr = Array.from(this.messagesVault.values()).slice(-800);
        await fs.promises.writeFile(MESSAGES_VAULT_FILE, JSON.stringify(arr), 'utf-8');
      } catch (e) {}
    }
    if (this.statusIndexDirty) {
      this.statusIndexDirty = false;
      try {
        const arr = this.statusIndex.slice(0, 300);
        await fs.promises.writeFile(STATUS_INDEX_FILE, JSON.stringify(arr), 'utf-8');
      } catch (e) {}
    }
    if (this.viewOnceIndexDirty) {
      this.viewOnceIndexDirty = false;
      try {
        await fs.promises.writeFile(VIEWONCE_INDEX_FILE, JSON.stringify(this.viewOnceIndex), 'utf-8');
      } catch (e) {}
    }
    if (this.dpIndexDirty) {
      this.dpIndexDirty = false;
      try {
        const arr = Array.from(this.dpIndex.values());
        await fs.promises.writeFile(DP_INDEX_FILE, JSON.stringify(arr), 'utf-8');
      } catch (e) {}
    }
  }

  private ensureDirectories() {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      if (!fs.existsSync(VAULT_DIR)) fs.mkdirSync(VAULT_DIR, { recursive: true });
      if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });
      if (!fs.existsSync(STATUS_DIR)) fs.mkdirSync(STATUS_DIR, { recursive: true });
      if (!fs.existsSync(DP_DIR)) fs.mkdirSync(DP_DIR, { recursive: true });
    } catch (e) {}
  }

  private loadIndices() {
    try {
      if (fs.existsSync(VIEWONCE_INDEX_FILE)) {
        const raw = fs.readFileSync(VIEWONCE_INDEX_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Filter out missing files
          this.viewOnceIndex = parsed.filter(item => {
            const p = item.filePath || path.join(MEDIA_DIR, item.fileName);
            return fs.existsSync(p);
          });
        }
      }
    } catch (e) {
      this.viewOnceIndex = [];
    }

    try {
      if (fs.existsSync(MESSAGES_VAULT_FILE)) {
        const raw = fs.readFileSync(MESSAGES_VAULT_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const m of parsed) {
            if (m.id) {
              this.messagesVault.set(m.id, m);
            }
          }
        }
      }
    } catch (e) {
      this.messagesVault.clear();
    }

    try {
      if (fs.existsSync(STATUS_INDEX_FILE)) {
        const raw = fs.readFileSync(STATUS_INDEX_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.statusIndex = parsed.filter(item => {
            if (item.type === 'text') return true;
            const p = item.filePath || (item.fileName ? path.join(STATUS_DIR, item.fileName) : '');
            return !p || fs.existsSync(p);
          });
          for (const s of this.statusIndex) {
            if (s.msgId) this.statusMap.set(s.msgId, s);
            if (s.id) this.statusMap.set(s.id, s);
          }
        }
      }
    } catch (e) {
      this.statusIndex = [];
      this.statusMap.clear();
    }

    try {
      if (fs.existsSync(DP_INDEX_FILE)) {
        const raw = fs.readFileSync(DP_INDEX_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item.phoneNumber && (item.filePath ? fs.existsSync(item.filePath) : true)) {
              this.dpIndex.set(item.phoneNumber, item);
            }
          }
        }
      }
    } catch (e) {
      this.dpIndex.clear();
    }
  }

  public saveCachedUserDp(phoneNumber: string, buffer: Buffer, pushName?: string): DpVaultItem | null {
    if (!phoneNumber || !buffer || buffer.length === 0) return null;
    const cleanNum = phoneNumber.replace(/[^0-9]/g, '');
    if (cleanNum.length < 5) return null;

    try {
      this.ensureDirectories();
      const fileName = `dp_${cleanNum}.jpg`;
      const filePath = path.join(DP_DIR, fileName);
      fs.writeFileSync(filePath, buffer);

      const item: DpVaultItem = {
        phoneNumber: cleanNum,
        jid: `${cleanNum}@s.whatsapp.net`,
        pushName: pushName || this.dpIndex.get(cleanNum)?.pushName,
        timestamp: Date.now(),
        fileName,
        filePath,
        fileSize: buffer.length
      };

      this.dpIndex.set(cleanNum, item);
      this.dpIndexDirty = true;
      return item;
    } catch (err) {
      return null;
    }
  }

  public getCachedUserDp(phoneNumber: string): { item: DpVaultItem; buffer: Buffer } | null {
    if (!phoneNumber) return null;
    const cleanNum = phoneNumber.replace(/[^0-9]/g, '');
    const item = this.dpIndex.get(cleanNum);
    if (!item) return null;

    const p = item.filePath || path.join(DP_DIR, item.fileName);
    if (fs.existsSync(p)) {
      try {
        const buffer = fs.readFileSync(p);
        return { item, buffer };
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  public getAllCachedDps(): DpVaultItem[] {
    return Array.from(this.dpIndex.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  private saveViewOnceIndex() {
    this.viewOnceIndexDirty = true;
  }

  private saveStatusIndex() {
    this.statusIndexDirty = true;
  }

  private saveMessagesVault() {
    this.messagesVaultDirty = true;
  }

  public saveViewOnceMedia(
    msgId: string,
    sender: string,
    senderNumber: string,
    from: string,
    pushName: string | undefined,
    type: 'image' | 'video' | 'audio',
    caption: string | undefined,
    buffer: Buffer,
    mimetype: string
  ): ViewOnceItem | null {
    try {
      this.ensureDirectories();
      const ext = type === 'video' ? 'mp4' : type === 'audio' ? 'mp3' : 'jpg';
      const safeId = 'vo_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      const fileName = `${safeId}_${msgId.replace(/[^a-zA-Z0-9_-]/g, '')}.${ext}`;
      const filePath = path.join(MEDIA_DIR, fileName);

      fs.writeFileSync(filePath, buffer);

      const item: ViewOnceItem = {
        id: safeId,
        msgId,
        sender,
        senderNumber,
        from,
        pushName,
        timestamp: Date.now(),
        type,
        caption,
        fileName,
        fileSize: buffer.length,
        filePath,
        mimetype
      };

      // Add to beginning of array
      this.viewOnceIndex.unshift(item);
      if (this.viewOnceIndex.length > 500) {
        const removed = this.viewOnceIndex.pop();
        if (removed && fs.existsSync(removed.filePath)) {
          try { fs.unlinkSync(removed.filePath); } catch {}
        }
      }

      this.saveViewOnceIndex();
      return item;
    } catch (err) {
      return null;
    }
  }

  public getViewOnceList(): ViewOnceItem[] {
    return [...this.viewOnceIndex];
  }

  public getLatestViewOnce(): { item: ViewOnceItem; buffer: Buffer } | null {
    if (this.viewOnceIndex.length === 0) return null;
    const item = this.viewOnceIndex[0];
    const targetPath = item.filePath || path.join(MEDIA_DIR, item.fileName);
    if (fs.existsSync(targetPath)) {
      try {
        const buffer = fs.readFileSync(targetPath);
        return { item, buffer };
      } catch (e) {}
    }
    return null;
  }

  public getViewOnceByIdOrIndex(query: string | number): { item: ViewOnceItem; buffer: Buffer } | null {
    let item: ViewOnceItem | undefined;

    if (typeof query === 'number' || /^\d+$/.test(String(query).trim())) {
      const idx = typeof query === 'number' ? query - 1 : parseInt(query.trim(), 10) - 1;
      if (idx >= 0 && idx < this.viewOnceIndex.length) {
        item = this.viewOnceIndex[idx];
      }
    } else {
      const q = String(query).trim().toLowerCase();
      item = this.viewOnceIndex.find(i =>
        i.id.toLowerCase() === q ||
        i.msgId.toLowerCase() === q ||
        i.senderNumber.includes(q) ||
        i.fileName.toLowerCase().includes(q)
      );
    }

    if (item) {
      const targetPath = item.filePath || path.join(MEDIA_DIR, item.fileName);
      if (fs.existsSync(targetPath)) {
        try {
          const buffer = fs.readFileSync(targetPath);
          return { item, buffer };
        } catch (e) {}
      }
    }
    return null;
  }

  public saveMessage(msg: VaultedMessage) {
    if (!msg.id) return;
    this.messagesVault.set(msg.id, msg);
    if (this.messagesVault.size > 800) {
      const firstKey = this.messagesVault.keys().next().value;
      if (firstKey) this.messagesVault.delete(firstKey);
    }
    this.saveMessagesVault();
  }

  public getMessage(id: string): VaultedMessage | undefined {
    return this.messagesVault.get(id);
  }

  public getAllMessagesMap(): Map<string, VaultedMessage> {
    return this.messagesVault;
  }

  public saveBotDp(buffer: Buffer, isGifOrVideo = false, mime = 'image/jpeg'): string {
    this.ensureDirectories();
    const ext = isGifOrVideo ? (mime.includes('gif') ? 'gif' : 'mp4') : 'jpg';
    const filePath = path.join(DATA_DIR, `bot_dp.${ext}`);
    fs.writeFileSync(filePath, buffer);

    const meta = {
      timestamp: Date.now(),
      filePath,
      isGifOrVideo,
      mime,
      fileSize: buffer.length
    };
    fs.writeFileSync(BOT_DP_META, JSON.stringify(meta, null, 2), 'utf-8');
    return filePath;
  }

  public getSavedBotDp(): { buffer: Buffer; isGifOrVideo: boolean; mime: string; filePath: string } | null {
    try {
      if (fs.existsSync(BOT_DP_META)) {
        const meta = JSON.parse(fs.readFileSync(BOT_DP_META, 'utf-8'));
        if (meta.filePath && fs.existsSync(meta.filePath)) {
          const buffer = fs.readFileSync(meta.filePath);
          return {
            buffer,
            isGifOrVideo: !!meta.isGifOrVideo,
            mime: meta.mime || 'image/jpeg',
            filePath: meta.filePath
          };
        }
      }
      if (fs.existsSync(BOT_DP_FILE)) {
        const buffer = fs.readFileSync(BOT_DP_FILE);
        return {
          buffer,
          isGifOrVideo: false,
          mime: 'image/jpeg',
          filePath: BOT_DP_FILE
        };
      }
    } catch (e) {}
    return null;
  }

  // --- Custom Menu & Command Banner Management ---
  public saveCustomBanner(buffer: Buffer, isVideo = false, mime = 'image/jpeg'): { success: boolean; filePath: string; isVideo: boolean } {
    this.ensureDirectories();
    const ext = isVideo ? (mime.includes('gif') ? 'gif' : 'mp4') : 'jpg';
    const bannerFile = path.join(DATA_DIR, `custom_banner.${ext}`);
    const bannerMetaFile = path.join(DATA_DIR, 'custom_banner.json');

    // Also copy to public/tg7_error_menu.jpg or public/tg7_menu_video.mp4 for immediate web serving
    try {
      const publicDir = path.join(process.cwd(), 'public');
      if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
      if (isVideo) {
        fs.writeFileSync(path.join(publicDir, 'tg7_menu_video.mp4'), buffer);
      } else {
        fs.writeFileSync(path.join(publicDir, 'tg7_error_menu.jpg'), buffer);
      }
    } catch (e) {}

    fs.writeFileSync(bannerFile, buffer);
    const meta = {
      timestamp: Date.now(),
      filePath: bannerFile,
      isVideo,
      mime,
      fileSize: buffer.length
    };
    fs.writeFileSync(bannerMetaFile, JSON.stringify(meta, null, 2), 'utf-8');
    return { success: true, filePath: bannerFile, isVideo };
  }

  public getCustomBanner(): { buffer: Buffer; isVideo: boolean; mime: string; filePath: string } | null {
    try {
      const bannerMetaFile = path.join(DATA_DIR, 'custom_banner.json');
      if (fs.existsSync(bannerMetaFile)) {
        const meta = JSON.parse(fs.readFileSync(bannerMetaFile, 'utf-8'));
        if (meta.filePath && fs.existsSync(meta.filePath)) {
          const buffer = fs.readFileSync(meta.filePath);
          if (buffer && buffer.length > 500) {
            return {
              buffer,
              isVideo: !!meta.isVideo,
              mime: meta.mime || (meta.isVideo ? 'video/mp4' : 'image/jpeg'),
              filePath: meta.filePath
            };
          }
        }
      }
    } catch (e) {}
    return null;
  }

  public resetCustomBanner(): boolean {
    try {
      const bannerMetaFile = path.join(DATA_DIR, 'custom_banner.json');
      if (fs.existsSync(bannerMetaFile)) fs.unlinkSync(bannerMetaFile);

      const files = fs.readdirSync(DATA_DIR);
      for (const f of files) {
        if (f.startsWith('custom_banner.')) {
          fs.unlinkSync(path.join(DATA_DIR, f));
        }
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  // --- 24/7 Anti-Status & Status Vault Support ---
  public saveStatusMedia(
    msgId: string,
    sender: string,
    senderNumber: string,
    pushName: string | undefined,
    type: 'image' | 'video' | 'audio' | 'text',
    textOrCaption: string | undefined,
    buffer?: Buffer,
    mimetype?: string,
    key?: any,
    message?: any
  ): StatusVaultItem | null {
    try {
      this.ensureDirectories();
      const safeId = 'status_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      let fileName: string | undefined;
      let filePath: string | undefined;

      if (buffer && buffer.length > 0 && type !== 'text') {
        const ext = type === 'video' ? 'mp4' : type === 'audio' ? 'mp3' : 'jpg';
        fileName = `${safeId}_${msgId.replace(/[^a-zA-Z0-9_-]/g, '')}.${ext}`;
        filePath = path.join(STATUS_DIR, fileName);
        fs.writeFileSync(filePath, buffer);
      }

      const item: StatusVaultItem = {
        id: safeId,
        msgId,
        sender,
        senderNumber,
        pushName,
        timestamp: Date.now(),
        type,
        text: type === 'text' ? textOrCaption : undefined,
        caption: type !== 'text' ? textOrCaption : undefined,
        fileName,
        filePath,
        fileSize: buffer ? buffer.length : 0,
        mimetype: mimetype || (type === 'video' ? 'video/mp4' : type === 'image' ? 'image/jpeg' : type === 'audio' ? 'audio/mp4' : undefined),
        key,
        message
      };

      // Add to index
      this.statusIndex.unshift(item);
      this.statusMap.set(msgId, item);
      this.statusMap.set(safeId, item);

      // Keep max 600 in index
      if (this.statusIndex.length > 600) {
        const removed = this.statusIndex.pop();
        if (removed) {
          this.statusMap.delete(removed.msgId);
          this.statusMap.delete(removed.id);
          if (removed.filePath && fs.existsSync(removed.filePath)) {
            try { fs.unlinkSync(removed.filePath); } catch {}
          }
        }
      }

      this.saveStatusIndex();
      return item;
    } catch (err) {
      return null;
    }
  }

  public getStatus(query: string): { item: StatusVaultItem; buffer?: Buffer } | null {
    if (!query) return null;
    const q = String(query).trim();
    let item = this.statusMap.get(q);

    if (!item) {
      item = this.statusIndex.find(i =>
        i.msgId === q ||
        i.id === q ||
        (i.key && i.key.id === q) ||
        i.senderNumber === q ||
        i.sender === q
      );
    }

    if (item) {
      if (item.filePath && fs.existsSync(item.filePath)) {
        try {
          const buffer = fs.readFileSync(item.filePath);
          return { item, buffer };
        } catch (e) {
          return { item };
        }
      }
      return { item };
    }
    return null;
  }

  public getLatestStatusBySender(senderQuery: string): { item: StatusVaultItem; buffer?: Buffer } | null {
    if (!senderQuery) return null;
    const cleanNumber = senderQuery.replace(/[^0-9]/g, '');
    const item = this.statusIndex.find(i =>
      i.senderNumber.includes(cleanNumber) ||
      i.sender.includes(cleanNumber)
    );

    if (item) {
      if (item.filePath && fs.existsSync(item.filePath)) {
        try {
          const buffer = fs.readFileSync(item.filePath);
          return { item, buffer };
        } catch (e) {
          return { item };
        }
      }
      return { item };
    }
    return null;
  }

  public getStatusList(): StatusVaultItem[] {
    return [...this.statusIndex];
  }

  public getStatusCount(): number {
    return this.statusIndex.length;
  }
}

export const vaultService = new VaultService();
