document.addEventListener('DOMContentLoaded', function() {
    const CONFIG = {
        totalImages: 10,
        imageBasePath: '../assets/gallery/images/',
        soundBasePath: '../assets/gallery/sounds/',
        imageExtension: '.jpg', 
        soundExtension: '.mp3', 
        defaultVolume: 0.7,
        autoPlayInterval: 5000, 
        transitionDuration: 800 
    };
    
    const MEDIA_METADATA = {
        1: { 
            image: 'Nature Landscape', 
            sound: 'Forest Ambiance',
            color: '#10b981'
        },
        2: { 
            image: 'Ocean Waves', 
            sound: 'Ocean Sounds',
            color: '#0ea5e9'
        },
        3: { 
            image: 'City Skyline', 
            sound: 'City Traffic',
            color: '#8b5cf6'
        },
        4: { 
            image: 'Mountain View', 
            sound: 'Mountain Wind',
            color: '#f59e0b'
        },
        5: { 
            image: 'Waterfall', 
            sound: 'Water Flow',
            color: '#06b6d4'
        },
        6: { 
            image: 'Fireplace', 
            sound: 'Fire Crackling',
            color: '#ef4444'
        },
        7: { 
            image: 'Rainforest', 
            sound: 'Rain & Thunder',
            color: '#059669'
        },
        8: { 
            image: 'Desert', 
            sound: 'Desert Wind',
            color: '#d97706'
        },
        9: { 
            image: 'Aurora', 
            sound: 'Space Ambience',
            color: '#7c3aed'
        },
        10: { 
            image: 'Zen Garden', 
            sound: 'Meditation Bell',
            color: '#14b8a6'
        }
    };
    
    let currentIndex = 1;
    let isPlaying = false;
    let isAutoPlaying = false;
    let autoPlayTimer = null;
    let remainingTime = CONFIG.autoPlayInterval;
    let audioContext = null;
    let audioElement = null;
    let gainNode = null;
    let lastClickedElement = null;
    
    const elements = {
        mainImage: document.getElementById('galleryMainImage'),
        imageCounter: document.getElementById('imageCounter'),
        soundTitle: document.getElementById('soundTitle'),
        playPauseBtn: document.getElementById('playPauseBtn'),
        stopBtn: document.getElementById('stopBtn'),
        nextBtn: document.getElementById('nextBtn'),
        muteBtn: document.getElementById('muteBtn'),
        volumeSlider: document.getElementById('volumeSlider'),
        volumeValue: document.getElementById('volumeValue'),
        statusIndicator: document.getElementById('statusIndicator'),
        statusText: document.getElementById('statusText'),
        soundWave: document.getElementById('soundWave'),
        currentImageName: document.getElementById('currentImageName'),
        currentSoundName: document.getElementById('currentSoundName'),
        currentDuration: document.getElementById('currentDuration'),
        currentVolume: document.getElementById('currentVolume'),
        autoPlayBtn: document.getElementById('autoPlayBtn'),
        autoTimer: document.getElementById('autoTimer'),
        interactiveElements: document.querySelectorAll('.interactive-element')
    };
    
    function initAudio() {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            audioElement = new Audio();
            audioElement.crossOrigin = "anonymous";
            
            gainNode = audioContext.createGain();
            
            const source = audioContext.createMediaElementSource(audioElement);
            
            source.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            gainNode.gain.value = CONFIG.defaultVolume;
            updateVolumeDisplay();
            
            audioElement.addEventListener('play', () => updatePlayerState(true));
            audioElement.addEventListener('pause', () => updatePlayerState(false));
            audioElement.addEventListener('ended', handleAudioEnded);
            audioElement.addEventListener('timeupdate', updateDurationDisplay);
            audioElement.addEventListener('loadedmetadata', updateDurationDisplay);
            
            console.log('Audio system initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize audio:', error);
            audioElement = new Audio();
            audioElement.volume = CONFIG.defaultVolume;
        }
    }
    
    function getRandomIndex(excludeCurrent = true) {
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * CONFIG.totalImages) + 1;
        } while (excludeCurrent && newIndex === currentIndex && CONFIG.totalImages > 1);
        return newIndex;
    }
    
    async function loadMedia(imageIndex, soundIndex = null) {
        if (soundIndex === null) soundIndex = imageIndex;
        
        const imageUrl = `${CONFIG.imageBasePath}image${imageIndex}${CONFIG.imageExtension}`;
        const soundUrl = `${CONFIG.soundBasePath}sound${soundIndex}${CONFIG.soundExtension}`;
        
        currentIndex = imageIndex;
        
        if (audioElement && !audioElement.paused) {
            audioElement.pause();
        }
        
        await transitionImage(imageUrl);
        
        await loadSound(soundUrl);
        
        updateInterface(imageIndex, soundIndex);
        
        if (isPlaying) {
            playSound();
        }
        
        if (isAutoPlaying) {
            resetAutoPlayTimer();
        }
    }
    
    async function transitionImage(imageUrl) {
        return new Promise((resolve) => {
            const img = new Image();
            
            img.onload = () => {
                elements.mainImage.classList.add('fade-out');
                
                setTimeout(() => {
                    elements.mainImage.src = imageUrl;
                    elements.mainImage.alt = `Gallery Image ${currentIndex}`;
                    
                    elements.mainImage.classList.remove('fade-out');
                    elements.mainImage.classList.add('fade-in');
                    
                    setTimeout(() => {
                        elements.mainImage.classList.remove('fade-in');
                        resolve();
                    }, CONFIG.transitionDuration);
                    
                }, CONFIG.transitionDuration / 2);
            };
            
            img.onerror = () => {
                console.error(`Failed to load image: ${imageUrl}`);
                resolve();
            };
            
            img.src = imageUrl;
        });
    }
    
    async function loadSound(soundUrl) {
        return new Promise((resolve) => {
            if (!audioElement) {
                console.error('Audio element not initialized');
                resolve();
                return;
            }
            
            audioElement.src = soundUrl;
            audioElement.load();
            
            audioElement.oncanplaythrough = () => {
                console.log(`Sound loaded: ${soundUrl}`);
                resolve();
            };
            
            audioElement.onerror = () => {
                console.error(`Failed to load sound: ${soundUrl}`);
                const altUrl = soundUrl.replace('.mp3', '.ogg').replace('.wav', '.mp3');
                audioElement.src = altUrl;
                audioElement.load();
                resolve();
            };
        });
    }
    
    function updateInterface(imageIndex, soundIndex) {
        const metadata = MEDIA_METADATA[imageIndex] || MEDIA_METADATA[1];
        
        elements.imageCounter.textContent = `${imageIndex} / ${CONFIG.totalImages}`;
        elements.soundTitle.textContent = `Sound Effect: ${metadata.sound}`;
        
        elements.currentImageName.textContent = metadata.image;
        elements.currentSoundName.textContent = metadata.sound;
        elements.currentVolume.textContent = `${Math.round(getVolume() * 100)}%`;
        
        updateActiveElement(imageIndex);
        
        updateColorTheme(metadata.color);
    }
    
    function updateActiveElement(index) {
        elements.interactiveElements.forEach(el => {
            el.classList.remove('active');
        });
        
        const targetElement = document.querySelector(`[data-image="${index}"]`);
        if (targetElement) {
            targetElement.classList.add('active');
            lastClickedElement = targetElement;
            
            targetElement.classList.add('click-animation');
            setTimeout(() => {
                targetElement.classList.remove('click-animation');
            }, 300);
        }
    }
    
    function updateColorTheme(color) {
        document.documentElement.style.setProperty('--gallery-accent', color);
        
        const accentElements = document.querySelectorAll('.player-btn, .element-card');
        accentElements.forEach(el => {
            el.style.transition = 'background 0.5s ease';
            el.style.background = `linear-gradient(135deg, ${color}, ${darkenColor(color, 20)})`;
        });
    }
    
    function darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        
        return '#' + (
            0x1000000 +
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1);
    }
    
    function playSound() {
        if (!audioElement) {
            console.error('Audio element not available');
            return;
        }
        
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        audioElement.play().then(() => {
            isPlaying = true;
            updatePlayerState(true);
        }).catch(error => {
            console.error('Playback failed:', error);
            isPlaying = false;
            updatePlayerState(false);
        });
    }
    
    function pauseSound() {
        if (audioElement && !audioElement.paused) {
            audioElement.pause();
            isPlaying = false;
            updatePlayerState(false);
        }
    }
    
    function stopSound() {
        if (audioElement) {
            audioElement.pause();
            audioElement.currentTime = 0;
            isPlaying = false;
            updatePlayerState(false);
        }
    }
    
    function handleAudioEnded() {
        isPlaying = false;
        updatePlayerState(false);
        
        if (isAutoPlaying) {
            loadRandomMedia();
        }
    }
    
    function setVolume(value) {
        const volume = Math.min(Math.max(value, 0), 1);
        
        if (gainNode) {
            gainNode.gain.value = volume;
        } else if (audioElement) {
            audioElement.volume = volume;
        }
        
        updateVolumeDisplay();
    }
    
    function getVolume() {
        if (gainNode) {
            return gainNode.gain.value;
        } else if (audioElement) {
            return audioElement.volume;
        }
        return CONFIG.defaultVolume;
    }
    
    function toggleMute() {
        const isMuted = elements.muteBtn.classList.contains('muted');
        
        if (isMuted) {
            setVolume(parseInt(elements.volumeSlider.value) / 100);
            elements.muteBtn.classList.remove('muted');
            elements.muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        } else {
            setVolume(0);
            elements.muteBtn.classList.add('muted');
            elements.muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        }
    }
    
    function updateVolumeDisplay() {
        const volume = Math.round(getVolume() * 100);
        elements.volumeValue.textContent = `${volume}%`;
        elements.volumeSlider.value = volume;
        elements.volumeSlider.style.setProperty('--volume-percent', `${volume}%`);
        elements.currentVolume.textContent = `${volume}%`;
    }
    
    function updatePlayerState(playing) {
        isPlaying = playing;
        
        const playIcon = elements.playPauseBtn.querySelector('i');
        if (playing) {
            playIcon.className = 'fas fa-pause';
            elements.playPauseBtn.classList.add('playing');
            elements.statusText.textContent = 'Playing';
            elements.soundWave.classList.add('playing');
            elements.soundWave.classList.remove('paused');
        } else {
            playIcon.className = 'fas fa-play';
            elements.playPauseBtn.classList.remove('playing');
            elements.statusText.textContent = audioElement.currentTime > 0 ? 'Paused' : 'Stopped';
            elements.soundWave.classList.remove('playing');
            elements.soundWave.classList.add('paused');
        }
        
        const statusDot = elements.statusIndicator.querySelector('.status-dot');
        statusDot.className = 'status-dot';
        
        if (playing) {
            statusDot.classList.add('playing');
        } else if (audioElement && audioElement.currentTime > 0) {
            statusDot.classList.add('paused');
        } else {
            statusDot.classList.add('stopped');
        }
    }
    
    function updateDurationDisplay() {
        if (!audioElement || !audioElement.duration) return;
        
        const current = formatTime(audioElement.currentTime);
        const total = formatTime(audioElement.duration);
        elements.currentDuration.textContent = `${current} / ${total}`;
    }
    
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    function toggleAutoPlay() {
        isAutoPlaying = !isAutoPlaying;
        
        if (isAutoPlaying) {
            elements.autoPlayBtn.classList.add('active');
            elements.autoPlayBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Auto Play';
            startAutoPlayTimer();
            loadRandomMedia();
        } else {
            elements.autoPlayBtn.classList.remove('active');
            elements.autoPlayBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Auto Play (5s)';
            stopAutoPlayTimer();
        }
    }
    
    function startAutoPlayTimer() {
        if (autoPlayTimer) clearInterval(autoPlayTimer);
        
        remainingTime = CONFIG.autoPlayInterval;
        updateTimerDisplay();
        
        autoPlayTimer = setInterval(() => {
            remainingTime -= 1000;
            updateTimerDisplay();
            
            if (remainingTime <= 0) {
                loadRandomMedia();
                remainingTime = CONFIG.autoPlayInterval;
            }
        }, 1000);
    }
    
    function stopAutoPlayTimer() {
        if (autoPlayTimer) {
            clearInterval(autoPlayTimer);
            autoPlayTimer = null;
        }
        elements.autoTimer.textContent = 'Next in: 0s';
    }
    
    function resetAutoPlayTimer() {
        if (isAutoPlaying) {
            remainingTime = CONFIG.autoPlayInterval;
            updateTimerDisplay();
        }
    }
    
    function updateTimerDisplay() {
        elements.autoTimer.textContent = `Next in: ${remainingTime / 1000}s`;
    }
    
    function loadRandomMedia() {
        const randomIndex = getRandomIndex();
        loadMedia(randomIndex);
    }
    
    function setupEventListeners() {
        elements.playPauseBtn.addEventListener('click', () => {
            if (isPlaying) {
                pauseSound();
            } else {
                playSound();
            }
        });
        
        elements.stopBtn.addEventListener('click', stopSound);
        
        elements.nextBtn.addEventListener('click', loadRandomMedia);
        
        elements.muteBtn.addEventListener('click', toggleMute);
        
        elements.volumeSlider.addEventListener('input', (e) => {
            const volume = parseInt(e.target.value) / 100;
            setVolume(volume);
            
            if (volume === 0) {
                elements.muteBtn.classList.add('muted');
                elements.muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            } else {
                elements.muteBtn.classList.remove('muted');
                elements.muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            }
        });
        
        elements.autoPlayBtn.addEventListener('click', toggleAutoPlay);
        
        elements.interactiveElements.forEach(element => {
            element.addEventListener('click', (e) => {
                const imageIndex = parseInt(element.getAttribute('data-image'));
                const soundIndex = parseInt(element.getAttribute('data-sound'));
                
                loadMedia(imageIndex, soundIndex);
                
                if (!isPlaying) {
                    playSound();
                }
            });
            
            element.addEventListener('mouseenter', () => {
                if (element !== lastClickedElement) {
                    element.style.transform = 'translateY(-5px) scale(1.05)';
                }
            });
            
            element.addEventListener('mouseleave', () => {
                if (element !== lastClickedElement) {
                    element.style.transform = '';
                }
            });
        });
        
        document.addEventListener('keydown', (e) => {
            switch(e.key.toLowerCase()) {
                case ' ':
                case 'p':
                    e.preventDefault();
                    if (isPlaying) pauseSound();
                    else playSound();
                    break;
                case 's':
                    e.preventDefault();
                    stopSound();
                    break;
                case 'n':
                case 'arrowright':
                    e.preventDefault();
                    loadRandomMedia();
                    break;
                case 'm':
                    e.preventDefault();
                    toggleMute();
                    break;
                case 'a':
                    e.preventDefault();
                    toggleAutoPlay();
                    break;
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                case '8':
                case '9':
                    e.preventDefault();
                    const num = parseInt(e.key);
                    if (num <= CONFIG.totalImages) {
                        loadMedia(num);
                    }
                    break;
                case '0':
                    e.preventDefault();
                    if (CONFIG.totalImages >= 10) {
                        loadMedia(10);
                    }
                    break;
            }
        });
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && isPlaying) {
                pauseSound();
            }
        });
    }
    
    function initGallery() {
        console.log('Initializing Interactive Gallery...');
        
        initAudio();
        
        setupEventListeners();
        
        loadMedia(1).then(() => {
            console.log('Gallery initialized successfully');
            
            setTimeout(() => {
                console.log('Keyboard shortcuts:');
                console.log('Space/P - Play/Pause');
                console.log('S - Stop');
                console.log('N/Right Arrow - Next random');
                console.log('M - Mute/Unmute');
                console.log('A - Toggle autoplay');
                console.log('1-0 - Select specific media');
            }, 1000);
        });
    }
    
    window.gallery = {
        play: playSound,
        pause: pauseSound,
        stop: stopSound,
        next: loadRandomMedia,
        loadMedia: loadMedia,
        toggleAutoPlay: toggleAutoPlay,
        setVolume: setVolume,
        getVolume: getVolume,
        toggleMute: toggleMute,
        isPlaying: () => isPlaying,
        isAutoPlaying: () => isAutoPlaying
    };
    
    initGallery();
});