class UnsplashGallery {
    constructor() {
        this.API_KEY = 'xCQgIul9J5ppK63cmh_3d6L5I_jVRBk1XBEBumQ6NZA'; 
        this.BASE_URL = 'https://api.unsplash.com';
        this.currentPage = 1;
        this.currentQuery = '';
        this.currentSort = 'relevant';
        this.currentColor = '';
        this.isLoading = false;
        
        this.initializeApp();
    }

    initializeApp() {
        this.setCurrentYear();
        this.setupEventListeners();
        this.focusSearchInput();
        this.loadInitialPhotos();
    }

    setCurrentYear() {
        document.getElementById('current-year').textContent = new Date().getFullYear();
    }

    setupEventListeners() {
        const searchInput = document.querySelector('.search__input');
        const searchButton = document.querySelector('.search__button');
        const clearButton = document.querySelector('.search__clear');
        const sortFilter = document.getElementById('sort-filter');
        const colorFilter = document.getElementById('color-filter');

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });

        searchButton.addEventListener('click', () => this.handleSearch());
        clearButton.addEventListener('click', () => this.clearSearch());
        sortFilter.addEventListener('change', () => this.handleFilterChange());
        colorFilter.addEventListener('change', () => this.handleFilterChange());

        window.addEventListener('scroll', () => this.handleScroll());
    }

    focusSearchInput() {
        document.querySelector('.search__input').focus();
    }

    async loadInitialPhotos() {
        try {
            this.showLoading();
            const photos = await this.fetchPhotos('nature', 1, 12);
            this.displayPhotos(photos);
        } catch (error) {
            this.showError('Ошибка при загрузке изображений');
        }
    }

    async handleSearch() {
        const query = document.querySelector('.search__input').value.trim();
        
        if (query === '') return;
        
        this.currentQuery = query;
        this.currentPage = 1;
        
        try {
            this.showLoading();
            const photos = await this.fetchPhotos(query, 1, 12, this.currentSort, this.currentColor);
            
            if (photos.length === 0) {
                this.showNoResults();
            } else {
                this.displayPhotos(photos);
            }
        } catch (error) {
            this.showError('Ошибка при поиске изображений');
        }
    }

    clearSearch() {
        const searchInput = document.querySelector('.search__input');
        searchInput.value = '';
        searchInput.focus();
        this.currentQuery = '';
        this.currentPage = 1;
        this.loadInitialPhotos();
    }

    handleFilterChange() {
        const sortFilter = document.getElementById('sort-filter');
        const colorFilter = document.getElementById('color-filter');
        
        this.currentSort = sortFilter.value;
        this.currentColor = colorFilter.value;
        
        if (this.currentQuery) {
            this.currentPage = 1;
            this.handleSearch();
        }
    }

    async handleScroll() {
        if (this.isLoading) return;
        
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        const isBottom = scrollTop + clientHeight >= scrollHeight - 100;
        
        if (isBottom) {
            this.currentPage++;
            await this.loadMorePhotos();
        }
    }

    async loadMorePhotos() {
        if (!this.currentQuery) return;
        
        this.isLoading = true;
        
        try {
            const photos = await this.fetchPhotos(
                this.currentQuery, 
                this.currentPage, 
                12, 
                this.currentSort, 
                this.currentColor
            );
            
            if (photos.length > 0) {
                this.appendPhotos(photos);
            }
        } catch (error) {
            console.error('Ошибка при загрузке дополнительных фото:', error);
        } finally {
            this.isLoading = false;
        }
    }

    async fetchPhotos(query, page = 1, perPage = 12, orderBy = 'relevant', color = '') {
        const url = new URL(`${this.BASE_URL}/search/photos`);
        url.searchParams.append('query', query);
        url.searchParams.append('page', page);
        url.searchParams.append('per_page', perPage);
        url.searchParams.append('order_by', orderBy);
        
        if (color) {
            url.searchParams.append('color', color);
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Client-ID ${this.API_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.results;
    }

    displayPhotos(photos) {
        const gallery = document.getElementById('gallery');
        gallery.innerHTML = '';
        
        if (photos.length === 0) {
            this.showNoResults();
            return;
        }
        
        photos.forEach(photo => {
            gallery.appendChild(this.createPhotoCard(photo));
        });
    }

    appendPhotos(photos) {
        const gallery = document.getElementById('gallery');
        
        photos.forEach(photo => {
            gallery.appendChild(this.createPhotoCard(photo));
        });
    }

    createPhotoCard(photo) {
        const card = document.createElement('div');
        card.className = 'photo-card';
        
        card.innerHTML = `
            <img 
                src="${photo.urls.regular}" 
                alt="${photo.alt_description || 'Unsplash photo'}" 
                class="photo-card__image"
                loading="lazy"
            >
            <div class="photo-card__info">
                <h3 class="photo-card__title">${photo.description || 'Без названия'}</h3>
                <div class="photo-card__author">
                    <img 
                        src="${photo.user.profile_image.small}" 
                        alt="${photo.user.name}" 
                        class="photo-card__author-avatar"
                    >
                    ${photo.user.name}
                </div>
                <div class="photo-card__meta">
                    <span>${new Date(photo.created_at).getFullYear()}</span>
                    <span class="photo-card__likes">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                        ${photo.likes}
                    </span>
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            window.open(photo.links.html, '_blank');
        });
        
        return card;
    }

    showLoading() {
        const gallery = document.getElementById('gallery');
        gallery.innerHTML = `
            <div class="loading">
                <div class="loading__spinner"></div>
                <p class="loading__text">Загрузка изображений...</p>
            </div>
        `;
    }

    showNoResults() {
        const gallery = document.getElementById('gallery');
        gallery.innerHTML = `
            <div class="no-results">
                <div class="no-results__icon">🔍</div>
                <p class="no-results__text">По вашему запросу ничего не найдено</p>
                <p class="no-results__subtext">Попробуйте изменить поисковый запрос или фильтры</p>
            </div>
        `;
    }

    showError(message) {
        const gallery = document.getElementById('gallery');
        gallery.innerHTML = `
            <div class="no-results">
                <div class="no-results__icon">❌</div>
                <p class="no-results__text">${message}</p>
                <p class="no-results__subtext">Попробуйте обновить страницу</p>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new UnsplashGallery();
});