document.addEventListener('DOMContentLoaded', function() {
    console.log('Parallax script loaded');
    
    const CONFIG = {
        speeds: {
            back: 0.15,    
            middle: 0.4,   
            front: 0.7,    
            reverse: -0.6   
        },
        
        useRAF: true,
        throttleDelay: 16,
        
        easing: 0.1,        
        maxOffset: 300      
    };
    
    let isEnabled = true;
    let scrollY = 0;
    let targetScrollY = 0;
    let rafId = null;
    let elements = null;
    
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
            title: document.querySelector('.parallax-title')
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
        
        updateParallax();
        
        console.log('Parallax initialized successfully');
    }
    
    function setupInitialStyles() {
        if (elements.layers.back) {
            elements.layers.back.style.opacity = '1';
            elements.layers.back.style.transform = 'translateY(0)';
        }
        
        if (elements.layers.middle) {
            elements.layers.middle.style.opacity = '1';
            elements.layers.middle.style.transform = 'translateY(0)';
        }
        
        if (elements.layers.front) {
            elements.layers.front.style.opacity = '1';
            elements.layers.front.style.transform = 'translateY(0)';
        }
        
        addScrollIndicator();
    }
    
    function addScrollIndicator() {
        if (!elements.section) return;
        
        const indicator = document.createElement('div');
        indicator.className = 'scroll-indicator';
        indicator.innerHTML = `
            <div class="arrow">↓</div>
            <span>Scroll to see parallax effect</span>
        `;
        
        elements.section.appendChild(indicator);
        
        setTimeout(() => {
            indicator.style.opacity = '0';
            indicator.style.transition = 'opacity 1s ease';
            setTimeout(() => indicator.remove(), 1000);
        }, 5000);
    }
    
    function updateParallax() {
        if (!isEnabled || !elements.section) return;
        
        scrollY += (targetScrollY - scrollY) * CONFIG.easing;
        
        const limitedScrollY = Math.min(Math.max(scrollY, -CONFIG.maxOffset), CONFIG.maxOffset);
        
        const progress = limitedScrollY / CONFIG.maxOffset;
        
        if (elements.layers.back) {
            const backOffset = limitedScrollY * CONFIG.speeds.back;
            elements.layers.back.style.transform = `translateY(${backOffset}px)`;
            
            elements.bgElements.forEach((el, index) => {
                const speed = 0.05 + (index * 0.02);
                const y = limitedScrollY * speed;
                const x = Math.sin(progress * Math.PI) * 30 * speed;
                el.style.transform = `translate(${x}px, ${y}px)`;
            });
        }
        
        if (elements.layers.middle) {
            const middleOffset = limitedScrollY * CONFIG.speeds.middle;
            elements.layers.middle.style.transform = `translateY(${middleOffset}px)`;
            
            elements.floatingIcons.forEach(icon => {
                const speed = parseFloat(icon.getAttribute('data-speed')) || CONFIG.speeds.middle;
                const direction = parseInt(icon.getAttribute('data-direction')) || 1;
                
                let y = limitedScrollY * speed * direction;
                let x = Math.cos(progress * Math.PI * 2) * 40 * speed * direction;
                
                if (icon.classList.contains('reverse-move')) {
                    y = limitedScrollY * CONFIG.speeds.reverse;
                    x = Math.sin(progress * Math.PI) * 50;
                    icon.style.transform = `translate(${x}px, ${y}px) rotate(${progress * 15}deg)`;
                } else {
                    icon.style.transform = `translate(${x}px, ${y}px)`;
                }
            });
        }
        
        if (elements.layers.front) {
            const frontOffset = limitedScrollY * CONFIG.speeds.front;
            elements.layers.front.style.transform = `translateY(${frontOffset}px)`;
            
            if (elements.title) {
                const titleSpeed = parseFloat(elements.title.getAttribute('data-speed')) || CONFIG.speeds.front;
                const titleOffset = limitedScrollY * titleSpeed * 0.5;
                elements.title.style.transform = `translateY(${titleOffset}px)`;
            }
            
            elements.parallaxCards.forEach((card, index) => {
                const cardSpeed = parseFloat(card.getAttribute('data-speed')) || CONFIG.speeds.front;
                const delay = index * 0.1;
                const cardOffset = limitedScrollY * cardSpeed * (1 - delay);
                const cardTilt = progress * 2;
                
                card.style.transform = `
                    translateY(${cardOffset}px)
                    rotateX(${cardTilt}deg)
                    rotateY(${progress * 1}deg)
                `;
                
                const shadowY = 10 + Math.abs(limitedScrollY) * 0.1;
                const shadowBlur = 15 + Math.abs(limitedScrollY) * 0.2;
                card.style.boxShadow = `
                    0 ${shadowY}px ${shadowBlur}px rgba(0, 0, 0, 0.3),
                    0 0 0 1px rgba(93, 93, 255, ${0.1 + Math.abs(progress) * 0.2})
                `;
            });
        }
        
        if (elements.layers.back) {
            const blur = Math.abs(progress) * 3;
            elements.layers.back.style.filter = `blur(${blur}px)`;
        }
        
        if (elements.layers.middle) {
            const blur = Math.abs(progress) * 1.5;
            elements.layers.middle.style.filter = `blur(${blur}px)`;
        }
    }

    function startAnimation() {
        if (!CONFIG.useRAF) return;
        
        function animate() {
            updateParallax();
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
            targetScrollY = window.scrollY;
            
            if (!ticking) {
                if (CONFIG.useRAF) {
                    requestAnimationFrame(() => {
                        updateParallax();
                        ticking = false;
                    });
                } else {
                    setTimeout(() => {
                        updateParallax();
                        ticking = false;
                    }, CONFIG.throttleDelay);
                }
                ticking = true;
            }
        }, { passive: true });
        
        window.addEventListener('resize', () => {
            scrollY = window.scrollY;
            targetScrollY = scrollY;
            updateParallax();
        });
        
        elements.floatingIcons.forEach(icon => {
            icon.style.pointerEvents = 'auto';
            icon.style.cursor = 'pointer';
            
            icon.addEventListener('click', () => {
                icon.style.transform += ' scale(0.9)';
                icon.style.transition = 'transform 0.2s ease';
                
                setTimeout(() => {
                    icon.style.transition = '';
                    icon.style.transform = icon.style.transform.replace(' scale(0.9)', '');
                }, 200);
                
                const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                icon.style.color = randomColor;
                icon.style.borderColor = randomColor + '50';
            });
        });
        
        elements.parallaxCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.zIndex = '100';
                card.style.transition = 'all 0.3s ease';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.zIndex = '';
                card.style.transition = '';
            });
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                elements.section.classList.toggle('debug-mode');
                console.log('Debug mode:', elements.section.classList.contains('debug-mode'));
            }
        });
    }
    
    window.parallaxController = {
        enable: () => {
            isEnabled = true;
            if (!rafId) startAnimation();
            console.log('Parallax enabled');
        },
        
        disable: () => {
            isEnabled = false;
            stopAnimation();
            console.log('Parallax disabled');
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
            updateParallax();
            console.log('Parallax reset');
        },
        
        debug: () => {
            console.log('Parallax Debug Info:');
            console.log('- Scroll Y:', scrollY);
            console.log('- Target Scroll Y:', targetScrollY);
            console.log('- Speeds:', CONFIG.speeds);
            console.log('- Enabled:', isEnabled);
            console.log('- RAF running:', !!rafId);
            
            elements.section.classList.toggle('debug-mode');
        }
    };
    
    if (document.readyState === 'complete') {
        init();
    } else {
        window.addEventListener('load', init);
    }
    
    setTimeout(init, 100);
});