// ============================================================
// kural-share.js — Share card · Parchment design
// Palette mirrors kural.html / kural.css exactly.
// Layout engine guarantees NO overflow: measures all content,
// scales fonts down until everything fits, then draws.
// ============================================================

(function () {

    const W = 2160, H = 3840;

    // ── Palette from kural.html / styles.css ──
    const PRIMARY  = '#e06b00';   // --primary-color  (deep orange-red)
    const SECONDARY= '#fa8c16';   // --secondary-color
    const TEXT_DARK= '#4a2500';   // --text-dark
    const TEXT_LITE= '#595959';   // --text-light
    const BG_HERO  = '#fff9f0';   // .kural-hero background
    const BORDER   = '#c8964a';   // .kural-hero-border color
    const TLIT_CLR = '#6b5a4e';   // .kural-translation-text color
    const COMM_ACC = '#e07b39';   // commentary border accent
    const EN_ACC   = '#4a7eb5';   // english commentary accent
    const BG_PAGE  = '#fafafa';   // body background-color
    const BG_MK    = '#fafafa';   // .kural-commentary-item background
    const BG_EN    = '#f7f9fd';   // .kural-commentary-english background

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

    // ── Compute kural font size so each line fits in one line ──
    function kuralFontSize(ctx, kural, maxW, baseSize, s) {
        let sz = Math.round(baseSize * s);
        // Each Tamil line must fit on exactly one line — shrink font until both fit
        for (let attempt = 0; attempt < 60; attempt++) {
            ctx.font = 'bold ' + sz + 'px Palatino Linotype, Palatino, Book Antiqua, serif';
            const w1 = ctx.measureText(kural.Line1 || '').width;
            const w2 = ctx.measureText(kural.Line2 || '').width;
            if (w1 <= maxW && w2 <= maxW) break;
            sz -= 2;
            if (sz < 20) break;
        }
        return sz;
    }

    // ── Measure total height for a given font scale ──
    function measureTotal(ctx, scale, kural, athikaram) {
        const s = scale;
        const PAD    = Math.round(72 * s);
        const INNER  = W - PAD * 2;
        const CARD   = Math.round(36 * s);  // card inner padding

        // fonts
        function f(size, style, family) {
            return (style ? style + ' ' : '') + Math.round(size * s) + 'px ' + (family || 'Palatino Linotype, Palatino, Book Antiqua, serif');
        }

        let total = PAD; // top margin

        // ── Header block ──
        total += Math.round(50 * s); // site name (no Tamil subtitle)
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
        // kural lines — always exactly 2 lines (one per Line1/Line2)
        const kuralSz = kuralFontSize(ctx, kural, INNER - CARD*2, 72, 1);
        total += 2 * Math.round(kuralSz * 1.3) + Math.round(16 * s);
        // divider
        total += Math.round(20 * s);
        // transliteration
        ctx.font = f(30, 'bold italic', 'Palatino Linotype, Palatino, Georgia, serif');
        const tlStr = (kural.transliteration1 || '') + '  ·  ' + (kural.transliteration2 || '');
        const tlLines = wrap(ctx, tlStr, INNER - CARD*2);
        total += tlLines.length * Math.round(44 * s);
        total += CARD;  // bottom padding hero

        total += Math.round(24 * s); // gap after hero

        // ── Kalaignar section ──
        total += Math.round(32 * s) + Math.round(10 * s); // label
        ctx.font = f(44, '600');
        const mkLines = wrap(ctx, kural.mk || '', INNER - CARD);
        total += mkLines.length * Math.round(62 * s);
        total += Math.round(32 * s); // gap + divider

        // ── English section ──
        total += Math.round(32 * s) + Math.round(10 * s);
        ctx.font = f(42, '600 italic', 'Palatino Linotype, Palatino, Georgia, serif');
        const enText = (kural.Number <= 1080 && kural.kannan_exp && kural.kannan_exp.trim()) ? kural.kannan_exp : (kural.pope_exp || '');
        const enLines = wrap(ctx, enText, INNER - CARD);
        total += enLines.length * Math.round(60 * s);
        total += Math.round(16 * s); // gap before footer

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
        // Find scale that fills H as fully as possible without overflow
        // Search range 0.5 – 3.0 to accommodate 2x canvas
        let lo = 0.5, hi = 3.0, scale = 1.5;
        for (let iter = 0; iter < 24; iter++) {
            const mid = (lo + hi) / 2;
            if (measureTotal(ctx, mid, kural, athikaram) <= H * 0.90) { lo = mid; scale = mid; }
            else hi = mid;
        }

        const s    = scale;
        const PAD  = Math.round(72 * s);
        const INNER= W - PAD * 2;
        const CARD = Math.round(36 * s);
        const GAP  = Math.round(16 * s);

        function f(size, style, family) {
            return (style ? style + ' ' : '') + Math.round(size * s) + 'px ' + (family || 'Palatino Linotype, Palatino, Book Antiqua, serif');
        }
        function lh(size) { return Math.round(size * s); }

        // ══ Background — exact body background-color from styles.css ══
        ctx.fillStyle = BG_PAGE; ctx.fillRect(0, 0, W, H);

        // Outer border — single rule, #c8964a
        const B = Math.round(40 * s);
        ctx.save();
        ctx.strokeStyle = BORDER; ctx.lineWidth = Math.round(3 * s);
        ctx.strokeRect(B, B, W - B*2, H - B*2);
        ctx.restore();


        // ══ Layout start ══
        let y = B + lh(32); // start below outer border+diamond

        // ── Site name header ──
        ctx.textAlign = 'center';
        ctx.font = f(46, 'bold'); ctx.fillStyle = PRIMARY;
        ctx.fillText('Tirukkuṟaḷ', W/2, y + lh(38)); y += lh(50);

        y += GAP * 2; // extra breathing room before hero card

        // ── Hero card (like .kural-hero.kural-hero-border) ──
        // Measure hero content height first
        ctx.font = f(52, 'bold');
        const cTaLines = wrap(ctx, athikaram ? athikaram.ta : '', INNER - CARD*2);
        // Compute kural font size so each line never wraps (auto-fit)
        const kuralSz = kuralFontSize(ctx, kural, INNER - CARD*2, 72, 1);
        const kuralLH = Math.round(kuralSz * 1.3);
        ctx.font = f(30, 'bold italic', 'Palatino Linotype, Palatino, Georgia, serif');
        const tlStr = (kural.transliteration1 || '') + '  ·  ' + (kural.transliteration2 || '');
        const tlLines = wrap(ctx, tlStr, INNER - CARD*2);

        const heroInner =
            lh(30) + lh(12) +                         // kural num pill
            cTaLines.length * lh(56) + lh(6) +        // chapter ta
            lh(30) + lh(8) +                           // chapter en
            lh(2) + GAP +                              // divider
            2 * kuralLH + lh(16) +                    // kural (always exactly 2 lines)
            lh(2) + GAP +                              // divider
            tlLines.length * lh(44);                   // tlit

        const heroH = CARD + heroInner + CARD;
        const heroX = PAD, heroW = INNER;

        // Hero card — .kural-hero background + .kural-hero-border double-ring
        // CSS: border: 2px solid #c8964a
        //      box-shadow: 0 0 0 6px #fff9f0, 0 0 0 8px #c8964a,
        //                  0 0 0 13px #fff9f0, 0 0 0 14px rgba(200,150,74,.35)
        // Replicated as 4 inset strokes expanding outward:
        const O1 = lh(6),  O2 = lh(8),  O3 = lh(13), O4 = lh(14);
        // Fill background
        ctx.save();
        roundRect(ctx, heroX, y, heroW, heroH, lh(12));
        ctx.fillStyle = BG_HERO; ctx.fill();
        ctx.restore();
        // Ring 1 — inner border: 2px #c8964a (flush with card edge)
        ctx.save();
        roundRect(ctx, heroX, y, heroW, heroH, lh(12));
        ctx.strokeStyle = BORDER; ctx.lineWidth = lh(2); ctx.stroke();
        ctx.restore();
        // Ring 2 — gap: 6px #fff9f0
        ctx.save();
        roundRect(ctx, heroX - O1, y - O1, heroW + O1*2, heroH + O1*2, lh(15));
        ctx.strokeStyle = BG_HERO; ctx.lineWidth = lh(6); ctx.stroke();
        ctx.restore();
        // Ring 3 — outer border: 2px #c8964a
        ctx.save();
        roundRect(ctx, heroX - O2, y - O2, heroW + O2*2, heroH + O2*2, lh(16));
        ctx.strokeStyle = BORDER; ctx.lineWidth = lh(2); ctx.stroke();
        ctx.restore();
        // Ring 4 — outer gap + faint ring
        ctx.save();
        roundRect(ctx, heroX - O3, y - O3, heroW + O3*2, heroH + O3*2, lh(17));
        ctx.strokeStyle = BG_HERO; ctx.lineWidth = lh(5); ctx.stroke();
        roundRect(ctx, heroX - O4, y - O4, heroW + O4*2, heroH + O4*2, lh(17));
        ctx.strokeStyle = BORDER; ctx.lineWidth = lh(1); ctx.globalAlpha = 0.35; ctx.stroke();
        ctx.restore();
        // ✦ ::before/::after — erase outer border, draw star
        ctx.save();
        ctx.font = f(22); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = BG_PAGE;
        ctx.fillRect(W/2 - lh(26), y - O4 - lh(16), lh(52), lh(32));
        ctx.fillRect(W/2 - lh(26), y + heroH + O4 - lh(16), lh(52), lh(32));
        ctx.fillStyle = BORDER;
        ctx.fillText('✦', W/2, y - O1);
        ctx.fillText('✦', W/2, y + heroH + O1);
        ctx.restore();

        let hy = y + CARD;

        // Athikaram · Kural number pill
        ctx.save();
        ctx.font = f(22, 'bold');
        const pillLabel = 'Chapter ' + (athikaram ? Number(athikaram.id) : '?') + '  ·  Kural ' + kural.Number;
        const pillW = Math.round(ctx.measureText(pillLabel).width) + lh(56), pillH = lh(34);
        const pillX = W/2 - pillW/2;
        roundRect(ctx, pillX, hy, pillW, pillH, pillH/2);
        ctx.fillStyle = PRIMARY; ctx.fill();
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
        ctx.fillText(pillLabel, W/2, hy + pillH * 0.68);
        ctx.restore();
        hy += pillH + lh(14);

        // Chapter Tamil name (large) + English name below it
        ctx.font = f(44, 'bold'); ctx.fillStyle = PRIMARY; ctx.textAlign = 'center';
        cTaLines.forEach((l, i) => ctx.fillText(l, W/2, hy + i * lh(56) + lh(44)));
        hy += cTaLines.length * lh(56) + lh(6);
        ctx.font = f(26, 'italic', 'Palatino Linotype, Palatino, Georgia, serif'); ctx.fillStyle = TEXT_LITE;
        ctx.fillText(athikaram ? athikaram.en : '', W/2, hy + lh(24));
        hy += lh(30) + lh(8);

        // Divider (like the box-shadow rings)
        hline(ctx, heroX + CARD, heroX + heroW - CARD, hy, BORDER, 0.35, lh(1.5));
        hy += lh(2) + GAP;

        // Kural Tamil text — auto-sized bold, centered, always exactly 2 lines
        ctx.font = 'bold ' + kuralSz + 'px Palatino Linotype, Palatino, Book Antiqua, serif';
        ctx.fillStyle = TEXT_DARK; ctx.textAlign = 'center';
        ctx.save(); ctx.shadowColor = 'rgba(80,30,0,0.12)'; ctx.shadowBlur = lh(4);
        ctx.fillText(kural.Line1 || '', W/2, hy + kuralLH * 0.8);
        ctx.fillText(kural.Line2 || '', W/2, hy + kuralLH * 0.8 + kuralLH);
        ctx.restore();
        hy += 2 * kuralLH + lh(16);

        // Divider
        hline(ctx, heroX + CARD, heroX + heroW - CARD, hy, BORDER, 0.25, lh(1));
        hy += lh(2) + GAP;

        // Transliteration — bold italic, clearly visible
        ctx.font = f(30, 'bold italic', 'Palatino Linotype, Palatino, Georgia, serif'); ctx.fillStyle = TLIT_CLR; ctx.textAlign = 'center';
        tlLines.forEach((l, i) => ctx.fillText(l, W/2, hy + i * lh(44) + lh(30)));

        y += heroH + GAP * 2;

        // ── Kalaignar section — accent bar + text directly on parchment ──
        ctx.font = f(44, '600'); ctx.textAlign = 'left';
        const mkLines = wrap(ctx, kural.mk || '', INNER - CARD);

        // .kural-commentary-item: background #fafafa, border-left 3px solid #e07b39
        ctx.save();
        const mkH = lh(16) + lh(32) + lh(10) + mkLines.length * lh(62);
        ctx.fillStyle = BG_MK; ctx.fillRect(PAD, y, INNER, mkH);
        ctx.fillStyle = COMM_ACC; ctx.fillRect(PAD, y, lh(6), mkH);
        ctx.restore();

        let cy = y;
        ctx.font = f(30, 'bold'); ctx.fillStyle = '#c8964a'; ctx.textAlign = 'left';
        ctx.fillText('கலைஞர் உரை', PAD + lh(22), cy + lh(28)); cy += lh(36) + lh(10);
        ctx.font = f(44, '600'); ctx.fillStyle = TEXT_DARK;
        mkLines.forEach((l, i) => ctx.fillText(l, PAD + lh(22), cy + i * lh(62) + lh(44)));
        y += mkH + GAP;

        hline(ctx, PAD, PAD + INNER, y, BORDER, 0.18, lh(1));
        y += GAP * 2;

        // ── Kannan section — accent bar + text directly on parchment ──
        const enText = (kural.Number <= 1080 && kural.kannan_exp && kural.kannan_exp.trim()) ? kural.kannan_exp : (kural.pope_exp || '');
        const enAuthor = (kural.Number <= 1080 && kural.kannan_exp && kural.kannan_exp.trim()) ? 'Kannan' : 'G.U. Pope';
        ctx.font = f(42, '600 italic', 'Palatino Linotype, Palatino, Georgia, serif'); ctx.textAlign = 'left';
        const enLines = wrap(ctx, enText, INNER - CARD);

        // .kural-commentary-english: background #f7f9fd, border-left 3px solid #4a7eb5
        ctx.save();
        const enH = lh(16) + lh(32) + lh(10) + enLines.length * lh(60);
        ctx.fillStyle = BG_EN; ctx.fillRect(PAD, y, INNER, enH);
        ctx.fillStyle = EN_ACC; ctx.fillRect(PAD, y, lh(6), enH);
        ctx.restore();

        cy = y;
        ctx.font = f(30, 'bold', 'Palatino Linotype, Palatino, Georgia, serif'); ctx.fillStyle = '#4a7eb5'; ctx.textAlign = 'left';
        ctx.fillText(enAuthor, PAD + lh(22), cy + lh(28)); cy += lh(36) + lh(10);
        ctx.font = f(42, '600 italic', 'Palatino Linotype, Palatino, Georgia, serif'); ctx.fillStyle = TEXT_DARK;
        enLines.forEach((l, i) => ctx.fillText(l, PAD + lh(22), cy + i * lh(60) + lh(42)));
        y += enH + GAP;

        // ── Footer watermark — two line gap then right-aligned Tamil name ──
        ctx.font = f(28, 'italic', 'Palatino Linotype, Palatino, Georgia, serif'); ctx.fillStyle = '#595959'; ctx.textAlign = 'right';
        ctx.globalAlpha = 0.65;
        ctx.fillText('... அன்புடன் கௌதமன் கார்த்திகேயன்', PAD + INNER, y + lh(44) + lh(22));
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
            const shareText = '🎧 Read & listen today\'s Kural in 15 languages:\n' + link;

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
            }, 'image/png');
        } catch (e) {
            console.error('kural-share:', e);
            alert('Could not generate image. Please try again.');
        } finally {
            setTimeout(() => { btn.innerHTML = orig; btn.disabled = false; btn.style.background = ''; }, 1400);
        }
    }

    const SHARE_ICON =
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" ' +
        'style="vertical-align:middle;margin-right:6px;flex-shrink:0">' +
        '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>' +
        '<line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>';

    // ══ kural.html page init ══
    function initKuralPage() {
        if (!document.getElementById('share-style')) {
            const s = document.createElement('style');
            s.id = 'share-style';
            s.textContent =
                '#share-wrapper { margin: 20px 0 8px; text-align: center; display:flex; gap:10px; flex-wrap:wrap; justify-content:center; }' +
                '#share-btn { display:inline-flex; align-items:center; justify-content:center;' +
                '  padding:12px 26px; background:var(--primary-color); color:#fff; border:none;' +
                '  border-radius:50px; font-size:1rem; font-weight:700; cursor:pointer;' +
                '  font-family:inherit; box-shadow:0 3px 14px rgba(212,56,13,0.35);' +
                '  transition:all 0.2s ease; }' +
                '#audio-info-btn { display:inline-flex; align-items:center; justify-content:center; gap:6px;' +
                '  padding:12px 20px; background:none; color:var(--primary-color); border:2px solid var(--primary-color);' +
                '  border-radius:50px; font-size:1rem; font-weight:600; cursor:pointer;' +
                '  font-family:inherit; transition:all 0.2s ease; }' +
                '#audio-info-btn:hover { background:var(--primary-color); color:#fff; }' +
                '#audio-info-modal { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.6);' +
                '  z-index:9999; align-items:center; justify-content:center; padding:20px; }' +
                '#audio-info-modal.open { display:flex; }' +
                '#audio-info-box { background:#fff; border-radius:16px; padding:28px 24px; max-width:480px;' +
                '  width:100%; box-shadow:0 8px 40px rgba(0,0,0,0.3); font-family:inherit; }' +
                '#audio-info-box h3 { margin:0 0 16px; color:var(--primary-color); font-size:1.15rem; }' +
                '#audio-info-box p { margin:0 0 12px; color:#444; font-size:0.95rem; line-height:1.6; }' +
                '#audio-info-box ol { margin:0 0 16px; padding-left:20px; color:#333; font-size:0.92rem; line-height:1.8; }' +
                '#audio-info-box .close-btn { display:block; width:100%; padding:10px; background:var(--primary-color);' +
                '  color:#fff; border:none; border-radius:8px; font-size:1rem; font-weight:700;' +
                '  cursor:pointer; font-family:inherit; margin-top:4px; }' +
                '.voice-status { font-size:0.82rem; color:#888; margin-top:4px; padding:8px 12px;' +
                '  background:#f5f5f5; border-radius:8px; }' +
                '@media(max-width:600px){' +
                '  #share-btn,#audio-info-btn{width:100%;border-radius:12px!important;}' +
                '  #share-wrapper{flex-direction:column;}' +
                '}';
            document.head.appendChild(s);
        }

        function buildModal() {
            if (document.getElementById('audio-info-modal')) return;
            const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
            const tamilVoice = voices.find(v => v.lang.startsWith('ta'));
            const voiceList = voices.length
                ? voices.map(v => v.name + ' (' + v.lang + ')').join(', ')
                : 'No voices detected yet — try tapping \"Audio Info\" after the page fully loads.';
            const modal = document.createElement('div');
            modal.id = 'audio-info-modal';
            modal.innerHTML =
                '<div id=\"audio-info-box\">'+
                '<h3>🔊 Audio & Voice Info</h3>'+
                '<p>Tamil and English kurals play from pre-recorded MP3s. All other languages use your device\'s Text-to-Speech (TTS) engine.</p>'+
                '<p><strong>If audio is silent for non-English languages:</strong></p>'+
                '<ol>'+
                '<li>Open <strong>Settings → General Management → Language</strong></li>'+
                '<li>Tap <strong>Text-to-speech</strong></li>'+
                '<li>Choose <strong>Samsung TTS</strong> or <strong>Google TTS</strong> as preferred engine</li>'+
                '<li>Tap ⚙️ settings → <strong>Install voice data</strong> → download languages needed</li>'+
                '</ol>'+
                '<p class=\"voice-status\"><strong>Tamil voice available:</strong> ' + (tamilVoice ? '✅ ' + tamilVoice.name : '❌ Not found — install Tamil TTS data') + '</p>'+
                '<p class=\"voice-status\"><strong>All voices on this device (' + voices.length + '):</strong><br>' + voiceList + '</p>'+
                '<button class=\"close-btn\">Got it</button>'+
                '</div>';
            modal.addEventListener('click', e => { if (e.target === modal || e.target.classList.contains('close-btn')) modal.classList.remove('open'); });
            document.body.appendChild(modal);
        }

        function inject() {
            const old = document.getElementById('share-wrapper');
            if (old) old.remove();
            // Share button
            const btn = document.createElement('button');
            btn.id = 'share-btn';
            btn.innerHTML = SHARE_ICON + (window.t ? window.t('share') : 'Share');
            btn.addEventListener('click', () => executeShare(currentId, btn));
            // Audio info button
            const infoBtn = document.createElement('button');
            infoBtn.id = 'audio-info-btn';
            infoBtn.innerHTML = window.t ? window.t('audio_info') : '🔊 Audio Info';
            infoBtn.addEventListener('click', () => {
                buildModal();
                document.getElementById('audio-info-modal').classList.add('open');
            });
            const wrap = document.createElement('div');
            wrap.id = 'share-wrapper';
            wrap.appendChild(btn);
            wrap.appendChild(infoBtn);
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
        if (!document.getElementById('share-style')) {
            const s = document.createElement('style');
            s.id = 'share-style';
            s.textContent =
                '.kural-card-header-btns { display:flex; align-items:center; gap:8px; }' +
                '.ath-share-btn { display:inline-flex; align-items:center; font-size:0.78rem;' +
                '  font-weight:600; color:var(--primary-color); background:none; border:1px solid var(--primary-color);' +
                '  padding:3px 10px; border-radius:12px; cursor:pointer; font-family:inherit;' +
                '  transition:all 0.2s ease; white-space:nowrap; line-height:1.4; }' +
                '.ath-share-btn:hover { background:var(--primary-color); color:#fff; }' +
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
                btn.innerHTML = SHARE_ICON + (window.t ? window.t('share') : 'Share');
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

    function boot(attempt) {
        attempt = attempt || 0;
        if (document.getElementById('kural-content')) { initKuralPage(); return; }
        if (document.getElementById('kurals-list')) { initAthikaramPage(); return; }
        // Give up after ~4 seconds — this page just doesn't have either element
        // (e.g. it only needs the exported executeShare for the Today's Kural overlay).
        if (attempt < 20) setTimeout(function () { boot(attempt + 1); }, 200);
    }

    document.readyState === 'loading'
        ? document.addEventListener('DOMContentLoaded', function () { boot(0); })
        : boot(0);

    window.executeShare = executeShare;

})();
