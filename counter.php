<?php
// counter.php — internal per-page view counter, no external service.
// Each page has its own flat text file under counters/ holding just a number.
// Safe for concurrent visitors: uses flock() so two requests incrementing
// at the same instant can't overwrite each other's count.

function tk_page_view_count($key) {
    $dir = __DIR__ . '/counters';
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }

    // Keep filenames predictable and safe regardless of what's passed in.
    $safeKey = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $key);
    $file = $dir . '/' . $safeKey . '.txt';

    $fp = @fopen($file, 'c+');
    if (!$fp) {
        // Counters directory isn't writable — fail quietly, don't break the page.
        return null;
    }

    $count = 0;
    if (flock($fp, LOCK_EX)) {
        $contents = stream_get_contents($fp);
        $count = ((int) trim($contents)) + 1;
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, (string) $count);
        fflush($fp);
        flock($fp, LOCK_UN);
    } else {
        // Couldn't get a lock in time — read whatever's there without incrementing,
        // rather than risking a corrupted write.
        rewind($fp);
        $count = (int) trim(stream_get_contents($fp));
    }
    fclose($fp);

    return $count;
}

// Reads the current value without incrementing it — used when a page load
// shouldn't count as a new hit (e.g. same-session repeat views on the
// site-wide session counter).
function tk_read_count($key) {
    $dir = __DIR__ . '/counters';
    $safeKey = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $key);
    $file = $dir . '/' . $safeKey . '.txt';
    if (!is_file($file)) return 0;
    $contents = @file_get_contents($file);
    return (int) trim((string) $contents);
}
