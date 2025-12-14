document.addEventListener('DOMContentLoaded', function() {
    const config = {
        observerThreshold: 0.1,
        observerRootMargin: '0px 0px -50px 0px',
        
        counterDuration: 2000, 
        counterEasing: 'easeOutQuart',
        
        headerScrollThreshold: 100,
        
        showScrollProgress: true
    };
    
    class AnimatedCounter {
        constructor(element) {
            this.element = element;
            this.target = parseInt(element.getAttribute('data-target')) || 0;
            this.duration = parseInt(element.getAttribute('data-speed')) || config.counterDuration;
            this.prefix = element.getAttribute('data-prefix') || '';
            this.suffix = element.getAttribute('data-suffix') || '';
            this.startValue = parseInt(element.textContent) || 0;
            this.startTime = null;
            this.isCounting = false;
            this.hasAnimated = false;
            this.hasBeenInViewport = false; 
        }
        
        start() {
            if (this.isCounting || (this.hasAnimated && !this.element.hasAttribute('data-resettable'))) {
                return;
            }
            
            this.isCounting = true;
            this.startTime = null;
            
            const animate = (currentTime) => {
                if (!this.startTime) this.startTime = currentTime;
                const elapsedTime = currentTime - this.startTime;
                const progress = Math.min(elapsedTime / this.duration, 1);
                
                const ease = this.easeOutQuart(progress);
                
                const currentValue = Math.floor(ease * (this.target - this.startValue) + this.startValue);
                this.element.textContent = this.prefix + currentValue + this.suffix;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    this.element.textContent = this.prefix + this.target + this.suffix;
                    this.isCounting = false;
                    this.hasAnimated = true;
                    
                    this.element.dispatchEvent(new CustomEvent('counterComplete', {
                        detail: { value: this.target }
                    }));
                }
            };
            
            requestAnimationFrame(animate);
        }
        
        easeOutQuart(t) {
            return 1 - Math.pow(1 - t, 4);
        }
        
        reset() {
            this.isCounting = false;
            this.hasAnimated = false;
            this.hasBeenInViewport = false;
            this.element.textContent = this.prefix + this.startValue + this.suffix;
        }
        
        updateTarget(newTarget) {
            this.target = newTarget;
            this.element.setAttribute('data-target', newTarget);
            
            if (this.hasAnimated) {
                this.hasAnimated = false;
                if (this.hasBeenInViewport) {
                    this.start();
                }
            }
        }
    }
    
    const counters = [];
    const counterElements = document.querySelectorAll('.counter');
    
    counterElements.forEach(counterEl => {
        const counter = new AnimatedCounter(counterEl);
        counters.push(counter);
    });
    
    function updateLiveCounters() {
        const cartCount = parseInt(localStorage.getItem('cartCount')) || 0;
        const favoritesCount = parseInt(localStorage.getItem('favoritesCount')) || 0;
        
        const cartCounterEl = document.getElementById('cartCounterLive');
        const favoritesCounterEl = document.getElementById('favoritesCounterLive');
        
        if (cartCounterEl) {
            cartCounterEl.setAttribute('data-target', cartCount);
            const cartCounter = counters.find(c => c.element === cartCounterEl);
            if (cartCounter) {
                cartCounter.updateTarget(cartCount);
            }
        }
        
        if (favoritesCounterEl) {
            favoritesCounterEl.setAttribute('data-target', favoritesCount);
            const favCounter = counters.find(c => c.element === favoritesCounterEl);
            if (favCounter) {
                favCounter.updateTarget(favoritesCount);
            }
        }
    }
    
    function initScrollAnimations() {
        const animatedElements = document.querySelectorAll('.scroll-animate');
        
        function isElementInViewport(el) {
            const rect = el.getBoundingClientRect();
            return (
                rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.9 &&
                rect.bottom >= 0
            );
        }
        
        function checkAllElementsOnLoad() {
            counterElements.forEach(counterEl => {
                const counter = counters.find(c => c.element === counterEl);
                if (counter && isElementInViewport(counterEl)) {
                    counter.hasBeenInViewport = true;
                    if (!counter.hasAnimated) {
                        setTimeout(() => counter.start(), 300);
                    }
                }
            });
            
            animatedElements.forEach(element => {
                if (isElementInViewport(element) && !element.classList.contains('counter')) {
                    element.classList.add('animate');
                    const delay = element.getAttribute('data-delay');
                    if (delay) {
                        element.style.transitionDelay = `${delay}ms`;
                    }
                }
            });
        }
        
        function checkElementsOnScroll() {
            counterElements.forEach(counterEl => {
                const counter = counters.find(c => c.element === counterEl);
                if (counter && isElementInViewport(counterEl)) {
                    if (!counter.hasBeenInViewport) {
                        counter.hasBeenInViewport = true;
                        if (!counter.hasAnimated) {
                            setTimeout(() => counter.start(), 300);
                        }
                    }
                }
            });
            
            animatedElements.forEach(element => {
                if (isElementInViewport(element) && !element.classList.contains('counter')) {
                    element.classList.add('animate');
                    const delay = element.getAttribute('data-delay');
                    if (delay) {
                        element.style.transitionDelay = `${delay}ms`;
                    }
                }
            });
        }
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    
                    if (element.classList.contains('counter')) {
                        const counter = counters.find(c => c.element === element);
                        if (counter && !counter.hasBeenInViewport) {
                            counter.hasBeenInViewport = true;
                            if (!counter.hasAnimated) {
                                setTimeout(() => counter.start(), 300);
                            }
                        }
                    }
                    
                    element.classList.add('animate');
                    const delay = element.getAttribute('data-delay');
                    if (delay) {
                        element.style.transitionDelay = `${delay}ms`;
                    }
                }
            });
        }, {
            threshold: config.observerThreshold,
            rootMargin: config.observerRootMargin
        });
        
        animatedElements.forEach(element => {
            observer.observe(element);
        });
        
        counterElements.forEach(counter => {
            observer.observe(counter);
        });
        
        checkAllElementsOnLoad();
        
        window.addEventListener('scroll', checkElementsOnScroll);
    }
    
    function initHeaderScrollEffect() {
        const header = document.querySelector('.header');
        
        if (!header) return;
        
        function updateHeader() {
            if (window.scrollY > config.headerScrollThreshold) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
        
        window.addEventListener('scroll', updateHeader);
        updateHeader();
    }
    
    function initScrollProgress() {
        if (!config.showScrollProgress) return;
        
        const progressBar = document.createElement('div');
        progressBar.className = 'scroll-progress';
        document.body.appendChild(progressBar);
        
        function updateProgressBar() {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight - windowHeight;
            const scrolled = window.scrollY;
            
            const progress = (scrolled / documentHeight) * 100;
            progressBar.style.width = `${progress}%`;
        }
        
        window.addEventListener('scroll', updateProgressBar);
        updateProgressBar();
    }
    
    function initAllAnimations() {
        initScrollAnimations();
        initHeaderScrollEffect();
        initScrollProgress();
        
        window.addEventListener('storage', updateLiveCounters);
        
        updateLiveCounters();
        
        if (typeof updateGlobalCounters === 'function') {
            const originalUpdate = updateGlobalCounters;
            updateGlobalCounters = function() {
                originalUpdate();
                updateLiveCounters();
            };
        }
    }
    
    initAllAnimations();
    
    window.scrollAnimations = {
        updateLiveCounters,
        resetCounters: function() {
            counters.forEach(counter => counter.reset());
        },
        forceStartCounters: function() {
            counters.forEach(counter => {
                if (!counter.hasAnimated) {
                    counter.start();
                }
            });
        }
    };
});