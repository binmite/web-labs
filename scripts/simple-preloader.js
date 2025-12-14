document.addEventListener('DOMContentLoaded', function() {
  const preloader = document.createElement('div');
  preloader.id = 'simple-preloader';
  preloader.innerHTML = `
    <div class="loader">
      <div class="loader-inner"></div>
      <div class="loader-inner"></div>
      <div class="loader-inner"></div>
    </div>
    <div class="loading-text">Loading</div>
  `;
  
  document.body.appendChild(preloader);
  
  window.addEventListener('load', function() {
    setTimeout(function() {
      preloader.classList.add('hidden');
      
      setTimeout(function() {
        if (preloader.parentNode) {
          preloader.parentNode.removeChild(preloader);
        }
      }, 500);
    }, 1000); 
  });
  
  setTimeout(function() {
    if (!preloader.classList.contains('hidden')) {
      preloader.classList.add('hidden');
      setTimeout(function() {
        if (preloader.parentNode) {
          preloader.parentNode.removeChild(preloader);
        }
      }, 500);
    }
  }, 3000);
});