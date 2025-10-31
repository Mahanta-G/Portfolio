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
        // Always initialize - keep home image visible on all screens
        // Only animations are disabled on small screens (< 8cm = 320px)
        const parent = this.canvas.parentElement;
        if (!parent) {
            // Retry if parent not ready
            setTimeout(() => this.init(), 100);
            return;
        }
        
        const rect = parent.getBoundingClientRect();
        
        // Ensure canvas is visible - CRITICAL for responsiveness test
        this.canvas.style.display = 'block';
        this.canvas.style.visibility = 'visible';
        this.canvas.style.opacity = '1';
        this.canvas.style.position = 'relative';
        
        // CRITICAL: Ensure touch scrolling works on mobile
        // Set canvas to not capture touch events - let scrolling work naturally
        this.canvas.setAttribute('style', 
            this.canvas.getAttribute('style') + 
            '; pointer-events: none !important; ' +
            'touch-action: pan-y pan-x pinch-zoom !important; ' +
            'display: block !important; visibility: visible !important; opacity: 1 !important;'
        );
        
        // Also set parent container
        const container = this.canvas.parentElement;
        if (container) {
            container.style.pointerEvents = 'none';
            container.style.touchAction = 'pan-y pan-x pinch-zoom';
        }
        
        // Mobile optimization: lower resolution and performance settings
        const maxResolution = this.isMobile ? 1 : 1.5;
        
        // Create PixiJS Application with WebGL
        this.app = new PIXI.Application({
            view: this.canvas,
            width: rect.width || 600, // Fallback if rect is 0
            height: rect.height || 600, // Fallback if rect is 0
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
        
        // Handle loading and errors
        texture.baseTexture.on('loaded', () => {
            if (this.isInitialized) return;
            this.isInitialized = true;
            // Ensure canvas is visible before creating effect
            if (this.canvas) {
                this.canvas.style.display = 'block';
                this.canvas.style.visibility = 'visible';
                this.canvas.style.opacity = '1';
            }
            this.createDisplacementEffect(texture);
        });
        
        // Handle errors - ensure image still shows fallback
        texture.baseTexture.on('error', () => {
            console.warn('Failed to load home image, retrying...');
            // Retry after delay
            setTimeout(() => {
                if (!this.isInitialized) {
                    this.loadImage();
                }
            }, 1000);
        });
        
        // Also check if already loaded
        if (texture.baseTexture.valid) {
            if (!this.isInitialized) {
                this.isInitialized = true;
                if (this.canvas) {
                    this.canvas.style.display = 'block';
                    this.canvas.style.visibility = 'visible';
                    this.canvas.style.opacity = '1';
                }
                this.createDisplacementEffect(texture);
            }
        }
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
        
        // Check screen width - disable swirl completely on small screens (< 8cm = 320px)
        const isSmallScreen = window.innerWidth <= 320;
        
        if (!isSmallScreen) {
            // Only create swirl on larger screens, but still disable animation
            this.createSwirlDisplacement();
        } else {
            // Small screens: don't create swirl at all - just static image
            this.swirlSprite = null;
            this.displacementFilter = null;
        }
        
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
        // Check screen width - disable all interactions on small screens to allow touch scrolling
        const isSmallScreen = window.innerWidth <= 320;
        
        if (this.isMobile || isSmallScreen) {
            // Mobile and small screens: completely disable touch/mouse events
            // CRITICAL: Don't add ANY event listeners on mobile/small screens
            // NO touch event listeners at all - even passive ones can interfere with drag scroll
            // Canvas has pointer-events: none and touch-action: pan-y pan-x to allow scrolling
            // The CSS properties are enough - no JavaScript listeners needed
            this.mousePos.x = -1000;
            this.mousePos.y = -1000;
        } else {
            // Desktop only: add mouse events but still disable swirl animation
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
        
        // Fix for disappearing image on scroll/resize (mobile issue)
        // More aggressive visibility check to prevent disappearing
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                // CRITICAL: Always ensure canvas is visible
                if (this.canvas) {
                    this.canvas.style.setProperty('display', 'block', 'important');
                    this.canvas.style.setProperty('visibility', 'visible', 'important');
                    this.canvas.style.setProperty('opacity', '1', 'important');
                    this.canvas.style.setProperty('pointer-events', 'none', 'important');
                    this.canvas.style.setProperty('touch-action', 'pan-y pan-x pinch-zoom', 'important');
                }
                
                // Ensure parent container is also visible
                const parent = this.canvas.parentElement;
                if (parent) {
                    parent.style.setProperty('display', 'block', 'important');
                    parent.style.setProperty('visibility', 'visible', 'important');
                    parent.style.setProperty('opacity', '1', 'important');
                    parent.style.setProperty('pointer-events', 'none', 'important');
                }
                
                if (parent && this.app && this.app.renderer) {
                    const rect = parent.getBoundingClientRect();
                    // Always update if dimensions changed or on mobile
                    if (rect.width > 0 && rect.height > 0) {
                        const currentScrollY = window.scrollY;
                        // Update if dimensions changed or significant scroll
                        const shouldUpdate = this.isMobile ? 
                            true : // Mobile: always update to prevent disappearing
                            (Math.abs(currentScrollY - lastScrollY) > 50 || 
                             this.app.screen.width !== rect.width || 
                             this.app.screen.height !== rect.height);
                        
                        if (shouldUpdate) {
                            try {
                                this.app.renderer.resize(rect.width, rect.height);
                                // Re-center sprite if it exists
                                if (this.sprite && this.isInitialized && this.sprite.texture) {
                                    const w = this.app.screen.width;
                                    const h = this.app.screen.height;
                                    const scale = Math.min(w / this.sprite.texture.width, h / this.sprite.texture.height) * 1.16;
                                    this.sprite.scale.set(scale);
                                    this.sprite.x = (w - this.sprite.width) / 2;
                                    this.sprite.y = (h - this.sprite.height) / 2;
                                    
                                    // Ensure sprite is visible
                                    this.sprite.visible = true;
                                    this.sprite.alpha = 1;
                                    
                                    // Ensure displacement filter scale is zero (animations disabled)
                                    if (this.displacementFilter) {
                                        this.displacementFilter.scale.x = 0;
                                        this.displacementFilter.scale.y = 0;
                                    }
                                }
                            } catch (e) {
                                console.warn('Error updating renderer on scroll:', e);
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
            // Completely disable swirl animation on ALL devices to prevent scroll blocking
            // Check screen width - on small screens, don't even try to animate
            const isSmallScreen = window.innerWidth <= 320;
            
            if (isSmallScreen) {
                // Small screens (< 8cm): no swirl at all - just static image
                // Make absolutely sure displacement is disabled
                if (this.displacementFilter) {
                    this.displacementFilter.scale.x = 0;
                    this.displacementFilter.scale.y = 0;
                }
                if (this.swirlSprite) {
                    // Stop any swirl sprite rotation
                    this.swirlSprite.rotation = 0;
                }
                return; // Skip all animation on small screens
            }
            
            // Desktop and larger mobile: Disable swirl completely to prevent scroll blocking
            // The swirl animation causes scroll blocking issues on all devices
            if (this.displacementFilter) {
                this.displacementFilter.scale.x = 0;
                this.displacementFilter.scale.y = 0;
            }
            if (this.swirlSprite) {
                // Stop swirl sprite rotation
                this.swirlSprite.rotation = 0;
            }
            
            // Swirl effect completely disabled on all devices - keeping code commented for reference
            /*
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
        // Always initialize - home image visible on all screens
        homeCanvas.dataset.initialized = 'true';
        // Determine correct image path based on page location
        const imagePath = homeCanvas.closest('body').baseURI.includes('pages') 
            ? '../assets/images/me.png?' + Date.now()
            : 'assets/images/me.png?' + Date.now();
        window.fluidHomePixiInstance = new FluidHomePixi(homeCanvas, imagePath);
    }
    
    // Handle window resize - ensure image doesn't disappear
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const homeCanvas = document.getElementById('fluidHomeCanvas');
            if (homeCanvas && window.fluidHomePixiInstance) {
                // Ensure canvas stays visible on resize
                homeCanvas.style.display = 'block';
                homeCanvas.style.visibility = 'visible';
                homeCanvas.style.opacity = '1';
                
                // Re-initialize if needed (handle resize)
                const parent = homeCanvas.parentElement;
                if (parent) {
                    const rect = parent.getBoundingClientRect();
                    if (window.fluidHomePixiInstance.app && (rect.width > 0 || rect.height > 0)) {
                        // Update renderer size if dimensions changed
                        if (window.fluidHomePixiInstance.app.screen.width !== rect.width ||
                            window.fluidHomePixiInstance.app.screen.height !== rect.height) {
                            window.fluidHomePixiInstance.handleResize();
                        }
                    }
                }
            }
        }, 250);
    });
});
