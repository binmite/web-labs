async function updateAllCounters() {
  const API_BASE_URL = 'http://localhost:3000';
  
  try {
    const [favoritesResponse, cartResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/favorites`),
      fetch(`${API_BASE_URL}/cart`)
    ]);
    
    const favorites = await favoritesResponse.json();
    const cartItems = await cartResponse.json();
    
    updateCounter('favoritesCount', favorites.length);
    updateCounter('cartCount', cartItems.reduce((sum, item) => sum + item.quantity, 0));
    
  } catch (error) {
    console.error('Error updating counters:', error);
  }
}

function updateCounter(elementId, count) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = count;
    
    if (count === 0) {
      element.style.display = 'none';
    } else {
      element.style.display = 'inline-flex';
      element.classList.add('bounce');
      setTimeout(() => element.classList.remove('bounce'), 500);
    }
  }
}

window.updateAllCounters = updateAllCounters;

document.addEventListener('DOMContentLoaded', updateAllCounters);