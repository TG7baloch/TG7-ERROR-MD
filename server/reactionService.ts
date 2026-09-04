import axios from 'axios';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { exec } from 'child_process';

export interface ReactionAction {
  id: string;
  name: string;
  emoji: string;
  soloMsg: (sender: string) => string;
  targetMsg: (sender: string, target: string) => string;
  fallbackGifs: string[];
}

export const REACTION_ACTIONS: Record<string, ReactionAction> = {
  hug: {
    id: 'hug',
    name: 'Hug',
    emoji: '🤗',
    soloMsg: (s) => `🤗 *@${s}* hugs themselves warmly! ✨`,
    targetMsg: (s, t) => `🤗 *@${s}* gave a warm, tight hug to *@${t}*! ❤️`,
    fallbackGifs: [
      'https://media.tenor.com/kCZ9T3stnnMAAAAC/hug-anime.gif',
      'https://media.tenor.com/2lr9uM51_HYAAAAC/anime-hug.gif',
      'https://nekos.best/api/v2/hug/01.gif'
    ]
  },
  kiss: {
    id: 'kiss',
    name: 'Kiss',
    emoji: '💋',
    soloMsg: (s) => `💋 *@${s}* blew a sweet kiss into the air! ✨`,
    targetMsg: (s, t) => `💋 *@${s}* gave a passionate kiss to *@${t}*! 💖`,
    fallbackGifs: [
      'https://media.tenor.com/I83WJTGoiSQAAAAC/anime-kiss.gif',
      'https://media.tenor.com/F02Ep3b2eJgAAAAC/cute-kawai.gif',
      'https://nekos.best/api/v2/kiss/01.gif'
    ]
  },
  slap: {
    id: 'slap',
    name: 'Slap',
    emoji: '👋',
    soloMsg: (s) => `👋 *@${s}* slapped their own forehead in disbelief! 🤦`,
    targetMsg: (s, t) => `💥 *@${s}* delivered a thunderous slap to *@${t}*! Ouch! ⚡`,
    fallbackGifs: [
      'https://media.tenor.com/Ws6Dm1ZW_vMAAAAC/anime-slap.gif',
      'https://media.tenor.com/Cp-1k5q5i-QAAAAC/anime-slap.gif',
      'https://nekos.best/api/v2/slap/01.gif'
    ]
  },
  pat: {
    id: 'pat',
    name: 'Pat',
    emoji: '🐾',
    soloMsg: (s) => `🐾 *@${s}* pats their own head! 😊`,
    targetMsg: (s, t) => `🐾 *@${s}* gently patted *@${t}*'s head! (Good job!) ✨`,
    fallbackGifs: [
      'https://media.tenor.com/E6fWvsIFeyIAAAAC/anime-head-pat.gif',
      'https://media.tenor.com/dm8520jAOPcAAAAC/pat-head.gif',
      'https://nekos.best/api/v2/pat/01.gif'
    ]
  },
  cuddle: {
    id: 'cuddle',
    name: 'Cuddle',
    emoji: '🧸',
    soloMsg: (s) => `🧸 *@${s}* cuddles a cozy pillow! 😴`,
    targetMsg: (s, t) => `🧸 *@${s}* snuggled and cuddled close with *@${t}*! 🥰`,
    fallbackGifs: [
      'https://media.tenor.com/w9U2UfT1ECAAAAAC/cuddle-anime.gif',
      'https://nekos.best/api/v2/cuddle/01.gif'
    ]
  },
  punch: {
    id: 'punch',
    name: 'Punch',
    emoji: '👊',
    soloMsg: (s) => `👊 *@${s}* throws punches at the air like a boxer! 🥊`,
    targetMsg: (s, t) => `🥊 *@${s}* punched *@${t}* with 100% Cyber Power! 💥`,
    fallbackGifs: [
      'https://media.tenor.com/BoYBoopHRlcAAAAC/anime-punch.gif',
      'https://nekos.best/api/v2/punch/01.gif'
    ]
  },
  cry: {
    id: 'cry',
    name: 'Cry',
    emoji: '😭',
    soloMsg: (s) => `😭 *@${s}* is crying in a corner... 🌧️`,
    targetMsg: (s, t) => `😭 *@${s}* is crying on *@${t}*'s shoulder! 🥺`,
    fallbackGifs: [
      'https://media.tenor.com/f9W_cT5Z-28AAAAC/anime-cry.gif',
      'https://nekos.best/api/v2/cry/01.gif'
    ]
  },
  kill: {
    id: 'kill',
    name: 'Kill',
    emoji: '🗡️',
    soloMsg: (s) => `🗡️ *@${s}* is summoning lethal battle aura! 🔥`,
    targetMsg: (s, t) => `⚔️ *@${s}* executed a lethal finishing strike on *@${t}*! 💀`,
    fallbackGifs: [
      'https://media.tenor.com/kS9ZtJqE5wIAAAAC/anime-slash.gif',
      'https://nekos.best/api/v2/kill/01.gif'
    ]
  },
  dance: {
    id: 'dance',
    name: 'Dance',
    emoji: '💃',
    soloMsg: (s) => `💃 *@${s}* is grooving and dancing! 🎶`,
    targetMsg: (s, t) => `💃 *@${s}* grabbed *@${t}* for a lively dance! 🕺✨`,
    fallbackGifs: [
      'https://nekos.best/api/v2/dance/01.gif',
      'https://media.tenor.com/PshgR1y0dCEAAAAC/anime-dance.gif'
    ]
  },
  bite: {
    id: 'bite',
    name: 'Bite',
    emoji: '🦷',
    soloMsg: (s) => `🦷 *@${s}* bites their own lip! 😬`,
    targetMsg: (s, t) => `🦷 *@${s}* took a playful bite at *@${t}*! 🩸`,
    fallbackGifs: [
      'https://nekos.best/api/v2/bite/01.gif',
      'https://media.tenor.com/7a_Yx7Lw8pYAAAAC/anime-bite.gif'
    ]
  },
  poke: {
    id: 'poke',
    name: 'Poke',
    emoji: '👉',
    soloMsg: (s) => `👉 *@${s}* pokes their cheek! ✨`,
    targetMsg: (s, t) => `👉 *@${s}* poked *@${t}*! "Hey you!" 👀`,
    fallbackGifs: [
      'https://nekos.best/api/v2/poke/01.gif',
      'https://media.tenor.com/4qK4XvV0Zg0AAAAC/anime-poke.gif'
    ]
  },
  blush: {
    id: 'blush',
    name: 'Blush',
    emoji: '😳',
    soloMsg: (s) => `😳 *@${s}* turned completely red and blushed! 💖`,
    targetMsg: (s, t) => `😳 *@${s}* blushed shyly in front of *@${t}*! 🥰`,
    fallbackGifs: [
      'https://nekos.best/api/v2/blush/01.gif',
      'https://media.tenor.com/Fw5Z8zLq6qIAAAAC/anime-blush.gif'
    ]
  },
  smile: {
    id: 'smile',
    name: 'Smile',
    emoji: '😄',
    soloMsg: (s) => `😄 *@${s}* gave a bright, cheerful smile! 🌟`,
    targetMsg: (s, t) => `😄 *@${s}* smiled warmly at *@${t}*! 💫`,
    fallbackGifs: [
      'https://nekos.best/api/v2/smile/01.gif',
      'https://media.tenor.com/D_bTjI6_4b4AAAAC/anime-smile.gif'
    ]
  },
  wave: {
    id: 'wave',
    name: 'Wave',
    emoji: '👋',
    soloMsg: (s) => `👋 *@${s}* waves happily at everyone! 🌸`,
    targetMsg: (s, t) => `👋 *@${s}* waved warmly to *@${t}*! "Hello!" 🌸`,
    fallbackGifs: [
      'https://nekos.best/api/v2/wave/01.gif',
      'https://media.tenor.com/a9775R7z9Z4AAAAC/anime-wave.gif'
    ]
  },
  highfive: {
    id: 'highfive',
    name: 'Highfive',
    emoji: '🙌',
    soloMsg: (s) => `🙌 *@${s}* puts both hands up! 💥`,
    targetMsg: (s, t) => `🙌 *@${s}* gave an epic high-five to *@${t}*! ⚡`,
    fallbackGifs: [
      'https://nekos.best/api/v2/highfive/01.gif',
      'https://media.tenor.com/wU0_xY4Z_34AAAAC/high-five.gif'
    ]
  },
  wink: {
    id: 'wink',
    name: 'Wink',
    emoji: '😉',
    soloMsg: (s) => `😉 *@${s}* gave a cheeky wink! ✨`,
    targetMsg: (s, t) => `😉 *@${s}* winked charmingly at *@${t}*! 💖`,
    fallbackGifs: [
      'https://nekos.best/api/v2/wink/01.gif',
      'https://media.tenor.com/vH9j2R6v1kYAAAAC/anime-wink.gif'
    ]
  },
  tickle: {
    id: 'tickle',
    name: 'Tickle',
    emoji: '😆',
    soloMsg: (s) => `😆 *@${s}* giggles uncontrollably! 🤣`,
    targetMsg: (s, t) => `🤣 *@${s}* tickled *@${t}* into tears of laughter! 😆`,
    fallbackGifs: [
      'https://nekos.best/api/v2/tickle/01.gif',
      'https://media.tenor.com/7xQ2o48v2iMAAAAC/anime-tickle.gif'
    ]
  },
  bonk: {
    id: 'bonk',
    name: 'Bonk',
    emoji: '🔨',
    soloMsg: (s) => `🔨 *@${s}* bonked their own head! 🤕`,
    targetMsg: (s, t) => `🔨 *@${s}* delivered a heavy BONK to *@${t}*! Go to jail! 🚨`,
    fallbackGifs: [
      'https://media.tenor.com/FwK978xPz-kAAAAC/anime-bonk.gif',
      'https://media.tenor.com/J_uF4xL6_9gAAAAC/bonk-doge.gif'
    ]
  }
};

const OTAKU_ACTION_MAP: Record<string, string> = {
  hug: 'hug',
  kiss: 'kiss',
  slap: 'slap',
  pat: 'pat',
  cuddle: 'cuddle',
  punch: 'punch',
  cry: 'cry',
  kill: 'smack',
  dance: 'dance',
  bite: 'bite',
  poke: 'poke',
  blush: 'blush',
  smile: 'smile',
  wave: 'wave',
  highfive: 'celebrate',
  wink: 'wink',
  tickle: 'tickle',
  bonk: 'slap'
};

const reactionBufferCache = new Map<string, Buffer>();

export async function getReactionMediaUrl(actionId: string): Promise<string> {
  const action = REACTION_ACTIONS[actionId] || REACTION_ACTIONS.hug;
  const otakuAction = OTAKU_ACTION_MAP[actionId] || actionId;

  // 1. Try otakugifs.xyz (High-speed, verified anime reaction gifs)
  try {
    const res = await axios.get(`https://api.otakugifs.xyz/gif?reaction=${otakuAction}`, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      }
    });
    if (res.data && res.data.url && typeof res.data.url === 'string' && res.data.url.startsWith('http')) {
      return res.data.url;
    }
  } catch (e) {}

  // 2. Fallback to curated high-quality GIFs
  const pick = action.fallbackGifs && action.fallbackGifs.length > 0
    ? action.fallbackGifs[Math.floor(Math.random() * action.fallbackGifs.length)]
    : `https://cdn.otakugifs.xyz/gifs/${otakuAction}/default.gif`;

  return pick;
}

export async function fetchMediaBuffer(url: string, timeoutMs: number = 6000): Promise<Buffer | null> {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return null;
  try {
    const cleanUrl = url.trim().replace(/&amp;/g, '&');
    const res = await axios.get(cleanUrl, {
      responseType: 'arraybuffer',
      timeout: timeoutMs,
      maxContentLength: 25 * 1024 * 1024,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/png,image/jpeg,image/*,*/*;q=0.8',
        'Referer': 'https://www.bing.com/'
      }
    });

    if (res.data && res.data.byteLength > 2000) {
      const buf = Buffer.from(res.data);
      // Validate magic bytes for common image types (JPEG, PNG, WEBP, GIF, BMP) or media
      const isJpeg = buf[0] === 0xFF && buf[1] === 0xD8;
      const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
      const isWebp = buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP';
      const isGif = buf.slice(0, 3).toString('ascii') === 'GIF';
      const isMp4 = buf.slice(4, 8).toString('ascii') === 'ftyp' || buf.slice(0, 4).toString('ascii') === 'moov';

      // Check if it's an HTML error page disguised as 200 OK
      const isHtml = buf.slice(0, 60).toString('utf-8').toLowerCase().includes('<!doctype') || 
                     buf.slice(0, 60).toString('utf-8').toLowerCase().includes('<html');

      if (!isHtml && (isJpeg || isPng || isWebp || isGif || isMp4 || buf.length > 5000)) {
        return buf;
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

export async function convertGifToMp4(gifBuffer: Buffer): Promise<Buffer | null> {
  const tmpId = 'gif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  const inPath = path.join(os.tmpdir(), `${tmpId}.gif`);
  const outPath = path.join(os.tmpdir(), `${tmpId}.mp4`);

  try {
    await fs.promises.writeFile(inPath, gifBuffer);
    await new Promise<void>((resolve, reject) => {
      exec(
        `ffmpeg -y -i "${inPath}" -movflags +faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -preset ultrafast -profile:v baseline -level 3.0 -an "${outPath}"`,
        { timeout: 15000 },
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    if (fs.existsSync(outPath)) {
      const mp4Buf = await fs.promises.readFile(outPath);
      if (mp4Buf && mp4Buf.length > 1000) {
        return mp4Buf;
      }
    }
  } catch (e) {
  } finally {
    try { if (fs.existsSync(inPath)) fs.unlinkSync(inPath); } catch {}
    try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch {}
  }
  return null;
}

/**
 * Guaranteed to return an animated MP4 Buffer for WhatsApp GIF Playback
 */
export async function getGuaranteedReactionVideo(actionId: string): Promise<Buffer | null> {
  const cached = reactionBufferCache.get(actionId);
  if (cached && cached.length > 2000) {
    // Return cached in background while refreshing occasionally
    return cached;
  }

  try {
    const url = await getReactionMediaUrl(actionId);
    const rawBuf = await fetchMediaBuffer(url);
    if (rawBuf) {
      // Check if already MP4
      if (rawBuf.subarray(4, 8).toString() === 'ftyp') {
        reactionBufferCache.set(actionId, rawBuf);
        return rawBuf;
      }
      const converted = await convertGifToMp4(rawBuf);
      if (converted) {
        reactionBufferCache.set(actionId, converted);
        return converted;
      }
    }
  } catch (e) {}

  // Fallback direct URL attempt
  const fallbackList = REACTION_ACTIONS[actionId]?.fallbackGifs || [
    'https://media.tenor.com/kCZ9T3stnnMAAAAC/hug-anime.gif'
  ];

  for (const fUrl of fallbackList) {
    try {
      const fBuf = await fetchMediaBuffer(fUrl);
      if (fBuf) {
        const cBuf = await convertGifToMp4(fBuf);
        if (cBuf) {
          reactionBufferCache.set(actionId, cBuf);
          return cBuf;
        }
      }
    } catch (e) {}
  }

  return null;
}
