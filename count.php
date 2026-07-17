<?php
// count.php — internal page-view counter endpoint.
// Called via a small fetch() from page-counter.js on every page load.
// Being a real .php file means it just works on any PHP host — no
// .htaccess handler config needed (that approach didn't work reliably
// across different hosting setups).

require_once __DIR__ . '/counter.php';

header('Content-Type: application/json');
header('Cache-Control: no-store');

$page = isset($_GET['page']) ? preg_replace('/[^a-zA-Z0-9_\-]/', '', $_GET['page']) : '';
$id   = isset($_GET['id']) ? (int) $_GET['id'] : 0;

if ($page === '') {
    http_response_code(400);
    echo json_encode(['error' => 'missing page']);
    exit;
}

$key = $id > 0 ? $page . '_' . $id : $page;

// Per-page count: every view counts, unchanged.
$count = tk_page_view_count($key);

// Site-wide total: counted once per session, not once per page view.
// A session cookie (no expiry = cleared when the browser closes) marks
// whether this visitor's already been counted; repeat page loads in the
// same session just read the current total instead of bumping it again.
$isNewSession = !isset($_COOKIE['tk_sid']);
if ($isNewSession) {
    setcookie('tk_sid', bin2hex(random_bytes(8)), 0, '/', '', false, true);
    $siteTotal = tk_page_view_count('site_total');
} else {
    $siteTotal = tk_read_count('site_total');
}

echo json_encode([
    'count'       => $count,
    'site_total'  => $siteTotal,
]);
