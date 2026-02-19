// Load athikarams data
document.addEventListener('DOMContentLoaded', async function() {
    // Wait for translations to be ready
    await waitForTranslations();
    
    // Load athikarams metadata
    const script = document.createElement('script');
    script.src = 'athikarams-data.js';
    document.head.appendChild(script);
    
    await new Promise(resolve => {
        script.onload = resolve;
    });
    
    // Get paal filter from URL
    const urlParams = new URLSearchParams(window.location.search);
    const paalFilter = urlParams.get('paal');
    
    // Display athikarams
    displayAthikarams(paalFilter || 'all');
    
    // Setup filter tabs
    setupFilterTabs();
});

// Wait for language.js to finish loading translations data
function waitForTranslations() {
    return new Promise(resolve => {
        if (window.athikaram_names) {
            resolve();
        } else {
            const checkInterval = setInterval(() => {
                if (window.athikaram_names) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 50);
        }
    });
}

function displayAthikarams(paalFilter) {
    const listContainer = document.getElementById('athikarams-list');
    listContainer.innerHTML = '';
    listContainer.style.opacity = '0';
    
    let filteredAthikarams = ATHIKARAMS;
    
    if (paalFilter !== 'all') {
        const paalNum = parseInt(paalFilter);
        filteredAthikarams = ATHIKARAMS.filter(a => a.paal === paalNum);
    }
    
    filteredAthikarams.forEach(athikaram => {
        const card = createAthikaramCard(athikaram);
        listContainer.appendChild(card);
    });
    
    // Fade in after rendering
    setTimeout(() => {
        listContainer.style.opacity = '1';
        listContainer.style.transition = 'opacity 0.3s ease';
    }, 50);
}

function createAthikaramCard(athikaram) {
    const card = document.createElement('div');
    card.className = 'athikaram-card';
    card.onclick = () => {
        window.location.href = `athikaram-view.html?id=${athikaram.id}`;
    };
    
    // Get translated text
    const chapterText = window.t ? window.t('chapter') : 'அதிகாரம்';
    const kuralText = window.t ? window.t('couplet') : 'குறள்';
    
    // Get translated athikaram name (English name in selected language)
    let athikaramNameEn = athikaram.en;
    const currentLang = window.getCurrentLanguage ? window.getCurrentLanguage() : 'ta';
    
    // Try to get translated athikaram name
    if (window.athikaram_names && 
        window.athikaram_names[currentLang] && 
        window.athikaram_names[currentLang][athikaram.id.toString()]) {
        athikaramNameEn = window.athikaram_names[currentLang][athikaram.id.toString()];
    }
    
    card.innerHTML = `
        <div class="athikaram-number">${chapterText} ${athikaram.id}</div>
        <div class="athikaram-title-ta">${athikaram.ta}</div>
        <div class="athikaram-title-en">${athikaramNameEn}</div>
        <div class="athikaram-range">${kuralText} ${athikaram.start} - ${athikaram.end}</div>
    `;
    
    return card;
}

function setupFilterTabs() {
    const tabs = document.querySelectorAll('.filter-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Filter athikarams
            const paal = this.dataset.paal;
            displayAthikarams(paal);
            
            // Update URL
            const url = new URL(window.location);
            if (paal === 'all') {
                url.searchParams.delete('paal');
            } else {
                url.searchParams.set('paal', paal);
            }
            window.history.pushState({}, '', url);
        });
    });
    
    // Set active tab based on URL
    const urlParams = new URLSearchParams(window.location.search);
    const paalFilter = urlParams.get('paal') || 'all';
    const activeTab = document.querySelector(`[data-paal="${paalFilter}"]`);
    if (activeTab) {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        activeTab.classList.add('active');
    }
}
