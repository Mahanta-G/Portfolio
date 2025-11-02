class FluidLogoPixi {
    constructor(canvasElement, logoSrc) {
        this.canvasElement = canvasElement;
        this.logoSrc = logoSrc;
        this.particles = [];
        this.mousePos = { x: -1000, y: -1000 };
        this.app = null;
        this.container = null;
        this.isInitialized = false;
        this.isDestroyed = false; // NEW: prevent operations after destroy
        this.logoBounds = null;
        
        // Mobile detection
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                        (window.matchMedia && window.matchMedia("(max-width: 768px)").matches) ||
                        ('ontouchstart' in window);
        this.init();
    }

    init() {
        if (this.isDestroyed) return; // NEW
        
        const parent = this.canvasElement.parentElement;
        if (!parent) return;
        
        const rect = parent.getBoundingClientRect();
        
        // NEW: Don't initialize if no dimensions
        if (rect.width === 0 || rect.height === 0) {
            setTimeout(() => this.init(), 100);
            return;
        }
        
        const maxResolution = this.isMobile ? 1 : 2;
        const antialias = this.isMobile ? false : false;
        
        try { // NEW: error handling
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
        } catch (error) {
            console.error('Failed to initialize logo PixiJS:', error);
        }
    }

    loadLogoImage() {
        if (this.isDestroyed) return; // NEW
        
        const screenWidthCm = window.innerWidth / (window.devicePixelRatio || 1) / 37.795;
        const isSmallScreen = window.innerWidth < 490 || screenWidthCm < 13.5;
        
        if (isSmallScreen) {
            if (this.isInitialized) return;
            this.isInitialized = true;
            this.createParticlesFromText();
            this.animate();
            return;
        }
        
        const img = new Image();
        
        img.onload = () => {
            if (this.isInitialized || this.isDestroyed) return; // UPDATED
            this.isInitialized = true;
            this.createParticlesFromImage(img);
            this.animate();
        };
        
        img.onerror = () => {
            if (this.isInitialized || this.isDestroyed) return; // UPDATED
            this.isInitialized = true;
            this.createParticlesFromText();
            this.animate();
        };
        
        img.src = this.logoSrc;
        
        setTimeout(() => {
            if (!this.isInitialized && !this.isDestroyed) { // UPDATED
                this.isInitialized = true;
                this.createParticlesFromText();
                this.animate();
            }
        }, 2000);
    }

    createParticlesFromImage(img) {
        if (this.isDestroyed || !this.app) return; // NEW
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        const w = this.app.screen.width;
        const h = this.app.screen.height;
        
        const scaleMultiplier = this.isMobile ? 0.85 : 0.78;
        const scale = Math.min(w / img.width, h / img.height) * 0.95 * scaleMultiplier;
        const sw = img.width * scale;
        const sh = img.height * scale;
        const x = (w - sw) / 2;
        const y = (h - sh) / 2;
        
        this.logoBounds = {
            x: x,
            y: y,
            width: sw,
            height: sh
        };
        
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, x, y, sw, sh);
        
        const imageData = ctx.getImageData(Math.floor(x), Math.floor(y), Math.ceil(sw), Math.ceil(sh));
        const step = this.isMobile ? 1.2 : 1.2;
        
        for (let py = 0; py < sh; py += step) {
            for (let px = 0; px < sw; px += step) {
                if (this.isDestroyed) return; // NEW
                
                const i = (Math.floor(py) * Math.ceil(sw) + Math.floor(px)) * 4;
                const alpha = imageData.data[i + 3];
                
                const alphaThreshold = this.isMobile ? 15 : 25;
                if (alpha > alphaThreshold) {
                    const particle = new PIXI.Graphics();
                    particle.beginFill(0xf0f0f0);
                    const particleSize = this.isMobile ? 3.5 : 3.5;
                    particle.drawCircle(0, 0, particleSize);
                    particle.endFill();
                    
                    particle.x = Math.floor(x + px);
                    particle.y = Math.floor(y + py);
                    particle.alpha = Math.max(0.9, alpha / 255);
                    
                    particle.baseX = x + px;
                    particle.baseY = y + py;
                    particle.vx = 0;
                    particle.vy = 0;
                    
                    this.container.addChild(particle);
                    this.particles.push(particle);
                }
            }
        }
    }

    createParticlesFromText() {
        if (this.isDestroyed || !this.app) return; // NEW
        
        const w = this.app.screen.width;
        const h = this.app.screen.height;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = w;
        canvas.height = h;
        
        const scaleMultiplier = this.isMobile ? 0.85 : 0.78;
        const fontSize = Math.min(w * 0.5, h * 0.7) * scaleMultiplier;
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillStyle = '#f0f0f0';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const textWidth = fontSize * 0.6;
        const textHeight = fontSize;
        const textX = (w - textWidth) / 2;
        const textY = (h - textHeight) / 2;
        
        this.logoBounds = {
            x: textX,
            y: textY,
            width: textWidth,
            height: textHeight
        };
        
        ctx.fillText('GM', w / 2, h / 2);
        
        const imageData = ctx.getImageData(0, 0, w, h);
        const step = this.isMobile ? 4 : 4;
        
        for (let py = 0; py < h; py += step) {
            for (let px = 0; px < w; px += step) {
                if (this.isDestroyed) return; // NEW
                
                const i = (py * w + px) * 4;
                const alpha = imageData.data[i + 3];
                
                if (alpha > 50) {
                    const particle = new PIXI.Graphics();
                    particle.beginFill(0xf0f0f0);
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

        if (this.isMobile) {
            this.canvasElement.addEventListener('touchmove', handlePointerMove, { passive: true });
            this.canvasElement.addEventListener('touchend', handlePointerLeave);
            this.canvasElement.addEventListener('touchcancel', handlePointerLeave);
        } else {
            this.canvasElement.addEventListener('mousemove', handlePointerMove);
            this.canvasElement.addEventListener('mouseleave', handlePointerLeave);
        }

        let resizeTimeout;
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        };
        
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleResize(), 500);
        });
        
        // REMOVED: Problematic scroll event listener
    }

    handleResize() {
        if (this.isDestroyed || !this.app) return; // NEW
        
        const parent = this.canvasElement.parentElement;
        if (!parent) return;
        
        const rect = parent.getBoundingClientRect();
        
        if (rect.width > 0 && rect.height > 0) {
            try { // NEW: error handling
                const hadParticles = this.particles.length > 0;
                
                this.app.renderer.resize(rect.width, rect.height);
                
                // Only reinitialize if we had particles
                if (hadParticles) {
                    this.particles.forEach(p => {
                        if (p && !p.destroyed) { // NEW: check destroyed
                            p.destroy();
                        }
                    });
                    this.particles = [];
                    this.container.removeChildren();
                    this.isInitialized = false;
                    
                    this.loadLogoImage();
                }
            } catch (error) {
                console.error('Logo resize error:', error);
            }
        }
    }

    animate() {
        if (this.isDestroyed || !this.app) return; // NEW
        
        const maxDist = this.isMobile ? 40 : 60;
        const maxDistSq = maxDist * maxDist;
        const springStrength = this.isMobile ? 0.2 : 0.15;
        const damping = this.isMobile ? 0.9 : 0.85;
        const force = this.isMobile ? 1.5 : 2.5;
        
        this.app.ticker.add(() => {
            if (this.isDestroyed) return; // NEW
            
            const mx = this.mousePos.x;
            const my = this.mousePos.y;
            const hasMouseInteraction = mx > -500 && my > -500;
            
            const len = this.particles.length;
            for (let i = 0; i < len; i++) {
                const p = this.particles[i];
                if (!p || p.destroyed) continue; // NEW: check destroyed
                
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
                
                const baseXDiff = p.baseX - p.x;
                const baseYDiff = p.baseY - p.y;
                p.vx += baseXDiff * springStrength;
                p.vy += baseYDiff * springStrength;
                
                p.vx *= damping;
                p.vy *= damping;
                
                p.x += p.vx;
                p.y += p.vy;
            }
        });
    }

    destroy() {
        this.isDestroyed = true; // NEW
        
        if (this.app) {
            this.app.destroy(true, { children: true, texture: true, baseTexture: true });
            this.app = null; // NEW
        }
        
        this.particles = []; // NEW
        this.container = null; // NEW
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
            logoLink.style.pointerEvents = 'none';
            logoLink.style.cursor = 'default';
            logoContainer.style.pointerEvents = 'none';
            logoCanvas.style.pointerEvents = 'auto';
            logoCanvas.style.cursor = 'pointer';
            
            if (navLogo) {
                navLogo.style.pointerEvents = 'none';
            }
            
            logoLink.addEventListener('click', (e) => {
                if (e.target !== logoCanvas && !logoCanvas.contains(e.target)) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    return false;
                }
            }, true);
            
            logoContainer.addEventListener('click', (e) => {
                if (e.target !== logoCanvas) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    return false;
                }
            }, true);
            
            if (navLogo) {
                navLogo.addEventListener('click', (e) => {
                    if (e.target !== logoCanvas && !logoCanvas.contains(e.target)) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        return false;
                    }
                }, true);
            }
            
            const handleCanvasClick = (e) => {
                const rect = logoCanvas.getBoundingClientRect();
                const clientX = e.touches ? e.touches[0].clientX : (e.changedTouches ? e.changedTouches[0].clientX : e.clientX);
                const clientY = e.touches ? e.touches[0].clientY : (e.changedTouches ? e.changedTouches[0].clientY : e.clientY);
                const clickX = clientX - rect.left;
                const clickY = clientY - rect.top;
                
                const bounds = fluidLogo.logoBounds;
                if (bounds) {
                    if (clickX >= bounds.x && clickX <= bounds.x + bounds.width &&
                        clickY >= bounds.y && clickY <= bounds.y + bounds.height) {
                        const href = logoLink.getAttribute('href');
                        if (href) {
                            window.location.href = href;
                        }
                    } else {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    }
                } else {
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
            
            setTimeout(() => {
                logoCanvas.addEventListener('click', handleCanvasClick, false);
                logoCanvas.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    handleCanvasClick(e);
                }, false);
            }, 1000);
        }
    }
});