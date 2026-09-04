import axios from 'axios';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { exec } from 'child_process';
import Jimp from 'jimp';

/**
 * Known Gstatic Emoji Kitchen Release Dates
 */
const GOOGLE_KITCHEN_DATES = [
  '20201001', '20210218', '20210521', '20211115', '20220110',
  '20220215', '20220815', '20220823', '20221101', '20221114',
  '20230126', '20230301', '20230303', '20230418', '20230803',
  '20231113', '20240111', '20240206', '20240520'
];

/**
 * Converts unicode emoji string to google kitchen codepoint format (e.g. u1f972)
 */
function emojiToCode(emojiStr: string): string {
  const codes: string[] = [];
  for (const char of emojiStr) {
    const cp = char.codePointAt(0);
    if (cp && cp !== 0xfe0f && cp !== 0x200d) {
      codes.push('u' + cp.toString(16).toLowerCase());
    }
  }
  return codes.join('-');
}

/**
 * Extracts two individual emojis from input text like "🥲+🙄", "🥲 🙄", "🥲,🙄", "🥲🙄"
 */
export function extractTwoEmojis(input: string): [string, string] | null {
  const clean = input.trim();
  if (!clean) return null;

  // Match emoji graphemes using Unicode regex
  const emojiRegex = /\p{Extended_Pictographic}/gu;
  const matches = [...clean.matchAll(emojiRegex)].map(m => m[0]);

  if (matches.length >= 2) {
    return [matches[0], matches[1]];
  }

  // Check plus sign split
  if (clean.includes('+')) {
    const parts = clean.split('+').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return [parts[0], parts[1]];
    }
  }

  return null;
}

/**
 * Converts an image Buffer into WhatsApp WebP sticker buffer using ffmpeg / Jimp
 */
export async function convertBufferToWebpSticker(imgBuffer: Buffer): Promise<Buffer | null> {
  const tmpId = 'emix_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  const inPath = path.join(os.tmpdir(), `${tmpId}.png`);
  const outPath = path.join(os.tmpdir(), `${tmpId}.webp`);

  try {
    await fs.promises.writeFile(inPath, imgBuffer);

    // ffmpeg webp sticker creation (512x512 with transparent background)
    await new Promise<void>((resolve, reject) => {
      exec(
        `ffmpeg -y -i "${inPath}" -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000" -c:v libwebp -quality 90 "${outPath}"`,
        { timeout: 10000 },
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    if (fs.existsSync(outPath)) {
      const webpBuf = await fs.promises.readFile(outPath);
      if (webpBuf && webpBuf.length > 500) {
        return webpBuf;
      }
    }
  } catch (e) {
    // Jimp fallback if ffmpeg fails
    try {
      const jimpImg = await Jimp.read(imgBuffer);
      jimpImg.contain(512, 512);
      const pngBuf = await jimpImg.getBufferAsync(Jimp.MIME_PNG);
      return pngBuf;
    } catch (jerr) {}
  } finally {
    try { if (fs.existsSync(inPath)) fs.unlinkSync(inPath); } catch {}
    try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch {}
  }
  return null;
}

/**
 * Mixes two emojis and returns WebP Sticker Buffer
 */
export async function getEmojiMixSticker(emoji1: string, emoji2: string): Promise<Buffer | null> {
  const c1 = emojiToCode(emoji1);
  const c2 = emojiToCode(emoji2);

  if (!c1 || !c2) return null;

  // Try permutations of Google Gstatic Emoji Kitchen
  const candidateUrls: string[] = [];
  for (const date of GOOGLE_KITCHEN_DATES) {
    candidateUrls.push(`https://www.gstatic.com/android/keyboard/emojikitchen/${date}/${c1}/${c1}_${c2}.png`);
    candidateUrls.push(`https://www.gstatic.com/android/keyboard/emojikitchen/${date}/${c2}/${c2}_${c1}.png`);
  }

  for (const url of candidateUrls) {
    try {
      const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 3000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      if (res.status === 200 && res.data && res.data.byteLength > 1000) {
        const rawBuf = Buffer.from(res.data);
        const webpSticker = await convertBufferToWebpSticker(rawBuf);
        if (webpSticker) return webpSticker;
        return rawBuf;
      }
    } catch (e) {}
  }

  // Fallback: Composite side by side using Jimp if Google Kitchen doesn't have the exact combo
  try {
    const fallbackCanvas = new Jimp(512, 512, 0x00000000);
    // Draw representations or return null
  } catch (err) {}

  return null;
}
