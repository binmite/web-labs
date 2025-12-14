const REGISTER_USERS_ENDPOINT = 'http://localhost:3000/users';

let nicknameAttempts = 5;
let nicknameRegenerationCount = 0;
let usedNicknames = new Set();
let currentLang = 'en';

const TOP_100_PASSWORDS = [
  'password', '123456', '12345678', '1234', 'qwerty', '12345',
  'dragon', 'football', 'monkey', 'letmein', 'abc123', 'mustang',
  'michael', 'shadow', 'master', 'jennifer', '111111', '2000',
  'jordan', 'superman', 'harley', '1234567', 'freedom', 'matrix',
  'trustno1', 'killer', 'jessica', 'wizard', 'sunshine', 'nicole',
  'computer', 'tigger', 'hello', 'charlie', '123123', 'george'
];

document.addEventListener('DOMContentLoaded', initRegistration);

document.addEventListener('langChanged', (event) => {
  currentLang = event.detail.lang;
  updateRegistrationTranslations();
});

async function initRegistration() {
  console.log('Initializing registration...');
  
  currentLang = localStorage.getItem('lang') || 'en';
  
  updateRegistrationTranslations();
  
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const lang = btn.dataset.lang;
      if (window.getTranslate) {
        window.getTranslate(lang);
      }
    });
  });
  
  await loadUsedNicknames();
  setupEventListeners();
  generatePassword();
  generateInitialNickname();
  
  console.log('Registration initialized');
}

function getTranslation(key, defaultValue = '') {
  const translations = window.i18Obj?.[currentLang];
  return translations?.[key] || defaultValue;
}

function updateRegistrationTranslations() {
  const translations = window.i18Obj?.[currentLang];
  if (!translations) return;
  
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (translations[key]) {
      if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'BUTTON') {
        if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
          el.placeholder = translations[key];
        } else if (el.tagName === 'BUTTON') {
          el.textContent = translations[key];
        }
      } else {
        el.textContent = translations[key];
      }
    }
  });
  
  const elements = {
    '.register-subtitle': 'register-subtitle',
    '.phone-label': 'register-phone-label',
    '.phone-hint': 'register-phone-hint',
    '.email-label': 'register-email-label',
    '.birthdate-label': 'register-birthdate-label',
    '.birthdate-hint': 'register-birthdate-hint',
    '.firstname-label': 'register-firstname-label',
    '.lastname-label': 'register-lastname-label',
    '.middlename-label': 'register-middlename-label',
    '.password-method-label': 'register-password-method-label',
    '.password-auto-label': 'register-password-auto',
    '.password-manual-label': 'register-password-manual',
    '.password-label': 'register-password-label',
    '.password-hint': 'register-password-hint',
    '.password-strength-label': 'register-password-strength',
    '.confirm-password-label': 'register-confirm-password-label',
    '.generated-password-label': 'register-generated-password-label',
    '.generated-password-hint': 'register-generated-password-hint',
    '.nickname-label': 'register-username-label',
    '.nickname-hint': 'register-username-hint',
    '#generateNickname': 'register-generate-button',
    '.terms-text': 'register-terms-text',
    '.terms-link': 'register-terms-link',
    '.terms-and': 'register-terms-and',
    '.privacy-link': 'register-privacy-link',
    '#registerBtn': 'register-button',
    '.login-link': 'register-login-link',
    '.terms-title': 'terms-title',
    '#acceptTerms': 'terms-accept-button',
    '.terms-last-updated': 'terms-last-updated'
  };
  
  Object.entries(elements).forEach(([selector, key]) => {
    const element = document.querySelector(selector);
    if (element && translations[key]) {
      if (element.tagName === 'BUTTON') {
        element.value = translations[key];
      } else {
        element.textContent = translations[key];
      }
    }
  });
  
  const termSections = document.querySelectorAll('.terms-section h4');
  termSections.forEach((section, index) => {
    const termKey = `terms-section-${index + 1}-title`;
    if (translations[termKey]) {
      section.textContent = translations[termKey];
    }
  });
  
  const termTexts = document.querySelectorAll('.terms-section p');
  termTexts.forEach((text, index) => {
    const termKey = `terms-section-${index + 1}-text`;
    if (translations[termKey]) {
      text.textContent = translations[termKey];
    }
  });
  
  const copyBtn = document.getElementById('copyPassword');
  const regenerateBtn = document.getElementById('regeneratePassword');
  
  if (copyBtn) {
    copyBtn.title = getTranslation('register-copy-password', 'Copy password');
  }
  if (regenerateBtn) {
    regenerateBtn.title = getTranslation('register-regenerate-password', 'Regenerate password');
  }
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
  
  if (togglePassword) {
    togglePassword.addEventListener('click', () => {
      const passwordInput = document.getElementById('password');
      const icon = togglePassword.querySelector('i');
      const showText = getTranslation('register-password-show', 'Show password');
      const hideText = getTranslation('register-password-hide', 'Hide password');
      
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
        togglePassword.title = hideText;
      } else {
        passwordInput.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
        togglePassword.title = showText;
      }
    });
  }
  
  if (toggleConfirmPassword) {
    toggleConfirmPassword.addEventListener('click', () => {
      const confirmInput = document.getElementById('confirmPassword');
      const icon = toggleConfirmPassword.querySelector('i');
      const showText = getTranslation('register-password-show', 'Show password');
      const hideText = getTranslation('register-password-hide', 'Hide password');
      
      if (confirmInput.type === 'password') {
        confirmInput.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
        toggleConfirmPassword.title = hideText;
      } else {
        confirmInput.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
        toggleConfirmPassword.title = showText;
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
    showError(phoneInput, errorElement, getTranslation('register-phone-error', 'Phone number must be 9 digits'));
    return false;
  }
  
  const formatted = digits.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
  phoneInput.value = formatted;
  
  const operatorCode = digits.substring(0, 2);
  const validOperators = ['29', '33', '44', '25'];
  
  if (!validOperators.includes(operatorCode)) {
    showError(phoneInput, errorElement, getTranslation('register-phone-operator-error', 'Must be a valid Belarusian mobile number (29, 33, 44, 25)'));
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
    showError(emailInput, errorElement, getTranslation('validation-required', 'Email is required'));
    return false;
  }
  
  if (!emailRegex.test(value)) {
    showError(emailInput, errorElement, getTranslation('validation-email', 'Please enter a valid email address'));
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
    showError(birthDateInput, errorElement, getTranslation('validation-required', 'Birth date is required'));
    return false;
  }
  
  const birthDate = new Date(value);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  const isAdult = age > 16 || (age === 16 && monthDiff >= 0);
  
  if (!isAdult) {
    showError(birthDateInput, errorElement, getTranslation('register-birthdate-error', 'You must be at least 16 years old'));
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
    const fieldName = field.id === 'firstName' ? 
      getTranslation('register-firstname-label', 'First Name') :
      field.id === 'lastName' ? 
        getTranslation('register-lastname-label', 'Last Name') :
        getTranslation('register-middlename-label', 'Middle Name');
    
    showError(field, errorElement, getTranslation('validation-required', '{field} is required').replace('{field}', fieldName));
    return false;
  }
  
  if (value && !/^[A-Za-zА-Яа-яЁё\s\-']{2,}$/.test(value)) {
    showError(field, errorElement, getTranslation('register-name-format-error', 'Name can only contain letters, spaces, hyphens, and apostrophes'));
    return false;
  }
  
  if (value && value.length < 2) {
    showError(field, errorElement, getTranslation('validation-min-length', 'Must be at least {min} characters').replace('{min}', '2'));
    return false;
  }
  
  clearError(field, errorElement);
  return true;
}

function validatePassword() {
  const passwordInput = document.getElementById('password');
  const errorElement = document.getElementById('passwordError');
  const value = passwordInput.value;
  
  if (!value) {
    showError(passwordInput, errorElement, getTranslation('validation-required', 'Password is required'));
    updatePasswordStrength(0, getTranslation('register-password-weak', 'Weak'));
    return false;
  }
  
  if (value.length < 8 || value.length > 20) {
    showError(passwordInput, errorElement, getTranslation('register-password-length-error', 'Password must be 8-20 characters long'));
    updatePasswordStrength(20, getTranslation('register-password-weak', 'Weak'));
    return false;
  }
  
  if (TOP_100_PASSWORDS.includes(value.toLowerCase())) {
    showError(passwordInput, errorElement, getTranslation('register-password-common-error', 'This password is too common. Choose a stronger one.'));
    updatePasswordStrength(40, getTranslation('register-password-weak', 'Weak'));
    return false;
  }
  
  const hasUpperCase = /[A-Z]/.test(value);
  const hasLowerCase = /[a-z]/.test(value);
  const hasNumbers = /\d/.test(value);
  const hasSpecial = /[@$!%*?&]/.test(value);
  
  const requirements = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecial];
  const metRequirements = requirements.filter(Boolean).length;
  
  let errorMessage = '';
  if (!hasUpperCase) errorMessage += getTranslation('register-password-uppercase', 'Uppercase letter required. ');
  if (!hasLowerCase) errorMessage += getTranslation('register-password-lowercase', 'Lowercase letter required. ');
  if (!hasNumbers) errorMessage += getTranslation('register-password-number', 'Number required. ');
  if (!hasSpecial) errorMessage += getTranslation('register-password-special', 'Special character (@$!%*?&) required. ');
  
  if (errorMessage) {
    showError(passwordInput, errorElement, errorMessage.trim());
    updatePasswordStrength(metRequirements * 25, getTranslation('register-password-weak', 'Weak'));
    return false;
  }
  
  let strength = 25;
  if (value.length >= 12) strength += 25;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) strength += 25;
  if (/\d/.test(value) && /[@$!%*?&]/.test(value)) strength += 25;
  
  let strengthLabel = getTranslation('register-password-weak', 'Weak');
  if (strength >= 75) strengthLabel = getTranslation('register-password-strong', 'Strong');
  else if (strength >= 50) strengthLabel = getTranslation('register-password-medium', 'Medium');
  
  clearError(passwordInput, errorElement);
  updatePasswordStrength(strength, strengthLabel);
  return true;
}

function validateConfirmPassword() {
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirmPassword');
  const errorElement = document.getElementById('confirmPasswordError');
  
  if (!confirmInput.value) {
    showError(confirmInput, errorElement, getTranslation('validation-required', 'Please confirm your password'));
    return false;
  }
  
  if (passwordInput.value !== confirmInput.value) {
    showError(confirmInput, errorElement, getTranslation('register-confirm-password-error', 'Passwords do not match'));
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
    showError(nicknameInput, errorElement, getTranslation('validation-required', 'Username is required'));
    statusElement.innerHTML = '<i class="fas fa-times" style="color: #ef4444;"></i>';
    return false;
  }
  
  if (value.length < 3 || value.length > 20) {
    showError(nicknameInput, errorElement, getTranslation('register-username-length-error', 'Username must be 3-20 characters'));
    statusElement.innerHTML = '<i class="fas fa-times" style="color: #ef4444;"></i>';
    return false;
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    showError(nicknameInput, errorElement, getTranslation('register-username-format-error', 'Only letters, numbers, and underscores allowed'));
    statusElement.innerHTML = '<i class="fas fa-times" style="color: #ef4444;"></i>';
    return false;
  }
  
  if (usedNicknames.has(value.toLowerCase())) {
    showError(nicknameInput, errorElement, getTranslation('register-username-taken', 'This username is already taken'));
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
    termsError.textContent = getTranslation('register-terms-error', 'You must accept the terms and conditions');
    isValid = false;
  } else {
    termsError.textContent = '';
  }
  
  const submitBtn = document.getElementById('registerBtn');
  const disabledText = getTranslation('register-button-disabled', 'Please fill all required fields');
  
  if (!isValid) {
    submitBtn.disabled = true;
    submitBtn.title = disabledText;
  } else {
    submitBtn.disabled = false;
    submitBtn.title = '';
  }
  
  return isValid;
}

async function generateNickname() {
  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const nicknameInput = document.getElementById('nickname');
  const statusElement = document.getElementById('nicknameStatus');
  
  if (!firstName || !lastName) {
    showNotification(getTranslation('register-name-required', 'Please enter your first and last name first'), 'error');
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
    hint.textContent = getTranslation('register-no-attempts-left', 'No attempts left. You can now enter your own username.');
    enableManualNicknameInput();
  } else {
    hint.textContent = getTranslation('register-attempts-hint', 'Username generated automatically. You have {attempts} regeneration attempts.')
      .replace('{attempts}', attemptsLeft);
  }
}

function enableManualNicknameInput() {
  const nicknameInput = document.getElementById('nickname');
  const generateBtn = document.getElementById('generateNickname');
  const hint = document.getElementById('nicknameHint');
  
  nicknameInput.readOnly = false;
  nicknameInput.placeholder = getTranslation('register-manual-username-placeholder', 'Enter your own username');
  generateBtn.disabled = true;
  generateBtn.innerHTML = '<i class="fas fa-random"></i> ' + getTranslation('register-manual-enabled', 'Manual Input Enabled');
  hint.textContent = getTranslation('register-manual-hint', 'You can now enter your own username. Make sure it\'s unique!');
  
  nicknameInput.addEventListener('input', async () => {
    await validateNickname();
    validateForm();
  });
}

function updateAttemptsCounter() {
  const attemptsCounter = document.getElementById('attemptsCounter');
  const attemptsLeft = Math.max(0, 5 - nicknameRegenerationCount);
  attemptsCounter.innerHTML = getTranslation('register-attempts-counter', 'Regeneration attempts left:') + ` <span>${attemptsLeft}</span>`;
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
    .then(() => {
      showNotification(getTranslation('register-copied', 'Copied!'), 'success');
      const copyBtn = document.getElementById('copyPassword');
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = '<i class="fas fa-check"></i>';
      setTimeout(() => {
        copyBtn.innerHTML = originalText;
      }, 2000);
    })
    .catch(err => showNotification(getTranslation('register-copy-error', 'Failed to copy password'), 'error'));
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
    showNotification(getTranslation('register-form-invalid', 'Please fix all errors before submitting'), 'error');
    return;
  }
  
  const submitBtn = document.getElementById('registerBtn');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  const creatingText = getTranslation('register-creating', 'Creating Account...');
  submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${creatingText}`;
  
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
      showNotification(getTranslation('register-error-email-exists', 'Email already registered'), 'error');
      document.getElementById('emailError').textContent = getTranslation('register-error-email-exists', 'Email already registered');
      return;
    }
    
    if (phoneExists) {
      showNotification(getTranslation('register-error-phone-exists', 'Phone number already registered'), 'error');
      document.getElementById('phoneError').textContent = getTranslation('register-error-phone-exists', 'Phone number already registered');
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
      showNotification(getTranslation('register-success', 'Account created successfully!'), 'success');
      
      if (!isManualPassword) {
        localStorage.setItem('generatedPassword', formData.password);
        localStorage.setItem('newUserEmail', formData.email);
      }
      
      localStorage.setItem('userId', newUser.id);
      localStorage.setItem('userRole', newUser.role);
      
      setTimeout(() => {
        window.location.href = 'home.html';
      }, 1500);
    }
    
  } catch (error) {
    console.error('Registration error:', error);
    showNotification(getTranslation('register-error', 'Registration failed. Please try again.'), 'error');
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