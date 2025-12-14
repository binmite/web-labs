document.addEventListener('DOMContentLoaded', initLogin);

let currentLang = 'en';

function initLogin() {
  console.log('Initializing login...');
  
  currentLang = localStorage.getItem('lang') || 'en';
  
  updateLoginTranslations();
  
  document.addEventListener('langChanged', (event) => {
    currentLang = event.detail.lang;
    updateLoginTranslations();
  });
  
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const lang = btn.dataset.lang;
      if (window.getTranslate) {
        window.getTranslate(lang);
      }
    });
  });
  
  setupEventListeners();
  
  const emailInput = document.getElementById('loginEmail');
  if (emailInput) {
    emailInput.focus();
  }
  
  console.log('Login initialized');
}

function getTranslation(key, defaultValue = '') {
  const translations = window.i18Obj?.[currentLang];
  return translations?.[key] || defaultValue;
}

function updateLoginTranslations() {
  const translations = window.i18Obj?.[currentLang];
  if (!translations) return;
  
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (translations[key]) {
      if (el.tagName === 'INPUT' || el.tagName === 'BUTTON') {
        if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
          el.placeholder = translations[key];
        } else {
          el.value = translations[key];
        }
      } else {
        el.textContent = translations[key];
      }
    }
  });
  
  const elements = {
    '.login-subtitle': 'login-subtitle',
    '.email-label': 'login-email-label',
    '.password-label': 'login-password-label',
    '#rememberMe + span': 'login-remember',
    '#forgotPassword': 'login-forgot',
    '#loginBtn': 'login-button',
    '.no-account-text': 'login-no-account',
    '.social-divider': 'login-social-divider',
    '.btn-google .btn-text': 'login-google',
    '.btn-github .btn-text': 'login-github',
    '.btn-facebook .btn-text': 'login-facebook',
    '.forgot-title': 'forgot-title',
    '.forgot-description': 'forgot-description',
    '.forgot-email-label': 'forgot-email-label',
    '#sendResetEmail': 'forgot-button'
  };
  
  Object.entries(elements).forEach(([selector, key]) => {
    const element = document.querySelector(selector);
    if (element && translations[key]) {
      if (element.tagName === 'INPUT' || element.tagName === 'BUTTON') {
        element.value = translations[key];
      } else {
        element.textContent = translations[key];
      }
    }
  });
  
  const togglePasswordBtn = document.getElementById('toggleLoginPassword');
  if (togglePasswordBtn) {
    togglePasswordBtn.title = translations['login-toggle-password'] || 'Show/Hide password';
  }
}

function setupEventListeners() {
  const form = document.getElementById('loginForm');
  const togglePasswordBtn = document.getElementById('toggleLoginPassword');
  const forgotPasswordBtn = document.getElementById('forgotPassword');
  const sendResetEmailBtn = document.getElementById('sendResetEmail');
  const closeModalBtns = document.querySelectorAll('.close-modal');
  const socialButtons = document.querySelectorAll('.btn-social');
  const forgotPasswordModal = document.getElementById('forgotPasswordModal');
  
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
      const passwordInput = document.getElementById('loginPassword');
      const icon = togglePasswordBtn.querySelector('i');
      const eyeText = getTranslation('login-password-show', 'Show password');
      const eyeSlashText = getTranslation('login-password-hide', 'Hide password');
      
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
        togglePasswordBtn.title = eyeSlashText;
      } else {
        passwordInput.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
        togglePasswordBtn.title = eyeText;
      }
    });
  }
  
  if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener('click', (e) => {
      e.preventDefault();
      forgotPasswordModal.classList.add('show');
    });
  }
  
  if (sendResetEmailBtn) {
    sendResetEmailBtn.addEventListener('click', handleForgotPassword);
  }
  
  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
      });
    });
  });
  
  socialButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const provider = btn.classList.contains('btn-google') ? 'Google' : 
                      btn.classList.contains('btn-github') ? 'GitHub' : 'Facebook';
      const message = getTranslation('login-social-not-implemented', '{provider} login would be implemented here').replace('{provider}', provider);
      showNotification(message, 'info');
    });
  });
  
  if (form) {
    form.addEventListener('submit', handleLogin);
  }
  
  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');
  
  if (emailInput) {
    emailInput.addEventListener('input', validateLoginForm);
  }
  
  if (passwordInput) {
    passwordInput.addEventListener('input', validateLoginForm);
  }
  
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.classList.remove('show');
    }
  });
}

function validateLoginForm() {
  const email = document.getElementById('loginEmail')?.value.trim();
  const password = document.getElementById('loginPassword')?.value;
  const submitBtn = document.getElementById('loginBtn');
  
  if (!submitBtn) return;
  
  const isEmailValid = email && email.length > 0;
  const isPasswordValid = password && password.length > 0;
  
  submitBtn.disabled = !(isEmailValid && isPasswordValid);
}

async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const rememberMe = document.getElementById('rememberMe').checked;
  
  if (!email || !password) {
    showNotification(getTranslation('validation-required', 'Please fill in all fields'), 'error');
    return;
  }
  
  const submitBtn = document.getElementById('loginBtn');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  const signingInText = getTranslation('login-signing-in', 'Signing in...');
  submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${signingInText}`;
  
  try {
    const user = await window.authService.login(email, password);
    
    if (user) {
      const welcomeMessage = getTranslation('login-success', 'Welcome back, {name}!').replace('{name}', user.nickname);
      showNotification(welcomeMessage, 'success');
      
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }
      
      setTimeout(() => {
        if (user.role === 'admin') {
          window.location.href = 'admin.html';
        } else {
          const redirectTo = getRedirectUrl() || 'home.html';
          window.location.href = redirectTo;
        }
      }, 1000);
    }
  } catch (error) {
    console.error('Login error:', error);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

async function handleForgotPassword() {
  const emailInput = document.getElementById('resetEmail');
  const errorElement = document.getElementById('resetEmailError');
  const email = emailInput.value.trim();
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email) {
    errorElement.textContent = getTranslation('validation-required', 'Email is required');
    return;
  }
  
  if (!emailRegex.test(email)) {
    errorElement.textContent = getTranslation('validation-email', 'Please enter a valid email address');
    return;
  }
  
  const sendBtn = document.getElementById('sendResetEmail');
  const originalText = sendBtn.innerHTML;
  sendBtn.disabled = true;
  const sendingText = getTranslation('forgot-sending', 'Sending...');
  sendBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${sendingText}`;
  
  setTimeout(() => {
    errorElement.textContent = '';
    document.getElementById('forgotPasswordModal').classList.remove('show');
    showNotification(getTranslation('forgot-success', 'Password reset instructions sent to your email'), 'success');
    sendBtn.disabled = false;
    sendBtn.innerHTML = originalText;
  }, 1500);
}

function getRedirectUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('redirect') || null;
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    animation: slideInRight 0.3s ease;
  `;
  
  let icon = 'info-circle';
  if (type === 'success') icon = 'check-circle';
  if (type === 'error') icon = 'exclamation-circle';
  
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.75rem;">
      <i class="fas fa-${icon}"></i>
      <span>${message}</span>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease forwards';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}