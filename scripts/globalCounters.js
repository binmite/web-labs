async function updateAllCounters() {
  const API_BASE_URL = 'http://localhost:3000';
  
  try {
    const currentUser = window.authService?.getCurrentUser();
    if (!currentUser) {
      updateCounter('favoritesCount', 0);
      updateCounter('cartCount', 0);
      return;
    }
    
    const [favoritesResponse, cartResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/favorites`),
      fetch(`${API_BASE_URL}/cart`)
    ]);
    
    const allFavorites = await favoritesResponse.json();
    const allCartItems = await cartResponse.json();
    
    const userFavorites = allFavorites.filter(fav => fav.userId === currentUser.id);
    const userCartItems = allCartItems.filter(item => item.userId === currentUser.id);
    
    updateCounter('favoritesCount', userFavorites.length);
    updateCounter('cartCount', userCartItems.reduce((sum, item) => sum + item.quantity, 0));
    
  } catch (error) {
    console.error('Error updating counters:', error);
    updateCounter('favoritesCount', 0);
    updateCounter('cartCount', 0);
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

document.addEventListener('DOMContentLoaded', async () => {
  setTimeout(updateAllCounters, 100);
});

window.updateAllCounters = updateAllCounters;