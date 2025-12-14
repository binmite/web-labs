document.addEventListener('DOMContentLoaded', function() {
  const burgerToggle = document.getElementById('burgerToggle');
  const mainNav = document.getElementById('mainNav');
  const burgerOverlay = document.getElementById('burgerOverlay');
  const html = document.documentElement;
  const body = document.body;
  
  let scrollPosition = 0;
  let isMenuOpen = false;
  
  function openMenu() {
    if (isMenuOpen) return;
    
    scrollPosition = window.pageYOffset;
    
    html.classList.add('menu-open');
    body.classList.add('menu-open');
    
    body.style.top = `-${scrollPosition}px`;
    body.style.position = 'fixed';
    body.style.width = '100%';
    
    mainNav.classList.add('active');
    burgerToggle.classList.add('active');
    burgerOverlay.classList.add('active');
    
    isMenuOpen = true;
  }
  
  function closeMenu() {
    if (!isMenuOpen) return;
    
    mainNav.classList.remove('active');
    burgerToggle.classList.remove('active');
    burgerOverlay.classList.remove('active');
    
    html.classList.remove('menu-open');
    body.classList.remove('menu-open');
    
    body.style.removeProperty('top');
    body.style.removeProperty('position');
    body.style.removeProperty('width');
    
    window.scrollTo(0, scrollPosition);
    
    isMenuOpen = false;
  }
  
  function toggleMenu() {
    if (isMenuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }
  
  burgerToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    toggleMenu();
  });
  
  burgerOverlay.addEventListener('click', closeMenu);
  
  const navLinks = mainNav.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });
  
  const authButtons = mainNav.querySelectorAll('.auth-buttons a, .auth-buttons button, .user-greeting');
  authButtons.forEach(button => {
    button.addEventListener('click', closeMenu);
  });
  
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isMenuOpen) {
      closeMenu();
    }
  });
  
  window.addEventListener('resize', function() {
    if (window.innerWidth > 992 && isMenuOpen) {
      closeMenu();
    }
  });
  
  document.addEventListener('click', function(e) {
    if (isMenuOpen && 
        !mainNav.contains(e.target) && 
        !burgerToggle.contains(e.target)) {
      closeMenu();
    }
  });
});