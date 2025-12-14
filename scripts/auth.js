const AUTH_API_BASE_URL = 'http://localhost:3000';
const AUTH_USERS_ENDPOINT = `${AUTH_API_BASE_URL}/users`;

class AuthService {
  constructor() {
    this.currentUser = null;
    this.initialized = false;
    this.listeners = [];
  }

  async init() {
    if (this.initialized) return;
    
    try {
      const userId = localStorage.getItem('userId');
      if (userId) {
        const user = await this.fetchData(`${AUTH_USERS_ENDPOINT}/${userId}`);
        if (user) {
          this.currentUser = user;
          console.log('User loaded:', user.nickname);
        } else {
          this.clearUserData();
        }
      }
      this.updateAuthUI();
      this.initialized = true;
      console.log('Auth service initialized');
      
      this.notifyListeners();
    } catch (error) {
      console.error('Error initializing auth:', error);
      this.clearUserData();
    }
  }

  onAuthChange(callback) {
    this.listeners.push(callback);
    if (this.initialized) {
      callback(this.currentUser);
    }
  }

  notifyListeners() {
    this.listeners.forEach(callback => {
      callback(this.currentUser);
    });
  }

  async fetchData(url, options = {}) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching data:', error);
      return null;
    }
  }

  showNotification(message, type = 'info') {
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

  async checkAuth() {
    await this.init();
    return this.currentUser;
  }

  updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const nav = document.querySelector('.nav');
    const navAuthButtons = nav ? nav.querySelector('.auth-buttons') : null;
    
    const targets = [];
    if (authButtons) targets.push(authButtons);
    if (navAuthButtons) targets.push(navAuthButtons);
    
    if (targets.length === 0) return;
    
    let html = '';
    if (this.currentUser) {
      const userDisplay = this.currentUser.role === 'admin' ? 
        `${this.currentUser.nickname} (Admin)` : this.currentUser.nickname;
      
      html = `
        <div class="user-menu">
          <button class="user-greeting">
            <i class="fas fa-user-circle"></i> ${userDisplay} <i class="fas fa-caret-down"></i>
          </button>
          <div class="user-dropdown">
            <a href="./profile.html" class="dropdown-item">
              <i class="fas fa-user"></i> Profile
            </a>
            ${this.currentUser.role === 'admin' ? `
              <a href="./admin.html" class="dropdown-item">
                <i class="fas fa-cog"></i> Admin Panel
              </a>
            ` : ''}
            <button class="dropdown-item logout-btn">
              <i class="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>
      `;
    } else {
      html = `
        <div class="auth-buttons">
          <a href="./login.html" class="nav-link">Sign in</a>
          <a href="./register.html" class="btn btn-primary">Sign up</a>
        </div>
      `;
    }
    
    targets.forEach(target => {
      target.innerHTML = html;
    });
    
    document.querySelectorAll('.logout-btn').forEach(btn => {
      btn.addEventListener('click', () => this.logout());
    });
    
    document.querySelectorAll('.user-greeting').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dropdown = btn.nextElementSibling;
        dropdown.classList.toggle('show');
      });
    });
    
    document.addEventListener('click', () => {
      document.querySelectorAll('.user-dropdown').forEach(dropdown => {
        dropdown.classList.remove('show');
      });
    });
  }

  async login(email, password) {
    try {
      const users = await this.fetchData(AUTH_USERS_ENDPOINT);
      const user = users.find(u => 
        (u.email === email || u.nickname === email) && 
        u.password === password
      );
      
      if (user) {
        localStorage.setItem('userId', user.id);
        localStorage.setItem('userRole', user.role);
        this.currentUser = user;
        this.updateAuthUI();
        this.notifyListeners();
        this.showNotification(`Welcome back, ${user.nickname}!`, 'success');
        return user;
      } else {
        this.showNotification('Invalid email/username or password', 'error');
        return null;
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showNotification('Login failed. Please try again.', 'error');
      return null;
    }
  }

  logout() {
    this.clearUserData();
    this.showNotification('Logged out successfully', 'success');
    
    const protectedPages = ['admin.html', 'profile.html'];
    const currentPage = window.location.pathname.split('/').pop();
    if (protectedPages.includes(currentPage)) {
      setTimeout(() => {
        window.location.href = 'home.html';
      }, 1000);
    }
  }

  clearUserData() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    this.currentUser = null;
    this.updateAuthUI();
    this.notifyListeners();
  }

  checkAdminAccess() {
    const userRole = localStorage.getItem('userRole');
    const adminPanel = document.getElementById('adminPanel');
    const accessDenied = document.getElementById('adminAccessDenied');
    
    if (adminPanel && accessDenied) {
      if (userRole === 'admin') {
        adminPanel.style.display = 'block';
        accessDenied.style.display = 'none';
      } else {
        adminPanel.style.display = 'none';
        accessDenied.style.display = 'block';
      }
    }
  }

  isAdmin() {
    return this.currentUser?.role === 'admin';
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return this.currentUser !== null;
  }
}

window.authService = new AuthService();

document.addEventListener('DOMContentLoaded', async () => {
  await window.authService.init();
  window.authService.checkAdminAccess();
});