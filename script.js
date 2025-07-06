// Enhanced interactivity for the JLmol website

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all interactive features
    initSmoothScrolling();
    initNavigationEffects();
    initAnimationObserver();
    initDownloadTracking();
    initMobileOptimizations();
});

// Smooth scrolling for navigation links
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Navigation background and scroll effects
function initNavigationEffects() {
    const nav = document.querySelector('nav');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', function() {
        const currentScrollY = window.scrollY;
        
        // Change navigation background based on scroll position
        if (currentScrollY > 100) {
            nav.style.background = 'rgba(255, 255, 255, 0.98)';
            nav.style.backdropFilter = 'blur(20px)';
        } else {
            nav.style.background = 'rgba(255, 255, 255, 0.95)';
            nav.style.backdropFilter = 'blur(10px)';
        }

        // Hide/show navigation on scroll (optional enhancement)
        if (currentScrollY > lastScrollY && currentScrollY > 200) {
            nav.style.transform = 'translateY(-100%)';
        } else {
            nav.style.transform = 'translateY(0)';
        }
        
        lastScrollY = currentScrollY;
    });
}

// Intersection Observer for animations
function initAnimationObserver() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.feature-card, .demo-content, .download-card').forEach(el => {
        observer.observe(el);
    });
}

// Download button tracking and user feedback
function initDownloadTracking() {
    document.querySelectorAll('.download-card .btn, .cta-buttons .btn-primary').forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Add loading state
            this.classList.add('loading');
            const originalText = this.innerHTML;
            
            // Analytics tracking (if needed)
            if (typeof gtag !== 'undefined') {
                gtag('event', 'download_click', {
                    'event_category': 'engagement',
                    'event_label': this.textContent.trim()
                });
            }
            
            // Visual feedback
            if (this.href.includes('github.com')) {
                this.innerHTML = '<span>⏳</span> Redirecting to GitHub...';
            } else if (this.href.includes('app.jlmol.com')) {
                this.innerHTML = '<span>🚀</span> Launching Demo...';
            }
            
            // Reset button after delay
            setTimeout(() => {
                this.classList.remove('loading');
                this.innerHTML = originalText;
            }, 2000);
        });
    });
}

// Mobile optimizations
function initMobileOptimizations() {
    // Add touch-friendly interactions for mobile
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
        
        // Add touch feedback for cards
        document.querySelectorAll('.feature-card, .download-card').forEach(card => {
            card.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.98)';
            });
            
            card.addEventListener('touchend', function() {
                this.style.transform = '';
            });
        });
    }
    
    // Optimize for viewport height on mobile
    function setVH() {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    setVH();
    window.addEventListener('resize', setVH);
}

// Keyboard navigation improvements
document.addEventListener('keydown', function(e) {
    // Escape key to close any modals or overlays (future use)
    if (e.key === 'Escape') {
        // Handle escape key
    }
    
    // Enter key on focused download buttons
    if (e.key === 'Enter' && e.target.classList.contains('btn')) {
        e.target.click();
    }
});

// Copy to clipboard functionality (for future use with code examples)
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        // Show success message
        showNotification('Copied to clipboard!');
    }).catch(function() {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Copied to clipboard!');
    });
}

// Show notification messages
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: type === 'success' ? '#10B981' : '#EF4444',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        zIndex: '10000',
        fontWeight: '500',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease'
    });
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Performance monitoring
function initPerformanceMonitoring() {
    // Monitor page load performance
    window.addEventListener('load', function() {
        setTimeout(() => {
            const navigation = performance.getEntriesByType('navigation')[0];
            const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
            
            console.log(`Page load time: ${loadTime}ms`);
            
            // Send to analytics if configured
            if (typeof gtag !== 'undefined') {
                gtag('event', 'page_load_time', {
                    'event_category': 'performance',
                    'value': Math.round(loadTime)
                });
            }
        }, 0);
    });
}

// Initialize performance monitoring
initPerformanceMonitoring();
