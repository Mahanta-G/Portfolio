// Enhanced Brush Stroke Particle Cursor Effect
class ParticleCursor {
    constructor() {
        this.pc = null;
        this.brushParticles = [];
        this.mousePos = { x: 0, y: 0 };
        this.lastMousePos = { x: 0, y: 0 };
        this.animationId = null;
        // Mobile detection
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                        (window.matchMedia && window.matchMedia("(max-width: 768px)").matches) ||
                        ('ontouchstart' in window);
        // Mobile: reduce particle effects
        this.particleMultiplier = this.isMobile ? 0.5 : 1;
        this.init();
    }

    async init() {
        try {
            // Import threejs-toys from CDN
            const { particlesCursor } = await this.loadThreeJSToys();
            
            // Create app container if it doesn't exist
            let appContainer = document.getElementById('app');
            if (!appContainer) {
                appContainer = document.createElement('div');
                appContainer.id = 'app';
                appContainer.style.cssText = `
                    overflow: hidden;
                    color: #ffffff;
                    font-family: 'Inter', sans-serif;
                    text-align: center;
                    text-shadow: 0 0 5px #ffffff, 0 0 20px #000, 0 0 30px #000;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: -1;
                `;
                document.body.appendChild(appContainer);
            }

            // Mobile optimization: reduce particle count and intensity
            const gpgpuSize = this.isMobile ? 100 : 150; // Fewer particles on mobile
            const pointSize = this.isMobile ? 0.8 : 1;
            const noiseIntensity = this.isMobile ? 0.002 : 0.003;
            
            // Initialize particle cursor with optimized settings
            this.pc = particlesCursor({
                el: appContainer,
                gpgpuSize: gpgpuSize,
                color: '#00d4ff',
                coordScale: 1,
                pointSize: pointSize,
                noiseIntensity: noiseIntensity,
                noiseTimeCoef: 0.0001,
                pointDecay: this.isMobile ? 0.1 : 0.08, // Faster decay on mobile
                sleepRadiusX: 300,
                sleepRadiusY: 300,
                sleepTimeCoefX: 0.002,
                sleepTimeCoefY: 0.002
            });

            // Add canvas styles
            const canvas = appContainer.querySelector('canvas');
            if (canvas) {
                canvas.style.cssText = `
                    display: block;
                    position: fixed;
                    z-index: -1;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                `;
            }

            
        } catch (error) {
            // Fallback to brush stroke if threejs-toys fails
            this.createBrushStrokeFallback();
        }
    }

    async loadThreeJSToys() {
        return new Promise((resolve, reject) => {
            if (typeof particlesCursor !== 'undefined') {
                resolve({ particlesCursor });
                return;
            }
            
            const script = document.createElement('script');
            script.type = 'module';
            script.innerHTML = `
                import { particlesCursor } from "https://unpkg.com/threejs-toys@0.0.0/build/threejs-toys.module.cdn.min.js";
                window.particlesCursor = particlesCursor;
                window.dispatchEvent(new CustomEvent('threejs-toys-loaded'));
            `;
            
            script.onerror = () => {
                reject(new Error('Threejs-toys failed to load'));
            };
            
            window.addEventListener('threejs-toys-loaded', () => {
                resolve({ particlesCursor: window.particlesCursor });
            });
            
            document.head.appendChild(script);
        });
    }

    createBrushStrokeFallback() {
        // Create brush stroke effect with varying thickness
        this.setupMouseTracking();
        this.startBrushStrokeAnimation();
        this.addHoverEffects();
    }

    setupMouseTracking() {
        let isPointerMoving = false;
        let pointerMoveTimeout;
        let isFirstMove = true;

        const handlePointerMove = (e) => {
            // Get pointer position (works for both mouse and touch)
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            // Skip first move to prevent initial line
            if (isFirstMove) {
                this.mousePos = { x: clientX, y: clientY };
                this.lastMousePos = { x: clientX, y: clientY };
                isFirstMove = false;
                return;
            }

            this.lastMousePos = { ...this.mousePos };
            this.mousePos = { x: clientX, y: clientY };
            
            if (!isPointerMoving) {
                isPointerMoving = true;
                this.startBrushStrokeAnimation();
            }

            // Clear timeout and reset
            clearTimeout(pointerMoveTimeout);
            pointerMoveTimeout = setTimeout(() => {
                isPointerMoving = false;
            }, this.isMobile ? 200 : 100); // Longer timeout on mobile

            // Create brush stroke particles (less on mobile)
            this.createBrushStrokeParticles();
        };

        // Support both mouse and touch events
        if (this.isMobile) {
            document.addEventListener('touchmove', handlePointerMove, { passive: true });
            document.addEventListener('touchend', () => {
                isPointerMoving = false;
            }, { passive: true });
        } else {
            document.addEventListener('mousemove', handlePointerMove);
        }
    }

    createBrushStrokeParticles() {
        const distance = Math.sqrt(
            Math.pow(this.mousePos.x - this.lastMousePos.x, 2) + 
            Math.pow(this.mousePos.y - this.lastMousePos.y, 2)
        );

        // Mobile optimization: fewer particles
        const maxParticleDensity = this.isMobile ? 3 : 6;
        const distanceDivisor = this.isMobile ? 15 : 10; // Less sensitive on mobile
        const particleCount = Math.min(maxParticleDensity, Math.max(1, Math.floor(distance / distanceDivisor)));
    
        for (let i = 0; i < particleCount; i++) {
            const progress = i / particleCount;
            const x = this.lastMousePos.x + (this.mousePos.x - this.lastMousePos.x) * progress;
            const y = this.lastMousePos.y + (this.mousePos.y - this.lastMousePos.y) * progress;
        
            // Add some randomness for natural brush effect
            const randomX = x + (Math.random() - 0.5) * 20;
            const randomY = y + (Math.random() - 0.5) * 20;
        
            // Pass distance to the creation function
            this.createBrushParticle(randomX, randomY, progress, distance);
        }
    }

    createBrushParticle(x, y, progress, distance) {
        const particle = document.createElement('div');
        
        // Mobile optimization: smaller particles
        const sizeProgress = Math.sin(progress * Math.PI); // Creates bell curve
        const baseSize = this.isMobile ? 4 : 6;
        const maxSize = this.isMobile ? 12 : 18;
        
        // Dampen the max size based on speed
        const speedDampening = 1.0 - Math.min(1.0, distance / 100) * 0.3; 
        
        // Apply dampening to the potential maximum size
        const dampedMaxSize = maxSize * speedDampening; 
        const size = baseSize + (dampedMaxSize - baseSize) * sizeProgress;
        
        // Add size variation to prevent too many large particles
        const sizeVariation = 0.7 + (Math.random() * 0.6); // 0.7 to 1.3 multiplier
        const finalSize = Math.max(4, size * sizeVariation); // Minimum 4px
        
        // Calculate opacity based on progress
        const opacity = 0.2 + (0.6 * sizeProgress);
        
        particle.style.cssText = `
            position: fixed;
            width: ${finalSize}px;
            height: ${finalSize}px;
            background: radial-gradient(circle, 
                rgba(0, 212, 255, ${opacity}) 0%, 
                rgba(0, 212, 255, ${opacity * 0.6}) 30%, 
                rgba(0, 212, 255, ${opacity * 0.3}) 70%, 
                transparent 100%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            left: ${x - finalSize/2}px;
            top: ${y - finalSize/2}px;
            animation: brushStrokeFade 1.2s ease-out forwards;
            box-shadow: 0 0 ${finalSize}px rgba(0, 212, 255, ${opacity * 0.5});
            filter: blur(0.5px);
        `;
        
        document.body.appendChild(particle);
        this.brushParticles.push(particle);

        // Remove particle after animation
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
                this.brushParticles = this.brushParticles.filter(p => p !== particle);
            }
        }, 1200);
    }

    startBrushStrokeAnimation() {
        if (this.animationId) return;
        
        this.animationId = requestAnimationFrame(() => {
            this.updateBrushParticles();
            this.animationId = null;
            this.startBrushStrokeAnimation();
        });
    }

    updateBrushParticles() {
        // Update existing particles for smooth movement
        this.brushParticles = this.brushParticles.filter(particle => {
            if (!particle.parentNode) return false;
            
            // Add subtle movement to existing particles
            const currentTransform = particle.style.transform || 'translate(0px, 0px)';
            const matches = currentTransform.match(/translate\(([^,]+), ([^)]+)\)/);
            if (matches) {
                const x = parseFloat(matches[1]) + (Math.random() - 0.5) * 2;
                const y = parseFloat(matches[2]) + (Math.random() - 0.5) * 2;
                particle.style.transform = `translate(${x}px, ${y}px)`;
            }
            
            return true;
        });
    }

    addHoverEffects() {
        // Mobile: disable hover effects for better performance
        if (this.isMobile) return;
        
        const interactiveElements = document.querySelectorAll('a, button, .project-card, .hobby-card, .skill-category, .btn, .nav-link');
        
        interactiveElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                // Create burst of particles on hover (desktop only)
                const rect = element.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                const particleCount = 8;
                for (let i = 0; i < particleCount; i++) {
                    setTimeout(() => {
                        const angle = (i / particleCount) * Math.PI * 2;
                        const radius = 30 + Math.random() * 20;
                        const x = centerX + Math.cos(angle) * radius;
                        const y = centerY + Math.sin(angle) * radius;
                        this.createBrushParticle(x, y, 0.5, 0);
                    }, i * 50);
                }
            });
        });
    }

    // Method to destroy the particle cursor
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        if (this.pc && typeof this.pc.destroy === 'function') {
            this.pc.destroy();
        }
        
        const appContainer = document.getElementById('app');
        if (appContainer) {
            appContainer.remove();
        }
        
        // Clean up brush particles
        this.brushParticles.forEach(particle => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        });
        this.brushParticles = [];
    }
}

// Add CSS for brush stroke animation (only once)
if (!document.getElementById('brush-stroke-styles')) {
    const style = document.createElement('style');
    style.id = 'brush-stroke-styles';
    style.textContent = `
        @keyframes brushStrokeFade {
            0% {
                opacity: 0;
                transform: scale(0.3) translate(0px, 0px);
            }
            20% {
                opacity: 0.8;
                transform: scale(0.8) translate(0px, 0px);
            }
            50% {
                opacity: 1;
                transform: scale(1.2) translate(0px, 0px);
            }
            80% {
                opacity: 0.6;
                transform: scale(1) translate(0px, 0px);
            }
            100% {
                opacity: 0;
                transform: scale(0.5) translate(0px, 0px);
            }
        }
    `;
    document.head.appendChild(style);
}

// Initialize particle cursor when DOM is loaded (only if not already initialized)
// Mobile optimization: detect if device can handle particles
const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                       (window.matchMedia && window.matchMedia("(max-width: 768px)").matches) ||
                       ('ontouchstart' in window);

// Only disable if it's a low-end mobile device
const shouldEnableParticles = !isMobileDevice || (navigator.hardwareConcurrency && navigator.hardwareConcurrency > 2);

if (!window.particleCursorInstance && shouldEnableParticles) {
    document.addEventListener('DOMContentLoaded', () => {
        window.particleCursorInstance = new ParticleCursor();
    });

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        if (window.particleCursorInstance) {
            window.particleCursorInstance.destroy();
        }
    });
}

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ParticleCursor;
}