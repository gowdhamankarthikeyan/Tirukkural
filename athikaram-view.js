// Global variables
let kuralData = null;
let currentAthikaramId = 1;

// LANGUAGES is defined in languages.js (loaded before this script in HTML)
// Build SPLIT_LANGS map from it for internal lazy-loading
const SPLIT_LANGS = Object.fromEntries(
    LANGUAGES.map(l => [l.code, { fields: l.fields, ttsCode: l.ttsCode, ttsLabel: l.label }])
);
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
    ta: { code: 'ta-IN',                    label: 'தமிழ்',  fields: ['Line1', 'Line2'],                   audioPath: 'ta' },
    en: { code: 'en-IN', fallback: 'en-US', label: 'English', fields: ['ashraf_line1', 'ashraf_line2'], audioPath: 'en' },
};
// Auto-register all LANGUAGES entries that have a ttsCode
LANGUAGES.filter(l => l.ttsCode).forEach(l => {
    TTS_LANGUAGES[l.code] = { code: l.ttsCode, label: l.label, fields: l.fields, audioPath: l.code };
});

const AUDIO_BASE = '/audio';

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

function _ttsPlay(kuralNumber, lang, langConfig, btn) {
    TTSShared.play({
        btn: btn,
        kuralNumber: kuralNumber,
        langCode: lang,
        ttsCode: langConfig.code,
        ttsFallbackCode: langConfig.fallback,
        text: btn.getAttribute('data-text') || '',
        audioPath: langConfig.audioPath
    });
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
        // Always merge English commentary (Kannan + Pope) — must run after kuralData is set
        try {
            const ENKEY = 'tirukkural_en_v1';
            const enCached = localStorage.getItem(ENKEY);
            const mergeEn = (enData) => {
                enData.kural.forEach(t => {
                    const k = kuralData[t.Number - 1];
                    if (k) { k.kannan_exp = t.kannan_exp; k.pope_exp = t.pope_exp; }
                });
            };
            if (enCached) {
                mergeEn(JSON.parse(enCached));
                fetch('thirukkural-en.json').then(r=>r.json()).then(f=>localStorage.setItem(ENKEY, JSON.stringify(f))).catch(()=>{});
            } else {
                const enRes = await fetch('thirukkural-en.json');
                const enData = await enRes.json();
                mergeEn(enData);
                try { localStorage.setItem(ENKEY, JSON.stringify(enData)); } catch(e) {}
            }
        } catch(e) { console.warn('Could not load thirukkural-en.json', e); }
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

    // Req 2: Tamil — transliteration (default, already set)
    // Req 3: Other SPLIT_LANGS — native translation, fall back to Ashraf
    // Req 4: English — Ashraf's curated lines
    if (currentLang === 'en') {
        if (kural.ashraf_line1 && kural.ashraf_line2) {
            line1Display = kural.ashraf_line1;
            line2Display = kural.ashraf_line2;
        }
    } else if (currentLang !== 'ta' && SPLIT_LANGS[currentLang]) {
        const [f1, f2] = SPLIT_LANGS[currentLang].fields;
        if (kural[f1] && kural[f2]) {
            line1Display = kural[f1];
            line2Display = kural[f2];
        } else if (kural.ashraf_line1 && kural.ashraf_line2) {
            // Translation file not yet loaded — fall back to Ashraf
            line1Display = kural.ashraf_line1;
            line2Display = kural.ashraf_line2;
        }
    }
    
    // Get translated text
    const kuralText = window.t ? window.t('couplet') : 'குறள்';
    const explText = window.t ? window.t('explanations') : 'உரை';
    const scholarMV = window.t ? window.t('scholar_mv') : 'மு. வரதராசனார்';
    const scholarSP = window.t ? window.t('scholar_sp') : 'சாலமன் பாப்பையா';
    const scholarMK = window.t ? window.t('scholar_mk') : 'கலைஞர்';
    const translateBtn = window.t ? window.t('translate') : 'Translate';
    
    card.innerHTML = `
        <div class="kural-card-header">
            <div class="kural-number-small">${kuralText} ${kural.Number}</div>
            <a href="kural.html?id=${kural.Number}" class="kural-view-btn" title="Read this kural">${window.t ? window.t('read') : '📖 Read'}</a>
        </div>
        
        <div class="kural-text-section-compact">
            <div class="kural-tamil-compact">
                <span class="kural-line">${line1Words.join(' ')}</span>
                <span class="kural-line">${line2Words.join(' ')}</span>
            </div>
            <div class="kural-separator" aria-hidden="true"><span>◇ · ◈ · ◇</span></div>
            <div class="transliteration-compact">
                <span class="transliteration-line">${line1Display}</span>
                <span class="transliteration-line">${line2Display}</span>
                ${currentLang === 'en' && kural.ashraf_attr ? `<div class="ashraf-attribution">— ${kural.ashraf_attr} · curated by <a href="contributors.html#english-translation" class="attribution-link" target="_blank">N.V.K. Ashraf</a></div>` : ''}
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
            ${(kural.kannan_exp || kural.pope_exp) ? (() => {
                const isKannan = kural.kannan_exp && kural.kannan_exp.trim();
                const author = isKannan ? 'Kannan' : 'G.U. Pope';
                const text   = isKannan ? kural.kannan_exp : kural.pope_exp;
                return `<div class="explanation-item-compact english-exp">
                    <div class="explanation-header">
                        <div class="explanation-author-small">${author}</div>
                    </div>
                    <div class="explanation-text-small">${text}</div>
                    <button class="explanation-translate-btn" data-text="${escapeHtml(text)}">${translateBtn}</button>
                </div>`;
            })() : ''}
        </div>

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
    const prevBtn    = document.getElementById('prev-athikaram');
    const nextBtn    = document.getElementById('next-athikaram');
    const prevBtnTop = document.getElementById('prev-athikaram-top');
    const nextBtnTop = document.getElementById('next-athikaram-top');

    function goPrev() {
        if (currentAthikaramId > 1) {
            currentAthikaramId--;
            displayAthikaram(currentAthikaramId);
            updateNavigationButtons();
            window.scrollTo(0, 0);
        }
    }
    function goNext() {
        if (currentAthikaramId < 133) {
            currentAthikaramId++;
            displayAthikaram(currentAthikaramId);
            updateNavigationButtons();
            window.scrollTo(0, 0);
        }
    }

    prevBtn.addEventListener('click', goPrev);
    nextBtn.addEventListener('click', goNext);
    prevBtnTop.addEventListener('click', goPrev);
    nextBtnTop.addEventListener('click', goNext);

    updateNavigationButtons();
}

function updateNavigationButtons() {
    const prevBtn    = document.getElementById('prev-athikaram');
    const nextBtn    = document.getElementById('next-athikaram');
    const prevBtnTop = document.getElementById('prev-athikaram-top');
    const nextBtnTop = document.getElementById('next-athikaram-top');

    const atStart = currentAthikaramId <= 1;
    const atEnd   = currentAthikaramId >= 133;

    prevBtn.disabled    = atStart;
    nextBtn.disabled    = atEnd;
    prevBtnTop.disabled = atStart;
    nextBtnTop.disabled = atEnd;
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

                <p class="audio-help-note">&#128161; <strong>Tip:</strong> English audio works on most devices without any setup. Other languages (Tamil, Hindi, Malayalam, Kannada, Telugu, French, Chinese, Russian, German, Arabic, Sinhala, Polski, Svenska, Bahasa Melayu) may require a one-time voice download.</p>
            </div>
        `;
        modal.addEventListener('click', function(ev) {
            if (ev.target === modal) modal.classList.add('hidden');
        });
        document.body.appendChild(modal);
    }
    modal.classList.remove('hidden');
}
