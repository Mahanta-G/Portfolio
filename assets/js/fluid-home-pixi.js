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
        this.isDestroyed = false;
        this.init();
    }

    init() {
        if (this.isDestroyed) return;
        
        const parent = this.canvas.parentElement;
        if (!parent) return;
        
        const rect = parent.getBoundingClientRect();
        
        if (rect.width === 0 || rect.height === 0) {
            setTimeout(() => this.init(), 100);
            return;
        }
        
        try {
            // Create PixiJS Application with WebGL
            this.app = new PIXI.Application({
                view: this.canvas,
                width: rect.width,
                height: rect.height,
                backgroundColor: 0x000000,
                backgroundAlpha: 0,
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true,
                powerPreference: 'high-performance',
            });

            this.loadImage();
            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize PixiJS:', error);
        }
    }

    loadImage() {
        if (this.isDestroyed) return;
        
        const texture = PIXI.Texture.from(this.imageSrc);
        
        texture.baseTexture.on('loaded', () => {
            if (this.isInitialized || this.isDestroyed) return;
            this.isInitialized = true;
            this.createDisplacementEffect(texture);
        });
    }

    createDisplacementEffect(texture) {
        if (this.isDestroyed || !this.app) return;
        
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
        if (this.isDestroyed || !this.app) return;
        
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
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            
            // Check if mouse is within sprite bounds
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
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.mousePos.x = -1000;
            this.mousePos.y = -1000;
        });

        // Add resize listener (NO scroll listener - this was causing the bug)
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
    }

    handleResize() {
        if (this.isDestroyed || !this.app) return;
        
        const parent = this.canvas.parentElement;
        if (!parent) return;
        
        const rect = parent.getBoundingClientRect();
        
        if (rect.width > 0 && rect.height > 0) {
            try {
                this.app.renderer.resize(rect.width, rect.height);
                
                // FIXED: Just reposition and rescale instead of destroying
                if (this.sprite && this.sprite.texture) {
                    const w = rect.width;
                    const h = rect.height;
                    const scale = Math.min(w / this.sprite.texture.width, h / this.sprite.texture.height) * 1.16;
                    this.sprite.scale.set(scale);
                    this.sprite.x = (w - this.sprite.width) / 2;
                    this.sprite.y = (h - this.sprite.height) / 2;
                }
            } catch (error) {
                console.error('Resize error:', error);
            }
        }
    }

    animate() {
        if (this.isDestroyed || !this.app) return;
        
        this.app.ticker.add(() => {
            if (this.isDestroyed) return;
            
            // Update swirl position and intensity
            if (this.swirlSprite && this.displacementFilter) {
                if (this.mousePos.x > -500) {
                    // Move swirl to mouse position
                    this.swirlSprite.x += (this.mousePos.x - this.swirlSprite.x) * 0.15;
                    this.swirlSprite.y += (this.mousePos.y - this.swirlSprite.y) * 0.15;
                    
                    // Fade in displacement
                    const targetScale = 30;
                    this.displacementFilter.scale.x += (targetScale - this.displacementFilter.scale.x) * 0.1;
                    this.displacementFilter.scale.y += (targetScale - this.displacementFilter.scale.y) * 0.1;
                    
                    // Rotate the swirl for animated effect
                    this.swirlSprite.rotation += 0.05;
                } else {
                    // Fade out displacement when mouse leaves
                    this.displacementFilter.scale.x *= 0.9;
                    this.displacementFilter.scale.y *= 0.9;
                }
            }
        });
    }

    destroy() {
        this.isDestroyed = true;
        
        if (this.app) {
            this.app.destroy(true, { children: true, texture: true, baseTexture: true });
            this.app = null;
        }
        
        this.sprite = null;
        this.swirlSprite = null;
        this.displacementFilter = null;
    }
}

// Initialize when DOM is loaded (prevent duplicate initialization)
if (!window.fluidHomePixiInstance) {
    document.addEventListener('DOMContentLoaded', () => {
        const homeCanvas = document.getElementById('fluidHomeCanvas');
        if (homeCanvas && !homeCanvas.dataset.initialized) {
            homeCanvas.dataset.initialized = 'true';
            // Determine correct image path based on page location
            const imagePath = homeCanvas.closest('body').baseURI.includes('pages') 
                ? '../assets/images/home.png?' + Date.now()
                : 'assets/images/home.png?' + Date.now();
            window.fluidHomePixiInstance = new FluidHomePixi(homeCanvas, imagePath);
        }
    });
}