document.addEventListener('DOMContentLoaded', function() {
    console.log('Parallax script loaded');
    
    const CONFIG = {
        speeds: {
            back: 0.3,  
            middle: 0.6,  
            front: 0.9,  
            reverse: -0.5  
        },
        
        useRAF: true,
        throttleDelay: 16,
        
        easing: 0.08,      
        maxOffset: 500     
        
    };
    
    let isEnabled = true;
    let scrollY = 0;
    let targetScrollY = 0;
    let lastScrollY = 0;
    let rafId = null;
    let elements = null;
    let lastTimestamp = 0;
    const FPS = 60;
    const frameDuration = 1000 / FPS;
    
    function init() {
        console.log('Initializing parallax...');
        
        elements = {
            section: document.querySelector('.parallax-section'),
            layers: {
                back: document.querySelector('.layer-back'),
                middle: document.querySelector('.layer-middle'),
                front: document.querySelector('.layer-front')
            },
            bgElements: document.querySelectorAll('.bg-element'),
            floatingIcons: document.querySelectorAll('.floating-icon'),
            parallaxCards: document.querySelectorAll('.parallax-card'),
            title: document.querySelector('.parallax-title'),
            subtitle: document.querySelector('.parallax-section .subtitle')
        };
        
        if (!elements.section) {
            console.error('Parallax section not found!');
            return;
        }
        
        console.log('Found elements:', {
            section: !!elements.section,
            back: !!elements.layers.back,
            middle: !!elements.layers.middle,
            front: !!elements.layers.front,
            bgElements: elements.bgElements.length,
            floatingIcons: elements.floatingIcons.length,
            cards: elements.parallaxCards.length
        });
        
        setupInitialStyles();
        setupEventListeners();
        startAnimation();
        
        console.log('Parallax initialized successfully');
    }
    
    function setupInitialStyles() {
        [elements.layers.back, elements.layers.middle, elements.layers.front].forEach(layer => {
            if (layer) {
                layer.style.willChange = 'transform';
                layer.style.transition = 'transform 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                layer.style.transform = 'translateY(0)';
            }
        });
        
        elements.floatingIcons.forEach(icon => {
            icon.style.willChange = 'transform';
            icon.style.transition = 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        });
        
        elements.parallaxCards.forEach(card => {
            card.style.willChange = 'transform';
            card.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        });
        
        addScrollIndicator();
    }
    
    function addScrollIndicator() {
        if (!elements.section) return;
        
        const existingIndicator = elements.section.querySelector('.scroll-indicator');
        if (existingIndicator) return;
        
        const indicator = document.createElement('div');
        indicator.className = 'scroll-indicator';
        indicator.innerHTML = `
            <div class="arrow">↓</div>
            <span>Scroll slowly to see the parallax effect</span>
        `;
        indicator.style.cssText = `
            position: absolute;
            bottom: 40px;
            left: 50%;
            transform: translateX(-50%);
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.9rem;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            text-align: center;
            background: rgba(0, 0, 0, 0.3);
            padding: 10px 20px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        const arrow = indicator.querySelector('.arrow');
        arrow.style.cssText = `
            animation: bounce 2s infinite;
            font-size: 1.5rem;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
        `;
        document.head.appendChild(style);
        
        elements.section.appendChild(indicator);
        
        setTimeout(() => {
            indicator.style.transition = 'opacity 1.5s ease';
            indicator.style.opacity = '0';
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }, 1500);
        }, 8000);
    }
    
    function updateParallax() {
        if (!isEnabled || !elements.section) return;
        
        const delta = targetScrollY - scrollY;
        const scrollStep = delta * CONFIG.easing;
        
        const momentum = 0.7;
        scrollY += scrollStep * momentum;
        
        const limitedScrollY = Math.min(Math.max(scrollY, -CONFIG.maxOffset), CONFIG.maxOffset);
        const progress = limitedScrollY / CONFIG.maxOffset;
        
        updateBackLayer(limitedScrollY, progress);
        updateMiddleLayer(limitedScrollY, progress);
        updateFrontLayer(limitedScrollY, progress);
    }
    
    function updateBackLayer(scrollY, progress) {
        if (!elements.layers.back) return;
        
        const backOffset = scrollY * CONFIG.speeds.back;
        elements.layers.back.style.transform = `translateY(${backOffset}px)`;
        
        elements.bgElements.forEach((el, index) => {
            const speedMultiplier = 0.8 + (index * 0.05);
            const y = scrollY * CONFIG.speeds.back * speedMultiplier;
            
            const x = Math.sin(progress * Math.PI) * 20 * speedMultiplier;
            
            el.style.transform = `translate(${x}px, ${y}px) rotate(${progress * 5}deg)`;
            
            const opacity = 0.3 + (Math.abs(progress) * 0.2);
            el.style.opacity = opacity;
        });
        
        const blur = Math.abs(scrollY - lastScrollY) * 0.01;
        elements.layers.back.style.filter = `blur(${Math.min(blur, 3)}px)`;
    }
    
    function updateMiddleLayer(scrollY, progress) {
        if (!elements.layers.middle) return;
        
        const middleOffset = scrollY * CONFIG.speeds.middle;
        elements.layers.middle.style.transform = `translateY(${middleOffset}px)`;
        
        elements.floatingIcons.forEach(icon => {
            const speed = parseFloat(icon.getAttribute('data-speed')) || CONFIG.speeds.middle;
            const direction = parseInt(icon.getAttribute('data-direction')) || 1;
            
            let y = scrollY * speed * direction;
            
            let x = Math.cos(progress * Math.PI * 2 + icon.offsetTop * 0.001) * 40 * speed * direction;
            
            if (icon.classList.contains('reverse-move')) {
                const reverseSpeed = CONFIG.speeds.reverse;
                y = scrollY * reverseSpeed;
                x = Math.sin(progress * Math.PI + icon.offsetLeft * 0.001) * 60;
                
                const rotation = progress * 20;
                icon.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${1 + Math.abs(progress) * 0.1})`;
            } else {
                const rotation = Math.sin(progress * Math.PI * 2) * 5;
                icon.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
            }
            
            const glow = 0.3 + Math.abs(Math.sin(progress * Math.PI)) * 0.3;
            icon.style.boxShadow = `0 20px 40px rgba(0, 0, 0, ${0.3 + glow})`;
        });
    }
    
    function updateFrontLayer(scrollY, progress) {
        if (!elements.layers.front) return;
        
        const frontOffset = scrollY * CONFIG.speeds.front;
        elements.layers.front.style.transform = `translateY(${frontOffset}px)`;
        
        if (elements.title) {
            const titleSpeed = parseFloat(elements.title.getAttribute('data-speed')) || CONFIG.speeds.front * 0.8;
            const titleOffset = scrollY * titleSpeed;
            elements.title.style.transform = `translateY(${titleOffset}px)`;
            
            const textShadowY = Math.abs(scrollY * 0.01);
            elements.title.style.textShadow = `0 ${4 + textShadowY}px ${20 + textShadowY * 2}px rgba(0, 0, 0, 0.5)`;
        }
        
        if (elements.subtitle) {
            const subtitleSpeed = parseFloat(elements.subtitle.getAttribute('data-speed')) || CONFIG.speeds.front * 0.6;
            const subtitleOffset = scrollY * subtitleSpeed;
            elements.subtitle.style.transform = `translateY(${subtitleOffset}px)`;
        }
        
        elements.parallaxCards.forEach((card, index) => {
            const cardSpeed = parseFloat(card.getAttribute('data-speed')) || CONFIG.speeds.front;
            const delay = index * 0.05;
            
            const cardOffset = scrollY * cardSpeed * (1 - delay * 0.3);
            
            const cardTiltX = progress * 1.5;
            const cardTiltY = Math.sin(progress * Math.PI + index * 0.5) * 0.8;
            
            card.style.transform = `
                translateY(${cardOffset}px)
                rotateX(${cardTiltX}deg)
                rotateY(${cardTiltY}deg)
                scale(${1 + Math.abs(progress) * 0.02})
            `;
            
            const shadowY = 10 + Math.abs(scrollY) * 0.05;
            const shadowBlur = 20 + Math.abs(scrollY) * 0.1;
            const shadowAlpha = 0.3 + Math.abs(progress) * 0.2;
            
            card.style.boxShadow = `
                0 ${shadowY}px ${shadowBlur}px rgba(0, 0, 0, ${shadowAlpha}),
                0 0 0 1px rgba(93, 93, 255, ${0.1 + Math.abs(progress) * 0.15})
            `;
            
            const bgAlpha = 0.6 + Math.abs(progress) * 0.1;
            card.style.background = `rgba(51, 65, 85, ${bgAlpha})`;
        });
    }
    
    function startAnimation() {
        if (!CONFIG.useRAF) return;
        
        function animate(timestamp) {
            if (timestamp - lastTimestamp >= frameDuration) {
                updateParallax();
                lastTimestamp = timestamp;
            }
            rafId = requestAnimationFrame(animate);
        }
        
        rafId = requestAnimationFrame(animate);
    }
    
    function stopAnimation() {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }
    
    function setupEventListeners() {
        let ticking = false;
        
        window.addEventListener('scroll', () => {
            targetScrollY = window.scrollY - elements.section.offsetTop;
            
            const currentScrollY = window.scrollY;
            const scrollDelta = Math.abs(currentScrollY - lastScrollY);
            lastScrollY = currentScrollY;
            
            CONFIG.easing = Math.min(0.15, Math.max(0.05, 0.1 - scrollDelta * 0.001));
            
            if (!ticking) {
                requestAnimationFrame(() => {
                    updateParallax();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
        
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                scrollY = window.scrollY - elements.section.offsetTop;
                targetScrollY = scrollY;
                updateParallax();
            }, 100);
        });
        
        elements.floatingIcons.forEach(icon => {
            icon.style.pointerEvents = 'auto';
            icon.style.cursor = 'pointer';
            
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                
                icon.style.transform += ' scale(0.85)';
                icon.style.transition = 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)';
                
                const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                icon.style.color = randomColor;
                icon.style.borderColor = randomColor + '80';
                icon.style.boxShadow = `0 0 30px ${randomColor}40`;
                
                setTimeout(() => {
                    icon.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), all 0.3s ease';
                    icon.style.transform = icon.style.transform.replace(' scale(0.85)', '');
                    
                    setTimeout(() => {
                        icon.style.transition = '';
                    }, 300);
                }, 150);
            });
        });
        
        elements.parallaxCards.forEach(card => {
            let hoverTimeout;
            
            card.addEventListener('mouseenter', () => {
                clearTimeout(hoverTimeout);
                card.style.zIndex = '100';
                card.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
            });
            
            card.addEventListener('mouseleave', () => {
                hoverTimeout = setTimeout(() => {
                    card.style.zIndex = '';
                    card.style.transition = '';
                }, 100);
            });
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                elements.section.classList.toggle('debug-mode');
                console.log('Debug mode:', elements.section.classList.contains('debug-mode'));
            }
        });
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    window.parallaxController.enable();
                } else {
                }
            });
        }, { threshold: 0.1 });
        
        observer.observe(elements.section);
    }
    
    window.parallaxController = {
        enable: () => {
            if (!isEnabled) {
                isEnabled = true;
                if (!rafId) startAnimation();
                console.log('Parallax enabled');
            }
        },
        
        disable: () => {
            if (isEnabled) {
                isEnabled = false;
                stopAnimation();
                console.log('Parallax disabled');
            }
        },
        
        toggle: () => {
            isEnabled ? this.disable() : this.enable();
        },
        
        setSpeed: (layer, speed) => {
            if (CONFIG.speeds[layer] !== undefined) {
                CONFIG.speeds[layer] = speed;
                console.log(`Layer "${layer}" speed set to ${speed}`);
            }
        },
        
        getConfig: () => ({ ...CONFIG }),
        
        reset: () => {
            scrollY = 0;
            targetScrollY = 0;
            lastScrollY = 0;
            updateParallax();
            console.log('Parallax reset');
        },
        
        debug: () => {
            console.log('=== PARALLAX DEBUG ===');
            console.log('Scroll Y:', scrollY.toFixed(2));
            console.log('Target Scroll Y:', targetScrollY.toFixed(2));
            console.log('Speeds:', CONFIG.speeds);
            console.log('Easing:', CONFIG.easing.toFixed(3));
            console.log('Enabled:', isEnabled);
            console.log('RAF running:', !!rafId);
            console.log('Section offset:', elements.section?.offsetTop);
            console.log('====================');
            
            elements.section.classList.toggle('debug-mode');
        }
    };
    
    if (document.readyState === 'complete') {
        setTimeout(init, 100);
    } else {
        window.addEventListener('load', () => {
            setTimeout(init, 100);
        });
    }
});