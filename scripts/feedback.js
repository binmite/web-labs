const FEEDBACK_API_BASE = 'http://localhost:3000';
const FEEDBACK_SERVICES_ENDPOINT = `${FEEDBACK_API_BASE}/services`;
const FEEDBACK_FEEDBACK_ENDPOINT = `${FEEDBACK_API_BASE}/feedback`;
const FEEDBACK_ORDERS_ENDPOINT = `${FEEDBACK_API_BASE}/orders`;

let allServices = [];
let userOrders = [];
let allFeedback = [];

document.addEventListener('DOMContentLoaded', initFeedback);

async function initFeedback() {
  console.log('Initializing feedback...');
  
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
    showNotification('Failed to load data', 'error');
  }
}

async function loadFeedback() {
  try {
    allFeedback = await fetchData(FEEDBACK_FEEDBACK_ENDPOINT) || [];
    console.log('Loaded feedback:', allFeedback.length, 'items');
  } catch (error) {
    console.error('Error loading feedback:', error);
  }
}

function updateServiceSelect() {
  const serviceSelect = document.getElementById('serviceSelect');
  const filterServiceSelect = document.getElementById('filterService');
  
  if (!serviceSelect || !filterServiceSelect) return;
  
  serviceSelect.innerHTML = '';
  filterServiceSelect.innerHTML = '<option value="all">All Services</option>';
  
  const purchasedServiceIds = new Set(
    userOrders.flatMap(order => order.items.map(item => item.serviceId))
  );
  
  const availableServices = allServices.filter(service => 
    purchasedServiceIds.has(service.id)
  );
  
  if (availableServices.length === 0) {
    serviceSelect.innerHTML = '<option value="">No purchased services</option>';
    serviceSelect.disabled = true;
    return;
  }
  
  serviceSelect.innerHTML = '<option value="">Select a service</option>';
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
    serviceHint.innerHTML = '<i class="fas fa-info-circle"></i> Please sign in to leave feedback';
    return;
  }
  
  if (currentUser.role === 'admin') {
    submitBtn.disabled = true;
    serviceSelect.disabled = true;
    serviceHint.innerHTML = '<i class="fas fa-info-circle"></i> Administrators cannot leave feedback';
    return;
  }
  
  const hasPurchasedServices = userOrders.length > 0;
  
  if (!hasPurchasedServices) {
    submitBtn.disabled = true;
    serviceSelect.disabled = true;
    serviceHint.innerHTML = '<i class="fas fa-info-circle"></i> You need to purchase a service first';
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
      const ratingText = document.getElementById('ratingText');
      const value = star.value;
      const texts = {
        '1': 'Poor',
        '2': 'Fair',
        '3': 'Good',
        '4': 'Very Good',
        '5': 'Excellent'
      };
      ratingText.textContent = texts[value] || 'Select your rating';
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

function validateForm() {
  const serviceSelect = document.getElementById('serviceSelect');
  const rating = document.querySelector('input[name="rating"]:checked');
  const title = document.getElementById('feedbackTitle').value.trim();
  const text = document.getElementById('feedbackText').value.trim();
  const submitBtn = document.getElementById('submitFeedback');
  
  let isValid = true;
  
  if (!serviceSelect.value) {
    document.getElementById('serviceError').textContent = 'Please select a service';
    isValid = false;
  } else {
    document.getElementById('serviceError').textContent = '';
  }
  
  if (!rating) {
    document.getElementById('ratingError').textContent = 'Please select a rating';
    isValid = false;
  } else {
    document.getElementById('ratingError').textContent = '';
  }
  
  if (!title) {
    document.getElementById('titleError').textContent = 'Title is required';
    isValid = false;
  } else if (title.length < 5) {
    document.getElementById('titleError').textContent = 'Title must be at least 5 characters';
    isValid = false;
  } else {
    document.getElementById('titleError').textContent = '';
  }
  
  if (!text) {
    document.getElementById('textError').textContent = 'Review text is required';
    isValid = false;
  } else if (text.length < 50) {
    document.getElementById('textError').textContent = 'Review must be at least 50 characters';
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
    showNotification('Please fix all errors before submitting', 'error');
    return;
  }
  
  const currentUser = window.authService?.getCurrentUser();
  
  if (!currentUser) {
    showNotification('Please sign in to leave feedback', 'error');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
    return;
  }
  
  if (currentUser.role === 'admin') {
    showNotification('Administrators cannot leave feedback', 'error');
    return;
  }
  
  const submitBtn = document.getElementById('submitFeedback');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
  
  try {
    const feedbackData = {
      userId: currentUser.id,
      userName: currentUser.nickname,
      userRole: currentUser.role,
      serviceId: parseInt(document.getElementById('serviceSelect').value),
      serviceName: allServices.find(s => s.id === parseInt(document.getElementById('serviceSelect').value))?.name || '',
      rating: parseInt(document.querySelector('input[name="rating"]:checked').value),
      title: document.getElementById('feedbackTitle').value.trim(),
      text: document.getElementById('feedbackText').value.trim(),
      isAnonymous: document.getElementById('anonymous').checked,
      createdAt: new Date().toISOString(),
      helpfulCount: 0,
      reported: false
    };
    
    const newFeedback = await fetchData(FEEDBACK_FEEDBACK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(feedbackData)
    });
    
    if (newFeedback) {
      showNotification('Thank you for your feedback!', 'success');
      
      document.getElementById('feedbackForm').reset();
      
      await loadFeedback();
      updateFeedbackStats();
      renderFeedback();
      validateForm();
    }
    
  } catch (error) {
    console.error('Error submitting feedback:', error);
    showNotification('Failed to submit feedback. Please try again.', 'error');
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
    const displayName = feedback.isAnonymous ? 'Anonymous User' : feedback.userName;
    const userRole = feedback.isAnonymous ? 'Customer' : feedback.userRole;
    
    return `
      <div class="feedback-item">
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
            <div class="feedback-service">${service?.name || 'Unknown Service'}</div>
            <div class="feedback-date">${formatDate(feedback.createdAt)}</div>
          </div>
        </div>
        
        <div class="feedback-title">${feedback.title}</div>
        <div class="feedback-rating">
          ${'★'.repeat(feedback.rating)}${'☆'.repeat(5 - feedback.rating)}
        </div>
        <div class="feedback-text">${feedback.text}</div>
        
        <div class="feedback-actions">
          <div class="feedback-helpful">
            <button class="helpful-btn" data-feedback-id="${feedback.id}">
              <i class="fas fa-thumbs-up"></i> Helpful
            </button>
            <span class="helpful-count">(${feedback.helpfulCount || 0})</span>
          </div>
          ${window.authService?.isAdmin() ? `
            <button class="feedback-report delete-feedback" data-feedback-id="${feedback.id}">
              <i class="fas fa-trash"></i> Delete
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
        showNotification('Please sign in to mark as helpful', 'error');
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
    
    showNotification('Marked as helpful!', 'success');
    await loadFeedback();
    renderFeedback();
    
  } catch (error) {
    console.error('Error marking as helpful:', error);
    showNotification('Failed to update', 'error');
  }
}

async function deleteFeedback(feedbackId) {
  if (!confirm('Are you sure you want to delete this feedback?')) return;
  
  try {
    await fetchData(`${FEEDBACK_FEEDBACK_ENDPOINT}/${feedbackId}`, {
      method: 'DELETE'
    });
    
    showNotification('Feedback deleted', 'success');
    await loadFeedback();
    updateFeedbackStats();
    renderFeedback();
    
  } catch (error) {
    console.error('Error deleting feedback:', error);
    showNotification('Failed to delete feedback', 'error');
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
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