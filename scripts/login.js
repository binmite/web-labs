document.addEventListener('DOMContentLoaded', initLogin);

function initLogin() {
  console.log('Initializing login...');
  
  setupEventListeners();
  
  const emailInput = document.getElementById('loginEmail');
  if (emailInput) {
    emailInput.focus();
  }
  
  console.log('Login initialized');
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
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
      } else {
        passwordInput.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
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
    btn.addEventListener('click', () => {
      showNotification('Social login would be implemented here', 'info');
    });
  });
  
  if (form) {
    form.addEventListener('submit', handleLogin);
  }
  
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.classList.remove('show');
    }
  });
}

async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const rememberMe = document.getElementById('rememberMe').checked;
  
  if (!email || !password) {
    showNotification('Please fill in all fields', 'error');
    return;
  }
  
  const submitBtn = document.getElementById('loginBtn');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
  
  try {
    const user = await window.authService.login(email, password);
    
    if (user) {
      showNotification(`Welcome back, ${user.nickname}!`, 'success');
      
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
    errorElement.textContent = 'Email is required';
    return;
  }
  
  if (!emailRegex.test(email)) {
    errorElement.textContent = 'Please enter a valid email address';
    return;
  }
  
  const sendBtn = document.getElementById('sendResetEmail');
  const originalText = sendBtn.innerHTML;
  sendBtn.disabled = true;
  sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
  
  setTimeout(() => {
    errorElement.textContent = '';
    document.getElementById('forgotPasswordModal').classList.remove('show');
    showNotification('Password reset instructions sent to your email', 'success');
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
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.75rem;">
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${message}</span>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease forwards';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}