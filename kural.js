// Global variables
let kuralData = null;
let currentKuralNumber = 1;
let currentAthikaram = null;

document.addEventListener('DOMContentLoaded', async function() {
    // Wait for translations to be ready
    await waitForTranslations();
    
    // Load athikarams metadata
    const athikaramsScript = document.createElement('script');
    athikaramsScript.src = 'athikarams-data.js';
    document.head.appendChild(athikaramsScript);
    
    await new Promise(resolve => {
        athikaramsScript.onload = resolve;
    });
    
    // Load kural data
    await loadKuralData();
    
    // Get kural number from URL
    const urlParams = new URLSearchParams(window.location.search);
    const kuralNum = parseInt(urlParams.get('number')) || 1;
    currentKuralNumber = kuralNum;
    
    // Display kural
    displayKural(currentKuralNumber);
    
    // Setup navigation
    setupNavigation();
});

// Wait for translations to be loaded
function waitForTranslations() {
    return new Promise(resolve => {
        if (window.translations && window.getCurrentLanguage) {
            resolve();
        } else {
            const checkInterval = setInterval(() => {
                if (window.translations && window.getCurrentLanguage) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        }
    });
}

async function loadKuralData() {
    try {
        const response = await fetch('thirukkural.json');
        const data = await response.json();
        kuralData = data.kural;
    } catch (error) {
        console.error('Error loading kural data:', error);
        document.getElementById('kural-content').innerHTML = 
            '<div class="loading">தரவு ஏற்றுவதில் பிழை. பக்கத்தை மீண்டும் ஏற்றவும்.</div>';
    }
}

function getAthikaramByKuralNumber(kuralNum) {
    return ATHIKARAMS.find(a => kuralNum >= a.start && kuralNum <= a.end);
}

function displayKural(kuralNumber) {
    if (!kuralData) {
        return;
    }
    
    const kural = kuralData[kuralNumber - 1];
    if (!kural) {
        document.getElementById('kural-content').innerHTML = 
            '<div class="loading">குறள் கிடைக்கவில்லை</div>';
        return;
    }
    
    currentAthikaram = getAthikaramByKuralNumber(kuralNumber);
    
    const container = document.getElementById('kural-content');
    container.innerHTML = createKuralHTML(kural, currentAthikaram);
    
    // Setup translate buttons for explanations
    setupExplanationTranslateButtons();
    
    // Update URL
    const url = new URL(window.location);
    url.searchParams.set('number', kuralNumber);
    if (currentAthikaram) {
        url.searchParams.set('athikaram', currentAthikaram.id);
    }
    window.history.pushState({}, '', url);
}

function createKuralHTML(kural, athikaram) {
    // Split kural into proper format
    const line1Words = kural.Line1.trim().split(' ');
    const line2Words = kural.Line2.trim().split(' ');
    
    // Format transliteration
    const translit1 = kural.transliteration1 || '';
    const translit2 = kural.transliteration2 || '';
    
    // Get translated text
    const kuralText = window.t ? window.t('couplet') : 'குறள்';
    const chapterText = window.t ? window.t('chapter') : 'அதிகாரம்';
    const explText = window.t ? window.t('explanations') : 'விளக்கங்கள்';
    const scholarMV = window.t ? window.t('scholar_mv') : 'மு. வரதராசனார்';
    const scholarSP = window.t ? window.t('scholar_sp') : 'சாலமன் பாப்பையா';
    const scholarMK = window.t ? window.t('scholar_mk') : 'கலைஞர்';
    const translateBtn = window.t ? window.t('translate') : 'Translate';
    
    // Get translated athikaram name
    let athikaramNameEn = athikaram ? athikaram.en : '';
    if (athikaram) {
        const currentLang = window.getCurrentLanguage ? window.getCurrentLanguage() : 'ta';
        if (window.athikaram_names && 
            window.athikaram_names[currentLang] && 
            window.athikaram_names[currentLang][athikaram.id.toString()]) {
            athikaramNameEn = window.athikaram_names[currentLang][athikaram.id.toString()];
        }
    }
    
    return `
        <div class="kural-container">
            <div class="kural-header">
                <div class="kural-number">${kuralText} ${kural.Number}</div>
                ${athikaram ? `<div class="athikaram-name">${chapterText} ${athikaram.id}. ${athikaram.ta} (${athikaramNameEn})</div>` : ''}
            </div>
            
            <div class="kural-text-section">
                <div class="kural-tamil">
                    <span class="kural-line">${line1Words.join(' ')}</span>
                    <span class="kural-line">${line2Words.join(' ')}</span>
                </div>
                <div class="transliteration">
                    <span class="transliteration-line">${translit1}</span>
                    <span class="transliteration-line">${translit2}</span>
                </div>
            </div>
            
            <div class="explanations-section">
                <h3 style="color: var(--primary-color); margin-bottom: 20px;">${explText}</h3>
                
                ${kural.mv ? `
                <div class="explanation-item">
                    <div class="explanation-header">
                        <div class="explanation-author">${scholarMV}</div>
                        <button class="explanation-translate-btn" data-text="${escapeHtml(kural.mv)}">${translateBtn}</button>
                    </div>
                    <div class="explanation-text">${kural.mv}</div>
                </div>
                ` : ''}
                
                ${kural.sp ? `
                <div class="explanation-item">
                    <div class="explanation-header">
                        <div class="explanation-author">${scholarSP}</div>
                        <button class="explanation-translate-btn" data-text="${escapeHtml(kural.sp)}">${translateBtn}</button>
                    </div>
                    <div class="explanation-text">${kural.sp}</div>
                </div>
                ` : ''}
                
                ${kural.mk ? `
                <div class="explanation-item">
                    <div class="explanation-header">
                        <div class="explanation-author">${scholarMK}</div>
                        <button class="explanation-translate-btn" data-text="${escapeHtml(kural.mk)}">${translateBtn}</button>
                    </div>
                    <div class="explanation-text">${kural.mk}</div>
                </div>
                ` : ''}
            </div>
        </div>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function setupExplanationTranslateButtons() {
    const translateBtns = document.querySelectorAll('.explanation-translate-btn');
    
    translateBtns.forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.preventDefault();
            const text = this.getAttribute('data-text');
            const encodedText = encodeURIComponent(text);
            
            // Check if device is mobile
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            if (isMobile) {
                // On mobile: Try to copy first, then open translate
                try {
                    // Try copying to clipboard
                    await navigator.clipboard.writeText(text);
                    
                    // Brief feedback
                    const originalText = this.textContent;
                    this.textContent = 'Opening...';
                    this.style.background = 'linear-gradient(135deg, #34a853 0%, #34a853 100%)';
                    
                    // Open Google Translate after brief delay
                    setTimeout(() => {
                        const translateUrl = `https://translate.google.com/?sl=ta&tl=en&text=${encodedText}&op=translate`;
                        window.open(translateUrl, '_blank');
                        
                        // Reset button
                        this.textContent = originalText;
                        this.style.background = '';
                    }, 500);
                } catch (err) {
                    // If clipboard fails, just open translate
                    const translateUrl = `https://translate.google.com/?sl=ta&tl=en&text=${encodedText}&op=translate`;
                    window.open(translateUrl, '_blank');
                }
            } else {
                // On desktop: Open Google Translate in new window
                const translateUrl = `https://translate.google.com/?sl=ta&tl=en&text=${encodedText}&op=translate`;
                window.open(translateUrl, '_blank', 'width=900,height=700');
            }
        });
    });
}

function setupNavigation() {
    const prevBtn = document.getElementById('prev-kural');
    const nextBtn = document.getElementById('next-kural');
    
    prevBtn.addEventListener('click', function() {
        if (currentKuralNumber > 1) {
            currentKuralNumber--;
            displayKural(currentKuralNumber);
            updateNavigationButtons();
            window.scrollTo(0, 0);
        }
    });
    
    nextBtn.addEventListener('click', function() {
        if (currentKuralNumber < 1330) {
            currentKuralNumber++;
            displayKural(currentKuralNumber);
            updateNavigationButtons();
            window.scrollTo(0, 0);
        }
    });
    
    updateNavigationButtons();
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-kural');
    const nextBtn = document.getElementById('next-kural');
    
    prevBtn.disabled = currentKuralNumber <= 1;
    nextBtn.disabled = currentKuralNumber >= 1330;
}
