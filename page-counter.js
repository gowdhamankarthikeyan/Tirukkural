// ============================================================
// page-counter.js — fetches this page's view count (and the
// site-wide total) from count.php and fills in the page.
// The page identifies itself via <body data-counter-page="...">;
// pages with a ?id= in the URL (kural.html, athikaram-view.html)
// don't need anything extra — the id is read from the URL here.
// ============================================================

(function () {
    var page = document.body.getAttribute('data-counter-page');
    if (!page) return;

    var id = new URLSearchParams(location.search).get('id') || '';
    var url = 'count.php?page=' + encodeURIComponent(page) + (id ? '&id=' + encodeURIComponent(id) : '');

    fetch(url)
        .then(function (r) { return r.json(); })
        .then(function (d) {
            var pv = document.getElementById('pageViewCount');
            if (pv && typeof d.count === 'number') {
                pv.textContent = d.count.toLocaleString('en-IN') + ' views';
            }
            var vc = document.getElementById('visitCount');
            if (vc && typeof d.site_total === 'number') {
                vc.textContent = d.site_total.toLocaleString('en-IN');
            }
        })
        .catch(function () { /* counter is best-effort — fail silently */ });
})();
