const FAVORITES_API_BASE = 'http://localhost:3000';
const FAVORITES_FAVORITES_ENDPOINT = `${FAVORITES_API_BASE}/favorites`;
const FAVORITES_CART_ENDPOINT = `${FAVORITES_API_BASE}/cart`;

let favorites = [];
let cartItems = [];

const favoritesGrid = document.getElementById('favoritesGrid');
const emptyFavorites = document.getElementById('emptyFavorites');
const clearAllFavoritesBtn = document.getElementById('clearAllFavorites');
const favoritesCount = document.getElementById('favoritesCount');
const cartCount = document.getElementById('cartCount');

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

async function loadFavorites(user) {
  try {
    if (!user) {
      favorites = [];
      cartItems = [];
      renderFavorites();
      updateCounts();
      return;
    }
    
    console.log('Loading favorites for user:', user.id);
    
    const allFavorites = await fetchData(FAVORITES_FAVORITES_ENDPOINT) || [];
    favorites = allFavorites.filter(fav => fav.userId === user.id);
    console.log('Found favorites:', favorites.length);
    
    await loadCart(user);
    renderFavorites();
    updateCounts();
  } catch (error) {
    console.error('Error loading favorites:', error);
  }
}

async function loadCart(user) {
  if (!user) {
    cartItems = [];
    return;
  }
  
  const allCartItems = await fetchData(FAVORITES_CART_ENDPOINT) || [];
  cartItems = allCartItems.filter(item => item.userId === user.id);
}

async function removeFromFavorite(favoriteId) {
  try {
    console.log('Removing favorite with ID:', favoriteId);
    
    await fetchData(`${FAVORITES_FAVORITES_ENDPOINT}/${favoriteId}`, {
      method: 'DELETE'
    });
    
    favorites = favorites.filter(fav => fav.id !== favoriteId);
    renderFavorites();
    updateCounts();
    showNotification('Removed from favorites', 'info');
  } catch (error) {
    console.error('Error removing favorite:', error);
    showNotification('Failed to remove favorite', 'error');
  }
}

async function clearAllFavorites() {
  if (favorites.length === 0) {
    showNotification('No favorites to clear', 'info');
    return;
  }
  
  if (!confirm('Are you sure you want to remove all favorites?')) return;
  
  try {
    for (const favorite of favorites) {
      await fetchData(`${FAVORITES_FAVORITES_ENDPOINT}/${favorite.id}`, {
        method: 'DELETE'
      });
    }
    
    favorites = [];
    renderFavorites();
    updateCounts();
    showNotification('All favorites cleared', 'success');
  } catch (error) {
    console.error('Error clearing favorites:', error);
    showNotification('Failed to clear favorites', 'error');
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
      (item.serviceId === service.serviceId || item.serviceId === service.id) && 
      item.userId === currentUser.id
    );
    
    if (existingCartItem) {
      await fetchData(`${FAVORITES_CART_ENDPOINT}/${existingCartItem.id}`, {
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
        serviceId: service.serviceId || service.id,
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
      
      await fetchData(FAVORITES_CART_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cartItem)
      });
    }
    
    await loadCart(currentUser);
    updateCounts();
    showNotification('Added to cart!', 'success');
  } catch (error) {
    console.error('Error adding to cart:', error);
    showNotification('Failed to add to cart', 'error');
  }
}

function renderFavorites() {
  if (!favoritesGrid) return;
  
  if (!favorites || favorites.length === 0) {
    favoritesGrid.style.display = 'none';
    if (emptyFavorites) emptyFavorites.style.display = 'block';
    return;
  }
  
  favoritesGrid.style.display = 'grid';
  if (emptyFavorites) emptyFavorites.style.display = 'none';
  
  favoritesGrid.innerHTML = favorites.map(favorite => {
    const inCart = cartItems.find(item => item.serviceId === favorite.serviceId);
    
    return `
      <div class="service-card favorite-card" data-favorite-id="${favorite.id}">
        <div class="service-image" style="background-image: url('${favorite.image}')">
          <div class="service-actions">
            <button class="remove-favorite-btn" data-favorite-id="${favorite.id}">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="service-content">
          <div class="service-category">${favorite.category}</div>
          <h3 class="service-title">${favorite.name}</h3>
          <p class="service-description">${favorite.description}</p>
          <div class="service-meta">
            <div class="service-price">$${favorite.price}</div>
            <div class="service-rating">
              ${'★'.repeat(Math.floor(favorite.rating))}
              ${favorite.rating % 1 >= 0.5 ? '½' : ''}
              <span class="rating-value">${favorite.rating.toFixed(1)}</span>
            </div>
          </div>
          <div class="service-buttons">
            <button class="btn-cart ${inCart ? 'in-cart' : ''}" 
                    data-service-id="${favorite.serviceId}">
              <i class="fas fa-shopping-cart"></i>
              ${inCart ? `In Cart (${inCart.quantity})` : 'Add to Cart'}
            </button>
            <a href="catalog.html" class="btn-details">
              <i class="fas fa-arrow-left"></i> Back to Catalog
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  attachEventListeners();
}

function updateCounts() {
  if (favoritesCount) {
    favoritesCount.textContent = favorites.length;
  }
  if (cartCount) {
    cartCount.textContent = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }
}

function attachEventListeners() {
  document.querySelectorAll('.remove-favorite-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const favoriteId = btn.dataset.favoriteId;
      console.log('Remove button clicked for favoriteId:', favoriteId);
      removeFromFavorite(favoriteId);
    });
  });
  
  document.querySelectorAll('.btn-cart').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const serviceId = parseInt(btn.dataset.serviceId);
      const favorite = favorites.find(fav => fav.serviceId === serviceId);
      
      if (favorite) {
        await addToCart(favorite);
        
        const cartItem = cartItems.find(item => item.serviceId === serviceId);
        if (cartItem) {
          btn.classList.add('in-cart');
          btn.innerHTML = `<i class="fas fa-shopping-cart"></i> In Cart (${cartItem.quantity})`;
        }
      }
    });
  });
}

async function init() {
  console.log('Initializing favorites module...');
  
  if (!window.authService) {
    console.warn('Auth service not available, retrying in 500ms...');
    setTimeout(init, 500);
    return;
  }
  
  window.authService.onAuthChange(async (user) => {
    console.log('Auth changed, user:', user?.nickname || 'none');
    await loadFavorites(user);
  });
  
  if (window.authService.initialized) {
    await loadFavorites(window.authService.getCurrentUser());
  } else {
    const checkAuth = setInterval(() => {
      if (window.authService.initialized) {
        clearInterval(checkAuth);
        loadFavorites(window.authService.getCurrentUser());
      }
    }, 100);
  }
  
  if (clearAllFavoritesBtn) {
    clearAllFavoritesBtn.addEventListener('click', clearAllFavorites);
  }
  
  console.log('Favorites module initialized');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}