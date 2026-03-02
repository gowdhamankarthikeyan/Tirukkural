// ============================================================
// languages.js — Single source of truth for native kural translations.
// To add a new language: add ONE entry to LANGUAGES below.
// Fields:
//   code    — language code matching thirukkural-{code}.json filename
//   label   — Native name (shown in UI buttons and dropdowns)
//   flag    — Emoji flag
//   fields  — [line1, line2] field names inside the JSON file
//   ttsCode — BCP-47 Web Speech API code (omit to disable TTS)
//   rtl     — true for right-to-left scripts (e.g. Arabic)
// ============================================================
const LANGUAGES = [
    { code: 'hi', label: 'हिंदी',    flag: '🇮🇳', fields: ['hindi1',    'hindi2'],    ttsCode: 'hi-IN' },
    { code: 'ml', label: 'മലയാളം',  flag: '🇮🇳', fields: ['malayalam1','malayalam2'], ttsCode: 'ml-IN' },
    { code: 'kn', label: 'ಕನ್ನಡ',  flag: '🇮🇳', fields: ['kannada1',  'kannada2'],  ttsCode: 'kn-IN' },
    { code: 'te', label: 'తెలుగు',  flag: '🇮🇳', fields: ['telugu1',   'telugu2'],   ttsCode: 'te-IN' },
    { code: 'fr', label: 'Français', flag: '🇫🇷', fields: ['french1',   'french2'],   ttsCode: 'fr-FR' },
    { code: 'zh', label: '中文',     flag: '🇹🇼', fields: ['chinese1',  'chinese2'],  ttsCode: 'zh-TW' },
    { code: 'ru', label: 'Русский',  flag: '🇷🇺', fields: ['russian1',  'russian2'],  ttsCode: 'ru-RU' },
    { code: 'de', label: 'Deutsch',  flag: '🇩🇪', fields: ['german1',   'german2'],   ttsCode: 'de-DE' },
    { code: 'si', label: 'සිංහල',   flag: '🇱🇰', fields: ['sinhala1',  'sinhala2'],  ttsCode: 'si-LK' },
    { code: 'pl', label: 'Polski',   flag: '🇵🇱', fields: ['polski1',  'polski2'],  ttsCode: 'pl-PL' },
    { code: 'ms', label: 'Melayu',   flag: '🇲🇾', fields: ['melayu1',  'melayu2'],  ttsCode: 'ms-MY' },
    { code: 'sv', label: 'Svenska',   flag: '🇸🇪', fields: ['svenska1',  'svenska2'],  ttsCode: 'sv-SE' },
    { code: 'ar', label: 'العربية',  flag: '🇸🇦', fields: ['arabic1',   'arabic2'],   ttsCode: 'ar-SA', rtl: true },
];
