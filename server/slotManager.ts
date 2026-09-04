import fs from 'fs';
import path from 'path';
import pino from 'pino';
import NodeCache from 'node-cache';
import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  Browsers,
  proto,
  jidNormalizedUser
} from '@whiskeysockets/baileys';
import type { SessionSlot } from './types.js';
import { botManager } from './botManager.js';
import { extractMediaFromMessage, ensureValidWhatsAppMp4, convertAudioToWhatsAppVoice, searchPopularImages } from './mediaDownloader.js';
import { fetchMediaBuffer } from './reactionService.js';

const SLOTS_FILE = path.join(process.cwd(), 'session_slots.json');
const SLOTS_DIR = path.join(process.cwd(), 'session_slots');

if (!fs.existsSync(SLOTS_DIR)) {
  fs.mkdirSync(SLOTS_DIR, { recursive: true });
}

// Memory map of running slot instances
interface ActiveSlotInstance {
  slotId: string;
  sock: any | null;
  startedAt: number;
  uptimeSeconds: number;
  connected: boolean;
  botNumber: string | null;
  pushName: string | null;
  error: string | null;
  messageVault: Map<string, any>;
  recentDeletedMsgIds: Map<string, number>;
}

const activeSlots = new Map<string, ActiveSlotInstance>();

export function getAllSlots(): SessionSlot[] {
  try {
    if (fs.existsSync(SLOTS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SLOTS_FILE, 'utf-8'));
      if (Array.isArray(data)) {
        return data.map(slot => {
          const active = activeSlots.get(slot.id);
          const liveStatus = {
            connected: active ? active.connected : false,
            botNumber: active ? active.botNumber : (slot.phoneNumber || null),
            pushName: active ? active.pushName : null,
            uptimeSeconds: active && active.connected ? Math.floor((Date.now() - active.startedAt) / 1000) : 0,
            error: active ? active.error : null
          };
          return {
            ...slot,
            liveStatus
          };
        });
      }
    }
  } catch (e) {}
  return [];
}

export function getSlot(id: string): SessionSlot | undefined {
  const slots = getAllSlots();
  return slots.find(s => s.id === id);
}

export function saveSlots(slots: SessionSlot[]) {
  // Strip liveStatus before saving to json
  const clean = slots.map(s => {
    const { liveStatus, ...rest } = s;
    return rest;
  });
  fs.writeFileSync(SLOTS_FILE, JSON.stringify(clean, null, 2), 'utf-8');
}

export function createSlot(name: string, sessionId?: string, phoneNumber?: string, prefix?: string, description?: string): SessionSlot {
  const slots = getAllSlots();
  const id = 'slot_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  const cleanPrefix = (prefix || '.').trim() || '.';
  const snippet = sessionId ? (sessionId.length > 25 ? sessionId.slice(0, 22) + '...' : sessionId) : 'Empty Slot';

  const newSlot: SessionSlot = {
    id,
    name: name.trim() || `Friend Slot #${slots.length + 1}`,
    phoneNumber: phoneNumber ? phoneNumber.replace(/[^0-9]/g, '') : undefined,
    sessionId: sessionId ? sessionId.trim() : undefined,
    sessionIdSnippet: snippet,
    ownerNumber: phoneNumber ? phoneNumber.replace(/[^0-9]/g, '') : undefined,
    prefix: cleanPrefix,
    botName: `${name.trim() || 'Friend'} MD Bot`,
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    isActive: true,
    description: description || 'Friend Bot Multi-Tenant Slot'
  };

  const slotFolder = path.join(SLOTS_DIR, id);
  if (!fs.existsSync(slotFolder)) {
    fs.mkdirSync(slotFolder, { recursive: true });
  }

  slots.push(newSlot);
  saveSlots(slots);
  return newSlot;
}

export function updateSlot(id: string, updateData: Partial<SessionSlot>): SessionSlot | null {
  const slots = getAllSlots();
  const index = slots.findIndex(s => s.id === id);
  if (index === -1) return null;

  const current = slots[index];
  const updated: SessionSlot = {
    ...current,
    ...updateData,
    id: current.id,
    lastActive: new Date().toISOString()
  };

  if (updateData.sessionId) {
    updated.sessionIdSnippet = updateData.sessionId.length > 25
      ? updateData.sessionId.slice(0, 22) + '...'
      : updateData.sessionId;
  }

  slots[index] = updated;
  saveSlots(slots);
  return updated;
}

export async function deleteSlot(id: string) {
  // Stop instance first if active
  await stopSlot(id);

  let slots = getAllSlots();
  slots = slots.filter(s => s.id !== id);
  saveSlots(slots);

  const slotFolder = path.join(SLOTS_DIR, id);
  if (fs.existsSync(slotFolder)) {
    try {
      fs.rmSync(slotFolder, { recursive: true, force: true });
    } catch (e) {}
  }
}

// ─────────────────────────────────────────────────────────────
// Multi-Tenant Slot Runner Engine (100% Isolated Baileys Sockets)
// ─────────────────────────────────────────────────────────────

export async function startSlot(slotId: string): Promise<{ success: boolean; message: string; botNumber?: string }> {
  const slot = getSlot(slotId);
  if (!slot) {
    return { success: false, message: `Slot ${slotId} not found.` };
  }

  if (!slot.sessionId || !slot.sessionId.trim()) {
    return { success: false, message: `Slot "${slot.name}" has no Session ID. Please add friend's session ID first.` };
  }

  // Stop existing if running
  await stopSlot(slotId);

  const slotFolder = path.join(SLOTS_DIR, slotId);
  const authFolder = path.join(slotFolder, 'auth');
  if (!fs.existsSync(authFolder)) {
    fs.mkdirSync(authFolder, { recursive: true });
  }

  try {
    // Unpack session credentials safely into slot's isolated auth folder
    const parsedCreds = await botManager.parseSessionCredentials(slot.sessionId.trim());
    if (!parsedCreds) {
      return { success: false, message: `Failed to decode Session ID for slot "${slot.name}". Please check the session format.` };
    }

    const credsPath = path.join(authFolder, 'creds.json');
    (botManager as any).writeCredsSafely(credsPath, parsedCreds);

    const instance: ActiveSlotInstance = {
      slotId,
      sock: null,
      startedAt: Date.now(),
      uptimeSeconds: 0,
      connected: false,
      botNumber: slot.phoneNumber || (parsedCreds.me?.id ? parsedCreds.me.id.split(':')[0].split('@')[0] : null),
      pushName: null,
      error: null,
      messageVault: new Map(),
      recentDeletedMsgIds: new Map()
    };

    activeSlots.set(slotId, instance);

    // Clean any 0-byte corrupted files
    try {
      if (fs.existsSync(authFolder)) {
        const files = fs.readdirSync(authFolder);
        for (const f of files) {
          const p = path.join(authFolder, f);
          try {
            const stat = fs.statSync(p);
            if (stat.size === 0) fs.unlinkSync(p);
          } catch {}
        }
      }
    } catch {}

    const { state, saveCreds } = await useMultiFileAuthState(authFolder);

    // Resilient Signal key store wrapper
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
              const keyFile = path.join(authFolder, `${type}-${id}.json`);
              try { if (fs.existsSync(keyFile)) fs.unlinkSync(keyFile); } catch {}
            }
          }
          return {};
        }
      };

      state.keys.set = async (data: any) => {
        try {
          await origKeysSet(data);
        } catch (setErr: any) {}
      };
    }
    const { version } = await fetchLatestBaileysVersion();

    const logger = pino({ level: 'silent' });
    const msgRetryCounterCache = new NodeCache({ stdTTL: 60 * 60 * 4, checkperiod: 60 * 10 });

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger,
      browser: Browsers.macOS('Desktop'),
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
      emitOwnEvents: false,
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      retryRequestDelayMs: 250,
      maxMsgRetryCount: 5,
      msgRetryCounterCache,
      getMessage: async (key) => {
        if (key?.id) {
          const fromMem = instance.messageVault.get(key.id);
          if (fromMem && fromMem.message) return fromMem.message;
        }
        return undefined;
      }
    });

    const origSend = sock.sendMessage.bind(sock);
    const slotPacingMap = new Map<string, Promise<any>>();

    sock.sendMessage = async (jid: string, content: any, options?: any) => {
      const prev = slotPacingMap.get(jid) || Promise.resolve();
      const current = prev.then(async () => {
        try {
          const isAudio = !!(content?.audio);
          await sock.sendPresenceUpdate(isAudio ? 'recording' : 'composing', jid).catch(() => {});
        } catch {}

        const isMedia = !!(content?.video || content?.audio || content?.image || content?.document || content?.sticker);
        await new Promise(r => setTimeout(r, isMedia ? 550 : 380));

        try {
          const res = await origSend(jid, content, options);
          try {
            await sock.sendPresenceUpdate('paused', jid).catch(() => {});
          } catch {}

          if (res?.key?.id && res?.message) {
            instance.messageVault.set(res.key.id, {
              id: res.key.id,
              key: res.key,
              message: res.message,
              sender: sock?.user?.id ? jidNormalizedUser(sock.user.id) : 'me',
              from: jid,
              timestamp: Date.now()
            });
          }
          return res;
        } catch (e) {
          try {
            await sock.sendPresenceUpdate('paused', jid).catch(() => {});
          } catch {}
          throw e;
        }
      });
      slotPacingMap.set(jid, current.catch(() => {}));
      return current;
    };

    instance.sock = sock;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === 'open') {
        instance.connected = true;
        instance.error = null;
        if (sock.user) {
          const cleanNum = sock.user.id.split(':')[0].split('@')[0];
          instance.botNumber = cleanNum;
          instance.pushName = sock.user.name || sock.user.notify || slot.name;

          // Update slot record
          updateSlot(slotId, {
            phoneNumber: cleanNum,
            lastActive: new Date().toISOString(),
            isActive: true
          });
        }
        botManager.log('info', `🟢 [Slot: ${slot.name}] WhatsApp Connected Successfully (+${instance.botNumber || 'User'})!`);
      } else if (connection === 'close') {
        instance.connected = false;
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        botManager.log('warn', `⚠️ [Slot: ${slot.name}] Connection closed (Status: ${statusCode || 'Unknown'}). Reconnect: ${shouldReconnect}`);

        if (statusCode === DisconnectReason.loggedOut) {
          instance.error = 'Session Logged Out';
          updateSlot(slotId, { isActive: false });
        } else if (shouldReconnect) {
          // Reconnect slot after 5s
          setTimeout(() => {
            if (activeSlots.has(slotId)) {
              startSlot(slotId).catch(() => {});
            }
          }, 5000);
        }
      }
    });

    // Handle messages for this isolated slot
    sock.ev.on('messages.upsert', async (chatUpdate) => {
      try {
        if (!chatUpdate.messages || chatUpdate.messages.length === 0) return;

        for (const msg of chatUpdate.messages) {
          if (!msg.message) continue;

          const rawFrom = msg.key.remoteJid || '';
          if (rawFrom === 'status@broadcast') continue;

          const from = jidNormalizedUser(rawFrom);
          const isGroup = from.endsWith('@g.us');
          const rawParticipant = msg.key.participant || (isGroup ? rawFrom : from);
          const senderJid = rawParticipant ? jidNormalizedUser(rawParticipant) : from;
          const senderNumber = senderJid ? senderJid.split('@')[0].split(':')[0] : 'Unknown';
          const isFromMe = msg.key.fromMe || false;

          const slotOwnerNum = (slot.phoneNumber || instance.botNumber || '').replace(/[^0-9]/g, '');
          const isOwner = isFromMe || (slotOwnerNum && senderNumber.replace(/[^0-9]/g, '') === slotOwnerNum);

          const realMsg = (botManager as any).unwrapBaileysMessage(msg.message);
          if (!realMsg) continue;

          // Ingest into slot-isolated vault for anti-delete
          if (msg.key.id) {
            instance.messageVault.set(msg.key.id, {
              id: msg.key.id,
              key: msg.key,
              message: msg.message,
              sender: senderNumber,
              from,
              pushName: msg.pushName || 'User',
              timestamp: Date.now()
            });

            // Keep memory cache capped at 1000 messages
            if (instance.messageVault.size > 1000) {
              const firstKey = instance.messageVault.keys().next().value;
              if (firstKey) instance.messageVault.delete(firstKey);
            }
          }

          // Handle anti-delete for this slot (strictly notifies this friend's DM only!)
          const protocolMsg = msg.message?.protocolMessage || realMsg?.protocolMessage;
          if (protocolMsg && (protocolMsg.type === 0 || protocolMsg.type === proto.Message.ProtocolMessage.Type.REVOKE)) {
            const targetId = protocolMsg.key?.id;
            if (targetId) {
              const vaulted = instance.messageVault.get(targetId);
              if (vaulted && instance.sock) {
                const now = Date.now();
                if (!instance.recentDeletedMsgIds.has(targetId)) {
                  instance.recentDeletedMsgIds.set(targetId, now);

                  const unwrapV = (botManager as any).unwrapBaileysMessage(vaulted.message);
                  const textContent = unwrapV?.conversation || unwrapV?.extendedTextMessage?.text || unwrapV?.imageMessage?.caption || '';
                  const friendDm = jidNormalizedUser((slotOwnerNum || senderNumber) + '@s.whatsapp.net');

                  let mediaExt: any = null;
                  try {
                    mediaExt = await extractMediaFromMessage({ key: vaulted.key, message: vaulted.message } as any);
                  } catch (e) {}

                  const alertCard = `🚨 *【 ${slot.name.toUpperCase()} • 𝗔𝗡𝗧𝗜-𝗗𝗘𝗟𝗘𝗧𝗘 𝗦𝗛𝗜𝗘𝗟𝗗 】* 🚨\n` +
                    `━━━━━━━━━━━━━━━━━━━━\n` +
                    `👤 *Sender:* @${vaulted.sender} (${vaulted.pushName || 'User'})\n` +
                    `📍 *Location:* ${isGroup ? 'Group Chat' : 'Direct Message'}\n` +
                    `🕒 *Deleted At:* \`${new Date().toLocaleTimeString()}\`\n` +
                    `━━━━━━━━━━━━━━━━━━━━\n` +
                    (textContent ? `💬 *Content:*\n"${textContent}"\n` : `📦 [ Recovered Media Attached Below ]\n`) +
                    `━━━━━━━━━━━━━━━━━━━━\n` +
                    `👑 ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝗧𝗚𝟳 𝗘𝗥𝗥𝗢𝗥 𝗠𝗗 ⚡`;

                  try {
                    if (mediaExt && mediaExt.buffer && mediaExt.buffer.length > 500) {
                      if (mediaExt.type === 'video') {
                        const validMp4 = await ensureValidWhatsAppMp4(mediaExt.buffer);
                        await instance.sock.sendMessage(friendDm, {
                          video: validMp4 || mediaExt.buffer,
                          caption: alertCard,
                          mentions: [vaulted.sender + '@s.whatsapp.net']
                        });
                      } else {
                        await instance.sock.sendMessage(friendDm, {
                          image: mediaExt.buffer,
                          caption: alertCard,
                          mentions: [vaulted.sender + '@s.whatsapp.net']
                        });
                      }
                    } else if (textContent) {
                      await instance.sock.sendMessage(friendDm, {
                        text: alertCard,
                        mentions: [vaulted.sender + '@s.whatsapp.net']
                      });
                    }
                  } catch (e) {}
                }
              }
            }
            continue;
          }

          // Extract text for commands
          const body = (
            realMsg?.conversation ||
            realMsg?.extendedTextMessage?.text ||
            realMsg?.imageMessage?.caption ||
            realMsg?.videoMessage?.caption ||
            ''
          ).trim();

          const slotPrefix = (slot.prefix || '.').trim();

          if (body.startsWith(slotPrefix)) {
            const afterPrefix = body.slice(slotPrefix.length).trim();
            const words = afterPrefix.split(/\s+/);
            const cmd = (words.shift() || '').toLowerCase();

            const reply = async (txt: string) => {
              if (instance.sock) {
                await instance.sock.sendMessage(from, { text: txt }, { quoted: msg });
              }
            };

            // Slot-specific core commands
            if (cmd === 'menu' || cmd === 'help') {
              const menuCard = `👑 *【 𝗧𝗚𝟳 𝗘𝗥𝗥𝗢𝗥 𝗠𝗗 • ${slot.name.toUpperCase()} 】* 👑\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `👤 *User:* ${msg.pushName || 'Friend'}\n` +
                `🤖 *Bot Name:* ${slot.botName}\n` +
                `🎯 *Prefix:* [ \`${slotPrefix}\` ]\n` +
                `⚡ *Status:* Online & Active 24/7\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `🌟 *POPULAR COMMANDS:*\n` +
                `• \`${slotPrefix}ping\` ➔ Check Bot Response Speed\n` +
                `• \`${slotPrefix}image <query>\` ➔ Search 8 HD Photos\n` +
                `• \`${slotPrefix}tiktok <url>\` ➔ HD No-Watermark TikTok\n` +
                `• \`${slotPrefix}play <song>\` ➔ Download Any Song Audio\n` +
                `• \`${slotPrefix}ytmp4 <url>\` ➔ HD YouTube Video\n` +
                `• \`${slotPrefix}truth / ${slotPrefix}dare\` ➔ Party Game\n` +
                `• \`${slotPrefix}quran / ${slotPrefix}hadith\` ➔ Holy Texts\n` +
                `• \`${slotPrefix}shayari / ${slotPrefix}latifa\` ➔ Urdu Fun\n` +
                `• \`${slotPrefix}setprefix <symbol>\` ➔ Change Prefix\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `👑 ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝗧𝗚𝟳 𝗘𝗥𝗥𝗢𝗥 𝗠𝗗 ⚡`;
              await reply(menuCard);
              continue;
            }

            if (cmd === 'ping') {
              const start = Date.now();
              await reply(`🏓 *Pong!* \`${Date.now() - start}ms\` ⚡`);
              continue;
            }

            if (cmd === 'setprefix' || cmd === 'prefix') {
              if (!isOwner) {
                await reply(`⛔ *Access Denied:* Only the slot owner can change the prefix.`);
                continue;
              }
              const newP = (words[0] || '').trim();
              if (!newP || newP.length > 3) {
                await reply(`⚠️ Please provide a valid 1-3 character prefix (e.g. \`${slotPrefix}setprefix !\`)`);
                continue;
              }
              slot.prefix = newP;
              updateSlot(slotId, { prefix: newP });
              await reply(`🎯 *[ PREFIX UPDATED ]*\nNew prefix for ${slot.name} is now: [ \`${newP}\` ]`);
              continue;
            }

            if (cmd === 'image' || cmd === 'img' || cmd === 'imgae' || cmd === 'photo') {
              let q = words.join(' ').trim();
              if (!q) {
                await reply(`⚠️ *Usage:* \`${slotPrefix}image Cristiano Ronaldo\``);
                continue;
              }

              let reqCount = 6;
              const lastWord = words[words.length - 1];
              if (words.length > 1 && /^\d+$/.test(lastWord)) {
                const parsed = parseInt(lastWord, 10);
                if (parsed >= 1 && parsed <= 10) {
                  reqCount = parsed;
                  q = words.slice(0, words.length - 1).join(' ').trim();
                }
              }

              await reply(`🔍 *[ SEARCHING 4K / HD PHOTOS ]*\nFetching *${reqCount}* HD photos for: *${q}*...`);
              const images = await searchPopularImages(q, Math.max(reqCount * 2, 12));
              if (images && images.length > 0) {
                const fetchPromises = images.slice(0, Math.max(reqCount * 2 + 2, 14)).map(u => fetchMediaBuffer(u, 5000));
                const results = await Promise.allSettled(fetchPromises);
                const validBuffers = results
                  .map(r => r.status === 'fulfilled' ? r.value : null)
                  .filter((b): b is Buffer => b !== null && b.length > 3000);

                if (validBuffers.length > 0) {
                  const sendCount = Math.min(validBuffers.length, reqCount);
                  for (let i = 0; i < sendCount; i++) {
                    try {
                      await instance.sock.sendMessage(from, {
                        image: validBuffers[i],
                        caption: `🖼️ *【 ${slot.name.toUpperCase()} HD PHOTO • ${q.toUpperCase()} 】*\n📸 *Photo [${i + 1}/${sendCount}]* • *Full High Definition*\n⚡ Powered by TG7 ERROR MD`
                      }, { quoted: i === 0 ? msg : undefined });
                      if (i < sendCount - 1) {
                        await new Promise(r => setTimeout(r, 450));
                      }
                    } catch (e) {}
                  }
                } else {
                  await reply(`⚠️ Could not download HD photos for "${q}". Please try different keywords.`);
                }
              } else {
                await reply(`⚠️ Could not find images for "${q}".`);
              }
              continue;
            }
          }
        }
      } catch (err: any) {
        botManager.log('error', `[Slot: ${slot.name}] Message handler error: ${err.message}`);
      }
    });

    return {
      success: true,
      message: `🟢 Slot "${slot.name}" started successfully!`,
      botNumber: instance.botNumber || undefined
    };
  } catch (err: any) {
    botManager.log('error', `[Slot: ${slot.name}] Startup error: ${err.message}`);
    return { success: false, message: `Startup error: ${err.message}` };
  }
}

export async function stopSlot(slotId: string): Promise<boolean> {
  const instance = activeSlots.get(slotId);
  if (instance) {
    try {
      if (instance.sock) {
        instance.sock.end(undefined);
      }
    } catch (e) {}
    activeSlots.delete(slotId);
    botManager.log('info', `🔴 Slot ${slotId} stopped.`);
    return true;
  }
  return false;
}

export async function startAllActiveSlots(): Promise<{ started: number; errors: number }> {
  const slots = getAllSlots();
  let started = 0;
  let errors = 0;

  for (const slot of slots) {
    if (slot.isActive !== false && slot.sessionId && slot.sessionId.trim()) {
      try {
        const res = await startSlot(slot.id);
        if (res.success) started++;
        else errors++;
      } catch (e) {
        errors++;
      }
    }
  }

  botManager.log('info', `🚀 Master Engine: Booted ${started} friend slot bots (${errors} failed or empty) alongside Main Bot.`);
  return { started, errors };
}

export async function stopAllSlots(): Promise<void> {
  for (const slotId of activeSlots.keys()) {
    await stopSlot(slotId);
  }
  botManager.log('info', '🛑 All friend slot bots stopped.');
}
