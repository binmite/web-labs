const REGISTER_USERS_ENDPOINT = 'http://localhost:3000/users';

let nicknameAttempts = 5;
let nicknameRegenerationCount = 0;
let usedNicknames = new Set();

const TOP_100_PASSWORDS = [
  'password', '123456', '12345678', '1234', 'qwerty', '12345',
  'dragon', 'football', 'monkey', 'letmein', 'abc123', 'mustang',
  'michael', 'shadow', 'master', 'jennifer', '111111', '2000',
  'jordan', 'superman', 'harley', '1234567', 'freedom', 'matrix',
  'trustno1', 'killer', 'jessica', 'wizard', 'sunshine', 'nicole',
  'computer', 'tigger', 'hello', 'charlie', '123123', 'george'
];

document.addEventListener('DOMContentLoaded', initRegistration);

async function initRegistration() {
  console.log('Initializing registration...');
  
  await loadUsedNicknames();
  setupEventListeners();
  generatePassword();
  generateInitialNickname();
  
  console.log('Registration initialized');
}

async function loadUsedNicknames() {
  try {
    const users = await fetchData(REGISTER_USERS_ENDPOINT) || [];
    users.forEach(user => usedNicknames.add(user.nickname.toLowerCase()));
  } catch (error) {
    console.error('Error loading nicknames:', error);
  }
}

function setupEventListeners() {
  const form = document.getElementById('registerForm');
  const passwordMethodRadios = document.querySelectorAll('input[name="passwordMethod"]');
  const manualPasswordFields = document.getElementById('manualPasswordFields');
  const autoPasswordField = document.getElementById('autoPasswordField');
  const generateNicknameBtn = document.getElementById('generateNickname');
  const togglePassword = document.getElementById('togglePassword');
  const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
  const copyPasswordBtn = document.getElementById('copyPassword');
  const regeneratePasswordBtn = document.getElementById('regeneratePassword');
  const showTermsBtn = document.getElementById('showTerms');
  const showPrivacyBtn = document.getElementById('showPrivacy');
  const acceptTermsBtn = document.getElementById('acceptTerms');
  const termsModal = document.getElementById('termsModal');
  const closeModalBtns = document.querySelectorAll('.close-modal');
  
  passwordMethodRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'manual') {
        manualPasswordFields.style.display = 'block';
        autoPasswordField.style.display = 'none';
      } else {
        manualPasswordFields.style.display = 'none';
        autoPasswordField.style.display = 'block';
      }
      validateForm();
    });
  });
  
  document.getElementById('phone').addEventListener('input', validatePhone);
  document.getElementById('email').addEventListener('input', validateEmail);
  document.getElementById('birthDate').addEventListener('change', validateBirthDate);
  document.getElementById('firstName').addEventListener('input', validateName);
  document.getElementById('lastName').addEventListener('input', validateName);
  document.getElementById('middleName').addEventListener('input', validateName);
  document.getElementById('password')?.addEventListener('input', validatePassword);
  document.getElementById('confirmPassword')?.addEventListener('input', validateConfirmPassword);
  document.getElementById('terms').addEventListener('change', validateForm);
  
  document.getElementById('feedbackTitle')?.addEventListener('input', updateTitleCounter);
  document.getElementById('feedbackText')?.addEventListener('input', updateTextCounter);
  
  if (togglePassword) {
    togglePassword.addEventListener('click', () => {
      const passwordInput = document.getElementById('password');
      const icon = togglePassword.querySelector('i');
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
      } else {
        passwordInput.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
      }
    });
  }
  
  if (toggleConfirmPassword) {
    toggleConfirmPassword.addEventListener('click', () => {
      const confirmInput = document.getElementById('confirmPassword');
      const icon = toggleConfirmPassword.querySelector('i');
      if (confirmInput.type === 'password') {
        confirmInput.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
      } else {
        confirmInput.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
      }
    });
  }
  
  generateNicknameBtn.addEventListener('click', async () => {
    if (nicknameRegenerationCount >= 5) {
      enableManualNicknameInput();
      return;
    }
    await generateNickname();
    nicknameRegenerationCount++;
    updateAttemptsCounter();
  });
  
  copyPasswordBtn?.addEventListener('click', copyGeneratedPassword);
  regeneratePasswordBtn?.addEventListener('click', generatePassword);
  
  showTermsBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    showTermsModal();
  });
  
  showPrivacyBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    showTermsModal(); 
  });
  
  acceptTermsBtn?.addEventListener('click', () => {
    document.getElementById('terms').checked = true;
    termsModal.classList.remove('show');
    validateForm();
  });
  
  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      termsModal.classList.remove('show');
    });
  });
  
  form.addEventListener('submit', handleRegistration);
  
  form.addEventListener('input', validateForm);
}

function validatePhone() {
  const phoneInput = document.getElementById('phone');
  const errorElement = document.getElementById('phoneError');
  const value = phoneInput.value.trim();
  
  const digits = value.replace(/\D/g, '');
  
  if (digits.length < 9) {
    showError(phoneInput, errorElement, 'Phone number must be 9 digits');
    return false;
  }
  
  const formatted = digits.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
  phoneInput.value = formatted;
  
  const operatorCode = digits.substring(0, 2);
  const validOperators = ['29', '33', '44', '25'];
  
  if (!validOperators.includes(operatorCode)) {
    showError(phoneInput, errorElement, 'Must be a valid Belarusian mobile number (29, 33, 44, 25)');
    return false;
  }
  
  clearError(phoneInput, errorElement);
  return true;
}

function validateEmail() {
  const emailInput = document.getElementById('email');
  const errorElement = document.getElementById('emailError');
  const value = emailInput.value.trim();
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!value) {
    showError(emailInput, errorElement, 'Email is required');
    return false;
  }
  
  if (!emailRegex.test(value)) {
    showError(emailInput, errorElement, 'Please enter a valid email address');
    return false;
  }
  
  clearError(emailInput, errorElement);
  return true;
}

function validateBirthDate() {
  const birthDateInput = document.getElementById('birthDate');
  const errorElement = document.getElementById('birthDateError');
  const value = birthDateInput.value;
  
  if (!value) {
    showError(birthDateInput, errorElement, 'Birth date is required');
    return false;
  }
  
  const birthDate = new Date(value);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  const isAdult = age > 16 || (age === 16 && monthDiff >= 0);
  
  if (!isAdult) {
    showError(birthDateInput, errorElement, 'You must be at least 16 years old');
    return false;
  }
  
  clearError(birthDateInput, errorElement);
  return true;
}

function validateName() {
  const firstName = document.getElementById('firstName');
  const lastName = document.getElementById('lastName');
  const middleName = document.getElementById('middleName');
  
  const firstNameValid = validateNameField(firstName, 'firstNameError');
  const lastNameValid = validateNameField(lastName, 'lastNameError');
  const middleNameValid = middleName.value ? validateNameField(middleName, 'middleNameError', false) : true;
  
  return firstNameValid && lastNameValid && middleNameValid;
}

function validateNameField(field, errorId, required = true) {
  const errorElement = document.getElementById(errorId);
  const value = field.value.trim();
  
  if (required && !value) {
    showError(field, errorElement, 'This field is required');
    return false;
  }
  
  if (value && !/^[A-Za-zА-Яа-яЁё\s\-']{2,}$/.test(value)) {
    showError(field, errorElement, 'Name can only contain letters, spaces, hyphens, and apostrophes');
    return false;
  }
  
  clearError(field, errorElement);
  return true;
}

function validatePassword() {
  const passwordInput = document.getElementById('password');
  const errorElement = document.getElementById('passwordError');
  const strengthBar = document.querySelector('.strength-bar');
  const strengthText = document.querySelector('.strength-text span');
  const value = passwordInput.value;
  
  if (!value) {
    showError(passwordInput, errorElement, 'Password is required');
    updatePasswordStrength(0, 'Weak');
    return false;
  }
  
  if (value.length < 8 || value.length > 20) {
    showError(passwordInput, errorElement, 'Password must be 8-20 characters long');
    updatePasswordStrength(20, 'Weak');
    return false;
  }
  
  if (TOP_100_PASSWORDS.includes(value.toLowerCase())) {
    showError(passwordInput, errorElement, 'This password is too common. Choose a stronger one.');
    updatePasswordStrength(40, 'Weak');
    return false;
  }
  
  const hasUpperCase = /[A-Z]/.test(value);
  const hasLowerCase = /[a-z]/.test(value);
  const hasNumbers = /\d/.test(value);
  const hasSpecial = /[@$!%*?&]/.test(value);
  
  const requirements = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecial];
  const metRequirements = requirements.filter(Boolean).length;
  
  let errorMessage = '';
  if (!hasUpperCase) errorMessage += 'Uppercase letter required. ';
  if (!hasLowerCase) errorMessage += 'Lowercase letter required. ';
  if (!hasNumbers) errorMessage += 'Number required. ';
  if (!hasSpecial) errorMessage += 'Special character (@$!%*?&) required. ';
  
  if (errorMessage) {
    showError(passwordInput, errorElement, errorMessage.trim());
    updatePasswordStrength(metRequirements * 25, 'Weak');
    return false;
  }
  
  let strength = 25; 
  if (value.length >= 12) strength += 25;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) strength += 25;
  if (/\d/.test(value) && /[@$!%*?&]/.test(value)) strength += 25;
  
  let strengthLabel = 'Weak';
  if (strength >= 75) strengthLabel = 'Strong';
  else if (strength >= 50) strengthLabel = 'Good';
  
  clearError(passwordInput, errorElement);
  updatePasswordStrength(strength, strengthLabel);
  return true;
}

function validateConfirmPassword() {
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirmPassword');
  const errorElement = document.getElementById('confirmPasswordError');
  
  if (!confirmInput.value) {
    showError(confirmInput, errorElement, 'Please confirm your password');
    return false;
  }
  
  if (passwordInput.value !== confirmInput.value) {
    showError(confirmInput, errorElement, 'Passwords do not match');
    return false;
  }
  
  clearError(confirmInput, errorElement);
  return true;
}

function updatePasswordStrength(percentage, label) {
  const strengthBar = document.querySelector('.strength-bar');
  const strengthText = document.querySelector('.strength-text span');
  
  if (strengthBar) {
    strengthBar.style.width = `${percentage}%`;
    
    let color = '#ef4444'; 
    if (percentage >= 50) color = '#f59e0b'; 
    if (percentage >= 75) color = '#10b981'; 
    
    strengthBar.style.backgroundColor = color;
  }
  
  if (strengthText) {
    strengthText.textContent = label;
    strengthText.style.color = color;
  }
}

async function validateNickname() {
  const nicknameInput = document.getElementById('nickname');
  const errorElement = document.getElementById('nicknameError');
  const statusElement = document.getElementById('nicknameStatus');
  const value = nicknameInput.value.trim();
  
  if (!value) {
    showError(nicknameInput, errorElement, 'Username is required');
    statusElement.innerHTML = '<i class="fas fa-times" style="color: #ef4444;"></i>';
    return false;
  }
  
  if (value.length < 3 || value.length > 20) {
    showError(nicknameInput, errorElement, 'Username must be 3-20 characters');
    statusElement.innerHTML = '<i class="fas fa-times" style="color: #ef4444;"></i>';
    return false;
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    showError(nicknameInput, errorElement, 'Only letters, numbers, and underscores allowed');
    statusElement.innerHTML = '<i class="fas fa-times" style="color: #ef4444;"></i>';
    return false;
  }
  
  if (usedNicknames.has(value.toLowerCase())) {
    showError(nicknameInput, errorElement, 'This username is already taken');
    statusElement.innerHTML = '<i class="fas fa-times" style="color: #ef4444;"></i>';
    return false;
  }
  
  clearError(nicknameInput, errorElement);
  statusElement.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i>';
  return true;
}

function validateForm() {
  const isManualPassword = document.getElementById('manualPassword')?.checked;
  let isValid = true;
  
  isValid = validatePhone() && isValid;
  isValid = validateEmail() && isValid;
  isValid = validateBirthDate() && isValid;
  isValid = validateName() && isValid;
  
  if (isManualPassword) {
    isValid = validatePassword() && isValid;
    isValid = validateConfirmPassword() && isValid;
  }
  
  const nicknameValid = validateNickname();
  isValid = nicknameValid && isValid;
  
  const termsChecked = document.getElementById('terms').checked;
  const termsError = document.getElementById('termsError');
  if (!termsChecked) {
    termsError.textContent = 'You must accept the terms and conditions';
    isValid = false;
  } else {
    termsError.textContent = '';
  }
  
  const submitBtn = document.getElementById('registerBtn');
  submitBtn.disabled = !isValid;
  
  return isValid;
}

async function generateNickname() {
  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const nicknameInput = document.getElementById('nickname');
  const statusElement = document.getElementById('nicknameStatus');
  
  if (!firstName || !lastName) {
    showNotification('Please enter your first and last name first', 'error');
    return;
  }
  
  statusElement.innerHTML = '<i class="fas fa-sync fa-spin"></i>';
  
  const firstPart = firstName.substring(0, Math.min(3, Math.floor(Math.random() * 2) + 2));
  const lastPart = lastName.substring(0, Math.min(3, Math.floor(Math.random() * 2) + 2));
  const randomNum = Math.floor(Math.random() * 990) + 10;
  
  const suffixes = ['', '_', 'X', 'Z', 'Pro', 'Master', 'Dev'];
  const suffix = Math.random() > 0.7 ? suffixes[Math.floor(Math.random() * suffixes.length)] : '';
  
  let nickname = `${firstPart}${lastPart}${randomNum}${suffix}`.replace(/\s+/g, '');
  
  let attempts = 0;
  while (usedNicknames.has(nickname.toLowerCase()) && attempts < 10) {
    nickname = `${firstPart}${lastPart}${Math.floor(Math.random() * 990) + 10}${suffix}`;
    attempts++;
  }
  
  nicknameInput.value = nickname;
  await validateNickname();
  
  const attemptsLeft = 5 - nicknameRegenerationCount;
  const hint = document.getElementById('nicknameHint');
  if (attemptsLeft <= 0) {
    hint.textContent = 'No attempts left. You can now enter your own username.';
    enableManualNicknameInput();
  } else {
    hint.textContent = `Username generated automatically. You have ${attemptsLeft} regeneration attempts.`;
  }
}

function enableManualNicknameInput() {
  const nicknameInput = document.getElementById('nickname');
  const generateBtn = document.getElementById('generateNickname');
  const hint = document.getElementById('nicknameHint');
  
  nicknameInput.readOnly = false;
  nicknameInput.placeholder = 'Enter your own username';
  generateBtn.disabled = true;
  generateBtn.innerHTML = '<i class="fas fa-random"></i> Manual Input Enabled';
  hint.textContent = 'You can now enter your own username. Make sure it\'s unique!';
  
  nicknameInput.addEventListener('input', async () => {
    await validateNickname();
    validateForm();
  });
}

function updateAttemptsCounter() {
  const attemptsCounter = document.getElementById('attemptsCounter');
  const attemptsLeft = Math.max(0, 5 - nicknameRegenerationCount);
  attemptsCounter.innerHTML = `Regeneration attempts left: <span>${attemptsLeft}</span>`;
}

function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$!%*?&';
  let password = '';
  
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '@$!%*?&'[Math.floor(Math.random() * 7)];
  
  for (let i = 4; i < 12; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  
  password = password.split('').sort(() => Math.random() - 0.5).join('');
  
  document.getElementById('generatedPassword').textContent = password;
}

function copyGeneratedPassword() {
  const password = document.getElementById('generatedPassword').textContent;
  navigator.clipboard.writeText(password)
    .then(() => showNotification('Password copied to clipboard!', 'success'))
    .catch(err => showNotification('Failed to copy password', 'error'));
}

function showTermsModal() {
  document.getElementById('termsModal').classList.add('show');
}

function showError(input, errorElement, message) {
  input.style.borderColor = '#ef4444';
  errorElement.textContent = message;
}

function clearError(input, errorElement) {
  input.style.borderColor = 'rgba(255, 255, 255, 0.2)';
  errorElement.textContent = '';
}

async function fetchData(url, options = {}) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
}

async function handleRegistration(e) {
  e.preventDefault();
  
  if (!validateForm()) {
    showNotification('Please fix all errors before submitting', 'error');
    return;
  }
  
  const submitBtn = document.getElementById('registerBtn');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
  
  try {
    const formData = {
      phone: '+375' + document.getElementById('phone').value.replace(/\D/g, ''),
      email: document.getElementById('email').value.trim(),
      birthDate: document.getElementById('birthDate').value,
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      middleName: document.getElementById('middleName').value.trim() || null,
      nickname: document.getElementById('nickname').value.trim(),
      agreedToTerms: true,
      role: 'user',
      createdAt: new Date().toISOString()
    };
    
    const isManualPassword = document.getElementById('manualPassword')?.checked;
    if (isManualPassword) {
      formData.password = document.getElementById('password').value;
    } else {
      formData.password = document.getElementById('generatedPassword').textContent;
    }
    
    const users = await fetchData(REGISTER_USERS_ENDPOINT) || [];
    const emailExists = users.some(u => u.email === formData.email);
    const phoneExists = users.some(u => u.phone === formData.phone);
    
    if (emailExists) {
      showNotification('Email already registered', 'error');
      document.getElementById('emailError').textContent = 'Email already registered';
      return;
    }
    
    if (phoneExists) {
      showNotification('Phone number already registered', 'error');
      document.getElementById('phoneError').textContent = 'Phone number already registered';
      return;
    }
    
    const newUser = await fetchData(REGISTER_USERS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    if (newUser) {
      showNotification('Account created successfully!', 'success');
      
      localStorage.setItem('userId', newUser.id);
      localStorage.setItem('userRole', newUser.role);
      
      setTimeout(() => {
        window.location.href = 'home.html';
      }, 1500);
    }
    
  } catch (error) {
    console.error('Registration error:', error);
    showNotification('Registration failed. Please try again.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

async function generateInitialNickname() {
  setTimeout(async () => {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    
    if (firstName && lastName) {
      await generateNickname();
    }
  }, 500);
}

function updateTitleCounter() {
  const input = document.getElementById('feedbackTitle');
  const counter = document.getElementById('titleCounter');
  if (input && counter) {
    counter.textContent = input.value.length;
  }
}

function updateTextCounter() {
  const input = document.getElementById('feedbackText');
  const counter = document.getElementById('textCounter');
  if (input && counter) {
    counter.textContent = input.value.length;
  }
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