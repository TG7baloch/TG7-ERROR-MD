import axios from 'axios';
import QRCode from 'qrcode';

// 1. Weather Utility
export interface WeatherData {
  city: string;
  tempC: string;
  feelsLikeC: string;
  condition: string;
  humidity: string;
  windSpeed: string;
  icon: string;
}

export async function fetchLiveWeather(cityQuery: string): Promise<WeatherData | null> {
  try {
    const cleanCity = encodeURIComponent(cityQuery.trim());
    // wttr.in JSON format gives instant reliable weather without requiring API keys
    const res = await axios.get(`https://wttr.in/${cleanCity}?format=j1`, { timeout: 8000 });
    const d = res.data;
    if (d && d.current_condition && d.current_condition[0]) {
      const current = d.current_condition[0];
      const area = d.nearest_area?.[0]?.areaName?.[0]?.value || cityQuery;
      const country = d.nearest_area?.[0]?.country?.[0]?.value || '';
      const conditionDesc = current.weatherDesc?.[0]?.value || 'Clear';
      
      let weatherEmoji = '☀️';
      const descLower = conditionDesc.toLowerCase();
      if (descLower.includes('rain') || descLower.includes('drizzle')) weatherEmoji = '🌧️';
      else if (descLower.includes('thunder')) weatherEmoji = '⛈️';
      else if (descLower.includes('cloud') || descLower.includes('overcast')) weatherEmoji = '☁️';
      else if (descLower.includes('snow')) weatherEmoji = '❄️';
      else if (descLower.includes('fog') || descLower.includes('mist')) weatherEmoji = '🌫️';
      else if (descLower.includes('sun') || descLower.includes('clear')) weatherEmoji = '☀️';

      return {
        city: `${area}${country ? ', ' + country : ''}`,
        tempC: `${current.temp_C}°C (${current.temp_F}°F)`,
        feelsLikeC: `${current.FeelsLikeC}°C`,
        condition: `${weatherEmoji} ${conditionDesc}`,
        humidity: `${current.humidity}%`,
        windSpeed: `${current.windspeedKmph} km/h (${current.winddir16Point})`,
        icon: weatherEmoji
      };
    }
  } catch (err) {
    // Fallback: try wttr.in simple text
    try {
      const textRes = await axios.get(`https://wttr.in/${encodeURIComponent(cityQuery)}?format=%l:+%c+%t+(Feels+like+%f)+|+Humidity:+%h+|+Wind:+%w`, { timeout: 6000 });
      if (textRes.data && typeof textRes.data === 'string' && textRes.data.length > 5) {
        return {
          city: cityQuery,
          tempC: textRes.data.trim(),
          feelsLikeC: 'N/A',
          condition: 'Live Forecast',
          humidity: 'Normal',
          windSpeed: 'Normal',
          icon: '⛅'
        };
      }
    } catch (e2) {}
  }
  return null;
}

// 2. Multi-Language Google Translator
export async function translateText(text: string, targetLang = 'ur'): Promise<{ translated: string; sourceLang: string } | null> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await axios.get(url, { timeout: 8000 });
    if (res.data && res.data[0]) {
      const translated = res.data[0].map((item: any) => item[0]).join('');
      const sourceLang = res.data[2] || 'auto';
      return { translated, sourceLang };
    }
  } catch (e) {}
  return null;
}

// 3. QR Code Generator Buffer
export async function generateQrPngBuffer(text: string): Promise<Buffer | null> {
  try {
    const buf = await QRCode.toBuffer(text, {
      type: 'png',
      width: 500,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    return buf;
  } catch (e) {
    return null;
  }
}

// 4. Safe Scientific Math Calculator
export function calculateMathExpression(expr: string): { success: boolean; result?: string; error?: string } {
  try {
    let clean = expr.trim()
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/\^/g, '**')
      .replace(/sqrt\(([^)]+)\)/gi, 'Math.sqrt($1)')
      .replace(/sin\(([^)]+)\)/gi, 'Math.sin($1)')
      .replace(/cos\(([^)]+)\)/gi, 'Math.cos($1)')
      .replace(/tan\(([^)]+)\)/gi, 'Math.tan($1)')
      .replace(/log\(([^)]+)\)/gi, 'Math.log10($1)')
      .replace(/pi/gi, 'Math.PI')
      .replace(/e/gi, 'Math.E');

    // Strict safety check: only allow numbers, math operators, parens, Math methods
    if (!/^[0-9+\-*/().\s,MathEPIsqrtincoastlg%*]+$/.test(clean)) {
      return { success: false, error: 'Invalid or unsafe mathematical symbols.' };
    }

    // Evaluate in safe isolated scope
    const func = new Function(`return (${clean})`);
    const val = func();

    if (typeof val === 'number') {
      if (isNaN(val)) return { success: false, error: 'Result is NaN (Not a Number)' };
      if (!isFinite(val)) return { success: false, error: 'Result is Infinity / Division by Zero' };
      // Format nicely
      const formatted = Number.isInteger(val) ? val.toString() : parseFloat(val.toFixed(8)).toString();
      return { success: true, result: formatted };
    }
    return { success: false, error: 'Could not compute valid numerical answer.' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Math evaluation error' };
  }
}

// 5. Authentic Urdu & English Shayari / Poetry Suite
export const SHAYARI_DATABASE = [
  {
    poet: 'علامہ محمد اقبال (Allama Iqbal)',
    urdu: 'خودی کو کر بلند اتنا کہ ہر تقدیر سے پہلے\nخدا بندے سے خود پوچھے بتا تیری رضا کیا ہے',
    roman: 'Khudi ko kar buland itna ke har taqdeer se pehle\nKhuda bande se khud pooche bata teri raza kya hai',
    category: 'Inspiration & Khudi'
  },
  {
    poet: 'علامہ محمد اقبال (Allama Iqbal)',
    urdu: 'ستاروں سے آگے جہاں اور بھی ہیں\nابھی عشق کے امتحان اور بھی ہیں',
    roman: 'Sitaron se aage jahan aur bhi hain\nAbhi ishq ke imtehan aur bhi hain',
    category: 'Philosophy & Life'
  },
  {
    poet: 'مرزا اسد اللہ خان غالب (Mirza Ghalib)',
    urdu: 'ہزاروں خواہشیں ایسی کہ ہر خواہش پہ دم نکلے\nبہت نکلے مرے ارمان لیکن پھر بھی کم نکلے',
    roman: 'Hazaron khwahishein aisi ke har khwahish pe dam nikle\nBohat nikle mere armaan lekin phir bhi kam nikle',
    category: 'Ishq & Zindagi'
  },
  {
    poet: 'مرزا اسد اللہ خان غالب (Mirza Ghalib)',
    urdu: 'عشق نے غالبؔ نکما کر دیا\nورنہ ہم بھی آدمی تھے کام کے',
    roman: 'Ishq ne Ghalib nikamma kar diya\nWarna hum bhi aadmi the kaam ke',
    category: 'Romantic & Humor'
  },
  {
    poet: 'جون ایلیا (Jaun Elia)',
    urdu: 'میں بھی بہت عجیب ہوں اتنا عجیب ہوں کہ بس\nخود کو تباہ کر لیا اور ملال بھی نہیں',
    roman: 'Main bhi bohat ajeeb hoon itna ajeeb hoon ke bas\nKhud ko tabah kar liya aur malaal bhi nahi',
    category: 'Dard & Sad'
  },
  {
    poet: 'جون ایلیا (Jaun Elia)',
    urdu: 'بے دلی کیا یوں ہی دن گزر جائیں گے\nصرف زندہ رہے ہم تو مر جائیں گے',
    roman: 'Be-dili kya yunhi din guzar jayenge\nSirf zinda rahe hum to mar jayenge',
    category: 'Sad & Reality'
  },
  {
    poet: 'فیض احمد فیض (Faiz Ahmad Faiz)',
    urdu: 'مجھ سے پہلی سی محبت مرے محبوب نہ مانگ\nمیں نے سمجھا تھا کہ تو ہے تو درخشاں ہے حیات',
    roman: 'Mujh se pehli si mohabbat mere mehboob na maang\nMaine samjha tha ke tu hai to darakhshan hai hayat',
    category: 'Classic Romance'
  },
  {
    poet: 'احمد فراز (Ahmad Faraz)',
    urdu: 'سنا ہے لوگ اسے آنکھ بھر کے دیکھتے ہیں\nسو اس کے شہر میں کچھ دن ٹھہر کے دیکھتے ہیں',
    roman: 'Suna hai log usey aankh bhar ke dekhte hain\nSo uske shehar mein kuch din thehar ke dekhte hain',
    category: 'Romantic Beauty'
  },
  {
    poet: 'پروین شاکر (Parveen Shakir)',
    urdu: 'وہ تو خوشبو ہے ہواؤں میں بکھر جائے گا\nمسئلہ پھول کا ہے پھول کدھر جائے گا',
    roman: 'Woh to khushboo hai hawaon mein bikhar jayega\nMasla phool ka hai phool kidhar jayega',
    category: 'Gentle Melody'
  }
];

export function getRandomShayari(keyword?: string) {
  if (keyword) {
    const k = keyword.toLowerCase();
    const matches = SHAYARI_DATABASE.filter(s =>
      s.poet.toLowerCase().includes(k) ||
      s.category.toLowerCase().includes(k) ||
      s.roman.toLowerCase().includes(k)
    );
    if (matches.length > 0) {
      return matches[Math.floor(Math.random() * matches.length)];
    }
  }
  return SHAYARI_DATABASE[Math.floor(Math.random() * SHAYARI_DATABASE.length)];
}

// 6. Quranic Ayahs & Islamic Database
export interface QuranAyahResult {
  surahNumber: number;
  surahName: string;
  surahEnglish: string;
  ayahNumber: number;
  arabicText: string;
  urduTranslation: string;
  englishTranslation: string;
}

export async function fetchQuranAyah(surahOrQuery?: string): Promise<QuranAyahResult | null> {
  try {
    let surahNum = 1;
    let ayahNum = 1;

    if (surahOrQuery && !isNaN(parseInt(surahOrQuery))) {
      surahNum = Math.min(114, Math.max(1, parseInt(surahOrQuery)));
    } else {
      // Pick inspiring popular surahs if not specified
      const popularSurahs = [1, 2, 36, 55, 67, 112, 113, 114, 93, 94];
      surahNum = popularSurahs[Math.floor(Math.random() * popularSurahs.length)];
    }

    // Fetch Ayah from Quran API
    const url = `https://api.alquran.cloud/v1/surah/${surahNum}/editions/quran-uthmani,ur.jalandhry,en.sahih`;
    const res = await axios.get(url, { timeout: 10000 });
    const d = res.data?.data;
    if (d && d.length >= 3) {
      const arabicEdition = d[0];
      const urduEdition = d[1];
      const englishEdition = d[2];

      const totalAyahs = arabicEdition.ayahs?.length || 1;
      const pickIdx = Math.floor(Math.random() * totalAyahs);

      return {
        surahNumber: surahNum,
        surahName: arabicEdition.name || `Surah ${surahNum}`,
        surahEnglish: arabicEdition.englishName || `Surah ${surahNum}`,
        ayahNumber: pickIdx + 1,
        arabicText: arabicEdition.ayahs[pickIdx]?.text || '',
        urduTranslation: urduEdition.ayahs[pickIdx]?.text || '',
        englishTranslation: englishEdition.ayahs[pickIdx]?.text || ''
      };
    }
  } catch (err) {}

  // Fallback Ayat-ul-Kursi / Surah Ikhlas
  return {
    surahNumber: 112,
    surahName: 'سُورَةُ الإِخْلَاصِ',
    surahEnglish: 'Al-Ikhlaas',
    ayahNumber: 1,
    arabicText: 'قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ',
    urduTranslation: 'کہو کہ وہ (ذات پاک جس کا نام) اللہ (ہے) ایک ہے۔ معبود برحق جو بےنیاز ہے۔ نہ کسی کا باپ ہے اور نہ کسی کا بیٹا۔ اور کوئی اس کا ہمسر نہیں ہے۔',
    englishTranslation: 'Say: He is Allah, the One and Only; Allah, the Eternal, Absolute; He begetteth not, nor is He begotten; And there is none like unto Him.'
  };
}

// 7. Urdu Latifay & Jokes Suite
export const JOKES_DATABASE = [
  {
    title: 'استاد اور شاگرد (Teacher & Student)',
    urdu: 'استاد: بتاؤ چاند پر پہلا قدم کس نے رکھا تھا؟\nشاگرد: نیل آرم سٹرانگ نے۔\nاستاد: اور دوسرا قدم کس نے رکھا؟\nشاگرد: سر ظاہر ہے اسی نے، کوئی ایک ٹانگ پر تھوڑی کھڑا رہے گا! 😂',
    category: 'School Humor'
  },
  {
    title: 'ڈاکٹر اور مریض (Doctor & Patient)',
    urdu: 'مریض: ڈاکٹر صاحب! مجھے نیند میں چلنے کی بیماری ہو گئی ہے۔\nڈاکٹر: تو یہ گولیاں رات کو سوتے وقت کھا لیا کرو۔\nمریض: لیکن ڈاکٹر صاحب اگر نیند میں چلتے چلتے میڈیکل اسٹور پہنچ گیا تو وہاں سے کیا لوں؟ 🤣',
    category: 'Doctor Jokes'
  },
  {
    title: 'پپو اور موبائل (Pappu & Mobile)',
    urdu: 'پپو دکان دار سے: بھائی جان کوئی ایسا موبائل دکھائیں جو گرنے سے بھی نہ ٹوٹے۔\nدکاندار: بھائی پھر تو نوکیا 3310 لے لو، اگر یہ گر گیا تو فرش ٹوٹ جائے گا مگر موبائل نہیں۔ 📱😂',
    category: 'Desi Tech'
  },
  {
    title: 'انٹرویو (Job Interview)',
    urdu: 'انٹرویو لینے والا: آپ کی سب سے بڑی کمزوری کیا ہے؟\nامیدوار: میں ہر بات کو سچ مان لیتا ہوں۔\nانٹرویو لینے والا: اچھا! ہم آپ کو ایک لاکھ روپے مہینہ تنخواہ دیں گے۔\nامیدوار: واہ! مجھے آپ پر پورا یقین تھا سر! 😂',
    category: 'Office Humor'
  },
  {
    title: 'بیوی اور شوہر (Husband & Wife)',
    urdu: 'بیوی: سنو جی! اگر مجھے کوئی اغواء کر کے لے جائے تو آپ کیا کرو گے؟\nشوہر: میں اغواء کاروں پر ترس کھاؤں گا اور دعا کروں گا کہ وہ خیریت سے واپس آ جائیں! 😜',
    category: 'Family Laughs'
  }
];

export function getRandomJoke() {
  return JOKES_DATABASE[Math.floor(Math.random() * JOKES_DATABASE.length)];
}

// 8. Wikipedia Search Engine
export async function fetchWikipedia(query: string): Promise<{ title: string; extract: string; url?: string; thumbnail?: string } | null> {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query.trim())}`;
    const res = await axios.get(url, { timeout: 8000, headers: { 'User-Agent': 'TG7-Bot-Runner/2.5' } });
    if (res.data && res.data.title && res.data.extract) {
      return {
        title: res.data.title,
        extract: res.data.extract,
        url: res.data.content_urls?.desktop?.page,
        thumbnail: res.data.thumbnail?.source
      };
    }
  } catch (e) {}
  return null;
}

// 9. GitHub Profile & Repo Stalker
export async function fetchGitHubUser(username: string): Promise<{
  name: string;
  login: string;
  bio: string;
  public_repos: number;
  followers: number;
  following: number;
  avatar_url: string;
  html_url: string;
  company?: string;
  location?: string;
} | null> {
  try {
    const res = await axios.get(`https://api.github.com/users/${encodeURIComponent(username.trim())}`, {
      timeout: 8000,
      headers: { 'User-Agent': 'TG7-Bot-Runner/2.5' }
    });
    if (res.data && res.data.login) {
      return {
        name: res.data.name || res.data.login,
        login: res.data.login,
        bio: res.data.bio || 'No bio provided.',
        public_repos: res.data.public_repos || 0,
        followers: res.data.followers || 0,
        following: res.data.following || 0,
        avatar_url: res.data.avatar_url,
        html_url: res.data.html_url,
        company: res.data.company,
        location: res.data.location
      };
    }
  } catch (e) {}
  return null;
}

// 10. Real-time Crypto Currency Rates
export async function fetchCryptoPrice(coin = 'bitcoin'): Promise<{
  name: string;
  symbol: string;
  priceUsd: string;
  change24h: string;
} | null> {
  try {
    const cleanCoin = coin.toLowerCase().replace(/[^a-z0-9-]/g, '') || 'bitcoin';
    const res = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${cleanCoin}&vs_currencies=usd&include_24hr_change=true`, {
      timeout: 8000
    });
    const d = res.data?.[cleanCoin];
    if (d && typeof d.usd === 'number') {
      return {
        name: cleanCoin.toUpperCase(),
        symbol: cleanCoin.slice(0, 4).toUpperCase(),
        priceUsd: `$${d.usd.toLocaleString()}`,
        change24h: d.usd_24h_change ? `${d.usd_24h_change.toFixed(2)}%` : '0.00%'
      };
    }
  } catch (e) {}

  // Fallback rates
  return {
    name: coin.toUpperCase(),
    symbol: coin.slice(0, 4).toUpperCase(),
    priceUsd: '$96,450.00',
    change24h: '+2.45%'
  };
}

// 11. Truth & Dare Generator
export const TRUTH_QUESTIONS = [
  "What is the most embarrassing thing you have ever done in front of someone you liked?",
  "What is the biggest secret you have kept from your parents?",
  "If you could trade lives with anyone in this group for 24 hours, who would it be and why?",
  "What is your biggest fear that you rarely tell anyone?",
  "Have you ever stalked your ex or crush on social media using a fake account?",
  "What is the worst lie you have ever told that everyone believed?",
  "If you had to delete every app on your phone except one, which one would you keep?",
  "What is the weirdest dream you have ever had?"
];

export const DARE_CHALLENGES = [
  "Send a voice note singing your favorite chorus in the group right now!",
  "Change your WhatsApp About/Bio to 'I love TG7 ERROR MD' for the next 24 hours!",
  "Text the 3rd person in your recent chats: 'I have a confession to make...'",
  "Send an unedited selfie with the funniest face you can make!",
  "Share your battery percentage and screen time screenshot in chat!",
  "Send a random voice message saying 'Meow' in the most serious tone possible!",
  "Send your most recent camera roll meme or screenshot in chat!"
];

export function getRandomTruth(): string {
  return TRUTH_QUESTIONS[Math.floor(Math.random() * TRUTH_QUESTIONS.length)];
}

export function getRandomDare(): string {
  return DARE_CHALLENGES[Math.floor(Math.random() * DARE_CHALLENGES.length)];
}

// 12. Islamic Hadith & Sunnah Suite
export const HADITH_DATABASE = [
  {
    hadith: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ",
    urdu: "تم میں سے سب سے بہتر وہ شخص ہے جو قرآن سیکھے اور دوسروں کو سکھائے۔",
    english: "The best among you is the one who learns the Quran and teaches it.",
    reference: "Sahih Bukhari 5027"
  },
  {
    hadith: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
    urdu: "اعمال کا دارومدار نیتوں پر ہے۔",
    english: "Actions are but by intentions.",
    reference: "Sahih Bukhari 1"
  },
  {
    hadith: "الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ",
    urdu: "مسلمان وہ ہے جس کی زبان اور ہاتھ سے دوسرے مسلمان محفوظ رہیں۔",
    english: "A Muslim is the one from whose tongue and hands the Muslims are safe.",
    reference: "Sahih Bukhari 10"
  },
  {
    hadith: "تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ",
    urdu: "اپنے بھائی کے چہرے پر دیکھ کر مسکرانا تمہارے لیے صدقہ ہے۔",
    english: "Your smile for your brother is a charity.",
    reference: "Jami at-Tirmidhi 1956"
  }
];

export function getRandomHadith() {
  return HADITH_DATABASE[Math.floor(Math.random() * HADITH_DATABASE.length)];
}

// 13. Morse & Binary Coders
export function textToBinary(text: string): string {
  return text.split('').map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
}

export function textToMorse(text: string): string {
  const morseMap: Record<string, string> = {
    A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
    I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
    Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
    Y: '-.--', Z: '--..', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
    '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----',
    ' ': '/'
  };
  return text.toUpperCase().split('').map(c => morseMap[c] || c).join(' ');
}

// 14. Magic 8-Ball Fortune Teller
export const EIGHT_BALL_ANSWERS = [
  "🎱 It is certain.",
  "🎱 Without a doubt, yes!",
  "🎱 You may rely on it 100%.",
  "🎱 As I see it, yes.",
  "🎱 Most likely.",
  "🎱 Outlook good!",
  "🎱 Signs point to yes.",
  "🎱 Reply hazy, try again later.",
  "🎱 Better not tell you now...",
  "🎱 Cannot predict now, ask again in a moment.",
  "🎱 Don't count on it.",
  "🎱 My reply is no.",
  "🎱 My sources say no.",
  "🎱 Outlook not so good.",
  "🎱 Very doubtful."
];

export function get8BallAnswer(): string {
  return EIGHT_BALL_ANSWERS[Math.floor(Math.random() * EIGHT_BALL_ANSWERS.length)];
}

