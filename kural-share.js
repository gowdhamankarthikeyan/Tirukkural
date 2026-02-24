// ============================================================
// kural-share.js — WhatsApp status card · Parchment design
// Palette mirrors kural.html / kural.css exactly.
// Layout engine guarantees NO overflow: measures all content,
// scales fonts down until everything fits, then draws.
// ============================================================

(function () {

    const W = 1080, H = 1920;

    // ── Palette from kural.html / styles.css ──
    const PRIMARY  = '#E8B84B';   // --primary-color  (deep orange-red)
    const SECONDARY= '#fa8c16';   // --secondary-color
    const TEXT_DARK= '#F5DEB3';   // --text-dark
    const TEXT_LITE= '#C8A45A';   // --text-light
    const BG_HERO  = '#fff9f0';   // .kural-hero background
    const BORDER   = '#D4A017';   // .kural-hero-border color
    const TLIT_CLR = '#C8A45A';   // .kural-translation-text color
    const COMM_ACC = '#D4A017';   // commentary border accent
    const EN_ACC   = '#B8860B';   // english commentary accent

    // ── Text-wrap helper ──
    function wrap(ctx, text, maxW) {
        if (!text) return [];
        const words = text.split(' '), lines = [];
        let line = '';
        for (const w of words) {
            const test = line ? line + ' ' + w : w;
            if (ctx.measureText(test).width > maxW && line) {
                lines.push(line); line = w;
            } else line = test;
        }
        if (line) lines.push(line);
        return lines;
    }

    // ── Horizontal rule ──
    function hline(ctx, x1, x2, y, color, alpha, lw) {
        ctx.save();
        ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = lw;
        ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
        ctx.restore();
    }

    // ── Rounded rect ──
    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y); ctx.arcTo(x+w, y, x+w, y+r, r);
        ctx.lineTo(x + w, y + h - r); ctx.arcTo(x+w, y+h, x+w-r, y+h, r);
        ctx.lineTo(x + r, y + h); ctx.arcTo(x, y+h, x, y+h-r, r);
        ctx.lineTo(x, y + r); ctx.arcTo(x, y, x+r, y, r);
        ctx.closePath();
    }

    // ── Measure total height for a given font scale ──
    function measureTotal(ctx, scale, kural, athikaram) {
        const s = scale;
        const PAD    = Math.round(72 * s);
        const INNER  = W - PAD * 2;
        const CARD   = Math.round(36 * s);  // card inner padding

        // fonts
        function f(size, style, family) {
            return (style ? style + ' ' : '') + Math.round(size * s) + 'px ' + (family || 'serif');
        }

        let total = PAD; // top margin

        // ── Header block ──
        total += Math.round(50 * s); // site name
        total += Math.round(20 * s); // gap

        // ── Hero card ──
        total += CARD;
        total += Math.round(30 * s); // kural number pill
        total += Math.round(12 * s);
        // chapter ta
        ctx.font = f(52, 'bold');
        const cTa = wrap(ctx, athikaram ? athikaram.ta : '', INNER - CARD*2);
        total += cTa.length * Math.round(66 * s) + Math.round(10 * s);
        // chapter en
        total += Math.round(36 * s) + Math.round(8 * s);
        // divider
        total += Math.round(20 * s);
        // kural lines
        ctx.font = f(76, 'bold');
        const kLines = [
            ...wrap(ctx, kural.Line1 || '', INNER - CARD*2),
            ...wrap(ctx, kural.Line2 || '', INNER - CARD*2),
        ];
        total += kLines.length * Math.round(96 * s) + Math.round(16 * s);
        // divider
        total += Math.round(20 * s);
        // transliteration
        ctx.font = f(28, 'italic', 'Georgia, serif');
        const tlStr = (kural.transliteration1 || '') + '  ·  ' + (kural.transliteration2 || '');
        const tlLines = wrap(ctx, tlStr, INNER - CARD*2);
        total += tlLines.length * Math.round(40 * s);
        total += CARD;  // bottom padding hero

        total += Math.round(24 * s); // gap

        // ── Section label (Translations) ──
        total += Math.round(30 * s) + Math.round(16 * s);

        // ── Kalaignar section ──
        total += Math.round(32 * s) + Math.round(10 * s); // label
        ctx.font = f(42);
        const mkLines = wrap(ctx, kural.mk || '', INNER - CARD);
        total += mkLines.length * Math.round(58 * s);
        total += Math.round(32 * s); // gap + divider

        // ── English section ──
        total += Math.round(32 * s) + Math.round(10 * s);
        ctx.font = f(40, 'italic', 'Georgia, serif');
        const enText = (kural.kannan_exp && kural.kannan_exp.trim()) ? kural.kannan_exp : (kural.pope_exp || '');
        const enLines = wrap(ctx, enText, INNER - CARD);
        total += enLines.length * Math.round(56 * s);
        total += Math.round(32 * s);

        // ── Footer ──
        total += Math.round(60 * s);
        total += PAD;

        return total;
    }

    // ── Main draw ──
    function drawCard(kural, athikaram) {
        const canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d');

        // Binary-search for largest scale that fits
        let lo = 0.55, hi = 1.0, scale = 0.85;
        for (let iter = 0; iter < 20; iter++) {
            const mid = (lo + hi) / 2;
            if (measureTotal(ctx, mid, kural, athikaram) <= H) { lo = mid; scale = mid; }
            else hi = mid;
        }

        const s    = scale;
        const PAD  = Math.round(72 * s);
        const INNER= W - PAD * 2;
        const CARD = Math.round(36 * s);
        const GAP  = Math.round(16 * s);

        function f(size, style, family) {
            return (style ? style + ' ' : '') + Math.round(size * s) + 'px ' + (family || 'serif');
        }
        function lh(size) { return Math.round(size * s); }

        // ══ Background ══
        // Warm pale yellow-golden parchment
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0,    '#3B1A00');
        bg.addColorStop(0.35, '#4A2200');
        bg.addColorStop(0.65, '#3B1A00');
        bg.addColorStop(1,    '#2A1000');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

        // Grain texture (horizontal, like ola leaf)
        ctx.save(); ctx.globalAlpha = 0.035; ctx.strokeStyle = '#6B3A10'; ctx.lineWidth = 1;
        for (let gy = 0; gy < H; gy += 18) {
            ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
        }
        ctx.restore();

        // Edge vignette
        const vig = ctx.createRadialGradient(W/2, H/2, W*0.25, W/2, H/2, W*0.88);
        vig.addColorStop(0, 'rgba(0,0,0,0)');
        vig.addColorStop(1, 'rgba(0,0,0,0.45)');
        ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);

        // Outer border (double, like kural-hero-border)
        const B = Math.round(28 * s);
        ctx.save();
        ctx.strokeStyle = BORDER; ctx.lineWidth = Math.round(6 * s); ctx.globalAlpha = 0.8;
        ctx.strokeRect(B, B, W - B*2, H - B*2);
        ctx.strokeStyle = BORDER; ctx.lineWidth = Math.round(2 * s); ctx.globalAlpha = 0.35;
        ctx.strokeRect(B + lh(12), B + lh(12), W - (B + lh(12))*2, H - (B + lh(12))*2);
        ctx.restore();

        // Corner ✦ ornaments (from .kural-hero-border::before/after)
        function starAt(x, y) {
            ctx.save();
            ctx.font = f(36, '', 'serif'); ctx.fillStyle = BORDER; ctx.globalAlpha = 0.85;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('✦', x, y); ctx.restore();
        }
        const CO = B + lh(20);
        starAt(CO, CO); starAt(W - CO, CO); starAt(CO, H - CO); starAt(W - CO, H - CO);

        // Binding holes (ola leaf motif)
        function holes(hy) {
            ctx.save(); ctx.fillStyle = '#D4A017'; ctx.globalAlpha = 0.35;
            for (let i = 0; i < 9; i++) {
                ctx.beginPath();
                ctx.arc(PAD + i * Math.round((INNER) / 8), hy, lh(7), 0, Math.PI*2);
                ctx.fill();
            }
            ctx.restore();
        }
        holes(B + lh(6));
        holes(H - B - lh(6));

        // ══ Layout start ══
        let y = PAD;

        // ── Site name header ──
        ctx.textAlign = 'center';
        ctx.font = f(46, 'bold'); ctx.fillStyle = '#E8B84B';
        ctx.fillText('Tirukkuṟaḷ', W/2, y + lh(38)); y += lh(50);
        ctx.font = f(26, 'italic', 'Georgia, serif'); ctx.fillStyle = TEXT_LITE;
        ctx.fillText('திருக்குறள்', W/2, y + lh(22)); y += lh(30);

        y += GAP;

        // ── Hero card (like .kural-hero.kural-hero-border) ──
        // Measure hero content height first
        ctx.font = f(52, 'bold');
        const cTaLines = wrap(ctx, athikaram ? athikaram.ta : '', INNER - CARD*2);
        ctx.font = f(76, 'bold');
        const kLines = [
            ...wrap(ctx, kural.Line1 || '', INNER - CARD*2),
            ...wrap(ctx, kural.Line2 || '', INNER - CARD*2),
        ];
        ctx.font = f(28, 'italic', 'Georgia, serif');
        const tlStr = (kural.transliteration1 || '') + '  ·  ' + (kural.transliteration2 || '');
        const tlLines = wrap(ctx, tlStr, INNER - CARD*2);

        const heroInner =
            lh(30) + lh(12) +                         // kural num pill
            cTaLines.length * lh(66) + lh(10) +       // chapter ta
            lh(36) + lh(8) +                           // chapter en
            lh(2) + GAP +                              // divider
            kLines.length * lh(96) + lh(16) +         // kural
            lh(2) + GAP +                              // divider
            tlLines.length * lh(40);                   // tlit

        const heroH = CARD + heroInner + CARD;
        const heroX = PAD, heroW = INNER;

        // Border only — transparent background
        ctx.save();
        roundRect(ctx, heroX, y, heroW, heroH, lh(12));
        ctx.strokeStyle = BORDER; ctx.lineWidth = lh(3); ctx.globalAlpha = 0.8; ctx.stroke();
        ctx.restore();
        ctx.save();
        roundRect(ctx, heroX + lh(8), y + lh(8), heroW - lh(16), heroH - lh(16), lh(8));
        ctx.strokeStyle = BORDER; ctx.lineWidth = lh(1); ctx.globalAlpha = 0.3; ctx.stroke();
        ctx.restore();

        // ✦ top & bottom — drawn on parchment, no bg erase
        ctx.save();
        ctx.font = f(24); ctx.fillStyle = BORDER; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.globalAlpha = 0.9;
        ctx.fillText('✦', W/2, y);
        ctx.fillText('✦', W/2, y + heroH);
        ctx.restore();

        let hy = y + CARD;

        // Athikaram · Kural number pill
        ctx.save();
        ctx.font = f(18, 'bold');
        const pillLabel = 'அதிகாரம் ' + (athikaram ? athikaram.id : '') + '  ·  குறள் ' + kural.Number;
        const pillW = Math.round(ctx.measureText(pillLabel).width) + lh(48), pillH = lh(30);
        const pillX = W/2 - pillW/2;
        roundRect(ctx, pillX, hy, pillW, pillH, pillH/2);
        ctx.fillStyle = PRIMARY; ctx.fill();
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
        ctx.fillText(pillLabel, W/2, hy + pillH * 0.68);
        ctx.restore();
        hy += pillH + lh(12);

        // Chapter Tamil name
        ctx.font = f(52, 'bold'); ctx.fillStyle = PRIMARY; ctx.textAlign = 'center';
        cTaLines.forEach((l, i) => ctx.fillText(l, W/2, hy + i * lh(66) + lh(50)));
        hy += cTaLines.length * lh(66) + lh(10);

        // Chapter English name
        ctx.font = f(30, 'italic', 'Georgia, serif'); ctx.fillStyle = TEXT_LITE;
        ctx.fillText(athikaram ? athikaram.en : '', W/2, hy + lh(28));
        hy += lh(36) + lh(8);

        // Divider (like the box-shadow rings)
        hline(ctx, heroX + CARD, heroX + heroW - CARD, hy, BORDER, 0.35, lh(1.5));
        hy += lh(2) + GAP;

        // Kural Tamil text — large, bold, centered (like .kural-hero-tamil)
        ctx.font = f(76, 'bold'); ctx.fillStyle = '#F5DEB3'; ctx.textAlign = 'center';
        ctx.save(); ctx.shadowColor = 'rgba(80,30,0,0.12)'; ctx.shadowBlur = lh(5);
        kLines.forEach((l, i) => ctx.fillText(l, W/2, hy + i * lh(96) + lh(74)));
        ctx.restore();
        hy += kLines.length * lh(96) + lh(16);

        // Divider
        hline(ctx, heroX + CARD, heroX + heroW - CARD, hy, BORDER, 0.25, lh(1));
        hy += lh(2) + GAP;

        // Transliteration (like .kural-translation-text italic)
        ctx.font = f(28, 'italic', 'Georgia, serif'); ctx.fillStyle = TLIT_CLR; ctx.textAlign = 'center';
        tlLines.forEach((l, i) => ctx.fillText(l, W/2, hy + i * lh(40) + lh(28)));

        y += heroH + GAP * 2;

        // ── Section label ──
        ctx.font = f(22, 'bold'); ctx.fillStyle = '#C8A45A'; ctx.textAlign = 'left';
        ctx.save(); ctx.globalAlpha = 0.7;
        ctx.fillText('TRANSLATIONS & COMMENTARIES', PAD, y + lh(22));
        ctx.restore();
        y += lh(30) + lh(12);

        // ── Kalaignar section — accent bar + text directly on parchment ──
        ctx.font = f(42); ctx.textAlign = 'left';
        const mkLines = wrap(ctx, kural.mk || '', INNER - CARD);

        ctx.save(); ctx.fillStyle = COMM_ACC; ctx.globalAlpha = 0.8;
        ctx.fillRect(PAD, y, lh(5), lh(32) + lh(10) + mkLines.length * lh(58));
        ctx.restore();

        let cy = y;
        ctx.font = f(28, 'bold'); ctx.fillStyle = '#D4A017'; ctx.textAlign = 'left';
        ctx.fillText('கலைஞர் உரை', PAD + lh(20), cy + lh(26)); cy += lh(32) + lh(10);
        ctx.font = f(42); ctx.fillStyle = '#F5DEB3';
        mkLines.forEach((l, i) => ctx.fillText(l, PAD + lh(20), cy + i * lh(58) + lh(42)));
        y += lh(32) + lh(10) + mkLines.length * lh(58) + GAP * 2;

        hline(ctx, PAD, PAD + INNER, y, BORDER, 0.18, lh(1));
        y += GAP * 2;

        // ── Kannan section — accent bar + text directly on parchment ──
        const enText = (kural.kannan_exp && kural.kannan_exp.trim()) ? kural.kannan_exp : (kural.pope_exp || '');
        const enAuthor = (kural.kannan_exp && kural.kannan_exp.trim()) ? 'Kannan' : 'G.U. Pope';
        ctx.font = f(40, 'italic', 'Georgia, serif'); ctx.textAlign = 'left';
        const enLines = wrap(ctx, enText, INNER - CARD);

        ctx.save(); ctx.fillStyle = EN_ACC; ctx.globalAlpha = 0.8;
        ctx.fillRect(PAD, y, lh(5), lh(32) + lh(10) + enLines.length * lh(56));
        ctx.restore();

        cy = y;
        ctx.font = f(28, 'bold', 'Georgia, serif'); ctx.fillStyle = '#B8860B'; ctx.textAlign = 'left';
        ctx.fillText(enAuthor, PAD + lh(20), cy + lh(26)); cy += lh(32) + lh(10);
        ctx.font = f(40, 'italic', 'Georgia, serif'); ctx.fillStyle = '#F5DEB3';
        enLines.forEach((l, i) => ctx.fillText(l, PAD + lh(20), cy + i * lh(56) + lh(40)));
        y += lh(32) + lh(10) + enLines.length * lh(56) + GAP * 2;

        // ── Footer URL ──
        ctx.font = f(24, '', 'Georgia, serif'); ctx.fillStyle = '#C8A45A'; ctx.textAlign = 'center';
        ctx.globalAlpha = 0.65;
        ctx.fillText('tirukkural.in/kural.html?id=' + kural.Number, W/2, y + lh(22));
        ctx.globalAlpha = 1;

        return canvas;
    }

    // ── Share flow ──
    async function executeShare(kuralNumber, btn) {
        if (typeof kuralData === 'undefined' || !kuralData) {
            alert('Kural data not loaded yet — please wait a moment and try again.');
            return;
        }
        const kural = kuralData[kuralNumber - 1];
        if (!kural) return;
        const athikaram = typeof getAthikaramForKural === 'function'
            ? getAthikaramForKural(kuralNumber) : null;

        const orig = btn.innerHTML;
        btn.textContent = '⏳ Generating…';
        btn.disabled = true; btn.style.background = '#888';

        try {
            await new Promise(r => setTimeout(r, 60));
            const canvas = drawCard(kural, athikaram);
            const link = 'https://tirukkural.in/kural.html?id=' + kuralNumber;
            const shareText = '🎧 Read & listen today\'s Kural in 12 languages:\n' + link;

            canvas.toBlob(async function (blob) {
                const fileName = 'tirukkural-' + kuralNumber + '.png';
                if (navigator.canShare && navigator.share) {
                    const file = new File([blob], fileName, { type: 'image/png' });
                    if (navigator.canShare({ files: [file] })) {
                        try { await navigator.share({ files: [file], text: shareText }); return; }
                        catch (err) { if (err.name === 'AbortError') return; }
                    }
                }
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = fileName;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 3000);
                setTimeout(() => window.open('https://wa.me/?text=' + encodeURIComponent(shareText), '_blank'), 800);
            }, 'image/png');
        } catch (e) {
            console.error('kural-share:', e);
            alert('Could not generate image. Please try again.');
        } finally {
            setTimeout(() => { btn.innerHTML = orig; btn.disabled = false; btn.style.background = '#25D366'; }, 1400);
        }
    }

    const WA_ICON =
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" ' +
        'style="vertical-align:middle;margin-right:6px;flex-shrink:0">' +
        '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';

    // ══ kural.html page init ══
    function initKuralPage() {
        if (!document.getElementById('wa-share-style')) {
            const s = document.createElement('style');
            s.id = 'wa-share-style';
            s.textContent =
                '#wa-share-wrapper { margin: 20px 0 8px; text-align: center; }' +
                '#wa-share-btn { display:inline-flex; align-items:center; justify-content:center;' +
                '  padding:12px 26px; background:#25D366; color:#fff; border:none;' +
                '  border-radius:50px; font-size:1rem; font-weight:700; cursor:pointer;' +
                '  font-family:inherit; box-shadow:0 3px 14px rgba(37,211,102,0.4);' +
                '  transition:all 0.2s ease; max-width:320px; }' +
                '@media(max-width:600px){' +
                '  #wa-share-btn{width:100%!important;max-width:100%!important;border-radius:12px!important;}' +
                '}';
            document.head.appendChild(s);
        }

        function inject() {
            const old = document.getElementById('wa-share-wrapper');
            if (old) old.remove();
            const btn = document.createElement('button');
            btn.id = 'wa-share-btn';
            btn.innerHTML = WA_ICON + 'Share on WhatsApp';
            btn.addEventListener('mouseenter', () => { btn.style.background='#1da851'; btn.style.transform='translateY(-2px)'; });
            btn.addEventListener('mouseleave', () => { btn.style.background='#25D366'; btn.style.transform=''; });
            btn.addEventListener('click', () => executeShare(currentId, btn));
            const wrap = document.createElement('div');
            wrap.id = 'wa-share-wrapper'; wrap.appendChild(btn);
            const hero = document.querySelector('#kural-content .kural-hero');
            const anchor = hero || document.getElementById('kural-content');
            if (anchor) anchor.insertAdjacentElement('afterend', wrap);
        }

        const el = document.getElementById('kural-content');
        if (!el) { setTimeout(initKuralPage, 200); return; }
        new MutationObserver(() => setTimeout(inject, 100)).observe(el, { childList: true });
        setTimeout(inject, 400);
    }

    // ══ athikaram-view.html page init ══
    function initAthikaramPage() {
        if (!document.getElementById('wa-share-style')) {
            const s = document.createElement('style');
            s.id = 'wa-share-style';
            s.textContent =
                '.kural-card-header-btns { display:flex; align-items:center; gap:8px; }' +
                '.ath-share-btn { display:inline-flex; align-items:center; font-size:0.78rem;' +
                '  font-weight:600; color:#25D366; background:none; border:1px solid #25D366;' +
                '  padding:3px 10px; border-radius:12px; cursor:pointer; font-family:inherit;' +
                '  transition:all 0.2s ease; white-space:nowrap; line-height:1.4; }' +
                '.ath-share-btn:hover { background:#25D366; color:#fff; }' +
                '.ath-share-btn:disabled { opacity:0.5; cursor:default; }';
            document.head.appendChild(s);
        }

        function attachAll() {
            document.querySelectorAll('.kural-card').forEach(card => {
                const header = card.querySelector('.kural-card-header');
                const numEl  = card.querySelector('.kural-number-small');
                if (!header || !numEl || header.querySelector('.kural-card-header-btns')) return;
                const match = numEl.textContent.match(/\d+/);
                if (!match) return;
                const kuralNumber = parseInt(match[0], 10);
                const readLink = header.querySelector('.kural-view-btn');
                if (!readLink) return;
                const group = document.createElement('div');
                group.className = 'kural-card-header-btns';
                readLink.parentNode.insertBefore(group, readLink);
                group.appendChild(readLink);
                const btn = document.createElement('button');
                btn.className = 'ath-share-btn';
                btn.innerHTML = WA_ICON + 'Share';
                btn.title = 'Share Kural ' + kuralNumber;
                btn.addEventListener('click', () => executeShare(kuralNumber, btn));
                group.appendChild(btn);
            });
        }

        const container = document.getElementById('kurals-list') || document.querySelector('main');
        if (!container) { setTimeout(initAthikaramPage, 300); return; }
        attachAll();
        new MutationObserver(() => setTimeout(attachAll, 80)).observe(container, { childList: true, subtree: true });
    }

    function boot() {
        if (document.getElementById('kural-content')) initKuralPage();
        else if (document.getElementById('kurals-list')) initAthikaramPage();
        else setTimeout(boot, 200);
    }

    document.readyState === 'loading'
        ? document.addEventListener('DOMContentLoaded', boot)
        : boot();

})();
