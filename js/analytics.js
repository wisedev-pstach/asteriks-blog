// Google Analytics 4 Implementation for Asterisk* Blog
// Replace 'G-XXXXXXXXXX' with your actual Google Analytics 4 Measurement ID

// Initialize Google Analytics
function initializeAnalytics() {
    // Load the Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX';
    document.head.appendChild(script);
    
    // Initialize the dataLayer
    window.dataLayer = window.dataLayer || [];
    
    // Define the gtag function
    function gtag() {
        dataLayer.push(arguments);
    }
    
    // Initialize with your Measurement ID
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX', {
        'page_title': document.title,
        'page_path': window.location.pathname + window.location.search
    });
    
    // Make gtag available globally
    window.gtag = gtag;
    
    // Set up custom event tracking
    setupCustomTracking();
}

// Track custom events for better insights
function setupCustomTracking() {
    // Track article views
    if (window.location.pathname.includes('article.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const articleId = urlParams.get('id');
        
        if (articleId) {
            trackEvent('article_view', {
                'article_id': articleId,
                'article_title': document.title
            });
        }
    }
    
    // Track outbound links
    document.addEventListener('click', function(event) {
        const target = event.target.closest('a');
        if (target && target.hostname !== window.location.hostname) {
            trackEvent('outbound_link_click', {
                'link_url': target.href,
                'link_text': target.textContent.trim()
            });
        }
    });
    
    // Track tag/category clicks
    document.addEventListener('click', function(event) {
        const target = event.target.closest('.tag');
        if (target) {
            trackEvent('tag_click', {
                'tag_name': target.textContent.trim()
            });
        }
    });
    
    // Track search queries
    const searchForm = document.querySelector('.search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', function(event) {
            const searchInput = this.querySelector('input[type="search"]');
            if (searchInput && searchInput.value) {
                trackEvent('search', {
                    'search_term': searchInput.value
                });
            }
        });
    }
    
    // Track scroll depth
    setupScrollDepthTracking();
}

// Track how far users scroll on articles
function setupScrollDepthTracking() {
    if (!window.location.pathname.includes('article.html')) return;
    
    const articleContent = document.querySelector('.article-content');
    if (!articleContent) return;
    
    let scrollMarks = [25, 50, 75, 90, 100];
    let marksReached = new Set();
    
    window.addEventListener('scroll', function() {
        // Calculate scroll percentage
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        
        const scrollPercent = Math.round((scrollTop / (documentHeight - windowHeight)) * 100);
        
        // Check which scroll depth marks have been reached
        scrollMarks.forEach(mark => {
            if (scrollPercent >= mark && !marksReached.has(mark)) {
                marksReached.add(mark);
                trackEvent('scroll_depth', {
                    'depth_percentage': mark,
                    'article_id': new URLSearchParams(window.location.search).get('id')
                });
            }
        });
    }, { passive: true });
}

// Helper function to track events
function trackEvent(eventName, eventParams) {
    if (window.gtag) {
        window.gtag('event', eventName, eventParams);
    }
}

// Initialize analytics when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeAnalytics);
