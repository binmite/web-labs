const CATALOG_API_BASE = 'http://localhost:3000';
const CATALOG_SERVICES_ENDPOINT = `${CATALOG_API_BASE}/services`;
const CATALOG_FAVORITES_ENDPOINT = `${CATALOG_API_BASE}/favorites`;
const CATALOG_CART_ENDPOINT = `${CATALOG_API_BASE}/cart`;

let currentServices = [];
let favorites = [];
let cartItems = [];
let categories = [];
let currentPage = 1;
let itemsPerPage = 9;
let totalItems = 0;
let currentCategory = 'all';
let currentSort = 'default';
let currentSearch = '';
let minPrice = null;
let maxPrice = null;
let minRating = 0;

const servicesGrid = document.getElementById('servicesGrid');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');
const sortSelect = document.getElementById('sortSelect');
const categoryFilters = document.getElementById('categoryFilters');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const currentPageEl = document.getElementById('currentPage');
const totalPagesEl = document.getElementById('totalPages');
const showingCountEl = document.getElementById('showingCount');
const totalCountEl = document.getElementById('totalCount');
const itemsPerPageSelect = document.getElementById('itemsPerPage');
const toggleAdvancedFiltersBtn = document.getElementById('toggleAdvancedFilters');
const advancedFiltersPanel = document.getElementById('advancedFiltersPanel');
const minPriceInput = document.getElementById('minPrice');
const maxPriceInput = document.getElementById('maxPrice');
const minRatingSelect = document.getElementById('minRatingSelect');
const applyAdvancedFiltersBtn = document.getElementById('applyAdvancedFilters');
const resetFiltersBtn = document.getElementById('resetFilters');
const resetAllFiltersBtn = document.getElementById('resetAllFilters');
const noResults = document.getElementById('noResults');
const favoritesCount = document.getElementById('favoritesCount');
const cartCount = document.getElementById('cartCount');

async function fetchData(url, options = {}) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    showNotification('Failed to load data. Please try again.', 'error');
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

async function fetchServices() {
  try {
    servicesGrid.innerHTML = `
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading services...</p>
      </div>
    `;

    const allServices = await fetchData(CATALOG_SERVICES_ENDPOINT);
    if (!allServices) return;

    let filteredServices = [...allServices];

    if (currentCategory !== 'all') {
      filteredServices = filteredServices.filter(service => 
        service.category === currentCategory
      );
    }

    if (currentSearch) {
      const searchTerm = currentSearch.toLowerCase().trim();
      filteredServices = filteredServices.filter(service =>
        service.name.toLowerCase().includes(searchTerm) ||
        service.description.toLowerCase().includes(searchTerm) ||
        service.category.toLowerCase().includes(searchTerm)
      );
    }

    if (minPrice !== null) {
      filteredServices = filteredServices.filter(service => 
        service.price >= minPrice
      );
    }
    if (maxPrice !== null) {
      filteredServices = filteredServices.filter(service => 
        service.price <= maxPrice
      );
    }

    if (minRating > 0) {
      filteredServices = filteredServices.filter(service => 
        service.rating >= minRating
      );
    }

    if (currentSort !== 'default') {
      filteredServices.sort((a, b) => {
        switch (currentSort) {
          case 'name_asc':
            return a.name.localeCompare(b.name);
          case 'name_desc':
            return b.name.localeCompare(a.name);
          case 'price_asc':
            return a.price - b.price;
          case 'price_desc':
            return b.price - a.price;
          case 'rating_desc':
            return b.rating - a.rating;
          default:
            return 0;
        }
      });
    }

    totalItems = filteredServices.length;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    currentServices = filteredServices.slice(startIndex, endIndex);

    renderServices();
    updatePagination();
    updateCounts();

  } catch (error) {
    console.error('Error in fetchServices:', error);
  }
}

async function fetchFavorites() {
  try {
    const currentUser = window.authService?.getCurrentUser();
    if (!currentUser) {
      favorites = [];
      updateFavoriteButtons();
      return;
    }
    
    const allFavorites = await fetchData(CATALOG_FAVORITES_ENDPOINT) || [];
    favorites = allFavorites.filter(fav => fav.userId === currentUser.id);
    console.log('Loaded favorites:', favorites);
    updateFavoriteButtons();
  } catch (error) {
    console.error('Error fetching favorites:', error);
    favorites = [];
  }
}

async function fetchCart() {
  try {
    const currentUser = window.authService?.getCurrentUser();
    if (!currentUser) {
      cartItems = [];
      updateCartButtons();
      return;
    }
    
    const allCartItems = await fetchData(CATALOG_CART_ENDPOINT) || [];
    cartItems = allCartItems.filter(item => item.userId === currentUser.id);
    console.log('Loaded cart items:', cartItems);
    updateCartButtons();
  } catch (error) {
    console.error('Error fetching cart:', error);
    cartItems = [];
  }
}

async function fetchCategories() {
  try {
    const data = await fetchData(CATALOG_SERVICES_ENDPOINT);
    if (data) {
      categories = ['all', ...new Set(data.map(service => service.category))];
      renderCategoryFilters();
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
  }
}

async function toggleFavorite(service) {
  try {
    const currentUser = window.authService?.getCurrentUser();
    if (!currentUser) {
      showNotification('Please sign in to add to favorites', 'error');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);
      return;
    }
    
    const existingFavorite = favorites.find(fav => 
      fav.serviceId === service.id.toString() && fav.userId === currentUser.id
    );
    
    if (existingFavorite) {
      await fetchData(`${CATALOG_FAVORITES_ENDPOINT}/${existingFavorite.id}`, {
        method: 'DELETE'
      });
      showNotification('Removed from favorites', 'info');
    } else {
      const favoriteItem = {
        serviceId: service.id.toString(), 
        name: service.name,
        category: service.category,
        price: service.price,
        rating: service.rating,
        description: service.description,
        image: service.image,
        userId: currentUser.id,
        addedAt: new Date().toISOString()
      };
      
      await fetchData(CATALOG_FAVORITES_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(favoriteItem)
      });
      showNotification('Added to favorites!', 'success');
    }
    
    await fetchFavorites();
    updateCounts();
  } catch (error) {
    console.error('Error toggling favorite:', error);
    showNotification('Failed to update favorites', 'error');
  }
}

async function addToCart(service) {
  try {
    const currentUser = window.authService?.getCurrentUser();
    if (!currentUser) {
      showNotification('Please sign in to add to cart', 'error');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);
      return;
    }
    
    const existingCartItem = cartItems.find(item => 
      item.serviceId === service.id.toString() && item.userId === currentUser.id
    );
    
    if (existingCartItem) {
      await fetchData(`${CATALOG_CART_ENDPOINT}/${existingCartItem.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quantity: existingCartItem.quantity + 1
        })
      });
    } else {
      const cartItem = {
        serviceId: service.id.toString(), 
        name: service.name,
        category: service.category,
        price: service.price,
        rating: service.rating,
        description: service.description,
        image: service.image,
        quantity: 1,
        userId: currentUser.id,
        addedAt: new Date().toISOString()
      };
      
      await fetchData(CATALOG_CART_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cartItem)
      });
    }
    
    await fetchCart();
    updateCounts();
    showNotification('Added to cart!', 'success');
  } catch (error) {
    console.error('Error adding to cart:', error);
    showNotification('Failed to add to cart', 'error');
  }
}

function renderServices() {
  if (!currentServices || currentServices.length === 0) {
    if (servicesGrid) servicesGrid.style.display = 'none';
    if (noResults) noResults.style.display = 'block';
    return;
  }
  
  if (servicesGrid) servicesGrid.style.display = 'grid';
  if (noResults) noResults.style.display = 'none';
  
  const currentUser = window.authService?.getCurrentUser();
  
  servicesGrid.innerHTML = currentServices.map(service => {
    const isFavorite = currentUser ? 
      favorites.some(fav => fav.serviceId === service.id && fav.userId === currentUser.id) : 
      false;
    
    const inCart = currentUser ? 
      cartItems.find(item => item.serviceId === service.id && item.userId === currentUser.id) : 
      null;
    
    return `
      <div class="service-card" data-service-id="${service.id}">
        <div class="service-image" style="background-image: url('${service.image}')">
          <div class="service-actions">
            <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                    data-service-id="${service.id}"
                    aria-label="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
              <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
            </button>
          </div>
        </div>
        <div class="service-content">
          <div class="service-category">${service.category}</div>
          <h3 class="service-title">${service.name}</h3>
          <p class="service-description">${service.description}</p>
          <div class="service-meta">
            <div class="service-price">$${service.price}</div>
            <div class="service-rating">
              ${'★'.repeat(Math.floor(service.rating))}
              ${service.rating % 1 >= 0.5 ? '½' : ''}
              <span class="rating-value">${service.rating.toFixed(1)}</span>
            </div>
          </div>
          <div class="service-buttons">
            <button class="btn-cart ${inCart ? 'in-cart' : ''}" 
                    data-service-id="${service.id}">
              <i class="fas fa-shopping-cart"></i>
              ${inCart ? `In Cart (${inCart.quantity})` : 'Add to Cart'}
            </button>
            <button class="btn-details" data-service-id="${service.id}">
              <i class="fas fa-info-circle"></i> Details
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  attachServiceEventListeners();
}

function renderCategoryFilters() {
  if (!categoryFilters) return;
  
  categoryFilters.innerHTML = categories.map(category => {
    const displayName = category === 'all' ? 'All Categories' : 
                       category.charAt(0).toUpperCase() + category.slice(1);
    return `
      <button class="category-btn ${category === currentCategory ? 'active' : ''}" 
              data-category="${category}">
        ${displayName}
      </button>
    `;
  }).join('');
}

function updatePagination() {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  if (currentPageEl) currentPageEl.textContent = currentPage;
  if (totalPagesEl) totalPagesEl.textContent = totalPages;
  if (showingCountEl) showingCountEl.textContent = currentServices.length;
  if (totalCountEl) totalCountEl.textContent = totalItems;
  
  if (prevPageBtn) prevPageBtn.disabled = currentPage <= 1;
  if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages;
  
  const paginationInfo = document.querySelector('.pagination-info');
  if (paginationInfo) {
    paginationInfo.style.display = totalPages <= 1 ? 'none' : 'flex';
  }
}

function updateFavoriteButtons() {
  const currentUser = window.authService?.getCurrentUser();
  
  document.querySelectorAll('.favorite-btn').forEach(btn => {
    const serviceId = btn.dataset.serviceId; 
    const isFavorite = currentUser ? 
      favorites.some(fav => fav.serviceId === serviceId && fav.userId === currentUser.id) : 
      false;
    
    btn.classList.toggle('active', isFavorite);
    btn.innerHTML = `<i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>`;
  });
}

function updateCartButtons() {
  const currentUser = window.authService?.getCurrentUser();
  
  document.querySelectorAll('.btn-cart').forEach(btn => {
    const serviceId = btn.dataset.serviceId; 
    const cartItem = currentUser ? 
      cartItems.find(item => item.serviceId === serviceId && item.userId === currentUser.id) : 
      null;
    
    if (cartItem) {
      btn.classList.add('in-cart');
      btn.innerHTML = `<i class="fas fa-shopping-cart"></i> In Cart (${cartItem.quantity})`;
    } else {
      btn.classList.remove('in-cart');
      btn.innerHTML = `<i class="fas fa-shopping-cart"></i> Add to Cart`;
    }
  });
}

function updateCounts() {
  const currentUser = window.authService?.getCurrentUser();
  
  if (favoritesCount) {
    if (currentUser) {
      const userFavorites = favorites.filter(fav => fav.userId === currentUser.id);
      favoritesCount.textContent = userFavorites.length;
    } else {
      favoritesCount.textContent = 0;
    }
  }
  
  if (cartCount) {
    if (currentUser) {
      const userCartItems = cartItems.filter(item => item.userId === currentUser.id);
      cartCount.textContent = userCartItems.reduce((sum, item) => sum + item.quantity, 0);
    } else {
      cartCount.textContent = 0;
    }
  }
}

function attachServiceEventListeners() {
  document.querySelectorAll('.favorite-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const serviceId = btn.dataset.serviceId; 
      const service = currentServices.find(s => s.id.toString() === serviceId);
      
      if (service) {
        await toggleFavorite(service);
      }
    });
  });
  
  document.querySelectorAll('.btn-cart').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const serviceId = btn.dataset.serviceId; 
      const service = currentServices.find(s => s.id.toString() === serviceId);
      
      if (service) {
        await addToCart(service);
      }
    });
  });
  
  document.querySelectorAll('.btn-details').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const serviceId = btn.dataset.serviceId;
      showNotification(`Details for service #${serviceId}`, 'info');
    });
  });
}

async function init() {
  console.log('Initializing catalog...');
  
  if (!window.authService) {
    console.warn('Auth service not available, retrying in 500ms...');
    setTimeout(init, 500);
    return;
  }
  
  await fetchCategories();
  await fetchServices();
  
  const onAuthChange = async (user) => {
    console.log('Auth changed in catalog, user:', user?.nickname || 'none');
    await Promise.all([
      fetchFavorites(),
      fetchCart()
    ]);
    renderServices();
    updateCounts();
  };
  
  window.authService.onAuthChange(onAuthChange);
  
  if (window.authService.initialized) {
    await onAuthChange(window.authService.getCurrentUser());
  }
  
  let searchTimeout;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentSearch = e.target.value.trim();
        currentPage = 1;
        fetchServices();
      }, 500);
    });
  }
  
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      currentSearch = '';
      currentPage = 1;
      fetchServices();
    });
  }
  
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      currentPage = 1;
      fetchServices();
    });
  }
  
  if (categoryFilters) {
    categoryFilters.addEventListener('click', (e) => {
      if (e.target.classList.contains('category-btn')) {
        currentCategory = e.target.dataset.category;
        currentPage = 1;
        
        document.querySelectorAll('.category-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        e.target.classList.add('active');
        
        fetchServices();
      }
    });
  }
  
  if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        fetchServices();
      }
    });
  }
  
  if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        fetchServices();
      }
    });
  }
  
  if (itemsPerPageSelect) {
    itemsPerPageSelect.addEventListener('change', (e) => {
      itemsPerPage = parseInt(e.target.value);
      currentPage = 1;
      fetchServices();
    });
  }
  
  if (toggleAdvancedFiltersBtn) {
    toggleAdvancedFiltersBtn.addEventListener('click', () => {
      if (advancedFiltersPanel) {
        advancedFiltersPanel.classList.toggle('show');
      }
    });
  }
  
  if (applyAdvancedFiltersBtn) {
    applyAdvancedFiltersBtn.addEventListener('click', () => {
      minPrice = minPriceInput?.value ? parseInt(minPriceInput.value) : null;
      maxPrice = maxPriceInput?.value ? parseInt(maxPriceInput.value) : null;
      minRating = minRatingSelect?.value ? parseFloat(minRatingSelect.value) : 0;
      currentPage = 1;
      fetchServices();
    });
  }
  
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      if (minPriceInput) minPriceInput.value = '';
      if (maxPriceInput) maxPriceInput.value = '';
      if (minRatingSelect) minRatingSelect.value = '0';
      minPrice = null;
      maxPrice = null;
      minRating = 0;
      currentPage = 1;
      fetchServices();
    });
  }
  
  if (resetAllFiltersBtn) {
    resetAllFiltersBtn.addEventListener('click', () => {
      currentCategory = 'all';
      currentSort = 'default';
      currentSearch = '';
      minPrice = null;
      maxPrice = null;
      minRating = 0;
      currentPage = 1;
      
      if (searchInput) searchInput.value = '';
      if (sortSelect) sortSelect.value = 'default';
      if (minPriceInput) minPriceInput.value = '';
      if (maxPriceInput) maxPriceInput.value = '';
      if (minRatingSelect) minRatingSelect.value = '0';
      
      document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === 'all') {
          btn.classList.add('active');
        }
      });
      
      fetchServices();
    });
  }
  
  console.log('Catalog initialized successfully');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}