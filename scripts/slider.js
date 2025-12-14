class TestimonialsSlider {
    constructor(containerSelector, options = {}) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) return;
        
        this.options = {
            slidesToShow: 1,
            showControls: true,
            infinite: false,
            ...options
        };
        
        this.slides = [];
        this.currentSlide = 0;
        this.slidesCount = 0;
        this.isAnimating = false;
        
        this.touchStartX = 0;
        this.touchEndX = 0;
        
        this.init();
    }
    
    init() {
        const testimonialsGrid = this.container.querySelector('.testimonials-grid');
        if (!testimonialsGrid) return;
        
        this.originalGrid = testimonialsGrid;
        
        this.slides = Array.from(testimonialsGrid.children);
        this.slidesCount = this.slides.length;
        
        testimonialsGrid.style.display = 'none';
        
        this.createSliderStructure();
        
        this.setupResponsive();
        
        this.updateSlider();
        
        this.addEventListeners();
    }
    
    createSliderStructure() {
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'testimonials-slider';
        
        const slidesWrapper = document.createElement('div');
        slidesWrapper.className = 'slider-container';
        
        this.slides.forEach((slide, index) => {
            const slideContainer = document.createElement('div');
            slideContainer.className = `testimonial-slide ${index === 0 ? 'slide-active' : ''}`;
            slideContainer.dataset.index = index;
            slideContainer.appendChild(slide.cloneNode(true));
            slidesWrapper.appendChild(slideContainer);
        });
        
        sliderContainer.appendChild(slidesWrapper);
        
        if (this.options.showControls && this.slidesCount > this.options.slidesToShow) {
            const controlsContainer = document.createElement('div');
            controlsContainer.className = 'slider-controls';
            
            const prevBtn = document.createElement('button');
            prevBtn.className = 'slider-btn slider-prev';
            prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
            prevBtn.setAttribute('aria-label', 'Previous slide');
            controlsContainer.appendChild(prevBtn);
            
            const nextBtn = document.createElement('button');
            nextBtn.className = 'slider-btn slider-next';
            nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
            nextBtn.setAttribute('aria-label', 'Next slide');
            controlsContainer.appendChild(nextBtn);
            
            sliderContainer.appendChild(controlsContainer);
        }
        
        const originalGridParent = this.originalGrid.parentNode;
        originalGridParent.insertBefore(sliderContainer, this.originalGrid.nextSibling);
        
        this.sliderContainer = sliderContainer;
        this.slidesWrapper = slidesWrapper;
        this.slidesElements = Array.from(slidesWrapper.children);
    }
    
    setupResponsive() {
        const updateSlidesToShow = () => {
            const oldSlidesToShow = this.options.slidesToShow;
            
            if (window.innerWidth >= 1024) {
                this.options.slidesToShow = Math.min(3, this.slidesCount);
            } else if (window.innerWidth >= 768) {
                this.options.slidesToShow = Math.min(2, this.slidesCount);
            } else {
                this.options.slidesToShow = 1;
            }
            
            if (this.slidesWrapper && oldSlidesToShow !== this.options.slidesToShow) {
                this.currentSlide = 0; 
                this.updateSlider();
            }
        };
        
        updateSlidesToShow();
        
        window.addEventListener('resize', updateSlidesToShow);
    }
    
    updateSlider() {
        if (!this.slidesWrapper || this.isAnimating) return;
        
        this.isAnimating = true;
        
        const maxSlide = Math.max(0, this.slidesCount - this.options.slidesToShow);
        this.currentSlide = Math.min(this.currentSlide, maxSlide);
        
        const slideWidth = 100 / this.options.slidesToShow;
        const transformValue = -this.currentSlide * slideWidth;
        
        this.slidesWrapper.style.transform = `translateX(${transformValue}%)`;
        
        this.slidesElements.forEach((slide, index) => {
            slide.classList.remove('slide-active');
            if (index >= this.currentSlide && index < this.currentSlide + this.options.slidesToShow) {
                slide.classList.add('slide-active');
            }
        });
        
        this.updateButtons();
        
        setTimeout(() => {
            this.isAnimating = false;
        }, 500);
    }
    
    updateButtons() {
        const prevBtn = this.sliderContainer?.querySelector('.slider-prev');
        const nextBtn = this.sliderContainer?.querySelector('.slider-next');
        
        if (prevBtn) {
            prevBtn.disabled = !this.options.infinite && this.currentSlide === 0;
        }
        
        if (nextBtn) {
            const maxSlide = Math.max(0, this.slidesCount - this.options.slidesToShow);
            nextBtn.disabled = !this.options.infinite && this.currentSlide >= maxSlide;
        }
    }
    
    nextSlide() {
        if (this.isAnimating) return;
        
        const maxSlide = Math.max(0, this.slidesCount - this.options.slidesToShow);
        
        if (this.currentSlide < maxSlide) {
            this.currentSlide++;
        } else if (this.options.infinite) {
            this.currentSlide = 0;
        }
        
        this.updateSlider();
    }
    
    prevSlide() {
        if (this.isAnimating) return;
        
        if (this.currentSlide > 0) {
            this.currentSlide--;
        } else if (this.options.infinite) {
            const maxSlide = Math.max(0, this.slidesCount - this.options.slidesToShow);
            this.currentSlide = maxSlide;
        }
        
        this.updateSlider();
    }
    
    addEventListeners() {
        const prevBtn = this.sliderContainer?.querySelector('.slider-prev');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prevSlide());
        }
        
        const nextBtn = this.sliderContainer?.querySelector('.slider-next');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextSlide());
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.prevSlide();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextSlide();
                    break;
            }
        });
        
        this.sliderContainer?.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        this.sliderContainer?.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        }, { passive: true });
    }
    
    handleSwipe() {
        const minSwipeDistance = 50;
        const swipeDistance = this.touchEndX - this.touchStartX;
        
        if (Math.abs(swipeDistance) > minSwipeDistance) {
            if (swipeDistance > 0) {
                this.prevSlide();
            } else {
                this.nextSlide();
            }
        }
    }
    
    destroy() {
        const prevBtn = this.sliderContainer?.querySelector('.slider-prev');
        const nextBtn = this.sliderContainer?.querySelector('.slider-next');
        
        prevBtn?.removeEventListener('click', () => this.prevSlide());
        nextBtn?.removeEventListener('click', () => this.nextSlide());
        
        if (this.originalGrid) {
            this.originalGrid.style.display = 'grid';
        }
        
        this.sliderContainer?.remove();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const testimonialsSection = document.querySelector('.testimonials .container');
    if (testimonialsSection) {
        window.testimonialsSlider = new TestimonialsSlider('.testimonials .container', {
            showControls: true,
            infinite: false
        });
    } else {
        const testimonialsSectionAlt = document.querySelector('.testimonials');
        if (testimonialsSectionAlt) {
            window.testimonialsSlider = new TestimonialsSlider('.testimonials', {
                showControls: true,
                infinite: false
            });
        }
    }
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TestimonialsSlider;
}