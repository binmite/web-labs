document.addEventListener('DOMContentLoaded', function() {
    let cartCount = parseInt(localStorage.getItem('cartCount')) || 0;
    let favoritesCount = parseInt(localStorage.getItem('favoritesCount')) || 0;
    
    function updateCounters() {
        const cartBadge = document.getElementById('cartCount');
        const favoritesBadge = document.getElementById('favoritesCount');
        
        if (cartBadge) {
            cartBadge.textContent = cartCount;
            updateBadgeVisibility(cartBadge, cartCount);
        }
        
        if (favoritesBadge) {
            favoritesBadge.textContent = favoritesCount;
            updateBadgeVisibility(favoritesBadge, favoritesCount);
        }
        
        localStorage.setItem('cartCount', cartCount);
        localStorage.setItem('favoritesCount', favoritesCount);
        
        if (window.scrollAnimations && typeof window.scrollAnimations.updateLiveCounters === 'function') {
            window.scrollAnimations.updateLiveCounters();
        }
    }
    
    function updateBadgeVisibility(badgeElement, count) {
        if (count === 0) {
            badgeElement.style.display = 'none';
        } else {
            badgeElement.style.display = 'inline-flex';
            badgeElement.classList.add('bounce');
            setTimeout(() => badgeElement.classList.remove('bounce'), 500);
        }
    }
    
    updateCounters();
    
    window.addToCart = function(quantity = 1) {
        cartCount += quantity;
        updateCounters();
        showNotification(`Added ${quantity} item${quantity > 1 ? 's' : ''} to cart!`, 'success');
        return cartCount;
    };
    
    window.removeFromCart = function(quantity = 1) {
        if (cartCount >= quantity) {
            cartCount -= quantity;
            updateCounters();
            showNotification(`Removed ${quantity} item${quantity > 1 ? 's' : ''} from cart`, 'info');
        } else {
            cartCount = 0;
            updateCounters();
            showNotification('Cart is now empty', 'info');
        }
        return cartCount;
    };
    
    window.addToFavorites = function() {
        favoritesCount++;
        updateCounters();
        showNotification('Added to favorites!', 'success');
        return favoritesCount;
    };
    
    window.removeFromFavorites = function() {
        if (favoritesCount > 0) {
            favoritesCount--;
            updateCounters();
            showNotification('Removed from favorites', 'info');
        }
        return favoritesCount;
    };
    
    window.resetCounters = function() {
        cartCount = 0;
        favoritesCount = 0;
        updateCounters();
        showNotification('Counters reset', 'info');
    };
    
    window.getCartCount = function() {
        return cartCount;
    };
    
    window.getFavoritesCount = function() {
        return favoritesCount;
    };
    
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes bounce {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.2); }
            }
            .bounce {
                animation: bounce 0.5s ease;
            }
            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0;
                line-height: 1;
            }
        `;
        document.head.appendChild(style);
        
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        });
        
        document.body.appendChild(notification);
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideIn 0.3s ease reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
    }
    
    window.updateGlobalCounters = updateCounters;
    
    function initCounterButtons() {
        const addToCartBtn = document.querySelector('.btn-primary');
        if (addToCartBtn && !addToCartBtn.hasAttribute('data-counter-initialized')) {
            addToCartBtn.addEventListener('click', () => window.addToCart());
            addToCartBtn.setAttribute('data-counter-initialized', 'true');
        }
        
        const learnMoreBtn = document.querySelector('.btn-secondary');
        if (learnMoreBtn && !learnMoreBtn.hasAttribute('data-counter-initialized')) {
            learnMoreBtn.addEventListener('click', window.addToFavorites);
            learnMoreBtn.setAttribute('data-counter-initialized', 'true');
        }
    }
    
    initCounterButtons();
});