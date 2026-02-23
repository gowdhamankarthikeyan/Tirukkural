# திருக்குறள் — Tirukkuṟaḷ Multilingual Website

A free, ad-free web application for exploring all 1,330 Tirukkuṟaḷ couplets — with Tamil text, transliteration, four commentaries (3 Tamil + 1 English), curated English translation, 11 native language translations, audio playback in 12 languages, and 15-language site navigation.

🌐 **Live site:** https://tirukkural.in

![Version](https://img.shields.io/badge/version-1.7-blue)
![Languages](https://img.shields.io/badge/navigation-15%20languages-green)
![Native Translations](https://img.shields.io/badge/native%20translations-11%20languages-orange)
![Audio](https://img.shields.io/badge/audio-12%20languages-red)
![License](https://img.shields.io/badge/license-Educational-purple)

---

## 🌟 Features

### 📚 Complete Content
- **1,330 Couplets** — All kurals with Tamil text and transliteration
- **133 Chapters** (Athikarams) — Organised into three books (Paal)
- **3 Books** — Virtue (அறத்துப்பால்), Wealth (பொருட்பால்), Love (காமத்துப்பால்)

### 🔤 Four Commentaries Per Kural
- **மு. வரதராசனார்** (Mu. Varadarasanar) — Classical scholarly interpretation
- **சாலமன் பாப்பையா** (Solomon Pappaiah) — Contemporary, accessible insights
- **கலைஞர் — Kalaignar M. Karunanidhi** — Modern rationalist perspective
- **Kannan** (English) — Kurals 1–1080; **G.U. Pope** fallback — Kurals 1081–1330

### 🇬🇧 Curated English Translation — N.V.K. Ashraf
18 years comparing 25+ scholarly translations. Every translation credited with translator initials. Full methodology: https://kuraltranslations.blogspot.com

### 🗣️ 11 Native Language Translations

| Language | Translator / Source |
|---|---|
| 🇬🇧 English | N.V.K. Ashraf (curated from 25+ scholars) |
| 🇮🇳 हिंदी (Hindi) | M.G. Venkatakrishnan (1964) |
| 🇮🇳 മലയാളം (Malayalam) | V. V. Abdulla Sahib |
| 🇮🇳 ಕನ್ನಡ (Kannada) | ಪಾ. ಶ. ಶ್ರೀನಿವಾಸ — Madurai Kamaraj University Press |
| 🇮🇳 తెలుగు (Telugu) | Gurucharan |
| 🇫🇷 Français (French) | Gnanou Diagou (Pondichery, 1942) |
| 🇹🇼 中文 (Chinese) | Dr. Yu Hsi / 洪清宇 (Taipei, 2010) |
| 🇷🇺 Русский (Russian) | Vithali Furniki (Moscow, 1991) |
| 🇩🇪 Deutsch (German) | Albrecht Frenz & K. Lalithambal (Madurai, 1977) |
| 🇸🇦 العربية (Arabic) | Dr. Yousuf Kokan; digitised by Dr. N.V. Ahmed Unni |
| 🇱🇰 සිංහල (Sinhala) | G. Misihami & Dr. S. Tambayah (Anula Press, Colombo, 1961) |

### 🔊 Audio Playback in 12 Languages (Web Speech API)

| Language | TTS Code | Language | TTS Code |
|---|---|---|---|
| தமிழ் | ta-IN | Français | fr-FR |
| English | en-IN/en-US | 中文 | zh-TW |
| हिंदी | hi-IN | Русский | ru-RU |
| മലയാളം | ml-IN | Deutsch | de-DE |
| ಕನ್ನಡ | kn-IN | العربية | ar-SA |
| తెలుగు | te-IN | සිංහල | si-LK |

### 🗺️ 15-Language Navigation

| Indian Languages | International Languages |
|---|---|
| 🇮🇳 தமிழ் (Tamil) — Default | 🇬🇧 English |
| 🇮🇳 हिंदी (Hindi) | 🇪🇸 Español |
| 🇮🇳 తెలుగు (Telugu) | 🇫🇷 Français |
| 🇮🇳 മലയാളം (Malayalam) | 🇩🇪 Deutsch |
| 🇮🇳 ಕನ್ನಡ (Kannada) | 🇹🇼 中文 |
| | 🇸🇦 العربية |
| | 🇷🇺 Русский |
| | 🇯🇵 日本語 |
| | 🇱🇰 සිංහල (Sinhala) |

---

## 📁 Project Structure

```
tirukkural/
├── index.html              # Homepage
├── athikarams.html         # Chapter listing (133 chapters)
├── athikaram-view.html     # Chapter view (kurals + commentaries + audio)
├── kural.html              # Individual kural detail page
├── contributors.html       # All translators & scholars
├── styles.css              # Global styles
├── kural.css               # Kural page styles
├── language.js             # Language management
├── translations.json       # UI strings (15 langs) + chapter names + language config
├── athikarams-data.js      # Chapter metadata (id, ta, en, si... names, kural range)
├── athikarams.js           # Chapter listing logic
├── athikaram-view.js       # Chapter view + lazy loading + TTS + SEO
├── kural.js                # Kural detail page logic
├── thirukkural.json        # Core database — Tamil, transliteration, commentaries (~2MB)
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
├── thirukkural-en.json     # English commentary — Kannan + Pope
├── sitemap.xml             # 136-URL sitemap
├── robots.txt
└── README.md
```

---

## ➕ Adding a New Language — Complete Modular Checklist

**All steps are mechanical — no business logic to change.**

### Step 1: Create translation file
`thirukkural-{code}.json`:
```json
{ "kural": [{ "Number": 1, "{code}1": "line 1", "{code}2": "line 2" }] }
```

### Step 2: Register in athikaram-view.js → SPLIT_LANGS
```javascript
xx: { fields: ['{code}1', '{code}2'], ttsCode: 'xx-XX', ttsLabel: 'Native Name' }
```

### Step 3: Register in kural.js → KURAL_LANGS
```javascript
{ code: 'xx', label: 'Native', flag: '🏳️', fields: ['{code}1','{code}2'], ttsCode: 'xx-XX' }
```

### Step 4: translations.json — three sections
```json
"languages":       { "xx": { "name": "...", "nativeName": "...", "flag": "🏳️", "segment": "indian|international" } }
"translations":    { "xx": { "home": "...", "chapters": "...", ... } }
"athikaram_names": { "xx": { "1": "Chapter 1 title", ... } }
```

### Step 5: athikarams-data.js — add `xx:` to each entry
```javascript
{ id: 1, ta: "...", en: "...", xx: "Chapter 1 in new language", ... }
```

### Step 6: contributors.html — add translator card
### Step 7: index.html — increment language counts in meta + body text
### Step 8: README.md — update translation table, audio table, navigation table, version history

---

## 📊 Data Schema

### translations.json structure
```json
{
  "languages": {
    "ta": { "name": "தமிழ்", "nativeName": "தமிழ்", "flag": "🇮🇳", "segment": "indian" },
    "si": { "name": "සිංහල", "nativeName": "සිංහල", "flag": "🇱🇰", "segment": "international" }
  },
  "translations": {
    "en": { "home": "Home", "chapters": "Chapters", "kural": "Kural", ... },
    "si": { "home": "මුල් පිටුව", "chapters": "පරිච්ඡේද", ... }
  },
  "athikaram_names": {
    "ta": { "1": "கடவுள் வாழ்த்து", ... },
    "si": { "1": "නමකර", ... }
  }
}
```

---

## 🔊 Audio System
Uses **Web Speech API** — no server-side audio files. Tamil always shown; selected UI language shown if TTS supported. **ⓘ** button provides voice download instructions:
- **iPhone/iPad** — Settings → Accessibility → Spoken Content → Voices
- **Mac** — System Settings → Accessibility → Spoken Content → Manage Voices
- **Android** — Settings → General Management → Text-to-Speech → Install voice data
- **Windows** — Settings → Language & Region → Text-to-speech pack

---

## 🏆 Version History

### v1.7 — Sinhala, English Commentary, Navigation (February 2026)
- **Sinhala** — 11th native translation; 12th audio language (si-LK); 15th navigation language
- **Sinhala chapter titles** — All 133 chapters in Sinhala in navigation
- **English commentary** — Kannan (1–1080) + G.U. Pope fallback (1081–1330); blue accent
- **"உரை / Commentaries"** — Renamed from "Explanations" across all 15 languages
- **Kalaignar name** — Corrected to `கலைஞர் — Kalaignar M. Karunanidhi` (Tamil first)
- **kural.html nav hidden** — Home/Chapters/Contributors + hamburger removed from kural page
- **Gold border universal** — Applied to all chapters, not just chapter 1
- **Kannan en.json cache fix** — Now always loads on cached and fresh visits

### v1.6 — Native Translations, Audio & Performance (February 2026)
- 10 native translations (Malayalam, Kannada, Telugu, Hindi, French, Chinese, Russian, German, Arabic)
- JSON splitting — 9 lazy-loaded language files; load reduced from 3.5MB to ~2MB
- Audio in 11 languages via Web Speech API
- Audio help modal with platform instructions

### v1.5 — SEO, Ashraf Translations & Domain (February 2026)
- tirukkural.in domain; N.V.K. Ashraf curated translations; contributors.html; dynamic SEO; sitemap.xml

### v1.4 — Indian Language Navigation
- Chapter name translations for 5 Indian languages

### v1.3 — 14-Language Navigation
- International languages; welcome modal; cookie persistence

### v1.2 — UX / v1.1 — Branding / v1.0 — Initial Release

---

## 📜 License & Attribution

Tirukkuṟaḷ text — Public domain. Code — Educational/non-commercial.

Translators: திருவள்ளுவர் · N.V.K. Ashraf · Kannan · G.U. Pope · V.V. Abdulla Sahib · ಪಾ. ಶ. ಶ್ರೀನಿವಾಸ · Gurucharan · M.G. Venkatakrishnan · Gnanou Diagou · Dr. Yu Hsi · Vithali Furniki · Albrecht Frenz & K. Lalithambal · Dr. Yousuf Kokan · G. Misihami & Dr. S. Tambayah

---

## 🔮 Roadmap
- [x] Audio *(v1.6)* · [x] English commentary *(v1.7)* · [x] Sinhala *(v1.7)*
- [ ] Search · [ ] Bookmarks · [ ] Daily kural · [ ] Dark mode · [ ] PWA · [ ] Share cards

---

**வாழ்க தமிழ்! வாழ்க திருக்குறள்!** — Built with ❤️ for Tamil literature | *v1.7, February 2026*
