class ThemeManager {
  constructor() {
    this.currentTheme = 'dark'; 
    this.currentLang = 'en';
    this.init();
  }
  
  init() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.currentTheme = savedTheme;
    }
    
    this.currentLang = localStorage.getItem('lang') || 'en';
    
    document.addEventListener('langChanged', (event) => {
      this.currentLang = event.detail.lang;
      this.updateThemeTranslations();
    });
    
    this.applyTheme(this.currentTheme);
    
    this.createThemeSwitcher();
    
    this.updateThemeTranslations();
    
    window.addEventListener('beforeunload', () => {
      this.saveSettings();
    });
  }
  
  getTranslation(key, defaultValue = '') {
    const translations = window.i18Obj?.[this.currentLang];
    return translations?.[key] || defaultValue;
  }
  
  updateThemeTranslations() {
    const lightBtn = document.querySelector('.theme-btn.light-btn');
    const darkBtn = document.querySelector('.theme-btn.dark-btn');
    
    if (lightBtn) {
      lightBtn.title = this.getTranslation('theme-light', 'Light theme');
    }
    
    if (darkBtn) {
      darkBtn.title = this.getTranslation('theme-dark', 'Dark theme');
    }
  }
  
  applyTheme(theme) {
    try {
      this.currentTheme = theme;
      document.documentElement.setAttribute('data-theme', theme);
      
      this.updateThemeButtons(theme);
      
      localStorage.setItem('theme', theme);
      
      if (theme !== this.currentTheme) {
        const themeName = theme === 'light' ? 
          this.getTranslation('theme-light', 'Light theme') : 
          this.getTranslation('theme-dark', 'Dark theme');
        const activatedText = this.getTranslation('theme-activated', '{theme} activated').replace('{theme}', themeName);
        
        if (window.authService) {
          window.authService.showNotification(activatedText, 'success');
        }
      }
    } catch (error) {
      console.error('Error applying theme:', error);
    }
  }
  
  createThemeSwitcher() {
    if (document.getElementById('themeSwitcher')) return;
    
    try {
      const nav = document.querySelector('.nav');
      if (!nav) return;
      
      const themeContainer = document.createElement('div');
      themeContainer.className = 'theme-switcher';
      themeContainer.id = 'themeSwitcher';
      themeContainer.innerHTML = `
        <button class="theme-btn light-btn" data-theme="light" title="${this.getTranslation('theme-light', 'Light theme')}">
          <i class="fas fa-sun"></i>
        </button>
        <button class="theme-btn dark-btn" data-theme="dark" title="${this.getTranslation('theme-dark', 'Dark theme')}">
          <i class="fas fa-moon"></i>
        </button>
      `;
      
      const authButtons = nav.querySelector('.auth-buttons');
      if (authButtons) {
        nav.insertBefore(themeContainer, authButtons);
      } else {
        nav.appendChild(themeContainer);
      }
      
      themeContainer.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const theme = e.currentTarget.dataset.theme;
          this.applyTheme(theme);
        });
      });
      
      this.updateThemeButtons(this.currentTheme);
    } catch (error) {
      console.error('Error creating theme switcher:', error);
    }
  }
  
  updateThemeButtons(currentTheme) {
    try {
      document.querySelectorAll('.theme-btn').forEach(btn => {
        if (btn.dataset.theme === currentTheme) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    } catch (error) {
      console.error('Error updating theme buttons:', error);
    }
  }
  
  saveSettings() {
    try {
      const settings = {
        theme: this.currentTheme,
        lang: this.currentLang,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('userSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }
  
  loadSettings() {
    try {
      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        
        if (settings.theme) {
          this.applyTheme(settings.theme);
        }
        
        if (settings.lang && window.getTranslate) {
          try {
            window.getTranslate(settings.lang);
          } catch (translateError) {
            console.error('Error loading language:', translateError);
          }
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }
  
  resetSettings() {
    try {
      this.applyTheme('dark');
      
      if (window.getTranslate) {
        try {
          window.getTranslate('en');
        } catch (translateError) {
          console.error('Error resetting language:', translateError);
        }
      }
      
      localStorage.removeItem('userSettings');
      
      if (window.authService) {
        window.authService.showNotification(
          this.getTranslation('settings-reset-success', 'Settings have been reset to default'),
          'success'
        );
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
    }
  }
}

window.themeManager = new ThemeManager();