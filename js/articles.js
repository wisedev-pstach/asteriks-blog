// API base URL
const API_BASE_URL = 'http://localhost:3000/api';

// Site configuration and articles data will be loaded from the API
let siteConfig = {};
let articlesData = [];
let categoriesData = [];

// In a real implementation, you would load the markdown files dynamically
// For example:
/*
async function loadMarkdownArticles() {
    try {
        const response = await fetch('/articles/index.json');
        const articleIndex = await response.json();
        
        const articlesData = await Promise.all(articleIndex.map(async (article) => {
            const markdownResponse = await fetch(`/articles/${article.filename}`);
            const markdownContent = await markdownResponse.text();
            
            // Parse frontmatter and markdown content
            const { frontmatter, content } = parseMarkdown(markdownContent);
            
            return {
                ...frontmatter,
                content: content,
                id: article.id
            };
        }));
        
        return articlesData;
    } catch (error) {
        console.error('Error loading markdown articles:', error);
        return [];
    }
}

function parseMarkdown(markdown) {
    // Simple frontmatter parser
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
    const match = markdown.match(frontmatterRegex);
    
    if (!match) {
        return { frontmatter: {}, content: markdown };
    }
    
    const frontmatterStr = match[1];
    const content = markdown.slice(match[0].length);
    
    // Parse frontmatter
    const frontmatter = {};
    frontmatterStr.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length) {
            let value = valueParts.join(':').trim();
            
            // Remove quotes if present
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            
            // Parse arrays
            if (value.startsWith('[') && value.endsWith(']')) {
                value = value.slice(1, -1).split(',').map(item => 
                    item.trim().replace(/"/g, '')
                );
            }
            
            frontmatter[key.trim()] = value;
        }
    });
    
    return { frontmatter, content };
}
*/

// DOM Elements
const articlesGrid = document.querySelector('.articles-grid');
const searchInput = document.getElementById('article-search');
const searchButton = document.getElementById('search-button');
const filterTags = document.querySelectorAll('.filter-tag');
const noResults = document.querySelector('.no-results');

// Current filter state
let currentFilter = 'all';
let searchQuery = '';

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    // Show loading state
    articlesGrid.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading articles...</p></div>';
    
    // Check URL for tag parameter
    const urlParams = new URLSearchParams(window.location.search);
    const tagParam = urlParams.get('tag');
    
    if (tagParam) {
        currentFilter = tagParam;
        // Update active filter button will happen after categories are loaded
    }
    
    // Fetch site configuration from API
    try {
        const response = await fetch(`${API_BASE_URL}/site`);
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
        
        // Initial render
        renderArticles();
    } catch (error) {
        console.error('Error fetching site data:', error);
        articlesGrid.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <h2>Could not load articles</h2>
                <p>Please make sure the server is running. Error: ${error.message}</p>
            </div>
        `;
    }
    
    // Setup event listeners
    setupEventListeners();
});

// Update site elements based on configuration
function updateSiteElements() {
    // Update page title
    document.title = `Articles | ${siteConfig.site.title}`;
    
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
            if (window.location.pathname.endsWith(item.url)) {
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
}

// Update filter tags based on categories
function updateFilterTags() {
    const filterContainer = document.querySelector('.filter-tags');
    if (!filterContainer || !categoriesData) return;
    
    // Clear existing tags
    filterContainer.innerHTML = '';
    
    // Add 'All' tag
    const allTag = document.createElement('button');
    allTag.className = 'filter-tag active';
    allTag.dataset.tag = 'all';
    allTag.textContent = 'All';
    filterContainer.appendChild(allTag);
    
    // Add category tags
    categoriesData.forEach(category => {
        const tagButton = document.createElement('button');
        tagButton.className = 'filter-tag';
        tagButton.dataset.tag = category.tag;
        tagButton.textContent = category.name;
        filterContainer.appendChild(tagButton);
    });
    
    // Re-attach event listeners
    document.querySelectorAll('.filter-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            // Update active state
            document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
            tag.classList.add('active');
            
            // Update filter
            currentFilter = tag.dataset.tag;
            
            // Update URL without reloading page
            const url = new URL(window.location);
            if (currentFilter === 'all') {
                url.searchParams.delete('tag');
            } else {
                url.searchParams.set('tag', currentFilter);
            }
            window.history.pushState({}, '', url);
            
            // Render filtered articles
            renderArticles();
        });
    });
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    searchButton.addEventListener('click', () => {
        searchQuery = searchInput.value.trim().toLowerCase();
        renderArticles();
    });
    
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            searchQuery = searchInput.value.trim().toLowerCase();
            renderArticles();
        }
    });
    
    // Filter functionality
    filterTags.forEach(tag => {
        tag.addEventListener('click', () => {
            // Update active state
            filterTags.forEach(t => t.classList.remove('active'));
            tag.classList.add('active');
            
            // Update filter
            currentFilter = tag.dataset.tag;
            
            // Update URL without reloading page
            const url = new URL(window.location);
            if (currentFilter === 'all') {
                url.searchParams.delete('tag');
            } else {
                url.searchParams.set('tag', currentFilter);
            }
            window.history.pushState({}, '', url);
            
            // Render filtered articles
            renderArticles();
        });
    });
}

// Filter articles based on current filter and search query
function filterArticles() {
    return articlesData.filter(article => {
        // Filter by tag
        const passesTagFilter = currentFilter === 'all' || article.tags.includes(currentFilter);
        
        // Filter by search query
        const passesSearchFilter = searchQuery === '' || 
            article.title.toLowerCase().includes(searchQuery) || 
            article.excerpt.toLowerCase().includes(searchQuery) ||
            (article.author && article.author.toLowerCase().includes(searchQuery)) ||
            article.tags.some(tag => tag.toLowerCase().includes(searchQuery));
        
        return passesTagFilter && passesSearchFilter;
    });
}

// Render articles to the grid
function renderArticles() {
    const filteredArticles = filterArticles();
    
    // Clear the grid
    articlesGrid.innerHTML = '';
    
    // Show/hide no results message
    if (filteredArticles.length === 0) {
        noResults.style.display = 'block';
    } else {
        noResults.style.display = 'none';
    }
    
    // Render each article
    filteredArticles.forEach((article, index) => {
        const articleCard = document.createElement('article');
        articleCard.className = 'article-card';
        articleCard.style.animationDelay = `${index * 0.1}s`;
        
        // Create a link to the article viewer page
        const articleLink = article.filename ? `article-viewer.html?article=${article.filename}` : '#';
        
        articleCard.innerHTML = `
            <div class="article-image" style="background-image: url('${article.image}')"></div>
            <div class="article-content">
                <div class="article-meta">
                    <span class="article-date">${article.date}</span>
                    ${article.author ? `<span class="article-author">by ${article.author}</span>` : ''}
                </div>
                <div class="article-tags">
                    ${article.tags.map(tag => `<span class="article-tag">${formatTag(tag)}</span>`).join('')}
                </div>
                <h3 class="article-title">${article.title}</h3>
                <p class="article-excerpt">${article.excerpt}</p>
                <a href="${articleLink}" class="read-more">Read More <i class="fas fa-arrow-right"></i></a>
            </div>
        `;
        
        // Add click event to the entire card
        articleCard.addEventListener('click', (e) => {
            // Only navigate if the click wasn't on a tag or the read more link
            if (!e.target.closest('.article-tag') && !e.target.closest('.read-more')) {
                window.location.href = articleLink;
            }
        });
        
        articlesGrid.appendChild(articleCard);
    });
}

// Format tag for display (capitalize, replace hyphens with spaces)
function formatTag(tag) {
    return tag
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Parse markdown files to extract metadata
// This is a simplified version - in a real app, you would implement proper markdown parsing
async function parseMarkdownFile(filename) {
    try {
        const response = await fetch(`articles/${filename}`);
        const markdown = await response.text();
        
        // Extract image
        const imageMatch = markdown.match(/!\[.*?\]\((.*?)\)/);
        const image = imageMatch ? imageMatch[1] : '';
        
        // Extract title
        const titleMatch = markdown.match(/# (.+)/);
        const title = titleMatch ? titleMatch[1] : 'Untitled';
        
        // Extract author
        const authorMatch = markdown.match(/\*\*Author: (.+?)\*\*/);
        const author = authorMatch ? authorMatch[1] : 'Unknown';
        
        // Extract description
        const descMatch = markdown.match(/\*(.+?)\*/);
        const excerpt = descMatch ? descMatch[1] : '';
        
        // Extract date
        const dateMatch = markdown.match(/\*\*Date: (.+?)\*\*/);
        const date = dateMatch ? dateMatch[1] : '';
        
        // Extract tags
        const tagsMatch = markdown.match(/\*\*Tags: (.+?)\*\*/);
        const tagsStr = tagsMatch ? tagsMatch[1] : '';
        const tags = tagsStr.split(',').map(tag => tag.trim());
        
        return {
            title,
            excerpt,
            image,
            date,
            author,
            tags,
            filename
        };
    } catch (error) {
        console.error(`Error parsing markdown file ${filename}:`, error);
        return null;
    }
}

// Add some visual effects
document.addEventListener('DOMContentLoaded', () => {
    // Animate search input on focus
    searchInput.addEventListener('focus', () => {
        searchInput.style.transition = 'all 0.3s ease';
        searchInput.style.boxShadow = '0 0 15px rgba(108, 99, 255, 0.5)';
    });
    
    searchInput.addEventListener('blur', () => {
        searchInput.style.boxShadow = 'none';
    });
    
    // Animate filter tags on hover
    filterTags.forEach(tag => {
        tag.addEventListener('mouseenter', () => {
            if (!tag.classList.contains('active')) {
                tag.style.transform = 'translateY(-3px)';
            }
        });
        
        tag.addEventListener('mouseleave', () => {
            if (!tag.classList.contains('active')) {
                tag.style.transform = 'translateY(0)';
            }
        });
    });
});
