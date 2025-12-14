const FEEDBACK_API_BASE = 'http://localhost:3000';
const FEEDBACK_SERVICES_ENDPOINT = `${FEEDBACK_API_BASE}/services`;
const FEEDBACK_FEEDBACK_ENDPOINT = `${FEEDBACK_API_BASE}/feedback`;
const FEEDBACK_ORDERS_ENDPOINT = `${FEEDBACK_API_BASE}/orders`;

let allServices = [];
let userOrders = [];
let allFeedback = [];
let currentLang = 'en';

document.addEventListener('DOMContentLoaded', initFeedback);

document.addEventListener('langChanged', (event) => {
  currentLang = event.detail.lang;
  updateFeedbackTranslations();
  renderFeedback();
  updateFeedbackStats();
});

function getTranslation(key, defaultValue = '') {
  const translations = window.i18Obj?.[currentLang];
  return translations?.[key] || defaultValue;
}

function updateFeedbackTranslations() {
  const translations = window.i18Obj?.[currentLang];
  if (!translations) return;
  
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (translations[key]) {
      if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'BUTTON') {
        if (el.tagName === 'INPUT' || el.tagName === 'SELECT') {
          if (el.hasAttribute('placeholder')) {
            el.placeholder = translations[key];
          }
        } else {
          el.textContent = translations[key];
        }
      } else {
        el.textContent = translations[key];
      }
    }
  });
  
  const elements = {
    '#submitFeedback': 'feedback-submit-button',
    '#resetFeedback': 'feedback-clear-button',
    '#clearFilters': 'feedback-clear-filters',
    '.feedback-subtitle': 'feedback-subtitle',
    '.form-description': 'feedback-form-description',
    '.service-label': 'feedback-service-label',
    '.rating-label': 'feedback-rating-label',
    '.title-label': 'feedback-title-label',
    '.text-label': 'feedback-text-label',
    '.anonymous-label': 'feedback-anonymous',
    '.anonymous-hint': 'feedback-anonymous-hint',
    '.recent-reviews-title': 'feedback-recent-reviews',
    '.total-reviews-label': 'feedback-total-reviews',
    '.average-rating-label': 'feedback-average-rating',
    '.filter-service-label': 'feedback-filter-service',
    '.filter-rating-label': 'feedback-filter-rating',
    '.no-reviews-title': 'feedback-no-reviews-title',
    '.no-reviews-text': 'feedback-no-reviews-text'
  };
  
  Object.entries(elements).forEach(([selector, key]) => {
    const element = document.querySelector(selector);
    if (element && translations[key]) {
      if (element.tagName === 'INPUT' || el.tagName === 'BUTTON') {
        element.value = translations[key];
      } else {
        element.textContent = translations[key];
      }
    }
  });
  
  const filterService = document.getElementById('filterService');
  const filterRating = document.getElementById('filterRating');
  
  if (filterService && filterService.options.length > 0) {
    const allOption = filterService.querySelector('option[value="all"]');
    if (allOption) {
      allOption.textContent = translations['feedback-filter-all'] || 'All Services';
    }
  }
  
  if (filterRating && filterRating.options.length > 0) {
    Array.from(filterRating.options).forEach(option => {
      const ratingKey = `feedback-filter-rating-${option.value}`;
      if (translations[ratingKey]) {
        option.textContent = translations[ratingKey];
      }
    });
  }
  
  updateRatingText();
}

async function initFeedback() {
  console.log('Initializing feedback...');
  
  currentLang = localStorage.getItem('lang') || 'en';
  
  updateFeedbackTranslations();
  
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const lang = btn.dataset.lang;
      if (window.getTranslate) {
        window.getTranslate(lang);
      }
    });
  });
  
  await loadAllData();
  setupEventListeners();
  
  console.log('Feedback initialized');
}

async function loadAllData() {
  try {
    allServices = await fetchData(FEEDBACK_SERVICES_ENDPOINT) || [];
    
    const currentUser = window.authService?.getCurrentUser();
    if (currentUser) {
      const allOrders = await fetchData(FEEDBACK_ORDERS_ENDPOINT) || [];
      userOrders = allOrders.filter(order => order.userId === currentUser.id);
    }
    
    await loadFeedback();
    
    updateServiceSelect();
    updateFeedbackStats();
    renderFeedback();
    updateFormState();
    
  } catch (error) {
    console.error('Error loading data:', error);
    showNotification(getTranslation('feedback-load-error', 'Failed to load data'), 'error');
  }
}

async function loadFeedback() {
  try {
    allFeedback = await fetchData(FEEDBACK_FEEDBACK_ENDPOINT) || [];
  } catch (error) {
    console.error('Error loading feedback:', error);
  }
}

function updateServiceSelect() {
  const serviceSelect = document.getElementById('serviceSelect');
  const filterServiceSelect = document.getElementById('filterService');
  
  if (!serviceSelect || !filterServiceSelect) return;
  
  serviceSelect.innerHTML = '';
  filterServiceSelect.innerHTML = `<option value="all">${getTranslation('feedback-filter-all', 'All Services')}</option>`;
  
  const purchasedServiceIds = new Set(
    userOrders.flatMap(order => order.items.map(item => item.serviceId))
  );
  
  const availableServices = allServices.filter(service => 
    purchasedServiceIds.has(service.id)
  );
  
  if (availableServices.length === 0) {
    const noPurchasedText = getTranslation('feedback-no-purchased-services', 'No purchased services');
    serviceSelect.innerHTML = `<option value="">${noPurchasedText}</option>`;
    serviceSelect.disabled = true;
    return;
  }
  
  const selectText = getTranslation('feedback-service-default', 'Select a service');
  serviceSelect.innerHTML = `<option value="">${selectText}</option>`;
  availableServices.forEach(service => {
    const option = document.createElement('option');
    option.value = service.id;
    option.textContent = `${service.name} - $${service.price}`;
    serviceSelect.appendChild(option);
  });
  
  allServices.forEach(service => {
    const option = document.createElement('option');
    option.value = service.id;
    option.textContent = service.name;
    filterServiceSelect.appendChild(option);
  });
  
  serviceSelect.disabled = false;
}

function updateFormState() {
  const submitBtn = document.getElementById('submitFeedback');
  const serviceSelect = document.getElementById('serviceSelect');
  const serviceHint = document.getElementById('serviceHint');
  
  const currentUser = window.authService?.getCurrentUser();
  
  if (!currentUser) {
    submitBtn.disabled = true;
    serviceSelect.disabled = true;
    const signInText = getTranslation('feedback-sign-in-required', 'Please sign in to leave feedback');
    serviceHint.innerHTML = `<i class="fas fa-info-circle"></i> ${signInText}`;
    return;
  }
  
  if (currentUser.role === 'admin') {
    submitBtn.disabled = true;
    serviceSelect.disabled = true;
    const adminText = getTranslation('feedback-admin-restricted', 'Administrators cannot leave feedback');
    serviceHint.innerHTML = `<i class="fas fa-info-circle"></i> ${adminText}`;
    return;
  }
  
  const hasPurchasedServices = userOrders.length > 0;
  
  if (!hasPurchasedServices) {
    submitBtn.disabled = true;
    serviceSelect.disabled = true;
    const purchaseText = getTranslation('feedback-purchase-required', 'You need to purchase a service first');
    serviceHint.innerHTML = `<i class="fas fa-info-circle"></i> ${purchaseText}`;
  }
}

function setupEventListeners() {
  const form = document.getElementById('feedbackForm');
  const resetBtn = document.getElementById('resetFeedback');
  const filterService = document.getElementById('filterService');
  const filterRating = document.getElementById('filterRating');
  const clearFiltersBtn = document.getElementById('clearFilters');
  const starRating = document.querySelectorAll('.star-rating input');
  
  if (form) {
    form.addEventListener('submit', handleFeedbackSubmit);
  }
  
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      setTimeout(validateForm, 100);
    });
  }
  
  starRating.forEach(star => {
    star.addEventListener('change', () => {
      updateRatingText();
      validateForm();
    });
  });
  
  const titleInput = document.getElementById('feedbackTitle');
  const textInput = document.getElementById('feedbackText');
  
  if (titleInput) {
    titleInput.addEventListener('input', () => {
      const counter = document.getElementById('titleCounter');
      counter.textContent = titleInput.value.length;
      validateForm();
    });
  }
  
  if (textInput) {
    textInput.addEventListener('input', () => {
      const counter = document.getElementById('textCounter');
      counter.textContent = textInput.value.length;
      validateForm();
    });
  }
  
  if (form) {
    form.addEventListener('input', validateForm);
  }
  
  if (filterService) {
    filterService.addEventListener('change', renderFeedback);
  }
  
  if (filterRating) {
    filterRating.addEventListener('change', renderFeedback);
  }
  
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      filterService.value = 'all';
      filterRating.value = 'all';
      renderFeedback();
    });
  }
  
  const serviceSelect = document.getElementById('serviceSelect');
  if (serviceSelect) {
    serviceSelect.addEventListener('change', validateForm);
  }
}

function updateRatingText() {
  const ratingText = document.getElementById('ratingText');
  const selectedRating = document.querySelector('input[name="rating"]:checked');
  
  if (!selectedRating) {
    ratingText.textContent = getTranslation('feedback-rating-default', 'Select your rating');
    return;
  }
  
  const value = selectedRating.value;
  const ratingTranslations = {
    '1': getTranslation('feedback-rating-1', 'Poor - 1 star'),
    '2': getTranslation('feedback-rating-2', 'Fair - 2 stars'),
    '3': getTranslation('feedback-rating-3', 'Good - 3 stars'),
    '4': getTranslation('feedback-rating-4', 'Very Good - 4 stars'),
    '5': getTranslation('feedback-rating-5', 'Excellent - 5 stars')
  };
  
  ratingText.textContent = ratingTranslations[value] || getTranslation('feedback-rating-default', 'Select your rating');
}

function validateForm() {
  const serviceSelect = document.getElementById('serviceSelect');
  const rating = document.querySelector('input[name="rating"]:checked');
  const title = document.getElementById('feedbackTitle').value.trim();
  const text = document.getElementById('feedbackText').value.trim();
  const submitBtn = document.getElementById('submitFeedback');
  
  let isValid = true;
  
  if (!serviceSelect.value) {
    document.getElementById('serviceError').textContent = getTranslation('feedback-service-error', 'Please select a service');
    isValid = false;
  } else {
    document.getElementById('serviceError').textContent = '';
  }
  
  if (!rating) {
    document.getElementById('ratingError').textContent = getTranslation('feedback-rating-error', 'Please select a rating');
    isValid = false;
  } else {
    document.getElementById('ratingError').textContent = '';
  }
  
  if (!title) {
    document.getElementById('titleError').textContent = getTranslation('validation-required', 'Title is required');
    isValid = false;
  } else if (title.length < 5) {
    document.getElementById('titleError').textContent = getTranslation('validation-min-length', 'Title must be at least {min} characters').replace('{min}', '5');
    isValid = false;
  } else if (title.length > 100) {
    document.getElementById('titleError').textContent = getTranslation('validation-max-length', 'Title must be no more than {max} characters').replace('{max}', '100');
    isValid = false;
  } else {
    document.getElementById('titleError').textContent = '';
  }
  
  if (!text) {
    document.getElementById('textError').textContent = getTranslation('validation-required', 'Review text is required');
    isValid = false;
  } else if (text.length < 50) {
    document.getElementById('textError').textContent = getTranslation('validation-min-length', 'Review must be at least {min} characters').replace('{min}', '50');
    isValid = false;
  } else if (text.length > 1000) {
    document.getElementById('textError').textContent = getTranslation('validation-max-length', 'Review must be no more than {max} characters').replace('{max}', '1000');
    isValid = false;
  } else {
    document.getElementById('textError').textContent = '';
  }
  
  submitBtn.disabled = !isValid;
  
  return isValid;
}

async function handleFeedbackSubmit(e) {
  e.preventDefault();
  
  if (!validateForm()) {
    showNotification(getTranslation('feedback-form-invalid', 'Please fix all errors before submitting'), 'error');
    return;
  }
  
  const currentUser = window.authService?.getCurrentUser();
  
  if (!currentUser) {
    showNotification(getTranslation('feedback-sign-in-required', 'Please sign in to leave feedback'), 'error');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
    return;
  }
  
  if (currentUser.role === 'admin') {
    showNotification(getTranslation('feedback-admin-restricted', 'Administrators cannot leave feedback'), 'error');
    return;
  }
  
  const submitBtn = document.getElementById('submitFeedback');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  const submittingText = getTranslation('feedback-submitting', 'Submitting...');
  submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${submittingText}`;
  
  try {
    const serviceId = parseInt(document.getElementById('serviceSelect').value);
    const feedbackData = {
      userId: currentUser.id,
      userName: currentUser.nickname,
      userRole: currentUser.role,
      serviceId: serviceId,
      serviceName: allServices.find(s => s.id === serviceId)?.name || '',
      rating: parseInt(document.querySelector('input[name="rating"]:checked').value),
      title: document.getElementById('feedbackTitle').value.trim(),
      text: document.getElementById('feedbackText').value.trim(),
      isAnonymous: document.getElementById('anonymous').checked,
      createdAt: new Date().toISOString(),
      helpfulCount: 0,
      reported: false
    };
    
    const existingFeedback = allFeedback.find(f => 
      f.userId === currentUser.id && f.serviceId === serviceId
    );
    
    if (existingFeedback) {
      showNotification(getTranslation('feedback-error-duplicate', 'You have already reviewed this service'), 'error');
      return;
    }
    
    const newFeedback = await fetchData(FEEDBACK_FEEDBACK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(feedbackData)
    });
    
    if (newFeedback) {
      showNotification(getTranslation('feedback-success', 'Thank you for your feedback!'), 'success');
      
      document.getElementById('feedbackForm').reset();
      
      await loadFeedback();
      updateFeedbackStats();
      renderFeedback();
      validateForm();
    }
    
  } catch (error) {
    console.error('Error submitting feedback:', error);
    showNotification(getTranslation('feedback-error', 'Failed to submit feedback. Please try again.'), 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

function updateFeedbackStats() {
  const totalReviews = document.getElementById('totalReviews');
  const averageRating = document.getElementById('averageRating');
  
  if (allFeedback.length === 0) {
    totalReviews.textContent = '0';
    averageRating.textContent = '0.0';
    return;
  }
  
  totalReviews.textContent = allFeedback.length;
  
  const avg = allFeedback.reduce((sum, item) => sum + item.rating, 0) / allFeedback.length;
  averageRating.textContent = avg.toFixed(1);
}

function renderFeedback() {
  const feedbackList = document.getElementById('feedbackList');
  const noFeedback = document.getElementById('noFeedback');
  
  if (!feedbackList || !noFeedback) return;
  
  let filteredFeedback = [...allFeedback];
  
  const serviceFilter = document.getElementById('filterService')?.value;
  const ratingFilter = document.getElementById('filterRating')?.value;
  
  if (serviceFilter && serviceFilter !== 'all') {
    filteredFeedback = filteredFeedback.filter(f => f.serviceId == serviceFilter);
  }
  
  if (ratingFilter && ratingFilter !== 'all') {
    const minRating = parseInt(ratingFilter);
    filteredFeedback = filteredFeedback.filter(f => f.rating >= minRating);
  }
  
  if (filteredFeedback.length === 0) {
    feedbackList.style.display = 'none';
    noFeedback.style.display = 'block';
    return;
  }
  
  feedbackList.style.display = 'flex';
  noFeedback.style.display = 'none';
  
  feedbackList.innerHTML = filteredFeedback.map(feedback => {
    const service = allServices.find(s => s.id === feedback.serviceId);
    const displayName = feedback.isAnonymous ? 
      getTranslation('feedback-review-anonymous', 'Anonymous User') : 
      feedback.userName;
    const userRole = feedback.isAnonymous ? 
      getTranslation('feedback-customer', 'Customer') : 
      feedback.userRole === 'admin' ? 
        getTranslation('admin-role-admin', 'Administrator') : 
        getTranslation('admin-role-user', 'User');
    
    const categoryKey = `category-${service?.category?.toLowerCase().replace(/\s+/g, '-')}`;
    const categoryName = getTranslation(categoryKey, service?.category || '');
    
    return `
      <div class="feedback-item" data-feedback-id="${feedback.id}">
        <div class="feedback-header-info">
          <div class="feedback-user">
            <div class="user-avatar">
              ${displayName.charAt(0).toUpperCase()}
            </div>
            <div class="user-info">
              <h4>${displayName}</h4>
              <div class="user-role">${userRole}</div>
            </div>
          </div>
          <div class="feedback-meta">
            <div class="feedback-service">
              <strong>${getTranslation('feedback-review-service', 'Service')}:</strong> ${service?.name || getTranslation('feedback-unknown-service', 'Unknown Service')}
              ${categoryName ? ` (${categoryName})` : ''}
            </div>
            <div class="feedback-date">
              <strong>${getTranslation('feedback-review-on', 'on')}:</strong> ${formatDate(feedback.createdAt)}
            </div>
          </div>
        </div>
        
        <div class="feedback-title">${feedback.title}</div>
        <div class="feedback-rating">
          ${'★'.repeat(feedback.rating)}${'☆'.repeat(5 - feedback.rating)}
          <span class="rating-value">(${feedback.rating} ${getTranslation('feedback-stars', 'stars')})</span>
        </div>
        <div class="feedback-text">${feedback.text}</div>
        
        <div class="feedback-actions">
          <div class="feedback-helpful">
            <button class="helpful-btn" data-feedback-id="${feedback.id}">
              <i class="fas fa-thumbs-up"></i> ${getTranslation('feedback-review-helpful', 'Helpful?')}
            </button>
            <span class="helpful-count">
              (${feedback.helpfulCount || 0} ${getTranslation('feedback-review-helpful-count', 'people found this helpful')})
            </span>
          </div>
          ${window.authService?.isAdmin() ? `
            <button class="feedback-report delete-feedback" data-feedback-id="${feedback.id}">
              <i class="fas fa-trash"></i> ${getTranslation('admin-delete', 'Delete')}
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
  
  attachFeedbackEventListeners();
}

function attachFeedbackEventListeners() {
  document.querySelectorAll('.helpful-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const currentUser = window.authService?.getCurrentUser();
      if (!currentUser) {
        showNotification(getTranslation('feedback-login-required-helpful', 'Please sign in to mark as helpful'), 'error');
        return;
      }
      
      const feedbackId = btn.dataset.feedbackId;
      await markAsHelpful(feedbackId);
    });
  });
  
  document.querySelectorAll('.delete-feedback').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const feedbackId = btn.dataset.feedbackId;
      await deleteFeedback(feedbackId);
    });
  });
}

async function markAsHelpful(feedbackId) {
  try {
    const feedback = allFeedback.find(f => f.id == feedbackId);
    if (!feedback) return;
    
    const updatedFeedback = {
      ...feedback,
      helpfulCount: (feedback.helpfulCount || 0) + 1
    };
    
    await fetchData(`${FEEDBACK_FEEDBACK_ENDPOINT}/${feedbackId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedFeedback)
    });
    
    showNotification(getTranslation('feedback-helpful-success', 'Marked as helpful!'), 'success');
    await loadFeedback();
    renderFeedback();
    
  } catch (error) {
    console.error('Error marking as helpful:', error);
    showNotification(getTranslation('feedback-helpful-error', 'Failed to update'), 'error');
  }
}

async function deleteFeedback(feedbackId) {
  const confirmMessage = getTranslation('feedback-confirm-delete', 'Are you sure you want to delete this feedback?');
  if (!confirm(confirmMessage)) return;
  
  try {
    await fetchData(`${FEEDBACK_FEEDBACK_ENDPOINT}/${feedbackId}`, {
      method: 'DELETE'
    });
    
    showNotification(getTranslation('feedback-delete-success', 'Feedback deleted'), 'success');
    await loadFeedback();
    updateFeedbackStats();
    renderFeedback();
    
  } catch (error) {
    console.error('Error deleting feedback:', error);
    showNotification(getTranslation('feedback-delete-error', 'Failed to delete feedback'), 'error');
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString(currentLang === 'ru' ? 'ru-RU' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
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