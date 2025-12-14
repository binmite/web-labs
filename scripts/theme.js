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
    
    this.updateSettingsModalTranslations();
  }
  
  updateSettingsModalTranslations() {
    const settingsModal = document.getElementById('settingsModal');
    if (!settingsModal) return;
    
    const translations = {
      '.settings-title': 'settings-title',
      '.user-info-title': 'user-info-title',
      '.username-label': 'user-username',
      '.email-label': 'user-email',
      '.role-label': 'user-role',
      '.joined-label': 'user-joined',
      '.current-settings-title': 'settings-title',
      '.language-label': 'settings-language',
      '.theme-label': 'settings-theme',
      '#resetSettings': 'reset-settings',
      '#saveSettings': 'save-changes',
      '.sign-in-text': 'sign-in-to-view',
      '.sign-in-btn': 'sign-in-button'
    };
    
    Object.entries(translations).forEach(([selector, key]) => {
      const element = settingsModal.querySelector(selector);
      if (element) {
        const translation = this.getTranslation(key);
        if (translation) {
          element.textContent = translation;
        }
      }
    });
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
      
      this.createSettingsModal();
    } catch (error) {
      console.error('Error creating theme switcher:', error);
    }
  }
  
  createSettingsModal() {
    if (document.getElementById('settingsModal')) return;
    
    try {
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.id = 'settingsModal';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">${this.getTranslation('modal-title', 'User Settings')}</h3>
            <button class="close-modal">&times;</button>
          </div>
          <div class="modal-body">
            <div id="settingsContent">
              <div class="user-info-section">
                <h4 class="user-info-title">${this.getTranslation('user-info-title', 'Personal Information')}</h4>
                <div class="user-details">
                  <p><strong class="username-label">${this.getTranslation('user-username', 'Username')}:</strong> <span id="settingsUsername">-</span></p>
                  <p><strong class="email-label">${this.getTranslation('user-email', 'Email')}:</strong> <span id="settingsEmail">-</span></p>
                  <p><strong class="role-label">${this.getTranslation('user-role', 'Role')}:</strong> <span id="settingsRole">-</span></p>
                  <p><strong class="joined-label">${this.getTranslation('user-joined', 'Member since')}:</strong> <span id="settingsJoined">-</span></p>
                </div>
              </div>
              
              <div class="settings-section">
                <h4 class="current-settings-title">${this.getTranslation('settings-title', 'Current Settings')}</h4>
                <div class="settings-options">
                  <div class="form-group">
                    <label class="language-label">${this.getTranslation('settings-language', 'Language')}:</label>
                    <div class="lang-switcher">
                      <button class="lang-btn" data-lang="en">${this.getTranslation('language-en', 'English')}</button>
                      <button class="lang-btn" data-lang="ru">${this.getTranslation('language-ru', 'Russian')}</button>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="theme-label">${this.getTranslation('settings-theme', 'Theme')}:</label>
                    <div class="theme-switcher-small">
                      <button class="theme-btn small light-btn" data-theme="light">
                        <i class="fas fa-sun"></i> ${this.getTranslation('theme-light', 'Light')}
                      </button>
                      <button class="theme-btn small dark-btn" data-theme="dark">
                        <i class="fas fa-moon"></i> ${this.getTranslation('theme-dark', 'Dark')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="settings-actions">
                <button id="resetSettings" class="btn btn-secondary">${this.getTranslation('reset-settings', 'Reset Settings')}</button>
                <button id="saveSettings" class="btn btn-primary">${this.getTranslation('save-changes', 'Save Changes')}</button>
              </div>
            </div>
            <div id="signInPrompt" style="display: none;">
              <div class="sign-in-prompt">
                <p class="sign-in-text">${this.getTranslation('sign-in-to-view', 'Please sign in to view and edit your settings')}</p>
                <a href="login.html" class="btn btn-primary sign-in-btn">${this.getTranslation('sign-in-button', 'Sign In')}</a>
              </div>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      this.setupSettingsModalEvents();
      
    } catch (error) {
      console.error('Error creating settings modal:', error);
    }
  }
  
  setupSettingsModalEvents() {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;
    
    modal.querySelector('.close-modal').addEventListener('click', () => {
      modal.classList.remove('show');
    });
    
    modal.querySelector('#resetSettings').addEventListener('click', () => {
      if (confirm(this.getTranslation('settings-reset-confirm', 'Are you sure you want to reset all settings to default?'))) {
        this.resetSettings();
      }
    });
    
    modal.querySelector('#saveSettings').addEventListener('click', () => {
      this.saveSettings();
      if (window.authService) {
        window.authService.showNotification(
          this.getTranslation('success-saved', 'Settings saved successfully'),
          'success'
        );
      }
      modal.classList.remove('show');
    });
    
    modal.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const lang = e.currentTarget.dataset.lang;
        if (window.getTranslate) {
          window.getTranslate(lang);
        }
      });
    });
    
    modal.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const theme = e.currentTarget.dataset.theme;
        this.applyTheme(theme);
      });
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
      }
    });
  }
  
  showSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;
    
    const currentUser = window.authService?.getCurrentUser();
    const settingsContent = modal.querySelector('#settingsContent');
    const signInPrompt = modal.querySelector('#signInPrompt');
    
    if (currentUser) {
      settingsContent.style.display = 'block';
      signInPrompt.style.display = 'none';
      
      modal.querySelector('#settingsUsername').textContent = currentUser.nickname;
      modal.querySelector('#settingsEmail').textContent = currentUser.email;
      modal.querySelector('#settingsRole').textContent = currentUser.role === 'admin' ? 
        this.getTranslation('admin-role-admin', 'Administrator') : 
        this.getTranslation('admin-role-user', 'User');
      
      if (currentUser.createdAt) {
        const joinDate = new Date(currentUser.createdAt);
        modal.querySelector('#settingsJoined').textContent = joinDate.toLocaleDateString();
      }
      
      modal.querySelectorAll('.lang-btn').forEach(btn => {
        if (btn.dataset.lang === this.currentLang) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
      
      modal.querySelectorAll('.theme-btn').forEach(btn => {
        if (btn.dataset.theme === this.currentTheme) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
      
    } else {
      settingsContent.style.display = 'none';
      signInPrompt.style.display = 'block';
    }
    
    modal.classList.add('show');
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

document.addEventListener('DOMContentLoaded', () => {
  const checkUserMenu = setInterval(() => {
    const profileLink = document.querySelector('a[href="./profile.html"]');
    if (profileLink) {
      clearInterval(checkUserMenu);
      
      profileLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.themeManager.showSettingsModal();
      });
    }
  }, 100);
});