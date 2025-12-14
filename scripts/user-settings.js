class UserSettingsManager {
  constructor() {
    this.currentUser = null;
    this.userSettings = {};
    this.currentLang = 'en';
    this.init();
  }
  
  init() {
    this.currentLang = localStorage.getItem('lang') || 'en';
    
    document.addEventListener('langChanged', (event) => {
      this.currentLang = event.detail.lang;
      this.updateSettingsTranslations();
      this.loadUserInfo();
    });
    
    this.loadUserData();
    
    this.createUserIcon();
    
    if (window.authService) {
      window.authService.onAuthChange((user) => {
        this.currentUser = user;
        this.updateUserIcon();
        this.loadUserSettings();
      });
    }
  }
  
  getTranslation(key, defaultValue = '') {
    const translations = window.i18Obj?.[this.currentLang];
    return translations?.[key] || defaultValue;
  }
  
  updateSettingsTranslations() {
    const translations = window.i18Obj?.[this.currentLang];
    if (!translations) return;
    
    const modalTitle = document.querySelector('.user-settings-modal .modal-header h3');
    if (modalTitle) {
      modalTitle.textContent = this.getTranslation('modal-title', 'User Settings');
    }
    
    const resetBtn = document.getElementById('resetSettingsBtn');
    const saveBtn = document.getElementById('saveSettingsBtn');
    
    if (resetBtn) {
      resetBtn.innerHTML = `<i class="fas fa-undo"></i> ${this.getTranslation('reset-settings', 'Reset Settings')}`;
    }
    
    if (saveBtn) {
      saveBtn.innerHTML = `<i class="fas fa-save"></i> ${this.getTranslation('save-changes', 'Save Changes')}`;
    }
    
    const userIconBtn = document.querySelector('.user-icon-btn');
    if (userIconBtn) {
      userIconBtn.title = this.getTranslation('user-settings', 'User settings');
    }
    
    const modal = document.querySelector('.user-settings-modal');
    if (modal && modal.classList.contains('show')) {
      this.loadUserInfo();
    }
  }
  
  loadUserData() {
    if (window.authService) {
      this.currentUser = window.authService.getCurrentUser();
    }
  }
  
  createUserIcon() {
    if (document.getElementById('userSettingsIcon')) return;
    
    const userIcon = document.createElement('div');
    userIcon.className = 'user-settings-icon';
    userIcon.id = 'userSettingsIcon';
    userIcon.innerHTML = `
      <button class="user-icon-btn" title="${this.getTranslation('user-settings', 'User settings')}">
        <i class="fas fa-user-cog"></i>
      </button>
      <div class="user-settings-modal">
        <div class="modal-header">
          <h3>${this.getTranslation('modal-title', 'User Settings')}</h3>
          <button class="close-modal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="user-info" id="userInfoContainer">
            <!-- User info will be loaded here -->
          </div>
          <div class="settings-actions">
            <button class="btn btn-secondary" id="resetSettingsBtn">
              <i class="fas fa-undo"></i> ${this.getTranslation('reset-settings', 'Reset Settings')}
            </button>
            <button class="btn btn-primary" id="saveSettingsBtn">
              <i class="fas fa-save"></i> ${this.getTranslation('save-changes', 'Save Changes')}
            </button>
          </div>
        </div>
      </div>
    `;
    
    const nav = document.querySelector('.nav');
    if (nav) {
      const authButtons = nav.querySelector('.auth-buttons');
      if (authButtons) {
        nav.insertBefore(userIcon, authButtons);
      } else {
        nav.appendChild(userIcon);
      }
    }
    
    this.addModalEventListeners();
  }
  
  addModalEventListeners() {
    const userIconBtn = document.querySelector('.user-icon-btn');
    const modal = document.querySelector('.user-settings-modal');
    const closeBtn = document.querySelector('.close-modal');
    const resetBtn = document.getElementById('resetSettingsBtn');
    const saveBtn = document.getElementById('saveSettingsBtn');
    
    if (userIconBtn && modal) {
      userIconBtn.addEventListener('click', () => {
        modal.classList.add('show');
        this.loadUserInfo();
      });
    }
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
      });
    }
    
    document.addEventListener('click', (e) => {
      if (modal && modal.classList.contains('show') && 
          !modal.contains(e.target) && 
          !e.target.closest('.user-icon-btn')) {
        modal.classList.remove('show');
      }
    });
    
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetAllSettings();
      });
    }
    
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveUserSettings();
      });
    }
  }
  
  loadUserInfo() {
    const container = document.getElementById('userInfoContainer');
    if (!container) return;
    
    if (this.currentUser) {
      const joinDate = this.currentUser.createdAt ? 
        new Date(this.currentUser.createdAt).toLocaleDateString(this.currentLang === 'ru' ? 'ru-RU' : 'en-US') : 
        this.getTranslation('unknown-date', 'Unknown');
      
      const userRole = this.currentUser.role === 'admin' ? 
        this.getTranslation('admin-role-admin', 'Administrator') : 
        this.getTranslation('admin-role-user', 'User');
      
      container.innerHTML = `
        <div class="user-details">
          <h4>${this.getTranslation('user-info-title', 'Personal Information')}</h4>
          <div class="info-group">
            <label>${this.getTranslation('user-username', 'Username')}:</label>
            <input type="text" id="userNickname" value="${this.currentUser.nickname || ''}" class="editable-field" placeholder="${this.getTranslation('user-username-placeholder', 'Enter username')}">
          </div>
          <div class="info-group">
            <label>${this.getTranslation('user-email', 'Email')}:</label>
            <input type="email" id="userEmail" value="${this.currentUser.email || ''}" class="editable-field" placeholder="${this.getTranslation('user-email-placeholder', 'Enter email')}">
          </div>
          <div class="info-group">
            <label>${this.getTranslation('user-role', 'Role')}:</label>
            <span class="role-badge ${this.currentUser.role}">${userRole}</span>
          </div>
          <div class="info-group">
            <label>${this.getTranslation('user-joined', 'Member since')}:</label>
            <span>${joinDate}</span>
          </div>
        </div>
        <div class="current-settings">
          <h4>${this.getTranslation('settings-title', 'Current Settings')}</h4>
          <div class="settings-group">
            <label>${this.getTranslation('settings-language', 'Language')}:</label>
            <span id="currentLanguage">${this.currentLang === 'en' ? this.getTranslation('language-en', 'English') : this.getTranslation('language-ru', 'Russian')}</span>
          </div>
          <div class="settings-group">
            <label>${this.getTranslation('settings-theme', 'Theme')}:</label>
            <span id="currentTheme">${localStorage.getItem('theme') === 'light' ? this.getTranslation('theme-light', 'Light') : this.getTranslation('theme-dark', 'Dark')}</span>
          </div>
        </div>
        <div class="language-selector">
          <h5>${this.getTranslation('change-language', 'Change Language')}</h5>
          <div class="lang-buttons">
            <button class="lang-btn ${this.currentLang === 'en' ? 'active' : ''}" data-lang="en">
              <i class="fas fa-language"></i> ${this.getTranslation('language-en', 'English')}
            </button>
            <button class="lang-btn ${this.currentLang === 'ru' ? 'active' : ''}" data-lang="ru">
              <i class="fas fa-language"></i> ${this.getTranslation('language-ru', 'Russian')}
            </button>
          </div>
        </div>
        <div class="theme-selector">
          <h5>${this.getTranslation('change-theme', 'Change Theme')}</h5>
          <div class="theme-buttons">
            <button class="theme-btn ${localStorage.getItem('theme') === 'light' ? 'active' : ''}" data-theme="light">
              <i class="fas fa-sun"></i> ${this.getTranslation('theme-light', 'Light')}
            </button>
            <button class="theme-btn ${localStorage.getItem('theme') === 'dark' ? 'active' : ''}" data-theme="dark">
              <i class="fas fa-moon"></i> ${this.getTranslation('theme-dark', 'Dark')}
            </button>
          </div>
        </div>
      `;
      
      this.addDynamicEventListeners();
      
    } else {
      container.innerHTML = `
        <div class="no-user">
          <i class="fas fa-user-slash"></i>
          <p>${this.getTranslation('sign-in-to-view', 'Please sign in to view and edit your settings')}</p>
          <a href="./login.html" class="btn btn-primary">${this.getTranslation('sign-in-button', 'Sign In')}</a>
        </div>
      `;
    }
  }
  
  addDynamicEventListeners() {
    document.querySelectorAll('.user-settings-modal .lang-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const lang = e.currentTarget.dataset.lang;
        if (window.getTranslate) {
          window.getTranslate(lang);
        }
        
        document.querySelectorAll('.user-settings-modal .lang-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.lang === lang);
        });
      });
    });
    
    document.querySelectorAll('.user-settings-modal .theme-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const theme = e.currentTarget.dataset.theme;
        if (window.themeManager) {
          window.themeManager.applyTheme(theme);
        }
        
        document.querySelectorAll('.user-settings-modal .theme-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.theme === theme);
        });
        
        const currentThemeEl = document.getElementById('currentTheme');
        if (currentThemeEl) {
          currentThemeEl.textContent = theme === 'light' ? 
            this.getTranslation('theme-light', 'Light') : 
            this.getTranslation('theme-dark', 'Dark');
        }
      });
    });
    
    const nicknameInput = document.getElementById('userNickname');
    const emailInput = document.getElementById('userEmail');
    
    if (nicknameInput) {
      nicknameInput.addEventListener('input', () => {
        if (nicknameInput.value.length < 3) {
          nicknameInput.classList.add('error');
        } else {
          nicknameInput.classList.remove('error');
        }
      });
    }
    
    if (emailInput) {
      emailInput.addEventListener('input', () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value)) {
          emailInput.classList.add('error');
        } else {
          emailInput.classList.remove('error');
        }
      });
    }
  }
  
  updateUserIcon() {
    const userIcon = document.getElementById('userSettingsIcon');
    if (!userIcon) return;
    
    if (this.currentUser) {
      userIcon.style.display = 'block';
    } else {
      userIcon.style.display = 'none';
    }
  }
  
  loadUserSettings() {
    if (!this.currentUser) return;
    
    const userId = this.currentUser.id;
    const savedSettings = localStorage.getItem(`userSettings_${userId}`);
    
    if (savedSettings) {
      this.userSettings = JSON.parse(savedSettings);
      this.applyUserSettings();
    }
  }
  
  saveUserSettings() {
    if (!this.currentUser) {
      if (window.authService) {
        window.authService.showNotification(
          this.getTranslation('sign-in-to-save', 'Please sign in to save settings'),
          'error'
        );
      }
      return;
    }
    
    const userId = this.currentUser.id;
    
    const settings = {
      language: localStorage.getItem('lang') || 'en',
      theme: localStorage.getItem('theme') || 'dark',
      lastUpdated: new Date().toISOString()
    };
    
    const nicknameInput = document.getElementById('userNickname');
    const emailInput = document.getElementById('userEmail');
    
    if (nicknameInput && emailInput) {
      const newNickname = nicknameInput.value.trim();
      const newEmail = emailInput.value.trim();
      
      if (newNickname.length < 3) {
        if (window.authService) {
          window.authService.showNotification(
            this.getTranslation('username-min-length', 'Username must be at least 3 characters'),
            'error'
          );
        }
        return;
      }
      
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        if (window.authService) {
          window.authService.showNotification(
            this.getTranslation('validation-email', 'Please enter a valid email address'),
            'error'
          );
        }
        return;
      }
      
      this.currentUser.nickname = newNickname;
      this.currentUser.email = newEmail;
      
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    }
    
    localStorage.setItem(`userSettings_${userId}`, JSON.stringify(settings));
    
    if (window.authService) {
      window.authService.showNotification(
        this.getTranslation('settings-saved', 'Settings saved successfully'),
        'success'
      );
    }
    
    const modal = document.querySelector('.user-settings-modal');
    if (modal) {
      modal.classList.remove('show');
    }
    
    if (window.authService && window.authService.updateAuthUI) {
      window.authService.updateAuthUI();
    }
  }
  
  applyUserSettings() {
    if (this.userSettings.language && window.getTranslate) {
      window.getTranslate(this.userSettings.language);
    }
    
    if (this.userSettings.theme && window.themeManager) {
      window.themeManager.applyTheme(this.userSettings.theme);
    }
  }
  
  resetAllSettings() {
    if (!this.currentUser) {
      if (window.authService) {
        window.authService.showNotification(
          this.getTranslation('sign-in-to-reset', 'Please sign in to reset settings'),
          'error'
        );
      }
      return;
    }
    
    const confirmMessage = this.getTranslation('settings-reset-confirm', 'Are you sure you want to reset all settings to default?');
    if (!confirm(confirmMessage)) return;
    
    if (window.themeManager) {
      window.themeManager.applyTheme('dark');
    }
    
    localStorage.removeItem('lang');
    if (window.getTranslate) {
      window.getTranslate('en');
    }
    
    if (window.authService) {
      const originalUser = window.authService.getCurrentUser();
      if (originalUser) {
        this.currentUser = { ...originalUser };
      }
    }
    
    const userId = this.currentUser.id;
    localStorage.removeItem(`userSettings_${userId}`);
    
    this.loadUserInfo();
    
    if (window.authService) {
      window.authService.showNotification(
        this.getTranslation('settings-reset-success', 'All settings have been reset to default'),
        'success'
      );
    }
  }
}

window.userSettingsManager = new UserSettingsManager();

document.addEventListener('DOMContentLoaded', () => {
  if (window.userSettingsManager) {
    window.userSettingsManager.updateSettingsTranslations();
  }
});