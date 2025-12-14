document.addEventListener('DOMContentLoaded', function() {
  const playButton = document.getElementById('playButton');
  const heroImage = document.getElementById('heroImage');
  const videoWrapper = document.getElementById('videoWrapper');
  const heroVideo = document.getElementById('heroVideo');
  const videoCloseBtn = document.getElementById('videoCloseBtn');
  
  if (!playButton || !heroImage || !videoWrapper || !heroVideo) {
    console.log('Video player elements not found');
    return;
  }
  
  function playVideo() {
    videoWrapper.classList.add('active');
    heroImage.classList.add('active');
    
    heroVideo.play().then(() => {
      console.log('Video started playing');
    }).catch(error => {
      console.log('Error playing video:', error);
      heroVideo.controls = true;
    });
    
    document.body.classList.add('video-playing');
  }
  
  function stopVideo() {
    heroVideo.pause();
    heroVideo.currentTime = 0;
    
    videoWrapper.classList.remove('active');
    heroImage.classList.remove('active');
    
    document.body.classList.remove('video-playing');
  }
  
  playButton.addEventListener('click', function(e) {
    e.stopPropagation();
    playVideo();
  });
  
  heroImage.addEventListener('click', function(e) {
    if (!playButton.contains(e.target)) {
      playVideo();
    }
  });
  
  videoCloseBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    stopVideo();
  });
  
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && videoWrapper.classList.contains('active')) {
      stopVideo();
    }
  });
  
  window.addEventListener('scroll', function() {
    if (videoWrapper.classList.contains('active')) {
      const rect = videoWrapper.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        stopVideo();
      }
    }
  });
  
  heroVideo.addEventListener('ended', function() {
    setTimeout(() => {
      if (videoWrapper.classList.contains('active')) {
        stopVideo();
      }
    }, 2000);
  });
  
  heroImage.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      playVideo();
    }
  });
  
  playButton.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      playVideo();
    }
  });
  
  heroImage.setAttribute('tabindex', '0');
  heroImage.setAttribute('role', 'button');
  heroImage.setAttribute('aria-label', 'Play demo video about our platform');
  
  playButton.setAttribute('aria-label', 'Play video');
  videoCloseBtn.setAttribute('aria-label', 'Close video');
});