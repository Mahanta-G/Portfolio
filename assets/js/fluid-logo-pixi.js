class FluidLogoPixi {
    constructor(canvasElement, logoSrc) {
        this.canvasElement = canvasElement;
        this.logoSrc = logoSrc;
        this.particles = [];
        this.mousePos = { x: -1000, y: -1000 };
        this.app = null;
        this.container = null;
        this.isInitialized = false;
        this.logoBounds = null; // Store logo bounds {x, y, width, height}
        // Mobile detection
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                        (window.matchMedia && window.matchMedia("(max-width: 768px)").matches) ||
                        ('ontouchstart' in window);
        this.init();
    }

    init() {
        const parent = this.canvasElement.parentElement;
        const rect = parent.getBoundingClientRect();
        
        // Mobile optimization: lower resolution and performance settings
        const maxResolution = this.isMobile ? 1 : 2;
        const antialias = this.isMobile ? false : false;
        
        // Create PixiJS Application with WebGL
        this.app = new PIXI.Application({
            view: this.canvasElement,
            width: rect.width,
            height: rect.height,
            backgroundColor: 0x000000,
            backgroundAlpha: 0,
            antialias: antialias,
            resolution: Math.min(window.devicePixelRatio || 1, maxResolution),
            autoDensity: true,
            powerPreference: this.isMobile ? 'default' : 'high-performance',
        });

        this.container = new PIXI.Container();
        this.app.stage.addChild(this.container);

        this.loadLogoImage();
        this.setupEventListeners();
    }

    loadLogoImage() {
        // Check if screen width is smaller than 13.5cm (490px at 96 DPI)
        // 13.5cm = 135mm, at 96 DPI: 135mm / 25.4mm * 96 = ~510px (using 490px for consistency)
        const screenWidthCm = window.innerWidth / (window.devicePixelRatio || 1) / 37.795; // Convert px to cm
        const isSmallScreen = window.innerWidth < 490 || screenWidthCm < 13.5;
        
        // If screen is smaller than 13.5cm (490px), use GM initials instead of image
        if (isSmallScreen) {
            if (this.isInitialized) return;
            this.isInitialized = true;
            this.createParticlesFromText();
            this.animate();
            return;
        }
        
        // For larger screens, try to load the image
        const img = new Image();
        
        img.onload = () => {
            if (this.isInitialized) return;
            this.isInitialized = true;
            this.createParticlesFromImage(img);
            this.animate();
        };
        
        img.onerror = () => {
            if (this.isInitialized) return;
            this.isInitialized = true;
            this.createParticlesFromText();
            this.animate();
        };
        
        img.src = this.logoSrc;
        
        setTimeout(() => {
            if (!this.isInitialized) {
                this.isInitialized = true;
                this.createParticlesFromText();
                this.animate();
            }
        }, 2000);
    }

    createParticlesFromImage(img) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        const w = this.app.screen.width;
        const h = this.app.screen.height;
        
        // Mobile: adjust scale to ensure logo fits well on small screens
        // Desktop: 20% larger than 65% (0.65 * 1.2 = 0.78)
        // Mobile: use more of the available space for better visibility
        const scaleMultiplier = this.isMobile ? 0.85 : 0.78;
        const scale = Math.min(w / img.width, h / img.height) * 0.95 * scaleMultiplier;
        const sw = img.width * scale;
        const sh = img.height * scale;
        const x = (w - sw) / 2;
        const y = (h - sh) / 2;
        
        // Store logo bounds for click detection
        this.logoBounds = {
            x: x,
            y: y,
            width: sw,
            height: sh
        };
        
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, x, y, sw, sh);
        
        // Only get image data from the drawn area
        const imageData = ctx.getImageData(Math.floor(x), Math.floor(y), Math.ceil(sw), Math.ceil(sh));
        
        // Mobile optimization: even smaller step for complete logo coverage
        // Smaller step = denser particles = more complete logo on mobile
        const step = this.isMobile ? 1.2 : 1.2; // Same density as desktop on mobile
        let particleCount = 0;
        
        for (let py = 0; py < sh; py += step) {
            for (let px = 0; px < sw; px += step) {
                const i = (Math.floor(py) * Math.ceil(sw) + Math.floor(px)) * 4;
                const r = imageData.data[i];
                const g = imageData.data[i + 1];
                const b = imageData.data[i + 2];
                const alpha = imageData.data[i + 3];
                
                // Mobile: lower threshold for better logo completeness
                const alphaThreshold = this.isMobile ? 15 : 25; // Even lower for mobile
                if (alpha > alphaThreshold) {
                    // Create PixiJS Graphics for each particle
                    const particle = new PIXI.Graphics();
                    
                    // Low neon white color (#f0f0f0)
                    particle.beginFill(0xf0f0f0);
                    // Mobile: slightly larger particles for better visibility
                    const particleSize = this.isMobile ? 3.5 : 3.5; // Same size as desktop on mobile
                    particle.drawCircle(0, 0, particleSize);
                    particle.endFill();
                    
                    // Mobile: don't blur particles for sharper logo
                    // Note: BlurFilter is deprecated in PixiJS v7.3.2 but still works
                    // We'll skip blur filter to avoid deprecation warnings
                    // if (!this.isMobile && particleCount % 4 === 0) {
                    //     particle.filters = [new PIXI.filters.BlurFilter(2, 2)];
                    // }
                    
                    // Position relative to the drawn image area
                    particle.x = Math.floor(x + px);
                    particle.y = Math.floor(y + py);
                    particle.alpha = Math.max(0.9, alpha / 255);
                    
                    // Store base position and velocity
                    particle.baseX = x + px;
                    particle.baseY = y + py;
                    particle.vx = 0;
                    particle.vy = 0;
                    
                    this.container.addChild(particle);
                    this.particles.push(particle);
                    particleCount++;
                }
            }
        }
    }

    createParticlesFromText() {
        const w = this.app.screen.width;
        const h = this.app.screen.height;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = w;
        canvas.height = h;
        
        // Mobile: adjust font size for better visibility on small screens
        // Desktop: 20% larger than 65% (0.65 * 1.2 = 0.78)
        // Mobile: use more of available space
        const scaleMultiplier = this.isMobile ? 0.85 : 0.78;
        const fontSize = Math.min(w * 0.5, h * 0.7) * scaleMultiplier;
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillStyle = '#f0f0f0';  /* Low neon white */
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Calculate text bounds (approximate)
        const textWidth = fontSize * 0.6; // Approximate width of "GM"
        const textHeight = fontSize;
        const textX = (w - textWidth) / 2;
        const textY = (h - textHeight) / 2;
        
        // Store logo bounds for click detection
        this.logoBounds = {
            x: textX,
            y: textY,
            width: textWidth,
            height: textHeight
        };
        
        ctx.fillText('GM', w / 2, h / 2);
        
        const imageData = ctx.getImageData(0, 0, w, h);
        // Mobile: smaller step for better text completeness
        const step = this.isMobile ? 4 : 4;
        let particleCount = 0;
        
        for (let py = 0; py < h; py += step) {
            for (let px = 0; px < w; px += step) {
                const i = (py * w + px) * 4;
                const alpha = imageData.data[i + 3];
                
                if (alpha > 50) {
                    const particle = new PIXI.Graphics();
                    particle.beginFill(0xf0f0f0);  // Low neon white
                    particle.drawCircle(0, 0, 2);
                    particle.endFill();
                    
                    particle.x = px;
                    particle.y = py;
                    particle.alpha = (alpha / 255) * 0.6;
                    
                    particle.baseX = px;
                    particle.baseY = py;
                    particle.vx = 0;
                    particle.vy = 0;
                    
                    this.container.addChild(particle);
                    this.particles.push(particle);
                    particleCount++;
                }
            }
        }
        
    }

    setupEventListeners() {
        const handlePointerMove = (e) => {
            const rect = this.canvasElement.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            this.mousePos.x = clientX - rect.left;
            this.mousePos.y = clientY - rect.top;
        };

        const handlePointerLeave = () => {
            this.mousePos.x = -1000;
            this.mousePos.y = -1000;
        };

        // Support both mouse and touch events
        if (this.isMobile) {
            this.canvasElement.addEventListener('touchmove', handlePointerMove, { passive: true });
            this.canvasElement.addEventListener('touchend', handlePointerLeave);
            this.canvasElement.addEventListener('touchcancel', handlePointerLeave);
        } else {
            this.canvasElement.addEventListener('mousemove', handlePointerMove);
            this.canvasElement.addEventListener('mouseleave', handlePointerLeave);
        }

        let resizeTimeout;
        let scrollTimeout;
        // Handle resize and scroll (mobile devices scroll a lot)
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        };
        
        window.addEventListener('resize', handleResize);
        // Mobile: also handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleResize(), 500);
        });
        // Throttle scroll events to prevent image disappearing
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                // Recalculate canvas position on scroll (mobile issue fix)
                if (this.canvasElement && this.canvasElement.parentElement) {
                    const rect = this.canvasElement.parentElement.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0 && this.app) {
                        this.app.renderer.resize(rect.width, rect.height);
                    }
                }
            }, 100);
        }, { passive: true });
    }

    handleResize() {
        const parent = this.canvasElement.parentElement;
        const rect = parent.getBoundingClientRect();
        
        if (rect.width > 0 && rect.height > 0) {
            this.app.renderer.resize(rect.width, rect.height);
            
            // Clear and reinitialize particles
            this.particles.forEach(p => p.destroy());
            this.particles = [];
            this.container.removeChildren();
            this.isInitialized = false;
            
            // Reload logo (will check screen size again)
            this.loadLogoImage();
        }
    }

    animate() {
        // Mobile optimization: reduce animation intensity
        const maxDist = this.isMobile ? 40 : 60;
        const maxDistSq = maxDist * maxDist;
        const springStrength = this.isMobile ? 0.2 : 0.15; // Faster return on mobile
        const damping = this.isMobile ? 0.9 : 0.85;
        const force = this.isMobile ? 1.5 : 2.5; // Less force on mobile
        
        this.app.ticker.add(() => {
            const mx = this.mousePos.x;
            const my = this.mousePos.y;
            const hasMouseInteraction = mx > -500 && my > -500;
            
            // Batch update particles
            const len = this.particles.length;
            for (let i = 0; i < len; i++) {
                const p = this.particles[i];
                
                // Only apply mouse repulsion if mouse is over canvas
                if (hasMouseInteraction) {
                    const dx = mx - p.x;
                    const dy = my - p.y;
                    const distSq = dx * dx + dy * dy;
                    
                    if (distSq < maxDistSq && distSq > 0) {
                        const invDist = 1 / Math.sqrt(distSq);
                        const normalizedForce = (maxDist - Math.sqrt(distSq)) / maxDist * force;
                        p.vx -= dx * invDist * normalizedForce;
                        p.vy -= dy * invDist * normalizedForce;
                    }
                }
                
                // Spring force (bring particles back)
                const baseXDiff = p.baseX - p.x;
                const baseYDiff = p.baseY - p.y;
                p.vx += baseXDiff * springStrength;
                p.vy += baseYDiff * springStrength;
                
                // Damping
                p.vx *= damping;
                p.vy *= damping;
                
                // Update position
                p.x += p.vx;
                p.y += p.vy;
            }
        });
    }

    destroy() {
        if (this.app) {
            this.app.destroy(true, { children: true, texture: true, baseTexture: true });
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const logoCanvas = document.getElementById('logoCanvas');
    if (logoCanvas) {
        const logoPath = '../assets/images/logo.png?' + Date.now();
        const fluidLogo = new FluidLogoPixi(logoCanvas, logoPath);
        
        // Fix clickable area - make ONLY logo bounds clickable, not entire canvas
        const logoLink = logoCanvas.closest('a');
        const logoContainer = logoCanvas.parentElement;
        const navLogo = logoLink ? logoLink.closest('.nav-logo') : null;
        
        if (logoLink && logoContainer) {
            // Completely disable clicks on anchor, container, and nav-logo parent
            logoLink.style.pointerEvents = 'none';
            logoLink.style.cursor = 'default';
            logoContainer.style.pointerEvents = 'none';
            logoCanvas.style.pointerEvents = 'auto';
            logoCanvas.style.cursor = 'pointer';
            
            if (navLogo) {
                navLogo.style.pointerEvents = 'none'; // Prevent nav-logo from capturing clicks
            }
            
            // Block ALL clicks on anchor - catch them early in capture phase
            logoLink.addEventListener('click', (e) => {
                // Only allow if click originated from canvas
                if (e.target !== logoCanvas && !logoCanvas.contains(e.target)) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    return false;
                }
            }, true); // Capture phase - catch early
            
            // Block ALL clicks on container
            logoContainer.addEventListener('click', (e) => {
                if (e.target !== logoCanvas) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    return false;
                }
            }, true); // Capture phase
            
            // Block ALL clicks on nav-logo parent
            if (navLogo) {
                navLogo.addEventListener('click', (e) => {
                    // Only allow if click originated from canvas
                    if (e.target !== logoCanvas && !logoCanvas.contains(e.target)) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        return false;
                    }
                }, true); // Capture phase
            }
            
            // Handle clicks/taps ONLY within logo bounds (where particles actually are)
            const handleCanvasClick = (e) => {
                const rect = logoCanvas.getBoundingClientRect();
                const clientX = e.touches ? e.touches[0].clientX : (e.changedTouches ? e.changedTouches[0].clientX : e.clientX);
                const clientY = e.touches ? e.touches[0].clientY : (e.changedTouches ? e.changedTouches[0].clientY : e.clientY);
                const clickX = clientX - rect.left;
                const clickY = clientY - rect.top;
                
                // Check if click is within logo bounds (where particles are)
                const bounds = fluidLogo.logoBounds;
                if (bounds) {
                    // Only navigate if click is within the actual logo bounds
                    if (clickX >= bounds.x && clickX <= bounds.x + bounds.width &&
                        clickY >= bounds.y && clickY <= bounds.y + bounds.height) {
                        const href = logoLink.getAttribute('href');
                        if (href) {
                            window.location.href = href;
                        }
                    } else {
                        // Click is outside logo bounds (in the red box areas)
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    }
                } else {
                    // Fallback: only allow clicks in center area (approx 60% of canvas)
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    const logoWidth = rect.width * 0.6;
                    const logoHeight = rect.height * 0.6;
                    const logoX = centerX - logoWidth / 2;
                    const logoY = centerY - logoHeight / 2;
                    
                    if (clickX >= logoX && clickX <= logoX + logoWidth &&
                        clickY >= logoY && clickY <= logoY + logoHeight) {
                        const href = logoLink.getAttribute('href');
                        if (href) {
                            window.location.href = href;
                        }
                    } else {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    }
                }
            };
            
            // Wait for PixiJS to initialize before adding click/touch handler
            setTimeout(() => {
                // Support both click and touch events
                logoCanvas.addEventListener('click', handleCanvasClick, false);
                logoCanvas.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    handleCanvasClick(e);
                }, false);
            }, 1000); // Wait longer for particles to be created
        }
    }
});

