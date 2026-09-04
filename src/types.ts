export interface BotConfig {
  botName: string;
  ownerName: string;
  ownerNumber: string;
  prefix: string;
  workMode: 'public' | 'private' | 'groups' | 'self';
  autoRead: boolean;
  autoStatusView: boolean;
  alwaysOnline: boolean;
  antiLink: boolean;
  antiDelete: boolean;
  antiEdit: boolean;
  antiSpam: boolean;
  antiBadword: boolean;
  antiBot: boolean;
  antiViewOnce: boolean;
  antiTelegram: boolean;
  antiUrl: boolean;
  antiCall: boolean;
  antiFake: boolean;
  antiBug: boolean;
  antiTagAll: boolean;
  antiStickerSpam: boolean;
  antiAudioSpam: boolean;
  antiDocument: boolean;
  antiNsfw: boolean;
  antiDemote: boolean;
  antiPromote: boolean;
  antiGhost: boolean;
  antiInvite: boolean;
  antiForeign: boolean;
  antiDeleteStatus: boolean;
  antiReact: boolean;
  antiDeleteForwardToDm: boolean;
  autoReact: boolean;
  autoReactEmoji: string;
  geminiAiEnabled: boolean;
  geminiApiKey: string;
  welcomeMessage: string;
  customStatus: string;
  autoRestartOnCrash: boolean;
  maxRestartRetries: number;
  restartDelaySeconds: number;
  runnerMode: 'integrated' | 'custom';
  customEntryFile: string;
  savedSessionId: string;
  keepAlive24_7: boolean;
}

export interface BotStatus {
  connected: boolean;
  pairingCode: string | null;
  qrCode: string | null;
  botNumber: string | null;
  pushName: string | null;
  uptimeSeconds: number;
  restartCount: number;
  memoryUsageMb: number;
  totalCommandsExecuted: number;
  totalMessagesProcessed: number;
  totalGroupsCount: number;
  totalChatsCount: number;
  lastSeenTimestamp: number | null;
  runnerMode: string;
  customBotRunning: boolean;
  antiDeleteVaultCount: number;
  keepAliveStatus?: {
    enabled: boolean;
    lastPing: number;
    pingIntervalSeconds: number;
    consecutiveHealthyPings: number;
  };
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success' | 'cmd' | 'command' | 'whatsapp' | 'anti_delete' | 'view_once' | 'security' | string;
  message: string;
  details?: any;
}

export interface BotCommand {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  category: string;
  permission: 'all' | 'owner' | 'admin' | 'premium';
  enabled: boolean;
  responseType: 'text' | 'script' | 'media' | 'audio' | 'sticker';
  usage?: string;
  tags?: string[];
  customScript?: string;
  staticResponse?: string;
}

export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  updatedAt?: string;
}

export interface SessionSlot {
  id: string;
  name: string;
  phoneNumber?: string;
  sessionId?: string;
  sessionIdSnippet?: string;
  ownerNumber?: string;
  prefix?: string;
  botName?: string;
  createdAt: string;
  lastActive: string;
  isActive: boolean;
  description?: string;
  liveStatus?: {
    connected: boolean;
    botNumber: string | null;
    pushName: string | null;
    uptimeSeconds: number;
    error: string | null;
  };
}
