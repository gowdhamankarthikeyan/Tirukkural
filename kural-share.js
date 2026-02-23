// ============================================================
// kural-share.js — WhatsApp status card · Palm Leaf design
// Standalone — reads globals from kural.js:
//   kuralData, currentId, getAthikaramForKural
// Zero changes to any other file.
// ============================================================

(function () {

    const W = 1080, H = 1920, PAD = 76, INNER = W - PAD * 2;
    const FOOTER_H = 320, CONTENT_TOP = 76;

    // ── Palette ──
    const INK   = '#5C2800';   // warm chestnut — main body text
    const INK2  = '#7A3A10';   // mid brown — borders, footer
    const INK3  = '#9E5C20';   // lighter brown — subtitles, tlit
    const RED   = '#8B1A00';   // deep red — brand, section labels
    const BROWN = '#8B4A10';   // warm brown — kural number, holes

    // ── Text wrap ──
    function wrap(ctx, text, maxW) {
        if (!text) return [];
        const words = text.split(' '), lines = []; let line = '';
        for (const w of words) {
            const t = line ? line + ' ' + w : w;
            if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; }
            else line = t;
        }
        if (line) lines.push(line);
        return lines;
    }

    // ── Horizontal rule ──
    function hline(ctx, x1, x2, y, color, alpha, lw) {
        ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = lw || 2;
        ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke(); ctx.restore();
    }

    // ── Layout engine — measures content, distributes spare height evenly ──
    function computeLayout(ctx, kural, athikaram) {
        const fonts = getFonts();

        ctx.font = fonts.chapterTa;
        const chTaLines = wrap(ctx, athikaram ? athikaram.ta : '', INNER);
        const chTaH = chTaLines.length * fonts.chapterTaLH;

        ctx.font = fonts.kural;
        const tLines = [
            ...wrap(ctx, kural.Line1 || '', INNER - 40),
            ...wrap(ctx, kural.Line2 || '', INNER - 40),
        ];
        const kuralH = tLines.length * fonts.kuralLH;

        ctx.font = fonts.tlit;
        const tlitStr = (kural.transliteration1 || '') + '  ·  ' + (kural.transliteration2 || '');
        const tlLines = wrap(ctx, tlitStr, INNER);
        const tlitH = tlLines.length * fonts.tlitLH;

        ctx.font = fonts.mk;
        const mkLines = wrap(ctx, kural.mk || '', INNER);
        const mkH = mkLines.length * fonts.mkLH;

        ctx.font = fonts.en;
        const enText = (kural.kannan_exp && kural.kannan_exp.trim()) ? kural.kannan_exp : kural.pope_exp || '';
        const enLines = wrap(ctx, enText, INNER);
        const enH = enLines.length * fonts.enLH;

        // Fixed heights of all non-gap elements
        const RULE = 12;
        const fixed =
            CONTENT_TOP +
            fonts.brandH + fonts.subtitleH +   // brand block
            RULE +                              // divider after brand
            chTaH + fonts.chEnH + fonts.kuralNumH + // chapter block
            RULE +                              // divider after chapter
            kuralH +                            // kural
            RULE +                              // divider after kural
            fonts.sectionLabelH + mkH +         // kalaignar
            RULE +                              // divider after kalaignar
            fonts.sectionLabelH + enH +         // kannan
            FOOTER_H;

        const gap = Math.floor((H - fixed) / 5);

        return { chTaLines, tLines, tlLines, mkLines, enLines, enText,
                 chTaH, kuralH, mkH, enH, gap, RULE };
    }

    function getFonts() {
        return {
            brand:        'bold 60px serif',
            brandH:       68,
            subtitle:     '32px Georgia, serif',
            subtitleH:    36,
            chapterTa:    'bold 54px serif',
            chapterTaLH:  66,
            chapterEn:    'italic 34px Georgia, serif',
            chEnH:        40,
            kuralNum:     '30px Georgia, serif',
            kuralNumH:    36,
            kural:        'bold 76px serif',
            kuralLH:      94,
            tlit:         'italic 30px Georgia, serif',
            tlitLH:       40,
            sectionLabel: 'bold 36px serif',
            sectionLabelH: 44,
            mk:           '44px serif',
            mkLH:         58,
            en:           'italic 42px Georgia, serif',
            enLH:         56,
        };
    }

    // ── Main card renderer ──
    function drawCard(kural, athikaram) {
        const canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d');
        const F = getFonts();

        // ── Background: warm parchment gradient ──
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0,    '#DFC89A');
        bg.addColorStop(0.25, '#F2E2B2');
        bg.addColorStop(0.60, '#E6D09A');
        bg.addColorStop(0.85, '#F2E2B2');
        bg.addColorStop(1,    '#C8A860');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

        // Horizontal grain lines — ola leaf texture
        ctx.save(); ctx.globalAlpha = 0.055; ctx.strokeStyle = '#7A5A10'; ctx.lineWidth = 1;
        for (let gy = 0; gy < H; gy += 16) {
            ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
        }
        ctx.restore();

        // Edge vignette — aged look
        const vig = ctx.createRadialGradient(W/2, H/2, W*0.2, W/2, H/2, W*0.92);
        vig.addColorStop(0, 'rgba(0,0,0,0)');
        vig.addColorStop(1, 'rgba(60,30,0,0.4)');
        ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);

        // Border — double line
        ctx.save();
        ctx.strokeStyle = INK2; ctx.lineWidth = 6; ctx.globalAlpha = 0.65;
        ctx.strokeRect(28, 28, W-56, H-56);
        ctx.strokeStyle = INK3; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.35;
        ctx.strokeRect(42, 42, W-84, H-84);
        ctx.restore();

        // Ola leaf binding holes
        function holeRow(hy) {
            ctx.save(); ctx.fillStyle = BROWN; ctx.globalAlpha = 0.45;
            for (let i = 0; i < 9; i++) {
                ctx.beginPath(); ctx.arc(PAD + i * 118, hy, 7, 0, Math.PI*2); ctx.fill();
            }
            ctx.restore();
        }
        holeRow(54);

        // ── Compute layout ──
        const L = computeLayout(ctx, kural, athikaram);
        const G = L.gap;
        const chTa  = athikaram ? athikaram.ta : '';
        const chEn  = athikaram ? athikaram.en : '';
        const chId  = athikaram ? athikaram.id : '';

        let y = CONTENT_TOP;

        // ── Brand ──
        ctx.fillStyle = RED; ctx.font = F.brand; ctx.textAlign = 'center';
        ctx.fillText('Tirukkuṟaḷ', W/2, y + 58); y += F.brandH;

        // Divider
        y += G * 0.5;
        hline(ctx, 56, W-56, y, INK2, 0.5, 3); y += L.RULE + G * 0.5;

        // ── Chapter ──
        ctx.font = F.chapterTa; ctx.fillStyle = INK; ctx.textAlign = 'center';
        L.chTaLines.forEach((l, i) => ctx.fillText(l, W/2, y + i * F.chapterTaLH + F.chapterTaLH * 0.8));
        y += L.chTaH;
        ctx.font = F.chapterEn; ctx.fillStyle = INK3;
        ctx.fillText(chEn, W/2, y + F.chEnH - 8); y += F.chEnH;
        ctx.font = F.kuralNum; ctx.fillStyle = BROWN;
        ctx.fillText('அதிகாரம் ' + chId + '  ·  குறள் ' + kural.Number, W/2, y + F.kuralNumH - 8); y += F.kuralNumH;

        // Divider
        y += G * 0.5;
        hline(ctx, 56, W-56, y, INK2, 0.5, 2); y += L.RULE + G * 0.5;

        // ── Kural hero ──
        ctx.save();
        ctx.font = F.kural; ctx.fillStyle = INK; ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(80,30,0,0.18)'; ctx.shadowBlur = 6;
        L.tLines.forEach((l, i) => ctx.fillText(l, W/2, y + i * F.kuralLH + F.kuralLH * 0.8));
        y += L.kuralH; ctx.restore();

        // Divider
        y += G * 0.5;
        hline(ctx, PAD, W-PAD, y, INK3, 0.35, 1); y += L.RULE + G * 0.5;

        // ── Kalaignar Urai ──
        ctx.font = F.sectionLabel; ctx.fillStyle = RED; ctx.textAlign = 'left';
        ctx.fillText('கலைஞர் உரை', PAD, y + F.sectionLabelH - 8); y += F.sectionLabelH;
        ctx.font = F.mk; ctx.fillStyle = INK; ctx.textAlign = 'left';
        L.mkLines.forEach((l, i) => ctx.fillText(l, PAD, y + i * F.mkLH + F.mkLH * 0.8));
        y += L.mkH;

        // Divider
        y += G * 0.5;
        hline(ctx, PAD, W-PAD, y, INK3, 0.35, 1); y += L.RULE + G * 0.5;

        // ── Kannan ──
        ctx.font = 'bold 36px Georgia, serif'; ctx.fillStyle = RED; ctx.textAlign = 'left';
        ctx.fillText('Kannan', PAD, y + F.sectionLabelH - 8); y += F.sectionLabelH;
        ctx.font = F.en; ctx.fillStyle = INK; ctx.textAlign = 'left';
        L.enLines.forEach((l, i) => ctx.fillText(l, PAD, y + i * F.enLH + F.enLH * 0.82));
        y += L.enH;

        // ── Footer ──
        const fY = H - FOOTER_H;
        hline(ctx, 56, W-56, fY + 8, INK2, 0.5, 3);
        ctx.font = '30px Georgia, serif'; ctx.fillStyle = INK3; ctx.textAlign = 'center';
        ctx.fillText('tirukkural.in/kural.html?id=' + kural.Number, W/2, fY + 60);
        holeRow(H - 48);

        return canvas;
    }

    // ── Shared: execute share flow for a given kural number + button ──
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
        btn.disabled = true;
        btn.style.background = '#888';

        try {
            await new Promise(r => setTimeout(r, 60));
            const canvas = drawCard(kural, athikaram);
            const link = 'https://tirukkural.in/kural.html?id=' + kuralNumber;
            const shareText = '🎧 Read & listen today\'s Kural in 12 languages:\n' + link;

            canvas.toBlob(async function (blob) {
                const fileName = 'tirukkural-' + kuralNumber + '.png';

                // Mobile: Web Share API — hands image directly to WhatsApp
                if (navigator.canShare && navigator.share) {
                    const file = new File([blob], fileName, { type: 'image/png' });
                    if (navigator.canShare({ files: [file] })) {
                        try {
                            await navigator.share({ files: [file], text: shareText });
                            return;
                        } catch (err) {
                            if (err.name === 'AbortError') return;
                        }
                    }
                }
                // Desktop: download PNG + open WhatsApp
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

    // ── Shared: WA SVG icon string ──
    const WA_ICON =
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" ' +
        'style="vertical-align:middle;margin-right:6px;flex-shrink:0">' +
        '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';

    // ══════════════════════════════════════════════
    // PAGE: kural.html — big centred share button
    // ══════════════════════════════════════════════
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
            wrap.id = 'wa-share-wrapper';
            wrap.appendChild(btn);
            const hero = document.querySelector('#kural-content .kural-hero');
            const anchor = hero || document.getElementById('kural-content');
            if (anchor) anchor.insertAdjacentElement('afterend', wrap);
        }

        const el = document.getElementById('kural-content');
        if (!el) { setTimeout(initKuralPage, 200); return; }
        new MutationObserver(() => setTimeout(inject, 100)).observe(el, { childList: true });
        setTimeout(inject, 400);
    }

    // ══════════════════════════════════════════════
    // PAGE: athikaram-view.html — small button next to Read
    // ══════════════════════════════════════════════
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

    // ── Boot: detect page and initialise ──
    function boot() {
        if (document.getElementById('kural-content')) {
            initKuralPage();
        } else if (document.getElementById('kurals-list')) {
            initAthikaramPage();
        }
        // If neither exists yet, wait and retry
        else { setTimeout(boot, 200); }
    }

    document.readyState === 'loading'
        ? document.addEventListener('DOMContentLoaded', boot)
        : boot();

})();
