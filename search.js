// ============================================================
// search.js — Tirukkural Search
// Searches across: Tamil kural lines, 3 Tamil commentaries,
// transliteration, English (Ashraf/Bharati/Pope), and
// all 13 native language translations.
// Supports: kural number, athikaram number, chapter name, any word.
// ============================================================

// ── State ──────────────────────────────────────────────────
let _mainData     = null;   // thirukkural.json  → array[1330]
let _enData       = null;   // thirukkural-en.json → array[1330]
let _langData     = {};     // { code: array[1330] }  lazy per language
let _athikarams   = null;   // ATHIKARAMS from athikarams-data.js
let _titleData    = null;   // athikaram-titles.json
let _loading      = false;
let _currentFilter= 'all';
let _debounceTimer= null;

// Language field map (mirrors languages.js LANGUAGES)
const LANG_FIELDS = {
    hi: ['hindi1','hindi2'],
    ml: ['malayalam1','malayalam2'],
    kn: ['kannada1','kannada2'],
    te: ['telugu1','telugu2'],
    fr: ['french1','french2'],
    zh: ['chinese1','chinese2'],
    ru: ['russian1','russian2'],
    de: ['german1','german2'],
    si: ['sinhala1','sinhala2'],
    ar: ['arabic1','arabic2'],
    pl: ['polski1','polski2'],
    ms: ['melayu1','melayu2'],
    sv: ['svenska1','svenska2'],
};

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    setupUI();

    // Pre-load data immediately in background so first search is instant
    loadAllData();

    // Support ?q= URL param (e.g. linked from elsewhere)
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
        document.getElementById('searchInput').value = q;
        // Wait for data then search
        waitForData().then(() => runSearch(q));
    }
});

function setupUI() {
    const input = document.getElementById('searchInput');
    const btn   = document.getElementById('searchBtn');

    // Search on button click
    btn.addEventListener('click', () => triggerSearch());

    // Search on Enter key
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') triggerSearch();
    });

    // Live search with debounce (300ms)
    input.addEventListener('input', () => {
        clearTimeout(_debounceTimer);
        const q = input.value.trim();
        if (q.length === 0) {
            showTip();
            setMeta('');
            return;
        }
        _debounceTimer = setTimeout(() => triggerSearch(), 300);
    });

    // Filter chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            _currentFilter = chip.dataset.filter;
            const q = input.value.trim();
            if (q) triggerSearch();
        });
    });
}

function triggerSearch() {
    const q = document.getElementById('searchInput').value.trim();
    if (!q) { showTip(); return; }

    // Update URL without reload
    const url = new URL(window.location.href);
    url.searchParams.set('q', q);
    history.replaceState({}, '', url.toString());

    if (!_mainData) {
        showLoading();
        waitForData().then(() => runSearch(q));
    } else {
        runSearch(q);
    }
}

// ── Data Loading ───────────────────────────────────────────
async function loadAllData() {
    if (_loading || _mainData) return;
    _loading = true;
    try {
        // Load in parallel: main JSON, English JSON, athikaram titles
        const [main, en, titles] = await Promise.all([
            fetchJSON('thirukkural.json'),
            fetchJSON('thirukkural-en.json'),
            fetchJSON('athikaram-titles.json'),
        ]);
        _mainData   = main.kural;
        _enData     = en.kural;
        _titleData  = titles;

        // Load all 13 language files in parallel (background)
        const langCodes = Object.keys(LANG_FIELDS);
        const langResults = await Promise.all(
            langCodes.map(code => fetchJSON(`thirukkural-${code}.json`).catch(() => null))
        );
        langCodes.forEach((code, i) => {
            if (langResults[i]) _langData[code] = langResults[i].kural;
        });

        // Get ATHIKARAMS from athikarams-data.js (loaded as global via script tag)
        _athikarams = typeof ATHIKARAMS !== 'undefined' ? ATHIKARAMS : buildFallbackAthikarams();
    } catch(e) {
        console.error('Search data load error:', e);
    }
    _loading = false;
}

async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed: ${url}`);
    return res.json();
}

function waitForData() {
    return new Promise(resolve => {
        if (_mainData) { resolve(); return; }
        const iv = setInterval(() => {
            if (_mainData) { clearInterval(iv); resolve(); }
        }, 80);
    });
}

// Fallback if athikarams-data.js not yet parsed (should not happen normally)
function buildFallbackAthikarams() {
    const arr = [];
    for (let i = 1; i <= 133; i++) {
        arr.push({ id: i, ta: '', en: '', paal: i <= 38 ? 1 : i <= 108 ? 2 : 3, start: (i-1)*10+1, end: i*10 });
    }
    return arr;
}

// ── Search Engine ──────────────────────────────────────────
function runSearch(rawQuery) {
    if (!_mainData) { showLoading(); return; }

    const q         = rawQuery.trim();
    const qNorm     = normalize(q);
    const qNum      = parseInt(q, 10);
    const isNumber  = /^\d+$/.test(q) && !isNaN(qNum);
    const filter    = _currentFilter;

    let kuralResults    = [];  // { kural, athikaram, score, matchField }
    let athikaramResults= [];  // { athikaram, score, matchField }

    // ── NUMBER SEARCH: show both Kural N and Athikaram N ──
    if (isNumber && (filter === 'all' || filter === 'kural')) {
        if (qNum >= 1 && qNum <= 1330) {
            const k = _mainData[qNum - 1];
            const ath = getAthikaramForKural(qNum);
            kuralResults.push({ kural: k, athikaram: ath, score: 1000, matchField: 'number' });
        }
    }

    if (isNumber && (filter === 'all' || filter === 'athikaram')) {
        if (qNum >= 1 && qNum <= 133) {
            const ath = _athikarams ? _athikarams[qNum - 1] : null;
            if (ath) athikaramResults.push({ athikaram: ath, score: 1000, matchField: 'number' });
        }
    }

    // ── TEXT SEARCH ──
    if (!isNumber || filter === 'word' || filter === 'name') {
        // Search athikaram names
        if (filter === 'all' || filter === 'name' || filter === 'word') {
            athikaramResults = athikaramResults.concat(searchAthikaramNames(qNorm));
        }

        // Search kural content (word search)
        if (filter === 'all' || filter === 'word') {
            kuralResults = kuralResults.concat(searchKuralContent(qNorm));
        }
    }

    // Deduplicate by kural number / athikaram id
    kuralResults    = deduplicateByKey(kuralResults, r => r.kural.Number);
    athikaramResults= deduplicateByKey(athikaramResults, r => r.athikaram.id);

    // Sort by score descending
    kuralResults.sort((a,b) => b.score - a.score);
    athikaramResults.sort((a,b) => b.score - a.score);

    // Cap results
    const maxKurals    = 30;
    const maxAthikarams= 10;
    kuralResults    = kuralResults.slice(0, maxKurals);
    athikaramResults= athikaramResults.slice(0, maxAthikarams);

    renderResults(kuralResults, athikaramResults, q, qNorm);
}

function searchAthikaramNames(qNorm) {
    if (!_athikarams) return [];
    const results = [];

    _athikarams.forEach(ath => {
        let score = 0, matchField = '';

        // Tamil name
        if (ath.ta && normalize(ath.ta).includes(qNorm)) {
            score = normalize(ath.ta) === qNorm ? 900 : 700;
            matchField = 'ta';
        }
        // English name
        if (!score && ath.en && normalize(ath.en).includes(qNorm)) {
            score = normalize(ath.en) === qNorm ? 850 : 650;
            matchField = 'en';
        }
        // Other language titles from athikaram-titles.json
        if (!score && _titleData) {
            for (const lang of Object.keys(_titleData)) {
                const title = _titleData[lang][String(ath.id)];
                if (title && normalize(title).includes(qNorm)) {
                    score = 600;
                    matchField = lang;
                    break;
                }
            }
        }

        if (score > 0) results.push({ athikaram: ath, score, matchField });
    });

    return results;
}

function searchKuralContent(qNorm) {
    if (!_mainData) return [];
    const results = [];

    _mainData.forEach((k, idx) => {
        let score = 0, matchField = '';

        // 1. Tamil lines (highest priority)
        const line1 = normalize(k.Line1 || '');
        const line2 = normalize(k.Line2 || '');
        if (line1.includes(qNorm) || line2.includes(qNorm)) {
            score = line1 === qNorm || line2 === qNorm ? 800 : 700;
            matchField = 'ta';
        }

        // 2. Transliteration
        if (!score) {
            const t1 = normalize(k.transliteration1 || '');
            const t2 = normalize(k.transliteration2 || '');
            if (t1.includes(qNorm) || t2.includes(qNorm)) { score = 600; matchField = 'transliteration'; }
        }

        // 3. Tamil commentaries
        if (!score) {
            for (const field of ['mv','sp','mk']) {
                if (k[field] && normalize(k[field]).includes(qNorm)) { score = 550; matchField = field; break; }
            }
        }

        // 4. English (Ashraf curated + Bharati + Pope)
        if (!score && _enData && _enData[idx]) {
            const en = _enData[idx];
            for (const field of ['ashraf','ashraf_line1','ashraf_line2','bharati_verse1','bharati_verse2','pope_couplet','pope_exp','kannan_exp']) {
                if (en[field] && normalize(en[field]).includes(qNorm)) { score = 500; matchField = 'en'; break; }
            }
        }

        // 5. Other languages
        if (!score) {
            for (const [code, rows] of Object.entries(_langData)) {
                if (!rows || !rows[idx]) continue;
                const fields = LANG_FIELDS[code] || [];
                for (const f of fields) {
                    if (rows[idx][f] && normalize(rows[idx][f]).includes(qNorm)) {
                        score = 450; matchField = code; break;
                    }
                }
                if (score) break;
            }
        }

        if (score > 0) {
            const ath = getAthikaramForKural(k.Number);
            results.push({ kural: k, athikaram: ath, score, matchField });
        }
    });

    return results;
}

// ── Helpers ────────────────────────────────────────────────
function normalize(str) {
    return (str || '').normalize('NFC').toLowerCase().trim();
}

function getAthikaramForKural(num) {
    if (!_athikarams) return null;
    return _athikarams.find(a => num >= a.start && num <= a.end) || null;
}

function deduplicateByKey(arr, keyFn) {
    const seen = new Set();
    return arr.filter(item => {
        const k = keyFn(item);
        if (seen.has(k)) return false;
        seen.add(k); return true;
    });
}

function highlightMatch(text, qNorm) {
    if (!text || !qNorm) return escapeHtml(text || '');
    const escaped = escapeHtml(text);
    const escapedQ = escapeHtml(qNorm);
    // Case-insensitive highlight
    const regex = new RegExp('(' + escapedQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return escaped.replace(regex, '<mark class="search-highlight">$1</mark>');
}

function escapeHtml(str) {
    return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function getPaalName(paal) {
    const map = { 1: 'அறத்துப்பால் · Virtue', 2: 'பொருட்பால் · Wealth', 3: 'இன்பத்துப்பால் · Love' };
    return map[paal] || '';
}

// ── Rendering ──────────────────────────────────────────────
function renderResults(kuralResults, athikaramResults, rawQuery, qNorm) {
    const container = document.getElementById('resultsContainer');
    const total = kuralResults.length + athikaramResults.length;

    if (total === 0) {
        setMeta('');
        container.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">🔍</div>
                <h3>No results found for "${escapeHtml(rawQuery)}"</h3>
                <p>Try a different word, or check the spelling.</p>
            </div>`;
        return;
    }

    setMeta(`${total} result${total !== 1 ? 's' : ''} for "<strong>${escapeHtml(rawQuery)}</strong>"`);

    let html = '';

    // ── Athikaram results ──
    if (athikaramResults.length > 0) {
        html += `<div class="results-section-label">அதிகாரம் — Chapters (${athikaramResults.length})</div>`;
        athikaramResults.forEach(({ athikaram, matchField }) => {
            const taName = athikaram.ta || '';
            const enName = _titleData && _titleData['en'] ? (_titleData['en'][String(athikaram.id)] || athikaram.en || '') : (athikaram.en || '');
            const taDisplay = highlightMatch(taName, qNorm);
            const enDisplay = highlightMatch(enName, qNorm);
            const paalName  = getPaalName(athikaram.paal);
            const href      = `athikaram-view.html?id=${athikaram.id}`;

            html += `
            <a href="${href}" class="result-card result-card--athikaram">
                <div class="result-top">
                    <span class="result-badge result-badge--athikaram">அதிகாரம் ${athikaram.id}</span>
                    <span class="result-athikaram-label">${escapeHtml(paalName)} · குறள் ${athikaram.start}–${athikaram.end}</span>
                </div>
                <div class="result-athikaram-title">${taDisplay} — ${enDisplay}</div>
                <div class="result-athikaram-meta">10 Kurals in this chapter</div>
            </a>`;
        });
    }

    // ── Kural results ──
    if (kuralResults.length > 0) {
        html += `<div class="results-section-label">குறள் — Couplets (${kuralResults.length})</div>`;
        kuralResults.forEach(({ kural, athikaram, matchField }) => {
            const athLabel = athikaram
                ? `${athikaram.id} · ${escapeHtml(athikaram.ta)} — ${escapeHtml(athikaram.en)}`
                : '';
            const line1 = highlightMatch(kural.Line1, qNorm);
            const line2 = highlightMatch(kural.Line2, qNorm);

            // Pick the best translation snippet to show based on match field
            let translation = '';
            if (matchField === 'en' && _enData && _enData[kural.Number - 1]) {
                const en = _enData[kural.Number - 1];
                translation = en.ashraf || en.kannan_exp || en.pope_exp || '';
            } else if (_enData && _enData[kural.Number - 1]) {
                const en = _enData[kural.Number - 1];
                translation = en.ashraf || en.kannan_exp || '';
            }
            const translationHtml = translation
                ? `<div class="result-translation">${highlightMatch(translation, qNorm)}</div>`
                : '';

            const matchTag = matchField && matchField !== 'ta' && matchField !== 'number'
                ? `<span class="match-source">${getMatchLabel(matchField)}</span>`
                : '';

            const href = `kural.html?id=${kural.Number}`;

            html += `
            <a href="${href}" class="result-card">
                <div class="result-top">
                    <span class="result-badge">குறள் ${kural.Number}${matchTag}</span>
                    <span class="result-athikaram-label">${athLabel}</span>
                </div>
                <div class="result-lines">${line1}</div>
                <div class="result-lines" style="margin-bottom:6px">${line2}</div>
                ${translationHtml}
            </a>`;
        });
    }

    container.innerHTML = html;
}

function getMatchLabel(field) {
    const map = {
        mv: 'மு.வ', sp: 'ச.பா', mk: 'கலைஞர்',
        transliteration: 'Transliteration',
        en: 'English',
        hi: 'Hindi', ml: 'Malayalam', kn: 'Kannada', te: 'Telugu',
        fr: 'Français', zh: '中文', ru: 'Русский', de: 'Deutsch',
        si: 'සිංහල', ar: 'العربية', pl: 'Polski', ms: 'Melayu', sv: 'Svenska',
    };
    return map[field] || field;
}

// ── UI helpers ─────────────────────────────────────────────
function showLoading() {
    document.getElementById('resultsContainer').innerHTML = `
        <div class="search-loading">
            <div class="spinner"></div><br>
            Loading search data…
        </div>`;
    setMeta('');
}

function showTip() {
    document.getElementById('resultsContainer').innerHTML = `
        <div class="search-tip" id="searchTip">
            <div class="search-tip-icon">💡</div>
            <p>
                <strong>5</strong> → <span data-translate="kural">குறள்</span> 5 &amp; <span data-translate="chapter">அதிகாரம்</span> 5 &nbsp;·&nbsp;
                <strong>அன்பு</strong> → <span data-translate="filter_word">வார்த்தை</span> &nbsp;·&nbsp;
                <strong>love</strong> → <span data-translate="filter_word">வார்த்தை</span> &nbsp;·&nbsp;
                <strong>கடவுள் வாழ்த்து</strong> → <span data-translate="filter_name">அதிகாரப் பெயர்</span>
            </p>
        </div>`;
    if (typeof applyTranslations === 'function') applyTranslations();
    setMeta('');
}

function setMeta(html) {
    document.getElementById('resultsMeta').innerHTML = html;
}

// ── Load athikarams-data.js dynamically if not yet present ──
// (It is a <script> on other pages but not here — load it ourselves)
(function loadAthikaramsData() {
    if (typeof ATHIKARAMS !== 'undefined') return; // already loaded
    const s = document.createElement('script');
    s.src = 'athikarams-data.js';
    s.onload = () => { _athikarams = typeof ATHIKARAMS !== 'undefined' ? ATHIKARAMS : null; };
    document.head.appendChild(s);
})();
