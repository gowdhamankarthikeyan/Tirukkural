// Global variables
let kuralData = null;
let currentAthikaramId = 1;

// Languages that live in separate thirukkural-{lang}.json files (lazy-loaded)
// fields: the two field names inside each kural object for that language
// To add a new language: add one entry here only — audio is registered automatically.
// ttsCode: BCP-47 tag for Web Speech API (omit if no TTS support for that language)
const SPLIT_LANGS = {
    hi: { fields: ['hindi1',    'hindi2'],    ttsCode: 'hi-IN', ttsLabel: 'हिंदी'     },
    ml: { fields: ['malayalam1','malayalam2'], ttsCode: 'ml-IN', ttsLabel: 'മലയാളം'     },
    kn: { fields: ['kannada1',  'kannada2'],  ttsCode: 'kn-IN', ttsLabel: 'ಕನ್ನಡ'     },
    te: { fields: ['telugu1',   'telugu2'],   ttsCode: 'te-IN', ttsLabel: 'తెలుగు'   },
    fr: { fields: ['french1',   'french2'],   ttsCode: 'fr-FR', ttsLabel: 'Français'    },
    zh: { fields: ['chinese1',  'chinese2'],  ttsCode: 'zh-TW', ttsLabel: '中文'    },
    ru: { fields: ['russian1',  'russian2'],  ttsCode: 'ru-RU', ttsLabel: 'Pусский' },
};
const _translationCache = {}; // tracks which langs have been loaded

// Merge a split translation file's data into kuralData
async function loadTranslationData(lang) {
    if (!SPLIT_LANGS[lang]) return;
    if (_translationCache[lang]) return; // already merged this session
    const CACHE_KEY = `tirukkural_trans_${lang}_v1`;
    try {
        // Try localStorage first
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const data = JSON.parse(cached);
            data.kural.forEach(t => {
                const kural = kuralData[t.Number - 1];
                if (kural) Object.assign(kural, t);
            });
            _translationCache[lang] = true;
            // Refresh in background
            fetch(`thirukkural-${lang}.json`)
                .then(r => r.json())
                .then(fresh => localStorage.setItem(CACHE_KEY, JSON.stringify(fresh)))
                .catch(() => {});
            return;
        }
        // Not cached yet — fetch, merge, then cache
        const res = await fetch(`thirukkural-${lang}.json`);
        const data = await res.json();
        data.kural.forEach(t => {
            const kural = kuralData[t.Number - 1];
            if (kural) Object.assign(kural, t);
        });
        _translationCache[lang] = true;
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch(e) {}
    } catch (e) {
        console.error(`Failed to load thirukkural-${lang}.json`, e);
    }
}

// ============================================================
// TTS CONFIG — Tamil + English always present.
// All SPLIT_LANGS entries with a ttsCode are registered automatically.
// ============================================================
const TTS_LANGUAGES = {
    ta: { code: 'ta-IN',                     label: 'தமிழ்',  fields: ['Line1', 'Line2'],                   audioPath: 'ta' },
    en: { code: 'en-IN', fallback: 'en-US',  label: 'English', fields: ['bharati_verse1', 'bharati_verse2'], audioPath: 'en' },
};
Object.entries(SPLIT_LANGS).forEach(([lang, cfg]) => {
    if (cfg.ttsCode) {
        TTS_LANGUAGES[lang] = { code: cfg.ttsCode, label: cfg.ttsLabel, fields: cfg.fields, audioPath: lang };
    }
});

const AUDIO_BASE = '/audio';

let _currentAudio = null;
let _currentBtn = null;
let _currentUtterance = null;

function _ttsHasContent(lang, kural) {
    const cfg = TTS_LANGUAGES[lang];
    return cfg && cfg.fields.some(f => kural[f]);
}

function _ttsBuildText(lang, kural) {
    const cfg = TTS_LANGUAGES[lang];
    if (!cfg) return '';
    return cfg.fields.map(f => kural[f] || '').join(' ').trim();
}

function _ttsGetLangs(kural) {
    const uiLang = window.getCurrentLanguage ? window.getCurrentLanguage() : 'ta';
    const langs = ['ta'];
    if (uiLang !== 'ta' && TTS_LANGUAGES[uiLang] && _ttsHasContent(uiLang, kural)) {
        langs.push(uiLang);
    }
    return langs.filter(l => _ttsHasContent(l, kural));
}

function _ttsSetState(btn, state) {
    btn.classList.remove('playing');
    if (state === 'playing') {
        btn.classList.add('playing');
        btn.querySelector('.audio-btn-icon').textContent = '⏹';
    } else {
        btn.querySelector('.audio-btn-icon').textContent = '▶';
    }
}

function _ttsStop() {
    if (_currentAudio) { _currentAudio.pause(); _currentAudio.currentTime = 0; _currentAudio = null; }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    _currentUtterance = null;
    if (_currentBtn) _ttsSetState(_currentBtn, 'idle');
    _currentBtn = null;
}

function _ttsPlay(kuralNumber, lang, langConfig, btn) {
    if (btn.classList.contains('playing')) { _ttsStop(); return; }
    _ttsStop();
    _currentBtn = btn;
    const audio = new Audio(`${AUDIO_BASE}/${langConfig.audioPath}/${kuralNumber}.mp3`);
    let fallbackCalled = false;
    const fallback = () => {
        if (fallbackCalled) return;
        fallbackCalled = true;
        _currentAudio = null;
        _ttsSpeakFallback(langConfig, btn);
    };
    audio.onplay  = () => _ttsSetState(btn, 'playing');
    audio.onended = () => { _currentAudio = null; _currentBtn = null; _ttsSetState(btn, 'idle'); };
    audio.onpause = () => { if (!audio.ended) _ttsSetState(btn, 'idle'); };
    audio.onerror = fallback;
    _currentAudio = audio;
    audio.play().catch(fallback);
}

function _ttsSpeakFallback(langConfig, btn) {
    if (!('speechSynthesis' in window)) { _ttsSetState(btn, 'idle'); return; }
    const text = btn.getAttribute('data-text');
    if (!text || !text.trim()) { _ttsSetState(btn, 'idle'); return; }
    _currentBtn = btn;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langConfig.code;
    utterance.rate = 0.85;
    const speak = () => {
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.lang === langConfig.code)
            || (langConfig.fallback && voices.find(v => v.lang === langConfig.fallback))
            || voices.find(v => v.lang.startsWith(langConfig.code.split('-')[0]));
        if (voice) utterance.voice = voice;
        utterance.onstart = () => _ttsSetState(btn, 'playing');
        utterance.onend   = () => { _currentUtterance = null; _currentBtn = null; _ttsSetState(btn, 'idle'); };
        utterance.onerror = () => { _currentUtterance = null; _currentBtn = null; _ttsSetState(btn, 'idle'); };
        _currentUtterance = utterance;
        window.speechSynthesis.speak(utterance);
    };
    if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = speak;
    } else { speak(); }
}

function createAudioHTML(kural) {
    const langs = _ttsGetLangs(kural);
    if (langs.length === 0) return '';
    const btns = langs.map(key => {
        const cfg = TTS_LANGUAGES[key];
        const text = _ttsBuildText(key, kural);
        return `<button class="audio-play-btn" data-lang="${key}" data-kuralnum="${kural.Number}" data-text="${text.replace(/"/g, '&quot;')}" title="Listen in ${cfg.label}">
            <span class="audio-btn-icon" style="font-size:1.1rem">&#9654;</span>
            <span>${cfg.label}</span>
        </button>`;
    }).join('');
    return `<div class="audio-section"><span class="audio-label">&#128266; Listen</span>${btns}<button class="audio-info-btn" onclick="showAudioHelpModal(event)" title="Audio help">&#9432;</button></div>`;
}

function setupAudioButtonsForCard(card, kural) {
    card.querySelectorAll('.audio-play-btn').forEach(btn => {
        const lang = btn.getAttribute('data-lang');
        const cfg = TTS_LANGUAGES[lang];
        if (!cfg) return;
        btn.addEventListener('click', () => _ttsPlay(kural.Number, lang, cfg, btn));
    });
}



document.addEventListener('DOMContentLoaded', async function() {
    // Show skeleton immediately so the page feels responsive
    const kuralsContainer = document.getElementById('kurals-list');
    if (kuralsContainer) {
        kuralsContainer.innerHTML = '<div class="loading">Loading…</div>';
    }

    // 1. Wait for language.js to finish loading translations
    await waitForTranslations();

    // Now translations are ready — update loading text to the correct language
    if (kuralsContainer && kuralsContainer.querySelector('.loading')) {
        kuralsContainer.querySelector('.loading').textContent = window.t ? window.t('loading_kurals') : 'Loading…';
    }

    // 2. Load athikarams metadata
    await new Promise(resolve => {
        const s = document.createElement('script');
        s.src = 'athikarams-data.js';
        s.onload = resolve;
        document.head.appendChild(s);
    });

    // 3. Load kural data — localStorage first for instant load on return visits
    try {
        const KURAL_CACHE_KEY = 'tirukkural_kural_data_v1';
        const cached = localStorage.getItem(KURAL_CACHE_KEY);
        if (cached) {
            kuralData = JSON.parse(cached);
            // Refresh in background silently
            fetch('thirukkural.json')
                .then(r => r.json())
                .then(fresh => localStorage.setItem(KURAL_CACHE_KEY, JSON.stringify(fresh.kural)))
                .catch(() => {});
        } else {
            const response = await fetch('thirukkural.json');
            const data = await response.json();
            kuralData = data.kural;
            try { localStorage.setItem(KURAL_CACHE_KEY, JSON.stringify(data.kural)); } catch(e) {}
        }
    } catch (e) {
        if (kuralsContainer) kuralsContainer.innerHTML =
            '<div class="loading">தரவு ஏற்றுவதில் பிழை. பக்கத்தை மீண்டும் ஏற்றவும்.</div>';
        return;
    }

    // 4. Pre-load split file for current UI language so audio buttons appear on first render
    const initialLang = window.getCurrentLanguage ? window.getCurrentLanguage() : 'ta';
    if (SPLIT_LANGS[initialLang]) {
        await loadTranslationData(initialLang);
    }

    // Get athikaram ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const athikaramId = parseInt(urlParams.get('id')) || 1;
    currentAthikaramId = athikaramId;

    // Display athikaram with all kurals
    displayAthikaram(currentAthikaramId);

    // Setup navigation
    setupNavigation();

    // Wrap changeLanguage to lazy-load split translation files before re-rendering
    const _origChangeLanguage = window.changeLanguage;
    window.changeLanguage = async function(langCode) {
        if (SPLIT_LANGS[langCode] && kuralData) {
            await loadTranslationData(langCode);
        }
        _origChangeLanguage(langCode);
    };
});

// Wait for language.js to finish loading translations data
function waitForTranslations() {
    return new Promise(resolve => {
        // window.athikaram_names is set at the end of loadTranslations() in language.js
        // — it's the most reliable signal that the translations fetch is complete
        if (window.athikaram_names) {
            resolve();
        } else {
            const checkInterval = setInterval(() => {
                if (window.athikaram_names) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 50);
        }
    });
}

function getAthikaramById(id) {
    return ATHIKARAMS.find(a => a.id === id);
}

function displayAthikaram(athikaramId) {
    if (!kuralData) {
        return;
    }
    
    const athikaram = getAthikaramById(athikaramId);
    if (!athikaram) {
        document.getElementById('kurals-list').innerHTML = 
            '<div class="loading">அதிகாரம் கிடைக்கவில்லை</div>';
        return;
    }
    
    // Get translated text
    const chapterText = window.t ? window.t('chapter') : 'அதிகாரம்';
    const kuralText = window.t ? window.t('couplet') : 'குறள்';
    
    // Get translated athikaram name
    let athikaramNameEn = athikaram.en;
    const currentLang = window.getCurrentLanguage ? window.getCurrentLanguage() : 'ta';
    
    if (window.athikaram_names && 
        window.athikaram_names[currentLang] && 
        window.athikaram_names[currentLang][athikaram.id.toString()]) {
        athikaramNameEn = window.athikaram_names[currentLang][athikaram.id.toString()];
    }
    
    // Display header
    const headerContainer = document.getElementById('athikaram-header');
    headerContainer.innerHTML = `
        <div class="athikaram-header-box">
            <div class="athikaram-number-large">${chapterText} ${athikaram.id}</div>
            <h2 class="athikaram-title-large-ta">${athikaram.ta}</h2>
            <p class="athikaram-title-large-en">${athikaramNameEn}</p>
            <p class="athikaram-range-large">${kuralText} ${athikaram.start} - ${athikaram.end}</p>
        </div>
    `;
    
    if (window.speechSynthesis) window.speechSynthesis.cancel();

    // Display all kurals in this athikaram
    const kuralsContainer = document.getElementById('kurals-list');
    kuralsContainer.innerHTML = '';
    
    for (let kuralNum = athikaram.start; kuralNum <= athikaram.end; kuralNum++) {
        const kural = kuralData[kuralNum - 1];
        if (kural) {
            const kuralCard = createKuralCard(kural, athikaram);
            kuralsContainer.appendChild(kuralCard);
            setupAudioButtonsForCard(kuralCard, kural);
        }
    }
    
    // Setup translate buttons after all kurals are rendered
    setupExplanationTranslateButtons();

    // Update page SEO for this athikaram
    const firstKural = kuralData[athikaram.start - 1];
    updatePageSEO(athikaram, firstKural ? firstKural.ashraf : '');
    
    // Update URL
    const url = new URL(window.location);
    url.searchParams.set('id', athikaramId);
    window.history.pushState({}, '', url);
}

function createKuralCard(kural, athikaram) {
    const card = document.createElement('div');
    card.className = 'kural-card';
    
    // Split kural into proper format
    const line1Words = kural.Line1.trim().split(' ');
    const line2Words = kural.Line2.trim().split(' ');
    
    // Format transliteration OR native language translation OR Bharati English verse
    const currentLang = window.getCurrentLanguage ? window.getCurrentLanguage() : 'ta';
    let line1Display = kural.transliteration1 || '';
    let line2Display = kural.transliteration2 || '';
    let isBharatiVerse = false;

    if (currentLang === 'en' && kural.bharati_verse1 && kural.bharati_verse2) {
        // English: show Shuddhananda Bharatiar's poetic verse
        line1Display = kural.bharati_verse1;
        line2Display = kural.bharati_verse2;
        isBharatiVerse = true;
    } else if (SPLIT_LANGS[currentLang]) {
        // Any language with a thirukkural-{lang}.json file — use its fields if loaded,
        // otherwise fall back to English transliteration
        const [f1, f2] = SPLIT_LANGS[currentLang].fields;
        if (kural[f1] && kural[f2]) {
            line1Display = kural[f1];
            line2Display = kural[f2];
        } else if (kural.bharati_verse1 && kural.bharati_verse2) {
            // Translation file not yet loaded — fall back to English
            line1Display = kural.bharati_verse1;
            line2Display = kural.bharati_verse2;
            isBharatiVerse = true;
        }
    }
    // All other languages (ta, es, de, zh, ar, ru, ja…): use transliteration
    
    // Get translated text
    const kuralText = window.t ? window.t('couplet') : 'குறள்';
    const explText = window.t ? window.t('explanations') : 'விளக்கங்கள்';
    const scholarMV = window.t ? window.t('scholar_mv') : 'மு. வரதராசனார்';
    const scholarSP = window.t ? window.t('scholar_sp') : 'சாலமன் பாப்பையா';
    const scholarMK = window.t ? window.t('scholar_mk') : 'கலைஞர்';
    const translateBtn = window.t ? window.t('translate') : 'Translate';
    
    card.innerHTML = `
        <div class="kural-card-header">
            <div class="kural-number-small">${kuralText} ${kural.Number}</div>
        </div>
        
        <div class="kural-text-section-compact">
            <div class="kural-tamil-compact">
                <span class="kural-line">${line1Words.join(' ')}</span>
                <span class="kural-line">${line2Words.join(' ')}</span>
            </div>
            <div class="transliteration-compact${isBharatiVerse ? ' bharati-verse' : ''}">
                <span class="transliteration-line">${line1Display}</span>
                <span class="transliteration-line">${line2Display}</span>
            </div>
            ${createAudioHTML(kural)}
        </div>
        
        <div class="explanations-section-compact">
            <div class="explanations-label">${explText}</div>
            ${kural.mv ? `
            <div class="explanation-item-compact">
                <div class="explanation-header">
                    <div class="explanation-author-small">${scholarMV}</div>
                </div>
                <div class="explanation-text-small">${kural.mv}</div>
                <button class="explanation-translate-btn" data-text="${escapeHtml(kural.mv)}">${translateBtn}</button>
            </div>
            ` : ''}
            
            ${kural.sp ? `
            <div class="explanation-item-compact">
                <div class="explanation-header">
                    <div class="explanation-author-small">${scholarSP}</div>
                </div>
                <div class="explanation-text-small">${kural.sp}</div>
                <button class="explanation-translate-btn" data-text="${escapeHtml(kural.sp)}">${translateBtn}</button>
            </div>
            ` : ''}
            
            ${kural.mk ? `
            <div class="explanation-item-compact">
                <div class="explanation-header">
                    <div class="explanation-author-small">${scholarMK}</div>
                </div>
                <div class="explanation-text-small">${kural.mk}</div>
                <button class="explanation-translate-btn" data-text="${escapeHtml(kural.mk)}">${translateBtn}</button>
            </div>
            ` : ''}
        </div>

        ${kural.ashraf ? `
        <div class="english-translation-section">
            <div class="english-translation-header">
                <div class="english-translation-label">English</div>
            </div>
            <div class="english-translation-text">${kural.ashraf}</div>
            <div class="english-attribution">
                — ${kural.ashraf_attr || 'N.V.K. Ashraf'} · curated by
                <a href="contributors.html" class="attribution-link" target="_blank">N.V.K. Ashraf</a>
            </div>
            <button class="english-translate-btn" data-text="${escapeHtml(kural.ashraf)}">${translateBtn}</button>
        </div>
        ` : ''}
    `;
    
    return card;
}


// ── Dynamic SEO — updates title, meta, OG and JSON-LD per athikaram ──
function updatePageSEO(athikaram, firstKuralAshraf) {
    const id     = athikaram.id;
    const ta     = athikaram.ta;
    const en     = athikaram.en;
    const start  = athikaram.start;
    const end    = athikaram.end;
    const url    = `https://tirukkural.in/athikaram-view.html?id=${id}`;
    const title  = `${ta} (${en}) — Chapter ${id} | Tirukkuṟaḷ`;
    const desc   = firstKuralAshraf
        ? `"${firstKuralAshraf}" — Kural ${start}–${end}: ${en} (Chapter ${id}) of Tirukkuṟaḷ by Tiruvaḷḷuvar.`
        : `${en} — Couplets ${start}–${end} of Tirukkuṟaḷ. Tamil text, transliteration, scholar commentaries and English translation.`;

    // <title>
    document.title = title;

    // <meta> tags
    const setMeta = (sel, val) => { const el = document.querySelector(sel); if (el) el.setAttribute('content', val); };
    setMeta('meta[name="title"]',       title);
    setMeta('meta[name="description"]', desc);

    // Canonical
    const canon = document.getElementById('canonical-url');
    if (canon) canon.setAttribute('href', url);

    // Open Graph
    const setOg = (id, val) => { const el = document.getElementById(id); if (el) el.setAttribute('content', val); };
    setOg('og-url',   url);
    setOg('og-title', title);
    setOg('og-desc',  desc);

    // Twitter
    setOg('tw-title', title);
    setOg('tw-desc',  desc);

    // JSON-LD — replace or insert
    const existingLd = document.getElementById('chapter-ld');
    if (existingLd) existingLd.remove();
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.id   = 'chapter-ld';
    ld.text = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Chapter",
        "name": `${ta} — ${en}`,
        "position": id,
        "url": url,
        "description": desc,
        "inLanguage": "ta",
        "isPartOf": {
            "@type": "Book",
            "name": "Tirukkuṟaḷ",
            "author": { "@type": "Person", "name": "Tiruvaḷḷuvar" },
            "url": "https://tirukkural.in"
        }
    });
    document.head.appendChild(ld);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function setupExplanationTranslateButtons() {
    // Tamil explanation buttons → translate Tamil → chosen language (default: English)
    const translateBtns = document.querySelectorAll('.explanation-translate-btn');
    
    translateBtns.forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.preventDefault();
            const text = this.getAttribute('data-text');
            const encodedText = encodeURIComponent(text);

            // Translate to chosen language; if Tamil or English is selected, default to English
            const lang = window.getCurrentLanguage ? window.getCurrentLanguage() : 'ta';
            const tl = (lang === 'ta' || lang === 'en') ? 'en' : lang;
            
            // Check if device is mobile
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            if (isMobile) {
                // On mobile: Try to copy first, then open translate
                try {
                    // Try copying to clipboard
                    await navigator.clipboard.writeText(text);
                    
                    // Brief feedback
                    const originalText = this.textContent;
                    this.textContent = 'Opening...';
                    this.style.background = 'linear-gradient(135deg, #34a853 0%, #34a853 100%)';
                    
                    // Open Google Translate after brief delay
                    setTimeout(() => {
                        const translateUrl = `https://translate.google.com/?sl=ta&tl=${tl}&text=${encodedText}&op=translate`;
                        window.open(translateUrl, '_blank');
                        
                        // Reset button
                        this.textContent = originalText;
                        this.style.background = '';
                    }, 500);
                } catch (err) {
                    // If clipboard fails, just open translate
                    const translateUrl = `https://translate.google.com/?sl=ta&tl=${tl}&text=${encodedText}&op=translate`;
                    window.open(translateUrl, '_blank');
                }
            } else {
                // On desktop: Open Google Translate in new window
                const translateUrl = `https://translate.google.com/?sl=ta&tl=${tl}&text=${encodedText}&op=translate`;
                window.open(translateUrl, '_blank', 'width=900,height=700');
            }
        });
    });

    // English translation buttons → translate English → user's current language
    const englishBtns = document.querySelectorAll('.english-translate-btn');

    englishBtns.forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.preventDefault();
            const text = this.getAttribute('data-text');
            const encodedText = encodeURIComponent(text);

            // Use current site language as target; fall back to 'ta'
            const tl = (window.getCurrentLanguage && window.getCurrentLanguage() !== 'en')
                ? window.getCurrentLanguage()
                : 'ta';

            const translateUrl = `https://translate.google.com/?sl=en&tl=${tl}&text=${encodedText}&op=translate`;

            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

            if (isMobile) {
                try {
                    await navigator.clipboard.writeText(text);

                    const originalText = this.textContent;
                    this.textContent = 'Opening...';
                    this.style.background = 'linear-gradient(135deg, #34a853 0%, #34a853 100%)';

                    setTimeout(() => {
                        window.open(translateUrl, '_blank');
                        this.textContent = originalText;
                        this.style.background = '';
                    }, 500);
                } catch (err) {
                    window.open(translateUrl, '_blank');
                }
            } else {
                window.open(translateUrl, '_blank', 'width=900,height=700');
            }
        });
    });
}

function setupNavigation() {
    const prevBtn = document.getElementById('prev-athikaram');
    const nextBtn = document.getElementById('next-athikaram');
    
    prevBtn.addEventListener('click', function() {
        if (currentAthikaramId > 1) {
            currentAthikaramId--;
            displayAthikaram(currentAthikaramId);
            updateNavigationButtons();
            window.scrollTo(0, 0);
        }
    });
    
    nextBtn.addEventListener('click', function() {
        if (currentAthikaramId < 133) {
            currentAthikaramId++;
            displayAthikaram(currentAthikaramId);
            updateNavigationButtons();
            window.scrollTo(0, 0);
        }
    });
    
    updateNavigationButtons();
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-athikaram');
    const nextBtn = document.getElementById('next-athikaram');
    
    prevBtn.disabled = currentAthikaramId <= 1;
    nextBtn.disabled = currentAthikaramId >= 133;
}

// ── Audio Help Modal ──
function showAudioHelpModal(e) {
    e.stopPropagation();
    let modal = document.getElementById('audioHelpModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'audioHelpModal';
        modal.className = 'audio-help-overlay';
        modal.innerHTML = `
            <div class="audio-help-box">
                <button class="audio-help-close" onclick="document.getElementById('audioHelpModal').classList.add('hidden')">&times;</button>
                <h3 class="audio-help-title">&#128266; Audio Playback Help</h3>
                <p class="audio-help-intro">This site uses your device's built-in text-to-speech engine. If a language doesn't play or sounds incorrect, follow the steps for your device:</p>

                <div class="audio-help-section">
                    <div class="audio-help-platform">&#63743; iPhone &amp; iPad (iOS)</div>
                    <ol>
                        <li>Open <strong>Settings → Accessibility → Spoken Content → Voices</strong></li>
                        <li>Select the language (e.g. Tamil, Telugu, Kannada)</li>
                        <li>Download the voice by tapping it — wait for download to complete</li>
                        <li>Reload this page and try again</li>
                    </ol>
                </div>

                <div class="audio-help-section">
                    <div class="audio-help-platform">&#63743; Mac (Safari / Chrome)</div>
                    <ol>
                        <li>Open <strong>System Settings → Accessibility → Spoken Content</strong></li>
                        <li>Click <strong>Manage Voices…</strong> and find your language</li>
                        <li>Click the download icon next to the voice and wait</li>
                        <li>Reload this page — Chrome may need a restart</li>
                    </ol>
                </div>

                <div class="audio-help-section">
                    <div class="audio-help-platform">&#9654; Android</div>
                    <ol>
                        <li>Open <strong>Settings → General Management → Language → Text-to-Speech</strong></li>
                        <li>Under <strong>Google Text-to-Speech Engine</strong>, tap the gear icon</li>
                        <li>Tap <strong>Install voice data</strong> and download your language</li>
                        <li>Return here and reload the page</li>
                    </ol>
                </div>

                <div class="audio-help-section">
                    <div class="audio-help-platform">&#9112; Windows (Chrome / Edge)</div>
                    <ol>
                        <li>Open <strong>Settings → Time &amp; Language → Language &amp; Region</strong></li>
                        <li>Click <strong>Add a language</strong> and add your language (e.g. Telugu)</li>
                        <li>Click the language → <strong>Options</strong> → download the <strong>Text-to-speech</strong> pack</li>
                        <li>Restart your browser and reload this page</li>
                    </ol>
                </div>

                <p class="audio-help-note">&#128161; <strong>Tip:</strong> English audio works on most devices without any setup. Other languages (Tamil, Telugu, Kannada, Malayalam, Hindi, French, Chinese) may require a one-time voice download.</p>
            </div>
        `;
        modal.addEventListener('click', function(ev) {
            if (ev.target === modal) modal.classList.add('hidden');
        });
        document.body.appendChild(modal);
    }
    modal.classList.remove('hidden');
}
