// ============================================================
// tts-shared.js — Single source of truth for audio playback.
// Used by kural.js and athikaram-view.js (previously each had
// their own separate, drifted implementation — consolidated
// here so a fix in one place fixes it everywhere).
//
// Behavior:
//   - Tamil and English have pre-recorded human audio (/audio/{code}/{number}.mp3).
//     Every other language goes straight to the browser's speechSynthesis —
//     no point attempting a recording fetch that will always 404.
//   - speechSynthesis rate is 0.85 (matches the app's own fallback convention).
//   - Chrome silently cuts off speechSynthesis after ~15 seconds unless
//     something periodically pauses/resumes it — TTSShared handles that.
//   - Works with either page's icon markup (.kural-audio-icon or .audio-btn-icon).
// ============================================================

const TTSShared = (function () {
    // Languages with actual pre-recorded MP3s. Add a code here once a
    // recording exists for it — everything else goes straight to TTS.
    const RECORDED_AUDIO_LANGS = ['ta', 'en'];
    const AUDIO_BASE = '/audio';

    let _currentAudio = null;
    let _currentUtterance = null;
    let _currentBtn = null;
    let _keepAliveInterval = null;

    function _setIcon(btn, glyph) {
        if (!btn) return;
        const icon = btn.querySelector('.kural-audio-icon, .audio-btn-icon');
        if (icon) icon.textContent = glyph;
        else btn.textContent = glyph;
    }

    function _setState(btn, playing) {
        if (!btn) return;
        btn.classList.toggle('playing', playing);
        _setIcon(btn, playing ? '⏹' : '▶');
    }

    function _startKeepAlive() {
        _stopKeepAlive();
        _keepAliveInterval = setInterval(function () {
            if (window.speechSynthesis && window.speechSynthesis.speaking) {
                window.speechSynthesis.pause();
                window.speechSynthesis.resume();
            }
        }, 5000);
    }

    function _stopKeepAlive() {
        if (_keepAliveInterval) { clearInterval(_keepAliveInterval); _keepAliveInterval = null; }
    }

    function stop() {
        _stopKeepAlive();
        if (_currentAudio) { _currentAudio.pause(); _currentAudio.currentTime = 0; _currentAudio = null; }
        if (_currentUtterance) { if (window.speechSynthesis) window.speechSynthesis.cancel(); _currentUtterance = null; }
        if (_currentBtn) { _setState(_currentBtn, false); _currentBtn = null; }
    }

    function _getVoice(ttsCode, fallbackCode) {
        const voices = window.speechSynthesis.getVoices();
        return voices.find(v => v.lang === ttsCode)
            || (fallbackCode && voices.find(v => v.lang === fallbackCode))
            || voices.find(v => v.lang.startsWith(ttsCode.split('-')[0]));
    }

    function _speak(ttsCode, fallbackCode, text, btn) {
        if (!('speechSynthesis' in window)) { _setState(btn, false); return; }
        function go() {
            const utt = new SpeechSynthesisUtterance(text);
            utt.lang = ttsCode;
            utt.rate = 0.85;
            const voice = _getVoice(ttsCode, fallbackCode);
            if (voice) utt.voice = voice;
            utt.onstart = function () { _setState(btn, true); _startKeepAlive(); };
            utt.onend = utt.onerror = stop;
            _currentUtterance = utt;
            _currentBtn = btn;
            window.speechSynthesis.speak(utt);
        }
        if (window.speechSynthesis.getVoices().length > 0) {
            go();
        } else {
            window.speechSynthesis.onvoiceschanged = function () {
                window.speechSynthesis.onvoiceschanged = null;
                go();
            };
            setTimeout(function () { if (!_currentUtterance) go(); }, 1500);
        }
    }

    // options: { btn, kuralNumber, langCode, ttsCode, ttsFallbackCode, text, audioPath }
    // audioPath defaults to langCode; pass explicitly if it differs.
    function play(options) {
        const btn = options.btn;
        if (_currentBtn === btn) { stop(); return; }
        stop();
        if (!options.text || !options.text.trim()) return;

        const canUseRecording = RECORDED_AUDIO_LANGS.indexOf(options.langCode) !== -1 && options.kuralNumber;
        if (canUseRecording) {
            const path = options.audioPath || options.langCode;
            const audio = new Audio(AUDIO_BASE + '/' + path + '/' + options.kuralNumber + '.mp3');
            let fellBack = false;
            const fallback = function () {
                if (fellBack) return;
                fellBack = true;
                _currentAudio = null;
                _speak(options.ttsCode, options.ttsFallbackCode, options.text, btn);
            };
            audio.onplay  = function () { _setState(btn, true); };
            audio.onended = function () { _currentAudio = null; _currentBtn = null; _setState(btn, false); };
            audio.onpause = function () { if (!audio.ended) _setState(btn, false); };
            audio.onerror = fallback;
            _currentAudio = audio;
            _currentBtn = btn;
            audio.play().catch(fallback);
            return;
        }
        _speak(options.ttsCode, options.ttsFallbackCode, options.text, btn);
    }

    return { play: play, stop: stop };
})();
