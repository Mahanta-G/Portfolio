// Portfolio Website JavaScript - Multi-page Version
class PortfolioApp {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.isMenuOpen = false;
        this.init();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        
        const pageMap = {
            'index.html': 'home',
            'home.html': 'home',
            'skills.html': 'skills',
            'projects.html': 'projects',
            'contact.html': 'contact',
            'hobbies.html': 'hobbies'
        };
        
        return pageMap[filename] || 'home';
    }

    init() {
        this.setupEventListeners();
        this.setupScrollAnimations();
        this.setupFloatingElements();
        this.setupFormHandling();
        this.setupIntersectionObserver();
    }

    setupEventListeners() {
        // Navigation
        const navLinks = document.querySelectorAll('.nav-link');
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('nav-menu');
        const navbar = document.getElementById('navbar');

        // Navigation links - now handle page navigation
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Let the browser handle navigation for multi-page structure
                this.closeMobileMenu();
            });
        });

        // Mobile menu toggle
        if (hamburger) {
            hamburger.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (navMenu && hamburger && 
                !navMenu.contains(e.target) && 
                !hamburger.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // Navbar scroll effect
        if (navbar) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 100) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            });
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMobileMenu();
            }
        });
    }

    toggleMobileMenu() {
        const navMenu = document.getElementById('nav-menu');
        const hamburger = document.getElementById('hamburger');
        
        if (navMenu && hamburger) {
            this.isMenuOpen = !this.isMenuOpen;
            navMenu.classList.toggle('active', this.isMenuOpen);
            hamburger.classList.toggle('active', this.isMenuOpen);
        }
    }

    closeMobileMenu() {
        const navMenu = document.getElementById('nav-menu');
        const hamburger = document.getElementById('hamburger');
        
        if (navMenu && hamburger) {
            this.isMenuOpen = false;
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
        }
    }

    setupScrollAnimations() {
        // Scroll animations are handled by the intersection observer
    }

    setupFloatingElements() {
        const floatingCards = document.querySelectorAll('.floating-card');
        
        // Mobile detection
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                        (window.matchMedia && window.matchMedia("(max-width: 768px)").matches) ||
                        ('ontouchstart' in window);
        
        floatingCards.forEach(card => {
            const speed = parseFloat(card.dataset.speed) || 1;
            
            // Desktop only: Add mouse interaction
            if (!isMobile) {
                card.addEventListener('mouseenter', () => {
                    card.style.transform = 'scale(1.1) rotate(5deg)';
                });
                
                card.addEventListener('mouseleave', () => {
                    card.style.transform = 'scale(1) rotate(0deg)';
                });
            }

            // Mobile: disable parallax to prevent cards floating above image
            if (!isMobile) {
                // Parallax effect on scroll (desktop only)
                window.addEventListener('scroll', () => {
                    const scrolled = window.pageYOffset;
                    const rate = scrolled * -0.5 * speed;
                    card.style.transform = `translateY(${rate}px)`;
                }, { passive: true });
            }
        });
    }

    setupFormHandling() {
        const contactForm = document.getElementById('contact-form');
        
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmission(contactForm);
            });
        }
    }

    handleFormSubmission(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Add loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
        
        // Simulate form submission (replace with actual API call)
        setTimeout(() => {
            // Show success message
            this.showNotification('Message sent successfully!', 'success');
            
            // Reset form
            form.reset();
            
            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 2000);
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '0.5rem',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            backgroundColor: type === 'success' ? '#10b981' : '#6366f1'
        });
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -20px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Stop observing once visible to prevent re-triggering
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe elements for scroll animations
        const elementsToAnimate = document.querySelectorAll('.project-card, .hobby-card, .skill-category, .timeline-item, .stat-item');
        elementsToAnimate.forEach((element, index) => {
            element.classList.add('fade-in');
            // Add staggered delay for better visual effect
            element.style.transitionDelay = `${index * 0.1}s`;
            observer.observe(element);
        });
    }

}

// Utility Functions
class Utils {
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

}

// Performance Optimization
class PerformanceOptimizer {
    constructor() {
        this.setupLazyLoading();
    }

    setupLazyLoading() {
        // Lazy load images when they come into view
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        });

        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => imageObserver.observe(img));
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const app = new PortfolioApp();
    const optimizer = new PerformanceOptimizer();
    
    // Add smooth page transitions with safety timeout
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    // Safety timeout to ensure page shows even if load event doesn't fire
    const showPageTimeout = setTimeout(() => {
        document.body.style.opacity = '1';
    }, 500);
    
    window.addEventListener('load', () => {
        clearTimeout(showPageTimeout);
        document.body.style.opacity = '1';
    });

    // Add keyboard shortcuts for navigation
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            const pageMap = {
                '1': 'home.html',
                '2': 'skills.html',
                '3': 'projects.html',
                '4': 'contact.html',
                '5': 'hobbies.html'
            };
            
            if (pageMap[e.key]) {
                e.preventDefault();
                window.location.href = pageMap[e.key];
            }
        }
    });

    // Add scroll progress indicator
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(90deg, #6366f1, #8b5cf6);
        z-index: 10001;
        transition: width 0.1s ease;
    `;
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', Utils.throttle(() => {
        const scrollTop = window.pageYOffset;
        const docHeight = document.body.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.width = scrollPercent + '%';
    }, 10));

    // Custom cursor removed - using particle trail effect instead from particles.js
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PortfolioApp, Utils, PerformanceOptimizer };
}
