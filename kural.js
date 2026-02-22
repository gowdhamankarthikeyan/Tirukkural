// ============================================================
// kural.js — Individual kural detail page
// ============================================================

const KURAL_LANGS = [
    { code: 'ml', label: 'മലയാളം',  flag: '🇮🇳', fields: ['malayalam1','malayalam2'], ttsCode: 'ml-IN' },
    { code: 'hi', label: 'हिंदी',    flag: '🇮🇳', fields: ['hindi1','hindi2'],         ttsCode: 'hi-IN' },
    { code: 'kn', label: 'ಕನ್ನಡ',  flag: '🇮🇳', fields: ['kannada1','kannada2'],      ttsCode: 'kn-IN' },
    { code: 'te', label: 'తెలుగు',  flag: '🇮🇳', fields: ['telugu1','telugu2'],        ttsCode: 'te-IN' },
    { code: 'fr', label: 'Français', flag: '🇫🇷', fields: ['french1','french2'],        ttsCode: 'fr-FR' },
    { code: 'zh', label: '中文',     flag: '🇹🇼', fields: ['chinese1','chinese2'],      ttsCode: 'zh-TW' },
    { code: 'ru', label: 'Русский',  flag: '🇷🇺', fields: ['russian1','russian2'],      ttsCode: 'ru-RU' },
    { code: 'de', label: 'Deutsch',  flag: '🇩🇪', fields: ['german1','german2'],        ttsCode: 'de-DE' },
    { code: 'ar', label: 'العربية',  flag: '🇸🇦', fields: ['arabic1','arabic2'],        ttsCode: 'ar-SA', rtl: true },
];

const ALL_AUDIO_LANGS = [
    { code: 'ta', label: 'தமிழ்',  flag: '🇮🇳', ttsCode: 'ta-IN', fields: ['Line1','Line2'] },
    { code: 'en', label: 'English', flag: '🇬🇧', ttsCode: 'en-IN', fields: ['ashraf_line1','ashraf_line2'] },
    ...KURAL_LANGS,
];

let kuralData         = null;
let currentId         = 1;
let _currentAudio     = null;
let _currentBtn       = null;
let _currentUtterance = null;

async function loadAllData() {
    const CACHE_KEY = 'tirukkural_kural_data_v1';
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            kuralData = JSON.parse(cached);
            fetch('thirukkural.json').then(r => r.json())
                .then(f => localStorage.setItem(CACHE_KEY, JSON.stringify(f.kural))).catch(() => {});
        } else {
            const res = await fetch('thirukkural.json');
            const data = await res.json();
            kuralData = data.kural;
            try { localStorage.setItem(CACHE_KEY, JSON.stringify(data.kural)); } catch(e) {}
        }
    } catch(e) {
        document.getElementById('kural-content').innerHTML =
            '<div class="loading">Error loading data. Please refresh.</div>';
        return false;
    }

    await Promise.all(KURAL_LANGS.map(async lang => {
        const LKEY = 'tirukkural_trans_' + lang.code + '_v1';
        try {
            const cached = localStorage.getItem(LKEY);
            if (cached) {
                JSON.parse(cached).kural.forEach(t => {
                    const k = kuralData[t.Number - 1]; if (k) Object.assign(k, t);
                });
                fetch('thirukkural-' + lang.code + '.json').then(r => r.json())
                    .then(f => localStorage.setItem(LKEY, JSON.stringify(f))).catch(() => {});
            } else {
                const res  = await fetch('thirukkural-' + lang.code + '.json');
                const data = await res.json();
                data.kural.forEach(t => {
                    const k = kuralData[t.Number - 1]; if (k) Object.assign(k, t);
                });
                try { localStorage.setItem(LKEY, JSON.stringify(data)); } catch(e) {}
            }
        } catch(e) { console.warn('Could not load thirukkural-' + lang.code + '.json'); }
    }));
    return true;
}

function getAthikaramForKural(num) {
    return ATHIKARAMS.find(a => num >= a.start && num <= a.end);
}

function stopCurrentAudio() {
    if (_currentAudio)     { _currentAudio.pause(); _currentAudio = null; }
    if (_currentUtterance) { window.speechSynthesis.cancel(); _currentUtterance = null; }
    if (_currentBtn) {
        _currentBtn.classList.remove('playing');
        _currentBtn.querySelector('.kural-audio-icon').textContent = '▶';
        _currentBtn = null;
    }
}

function buildTTSText(lang, kural) {
    if (lang.code === 'ta') return [kural.Line1, kural.Line2].filter(Boolean).join(' ');
    if (lang.code === 'en') return [kural.ashraf_line1, kural.ashraf_line2].filter(Boolean).join(' ');
    return [kural[lang.fields[0]], kural[lang.fields[1]]].filter(Boolean).join(' ');
}

function playAudio(btn, lang, kural) {
    if (_currentBtn === btn) { stopCurrentAudio(); return; }
    stopCurrentAudio();
    _currentBtn = btn;
    btn.classList.add('playing');
    btn.querySelector('.kural-audio-icon').textContent = '⏹';
    const text = buildTTSText(lang, kural);
    if (!text) { stopCurrentAudio(); return; }
    if (lang.code === 'ta' || lang.code === 'en') {
        const audio = new Audio('/audio/' + lang.code + '/' + kural.Number + '.mp3');
        audio.onended = stopCurrentAudio;
        audio.onerror = () => { _currentAudio = null; playTTS(lang.ttsCode, text); };
        _currentAudio = audio;
        audio.play().catch(() => { _currentAudio = null; playTTS(lang.ttsCode, text); });
        return;
    }
    playTTS(lang.ttsCode, text);
}

function playTTS(ttsCode, text) {
    if (!window.speechSynthesis) { stopCurrentAudio(); return; }
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = ttsCode;
    utt.onend = utt.onerror = stopCurrentAudio;
    _currentUtterance = utt;
    window.speechSynthesis.speak(utt);
}

function renderKural(id) {
    currentId = id;
    const kural = kuralData[id - 1];
    if (!kural) return;

    const athikaram   = getAthikaramForKural(id);
    const chapterName = athikaram ? athikaram.ta + ' — ' + athikaram.en : '';
    const chapterHref = athikaram ? 'athikaram-view.html?id=' + athikaram.id : 'athikarams.html';

    const desc = (kural.ashraf_line1 || '') + ' ' + (kural.ashraf_line2 || '');
    document.title = 'Kural ' + id + ' — Tirukkuṟaḷ';
    document.getElementById('meta-title').content = 'Kural ' + id + ' | ' + (kural.ashraf_line1 || '');
    document.getElementById('meta-desc').content  = desc;
    document.getElementById('og-title').content   = 'Kural ' + id + ' — Tirukkuṟaḷ';
    document.getElementById('og-desc').content    = desc;
    document.getElementById('canonical-url').href = 'https://tirukkural.in/kural.html?id=' + id;
    document.getElementById('og-url').content     = 'https://tirukkural.in/kural.html?id=' + id;
    history.replaceState({}, '', 'kural.html?id=' + id);

    ['top','bot'].forEach(function(pos) {
        document.getElementById('prev-kural-' + pos).disabled = id <= 1;
        document.getElementById('next-kural-' + pos).disabled = id >= 1330;
        document.getElementById('back-chapter-' + pos).href   = chapterHref;
    });

    function audioBtn(langCode, rtl) {
        return '<button class="kural-audio-play-btn' + (rtl ? ' rtl-audio' : '') + '" data-lang="' + langCode + '" title="Listen"><span class="kural-audio-icon">▶</span></button>';
    }

    // Translation rows — Tamil audio lives in Transliteration row
    var rows = [
        { langCode: 'ta', langLabel: 'Transliteration (Roman)', flag: '🔤', cls: '', rtl: false,
          line1: kural.transliteration1, line2: kural.transliteration2, attr: '' },
        { langCode: 'en', langLabel: 'English', flag: '🇬🇧', cls: 'english', rtl: false,
          line1: kural.ashraf_line1, line2: kural.ashraf_line2,
          attr: '— ' + (kural.ashraf_attr || '') + ' · curated by <a href="contributors.html#english-translation" class="attribution-link" target="_blank">N.V.K. Ashraf</a>' },
    ].concat(KURAL_LANGS.map(function(lang) {
        return {
            langCode: lang.code, langLabel: lang.label, flag: lang.flag,
            cls: lang.rtl ? 'rtl' : '', rtl: !!lang.rtl,
            line1: kural[lang.fields[0]], line2: kural[lang.fields[1]], attr: ''
        };
    }));

    var translationItems = rows.filter(function(t) { return t.line1 || t.line2; }).map(function(t) {
        return '<div class="kural-translation-item ' + t.cls + '">' +
            '<div class="kural-translation-lang">' +
                (t.rtl ? audioBtn(t.langCode, true) : '') +
                '<span' + (t.rtl ? ' class="rtl-label"' : '') + '>' + t.flag + ' ' + t.langLabel + '</span>' +
                (!t.rtl ? audioBtn(t.langCode, false) : '') +
            '</div>' +
            '<div class="kural-translation-text">' +
                (t.line1 ? '<span>' + t.line1 + '</span>' : '') +
                (t.line2 ? '<span>' + t.line2 + '</span>' : '') +
            '</div>' +
            (t.attr ? '<div class="kural-translation-attr">' + t.attr + '</div>' : '') +
        '</div>';
    }).join('');

    var commentaries = [
        { author: 'மு. வரதராசனார் — Mu. Varadarasanar', text: kural.mv },
        { author: 'சாலமன் பாப்பையா — Solomon Pappaiah',  text: kural.sp },
        { author: 'கலைஞர் எம். கருணாநிதி — Kalaignar',   text: kural.mk },
    ].filter(function(c) { return c.text; }).map(function(c) {
        return '<div class="kural-commentary-item">' +
            '<div class="kural-commentary-author">' + c.author + '</div>' +
            '<div class="kural-commentary-text">' + c.text + '</div>' +
        '</div>';
    }).join('');

    var chapterTa = athikaram ? athikaram.ta : '';
    var chapterEn = athikaram ? athikaram.en : '';

    document.getElementById('kural-content').innerHTML =
        '<div class="kural-hero kural-hero-border">' +
            '<div class="kural-hero-number">Kural ' + id + '</div>' +
            '<div class="kural-hero-chapter">' +
                '<a class="kural-chapter-ta" href="' + chapterHref + '">' + chapterTa + '</a>' +
                '<a class="kural-chapter-en" href="' + chapterHref + '">' + chapterEn + '</a>' +
            '</div>' +
            '<div class="kural-hero-tamil"><span>' + kural.Line1 + '</span><span>' + kural.Line2 + '</span></div>' +
        '</div>' +
        '<div class="kural-translations">' +
            '<div class="kural-translations-title">Translations</div>' +
            translationItems +
        '</div>' +
        (commentaries ? '<div class="kural-commentaries"><div class="kural-commentaries-title">Tamil Commentaries</div>' + commentaries + '</div>' : '');

    document.querySelectorAll('.kural-audio-play-btn').forEach(function(btn) {
        var code = btn.getAttribute('data-lang');
        var lang = ALL_AUDIO_LANGS.find(function(l) { return l.code === code; });
        if (!lang) return;
        btn.addEventListener('click', function() { playAudio(btn, lang, kural); });
    });

    window.scrollTo(0, 0);
    fitKuralText();
}

function fitKuralText() {
    var hero = document.querySelector('.kural-hero');
    var tamil = document.querySelector('.kural-hero-tamil');
    if (!hero || !tamil) return;
    var lines = tamil.querySelectorAll('span');
    var size = 2.0;
    var MIN = 1.1;
    var step = 0.05;
    tamil.style.fontSize = size + 'rem';
    var containerW = hero.offsetWidth - 48;
    function overflows() {
        return Array.from(lines).some(function(l) { return l.scrollWidth > containerW; });
    }
    while (overflows() && size > MIN) {
        size = Math.round((size - step) * 100) / 100;
        tamil.style.fontSize = size + 'rem';
    }
}

function setupNav() {
    ['top','bot'].forEach(function(pos) {
        document.getElementById('prev-kural-' + pos).addEventListener('click', function() {
            if (currentId > 1) renderKural(currentId - 1);
        });
        document.getElementById('next-kural-' + pos).addEventListener('click', function() {
            if (currentId < 1330) renderKural(currentId + 1);
        });
    });
}

document.addEventListener('DOMContentLoaded', async function() {
    var params = new URLSearchParams(window.location.search);
    currentId = Math.min(1330, Math.max(1, parseInt(params.get('id')) || 1));
    var ok = await loadAllData();
    if (!ok) return;
    setupNav();
    renderKural(currentId);
    window.addEventListener('resize', function() {
        var tamil = document.querySelector('.kural-hero-tamil');
        if (tamil) tamil.style.fontSize = '2rem';
        fitKuralText();
    });
});
