// Language Management System
let currentLanguage = 'ta'; // Default Tamil
let translations = {};
let languageData = {};

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    await loadTranslations();
    initializeLanguage();
    initializeWelcomeModal();
    initializeLanguageDropdown();
});

// Load translations — localStorage first (instant), fallback to fetch + cache
// translations.json: UI strings + language config
// athikaram-titles.json: chapter name translations (separate, lazy)
async function loadTranslations() {
    const CACHE_KEY   = 'tirukkural_translations_v2';
    const TITLES_KEY  = 'tirukkural_titles_v1';
    try {
        // ── UI strings + language config ──
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const data = JSON.parse(cached);
            translations = data.translations;
            languageData = data.languages;
            fetch('translations.json').then(r => r.json())
                .then(f => localStorage.setItem(CACHE_KEY, JSON.stringify(f))).catch(() => {});
        } else {
            const data = await (await fetch('translations.json')).json();
            translations = data.translations;
            languageData = data.languages;
            try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch(e) {}
        }
        // ── Chapter titles (separate file) ──
        const cachedTitles = localStorage.getItem(TITLES_KEY);
        if (cachedTitles) {
            window.athikaram_names = JSON.parse(cachedTitles);
            fetch('athikaram-titles.json').then(r => r.json())
                .then(f => localStorage.setItem(TITLES_KEY, JSON.stringify(f))).catch(() => {});
        } else {
            const titles = await (await fetch('athikaram-titles.json')).json();
            window.athikaram_names = titles;
            try { localStorage.setItem(TITLES_KEY, JSON.stringify(titles)); } catch(e) {}
        }
    } catch (error) {
        console.error('Error loading translations:', error);
    }
}

// Initialize language from cookie or default
function initializeLanguage() {
    const savedLang = getCookie('thirukkural_lang');
    if (savedLang && translations[savedLang]) {
        currentLanguage = savedLang;
    }
    
    // Apply translations first
    applyTranslations();
    
    // Then trigger re-render with proper delay
    setTimeout(() => {
        // Trigger re-render on athikarams page
        if (typeof displayAthikarams === 'function') {
            const urlParams = new URLSearchParams(window.location.search);
            const paalFilter = urlParams.get('paal');
            displayAthikarams(paalFilter || 'all');
        }
        
        if (typeof displayAthikaram === 'function' && typeof currentAthikaramId !== 'undefined') {
            displayAthikaram(currentAthikaramId);
        }
    }, 100);
}

// Apply translations to page
function applyTranslations() {
    if (!translations[currentLanguage]) return;
    
    const t = translations[currentLanguage];
    
    // Translate all elements with data-translate attribute
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (t[key]) {
            element.textContent = t[key];
        }
    });

    // Translate placeholder attributes (data-translate-placeholder)
    document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        if (t[key]) {
            element.setAttribute('placeholder', t[key]);
        }
    });
    
    // Translate specific content elements by ID
    const elementsToTranslate = {
        'introText': 'intro_text',
        'thiruvalluvarBio': 'thiruvalluvar_bio',
        'siteTitle': 'site_title',
        'siteTagline': 'site_tagline',
        'siteSubtitle': 'site_subtitle',
        'virtueDesc': 'virtue_desc',
        'wealthDesc': 'wealth_desc',
        'loveDesc': 'love_desc',
        'thirukkuralPaalTitle': 'three_books_title',
        'contributorsBannerText': 'contributors_subtitle',
        'statLabelIyal': 'sections'
    };
    
    Object.entries(elementsToTranslate).forEach(([elementId, translationKey]) => {
        const element = document.getElementById(elementId);
        if (element && t[translationKey]) {
            element.textContent = t[translationKey];
        }
    });
    
    // Update HTML lang attribute
    document.documentElement.lang = currentLanguage === 'ta' ? 'ta' : 
                                    currentLanguage === 'ar' ? 'ar' : 'en';
}

// Change language
function changeLanguage(langCode) {
    if (!translations[langCode]) return;
    
    currentLanguage = langCode;
    setCookie('thirukkural_lang', langCode, 365);
    applyTranslations();
    updateLanguageDropdown();
    
    // Trigger re-render of dynamic content if functions exist
    if (typeof displayAthikarams === 'function') {
        // On athikarams page - re-render cards
        const urlParams = new URLSearchParams(window.location.search);
        const paalFilter = urlParams.get('paal');
        displayAthikarams(paalFilter || 'all');
    }
    
    if (typeof displayAthikaram === 'function' && typeof currentAthikaramId !== 'undefined') {
        // On athikaram-view page - re-render
        displayAthikaram(currentAthikaramId);
    }
    
    if (typeof displayKural === 'function' && typeof currentKuralNumber !== 'undefined') {
        // On kural page - re-render
        displayKural(currentKuralNumber);
    }
}

// Initialize welcome modal
function initializeWelcomeModal() {
    const modal = document.getElementById('welcomeModal');
    if (!modal) return;
    
    // Check if user has dismissed modal before
    const dontShow = getCookie('thirukkural_hide_welcome');
    if (dontShow === 'true') {
        modal.classList.add('hidden');
        return;
    }
    
    // Show modal
    modal.classList.remove('hidden');
}

// Close welcome modal
function closeWelcomeModal() {
    const modal = document.getElementById('welcomeModal');
    const dontShowAgain = document.getElementById('dontShowAgain');
    
    if (dontShowAgain && dontShowAgain.checked) {
        setCookie('thirukkural_hide_welcome', 'true', 365);
    }
    
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Reopen welcome modal (from header button)
function openWelcomeModal() {
    const modal = document.getElementById('welcomeModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

// Initialize language dropdown in header
function initializeLanguageDropdown() {
    const dropdown = document.getElementById('languageDropdown');
    if (!dropdown) return;
    
    let html = '<option value="" disabled>Choose Language</option>';
    
    // Indian Languages
    html += '<optgroup label="🇮🇳 Indian Languages">';
    Object.entries(languageData).forEach(([code, data]) => {
        if (data.segment === 'indian' && code !== 'bn') {
            html += `<option value="${code}" ${currentLanguage === code ? 'selected' : ''}>${data.flag} ${data.nativeName}</option>`;
        }
    });
    html += '</optgroup>';
    
    // International Languages
    html += '<optgroup label="🌍 International Languages">';
    Object.entries(languageData).forEach(([code, data]) => {
        if (data.segment === 'international') {
            html += `<option value="${code}" ${currentLanguage === code ? 'selected' : ''}>${data.flag} ${data.nativeName}</option>`;
        }
    });
    html += '</optgroup>';
    
    dropdown.innerHTML = html;
    
    // Add change event listener
    dropdown.addEventListener('change', function() {
        changeLanguage(this.value);
    });
}

// Update language dropdown selected value
function updateLanguageDropdown() {
    const dropdown = document.getElementById('languageDropdown');
    if (dropdown) {
        dropdown.value = currentLanguage;
    }
}

// Cookie helper functions
function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// Get translated text helper
function t(key) {
    if (translations[currentLanguage] && translations[currentLanguage][key]) {
        return translations[currentLanguage][key];
    }
    return key;
}

// Get current language code
function getCurrentLanguage() {
    return currentLanguage;
}

// Export for use in other scripts
window.changeLanguage = changeLanguage;
window.closeWelcomeModal = closeWelcomeModal;
window.openWelcomeModal = openWelcomeModal;
window.t = t;
window.getCurrentLanguage = getCurrentLanguage;
