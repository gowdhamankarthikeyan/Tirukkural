// ============================================================
// today-overlay.js — Nav-triggered "Today's Kural" popup.
// Builds the overlay DOM once, lazily, on first open. Uses the
// shared TodayKural module (today-kural.js) for data + rendering,
// so this stays in sync with the standalone today.html page.
// ============================================================

function openTodayOverlay() {
    let overlay = document.getElementById('todayOverlay');
    if (!overlay) overlay = buildTodayOverlay();
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    loadTodayOverlayContent();
}

function closeTodayOverlay() {
    const overlay = document.getElementById('todayOverlay');
    if (overlay) overlay.classList.add('hidden');
    document.body.style.overflow = '';
}

function buildTodayOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'todayOverlay';
    overlay.className = 'modal-overlay hidden';
    overlay.innerHTML =
        '<div class="modal-container">' +
            '<button class="modal-close" onclick="closeTodayOverlay()">&times;</button>' +
            '<div id="todayOverlayBody"><div class="tk-overlay-loading">Loading…</div></div>' +
        '</div>';
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeTodayOverlay();
    });
    document.body.appendChild(overlay);
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !overlay.classList.contains('hidden')) closeTodayOverlay();
    });
    return overlay;
}

async function loadTodayOverlayContent() {
    const body = document.getElementById('todayOverlayBody');
    if (!body) return;
    try {
        const d = await TodayKural.fetchData();
        body.innerHTML =
            '<div class="tk-overlay-card">' + TodayKural.cardHTML(d) + '</div>' +
            '<div class="tk-overlay-actions">' +
                '<button class="tk-overlay-btn-share" id="todayOverlayShareBtn">' +
                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>' +
                    d.tr('share') +
                '</button>' +
                '<a class="tk-overlay-btn-read" href="kural.html?id=' + d.kuralNum + '">' + d.tr('read') + '</a>' +
            '</div>';

        const shareBtn = document.getElementById('todayOverlayShareBtn');
        if (shareBtn) {
            window.kuralData = window.kuralData || {};
            window.kuralData[d.kuralNum - 1] = d.kural;
            shareBtn.addEventListener('click', function () {
                window.currentId = d.kuralNum;
                window.executeShare(d.kuralNum, shareBtn);
            });
        }
    } catch (e) {
        body.innerHTML = '<p style="color:#c00;padding:40px 20px;text-align:center">Could not load kural data.<br>Check your internet connection.</p>';
    }
}
