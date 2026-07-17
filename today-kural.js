// ============================================================
// today-kural.js — Shared data + rendering for Today's Kural.
// Used by today.html (standalone page) and today-overlay.js
// (the nav-triggered popup). One source of truth for the
// language-aware couplet logic, so a fix here fixes both.
// ============================================================

const TodayKural = (function () {
    const SITE       = 'https://tirukkural.in';
    const YEAR_START = new Date('2026-01-01T00:00:00+05:30');

    function todayKuralNumber() {
        const ist  = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const diff = Math.floor((ist - YEAR_START) / 86400000);
        return (diff % 1330) + 1;
    }

    function getAthikaramForKural(num) {
        return ATHIKARAMS.find(a => num >= a.start && num <= a.end);
    }

    // Tamil script for Tamil; translated text otherwise. English uses the
    // curated Ashraf lines already present in thirukkural.json, other
    // supported languages fetch their own thirukkural-{lang}.json (only the
    // one needed), languages with no native file fall back to transliteration.
    async function getCoupletLines(kural, lang) {
        const translit = { line1: kural.transliteration1 || '', line2: kural.transliteration2 || '' };
        if (!lang || lang === 'ta') return { line1: kural.Line1, line2: kural.Line2 };
        if (lang === 'en') {
            const l1 = kural.ashraf_line1 || '', l2 = kural.ashraf_line2 || '';
            return l1 ? { line1: l1, line2: l2 } : translit;
        }
        const langDef = (typeof LANGUAGES !== 'undefined') ? LANGUAGES.find(l => l.code === lang) : null;
        if (!langDef) return translit;
        try {
            const res  = await fetch(SITE + '/thirukkural-' + lang + '.json');
            const data = await res.json();
            const row  = data.kural.find(k => k.Number === kural.Number);
            const l1 = row && row[langDef.fields[0]];
            const l2 = row && row[langDef.fields[1]];
            if (l1) return { line1: l1, line2: l2 };
        } catch (e) {}
        return translit;
    }

    // Resolves the current language, preferring the site's saved cookie.
    function resolveLang() {
        if (typeof loadTranslations !== 'function') return 'ta';
        const savedLang = (typeof getCookie === 'function') ? getCookie('thirukkural_lang') : null;
        if (savedLang && typeof translations !== 'undefined' && translations[savedLang]) {
            currentLanguage = savedLang;
        }
        return (typeof currentLanguage !== 'undefined') ? currentLanguage : 'ta';
    }

    // Fetches everything needed to render the card for today's kural.
    // Returns null on failure (caller should show an error state).
    async function fetchData() {
        if (typeof loadTranslations === 'function') { await loadTranslations(); }
        const lang = resolveLang();
        const tr   = (typeof t === 'function') ? t : (key => key);
        const kuralNum = todayKuralNumber();

        const res   = await fetch(SITE + '/thirukkural.json');
        const kJson = await res.json();
        const kuralData = kJson.kural || kJson;

        const enRes  = await fetch(SITE + '/thirukkural-en.json');
        const enData = await enRes.json();
        enData.kural.forEach(t => {
            const k = kuralData[t.Number - 1];
            if (k) { k.kannan_exp = t.kannan_exp; k.pope_exp = t.pope_exp; }
        });

        const kural = kuralData[kuralNum - 1];
        const ath   = getAthikaramForKural(kuralNum);
        const coupletLines = await getCoupletLines(kural, lang);
        const chapterName = (lang === 'ta')
            ? ath.ta
            : (window.athikaram_names && window.athikaram_names[lang] && window.athikaram_names[lang][String(ath.id)]) || ath.en;

        return { kuralNum, kural, ath, lang, tr, coupletLines, chapterName };
    }

    // Returns the inner HTML for the golden card, given fetchData()'s result.
    function cardHTML(d) {
        return `
            <div class="pill">${d.tr('chapter')} ${d.ath.id} · ${d.tr('kural')} ${d.kural.Number}</div>
            <div class="chapter-ta">${d.chapterName}</div>
            <hr>
            <div class="tamil">${d.coupletLines.line1}<br>${d.coupletLines.line2}</div>
            <hr>
            <div class="translit">${d.kural.transliteration1} · ${d.kural.transliteration2}</div>
        `;
    }

    return { fetchData, cardHTML, todayKuralNumber, getAthikaramForKural };
})();
