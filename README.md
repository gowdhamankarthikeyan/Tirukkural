# திருக்குறள் — Tirukkuṟaḷ Multilingual Website

A free, ad-free web application for exploring all 1,330 Tirukkuṟaḷ couplets — with Tamil text, transliteration, four expert commentaries (3 Tamil + 1 English), curated English translation, 14 native language translations, audio in 15 languages, and 15-language site navigation.

🌐 **Live site:** https://tirukkural.in

![Version](https://img.shields.io/badge/version-1.8-blue)
![Navigation](https://img.shields.io/badge/navigation-15%20languages-green)
![Translations](https://img.shields.io/badge/native%20translations-14%20languages-orange)
![Audio](https://img.shields.io/badge/audio-15%20languages-red)
![License](https://img.shields.io/badge/license-Educational-purple)

---

## 🌟 Features

### 📚 Complete Content
- **1,330 Couplets** across **133 Chapters** in **3 Books**
- Books: Virtue (அறத்துப்பால்), Wealth (பொருட்பால்), Love (காமத்துப்பால்)
- Tamil text + transliteration for every kural

### 🔤 Four Expert Commentaries
- **மு. வரதராசனார்** (Mu. Varadarasanar) — Classical scholarly interpretation
- **சாலமன் பாப்பையா** (Solomon Pappaiah) — Contemporary, accessible insights
- **கலைஞர் — Kalaignar M. Karunanidhi** — Modern rationalist perspective
- **Kannan** (English, kurals 1–1080) + **G.U. Pope** fallback (kurals 1081–1330)

Each commentary has a one-click Google Translate button for 100+ languages.

### 🇬🇧 Curated English Translation — N.V.K. Ashraf
18 years comparing 25+ scholarly translations, hand-picking the finest rendering per kural. Every translation credited with original translator initials. Full methodology: https://kuraltranslations.blogspot.com

### 🗣️ 11 Native Language Translations

| Language | Translator / Source |
|---|---|
| 🇬🇧 English | N.V.K. Ashraf (curated from 25+ scholars) |
| 🇮🇳 हिंदी Hindi | M.G. Venkatakrishnan (1964) |
| 🇮🇳 മലയാളം Malayalam | V. V. Abdulla Sahib |
| 🇮🇳 ಕನ್ನಡ Kannada | ಪಾ. ಶ. ಶ್ರೀನಿವಾಸ — Madurai Kamaraj University Press |
| 🇮🇳 తెలుగు Telugu | Gurucharan |
| 🇫🇷 Français French | Gnanou Diagou (Pondichery, 1942) |
| 🇹🇼 中文 Chinese | Dr. Yu Hsi / 洪清宇 (Taipei, 2010) |
| 🇷🇺 Русский Russian | Vithali Furniki (Moscow, 1991) |
| 🇩🇪 Deutsch German | Albrecht Frenz & K. Lalithambal (Madurai, 1977) |
| 🇸🇦 العربية Arabic | Dr. Yousuf Kokan; digitised by Dr. N.V. Ahmed Unni |
| 🇱🇰 සිංහල Sinhala | G. Misihami & Dr. S. Tambayah (Anula Press, Colombo, 1961) |
| 🇵🇱 Polski Polish | Bohdan Gębarski — Ossolineum, Wrocław (1977) |
| 🇸🇪 Svenska Swedish | Yngve Frykholm — Sydindisk levnadsvisdom, statskunskap och kärlek |
| 🇲🇾 Bahasa Melayu Malay | G. Soosai — Kitab Murni |

### 🔊 Audio in 12 Languages (Web Speech API)

| Language | TTS Code | Language | TTS Code |
|---|---|---|---|
| தமிழ் Tamil | ta-IN | Français French | fr-FR |
| English | en-IN / en-US | 中文 Chinese | zh-TW |
| हिंदी Hindi | hi-IN | Русский Russian | ru-RU |
| മലയാളം Malayalam | ml-IN | Deutsch German | de-DE |
| ಕನ್ನಡ Kannada | kn-IN | العربية Arabic | ar-SA |
| తెలుగు Telugu | te-IN | සිංහල Sinhala | si-LK |
| Polski Polish | pl-PL |
| Svenska Swedish | sv-SE |
| Bahasa Melayu Malay | ms-MY |

> English audio works on most devices without setup. Other languages may need a one-time voice download — click the **ⓘ** button for platform instructions.

### 🗺️ 15-Language Navigation

| Indian Languages | International Languages |
|---|---|
| 🇮🇳 தமிழ் Tamil — Default | 🇬🇧 English |
| 🇮🇳 हिंदी Hindi | 🇪🇸 Español Spanish |
| 🇮🇳 తెలుగు Telugu | 🇫🇷 Français French |
| 🇮🇳 മലയാളം Malayalam | 🇩🇪 Deutsch German |
| 🇮🇳 ಕನ್ನಡ Kannada | 🇹🇼 中文 Chinese |
| | 🇸🇦 العربية Arabic |
| | 🇷🇺 Русский Russian |
| | 🇯🇵 日本語 Japanese |
| | 🇱🇰 සිංහල Sinhala |

---

## 📁 Project Structure

```
tirukkural/
├── index.html              # Homepage
├── athikarams.html         # Chapter listing (133 chapters)
├── athikaram-view.html     # Chapter view — kurals, commentaries, audio
├── kural.html              # Individual kural detail page
├── contributors.html       # All translators & scholars
├── styles.css              # Global styles
├── kural.css               # Kural detail page styles
├── languages.js            # ★ Single source of truth for native language config
├── language.js             # Language management — dropdown, translations, cookies
├── translations.json       # UI strings (15 languages) + language dropdown config
├── athikaram-titles.json   # Chapter name translations (15 languages, separate file)
├── athikarams-data.js      # Chapter metadata (id, names, kural range)
├── athikarams.js           # Chapter listing logic
├── athikaram-view.js       # Chapter view — lazy loading, TTS, SEO
├── kural.js                # Kural detail page logic
├── thirukkural.json        # Core database — Tamil, transliteration, commentaries (~2MB)
├── thirukkural-en.json     # English commentary — Kannan (1–1080) + G.U. Pope (1081–1330)
├── thirukkural-hi.json     # Hindi (lazy-loaded)
├── thirukkural-ml.json     # Malayalam (lazy-loaded)
├── thirukkural-kn.json     # Kannada (lazy-loaded)
├── thirukkural-te.json     # Telugu (lazy-loaded)
├── thirukkural-fr.json     # French (lazy-loaded)
├── thirukkural-zh.json     # Chinese (lazy-loaded)
├── thirukkural-ru.json     # Russian (lazy-loaded)
├── thirukkural-de.json     # German (lazy-loaded)
├── thirukkural-ar.json     # Arabic (lazy-loaded)
├── thirukkural-si.json     # Sinhala (lazy-loaded)
├── thirukkural-pl.json     # Polish (lazy-loaded)
├── thirukkural-sv.json     # Swedish (lazy-loaded)
├── thirukkural-ms.json     # Malay (lazy-loaded)
├── sitemap.xml             # 136-URL sitemap
├── robots.txt
└── README.md
```

---

## ➕ Adding a New Language — Complete Checklist

Adding a native translation requires changes in **6 places only**. All UI behaviour is automatic.

### 1. `languages.js` — add one entry
```javascript
{ code: 'xx', label: 'Native Name', flag: '🏳️', fields: ['xx1','xx2'], ttsCode: 'xx-XX' }
// rtl: true  — add this for right-to-left scripts (Arabic, Hebrew etc.)
```
This single entry drives: lazy-loading, audio buttons, kural detail page display.

### 2. `thirukkural-xx.json` — create translation file
```json
{ "kural": [{ "Number": 1, "xx1": "line one", "xx2": "line two" }] }
```

### 3. `translations.json` — three sections
```json
"languages":       { "xx": { "name": "...", "nativeName": "...", "flag": "🏳️", "segment": "indian|international" } }
"translations":    { "xx": { "home": "...", "chapters": "...", "kural": "...", ... } }
```

### 4. `athikaram-titles.json` — add chapter name translations
```json
{ "xx": { "1": "Chapter 1 name", "2": "...", ... "133": "..." } }
```

### 5. `athikarams-data.js` — add `xx:` field to each of the 133 chapter entries
```javascript
{ id: 1, ta: "கடவுள் வாழ்த்து", en: "The Praise of God", xx: "Chapter name", ... }
```

### 6. Update copy & docs
- `contributors.html` — translator credit card
- `index.html` — increment native translations count, audio count, language list in modal
- `athikaram-view.js` — add language to audio help tip
- `README.md` — update all tables and version history

---

## 📊 Data Schema

### translations.json
```json
{
  "languages": {
    "ta": { "name": "தமிழ்", "nativeName": "தமிழ்", "flag": "🇮🇳", "segment": "indian" },
    "si": { "name": "සිංහල", "nativeName": "සිංහල", "flag": "🇱🇰", "segment": "international" }
  },
  "translations": {
    "en": { "home": "Home", "chapters": "Chapters", "kural": "Couplet", ... },
    "si": { "home": "මුල් පිටුව", "chapters": "පරිච්ඡේද", ... }
  }
}
```

### athikaram-titles.json (separate file, lazy-cached)
```json
{
  "ta": { "1": "கடவுள் வாழ்த்து", ... },
  "en": { "1": "The Praise of God", ... },
  "si": { "1": "නමකර", ... }
}
```

### thirukkural.json (core, ~2MB)
```json
{
  "Number": 1,
  "Line1": "அகர முதல எழுத்தெல்லாம்",
  "Line2": "ஆதி பகவன் முதற்றே உலகு",
  "transliteration1": "Agara mudala ezhuthellaam",
  "transliteration2": "Aadhi bagavan mudattre ulagu",
  "mv": "மு. வரதராசனார் commentary...",
  "sp": "சாலமன் பாப்பையா commentary...",
  "mk": "கலைஞர் commentary...",
  "ashraf": "With alpha begins all alphabets...",
  "ashraf_attr": "KN",
  "bharati_verse1": "English TTS line 1",
  "bharati_verse2": "English TTS line 2"
}
```

### thirukkural-{lang}.json (lazy-loaded per language)
```json
{ "kural": [{ "Number": 1, "sinhala1": "...", "sinhala2": "..." }] }
```
Field name convention: `{language}1` / `{language}2` (e.g. `hindi1`, `sinhala1`).

### thirukkural-en.json (English commentary)
```json
{ "kural": [{ "Number": 1, "kannan_exp": "...", "pope_exp": "..." }] }
```
`kannan_exp` used for kurals 1–1080; `pope_exp` as fallback for 1081–1330.

---

## 🔊 Audio System

Web Speech API (SpeechSynthesis) — no server-side audio files.

- Tamil always shown; currently selected UI language shown if it has a `ttsCode`
- Pre-fetched on page init so audio buttons render correctly on first load
- **ⓘ** button opens help modal with platform-specific voice download instructions:
  - **iPhone/iPad** — Settings → Accessibility → Spoken Content → Voices
  - **Mac** — System Settings → Accessibility → Spoken Content → Manage Voices
  - **Android** — Settings → General Management → Text-to-Speech → Install voice data
  - **Windows** — Settings → Language & Region → Text-to-speech pack

---

## 🏆 Version History

### v1.8 — Polish, Swedish & Malay Translations (February 2026)
- **Polski (Polish)** — 12th native translation; Bohdan Gębarski's *Świeta księga południowych Indii*, Ossolineum 1977
- **Svenska (Swedish)** — 13th native translation; Yngve Frykholm's *Sydindisk levnadsvisdom, statskunskap och kärlek*
- **Bahasa Melayu (Malay)** — 14th native translation; G. Soosai's *Kitab Murni*
- Native translations count: 11 → **14**; Audio languages: 12 → **15**
- Contributors page updated with research notes for all three new translators
- Welcome modal, README, and audio help tip updated accordingly

### v1.7 — Sinhala, English Commentary, Modular Architecture (February 2026)
- **Sinhala** — 11th native translation; 12th audio language (si-LK); 15th navigation language; all 133 chapter titles; full UI strings
- **English commentary** — Kannan (kurals 1–1080) + G.U. Pope fallback (1081–1330); blue accent card
- **Four commentaries** — section renamed from "Triple Expert Commentary" everywhere
- **Modular language system** — `languages.js` is now single source of truth; adding a language requires one entry there + JSON file
- **translations.json split** — chapter titles extracted to `athikaram-titles.json` (separate lazy-cached file)
- **"உரை / Commentaries"** — renamed from "Explanations" across all 15 languages
- **Kalaignar name** — corrected to `கலைஞர் — Kalaignar M. Karunanidhi`
- **kural.html nav hidden** — Home/Chapters/Contributors + hamburger removed; Back to Chapter handles navigation
- **Kural card border** — `border: 2px solid #d4a843` all sides + thick left accent
- **Kural text section border** — double-line gold border with ✦ ✦ ✦ star ornaments (top & bottom)
- **localStorage cache key bumped** — stale combined translations cache auto-busted

### v1.6 — 10 Native Translations, Audio & Performance (February 2026)
- Malayalam, Kannada, Telugu, Hindi, French, Chinese, Russian, German, Arabic translations
- JSON splitting — 9 lazy-loaded files; initial load reduced from 3.5MB to ~2MB
- Audio in 11 languages via Web Speech API
- Audio help modal with platform instructions

### v1.5 — SEO, Ashraf Translations & Domain (February 2026)
- tirukkural.in domain; N.V.K. Ashraf curated translations; contributors.html; dynamic SEO; sitemap.xml; listed on Wikipedia

### v1.4 — Indian Language Navigation
- Chapter name translations for 5 Indian languages

### v1.3 — 14-Language Navigation
- International languages; welcome modal; cookie persistence

### v1.2 — UX / v1.1 — Branding / v1.0 — Initial Release

---

## 📜 License & Attribution

Tirukkuṟaḷ text — Public domain (~31 BCE–1 CE). Code — Educational/non-commercial.

**Translators:** N.V.K. Ashraf · Kannan · G.U. Pope · V.V. Abdulla Sahib · ಪಾ. ಶ. ಶ್ರೀನಿವಾಸ · Gurucharan · M.G. Venkatakrishnan · Gnanou Diagou · Dr. Yu Hsi · Vithali Furniki · Albrecht Frenz & K. Lalithambal · Dr. Yousuf Kokan · G. Misihami & Dr. S. Tambayah · Bohdan Gębarski · Yngve Frykholm · G. Soosai

**Commentators:** மு. வரதராசனார் · சாலமன் பாப்பையா · கலைஞர் எம். கருணாநிதி

---

## 🔮 Roadmap

- [x] Audio (v1.6) · [x] English commentary (v1.7) · [x] Sinhala (v1.7) · [x] Modular language system (v1.7) · [x] Polish, Swedish, Malay (v1.8)
- [ ] Search across all 1,330 kurals · [ ] Bookmarks · [ ] Daily kural · [ ] Dark mode · [ ] PWA

---

**வாழ்க தமிழ்! வாழ்க திருக்குறள்!** — Built with ❤️ for Tamil literature | *v1.8, February 2026*
