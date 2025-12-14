class LanguageSwitcher {
  constructor() {
    this.currentLang = 'en';
    this.init();
  }
  
  init() {
    this.createLanguageSwitcher();
    this.loadSavedLanguage();
    
    document.addEventListener('langChanged', (e) => {
      this.currentLang = e.detail.lang;
      this.updateLanguageButtons();
    });
  }
  
  createLanguageSwitcher() {
    if (document.getElementById('languageSwitcher')) return;
    
    const nav = document.querySelector('.nav');
    if (!nav) return;
    
    const langContainer = document.createElement('div');
    langContainer.className = 'language-switcher';
    langContainer.id = 'languageSwitcher';
    langContainer.innerHTML = `
      <button class="lang-btn" data-lang="en" title="English">
        <span>EN</span>
      </button>
      <button class="lang-btn" data-lang="ru" title="Русский">
        <span>RU</span>
      </button>
    `;
    
    const themeSwitcher = nav.querySelector('.theme-switcher');
    if (themeSwitcher) {
      nav.insertBefore(langContainer, themeSwitcher);
    } else {
      const authButtons = nav.querySelector('.auth-buttons');
      if (authButtons) {
        nav.insertBefore(langContainer, authButtons);
      } else {
        nav.appendChild(langContainer);
      }
    }
    
    langContainer.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const lang = e.currentTarget.dataset.lang;
        this.switchLanguage(lang);
      });
    });
    
    this.updateLanguageButtons();
  }
  
  switchLanguage(lang) {
    if (lang === this.currentLang) return;
    
    this.currentLang = lang;
    
    if (window.getTranslate) {
      window.getTranslate(lang);
    }
    
    const event = new CustomEvent('langChanged', { detail: { lang } });
    document.dispatchEvent(event);
    
    localStorage.setItem('lang', lang);
    
    this.updateLanguageButtons();
  }
  
  updateLanguageButtons() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      if (btn.dataset.lang === this.currentLang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
  
  loadSavedLanguage() {
    const savedLang = localStorage.getItem('lang');
    if (savedLang && savedLang !== this.currentLang) {
      this.switchLanguage(savedLang);
    }
  }
}

window.languageSwitcher = new LanguageSwitcher();