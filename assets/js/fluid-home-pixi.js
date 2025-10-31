class FluidHomePixi {
    constructor(canvasElement, imageSrc) {
        this.canvas = canvasElement;
        this.imageSrc = imageSrc;
        this.mousePos = { x: -1000, y: -1000 };
        this.app = null;
        this.sprite = null;
        this.swirlSprite = null;
        this.displacementFilter = null;
        this.isInitialized = false;
        // Mobile detection
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                        (window.matchMedia && window.matchMedia("(max-width: 768px)").matches) ||
                        ('ontouchstart' in window);
        this.init();
    }

    init() {
        // Check if screen is smaller than 10cm (800px) - hide on small screens
        const isSmallScreen = window.innerWidth <= 800;
        
        if (isSmallScreen) {
            // Don't initialize on small screens - GM logo will be shown instead
            this.canvas.style.display = 'none';
            return;
        }
        
        const parent = this.canvas.parentElement;
        const rect = parent.getBoundingClientRect();
        
        // Mobile optimization: lower resolution and performance settings
        const maxResolution = this.isMobile ? 1 : 1.5;
        
        // Create PixiJS Application with WebGL
        this.app = new PIXI.Application({
            view: this.canvas,
            width: rect.width,
            height: rect.height,
            backgroundColor: 0x000000,
            backgroundAlpha: 0,
            antialias: !this.isMobile, // Disable on mobile for performance
            resolution: Math.min(window.devicePixelRatio || 1, maxResolution),
            autoDensity: true,
            powerPreference: this.isMobile ? 'default' : 'high-performance',
        });

        this.loadImage();
        this.setupEventListeners();
    }

    loadImage() {
        const texture = PIXI.Texture.from(this.imageSrc);
        
        texture.baseTexture.on('loaded', () => {
            if (this.isInitialized) return;
            this.isInitialized = true;
            this.createDisplacementEffect(texture);
        });
    }

    createDisplacementEffect(texture) {
        const w = this.app.screen.width;
        const h = this.app.screen.height;
        
        // Create main sprite (sharp)
        this.sprite = new PIXI.Sprite(texture);
        const scale = Math.min(w / this.sprite.width, h / this.sprite.height) * 1.16;
        this.sprite.scale.set(scale);
        this.sprite.x = (w - this.sprite.width) / 2;
        this.sprite.y = (h - this.sprite.height) / 2;
        this.app.stage.addChild(this.sprite);
        
        // Create swirl displacement sprite
        this.createSwirlDisplacement();
        
        this.animate();
    }
    
    createSwirlDisplacement() {
        // Create a canvas with a spiral displacement map
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Create spiral/vortex pattern
        const centerX = size / 2;
        const centerY = size / 2;
        const imageData = ctx.createImageData(size, size);
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxDistance = size / 2;
                
                if (distance < maxDistance) {
                    // Calculate angle and swirl
                    const angle = Math.atan2(dy, dx);
                    const swirl = (1 - distance / maxDistance) * Math.PI * 2; // Stronger swirl at center
                    
                    // Calculate displacement direction
                    const displaceAngle = angle + swirl;
                    const strength = (1 - distance / maxDistance) * 128; // 0-128 displacement
                    
                    const i = (y * size + x) * 4;
                    imageData.data[i] = 128 + Math.cos(displaceAngle) * strength; // R channel
                    imageData.data[i + 1] = 128 + Math.sin(displaceAngle) * strength; // G channel
                    imageData.data[i + 2] = 0; // B channel
                    imageData.data[i + 3] = 255 - (distance / maxDistance) * 255; // Alpha (fade at edges)
                } else {
                    const i = (y * size + x) * 4;
                    imageData.data[i] = 128;
                    imageData.data[i + 1] = 128;
                    imageData.data[i + 2] = 0;
                    imageData.data[i + 3] = 0;
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Create sprite from canvas
        const swirlTexture = PIXI.Texture.from(canvas);
        this.swirlSprite = new PIXI.Sprite(swirlTexture);
        this.swirlSprite.anchor.set(0.5);
        this.swirlSprite.scale.set(0.8);
        this.swirlSprite.alpha = 0; // Start invisible
        
        // Create displacement filter
        this.displacementFilter = new PIXI.filters.DisplacementFilter(this.swirlSprite);
        this.displacementFilter.scale.x = 0;
        this.displacementFilter.scale.y = 0;
        
        this.sprite.filters = [this.displacementFilter];
        this.app.stage.addChild(this.swirlSprite);
    }

    setupEventListeners() {
        const handlePointerMove = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const mx = clientX - rect.left;
            const my = clientY - rect.top;
            
            // Check if pointer is within sprite bounds
            if (this.sprite) {
                const spriteBounds = this.sprite.getBounds();
                if (mx >= spriteBounds.x && mx <= spriteBounds.x + spriteBounds.width &&
                    my >= spriteBounds.y && my <= spriteBounds.y + spriteBounds.height) {
                    this.mousePos.x = mx;
                    this.mousePos.y = my;
                } else {
                    this.mousePos.x = -1000;
                    this.mousePos.y = -1000;
                }
            }
        };

        const handlePointerLeave = () => {
            this.mousePos.x = -1000;
            this.mousePos.y = -1000;
        };

        // Support both mouse and touch events
        // Mobile: disable all interactions to allow scrolling
        if (this.isMobile) {
            // Mobile: completely disable touch events - let scrolling work naturally
            // Don't add any touch event listeners on mobile - canvas has pointer-events: none
            // This ensures scrolling is never blocked
        } else {
            this.canvas.addEventListener('mousemove', handlePointerMove);
            this.canvas.addEventListener('mouseleave', handlePointerLeave);
        }

        // Add resize and scroll listeners (mobile fix for disappearing image)
        let resizeTimeout;
        let scrollTimeout;
        let lastScrollY = window.scrollY;
        
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        };
        
        window.addEventListener('resize', handleResize);
        // Mobile: handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleResize(), 500);
        });
        
        // Fix for disappearing image on scroll (mobile issue)
        // Mobile: more aggressive resize and re-centering on scroll
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const parent = this.canvas.parentElement;
                if (parent) {
                    const rect = parent.getBoundingClientRect();
                    // Mobile: always update on scroll to prevent disappearing
                    if (rect.width > 0 && rect.height > 0 && this.app) {
                        const currentScrollY = window.scrollY;
                        // Mobile: update more frequently (every scroll) to prevent disappearing
                        const shouldUpdate = this.isMobile ? 
                            true : // Mobile: always update
                            (Math.abs(currentScrollY - lastScrollY) > 50 || 
                             this.app.screen.width !== rect.width || 
                             this.app.screen.height !== rect.height);
                        
                        if (shouldUpdate) {
                            this.app.renderer.resize(rect.width, rect.height);
                            // Re-center sprite if it exists
                            if (this.sprite && this.isInitialized) {
                                const w = this.app.screen.width;
                                const h = this.app.screen.height;
                                const scale = Math.min(w / this.sprite.texture.width, h / this.sprite.texture.height) * 1.16;
                                this.sprite.scale.set(scale);
                                this.sprite.x = (w - this.sprite.width) / 2;
                                this.sprite.y = (h - this.sprite.height) / 2;
                                
                                // Mobile: ensure displacement filter scale is zero
                                if (this.isMobile && this.displacementFilter) {
                                    this.displacementFilter.scale.x = 0;
                                    this.displacementFilter.scale.y = 0;
                                }
                            }
                            lastScrollY = currentScrollY;
                        }
                    }
                }
            }, this.isMobile ? 50 : 100); // Faster update on mobile
        }, { passive: true });
    }

    handleResize() {
        const parent = this.canvas.parentElement;
        const rect = parent.getBoundingClientRect();
        
        if (rect.width > 0 && rect.height > 0) {
            this.app.renderer.resize(rect.width, rect.height);
            
            // Clear and reinitialize
            if (this.sprite) {
                this.app.stage.removeChild(this.sprite);
                this.sprite = null;
            }
            if (this.swirlSprite) {
                this.app.stage.removeChild(this.swirlSprite);
                this.swirlSprite = null;
            }
            this.isInitialized = false;
            
            this.loadImage();
        }
    }

    animate() {
        this.app.ticker.add(() => {
            // Completely disable swirl effect on all devices to prevent scroll blocking
            // The swirl animation causes scroll blocking issues on live server and mobile
            if (this.displacementFilter) {
                this.displacementFilter.scale.x = 0;
                this.displacementFilter.scale.y = 0;
            }
            
            // Swirl effect disabled - keeping code commented for reference
            /*
            // Mobile: completely disable swirl effect to prevent scroll blocking
            if (this.isMobile) {
                // On mobile, keep displacement at zero - no swirl effect
                if (this.displacementFilter) {
                    this.displacementFilter.scale.x = 0;
                    this.displacementFilter.scale.y = 0;
                }
                return; // Skip all swirl animation on mobile
            }
            
            // Desktop: Update swirl position and intensity
            if (this.swirlSprite && this.displacementFilter) {
                if (this.mousePos.x > -500) {
                    // Desktop swirl effect
                    const moveSpeed = 0.15;
                    const targetScale = 30;
                    const scaleSpeed = 0.1;
                    
                    // Move swirl to pointer position
                    this.swirlSprite.x += (this.mousePos.x - this.swirlSprite.x) * moveSpeed;
                    this.swirlSprite.y += (this.mousePos.y - this.swirlSprite.y) * moveSpeed;
                    
                    // Fade in displacement
                    this.displacementFilter.scale.x += (targetScale - this.displacementFilter.scale.x) * scaleSpeed;
                    this.displacementFilter.scale.y += (targetScale - this.displacementFilter.scale.y) * scaleSpeed;
                    
                    // Rotate the swirl for animated effect
                    this.swirlSprite.rotation += 0.05;
                } else {
                    // Fade out displacement when pointer leaves
                    this.displacementFilter.scale.x *= 0.9;
                    this.displacementFilter.scale.y *= 0.9;
                }
            }
            */
        });
    }

    destroy() {
        if (this.app) {
            this.app.destroy(true, { children: true, texture: true, baseTexture: true });
        }
    }
}

// Initialize when DOM is loaded (prevent duplicate initialization)
document.addEventListener('DOMContentLoaded', () => {
    const homeCanvas = document.getElementById('fluidHomeCanvas');
    if (homeCanvas && !window.fluidHomePixiInstance && !homeCanvas.dataset.initialized) {
        // Check if screen is smaller than 10cm (800px)
        const isSmallScreen = window.innerWidth <= 800;
        
        if (!isSmallScreen) {
            // Only initialize on larger screens
            homeCanvas.dataset.initialized = 'true';
            const imagePath = '../assets/images/me.png?' + Date.now();
            window.fluidHomePixiInstance = new FluidHomePixi(homeCanvas, imagePath);
        }
    }
    
    // Initialize GM logo for small screens (< 10cm/800px)
    const gmLogoCanvas = document.getElementById('heroGmLogoCanvas');
    if (gmLogoCanvas && !window.heroGmLogoInstance && !gmLogoCanvas.dataset.initialized) {
        const isSmallScreen = window.innerWidth <= 800;
        
        if (isSmallScreen) {
            // Create GM logo particle effect for mobile
            gmLogoCanvas.dataset.initialized = 'true';
            const gmLogoPath = '../assets/images/logo.png?' + Date.now();
            window.heroGmLogoInstance = new FluidLogoPixi(gmLogoCanvas, gmLogoPath);
        }
    }
    
    // Handle window resize - switch between home image and GM logo
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const isSmallScreen = window.innerWidth <= 800;
            const homeCanvas = document.getElementById('fluidHomeCanvas');
            const gmLogoCanvas = document.getElementById('heroGmLogoCanvas');
            
            if (isSmallScreen) {
                // Small screen: hide home canvas, show GM logo
                if (homeCanvas && window.fluidHomePixiInstance) {
                    window.fluidHomePixiInstance.destroy();
                    window.fluidHomePixiInstance = null;
                    homeCanvas.style.display = 'none';
                }
                if (gmLogoCanvas && !window.heroGmLogoInstance && !gmLogoCanvas.dataset.initialized) {
                    gmLogoCanvas.dataset.initialized = 'true';
                    const gmLogoPath = '../assets/images/logo.png?' + Date.now();
                    window.heroGmLogoInstance = new FluidLogoPixi(gmLogoCanvas, gmLogoPath);
                }
            } else {
                // Large screen: show home canvas, hide GM logo
                if (gmLogoCanvas && window.heroGmLogoInstance) {
                    window.heroGmLogoInstance.destroy();
                    window.heroGmLogoInstance = null;
                    gmLogoCanvas.style.display = 'none';
                }
                if (homeCanvas && !window.fluidHomePixiInstance && !homeCanvas.dataset.initialized) {
                    homeCanvas.dataset.initialized = 'true';
                    const imagePath = '../assets/images/me.png?' + Date.now();
                    window.fluidHomePixiInstance = new FluidHomePixi(homeCanvas, imagePath);
                }
            }
        }, 250);
    });
});
