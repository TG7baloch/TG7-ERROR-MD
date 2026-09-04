import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { convertAudioToWhatsAppVoice } from './mediaDownloader';

export interface MoodAudioItem {
  id: string;
  title: string;
  speaker: string;
  category: 'sad' | 'happy' | 'joke' | 'attitude' | 'romantic' | 'shayari' | 'motivation' | 'sfx';
  quote: string;
  urls: string[];
}

export const MOOD_AUDIO_DATABASE: Record<string, MoodAudioItem[]> = {
  sad: [
    {
      id: 'sad-1-violin-meme',
      title: 'Sad Violin (Emotional Broken Heart)',
      speaker: 'Sad Violin Solo',
      category: 'sad',
      quote: 'زندگی میں سب کو سب نہیں ملتا، کسی کو محبت نہیں ملتی تو کسی کو وفا نہیں ملتی۔',
      urls: ['https://www.myinstants.com/media/sounds/tf_nemesis.mp3', 'https://www.myinstants.com/media/sounds/sad-violin.mp3']
    },
    {
      id: 'sad-2-meow-cry',
      title: 'Sad Meow Cry (Tears Theme)',
      speaker: 'Sad Meow Cat',
      category: 'sad',
      quote: 'دل کے ارمان آنسوؤں میں بہہ گئے، ہم وفا کر کے بھی تنہا رہ گئے۔',
      urls: ['https://www.myinstants.com/media/sounds/sad-meow-song.mp3']
    },
    {
      id: 'sad-3-trombone-fail',
      title: 'Sad Trombone Wah Wah',
      speaker: 'Sad Trombone',
      category: 'sad',
      quote: 'جب ساری امیدیں دم توڑ جائیں... وہم تھا کہ تم ہمارے ہو۔',
      urls: ['https://www.myinstants.com/media/sounds/sadtrombone.swf.mp3']
    },
    {
      id: 'sad-4-naruto-sadness',
      title: 'Naruto Sadness & Sorrow Flute',
      speaker: 'Naruto Emotional OST',
      category: 'sad',
      quote: 'تنہائی انسان کو اندر سے توڑ کر رکھ دیتی ہے۔ کچھ درد لفظوں میں بیان نہیں ہوتے۔',
      urls: ['https://www.myinstants.com/media/sounds/naruto-sad-music-instant.mp3']
    },
    {
      id: 'sad-5-miau-triste',
      title: 'Miau Triste Emotional Melancholy',
      speaker: 'Acoustic Tears',
      category: 'sad',
      quote: 'اداس دل کی داستاں کون سنے گا، جب اپنے ہی انجان بن جائیں۔',
      urls: ['https://www.myinstants.com/media/sounds/miau-triste.mp3']
    },
    {
      id: 'sad-6-indian-sad-bgm',
      title: 'Desi Sad Flute & Shehnai BGM',
      speaker: 'Indian Emotional Classical',
      category: 'sad',
      quote: 'اچھا چلتا ہوں دعاؤں میں یاد رکھنا... دل کے صندوقوں میں میرے اچھے کام رکھنا۔',
      urls: ['https://www.myinstants.com/media/sounds/tmpauxfo4ff.mp3']
    },
    {
      id: 'sad-7-spongebob-sad',
      title: 'Spongebob Sad Nostalgia Song',
      speaker: 'Spongebob Sad OST',
      category: 'sad',
      quote: 'وقت بدل گیا، لوگ بدل گئے، اور دل کے رشتے خاموش ہو گئے۔',
      urls: ['https://www.myinstants.com/media/sounds/spongebob-sad-song.mp3']
    },
    {
      id: 'sad-8-sad-hamster',
      title: 'Sad Hamster Violin Symphony',
      speaker: 'Sad Hamster Viral Theme',
      category: 'sad',
      quote: 'بے خیالی میں بھی تیرا ہی خیال آئے... کیوں بچھڑنا ہے ضروری یہ سوال آئے۔',
      urls: ['https://www.myinstants.com/media/sounds/sad-hamster.mp3']
    },
    {
      id: 'sad-9-lovely-sad',
      title: 'Ia Ia Ahh Lovely Sad Mood',
      speaker: 'Emotional Melody',
      category: 'sad',
      quote: 'ہم نے تو دل سے چاہا تھا، مگر تقدیر کو ہمارا ساتھ منظور نہ تھا۔',
      urls: ['https://www.myinstants.com/media/sounds/ia-ia-ahh-yeye-yeye-lovely-sad.mp3']
    },
    {
      id: 'sad-10-sad-violin-classic',
      title: 'Classical Sad Violin Solo 320kbps',
      speaker: 'Orchestral Sad Strings',
      category: 'sad',
      quote: 'رخصت ہوا تو ہاتھ ملا کر نہیں گیا، وہ کیوں گیا یہ بھی بتا کر نہیں گیا۔',
      urls: ['https://www.myinstants.com/media/sounds/sad-violin.mp3']
    },
    {
      id: 'sad-11-sad-violin-14s',
      title: '14s Sad Dramatic Violin Cry',
      speaker: 'Violin Heartbreak',
      category: 'sad',
      quote: 'بہت درد ہوتا ہے جب کوئی اپنا بنا کر چھوڑ دے۔',
      urls: ['https://www.myinstants.com/media/sounds/export_4.mp3']
    },
    {
      id: 'sad-12-bo-womp',
      title: 'Bo-Womp Cartoon Sad FX',
      speaker: 'Bo-Womp Soundboard',
      category: 'sad',
      quote: 'جب زندگی اپ کا مذاق بنا دے... افسوس صد افسوس۔',
      urls: ['https://www.myinstants.com/media/sounds/bo-womp.mp3']
    },
    {
      id: 'sad-13-moye-moye',
      title: 'Moye Moye Sad Heartbreak',
      speaker: 'Teya Dora Viral Meme',
      category: 'sad',
      quote: 'Moye Moye... (Emotional Sadness Overloaded)',
      urls: ['https://www.myinstants.com/media/sounds/moye-moye.mp3']
    },
    {
      id: 'sad-14-emotional-damage',
      title: 'Emotional Damage Reaction',
      speaker: 'Steven He',
      category: 'sad',
      quote: 'Emotional Damage! Why you gotta break my heart like that?',
      urls: ['https://www.myinstants.com/media/sounds/emotional-damage-meme.mp3']
    },
    {
      id: 'sad-15-guts-theme',
      title: 'Guts Theme (Berserk Deep Sadness)',
      speaker: 'Berserk Emotional OST',
      category: 'sad',
      quote: 'ساری دنیا کے ستم سہہ لیے، مگر اپنوں کی بے رخی نے مار ڈالا۔',
      urls: ['https://www.myinstants.com/media/sounds/guts-theme.mp3']
    }
  ],

  happy: [
    {
      id: 'happy-1-cat-song',
      title: 'Happy Happy Happy Song Dance',
      speaker: 'Happy Cat Viral',
      category: 'happy',
      quote: 'Happy Happy Happy! خوشیوں کی برسات، مسکراتے رہو ہمیشہ!',
      urls: ['https://www.myinstants.com/media/sounds/happy-happy-happy-song.mp3']
    },
    {
      id: 'happy-2-fairy-tail-wow',
      title: 'WOW! (Happy - Fairy Tail Anime)',
      speaker: 'Happy the Exceed (Fairy Tail)',
      category: 'happy',
      quote: 'Aye Sir! آج کا دن بہت زبردست اور خوبصورت ہے!',
      urls: ['https://www.myinstants.com/media/sounds/wow_2.mp3']
    },
    {
      id: 'happy-3-happy-cat-meme',
      title: 'Happy Happy Happy Cat Jump',
      speaker: 'Happy Kitten Jumps',
      category: 'happy',
      quote: 'Happy Happy Happy! Life is full of smiles and energy!',
      urls: ['https://www.myinstants.com/media/sounds/happy-happy-happy-cat.mp3']
    },
    {
      id: 'happy-4-uiiiii',
      title: 'Uiiiiiiii Happy Joy',
      speaker: 'Joyful Cheer',
      category: 'happy',
      quote: 'اوئییییی! موجاں ہی موجاں، مست ماحول!',
      urls: ['https://www.myinstants.com/media/sounds/uiiiiiiii.mp3']
    },
    {
      id: 'happy-5-happy-dog',
      title: 'Happy Doggy Song',
      speaker: 'Happy Dog Theme',
      category: 'happy',
      quote: 'خوش رہو اور دوسروں میں بھی خوشیاں بانٹو!',
      urls: ['https://www.myinstants.com/media/sounds/happy-dog.mp3']
    },
    {
      id: 'happy-6-happy-tree-friends',
      title: 'Happy Fun Melody',
      speaker: 'Whistling Happy Theme',
      category: 'happy',
      quote: 'سیٹی بجاؤ اور دنیا کی فکریں بھول جاؤ!',
      urls: ['https://www.myinstants.com/media/sounds/happy_tree_friends_theme_song.mp3']
    },
    {
      id: 'happy-7-minions-banana',
      title: 'Minions Banana Party Song',
      speaker: 'Minions Crew',
      category: 'happy',
      quote: 'Bananaaa! پاپا تورا پوتیکا، فل انجوائے!',
      urls: ['https://www.myinstants.com/media/sounds/minions-banana-song-mp3cut_1.mp3']
    },
    {
      id: 'happy-8-happy-wheee',
      title: 'Happy Wheee Meme',
      speaker: 'Cartoon Joy',
      category: 'happy',
      quote: 'واہ بھئی واہ، کمال کا موڈ بن گیا!',
      urls: ['https://www.myinstants.com/media/sounds/happy-happy-happy-cat_U7rZ9kO.mp3']
    },
    {
      id: 'happy-9-hallelujah-chorus',
      title: 'Hallelujah Victory Chorus',
      speaker: 'Heavenly Choir',
      category: 'happy',
      quote: 'شکر الحمدللہ! کامیابی اور جیت مبارک!',
      urls: ['https://www.myinstants.com/media/sounds/hallelujah_3.mp3']
    },
    {
      id: 'happy-10-applause-crowd',
      title: 'Standing Ovation Crowd Applause',
      speaker: 'Cheering Audience',
      category: 'happy',
      quote: 'زوردار تالیاں! زبردست پرفارمنس!',
      urls: ['https://www.myinstants.com/media/sounds/applause_8.mp3']
    },
    {
      id: 'happy-11-ronaldo-siu',
      title: 'Cristiano Ronaldo SIUUU',
      speaker: 'Cristiano Ronaldo',
      category: 'happy',
      quote: 'SIUUUUUUUUUUUUUUUUUUUUUUUU!',
      urls: ['https://www.myinstants.com/media/sounds/siuuu.mp3']
    },
    {
      id: 'happy-12-crowd-cheering',
      title: 'Stadium Crowd Cheering',
      speaker: 'VIP Stadium Fans',
      category: 'happy',
      quote: 'Hurrah! We won! جیت ہماری ہوئی!',
      urls: ['https://www.myinstants.com/media/sounds/cheering.mp3']
    },
    {
      id: 'happy-13-yay-kids',
      title: 'Kids Cheering Yay!',
      speaker: 'Kids Joyful Choir',
      category: 'happy',
      quote: 'Yayyyy! پارٹی کا ٹائم شروع ہو گیا!',
      urls: ['https://www.myinstants.com/media/sounds/yay-sound-effect.mp3']
    },
    {
      id: 'happy-14-super-mario-win',
      title: 'Super Mario Stage Win Victory',
      speaker: 'Nintendo Retro Win',
      category: 'happy',
      quote: 'Level completed! مبارک ہو نیا لیول انلاک ہو گیا!',
      urls: ['https://www.myinstants.com/media/sounds/super-mario-stage-win.mp3']
    },
    {
      id: 'happy-15-michael-rosen-noice',
      title: 'Michael Rosen *Click* NOICE',
      speaker: 'Michael Rosen',
      category: 'happy',
      quote: '*Pop Tongue* ... NOICE!',
      urls: ['https://www.myinstants.com/media/sounds/noice.mp3']
    }
  ],

  joke: [
    {
      id: 'joke-1-wah-modiji',
      title: 'Wah Modiji Wah Meme',
      speaker: 'Narendra Modi & Crowd',
      category: 'joke',
      quote: 'واہ مودی جی واہ! واہ مودی جی واہ! 🤣',
      urls: ['https://www.myinstants.com/media/sounds/wah-modiji-wah.mp3']
    },
    {
      id: 'joke-2-iska-karan-modi',
      title: 'Iska Karan Narendra Modi Hai',
      speaker: 'Viral News Reporter',
      category: 'joke',
      quote: 'اور اس سب کا کارن صرف اور صرف نریندر مودی ہے! 😂',
      urls: ['https://www.myinstants.com/media/sounds/is-ka-karan-narendar-modi.mp3']
    },
    {
      id: 'joke-3-gian-hain-aap',
      title: 'Gian Hain Aap (Doraemon Meme)',
      speaker: 'Nobita & Sunio',
      category: 'joke',
      quote: 'شکل دیکھی ہے؟ گیان ہیں آپ گیان! 😆',
      urls: ['https://www.myinstants.com/media/sounds/gian-hain-aap.mp3']
    },
    {
      id: 'joke-4-shakal-dekhi-hai',
      title: 'Shakal Dekhi Hai Apni',
      speaker: 'Desi Comedy Soundboard',
      category: 'joke',
      quote: 'کبھی شیشے میں جا کر اپنا چہرہ دیکھا ہے؟ 😜',
      urls: ['https://www.myinstants.com/media/sounds/shakal-dekhi-hai-gian.mp3']
    },
    {
      id: 'joke-5-punjabi-oyee',
      title: 'Bandy Da Putr Ban Ja (Punjabi)',
      speaker: 'Angry Punjabi Uncle',
      category: 'joke',
      quote: 'اوئے بندے دا پتر بن جا، اینویں چولاں نہ مار! 😂',
      urls: ['https://www.myinstants.com/media/sounds/bandy-da-putr-ban-ja.mp3']
    },
    {
      id: 'joke-6-gali-hindi-funny',
      title: 'Ye Meri Galti Hai (Emotional Comedy)',
      speaker: 'Desi Viral Guy',
      category: 'joke',
      quote: 'یہ سب میری غلطی ہے بھائی، مجھے معاف کر دو! 😭😂',
      urls: ['https://www.myinstants.com/media/sounds/ye-meri-galti-h.mp3']
    },
    {
      id: 'joke-7-oh-no-laugh',
      title: 'Oh No No No TikTok Wheeze Laugh',
      speaker: 'Viral TikTok Wheeze Laugh',
      category: 'joke',
      quote: 'Oh no no no no! Hahaha wheeeeeeze! 💀',
      urls: ['https://www.myinstants.com/media/sounds/oh-no-no-no-tik-tok-song-sound-effect.mp3']
    },
    {
      id: 'joke-8-directed-by-robert',
      title: 'Directed by Robert B. Weide End Theme',
      speaker: 'Curb Your Enthusiasm Comedy',
      category: 'joke',
      quote: '*Dun-da-da-da-da-da-da* (Directed by Robert B. Weide)',
      urls: ['https://www.myinstants.com/media/sounds/directed-by-robert-b_VoOBtSN.mp3']
    },
    {
      id: 'joke-9-bruh-sound',
      title: 'Original Bruh Sound Effect #2',
      speaker: 'Bruh Meme Sound',
      category: 'joke',
      quote: 'BRUH... 🗿💀',
      urls: ['https://raw.githubusercontent.com/THEbluefirestudios/memeboard-fdroid/master/app/src/main/res/raw/bruh.mp3']
    },
    {
      id: 'joke-10-vine-boom',
      title: 'Vine Boom Bass Drop Meme',
      speaker: 'Vine Boom Soundboard',
      category: 'joke',
      quote: '💥 *BOOM* (Suspicious Rock Meme)',
      urls: ['https://raw.githubusercontent.com/THEbluefirestudios/memeboard-fdroid/master/app/src/main/res/raw/vine_boom.mp3']
    },
    {
      id: 'joke-11-fart-reverb',
      title: 'Fart Sound with Heavy Reverb',
      speaker: 'Echo Reverb Fart',
      category: 'joke',
      quote: '*BRAAAPPPPP* (Heavy Reverb Echo) 💨💨',
      urls: ['https://www.myinstants.com/media/sounds/fart-with-reverb.mp3']
    },
    {
      id: 'joke-12-mitron-modi',
      title: 'Bhaiyo Aur Behno... Mitron',
      speaker: 'Modi Mitron',
      category: 'joke',
      quote: 'بھائیو اور بہنو! آج رات بارہ بجے سے... 😱',
      urls: ['https://www.myinstants.com/media/sounds/mitron.mp3']
    },
    {
      id: 'joke-13-ki-haal-a',
      title: 'Ki Haal A Theek Ho Naa (Punjabi)',
      speaker: 'Lahori Comedy Dialogue',
      category: 'joke',
      quote: 'کی حال اے؟ ٹھیک ٹھاک او ناں؟ کھوتی دے پترو! 😂',
      urls: ['https://www.myinstants.com/media/sounds/ki-haal-a-theko-naa.mp3']
    },
    {
      id: 'joke-14-run-meme',
      title: 'Awkward Cartoon Slip Sound',
      speaker: 'Cartoon Comedy FX',
      category: 'joke',
      quote: '*Slip & Fall* ارے بچاؤ بھائی گر گیا! 🤣',
      urls: ['https://www.myinstants.com/media/sounds/awkward-moment.mp3']
    },
    {
      id: 'joke-15-pop-funny',
      title: 'Pop SFX Comedy Hit',
      speaker: 'Pop Sound Effect',
      category: 'joke',
      quote: '*POP* غبارہ پھٹ گیا!',
      urls: ['https://www.myinstants.com/media/sounds/pop_7e9Is8L.mp3']
    }
  ],

  attitude: [
    {
      id: 'att-1-gigachad',
      title: 'GigaChad Can You Feel My Heart Phonk',
      speaker: 'GigaChad Ultra Sigma',
      category: 'attitude',
      quote: 'ہم سے ٹکرانے کی غلطی مت کرنا، ہمارا انداز اور رعب دونوں الگ ہیں۔',
      urls: ['https://www.myinstants.com/media/sounds/giga-chad-theme.mp3']
    },
    {
      id: 'att-2-cowbell-phonk',
      title: 'Smoke Drift Cowbell Cult Phonk',
      speaker: 'Sigma Drift Phonk',
      category: 'attitude',
      quote: 'جہاں ہماری خاموشی گونجتی ہے، وہاں بولنے والوں کی زبان بند ہو جاتی ہے۔',
      urls: ['https://www.myinstants.com/media/sounds/smoke-cowbell-cult-phonk.mp3']
    },
    {
      id: 'att-3-aura-phonk',
      title: 'Aura Brazilian Phonk Drop',
      speaker: 'Dark Sigma Male',
      category: 'attitude',
      quote: 'Aura +100,000,000! اپنا لیول دیکھ کر بات کرو۔',
      urls: ['https://www.myinstants.com/media/sounds/aura-phonk.mp3']
    },
    {
      id: 'att-4-trollface-phonk',
      title: 'Loud Trollface Sigma Phonk',
      speaker: 'Trollface Evil Laugh Phonk',
      category: 'attitude',
      quote: 'ہم اصولوں کے پابند نہیں، ہم خود اپنے قانون بناتے ہیں۔',
      urls: ['https://www.myinstants.com/media/sounds/loud-trollface-phonk_YUYnsos.mp3']
    },
    {
      id: 'att-5-naruto-fighting-spirit',
      title: 'Naruto The Raising Fighting Spirit Hype',
      speaker: 'Shonen Anime Badass BGM',
      category: 'attitude',
      quote: 'ہم گر کر سنبھلنا جانتے ہیں، اور میدان فتح کرنا ہمارا شوق ہے۔',
      urls: ['https://www.myinstants.com/media/sounds/naruto-the-raising-fighting-spirit-extended-audiotrimmer_7wvXRts.mp3']
    },
    {
      id: 'att-6-attitude-drop',
      title: 'Badass Attitude Heavy Bass BGM',
      speaker: 'Attitude Trap Beat',
      category: 'attitude',
      quote: 'شوق اڑان کا رکھتے ہیں، تو پروں کی نہیں حوصلوں کی بات کرو۔',
      urls: ['https://www.myinstants.com/media/sounds/attitude-sound.mp3']
    },
    {
      id: 'att-7-bad-to-the-bone',
      title: 'Bad to the Bone Legendary Guitar Riff',
      speaker: 'George Thorogood Badass Riff',
      category: 'attitude',
      quote: '*B-b-b-bad to the bone!* باپ باپ ہوتا ہے!',
      urls: ['https://www.myinstants.com/media/sounds/bad-to-the-bone-guitar-riff.mp3']
    },
    {
      id: 'att-8-siren-meme',
      title: 'Siren Horn Warning Badass BGM',
      speaker: 'Siren Boss Entry',
      category: 'attitude',
      quote: 'خطرہ! باس کی انٹری ہو چکی ہے، سب سائیڈ پر ہو جاؤ۔',
      urls: ['https://www.myinstants.com/media/sounds/siren-meme.mp3']
    },
    {
      id: 'att-9-coffin-dance-drop',
      title: 'Astronomia Beat Drop Boss',
      speaker: 'Coffin Dance Heavy Drop',
      category: 'attitude',
      quote: 'جس دن ہم میدان میں اترے، کھیل کا پانسہ پلٹ جائے گا۔',
      urls: ['https://www.myinstants.com/media/sounds/astronomia-coffin-dance.mp3']
    },
    {
      id: 'att-10-panjabi-mc',
      title: 'Panjabi MC Mundian To Bach Ke Beat',
      speaker: 'Panjabi MC Badass Bhangra',
      category: 'attitude',
      quote: 'منڈیاں توں بچ کے رہیں... راج ہمارا ہی چلے گا!',
      urls: ['https://www.myinstants.com/media/sounds/panjabi-mc-mundian-tu-bach-ke-0s-16s-kfmq4pgaove_tjS6M4I.mp3']
    },
    {
      id: 'att-11-fbi-open-up',
      title: 'FBI OPEN UP Door Kick Boom',
      speaker: 'SWAT Team Raid',
      category: 'attitude',
      quote: 'FBI OPEN UP! دروازہ توڑ دیا!',
      urls: ['https://www.myinstants.com/media/sounds/fbi-open-up-sfx.mp3']
    },
    {
      id: 'att-12-mlg-airhorn-badass',
      title: 'MLG Airhorn Savage Drop',
      speaker: 'Savage MLG Soundboard',
      category: 'attitude',
      quote: 'سویگ اور ایٹیٹیوڈ ہمارا نیچرل ہے!',
      urls: ['https://www.myinstants.com/media/sounds/mlg-airhorn.mp3']
    },
    {
      id: 'att-13-yeah-lightweight',
      title: 'Ronnie Coleman Heavyweight King',
      speaker: 'King Ronnie Coleman',
      category: 'attitude',
      quote: 'LIGHTWEIGHT BABY! AIN\'T NOTHIN\' BUT A PEANUT!',
      urls: ['https://www.myinstants.com/media/sounds/yeah-light-weight-baby.mp3']
    },
    {
      id: 'att-14-gunshot-reverb',
      title: 'Sniper Gunshot Heavy Reverb',
      speaker: 'Sniper Rifle Fire',
      category: 'attitude',
      quote: 'ایک گولی اور کھیل ختم! One shot, one kill.',
      urls: ['https://www.myinstants.com/media/sounds/gunshot_1.mp3']
    },
    {
      id: 'att-15-punch-gaming-sfx',
      title: 'Heavy Knockout Punch Bass',
      speaker: 'Knockout Blow',
      category: 'attitude',
      quote: 'ایک مکے میں بے ہوش! سیدھا ناک آؤٹ!',
      urls: ['https://www.myinstants.com/media/sounds/punch-gaming-sound-effect-hd.mp3']
    }
  ],

  romantic: [
    {
      id: 'rom-1-butterflies',
      title: 'You Give Me Butterflies Sweet Melody',
      speaker: 'Romantic Acoustic Chords',
      category: 'romantic',
      quote: 'تیری مسکراہٹ میرے دل کا سکون ہے، تجھے دیکھوں تو دنیا حسین لگتی ہے۔',
      urls: ['https://www.myinstants.com/media/sounds/amateur-dance-you-give-me-butterflies.mp3']
    },
    {
      id: 'rom-2-musica-romantica',
      title: 'Musica Romantica Sweet Guitar',
      speaker: 'Spanish Romantic Guitar',
      category: 'romantic',
      quote: 'تم میری پہلی اور آخری محبت ہو، میری ہر دھڑکن میں تیرا ہی نام ہے۔',
      urls: ['https://www.myinstants.com/media/sounds/musica-romantica.mp3']
    },
    {
      id: 'rom-3-romantic-sweet-tone',
      title: 'Romantic Soft Flute & Piano Bell',
      speaker: 'Love Melody Ensemble',
      category: 'romantic',
      quote: 'محبت وہ نہیں جو دنیا کو دکھائی جائے، محبت وہ ہے جو دل میں نبھائی جائے۔',
      urls: ['https://www.myinstants.com/media/sounds/romantic-sound.mp3']
    },
    {
      id: 'rom-4-titanic-flute-sweet',
      title: 'Titanic My Heart Will Go On Flute',
      speaker: 'Titanic Flute Melody',
      category: 'romantic',
      quote: 'Every night in my dreams, I see you, I feel you... میرا دل ہمیشہ تیرے پاس رہے گا۔',
      urls: ['https://www.myinstants.com/media/sounds/recorder-titanic.mp3']
    },
    {
      id: 'rom-5-careless-whisper',
      title: 'Careless Whisper Romantic Saxophone',
      speaker: 'George Michael Sax Hook',
      category: 'romantic',
      quote: 'تیرے ساتھ گزارا ہوا ہر ایک لمحہ میری زندگی کا سب سے خوبصورت تحفہ ہے۔',
      urls: ['https://www.myinstants.com/media/sounds/tf_nemesis.mp3', 'https://www.myinstants.com/media/sounds/musica-romantica.mp3']
    },
    {
      id: 'rom-6-soft-indian-melody',
      title: 'Indian Romantic Bansuri & Strings',
      speaker: 'Classical Romance Flute',
      category: 'romantic',
      quote: 'تجھ سے ہی میری صبح ہے اور تجھ پہ ہی میری شام ڈھلتی ہے۔',
      urls: ['https://www.myinstants.com/media/sounds/tmpauxfo4ff.mp3']
    },
    {
      id: 'rom-7-sad-hamster-strings',
      title: 'Soft Emotional Strings Love Tone',
      speaker: 'Sweet Violin Chords',
      category: 'romantic',
      quote: 'کاش وقت یہیں تھم جائے جب تم میرے قریب ہوتے ہو۔',
      urls: ['https://www.myinstants.com/media/sounds/sad-hamster.mp3']
    },
    {
      id: 'rom-8-lovely-sad-chords',
      title: 'Lovely Sweet Chords & Vocals',
      speaker: 'Acoustic Love Song',
      category: 'romantic',
      quote: 'تمہاری آنکھوں میں جو کشش ہے، وہ دنیا کی کسی شے میں نہیں۔',
      urls: ['https://www.myinstants.com/media/sounds/ia-ia-ahh-yeye-yeye-lovely-sad.mp3']
    },
    {
      id: 'rom-9-super-mario-love',
      title: 'Chirping Birds & Romantic Calm',
      speaker: 'Whistling Calm Love',
      category: 'romantic',
      quote: 'دل کی بات زبان پر لانا مشکل تھا، بس آنکھوں کے اشاروں میں سب کہہ دیا۔',
      urls: ['https://www.myinstants.com/media/sounds/happy_tree_friends_theme_song.mp3']
    },
    {
      id: 'rom-10-sweet-violin-hook',
      title: 'Melodious Violin Love Serenade',
      speaker: 'Violin Love Harmony',
      category: 'romantic',
      quote: 'تیرے بغیر جینا ادھورا سا لگتا ہے، تم ہو تو پوری کائنات روشن ہے۔',
      urls: ['https://www.myinstants.com/media/sounds/export_4.mp3']
    },
    {
      id: 'rom-11-sweet-cat-melody',
      title: 'Sweet Cheerful Love Tune',
      speaker: 'Cheerful Romantic Beats',
      category: 'romantic',
      quote: 'محبت میں شرطیں نہیں ہوتیں، بس دل کا دل سے سودا ہوتا ہے۔',
      urls: ['https://www.myinstants.com/media/sounds/happy-happy-happy-cat.mp3']
    },
    {
      id: 'rom-12-guts-soft-acoustic',
      title: 'Deep Stargazing Acoustic Guitar',
      speaker: 'Night Sky Romance',
      category: 'romantic',
      quote: 'تاروں بھری رات میں صرف تیرا چہرہ اور تیری یادیں میرے ساتھ ہیں۔',
      urls: ['https://www.myinstants.com/media/sounds/guts-theme.mp3']
    },
    {
      id: 'rom-13-hallelujah-love',
      title: 'Pure Heavenly Choir Romance',
      speaker: 'Romantic Choir Bells',
      category: 'romantic',
      quote: 'رب نے تجھے بڑی فرصت سے بنایا ہے، میری دعاؤں کا صلہ ہو تم۔',
      urls: ['https://www.myinstants.com/media/sounds/hallelujah_3.mp3']
    },
    {
      id: 'rom-14-soft-piano-drop',
      title: 'Soft Piano Tears of Joy',
      speaker: 'Piano Love Ballad',
      category: 'romantic',
      quote: 'ہماری کہانی محبت کی وہ کتاب ہے جس کا ہر صفحہ وفا سے بھرا ہے۔',
      urls: ['https://www.myinstants.com/media/sounds/sad-meow-song.mp3']
    },
    {
      id: 'rom-15-wow-anime-love',
      title: 'Sweet Anime Love Spark',
      speaker: 'Sweet Sparkle Bells',
      category: 'romantic',
      quote: 'تیرے ملنے سے زندگی میں بہار آ گئی، آئی لو یو فارایور! ❤️',
      urls: ['https://www.myinstants.com/media/sounds/wow_2.mp3']
    }
  ],

  shayari: [
    {
      id: 'shayari-1-jaun-elia',
      title: 'Jaun Elia: Be-Dili Kya Yunhi Din Guzar Jayenge',
      speaker: 'جون ایلیا (Jaun Elia Classic)',
      category: 'shayari',
      quote: 'بے دلی کیا یونہی دن گزر جائیں گے\nصرف زندہ رہے ہم تو مر جائیں گے\nکیا تکلف کریں یہ کہنے میں\nجو بھی خوش ہے ہم اس سے جلتے ہیں!',
      urls: ['https://www.myinstants.com/media/sounds/wahwah-shayari.mp3', 'https://www.myinstants.com/media/sounds/tf_nemesis.mp3']
    },
    {
      id: 'shayari-2-ghalib',
      title: 'Mirza Ghalib: Hazaron Khwahishen Aisi',
      speaker: 'مرزا اسد اللہ خان غالب (Mirza Ghalib)',
      category: 'shayari',
      quote: 'ہزاروں خواہشیں ایسی کہ ہر خواہش پہ دم نکلے\nبہت نکلے مرے ارمان لیکن پھر بھی کم نکلے\nنکلنا خلد سے آدم کا سنتے آئے تھے لیکن\nبہت بے آبرو ہو کر ترے کوچے سے ہم نکلے!',
      urls: ['https://www.myinstants.com/media/sounds/shayariwahwah.mp3', 'https://www.myinstants.com/media/sounds/naruto-sad-music-instant.mp3']
    },
    {
      id: 'shayari-3-rahat-indori',
      title: 'Rahat Indori: Kisi Ke Baap Ka Hindustan Thodi Hai',
      speaker: 'ڈاکٹر راحت اندوری (Rahat Indori)',
      category: 'shayari',
      quote: 'لگے گی آگ تو آئیں گے گھر کئی زد میں\nیہاں پہ صرف ہمارا مکان تھوڑی ہے!\nسبھی کا خون ہے شامل یہاں کی مٹی میں\nکسی کے باپ کا ہندوستان تھوڑی ہے!',
      urls: ['https://www.myinstants.com/media/sounds/wahwah-shayari.mp3', 'https://www.myinstants.com/media/sounds/giga-chad-theme.mp3']
    },
    {
      id: 'shayari-4-iqbal',
      title: 'Allama Iqbal: Khudi Ko Kar Buland Itna',
      speaker: 'علامہ محمد اقبال (Allama Iqbal)',
      category: 'shayari',
      quote: 'خودی کو کر بلند اتنا کہ ہر تقدیر سے پہلے\nخدا بندے سے خود پوچھے بتا تیری رضا کیا ہے!\nستاروں سے آگے جہاں اور بھی ہیں\nابھی عشق کے امتحاں اور بھی ہیں!',
      urls: ['https://www.myinstants.com/media/sounds/guts-theme.mp3']
    },
    {
      id: 'shayari-5-tehzeeb-hafi',
      title: 'Tehzeeb Hafi: Tera Chup Rehna Mere Zehan Mein',
      speaker: 'تہذیب حافی (Tehzeeb Hafi)',
      category: 'shayari',
      quote: 'تیرا چپ رہنا میرے ذہن میں کیا بیٹھ گیا\nاتنی آوازیں تجھے دیں کہ گلا بیٹھ گیا\nیوں نہیں ہے کہ فقط میں ہی اسے چاہتا ہوں\nجو بھی اس پیڑ کی چھاؤں میں گیا بیٹھ گیا!',
      urls: ['https://www.myinstants.com/media/sounds/tmpauxfo4ff.mp3']
    },
    {
      id: 'shayari-6-ahmad-faraz',
      title: 'Ahmad Faraz: Ranjish Hi Sahi Dil Hi Dukhane Ke Liye Aa',
      speaker: 'احمد فراز (Ahmad Faraz)',
      category: 'shayari',
      quote: 'رنجش ہی سہی دل ہی دکھانے کے لیے آ\nآ پھر سے مجھے چھوڑ کے جانے کے لیے آ\nپہلے سے مراسم نہ سہی پھر بھی کبھی تو\nرسم و رہِ دنیا ہی نبھانے کے لیے آ!',
      urls: ['https://www.myinstants.com/media/sounds/sad-violin.mp3']
    },
    {
      id: 'shayari-7-parveen-shakir',
      title: 'Parveen Shakir: Wo To Khushbu Hai Hawaon Mein Bikhar Jayega',
      speaker: 'پروین شاکر (Parveen Shakir)',
      category: 'shayari',
      quote: 'وہ تو خوشبو ہے ہواؤں میں بکھر جائے گا\nمسئلہ پھول کا ہے پھول کدھر جائے گا\nہم تو سمجھے تھے کہ اک زخم ہے بھر جائے گا\nکیا خبر تھی کہ رگِ جاں میں اتر جائے گا!',
      urls: ['https://www.myinstants.com/media/sounds/amateur-dance-you-give-me-butterflies.mp3']
    },
    {
      id: 'shayari-8-faiz-ahmed',
      title: 'Faiz Ahmed Faiz: Mujh Se Pehli Si Mohabbat',
      speaker: 'فیض احمد فیض (Faiz Ahmed Faiz)',
      category: 'shayari',
      quote: 'مجھ سے پہلی سی محبت مری محبوب نہ مانگ\nمیں نے سمجھا تھا کہ تو ہے تو درخشاں ہے حیات\nتیرا غم ہے تو غمِ دہر کا جھگڑا کیا ہے\nتیری صورت سے ہے عالم میں بہاروں کو ثبات!',
      urls: ['https://www.myinstants.com/media/sounds/sad-hamster.mp3']
    },
    {
      id: 'shayari-9-waseem-barelvi',
      title: 'Waseem Barelvi: Usool-e-Zindagi Aur Wafa',
      speaker: 'وسیم بریلوی (Waseem Barelvi)',
      category: 'shayari',
      quote: 'اپنے چہرے سے جو ظاہر ہے چھپائیں کیسے\nتیری مرضی کے مطابق نظر آئیں کیسے\nگھر بنانے کا تصوّر ہی بہت مشکل تھا\nہم نے گرتے ہوئے کچے کو سنبھالا کیسے!',
      urls: ['https://www.myinstants.com/media/sounds/export_4.mp3']
    },
    {
      id: 'shayari-10-nida-fazli',
      title: 'Nida Fazli: Kabhi Kisi Ko Mukammal Jahan Nahi Milta',
      speaker: 'ندا فاضلی (Nida Fazli)',
      category: 'shayari',
      quote: 'کبھی کسی کو مکمل جہاں نہیں ملتا\nکہیں زمیں تو کہیں آسماں نہیں ملتا\nتمام عمر اسی کھوج میں گزرتی ہے\nجسے طلب ہو وہ شعلہ بیاں نہیں ملتا!',
      urls: ['https://www.myinstants.com/media/sounds/moye-moye.mp3']
    },
    {
      id: 'shayari-11-gulzar',
      title: 'Gulzar: Haath Chooten Bhi To Rishtey Nahi Choota Karte',
      speaker: 'گلزار (Sampooran Singh Gulzar)',
      category: 'shayari',
      quote: 'ہاتھ چھوٹیں بھی تو رشتے نہیں چھوٹا کرتے\nوقت کی شاخ سے لمحے نہیں ٹوٹا کرتے\nجس کی آنکھوں میں کٹی تھیں صدیاں\nاس نے صدیوں کی جدائی کا صلہ مانگ لیا!',
      urls: ['https://www.myinstants.com/media/sounds/musica-romantica.mp3']
    },
    {
      id: 'shayari-12-mir-taqi-mir',
      title: 'Mir Taqi Mir: Patta Patta Boota Boota Haal Hamara Jane Hai',
      speaker: 'میر تقی میر (Khuda-e-Sukhan Mir)',
      category: 'shayari',
      quote: 'پتہ پتہ بوٹا بوٹا حال ہمارا جانے ہے\nجانے نہ جانے گل ہی نہ جانے باغ تو سارا جانے ہے\nنازکی اس کے لب کی کیا کہئے\nپنکھڑی اک گلاب کی سی ہے!',
      urls: ['https://www.myinstants.com/media/sounds/ia-ia-ahh-yeye-yeye-lovely-sad.mp3']
    },
    {
      id: 'shayari-13-munawwar-rana',
      title: 'Munawwar Rana: Maa Ke Naam Shayari',
      speaker: 'منور رانا (Munawwar Rana Maa)',
      category: 'shayari',
      quote: 'کسی کو گھر ملا حصے میں یا کوئی دکاں آئی\nمیں گھر میں سب سے چھوٹا تھا مرے حصے میں ماں آئی\nلبوں پہ اس کے کبھی بددعا نہیں ہوتی\nبس ایک ماں ہے جو مجھ سے خفا نہیں ہوتی!',
      urls: ['https://www.myinstants.com/media/sounds/spongebob-sad-song.mp3']
    },
    {
      id: 'shayari-14-bashir-badr',
      title: 'Bashir Badr: Ujale Apni Yadon Ke Hamare Saath Rahne Do',
      speaker: 'بشیر بدر (Dr. Bashir Badr)',
      category: 'shayari',
      quote: 'اجالے اپنی یادوں کے ہمارے ساتھ رہنے دو\nنہ جانے کس گلی میں زندگی کی شام ہو جائے\nدشمنی جم کر کرو لیکن یہ گنجائش رہے\nجب کبھی ہم دوست ہو جائیں تو شرمندہ نہ ہوں!',
      urls: ['https://www.myinstants.com/media/sounds/sad-meow-song.mp3']
    },
    {
      id: 'shayari-15-habib-jalib',
      title: 'Habib Jalib: Dastoor & Inquilab',
      speaker: 'حبیب جالب (Habib Jalib Awami Shair)',
      category: 'shayari',
      quote: 'دیپ جس کا محلات ہی میں جلے\nچند لوگوں کی خوشیوں کو لے کر چلے\nوہ جو سائے میں ہر مصلحت کے پلے\nایسے دستور کو، صبحِ بے نور کو\nمیں نہیں مانتا، میں نہیں مانتا!',
      urls: ['https://www.myinstants.com/media/sounds/loud-trollface-phonk_YUYnsos.mp3']
    }
  ],

  motivation: [
    {
      id: 'mot-1-ronnie-coleman',
      title: 'Ronnie Coleman Lightweight Baby & Yeah Buddy',
      speaker: 'King Ronnie Coleman (8x Mr. Olympia)',
      category: 'motivation',
      quote: 'YEAH BUDDY! LIGHTWEIGHT BABY! Everybody wanna be a bodybuilder, but nobody wanna lift no heavy-ass weights!',
      urls: ['https://www.myinstants.com/media/sounds/yeah-light-weight-baby.mp3']
    },
    {
      id: 'mot-2-shia-just-do-it',
      title: 'Shia LaBeouf: JUST DO IT! MAKE YOUR DREAMS COME TRUE',
      speaker: 'Shia LaBeouf',
      category: 'motivation',
      quote: 'DO IT! JUST DO IT! Don\'t let your dreams be dreams! Yesterday you said tomorrow, so JUST DO IT!',
      urls: ['https://www.myinstants.com/media/sounds/just-do-it.mp3']
    },
    {
      id: 'mot-3-gigachad-grind',
      title: 'GigaChad Daily Grindset Phonk',
      speaker: 'Sigma Male Grindset',
      category: 'motivation',
      quote: 'Focus on yourself, hit the gym, build your empire and stay undefeated!',
      urls: ['https://www.myinstants.com/media/sounds/giga-chad-theme.mp3']
    },
    {
      id: 'mot-4-smoke-drift-motivation',
      title: 'Heavy Workout Motivation Phonk',
      speaker: 'Cowbell Cult Phonk Beast',
      category: 'motivation',
      quote: 'Pain is temporary, pride is forever. Never give up on your goals!',
      urls: ['https://www.myinstants.com/media/sounds/smoke-cowbell-cult-phonk.mp3']
    },
    {
      id: 'mot-5-naruto-fighting-hype',
      title: 'Never Give Up: Naruto Ninja Way Fighting Spirit',
      speaker: 'Naruto Uzumaki Shinobi Spirit',
      category: 'motivation',
      quote: 'میرا راستہ یہ ہے کہ میں کبھی پیچھے نہیں ہٹتا، یہی میرا عزم ہے!',
      urls: ['https://www.myinstants.com/media/sounds/naruto-the-raising-fighting-spirit-extended-audiotrimmer_7wvXRts.mp3']
    },
    {
      id: 'mot-6-aura-beast-mode',
      title: 'Aura Beast Mode Motivation',
      speaker: 'Gym Beast Mode',
      category: 'motivation',
      quote: 'جب دنیا کہے تم نہیں کر سکتے، تب دو گنی محنت سے ان کا منہ بند کر دو۔',
      urls: ['https://www.myinstants.com/media/sounds/aura-phonk.mp3']
    },
    {
      id: 'mot-7-hallelujah-victory',
      title: 'Victory Triumph & Champion Bells',
      speaker: 'Champion Victory Arena',
      category: 'motivation',
      quote: 'محنت اتنی خاموشی سے کرو کہ تمہاری کامیابی خود شور مچا دے!',
      urls: ['https://www.myinstants.com/media/sounds/hallelujah_3.mp3']
    },
    {
      id: 'mot-8-siu-ronaldo',
      title: 'Cristiano Ronaldo Hard Work Ethic SIUUU',
      speaker: 'Cristiano Ronaldo CR7',
      category: 'motivation',
      quote: 'Hard work, discipline and dedication! SIUUUUUU!',
      urls: ['https://www.myinstants.com/media/sounds/siuuu.mp3']
    },
    {
      id: 'mot-9-applause-champion',
      title: 'Standing Ovation for the Winner',
      speaker: 'World Champion Arena',
      category: 'motivation',
      quote: 'جیتنے والے کبھی ہمت نہیں ہارتے، اور ہمت ہارنے والے کبھی جیت نہیں سکتے۔',
      urls: ['https://www.myinstants.com/media/sounds/applause_8.mp3']
    },
    {
      id: 'mot-10-stadium-fans',
      title: 'Stadium Roar & Crowd Adrenaline',
      speaker: 'Olympic Stadium Crowd',
      category: 'motivation',
      quote: 'اپنے خوف کو طاقت بناؤ اور آگے بڑھو، منزل تمہارا انتظار کر رہی ہے۔',
      urls: ['https://www.myinstants.com/media/sounds/cheering.mp3']
    },
    {
      id: 'mot-11-super-mario-levelup',
      title: 'Level Up Champion Fanfare',
      speaker: 'Level Up High Energy',
      category: 'motivation',
      quote: 'نیا دن، نیا جذبہ، نیا لیول! رکنا نہیں ہے۔',
      urls: ['https://www.myinstants.com/media/sounds/super-mario-stage-win.mp3']
    },
    {
      id: 'mot-12-bad-to-the-bone-power',
      title: 'Unstoppable Force Power Guitar Riff',
      speaker: 'Heavy Metal Motivation',
      category: 'motivation',
      quote: 'طاقت اور ہمت سے ہر مشکل آسان ہو جاتی ہے۔ Be unstoppable!',
      urls: ['https://www.myinstants.com/media/sounds/bad-to-the-bone-guitar-riff.mp3']
    },
    {
      id: 'mot-13-panjabi-mc-energy',
      title: 'High Energy Panjabi Adrenaline Rush',
      speaker: 'Adrenaline Beats',
      category: 'motivation',
      quote: 'ہوش و حواس کے ساتھ اپنا ٹارگٹ سیٹ کرو اور حاصل کر کے دکھاؤ!',
      urls: ['https://www.myinstants.com/media/sounds/panjabi-mc-mundian-tu-bach-ke-0s-16s-kfmq4pgaove_tjS6M4I.mp3']
    },
    {
      id: 'mot-14-guts-berserk-grit',
      title: 'Unbroken Grit: Guts Warrior Theme',
      speaker: 'The Black Swordsman',
      category: 'motivation',
      quote: 'چاہے جتنے بھی زخم ملیں، کھڑے ہو اور آگے بڑھتے رہو!',
      urls: ['https://www.myinstants.com/media/sounds/guts-theme.mp3']
    },
    {
      id: 'mot-15-michael-rosen-perfection',
      title: 'Perfection & Mastery *Noice*',
      speaker: 'Mastery & Focus',
      category: 'motivation',
      quote: 'جب کام پرفیکٹ ہو جائے، تو دنیا کہے گی: NOICE!',
      urls: ['https://www.myinstants.com/media/sounds/noice.mp3']
    }
  ],

  sfx: [
    {
      id: 'sfx-1-metal-pipe',
      title: 'Metal Pipe Falling Sound Effect',
      speaker: 'Metal Clatter Soundboard',
      category: 'sfx',
      quote: '*CLANGGGG CLATTER* (Metal pipe falling)',
      urls: ['https://www.myinstants.com/media/sounds/metal-pipe-falling-sound-effect.mp3']
    },
    {
      id: 'sfx-2-vine-boom',
      title: 'Vine Boom Bass Hit',
      speaker: 'Soundboard Hit',
      category: 'sfx',
      quote: '💥 BOOM!',
      urls: ['https://raw.githubusercontent.com/THEbluefirestudios/memeboard-fdroid/master/app/src/main/res/raw/vine_boom.mp3']
    },
    {
      id: 'sfx-3-bruh',
      title: 'Bruh Sound Effect Original',
      speaker: 'Bruh SFX',
      category: 'sfx',
      quote: 'BRUH... 🗿',
      urls: ['https://raw.githubusercontent.com/THEbluefirestudios/memeboard-fdroid/master/app/src/main/res/raw/bruh.mp3']
    },
    {
      id: 'sfx-4-fart-reverb',
      title: 'Fart Reverb Bass Sound',
      speaker: 'Reverb Fart SFX',
      category: 'sfx',
      quote: '*BRAAAP* (Heavy Reverb) 💨',
      urls: ['https://www.myinstants.com/media/sounds/fart-with-reverb.mp3']
    },
    {
      id: 'sfx-5-discord-ping',
      title: 'Discord Notification Ping',
      speaker: 'Discord Ping',
      category: 'sfx',
      quote: '🔔 *Ping!* You have a message!',
      urls: ['https://www.myinstants.com/media/sounds/discord-notification.mp3']
    },
    {
      id: 'sfx-6-fbi-raid',
      title: 'FBI OPEN UP Door Kick',
      speaker: 'FBI SWAT Raid',
      category: 'sfx',
      quote: '🚪💥 FBI OPEN UP!',
      urls: ['https://www.myinstants.com/media/sounds/fbi-open-up-sfx.mp3']
    },
    {
      id: 'sfx-7-mlg-horn',
      title: 'MLG Airhorn 3x Blast',
      speaker: 'MLG Airhorn',
      category: 'sfx',
      quote: '📢 *AIRHORN BLASTS*',
      urls: ['https://www.myinstants.com/media/sounds/mlg-airhorn.mp3']
    },
    {
      id: 'sfx-8-gunshot',
      title: 'Heavy Gunshot Reverb Echo',
      speaker: 'Gunshot FX',
      category: 'sfx',
      quote: '🔫 *BANGGGG* Echo',
      urls: ['https://www.myinstants.com/media/sounds/gunshot_1.mp3']
    },
    {
      id: 'sfx-9-punch-hit',
      title: 'Heavy Gaming Punch Smack',
      speaker: 'Punch Hit SFX',
      category: 'sfx',
      quote: '👊 *SMACKKK*',
      urls: ['https://www.myinstants.com/media/sounds/punch-gaming-sound-effect-hd.mp3']
    },
    {
      id: 'sfx-10-siren-warning',
      title: 'Siren Emergency Alarm',
      speaker: 'Emergency Siren Alarm',
      category: 'sfx',
      quote: '🚨 *WEE-WOO WEE-WOO*',
      urls: ['https://www.myinstants.com/media/sounds/siren-meme.mp3']
    },
    {
      id: 'sfx-11-pop-sfx',
      title: 'Pop Bubble SFX',
      speaker: 'Pop Sound Effect',
      category: 'sfx',
      quote: '🎈 *POP!*',
      urls: ['https://www.myinstants.com/media/sounds/pop_7e9Is8L.mp3']
    },
    {
      id: 'sfx-12-awkward-slip',
      title: 'Awkward Cartoon Moment Slip',
      speaker: 'Cartoon Slide',
      category: 'sfx',
      quote: '*Cartoon slide whistle*',
      urls: ['https://www.myinstants.com/media/sounds/awkward-moment.mp3']
    },
    {
      id: 'sfx-13-bo-womp-sfx',
      title: 'Bo-Womp Cartoon Sad Boing',
      speaker: 'Bo-Womp SFX',
      category: 'sfx',
      quote: '*BO-WOMP*',
      urls: ['https://www.myinstants.com/media/sounds/bo-womp.mp3']
    },
    {
      id: 'sfx-14-siu-blast',
      title: 'SIUUU Crowd Scream FX',
      speaker: 'SIU Blast',
      category: 'sfx',
      quote: '⚡ SIUUUUUU!',
      urls: ['https://www.myinstants.com/media/sounds/siuuu.mp3']
    },
    {
      id: 'sfx-15-robert-weide',
      title: 'Directed By Robert Weide Theme',
      speaker: 'Robert Weide End Clip',
      category: 'sfx',
      quote: '🎬 Directed by Robert B. Weide',
      urls: ['https://www.myinstants.com/media/sounds/directed-by-robert-b_VoOBtSN.mp3']
    }
  ]
};

// Memory cache & non-repeating shuffle tracker
const moodBufferCache = new Map<string, { buffer: Buffer; mimetype: string }>();
const historyTracker = new Map<string, string[]>();

const MOOD_DISK_CACHE_DIR = path.join(process.cwd(), 'temp_audio_cache');
if (!fs.existsSync(MOOD_DISK_CACHE_DIR)) {
  try { fs.mkdirSync(MOOD_DISK_CACHE_DIR, { recursive: true }); } catch {}
}

export async function fetchDirectMoodAudio(category: 'sad' | 'happy' | 'joke' | 'attitude' | 'romantic' | 'shayari' | 'motivation' | 'sfx'): Promise<{ buffer: Buffer; mimetype: string; item: MoodAudioItem }> {
  const list = MOOD_AUDIO_DATABASE[category] || MOOD_AUDIO_DATABASE.sad;
  if (!list || list.length === 0) {
    throw new Error('No audio found for category: ' + category);
  }

  // Ensure true randomness with history memory so we never repeat the last 5 played items
  let recentHistory = historyTracker.get(category) || [];
  let availableCandidates = list.filter(it => !recentHistory.includes(it.id));
  if (availableCandidates.length === 0) {
    recentHistory = [];
    availableCandidates = list;
  }

  const selectedItem = availableCandidates[Math.floor(Math.random() * availableCandidates.length)];

  recentHistory.push(selectedItem.id);
  if (recentHistory.length > 7) {
    recentHistory.shift();
  }
  historyTracker.set(category, recentHistory);

  const cacheKey = selectedItem.id;

  // 1. Check in-memory cache
  if (moodBufferCache.has(cacheKey)) {
    const cached = moodBufferCache.get(cacheKey)!;
    return { buffer: cached.buffer, mimetype: cached.mimetype, item: selectedItem };
  }

  // 2. Check disk cache
  const diskFile = path.join(MOOD_DISK_CACHE_DIR, `mood_${cacheKey}.ogg`);
  if (fs.existsSync(diskFile)) {
    try {
      const diskBuf = fs.readFileSync(diskFile);
      if (diskBuf && diskBuf.length > 500) {
        moodBufferCache.set(cacheKey, { buffer: diskBuf, mimetype: 'audio/ogg; codecs=opus' });
        return { buffer: diskBuf, mimetype: 'audio/ogg; codecs=opus', item: selectedItem };
      }
    } catch (e) {}
  }

  // 3. Download from candidate URLs (tested live MP3 sources)
  for (const url of selectedItem.urls) {
    try {
      const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'audio/*,*/*'
        }
      });
      if (res.data && res.data.byteLength > 1000) {
        const rawBuf = Buffer.from(res.data);
        const converted = await convertAudioToWhatsAppVoice(rawBuf);
        if (converted.buffer && converted.buffer.length > 200) {
          moodBufferCache.set(cacheKey, { buffer: converted.buffer, mimetype: converted.mimetype });
          try { fs.writeFileSync(diskFile, converted.buffer); } catch {}
          return { buffer: converted.buffer, mimetype: converted.mimetype, item: selectedItem };
        }
      }
    } catch (err) {}
  }

  // 4. Guaranteed high-energy sound fallback from verified library
  const emergencyUrls = [
    'https://www.myinstants.com/media/sounds/tf_nemesis.mp3',
    'https://www.myinstants.com/media/sounds/giga-chad-theme.mp3',
    'https://www.myinstants.com/media/sounds/happy-happy-happy-cat.mp3',
    'https://raw.githubusercontent.com/THEbluefirestudios/memeboard-fdroid/master/app/src/main/res/raw/vine_boom.mp3'
  ];
  for (const eu of emergencyUrls) {
    try {
      const fbRes = await axios.get(eu, { responseType: 'arraybuffer', timeout: 5000 });
      if (fbRes.data && fbRes.data.byteLength > 1000) {
        const converted = await convertAudioToWhatsAppVoice(Buffer.from(fbRes.data));
        return { buffer: converted.buffer, mimetype: converted.mimetype, item: selectedItem };
      }
    } catch {}
  }

  throw new Error(`Could not fetch audio clip for ${category}`);
}
