const ADMIN_API_BASE = 'http://localhost:3000';
const ADMIN_SERVICES_ENDPOINT = `${ADMIN_API_BASE}/services`;
const ADMIN_FEEDBACK_ENDPOINT = `${ADMIN_API_BASE}/feedback`;
const ADMIN_ORDERS_ENDPOINT = `${ADMIN_API_BASE}/orders`;
const ADMIN_USERS_ENDPOINT = `${ADMIN_API_BASE}/users`;

let allServices = [];
let allFeedback = [];
let allOrders = [];
let allUsers = [];

let serviceForm;
let saveServiceBtn;
let currentLang = 'en';

document.addEventListener('DOMContentLoaded', initAdmin);

document.addEventListener('langChanged', (event) => {
  currentLang = event.detail.lang;
  translateAdminUI();
});

async function initAdmin() {
  console.log('Initializing admin panel...');
  
  currentLang = localStorage.getItem('lang') || 'en';
  
  const hasAccess = await checkAdminAccess();
  if (!hasAccess) return;
  
  serviceForm = document.getElementById('serviceForm');
  saveServiceBtn = document.getElementById('saveService');
  
  await loadAllData();
  
  setupFormValidation();
  
  setupEventListeners();
  
  translateAdminUI();
  
  console.log('Admin panel initialized');
}

function translateAdminUI() {
  const translations = window.i18Obj?.[currentLang];
  if (!translations) return;
  
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (translations[key]) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
        el.placeholder = translations[key];
      } else {
        el.textContent = translations[key];
      }
    }
  });
  
  const elements = {
    '#addServiceBtn': 'admin-add-service',
    '#saveService': 'admin-save-service',
    '#cancelService': 'admin-cancel',
    '#searchServices': 'admin-search-services',
    '.modal-title': 'admin-modal-add-service',
    '.close-modal': 'admin-close',
    '#filterFeedbackService': 'admin-filter-service',
    '#filterFeedbackUser': 'admin-filter-user',
    '#filterFeedbackRating': 'admin-filter-rating',
    '#filterUserRole': 'admin-role-admin'
  };
  
  Object.entries(elements).forEach(([selector, key]) => {
    const element = document.querySelector(selector);
    if (element && translations[key]) {
      if (element.tagName === 'INPUT' || element.tagName === 'BUTTON') {
        element.value = translations[key];
      } else if (element.tagName === 'SELECT') {
        const firstOption = element.querySelector('option[value="all"]');
        if (firstOption) firstOption.textContent = translations[key];
      } else {
        element.textContent = translations[key];
      }
    }
  });
  
  const categorySelect = document.getElementById('serviceCategory');
  if (categorySelect) {
    const options = categorySelect.querySelectorAll('option');
    options.forEach(option => {
      if (option.value && option.value !== '') {
        const key = `admin-category-${option.value.toLowerCase().replace(/\s+/g, '-')}`;
        if (translations[key]) {
          option.textContent = translations[key];
        }
      }
    });
  }
  
  renderServices();
  renderFeedback();
  renderOrders();
  renderUsers();
}

async function checkAdminAccess() {
  try {
    if (!window.authService || !window.authService.initialized) {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (!window.authService) {
        console.error('Auth service not available');
        return false;
      }
    }
    
    const currentUser = window.authService.getCurrentUser();
    const isAdmin = currentUser && currentUser.role === 'admin';
    
    const adminPanel = document.getElementById('adminPanel');
    const accessDenied = document.getElementById('adminAccessDenied');
    
    if (adminPanel && accessDenied) {
      if (isAdmin) {
        adminPanel.style.display = 'block';
        accessDenied.style.display = 'none';
        return true;
      } else {
        adminPanel.style.display = 'none';
        accessDenied.style.display = 'block';
        
        const accessDeniedTitle = document.querySelector('#adminAccessDenied h2');
        const accessDeniedText = document.querySelector('#adminAccessDenied p');
        const backButton = document.querySelector('#adminAccessDenied .btn');
        
        if (window.i18Obj?.[currentLang]) {
          const t = window.i18Obj[currentLang];
          if (accessDeniedTitle) accessDeniedTitle.textContent = t['admin-access-denied-title'];
          if (accessDeniedText) accessDeniedText.textContent = t['admin-access-denied-text'];
          if (backButton) backButton.textContent = t['admin-back-to-home'];
        }
        
        const adminBtn = document.querySelector('.admin-panel-btn');
        if (adminBtn) adminBtn.style.display = 'none';
        
        return false;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking admin access:', error);
    return false;
  }
}

async function loadAllData() {
  try {
    showLoading(true);
    
    [allServices, allFeedback, allOrders, allUsers] = await Promise.all([
      fetchData(ADMIN_SERVICES_ENDPOINT) || [],
      fetchData(ADMIN_FEEDBACK_ENDPOINT) || [],
      fetchData(ADMIN_ORDERS_ENDPOINT) || [],
      fetchData(ADMIN_USERS_ENDPOINT) || []
    ]);
    
    updateStats();
    renderServices();
    renderFeedback();
    renderOrders();
    renderUsers();
    
  } catch (error) {
    console.error('Error loading admin data:', error);
    showNotification(window.i18Obj?.[currentLang]?.['admin-data-load-failed'] || 'Failed to load data', 'error');
  } finally {
    showLoading(false);
  }
}

function showLoading(show) {
  const loadingElements = document.querySelectorAll('.admin-loading');
  loadingElements.forEach(el => {
    el.style.display = show ? 'block' : 'none';
  });
  
  if (!show) {
    document.querySelectorAll('.fa-spinner').forEach(spinner => {
      spinner.parentElement.disabled = false;
      spinner.remove();
    });
  }
}

function updateStats() {
  document.getElementById('totalServices').textContent = allServices.length;
  document.getElementById('totalOrders').textContent = allOrders.length;
  document.getElementById('totalFeedback').textContent = allFeedback.length;
  document.getElementById('totalUsers').textContent = allUsers.length;
}

function setupFormValidation() {
  if (!serviceForm) return;
  
  const inputs = serviceForm.querySelectorAll('input, textarea, select');
  inputs.forEach(input => {
    input.addEventListener('input', validateForm);
    input.addEventListener('change', validateForm);
  });
}

function validateForm() {
  if (!saveServiceBtn || !serviceForm) return;
  
  let isValid = true;
  const errors = {};
  const t = window.i18Obj?.[currentLang] || {};
  
  const nameInput = document.getElementById('serviceName');
  if (!nameInput.value.trim()) {
    isValid = false;
    errors.name = t['admin-validation-required'] || 'This field is required';
  } else if (nameInput.value.trim().length < 3) {
    isValid = false;
    errors.name = t['admin-validation-name'] || 'Service name must be at least 3 characters';
  }
  
  const categoryInput = document.getElementById('serviceCategory');
  if (!categoryInput.value) {
    isValid = false;
    errors.category = t['admin-validation-required'] || 'This field is required';
  }
  
  const priceInput = document.getElementById('servicePrice');
  const price = parseFloat(priceInput.value);
  if (!priceInput.value || isNaN(price) || price < 0) {
    isValid = false;
    errors.price = t['admin-validation-price'] || 'Valid price is required (min: 0)';
  }
  
  const ratingInput = document.getElementById('serviceRating');
  const rating = parseFloat(ratingInput.value);
  if (!ratingInput.value || isNaN(rating) || rating < 0 || rating > 5) {
    isValid = false;
    errors.rating = t['admin-validation-rating'] || 'Rating must be between 0 and 5';
  }
  
  const descInput = document.getElementById('serviceDescription');
  if (!descInput.value.trim()) {
    isValid = false;
    errors.description = t['admin-validation-required'] || 'This field is required';
  } else if (descInput.value.trim().length < 10) {
    isValid = false;
    errors.description = t['admin-validation-description-min'] || 'Description must be at least 10 characters';
  }
  
  const imageInput = document.getElementById('serviceImage');
  const urlPattern = /^(https?:\/\/|\/|\.\/|\.\.\/).*\.(jpg|jpeg|png|gif|svg|webp)$/i;
  if (!imageInput.value.trim()) {
    isValid = false;
    errors.image = t['admin-validation-required'] || 'This field is required';
  } else if (!urlPattern.test(imageInput.value.trim())) {
    isValid = false;
    errors.image = t['admin-validation-image-url'] || 'Please enter a valid image URL';
  }
  
  showFormErrors(errors);
  
  saveServiceBtn.disabled = !isValid;
  
  return isValid;
}

function showFormErrors(errors) {
  document.querySelectorAll('.error-message').forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });
  
  Object.entries(errors).forEach(([field, message]) => {
    const errorEl = document.getElementById(`${field}Error`);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  });
}

function setupEventListeners() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });
  
  const addServiceBtn = document.getElementById('addServiceBtn');
  if (addServiceBtn) {
    addServiceBtn.addEventListener('click', () => {
      openServiceModal();
    });
  }
  
  const searchServices = document.getElementById('searchServices');
  if (searchServices) {
    searchServices.addEventListener('input', () => {
      renderServices();
    });
  }
  
  document.querySelectorAll('.close-modal, #cancelService').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
      });
    });
  });
  
  if (saveServiceBtn) {
    saveServiceBtn.addEventListener('click', handleSaveService);
  }
  
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.classList.remove('show');
    }
  });
  
  const filterFeedbackService = document.getElementById('filterFeedbackService');
  const filterFeedbackUser = document.getElementById('filterFeedbackUser');
  const filterFeedbackRating = document.getElementById('filterFeedbackRating');
  
  if (filterFeedbackService) {
    filterFeedbackService.addEventListener('change', renderFeedback);
    populateServiceFilter(filterFeedbackService);
  }
  
  if (filterFeedbackUser) {
    filterFeedbackUser.addEventListener('change', renderFeedback);
    populateUserFilter(filterFeedbackUser);
  }
  
  if (filterFeedbackRating) {
    filterFeedbackRating.addEventListener('change', renderFeedback);
  }
  
  const filterUserRole = document.getElementById('filterUserRole');
  if (filterUserRole) {
    filterUserRole.addEventListener('change', renderUsers);
  }
  
  const descriptionInput = document.getElementById('serviceDescription');
  if (descriptionInput) {
    descriptionInput.addEventListener('input', () => {
      const counter = document.getElementById('descriptionCounter');
      if (counter) {
        counter.textContent = descriptionInput.value.length;
        validateForm();
      }
    });
  }
  
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      if (window.getTranslate) {
        window.getTranslate(lang);
      }
    });
  });
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `${tabName}Tab`);
  });
}

function renderServices() {
  const servicesList = document.getElementById('servicesList');
  const searchTerm = document.getElementById('searchServices')?.value.toLowerCase() || '';
  const t = window.i18Obj?.[currentLang] || {};
  
  if (!servicesList) return;
  
  let filteredServices = allServices;
  if (searchTerm) {
    filteredServices = allServices.filter(service =>
      service.name.toLowerCase().includes(searchTerm) ||
      service.description.toLowerCase().includes(searchTerm) ||
      service.category.toLowerCase().includes(searchTerm)
    );
  }
  
  if (filteredServices.length === 0) {
    servicesList.innerHTML = `
      <div class="no-results">
        <i class="fas fa-search fa-3x"></i>
        <h3>${t['admin-no-results'] || 'No services found'}</h3>
        <p>${searchTerm ? (t['admin-try-adjusting-criteria'] || 'Try adjusting your search criteria') : (t['admin-no-data'] || 'No services available')}</p>
      </div>
    `;
    return;
  }
  
  servicesList.innerHTML = filteredServices.map(service => {
    const serviceName = service.name || t['admin-service-name'] || 'Service';
    const serviceDesc = service.description || '';
    const categoryKey = `admin-category-${service.category?.toLowerCase().replace(/\s+/g, '-')}`;
    const categoryName = t[categoryKey] || service.category || t['admin-select-category'] || 'Category';
    
    return `
      <div class="admin-card" data-service-id="${service.id}">
        <div class="card-header">
          <h3 class="card-title">${serviceName}</h3>
          <div class="card-actions">
            <button class="action-btn view-feedback" data-service-id="${service.id}" title="${t['admin-view-feedback'] || 'View Feedback'}">
              <i class="fas fa-comments"></i>
            </button>
            <button class="action-btn edit" data-service-id="${service.id}" title="${t['admin-edit'] || 'Edit'}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete" data-service-id="${service.id}" title="${t['admin-delete'] || 'Delete'}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="card-content">
          <p>${serviceDesc}</p>
          <div class="service-meta">
            <span class="badge">${categoryName}</span>
            <span><i class="fas fa-dollar-sign"></i> $${service.price || 0}</span>
            <span><i class="fas fa-star"></i> ${service.rating || 0}</span>
          </div>
        </div>
        <div class="card-footer">
          <small>${t['admin-id'] || 'ID'}: ${service.id}</small>
          <button class="btn btn-secondary btn-sm view-feedback-btn" data-service-id="${service.id}">
            ${t['admin-view-feedback'] || 'View Feedback'} (${getServiceFeedbackCount(service.id)})
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  attachServicesEventListeners();
}

function attachServicesEventListeners() {
  document.querySelectorAll('.action-btn.edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const serviceId = btn.dataset.serviceId;
      openServiceModal(serviceId);
    });
  });
  
  document.querySelectorAll('.action-btn.delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const serviceId = btn.dataset.serviceId;
      await deleteService(serviceId);
    });
  });
  
  document.querySelectorAll('.action-btn.view-feedback, .view-feedback-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const serviceId = btn.dataset.serviceId;
      await showServiceFeedback(serviceId);
    });
  });
}

function getServiceFeedbackCount(serviceId) {
  return allFeedback.filter(f => f.serviceId == serviceId).length;
}

function openServiceModal(serviceId = null) {
  const modal = document.getElementById('serviceModal');
  const modalTitle = document.getElementById('modalTitle');
  const form = document.getElementById('serviceForm');
  const t = window.i18Obj?.[currentLang] || {};
  
  if (serviceId) {
    const service = allServices.find(s => s.id == serviceId);
    if (!service) return;
    
    modalTitle.innerHTML = `<i class="fas fa-edit"></i> ${t['admin-modal-edit-service'] || 'Edit Service'}`;
    document.getElementById('serviceId').value = service.id;
    document.getElementById('serviceName').value = service.name;
    document.getElementById('serviceCategory').value = service.category;
    document.getElementById('servicePrice').value = service.price;
    document.getElementById('serviceRating').value = service.rating;
    document.getElementById('serviceDescription').value = service.description;
    document.getElementById('serviceImage').value = service.image;
  } else {
    modalTitle.innerHTML = `<i class="fas fa-plus"></i> ${t['admin-modal-add-service'] || 'Add New Service'}`;
    form.reset();
    document.getElementById('serviceId').value = '';
  }
  
  const descInput = document.getElementById('serviceDescription');
  const counter = document.getElementById('descriptionCounter');
  if (descInput && counter) {
    counter.textContent = descInput.value.length;
  }
  
  validateForm();
  
  modal.classList.add('show');
}

async function handleSaveService(e) {
  e.preventDefault();
  const t = window.i18Obj?.[currentLang] || {};
  
  if (!validateForm()) {
    showNotification(t['admin-form-invalid'] || 'Please fix validation errors', 'error');
    return;
  }
  
  const serviceId = document.getElementById('serviceId').value;
  const isEdit = !!serviceId;
  
  const serviceData = {
    name: document.getElementById('serviceName').value.trim(),
    category: document.getElementById('serviceCategory').value,
    price: parseFloat(document.getElementById('servicePrice').value),
    rating: parseFloat(document.getElementById('serviceRating').value),
    description: document.getElementById('serviceDescription').value.trim(),
    image: document.getElementById('serviceImage').value.trim()
  };
  
  const saveBtn = document.getElementById('saveService');
  const originalText = saveBtn.innerHTML;
  saveBtn.disabled = true;
  saveBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${t['admin-saving'] || 'Saving...'}`;
  
  try {
    let result;
    if (isEdit) {
      result = await fetchData(`${ADMIN_SERVICES_ENDPOINT}/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData)
      });
    } else {
      result = await fetchData(ADMIN_SERVICES_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData)
      });
    }
    
    if (result) {
      showNotification(t['admin-service-saved'] || `Service ${isEdit ? 'updated' : 'added'} successfully!`, 'success');
      
      document.getElementById('serviceModal').classList.remove('show');
      await loadAllData();
    }
    
  } catch (error) {
    console.error('Error saving service:', error);
    showNotification(t['admin-save-error'] || `Failed to ${isEdit ? 'update' : 'add'} service`, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalText;
  }
}

async function deleteService(serviceId) {
  const t = window.i18Obj?.[currentLang] || {};
  const service = allServices.find(s => s.id == serviceId);
  
  if (!service) return;
  
  const confirmMessage = t['admin-confirm-delete'] || 'Are you sure you want to delete this service? This action cannot be undone.';
  if (!confirm(confirmMessage)) {
    return;
  }
  
  const serviceFeedback = allFeedback.filter(f => f.serviceId == serviceId);
  if (serviceFeedback.length > 0) {
    const feedbackConfirmMessage = t['admin-delete-service-confirm']?.replace('{count}', serviceFeedback.length) 
      || `This service has ${serviceFeedback.length} feedback entries. Deleting it will also delete all associated feedback. Continue?`;
    
    if (!confirm(feedbackConfirmMessage)) {
      return;
    }
  }
  
  try {
    for (const feedback of serviceFeedback) {
      await fetchData(`${ADMIN_FEEDBACK_ENDPOINT}/${feedback.id}`, {
        method: 'DELETE'
      });
    }
    
    await fetchData(`${ADMIN_SERVICES_ENDPOINT}/${serviceId}`, {
      method: 'DELETE'
    });
    
    showNotification(t['admin-service-deleted'] || 'Service deleted successfully', 'success');
    
    await loadAllData();
    
  } catch (error) {
    console.error('Error deleting service:', error);
    showNotification(t['admin-delete-error'] || 'Failed to delete service', 'error');
  }
}

async function showServiceFeedback(serviceId) {
  const t = window.i18Obj?.[currentLang] || {};
  const service = allServices.find(s => s.id == serviceId);
  if (!service) return;
  
  const serviceFeedback = allFeedback.filter(f => f.serviceId == serviceId);
  
  const modal = document.getElementById('viewFeedbackModal');
  const details = document.getElementById('feedbackDetails');
  
  if (serviceFeedback.length === 0) {
    details.innerHTML = `
      <div class="no-feedback">
        <i class="fas fa-comment-slash fa-3x"></i>
        <h3>${t['admin-no-feedback-yet'] || 'No Feedback Yet'}</h3>
        <p>${t['admin-no-results'] || 'There are no reviews for this service yet.'}</p>
      </div>
    `;
  } else {
    details.innerHTML = `
      <div class="feedback-header">
        <h3>${t['admin-feedback-header'] || 'Feedback for:'} ${service.name}</h3>
        <p>${t['admin-total-reviews-for-service'] || 'Total reviews:'} ${serviceFeedback.length}</p>
      </div>
      <div class="feedback-list">
        ${serviceFeedback.map(feedback => {
          const user = allUsers.find(u => u.id === feedback.userId);
          return `
            <div class="feedback-item" data-feedback-id="${feedback.id}">
              <div class="feedback-header">
                <div class="user-info">
                  <strong>${feedback.isAnonymous ? t['feedback-review-anonymous'] : user?.nickname || t['admin-user-info']}</strong>
                  <span class="rating">${'★'.repeat(feedback.rating)}</span>
                </div>
                <button class="btn btn-danger btn-sm delete-feedback-btn" data-feedback-id="${feedback.id}">
                  <i class="fas fa-trash"></i> ${t['admin-delete'] || 'Delete'}
                </button>
              </div>
              <p class="feedback-text">${feedback.text}</p>
              <div class="feedback-meta">
                <small>${formatDate(feedback.createdAt)}</small>
                ${feedback.reported ? `<span class="badge badge-warning">${t['admin-reported'] || 'Reported'}</span>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    
    details.querySelectorAll('.delete-feedback-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const feedbackId = btn.dataset.feedbackId;
        await deleteFeedback(feedbackId);
        modal.classList.remove('show');
        setTimeout(() => showServiceFeedback(serviceId), 300);
      });
    });
  }
  
  modal.classList.add('show');
}

function renderFeedback() {
  const feedbackList = document.getElementById('feedbackListAdmin');
  const serviceFilter = document.getElementById('filterFeedbackService')?.value;
  const userFilter = document.getElementById('filterFeedbackUser')?.value;
  const ratingFilter = document.getElementById('filterFeedbackRating')?.value;
  const t = window.i18Obj?.[currentLang] || {};
  
  if (!feedbackList) return;
  
  let filteredFeedback = allFeedback;
  
  if (serviceFilter && serviceFilter !== 'all') {
    filteredFeedback = filteredFeedback.filter(f => f.serviceId == serviceFilter);
  }
  
  if (userFilter && userFilter !== 'all') {
    filteredFeedback = filteredFeedback.filter(f => f.userId == userFilter);
  }
  
  if (ratingFilter && ratingFilter !== 'all') {
    filteredFeedback = filteredFeedback.filter(f => f.rating == ratingFilter);
  }
  
  if (filteredFeedback.length === 0) {
    feedbackList.innerHTML = `
      <div class="no-results">
        <i class="fas fa-comment-slash fa-3x"></i>
        <h3>${t['admin-no-results'] || 'No feedback found'}</h3>
        <p>${t['admin-try-adjusting-criteria'] || 'Try adjusting your filters'}</p>
      </div>
    `;
    return;
  }
  
  feedbackList.innerHTML = filteredFeedback.map(feedback => {
    const service = allServices.find(s => s.id == feedback.serviceId);
    const user = allUsers.find(u => u.id === feedback.userId);
    
    return `
      <div class="admin-card" data-feedback-id="${feedback.id}">
        <div class="card-header">
          <h3 class="card-title">
            ${service ? `${service.name} - ${t['admin-feedback'] || 'Feedback'}` : t['admin-feedback'] || 'Unknown Service'}
          </h3>
          <div class="card-actions">
            <span class="rating">${'★'.repeat(feedback.rating)}</span>
            <button class="action-btn delete" data-feedback-id="${feedback.id}" title="${t['admin-delete'] || 'Delete'}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="card-content">
          <div class="feedback-meta">
            <span><strong>${t['admin-user'] || 'User'}:</strong> ${feedback.isAnonymous ? t['feedback-review-anonymous'] : user?.nickname || t['admin-user-info']}</span>
            <span><strong>${t['admin-service'] || 'Service'}:</strong> ${service?.name || t['admin-service']}</span>
          </div>
          <p class="feedback-text">${feedback.text}</p>
        </div>
        <div class="card-footer">
          <small>${formatDate(feedback.createdAt)}</small>
          ${feedback.reported ? `<span class="badge badge-warning">${t['admin-reported'] || 'Reported'}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');
  
  feedbackList.querySelectorAll('.action-btn.delete[data-feedback-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const feedbackId = btn.dataset.feedbackId;
      await deleteFeedback(feedbackId);
    });
  });
}

async function deleteFeedback(feedbackId) {
  const t = window.i18Obj?.[currentLang] || {};
  const confirmMessage = t['admin-confirm-delete'] || 'Are you sure you want to delete this feedback?';
  if (!confirm(confirmMessage)) return;
  
  try {
    await fetchData(`${ADMIN_FEEDBACK_ENDPOINT}/${feedbackId}`, {
      method: 'DELETE'
    });
    
    showNotification(t['admin-feedback-deleted'] || 'Feedback deleted successfully', 'success');
    
    await loadAllData();
    
  } catch (error) {
    console.error('Error deleting feedback:', error);
    showNotification(t['admin-delete-error'] || 'Failed to delete feedback', 'error');
  }
}

function renderOrders() {
  const ordersList = document.getElementById('ordersList');
  const t = window.i18Obj?.[currentLang] || {};
  
  if (!ordersList) return;
  
  if (allOrders.length === 0) {
    ordersList.innerHTML = `
      <div class="no-results">
        <i class="fas fa-receipt fa-3x"></i>
        <h3>${t['admin-no-results'] || 'No orders found'}</h3>
        <p>${t['admin-no-data'] || 'There are no orders yet'}</p>
      </div>
    `;
    return;
  }
  
  ordersList.innerHTML = allOrders.map(order => {
    const user = allUsers.find(u => u.id === order.userId);
    
    return `
      <div class="admin-card">
        <div class="card-header">
          <h3 class="card-title">${t['admin-order'] || 'Order'} #${order.id}</h3>
          <span class="order-status ${order.status}">${order.status}</span>
        </div>
        <div class="card-content">
          <div class="order-info">
            <p><strong>${t['admin-customer'] || 'Customer'}:</strong> ${user?.nickname || order.userName}</p>
            <p><strong>${t['admin-user-email'] || 'Email'}:</strong> ${order.userEmail}</p>
            <p><strong>${t['admin-phone'] || 'Phone'}:</strong> ${order.userPhone || t['admin-no-data'] || 'Not provided'}</p>
            <p><strong>${t['admin-order-date'] || 'Date'}:</strong> ${formatDate(order.orderDate)}</p>
          </div>
          <div class="order-items">
            <h4>${t['admin-order-items'] || 'Items'} (${order.items.length}):</h4>
            ${order.items.map(item => `
              <div class="order-item">
                <span>${item.name}</span>
                <span>$${item.price} × ${item.quantity}</span>
              </div>
            `).join('')}
          </div>
          <div class="order-total">
            <strong>${t['admin-order-total'] || 'Total'}: $${order.total}</strong>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderUsers() {
  const usersList = document.getElementById('usersList');
  const roleFilter = document.getElementById('filterUserRole')?.value;
  const t = window.i18Obj?.[currentLang] || {};
  
  if (!usersList) return;
  
  let filteredUsers = allUsers;
  
  if (roleFilter && roleFilter !== 'all') {
    filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
  }
  
  const currentUser = window.authService?.getCurrentUser();
  if (currentUser) {
    filteredUsers = filteredUsers.filter(user => user.id !== currentUser.id);
  }
  
  if (filteredUsers.length === 0) {
    usersList.innerHTML = `
      <div class="no-results">
        <i class="fas fa-users fa-3x"></i>
        <h3>${t['admin-no-results'] || 'No users found'}</h3>
        <p>${roleFilter !== 'all' ? t['admin-try-adjusting-criteria'] : t['admin-no-data']}</p>
      </div>
    `;
    return;
  }
  
  usersList.innerHTML = filteredUsers.map(user => {
    const userFeedback = allFeedback.filter(f => f.userId === user.id);
    const userOrders = allOrders.filter(o => o.userId === user.id);
    const totalSpent = userOrders.reduce((sum, order) => sum + order.total, 0);
    
    return `
      <div class="admin-card">
        <div class="card-header">
          <h3 class="card-title">${user.nickname}</h3>
          <span class="user-role ${user.role}">${user.role}</span>
        </div>
        <div class="card-content">
          <div class="user-info">
            <p><strong>${t['user-name'] || 'Name'}:</strong> ${user.firstName} ${user.lastName}</p>
            <p><strong>${t['admin-user-email'] || 'Email'}:</strong> ${user.email}</p>
            <p><strong>${t['admin-phone'] || 'Phone'}:</strong> ${user.phone}</p>
            <p><strong>${t['user-joined'] || 'Joined'}:</strong> ${formatDate(user.createdAt)}</p>
          </div>
          <div class="user-stats">
            <span class="stat"><i class="fas fa-comments"></i> ${userFeedback.length} ${t['admin-reviews'] || 'reviews'}</span>
            <span class="stat"><i class="fas fa-shopping-cart"></i> ${userOrders.length} ${t['admin-orders'] || 'orders'}</span>
            <span class="stat"><i class="fas fa-dollar-sign"></i> $${totalSpent.toFixed(2)} ${t['admin-spent'] || 'spent'}</span>
          </div>
        </div>
        <div class="card-footer">
          <button class="btn btn-secondary btn-sm" onclick="changeUserRole('${user.id}')">
            <i class="fas fa-user-cog"></i> ${t['admin-change-role'] || 'Change Role'}
          </button>
          ${user.role !== 'admin' ? `
            <button class="btn btn-danger btn-sm" onclick="deleteUser('${user.id}')">
              <i class="fas fa-trash"></i> ${t['admin-delete'] || 'Delete'}
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

async function changeUserRole(userId) {
  const t = window.i18Obj?.[currentLang] || {};
  const user = allUsers.find(u => u.id === userId);
  if (!user) return;
  
  const newRole = user.role === 'admin' ? 'user' : 'admin';
  
  const confirmMessage = t['admin-confirm'] 
    ? `${t['admin-confirm']} ${user.nickname}'s role to ${newRole}?`
    : `Change ${user.nickname}'s role to ${newRole}?`;
  
  if (!confirm(confirmMessage)) return;
  
  try {
    const updatedUser = {
      ...user,
      role: newRole
    };
    
    await fetchData(`${ADMIN_USERS_ENDPOINT}/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser)
    });
    
    showNotification(t['admin-user-role-changed'] || `User role changed to ${newRole}`, 'success');
    
    await loadAllData();
    
  } catch (error) {
    console.error('Error changing user role:', error);
    showNotification(t['admin-operation-failed'] || 'Failed to change user role', 'error');
  }
}

async function deleteUser(userId) {
  const t = window.i18Obj?.[currentLang] || {};
  const user = allUsers.find(u => u.id === userId);
  if (!user) return;
  
  if (user.role === 'admin') {
    showNotification(t['admin-cannot-delete-admin'] || 'Cannot delete administrator users', 'error');
    return;
  }
  
  const confirmMessage = t['admin-confirm-delete'] 
    ? `${t['admin-confirm-delete']} ${user.nickname}?`
    : `Are you sure you want to delete user ${user.nickname}? This action cannot be undone.`;
  
  if (!confirm(confirmMessage)) {
    return;
  }
  
  try {
    const userOrders = allOrders.filter(order => order.userId == userId);
    if (userOrders.length > 0) {
      const orderConfirm = t['admin-delete-user-confirm'] 
        || 'This user has order history. Deleting them will also delete their orders. Continue?';
      
      if (!confirm(orderConfirm)) {
        return;
      }
    }
    
    const userFeedback = allFeedback.filter(f => f.userId == userId);
    for (const feedback of userFeedback) {
      await fetchData(`${ADMIN_FEEDBACK_ENDPOINT}/${feedback.id}`, {
        method: 'DELETE'
      });
    }
    
    for (const order of userOrders) {
      await fetchData(`${ADMIN_ORDERS_ENDPOINT}/${order.id}`, {
        method: 'DELETE'
      });
    }
    
    await fetchData(`${ADMIN_USERS_ENDPOINT}/${userId}`, {
      method: 'DELETE'
    });
    
    showNotification(t['admin-user-deleted'] || 'User deleted successfully', 'success');
    
    await loadAllData();
    
  } catch (error) {
    console.error('Error deleting user:', error);
    showNotification(t['admin-delete-error'] || 'Failed to delete user', 'error');
  }
}

function populateServiceFilter(selectElement) {
  if (!selectElement) return;
  
  while (selectElement.options.length > 1) {
    selectElement.remove(1);
  }
  
  const t = window.i18Obj?.[currentLang] || {};
  
  allServices.forEach(service => {
    const option = document.createElement('option');
    option.value = service.id;
    const categoryKey = `admin-category-${service.category?.toLowerCase().replace(/\s+/g, '-')}`;
    const categoryName = t[categoryKey] || service.category;
    option.textContent = `${service.name} (${categoryName})`;
    selectElement.appendChild(option);
  });
}

function populateUserFilter(selectElement) {
  if (!selectElement) return;
  
  while (selectElement.options.length > 1) {
    selectElement.remove(1);
  }
  
  allUsers.forEach(user => {
    const option = document.createElement('option');
    option.value = user.id;
    option.textContent = user.nickname;
    selectElement.appendChild(option);
  });
}

function formatDate(dateString) {
  if (!dateString) return window.i18Obj?.[currentLang]?.['admin-no-data'] || 'Unknown';
  
  try {
    const date = new Date(dateString);
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    };
    
    return date.toLocaleDateString(currentLang === 'ru' ? 'ru-RU' : 'en-US', options);
  } catch (error) {
    return window.i18Obj?.[currentLang]?.['admin-no-data'] || 'Invalid date';
  }
}

async function fetchData(url, options = {}) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
}

function showNotification(message, type = 'info') {
  const t = window.i18Obj?.[currentLang] || {};
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

window.changeUserRole = changeUserRole;
window.deleteUser = deleteUser;