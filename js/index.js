// Index page JavaScript

// API base URL
const API_BASE_URL = 'http://localhost:3000/api';

// Site configuration
let siteConfig = {};

// Function to load site data and update the page
async function loadSiteData() {
    try {
        console.log('Fetching site data...');
        // Fetch site configuration
        const response = await fetch(`${API_BASE_URL}/site`);
        if (!response.ok) {
            throw new Error(`Failed to fetch site configuration: ${response.status} ${response.statusText}`);
        }
        
        siteConfig = await response.json();
        console.log('Site data loaded:', siteConfig);
        
        // Update site elements
        updateSiteElements();
        
        // Update hero section
        updateHeroSection();
        
        // Update featured articles
        updateFeaturedArticles();
        
    } catch (error) {
        console.error('Error fetching site data:', error);
        showError('Could not load site configuration. Please make sure the server is running.');
    }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing...');
    loadSiteData();
    
    // Make article cards visible with animation
    setTimeout(() => {
        const articleCards = document.querySelectorAll('.article-card');
        articleCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('visible');
            }, index * 200); // Stagger the animations
        });
    }, 500);
});

// Update site elements based on configuration
function updateSiteElements() {
    // Update page title
    document.title = siteConfig.site.title;
    
    // Update logo
    const logoElements = document.querySelectorAll('.logo');
    logoElements.forEach(logo => {
        if (siteConfig.site.logo.prefix && siteConfig.site.logo.suffix) {
            logo.innerHTML = `<span>${siteConfig.site.logo.prefix}</span>${siteConfig.site.logo.suffix}`;
        } else {
            logo.textContent = siteConfig.site.logo.text || siteConfig.site.title;
        }
    });
    
    // Update navigation
    const navLinks = document.querySelector('.nav-links');
    if (navLinks && siteConfig.navigation) {
        navLinks.innerHTML = '';
        siteConfig.navigation.forEach(item => {
            const link = document.createElement('a');
            link.href = item.url;
            link.className = 'nav-link';
            link.textContent = item.name;
            if (window.location.pathname.endsWith(item.url) || 
                (window.location.pathname === '/' && item.url === 'index.html')) {
                link.classList.add('active');
            }
            navLinks.appendChild(link);
        });
    }
    
    // Update footer
    const footerBottom = document.querySelector('.footer-bottom p');
    if (footerBottom && siteConfig.footer) {
        footerBottom.textContent = siteConfig.footer.copyright;
    }
    
    // Update footer categories
    const categoriesSection = document.querySelector('.footer-section:nth-child(3) ul');
    if (categoriesSection && siteConfig.categories) {
        categoriesSection.innerHTML = '';
        siteConfig.categories.forEach(category => {
            const li = document.createElement('li');
            const link = document.createElement('a');
            link.href = `articles.html?tag=${category.tag}`;
            link.textContent = category.name;
            li.appendChild(link);
            categoriesSection.appendChild(li);
        });
    }
}

// Update hero section
function updateHeroSection() {
    if (!siteConfig.hero) return;
    
    const heroTitle = document.querySelector('.hero-content .title');
    const heroSubtitle = document.querySelector('.hero-content .subtitle');
    const ctaButtons = document.querySelector('.hero-content .cta-buttons');
    
    // Commented out to preserve manual HTML title and subtitle
    // if (heroTitle) {
    //     heroTitle.innerHTML = siteConfig.hero.title.replace('Universe', '<span class="highlight">Universe</span>');
    // }
    // 
    // if (heroSubtitle) {
    //     heroSubtitle.textContent = siteConfig.hero.subtitle;
    // }
    
    if (ctaButtons && siteConfig.hero.cta) {
        ctaButtons.innerHTML = '';
        siteConfig.hero.cta.forEach(button => {
            const link = document.createElement('a');
            link.href = button.url;
            link.className = `cta-button ${button.type}`;
            link.textContent = button.text;
            ctaButtons.appendChild(link);
        });
    }
}

// Update featured articles section
function updateFeaturedArticles() {
    console.log('Updating featured articles');
    const articlesContainer = document.querySelector('.articles-container');
    if (!articlesContainer) {
        console.error('Articles container not found');
        return;
    }
    
    if (!siteConfig.articles) {
        console.error('No articles found in site config', siteConfig);
        return;
    }
    
    // Get featured articles
    const featuredArticles = siteConfig.articles.filter(article => article.featured);
    console.log('Featured articles:', featuredArticles);
    
    // Clear container
    articlesContainer.innerHTML = '';
    
    if (featuredArticles.length === 0) {
        articlesContainer.innerHTML = '<p>No featured articles found</p>';
        return;
    }
    
    // Add featured articles
    featuredArticles.forEach(article => {
        console.log('Adding article:', article.title);
        const articleCard = document.createElement('article');
        articleCard.className = 'article-card';
        
        articleCard.innerHTML = `
            <div class="article-image" style="background-image: url('${article.image}')"></div>
            <div class="article-content">
                <span class="article-category">${getCategoryName(article.tags[0])}</span>
                <h3 class="article-title">${article.title}</h3>
                <p class="article-excerpt">${article.excerpt}</p>
                <a href="article-viewer.html?article=${article.filename}" class="read-more">Read More <i class="fas fa-arrow-right"></i></a>
            </div>
        `;
        
        articlesContainer.appendChild(articleCard);
    });
}

// Get category name from tag
function getCategoryName(tag) {
    if (!siteConfig.categories) return tag;
    
    const category = siteConfig.categories.find(cat => cat.tag === tag);
    return category ? category.name : tag;
}

// Show error message
function showError(message) {
    const main = document.querySelector('main');
    if (!main) return;
    
    main.innerHTML = `
        <div class="error-container">
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <h2>Oops! Something went wrong</h2>
                <p>${message}</p>
            </div>
        </div>
    `;
}
