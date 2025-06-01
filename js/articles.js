// Static site version - no API needed

// Site configuration and articles data will be loaded from static files
let siteConfig = {};
let articlesData = [];
let categoriesData = [];

// DOM elements
const articlesGrid = document.querySelector('.articles-grid');
const searchInput = document.getElementById('article-search');
const filterContainer = document.querySelector('.filter-tags');
let filterTags = [];

// Current filter and search state
let currentFilter = 'all';
let currentSearch = '';

// Get URL parameters for filtering
const urlParams = new URLSearchParams(window.location.search);
const tagParam = urlParams.get('tag');

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing articles page...');
    
    // Add event listener for search input
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase();
            renderArticles();
        });
    }
    
    // Set initial filter if tag parameter is present
    if (tagParam) {
        currentFilter = tagParam;
    }
    
    // Load site data and articles
    loadSiteData();
});

// Function to load site data from static JSON file
async function loadSiteData() {
    try {
        const response = await fetch('/articles/index.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch site configuration: ${response.status} ${response.statusText}`);
        }
        
        siteConfig = await response.json();
        articlesData = siteConfig.articles;
        categoriesData = siteConfig.categories;
        
        // Update page title and other site elements
        updateSiteElements();
        
        // Update filter tags based on categories
        updateFilterTags();
        
        // If there was a tag parameter, set the active filter now
        if (tagParam) {
            filterTags.forEach(tag => {
                if (tag.dataset.tag === tagParam) {
                    tag.classList.add('active');
                } else {
                    tag.classList.remove('active');
                }
            });
        }
        
        // Initial render of articles
        renderArticles();
    } catch (error) {
        console.error('Error fetching site data:', error);
        if (articlesGrid) {
            articlesGrid.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <h2>Could not load articles</h2>
                    <p>Error: ${error.message}</p>
                </div>
            `;
        }
    }
}

// Update site elements based on configuration
function updateSiteElements() {
    // Update page title
    document.title = siteConfig.site.title + ' - Articles';
    
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

// Function to update filter tags based on categories
function updateFilterTags() {
    if (!filterContainer || !categoriesData) return;
    
    // Clear existing tags
    filterContainer.innerHTML = '';
    
    // Add 'All' tag
    const allTag = document.createElement('div');
    allTag.className = 'filter-tag ' + (currentFilter === 'all' ? 'active' : '');
    allTag.textContent = 'All';
    allTag.dataset.tag = 'all';
    allTag.addEventListener('click', () => {
        setActiveFilter('all');
    });
    filterContainer.appendChild(allTag);
    
    // Add category tags
    categoriesData.forEach(category => {
        const tag = document.createElement('div');
        tag.className = 'filter-tag ' + (currentFilter === category.tag ? 'active' : '');
        tag.textContent = category.name;
        tag.dataset.tag = category.tag;
        tag.addEventListener('click', () => {
            setActiveFilter(category.tag);
        });
        filterContainer.appendChild(tag);
    });
    
    // Update filterTags array
    filterTags = Array.from(document.querySelectorAll('.filter-tag'));
}

// Function to set active filter
function setActiveFilter(tag) {
    currentFilter = tag;
    
    // Update URL parameter without reloading the page
    const url = new URL(window.location.href);
    if (tag === 'all') {
        url.searchParams.delete('tag');
    } else {
        url.searchParams.set('tag', tag);
    }
    window.history.pushState({}, '', url);
    
    // Update active class on filter tags
    filterTags.forEach(filterTag => {
        if (filterTag.dataset.tag === tag) {
            filterTag.classList.add('active');
        } else {
            filterTag.classList.remove('active');
        }
    });
    
    // Re-render articles with new filter
    renderArticles();
}

// Function to render articles based on current filter and search
function renderArticles() {
    if (!articlesGrid || !articlesData) return;
    
    // Filter articles based on current filter and search
    const filteredArticles = articlesData.filter(article => {
        const matchesFilter = currentFilter === 'all' || article.tags.includes(currentFilter);
        const matchesSearch = currentSearch === '' || 
            article.title.toLowerCase().includes(currentSearch) || 
            article.excerpt.toLowerCase().includes(currentSearch);
        
        return matchesFilter && matchesSearch;
    });
    
    // Show/hide no results message
    const noResults = document.querySelector('.no-results');
    if (noResults) {
        if (filteredArticles.length === 0) {
            noResults.style.display = 'block';
        } else {
            noResults.style.display = 'none';
        }
    }
    
    // Clear existing articles
    articlesGrid.innerHTML = '';
    
    // Render filtered articles
    filteredArticles.forEach(article => {
        const articleCard = createArticleCard(article);
        articlesGrid.appendChild(articleCard);
    });
    
    // Add animation to article cards
    setTimeout(() => {
        const articleCards = document.querySelectorAll('.article-card');
        articleCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('visible');
            }, index * 100); // Stagger the animations
        });
    }, 100);
}

// Function to create an article card
function createArticleCard(article) {
    const card = document.createElement('div');
    card.className = 'article-card';
    
    // Format date
    const date = article.date ? new Date(article.date) : new Date();
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Create card content
    card.innerHTML = `
        <div class="article-image">
            <img src="${article.image || 'images/placeholder.jpg'}" alt="${article.title}">
        </div>
        <div class="article-content">
            <div class="article-tags">
                ${article.tags.map(tag => `<span class="article-tag">${tag}</span>`).join('')}
            </div>
            <h3 class="article-title">${article.title}</h3>
            <p class="article-excerpt">${article.excerpt}</p>
            <div class="article-meta">
                <span class="article-date">${formattedDate}</span>
                <span class="article-author">By ${article.author}</span>
            </div>
        </div>
    `;
    
    // Add click event to open the article
    card.addEventListener('click', () => {
        window.location.href = `article.html?id=${article.id}`;
    });
    
    return card;
}
