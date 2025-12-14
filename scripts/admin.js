const ADMIN_API_BASE = 'http://localhost:3000';
const ADMIN_SERVICES_ENDPOINT = `${ADMIN_API_BASE}/services`;
const ADMIN_FEEDBACK_ENDPOINT = `${ADMIN_API_BASE}/feedback`;
const ADMIN_ORDERS_ENDPOINT = `${ADMIN_API_BASE}/orders`;
const ADMIN_USERS_ENDPOINT = `${ADMIN_API_BASE}/users`;

let allServices = [];
let allFeedback = [];
let allOrders = [];
let allUsers = [];

document.addEventListener('DOMContentLoaded', initAdmin);

async function initAdmin() {
  console.log('Initializing admin panel...');
  
  await checkAdminAccess();
  const currentUser = window.authService?.getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') return;
  
  await loadAllData();
  setupEventListeners();
  
  console.log('Admin panel initialized');
}

async function checkAdminAccess() {
  try {
    const currentUser = window.authService?.getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'admin') {
      console.warn('Access denied: User is not admin');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking admin access:', error);
    return false;
  }
}

async function loadAllData() {
  try {
    [allServices, allFeedback, allOrders, allUsers] = await Promise.all([
      fetchData(ADMIN_SERVICES_ENDPOINT) || [],
      fetchData(ADMIN_FEEDBACK_ENDPOINT) || [],
      fetchData(ADMIN_ORDERS_ENDPOINT) || [],
      fetchData(ADMIN_USERS_ENDPOINT) || []
    ]);
    
    updateStats();
    
    renderServices();
    
  } catch (error) {
    console.error('Error loading admin data:', error);
    showNotification('Failed to load data', 'error');
  }
}

function updateStats() {
  document.getElementById('totalServices').textContent = allServices.length;
  document.getElementById('totalOrders').textContent = allOrders.length;
  document.getElementById('totalFeedback').textContent = allFeedback.length;
  document.getElementById('totalUsers').textContent = allUsers.length;
}

function setupEventListeners() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });
  
  const addServiceBtn = document.getElementById('addServiceBtn');
  const searchServices = document.getElementById('searchServices');
  const serviceModal = document.getElementById('serviceModal');
  const cancelServiceBtn = document.getElementById('cancelService');
  const saveServiceBtn = document.getElementById('saveService');
  const closeModalBtns = document.querySelectorAll('.close-modal');
  
  if (addServiceBtn) {
    addServiceBtn.addEventListener('click', () => {
      openServiceModal();
    });
  }
  
  if (searchServices) {
    searchServices.addEventListener('input', () => {
      renderServices();
    });
  }
  
  if (cancelServiceBtn) {
    cancelServiceBtn.addEventListener('click', () => {
      serviceModal.classList.remove('show');
    });
  }
  
  if (saveServiceBtn) {
    saveServiceBtn.addEventListener('click', handleSaveService);
  }
  
  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
      });
    });
  });
  
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.classList.remove('show');
    }
  });
  
  const filterFeedbackService = document.getElementById('filterFeedbackService');
  const filterFeedbackRating = document.getElementById('filterFeedbackRating');
  
  if (filterFeedbackService) {
    filterFeedbackService.addEventListener('change', renderFeedback);
    populateServiceFilter(filterFeedbackService);
  }
  
  if (filterFeedbackRating) {
    filterFeedbackRating.addEventListener('change', renderFeedback);
  }
  
  const filterOrderStatus = document.getElementById('filterOrderStatus');
  const filterOrderDate = document.getElementById('filterOrderDate');
  
  if (filterOrderStatus) {
    filterOrderStatus.addEventListener('change', renderOrders);
  }
  
  if (filterOrderDate) {
    filterOrderDate.addEventListener('change', renderOrders);
  }
  
  const filterUserRole = document.getElementById('filterUserRole');
  
  if (filterUserRole) {
    filterUserRole.addEventListener('change', renderUsers);
  }
  
  const descriptionInput = document.getElementById('serviceDescription');
  if (descriptionInput) {
    descriptionInput.addEventListener('input', () => {
      const counter = document.getElementById('descriptionCounter');
      counter.textContent = descriptionInput.value.length;
    });
  }
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `${tabName}Tab`);
  });
  
  switch (tabName) {
    case 'services':
      renderServices();
      break;
    case 'feedback':
      renderFeedback();
      break;
    case 'orders':
      renderOrders();
      break;
    case 'users':
      renderUsers();
      break;
  }
}

function renderServices() {
  const servicesList = document.getElementById('servicesList');
  const searchTerm = document.getElementById('searchServices')?.value.toLowerCase() || '';
  
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
        <h3>No services found</h3>
        <p>Try adjusting your search criteria</p>
      </div>
    `;
    return;
  }
  
  servicesList.innerHTML = filteredServices.map(service => `
    <div class="admin-card">
      <div class="card-header">
        <h3 class="card-title">${service.name}</h3>
        <div class="card-actions">
          <button class="action-btn edit" data-service-id="${service.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn delete" data-service-id="${service.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="card-content">
        <p>${service.description}</p>
        <div class="service-meta">
          <span><strong>Category:</strong> ${service.category}</span>
          <span><strong>Price:</strong> $${service.price}</span>
          <span><strong>Rating:</strong> ${service.rating} ★</span>
        </div>
      </div>
      <div class="card-meta">
        <span>ID: ${service.id}</span>
        <span>Added: ${formatDate(service.createdAt)}</span>
      </div>
    </div>
  `).join('');
  
  attachServiceEventListeners();
}

function attachServiceEventListeners() {
  document.querySelectorAll('.action-btn.edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const serviceId = btn.dataset.serviceId;
      openServiceModal(serviceId);
    });
  });
  
  document.querySelectorAll('.action-btn.delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const serviceId = btn.dataset.serviceId;
      await deleteService(serviceId);
    });
  });
}

function openServiceModal(serviceId = null) {
  const modal = document.getElementById('serviceModal');
  const modalTitle = document.getElementById('modalTitle');
  const form = document.getElementById('serviceForm');
  
  if (serviceId) {
    const service = allServices.find(s => s.id == serviceId);
    if (!service) return;
    
    modalTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Service';
    document.getElementById('serviceId').value = service.id;
    document.getElementById('serviceName').value = service.name;
    document.getElementById('serviceCategory').value = service.category;
    document.getElementById('servicePrice').value = service.price;
    document.getElementById('serviceRating').value = service.rating;
    document.getElementById('serviceDescription').value = service.description;
    document.getElementById('serviceImage').value = service.image;
    
  } else {
    modalTitle.innerHTML = '<i class="fas fa-plus"></i> Add New Service';
    form.reset();
    document.getElementById('serviceId').value = '';
  }
  
  const descriptionInput = document.getElementById('serviceDescription');
  const counter = document.getElementById('descriptionCounter');
  if (descriptionInput && counter) {
    counter.textContent = descriptionInput.value.length;
  }
  
  modal.classList.add('show');
}

async function handleSaveService(e) {
  e.preventDefault();
  
  const form = document.getElementById('serviceForm');
  const serviceId = document.getElementById('serviceId').value;
  const isEdit = !!serviceId;
  
  const name = document.getElementById('serviceName').value.trim();
  const category = document.getElementById('serviceCategory').value;
  const price = parseFloat(document.getElementById('servicePrice').value);
  const rating = parseFloat(document.getElementById('serviceRating').value);
  const description = document.getElementById('serviceDescription').value.trim();
  const image = document.getElementById('serviceImage').value.trim();
  
  if (!name || !category || isNaN(price) || isNaN(rating) || !description || !image) {
    showNotification('Please fill in all fields correctly', 'error');
    return;
  }
  
  if (price < 0) {
    showNotification('Price cannot be negative', 'error');
    return;
  }
  
  if (rating < 0 || rating > 5) {
    showNotification('Rating must be between 0 and 5', 'error');
    return;
  }
  
  const saveBtn = document.getElementById('saveService');
  const originalText = saveBtn.innerHTML;
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  
  try {
    const serviceData = {
      name,
      category,
      price,
      rating,
      description,
      image
    };
    
    let result;
    if (isEdit) {
      result = await fetchData(`${ADMIN_SERVICES_ENDPOINT}/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(serviceData)
      });
    } else {
      result = await fetchData(ADMIN_SERVICES_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(serviceData)
      });
    }
    
    if (result) {
      showNotification(`Service ${isEdit ? 'updated' : 'added'} successfully!`, 'success');
      
      document.getElementById('serviceModal').classList.remove('show');
      
      await loadAllData();
      renderServices();
    }
    
  } catch (error) {
    console.error('Error saving service:', error);
    showNotification(`Failed to ${isEdit ? 'update' : 'add'} service`, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalText;
  }
}

async function deleteService(serviceId) {
  if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
    return;
  }
  
  try {
    const hasFeedback = allFeedback.some(f => f.serviceId == serviceId);
    if (hasFeedback) {
      if (!confirm('This service has customer feedback. Deleting it will also delete associated feedback. Continue?')) {
        return;
      }
    }
    
    await fetchData(`${ADMIN_SERVICES_ENDPOINT}/${serviceId}`, {
      method: 'DELETE'
    });
    
    showNotification('Service deleted successfully', 'success');
    
    await loadAllData();
    renderServices();
    
  } catch (error) {
    console.error('Error deleting service:', error);
    showNotification('Failed to delete service', 'error');
  }
}

function renderFeedback() {
  const feedbackList = document.getElementById('feedbackListAdmin');
  const serviceFilter = document.getElementById('filterFeedbackService')?.value;
  const ratingFilter = document.getElementById('filterFeedbackRating')?.value;
  
  if (!feedbackList) return;
  
  let filteredFeedback = allFeedback;
  
  if (serviceFilter && serviceFilter !== 'all') {
    filteredFeedback = filteredFeedback.filter(f => f.serviceId == serviceFilter);
  }
  
  if (ratingFilter && ratingFilter !== 'all') {
    filteredFeedback = filteredFeedback.filter(f => f.rating == ratingFilter);
  }
  
  if (filteredFeedback.length === 0) {
    feedbackList.innerHTML = `
      <div class="no-results">
        <i class="fas fa-comment-slash fa-3x"></i>
        <h3>No feedback found</h3>
        <p>Try adjusting your filters</p>
      </div>
    `;
    return;
  }
  
  feedbackList.innerHTML = filteredFeedback.map(feedback => {
    const service = allServices.find(s => s.id === feedback.serviceId);
    const user = allUsers.find(u => u.id === feedback.userId);
    
    return `
      <div class="admin-card">
        <div class="card-header">
          <h3 class="card-title">${feedback.title}</h3>
          <div class="card-actions">
            <button class="action-btn delete" data-feedback-id="${feedback.id}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="card-content">
          <div class="feedback-meta">
            <span><strong>Service:</strong> ${service?.name || 'Unknown'}</span>
            <span><strong>User:</strong> ${feedback.isAnonymous ? 'Anonymous' : user?.nickname || 'Unknown'}</span>
            <span><strong>Rating:</strong> ${'★'.repeat(feedback.rating)}</span>
          </div>
          <p class="feedback-text">${feedback.text}</p>
          <div class="feedback-stats">
            <span><i class="fas fa-thumbs-up"></i> ${feedback.helpfulCount || 0} helpful</span>
          </div>
        </div>
        <div class="card-meta">
          <span>${formatDate(feedback.createdAt)}</span>
          <span>${feedback.reported ? '<i class="fas fa-flag text-red"></i> Reported' : ''}</span>
        </div>
      </div>
    `;
  }).join('');
  
  document.querySelectorAll('.action-btn.delete[data-feedback-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const feedbackId = btn.dataset.feedbackId;
      await deleteFeedback(feedbackId);
    });
  });
}

function renderOrders() {
  const ordersList = document.getElementById('ordersList');
  const statusFilter = document.getElementById('filterOrderStatus')?.value;
  const dateFilter = document.getElementById('filterOrderDate')?.value;
  
  if (!ordersList) return;
  
  let filteredOrders = allOrders;
  
  if (statusFilter && statusFilter !== 'all') {
    filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
  }
  
  if (dateFilter) {
    filteredOrders = filteredOrders.filter(order => 
      order.orderDate.startsWith(dateFilter)
    );
  }
  
  if (filteredOrders.length === 0) {
    ordersList.innerHTML = `
      <div class="no-results">
        <i class="fas fa-receipt fa-3x"></i>
        <h3>No orders found</h3>
        <p>Try adjusting your filters</p>
      </div>
    `;
    return;
  }
  
  ordersList.innerHTML = filteredOrders.map(order => {
    const user = allUsers.find(u => u.id === order.userId);
    
    return `
      <div class="admin-card">
        <div class="card-header">
          <h3 class="card-title">Order #${order.id}</h3>
          <div class="card-actions">
            <span class="order-status ${order.status}">${order.status}</span>
          </div>
        </div>
        <div class="card-content">
          <div class="order-meta">
            <span><strong>Customer:</strong> ${user?.nickname || order.userName}</span>
            <span><strong>Email:</strong> ${order.userEmail}</span>
            <span><strong>Items:</strong> ${order.items.length}</span>
          </div>
          <div class="order-items">
            ${order.items.map(item => `
              <div class="order-item">
                <span>${item.name}</span>
                <span>$${item.price} × ${item.quantity}</span>
              </div>
            `).join('')}
          </div>
          <div class="order-total">
            <span><strong>Total:</strong> $${order.total}</span>
            <span><strong>Date:</strong> ${formatDate(order.orderDate)}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderUsers() {
  const usersList = document.getElementById('usersList');
  const roleFilter = document.getElementById('filterUserRole')?.value;
  
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
        <h3>No users found</h3>
        <p>Try adjusting your filters</p>
      </div>
    `;
    return;
  }
  
  usersList.innerHTML = filteredUsers.map(user => {
    const userOrders = allOrders.filter(order => order.userId === user.id);
    const totalSpent = userOrders.reduce((sum, order) => sum + order.total, 0);
    
    return `
      <div class="admin-card">
        <div class="card-header">
          <h3 class="card-title">${user.nickname}</h3>
          <div class="card-actions">
            <span class="user-role ${user.role}">${user.role}</span>
          </div>
        </div>
        <div class="card-content">
          <div class="user-info">
            <p><strong>Name:</strong> ${user.firstName} ${user.lastName}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Phone:</strong> ${user.phone}</p>
            <p><strong>Joined:</strong> ${formatDate(user.createdAt)}</p>
          </div>
          <div class="user-stats">
            <span><i class="fas fa-shopping-cart"></i> ${userOrders.length} orders</span>
            <span><i class="fas fa-dollar-sign"></i> $${totalSpent.toFixed(2)} spent</span>
          </div>
        </div>
        <div class="card-actions">
          <button class="btn btn-secondary btn-sm" data-user-id="${user.id}" onclick="changeUserRole(${user.id})">
            Change Role
          </button>
          ${user.role !== 'admin' ? `
            <button class="btn btn-danger btn-sm" data-user-id="${user.id}" onclick="deleteUser(${user.id})">
              Delete
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function populateServiceFilter(selectElement) {
  if (!selectElement) return;
  
  while (selectElement.options.length > 1) {
    selectElement.remove(1);
  }
  
  allServices.forEach(service => {
    const option = document.createElement('option');
    option.value = service.id;
    option.textContent = service.name;
    selectElement.appendChild(option);
  });
}

async function deleteFeedback(feedbackId) {
  if (!confirm('Are you sure you want to delete this feedback?')) return;
  
  try {
    await fetchData(`${ADMIN_FEEDBACK_ENDPOINT}/${feedbackId}`, {
      method: 'DELETE'
    });
    
    showNotification('Feedback deleted successfully', 'success');
    
    await loadAllData();
    renderFeedback();
    
  } catch (error) {
    console.error('Error deleting feedback:', error);
    showNotification('Failed to delete feedback', 'error');
  }
}

async function changeUserRole(userId) {
  const user = allUsers.find(u => u.id == userId);
  if (!user) return;
  
  const newRole = user.role === 'admin' ? 'user' : 'admin';
  
  if (!confirm(`Change ${user.nickname}'s role to ${newRole}?`)) return;
  
  try {
    const updatedUser = {
      ...user,
      role: newRole
    };
    
    await fetchData(`${ADMIN_USERS_ENDPOINT}/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedUser)
    });
    
    showNotification(`User role changed to ${newRole}`, 'success');
    
    await loadAllData();
    renderUsers();
    
  } catch (error) {
    console.error('Error changing user role:', error);
    showNotification('Failed to change user role', 'error');
  }
}

async function deleteUser(userId) {
  const user = allUsers.find(u => u.id == userId);
  if (!user) return;
  
  if (user.role === 'admin') {
    showNotification('Cannot delete administrator users', 'error');
    return;
  }
  
  if (!confirm(`Are you sure you want to delete user ${user.nickname}? This action cannot be undone.`)) {
    return;
  }
  
  try {
    const userOrders = allOrders.filter(order => order.userId == userId);
    if (userOrders.length > 0) {
      if (!confirm('This user has order history. Deleting them will also delete their orders. Continue?')) {
        return;
      }
    }
    
    await fetchData(`${ADMIN_USERS_ENDPOINT}/${userId}`, {
      method: 'DELETE'
    });
    
    showNotification('User deleted successfully', 'success');
    
    await loadAllData();
    renderUsers();
    
  } catch (error) {
    console.error('Error deleting user:', error);
    showNotification('Failed to delete user', 'error');
  }
}

function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid date';
  }
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

window.changeUserRole = changeUserRole;
window.deleteUser = deleteUser;