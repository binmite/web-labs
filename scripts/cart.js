const CART_API_BASE = 'http://localhost:3000';
const CART_CART_ENDPOINT = `${CART_API_BASE}/cart`;
const CART_ORDERS_ENDPOINT = `${CART_API_BASE}/orders`;

let cartItems = [];

const cartItemsContainer = document.getElementById('cartItems');
const emptyCart = document.getElementById('emptyCart');
const clearCartBtn = document.getElementById('clearCart');
const checkoutBtn = document.getElementById('checkoutBtn');
const subtotalEl = document.getElementById('subtotal');
const taxEl = document.getElementById('tax');
const totalEl = document.getElementById('total');
const favoritesCount = document.getElementById('favoritesCount');
const cartCount = document.getElementById('cartCount');
const checkoutModal = document.getElementById('checkoutModal');
const orderTotalEl = document.getElementById('orderTotal');
const continueShoppingBtn = document.getElementById('continueShopping');
const viewOrderBtn = document.getElementById('viewOrder');
const closeModalBtn = document.querySelector('.close-modal');

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

async function loadCart(user) {
  try {
    if (!user) {
      cartItems = [];
      renderCart();
      updateCartSummary();
      updateCounts();
      return;
    }
    
    console.log('Loading cart for user:', user.id);
    
    const allCartItems = await fetchData(CART_CART_ENDPOINT) || [];
    cartItems = allCartItems.filter(item => item.userId === user.id);
    console.log('Found cart items:', cartItems.length);
    
    renderCart();
    updateCartSummary();
    updateCounts();
  } catch (error) {
    console.error('Error loading cart:', error);
  }
}

async function updateQuantity(cartItemId, change, newQuantity = null) {
  console.log('Updating quantity for cart item:', cartItemId);
  
  const cartItem = cartItems.find(item => item.id == cartItemId);
  if (!cartItem) {
    showNotification('Cart item not found', 'error');
    return;
  }
  
  let quantity = newQuantity !== null ? newQuantity : cartItem.quantity + change;
  quantity = Math.max(1, quantity); 
  
  try {
    await fetchData(`${CART_CART_ENDPOINT}/${cartItem.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ quantity })
    });
    
    await loadCart(window.authService?.getCurrentUser());
    showNotification('Quantity updated', 'success');
  } catch (error) {
    console.error('Error updating quantity:', error);
    showNotification('Failed to update quantity', 'error');
  }
}

async function removeFromCart(cartItemId) {
  console.log('Removing cart item:', cartItemId);
  
  if (!confirm('Remove this item from cart?')) return;
  
  try {
    const cartItem = cartItems.find(item => item.id == cartItemId);
    if (!cartItem) {
      showNotification('Cart item not found', 'error');
      return;
    }
    
    await fetchData(`${CART_CART_ENDPOINT}/${cartItem.id}`, {
      method: 'DELETE'
    });
    
    await loadCart(window.authService?.getCurrentUser());
    showNotification('Item removed from cart', 'success');
  } catch (error) {
    console.error('Error removing item:', error);
    showNotification('Failed to remove item', 'error');
  }
}

async function clearCart() {
  if (cartItems.length === 0) {
    showNotification('Cart is already empty', 'info');
    return;
  }
  
  if (!confirm('Are you sure you want to clear your entire cart?')) return;
  
  try {
    for (const item of cartItems) {
      await fetchData(`${CART_CART_ENDPOINT}/${item.id}`, {
        method: 'DELETE'
      });
    }
    
    cartItems = [];
    renderCart();
    updateCartSummary();
    updateCounts();
    showNotification('Cart cleared successfully', 'success');
  } catch (error) {
    console.error('Error clearing cart:', error);
    showNotification('Failed to clear cart', 'error');
  }
}

async function createOrder() {
  const currentUser = window.authService?.getCurrentUser();
  if (!currentUser) {
    showNotification('Please log in to complete purchase', 'error');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
    return null;
  }
  
  try {
    const orderData = {
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userEmail: currentUser.email,
      items: cartItems.map(item => ({
        serviceId: item.serviceId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category
      })),
      subtotal: calculateSubtotal(),
      tax: calculateTax(calculateSubtotal()),
      total: calculateTotal(),
      status: 'completed',
      orderDate: new Date().toISOString(),
      deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    
    const order = await fetchData(CART_ORDERS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });
    
    return order;
  } catch (error) {
    console.error('Error creating order:', error);
    return null;
  }
}

function showCheckoutModal() {
  const total = calculateTotal();
  if (orderTotalEl) orderTotalEl.textContent = `$${total.toFixed(2)}`;
  if (checkoutModal) checkoutModal.classList.add('show');
}

function hideCheckoutModal() {
  if (checkoutModal) checkoutModal.classList.remove('show');
}

async function checkout() {
  const currentUser = window.authService?.getCurrentUser();
  
  if (cartItems.length === 0) {
    showNotification('Your cart is empty!', 'error');
    return;
  }
  
  if (!currentUser) {
    showNotification('Please log in to complete purchase', 'error');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
    return;
  }
  
  showNotification('Processing your order...', 'info');
  
  setTimeout(async () => {
    try {
      const order = await createOrder();
      
      if (order) {
        const orderId = order.id || `ORD-${Date.now()}`;
        const total = calculateTotal();
        
        if (document.getElementById('orderId')) {
          document.getElementById('orderId').textContent = `ORD-${order.id}`;
        }
        if (orderTotalEl) {
          orderTotalEl.textContent = `$${total.toFixed(2)}`;
        }
        
        await clearCart();
        
        showCheckoutModal();
        showNotification('Order placed successfully!', 'success');
      } else {
        showNotification('Failed to create order', 'error');
      }
      
    } catch (error) {
      console.error('Checkout error:', error);
      showNotification('Checkout failed. Please try again.', 'error');
    }
  }, 1500);
}

function calculateSubtotal() {
  return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function calculateTax(subtotal) {
  return subtotal * 0.10; 
}

function calculateTotal() {
  const subtotal = calculateSubtotal();
  const tax = calculateTax(subtotal);
  return subtotal + tax;
}

function renderCart() {
  if (!cartItemsContainer) return;
  
  if (!cartItems || cartItems.length === 0) {
    cartItemsContainer.style.display = 'none';
    if (emptyCart) emptyCart.style.display = 'block';
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }
  
  cartItemsContainer.style.display = 'block';
  if (emptyCart) emptyCart.style.display = 'none';
  if (checkoutBtn) checkoutBtn.disabled = false;
  
  cartItemsContainer.innerHTML = cartItems.map(item => {
    const itemTotal = item.price * item.quantity;
    
    return `
      <div class="cart-item" data-cart-id="${item.id}">
        <div class="cart-item-image" style="background-image: url('${item.image}')"></div>
        <div class="cart-item-details">
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-category">${item.category}</div>
          <div class="cart-item-price">$${item.price} × ${item.quantity} = $${itemTotal.toFixed(2)}</div>
        </div>
        <div class="cart-item-controls">
          <div class="quantity-controls">
            <button class="quantity-btn decrease" data-cart-id="${item.id}">
              <i class="fas fa-minus"></i>
            </button>
            <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-cart-id="${item.id}">
            <button class="quantity-btn increase" data-cart-id="${item.id}">
              <i class="fas fa-plus"></i>
            </button>
          </div>
          <button class="remove-btn" data-cart-id="${item.id}">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  attachCartEventListeners();
}

function updateCartSummary() {
  const subtotal = calculateSubtotal();
  const tax = calculateTax(subtotal);
  const total = calculateTotal();
  
  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
}

function updateCounts() {
  if (cartCount) {
    cartCount.textContent = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }
}

function attachCartEventListeners() {
  document.querySelectorAll('.decrease').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const cartItemId = btn.dataset.cartId;
      updateQuantity(cartItemId, -1);
    });
  });
  
  document.querySelectorAll('.increase').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const cartItemId = btn.dataset.cartId;
      updateQuantity(cartItemId, 1);
    });
  });
  
  document.querySelectorAll('.quantity-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const cartItemId = e.target.dataset.cartId;
      const newQuantity = parseInt(e.target.value);
      if (!isNaN(newQuantity) && newQuantity >= 1) {
        updateQuantity(cartItemId, 0, newQuantity);
      }
    });
  });
  
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const cartItemId = btn.dataset.cartId;
      removeFromCart(cartItemId);
    });
  });
}

async function init() {
  console.log('Initializing cart module...');
  
  if (!window.authService) {
    console.warn('Auth service not available, retrying in 500ms...');
    setTimeout(init, 500);
    return;
  }
  
  window.authService.onAuthChange(async (user) => {
    console.log('Auth changed, user:', user?.nickname || 'none');
    await loadCart(user);
  });
  
  if (window.authService.initialized) {
    await loadCart(window.authService.getCurrentUser());
  } else {
    const checkAuth = setInterval(() => {
      if (window.authService.initialized) {
        clearInterval(checkAuth);
        loadCart(window.authService.getCurrentUser());
      }
    }, 100);
  }
  
  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', clearCart);
  }
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', checkout);
  }
  
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', hideCheckoutModal);
  }
  if (continueShoppingBtn) {
    continueShoppingBtn.addEventListener('click', () => {
      hideCheckoutModal();
      window.location.href = 'catalog.html';
    });
  }
  if (viewOrderBtn) {
    viewOrderBtn.addEventListener('click', () => {
      hideCheckoutModal();
      showNotification('Order details would show here', 'info');
    });
  }
  
  window.addEventListener('click', (e) => {
    if (checkoutModal && e.target === checkoutModal) {
      hideCheckoutModal();
    }
  });
  
  console.log('Cart module initialized');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}