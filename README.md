# திருக்குறள் — Tirukkuṟaḷ Multilingual Website

A free, ad-free web application for exploring the timeless wisdom of Tirukkuṟaḷ (திருக்குறள்) — all 1,330 couplets across 133 chapters, with Tamil text, transliteration, three classical Tamil commentaries, curated English translation and support for 100+ languages.

🌐 **Live site:** https://tirukkural.in

![Version](https://img.shields.io/badge/version-1.5-blue)
![Languages](https://img.shields.io/badge/navigation-14%20languages-green)
![Translate](https://img.shields.io/badge/Google%20Translate-100%2B%20languages-orange)
![License](https://img.shields.io/badge/license-Educational-purple)

---

## 🌟 Features

### 📚 Complete Content
- **1,330 Couplets** — All kurals with Tamil text and transliteration
- **133 Chapters** (Athikarams) — Organised into three books (Paal)
- **3 Books** — Virtue (அறத்துப்பால்), Wealth (பொருட்பால்), Love (காமத்துப்பால்)

### 🔤 Three Classical Tamil Commentaries
Expert explanations from three revered scholars, each with a one-click Google Translate button:
- **மு. வரதராசனார்** (Mu. Varadarasanar) — Classical scholarly interpretation
- **சாலமன் பாப்பையா** (Solomon Pappaiah) — Contemporary, accessible insights
- **கலைஞர் எம். கருணாநிதி** (Kalaignar M. Karunanidhi) — Modern rationalist perspective

### 🇬🇧 Curated English Translation — N.V.K. Ashraf
Every kural includes a carefully curated English translation assembled by researcher **N.V.K. Ashraf**, who spent 18 years comparing **25+ scholarly translations** to hand-pick the finest rendering of each kural — prioritising faithfulness to Valluvar's brevity, spirit and wordplay.

- 33% from P.S. Sundaram (Penguin, 1990) — closest to Valluvar's terseness
- ~15% original translations by Ashraf himself
- Remaining 50%+ drawn from 15+ other translators including G.U. Pope, Rajaji, V.V.S. Aiyar and more
- Every translation credited with the original translator's initials
- Full methodology: https://kuraltranslations.blogspot.com

### 🌍 100+ Language Support via Google Translate
The site's defining feature — every kural's Tamil commentaries and English translation can be instantly translated into **100+ languages** with one click. Tamil diaspora worldwide and non-Tamil readers can access Valluvar's wisdom in their own language.

### 🗺️ 14-Language Navigation
The entire site interface — menus, labels, chapter names, buttons — translates to:

| Indian Languages | International Languages |
|---|---|
| 🇮🇳 தமிழ் (Tamil) — Default | 🇬🇧 English |
| 🇮🇳 हिंदी (Hindi) | 🇪🇸 Español (Spanish) |
| 🇮🇳 తెలుగు (Telugu) | 🇫🇷 Français (French) |
| 🇮🇳 മലയാളം (Malayalam) | 🇩🇪 Deutsch (German) |
| 🇮🇳 ಕನ್ನಡ (Kannada) | 🇨🇳 中文 (Chinese) |
| 🇮🇳 বাংলা (Bengali) | 🇸🇦 العربية (Arabic) |
| | 🇷🇺 Русский (Russian) |
| | 🇯🇵 日本語 (Japanese) |

### ✨ Other Capabilities
- 🔄 **Instant Language Switching** — No page reload required
- 📱 **Responsive Design** — Optimised for mobile, tablet and desktop
- ⚡ **Fast & Lightweight** — No frameworks, pure vanilla JS
- 💾 **Persistent Preferences** — Language choice saved via cookies
- 📊 **Visit Counter** — Real-time visitor count via GoatCounter
- 💬 **Comments** — Disqus integration per chapter
- 🔍 **SEO Optimised** — Dynamic per-chapter title, meta description and JSON-LD structured data

---

## 🚀 Quick Start

### Prerequisites
- A web server (Apache, Nginx, or any static file server)
- Modern web browser with JavaScript enabled

### Installation

1. **Clone or Download**
   ```bash
   git clone https://github.com/gowdhamankarthikeyan/thirukkural.git
   cd thirukkural
   ```

2. **Deploy to Web Server**

   **Option A: Using Apache**
   ```bash
   sudo cp -r * /var/www/html/thirukkural/
   sudo a2enmod rewrite
   sudo systemctl restart apache2
   ```

   **Option B: Using Nginx**
   ```bash
   sudo cp -r * /usr/share/nginx/html/thirukkural/
   sudo systemctl restart nginx
   ```

   **Option C: Simple HTTP Server (Development)**
   ```bash
   python3 -m http.server 8000
   # or
   npx http-server -p 8000
   ```

3. **Access the Site**
   ```
   http://localhost:8000
   ```

---

## 📁 Project Structure

```
tirukkural/
├── index.html              # Homepage — three books + visit counter
├── athikarams.html         # Chapter listing page (all 133 chapters)
├── athikaram-view.html     # Single chapter view (10 kurals + commentaries)
├── kural.html              # Single kural detailed view
├── contributors.html       # Contributors & resources page
├── styles.css              # Global styles
├── language.js             # Language management system
├── translations.json       # All UI translations (14 languages, 148KB)
├── athikarams-data.js      # Chapter metadata (id, Tamil name, English name, range)
├── athikarams.js           # Chapter listing logic
├── athikaram-view.js       # Chapter view logic + dynamic SEO updater
├── kural.js                # Single kural view logic
├── thirukkural.json        # Complete kural database (2.3MB)
├── thiruvalluvar-logo.svg  # Logo
├── sitemap.xml             # 136-URL sitemap for Google/Bing
├── robots.txt              # Crawler instructions
├── .htaccess               # Apache rewrite rules
└── README.md               # This file
```

---

## 📊 Data Schema

### thirukkural.json
Each kural object contains:

```json
{
  "Number": 1,
  "Line1": "அகர முதல எழுத்தெல்லாம்",
  "Line2": "ஆதி பகவன் முதற்றே உலகு",
  "transliteration1": "Agara mudala ezhuthellaam",
  "transliteration2": "Aadhi bagavan mudattre ulagu",
  "mv": "மு. வரதராசனார் commentary text...",
  "sp": "சாலமன் பாப்பையா commentary text...",
  "mk": "கலைஞர் commentary text...",
  "ashraf": "With alpha begins all alphabets; And the world with the first Bagavan.",
  "ashraf_attr": "KN, SI"
}
```

### translations.json (148KB)
- 14 languages × full UI translation
- 665 athikaram name translations (Tamil + 5 Indian languages)
- All labels, navigation, welcome modal, stat titles

### athikarams-data.js
```javascript
{ id: 1, ta: "கடவுள் வாழ்த்து", en: "The Praise of God", paal: 1, paalName: "அறத்துப்பால்", start: 1, end: 10 }
```

---

## 🎨 Translation System

### How It Works
1. **UI Translation** — All buttons, labels and navigation translate to the selected language
2. **Chapter Names** — Tamil + 5 Indian languages show native translations; other languages show English
3. **Commentary Translation** — One-click Google Translate opens any Tamil commentary in the user's chosen language
4. **English Translation** — One-click translate sends Ashraf's English text to Google Translate in the user's language
5. **Persistent State** — Language preference saved in cookies

### Translation Coverage
| Element | Coverage |
|---|---|
| UI labels & navigation | 100% — all 14 languages |
| Chapter names (Tamil) | 100% — original Tamil |
| Chapter names (English) | 100% — all 133 chapters |
| Chapter names (Hindi, Telugu, Malayalam, Kannada, Bengali) | 100% — 133 chapters each |
| Chapter names (other 8 languages) | English used |

---

## 🔍 SEO Architecture

Each page has unique, optimised meta tags:

- **`<title>`** — Dynamic per chapter: *"கடவுள் வாழ்த்து (The Praise of God) — Chapter 1 | Tirukkuṟaḷ"*
- **`<meta description>`** — First kural's English text + chapter info (≤160 chars)
- **`<link rel="canonical">`** — Per-page canonical URL
- **Open Graph tags** — WhatsApp, Facebook and LinkedIn share previews
- **Twitter Card tags** — Twitter/X share previews
- **JSON-LD structured data** — `Book` on homepage, `Chapter` on chapter pages
- **sitemap.xml** — All 136 URLs submitted to Google Search Console and Bing Webmaster Tools

Dynamic SEO is updated by `updatePageSEO()` in `athikaram-view.js` on every chapter load and navigation.

---

## 🌐 Adding a New Language

1. **Edit `translations.json`** — add language to `languages` array and add a full translation object:

```json
{
  "languages": [
    { "code": "pt", "name": "Portuguese", "native": "Português", "flag": "🇵🇹" }
  ],
  "translations": {
    "pt": {
      "home": "Início",
      "chapters": "Capítulos",
      "visits": "Visitas",
      ...
    }
  },
  "athikaram_names": {
    "pt": {
      "1": "O Louvor de Deus",
      ...
    }
  }
}
```

2. **No code changes needed** — the system detects and uses new languages automatically.

---

## 📱 Mobile Features

- Touch-optimised interface
- Smart translate button — copies Tamil text to clipboard, then opens Google Translate
- Responsive typography and navigation
- HTTPS required for clipboard API (works on all modern mobile browsers)

---

## 🐛 Troubleshooting

**Translations not loading**
Check browser console for errors. Ensure `translations.json` is served with `Content-Type: application/json`.

**Chapter names still in English after language switch**
1. Upload the latest `translations.json`
2. Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
3. Check browser console for JS errors

**Visit counter showing `—`**
The counter fetches from `https://tirukkural.goatcounter.com/counter/TOTAL.json`. If blocked by an ad-blocker, it silently shows `—`. This is expected.

**Mobile translate not working**
Requires HTTPS. Clipboard API unavailable on HTTP. Test on Chrome or Edge mobile.

---

## 🏆 Version History

### v1.5 — SEO, Ashraf Translations & Domain (February 2026)
- New domain: **tirukkural.in** (aligns with Wikipedia's canonical spelling)
- Replaced three legacy English translations with **N.V.K. Ashraf's curated best-of-25+ translations**
- Every translation credited with original translator's initials
- Added `contributors.html` — full acknowledgement of all translators and scholars
- **Dynamic SEO per chapter** — unique title, meta description, canonical URL, Open Graph, Twitter Card and JSON-LD
- `sitemap.xml` (136 URLs) + `robots.txt` submitted to Google Search Console and Bing
- GoatCounter visit counter updated to `tirukkural.goatcounter.com`
- Real-time visit count via GoatCounter JSON API (matches site stat tile style)
- Added Contributors & Resources tab to all pages
- Spelling updated throughout: **Tirukkuṟaḷ** and **Tiruvaḷḷuvar** (scholarly diacritics)
- All GoatCounter, meta and UI references updated to new domain
- Listed on **Wikipedia** — Kural article external links

### v1.4 — Indian Language Translations
- Complete athikaram name translations for Hindi, Telugu, Malayalam, Kannada, Bengali (665 names)

### v1.3 — 14 Language Support
- Added Spanish, French, German, Chinese, Arabic, Russian, Japanese
- Welcome modal with site USP flyout
- Cookie persistence for language preference

### v1.2 — UX Improvements
- Compact display, improved mobile UX, clickable logo

### v1.1 — Branding
- Logo, responsive design, ⚖️ icon for Virtue book

### v1.0 — Initial Release
- Core features: Tamil text, transliteration, 3 commentaries, chapter navigation

---

## 🤝 Contributing

### Ways to Contribute

1. **Add/Improve Translations** — Fork → edit `translations.json` → pull request
2. **Report Bugs** — GitHub Issues with browser, OS, steps to reproduce
3. **Suggest Features** — Open a GitHub Issue with "Feature:" prefix
4. **Improve English Translations** — If you find a better rendering than Ashraf's selection for any kural, open an issue with the kural number, current text and suggested alternative with source

---

## 📜 License

This project is a cultural and educational resource.

- **Tirukkuṟaḷ text** — Public domain (composed ~31 BCE–1 CE)
- **Tamil commentaries** — Reproduced for educational purposes; copyright with respective estates
- **Ashraf's curated translations** — Credit to N.V.K. Ashraf and original translators (initials in `ashraf_attr`)
- **Code** — Available for educational and non-commercial use

### Attribution
Please credit:
- **திருவள்ளுவர்** (Tiruvaḷḷuvar) — Original author
- **N.V.K. Ashraf** — Curated English translations
- **மு. வரதராசனார், சாலமன் பாப்பையா, கலைஞர்** — Tamil commentators

---

## 🙏 Acknowledgements

- **திருவள்ளுவர்** — For this eternal wisdom
- **N.V.K. Ashraf** — 18 years of comparative translation research (https://kuraltranslations.blogspot.com)
- **மு. வரதராசனார்** — Scholarly classical commentary
- **சாலமன் பாப்பையா** — Modern interpretation
- **கலைஞர் எம். கருணாநிதி** — Contemporary humanist perspective
- All 25+ English translators whose work Ashraf compared — P.S. Sundaram, G.U. Pope, Rajaji, V.V.S. Aiyar and many more

---

## 🔮 Roadmap

- [ ] Audio pronunciation for each kural
- [ ] Search by keyword across all 1,330 kurals
- [ ] Bookmark kurals (persistent)
- [ ] Daily kural — email / push notification
- [ ] Dark mode
- [ ] PWA support (offline reading)
- [ ] Social share card per kural
- [ ] More navigation languages

---

## 💻 Technical Stack

- **Frontend** — Vanilla JavaScript (ES6+), no frameworks
- **Styling** — CSS3 with CSS Variables
- **Data** — JSON (thirukkural.json 2.3MB, translations.json 148KB)
- **Analytics** — GoatCounter (privacy-friendly, no cookies)
- **Comments** — Disqus
- **Total bundle** — ~3MB (2.3MB is the kural database)

---

## 📞 Support & Links

- **Live site** — https://tirukkural.in
- **GitHub** — https://github.com/gowdhamankarthikeyan/thirukkural
- **Issues** — https://github.com/gowdhamankarthikeyan/thirukkural/issues
- **Ashraf's translation blog** — https://kuraltranslations.blogspot.com

---

**Built with ❤️ for Tamil literature and cultural preservation**

**வாழ்க தமிழ்! வாழ்க திருக்குறள்!**

*Last updated: February 2026*
