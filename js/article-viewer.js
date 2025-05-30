// Article Viewer JavaScript

// API base URL
const API_BASE_URL = 'http://localhost:3000/api';

// Site configuration
let siteConfig = {};

document.addEventListener('DOMContentLoaded', async () => {
    // Get the article filename from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const articleFilename = urlParams.get('article');
    
    // Load site configuration first
    try {
        const response = await fetch(`${API_BASE_URL}/site`);
        if (!response.ok) {
            throw new Error(`Failed to fetch site configuration: ${response.status} ${response.statusText}`);
        }
        
        siteConfig = await response.json();
        
        // Update site elements
        updateSiteElements();
        
        // Then load the article
        if (articleFilename) {
            loadArticle(articleFilename);
        } else {
            showError('No article specified');
        }
    } catch (error) {
        console.error('Error fetching site configuration:', error);
        showError('Could not load site configuration. Please make sure the server is running.');
    }
});

// Update site elements based on configuration
function updateSiteElements() {
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

// Load the article content from the API
async function loadArticle(filename) {
    try {
        const response = await fetch(`${API_BASE_URL}/articles/${filename}`);
        
        if (!response.ok) {
            throw new Error(`Failed to load article: ${response.status} ${response.statusText}`);
        }
        
        const markdown = await response.text();
        renderArticle(markdown);
        
        // Update page title with article title
        const titleMatch = markdown.match(/# (.+)/);
        if (titleMatch && titleMatch[1]) {
            document.title = `${titleMatch[1]} | Cosmic Insights`;
        }
    } catch (error) {
        console.error('Error loading article:', error);
        showError('Could not load the article. Please make sure the server is running.');
    }
}

// Parse and render the markdown content
function renderArticle(markdown) {
    const articleContent = document.getElementById('article-content');
    
    // Configure marked options
    marked.setOptions({
        highlight: function(code, lang) {
            if (lang && hljs.getLanguage(lang)) {
                return hljs.highlight(code, { language: lang }).value;
            }
            return hljs.highlightAuto(code).value;
        },
        breaks: true,
        gfm: true
    });
    
    // Parse the markdown
    const htmlContent = marked.parse(markdown);
    
    // Replace the loading spinner with the article content
    articleContent.innerHTML = htmlContent;
    
    // Extract metadata and format it
    formatArticleMetadata();
    
    // Add smooth scrolling to anchor links
    addSmoothScrolling();
}

// Format the article metadata (author, date, tags)
function formatArticleMetadata() {
    const articleContent = document.getElementById('article-content');
    
    // Get the first image (header image)
    const headerImage = articleContent.querySelector('img');
    
    // Get the title (first h1)
    const title = articleContent.querySelector('h1');
    
    // Find author, description, date and tags paragraphs
    const paragraphs = articleContent.querySelectorAll('p');
    let author, description, date, tags;
    
    paragraphs.forEach(p => {
        const text = p.textContent;
        if (text.startsWith('Author:')) {
            author = p;
        } else if (text.includes('Date:')) {
            date = p;
        } else if (text.includes('Tags:')) {
            tags = p;
        } else if (p.querySelector('em') && !description) {
            // The first paragraph with italic text is likely the description
            description = p;
        }
    });
    
    // Create metadata container
    const metadataDiv = document.createElement('div');
    metadataDiv.className = 'article-meta';
    
    // Move elements to metadata div
    if (author) {
        metadataDiv.appendChild(author);
        author.className = 'article-author';
    }
    
    if (description) {
        metadataDiv.appendChild(description);
        description.className = 'article-description';
    }
    
    if (date) {
        metadataDiv.appendChild(date);
        date.className = 'article-date';
    }
    
    if (tags) {
        // Convert tags to individual spans
        const tagsText = tags.textContent.replace('Tags:', '').trim();
        const tagsList = tagsText.split(',').map(tag => tag.trim());
        
        const tagsDiv = document.createElement('div');
        tagsDiv.className = 'article-tags';
        
        tagsList.forEach(tag => {
            const tagSpan = document.createElement('span');
            tagSpan.className = 'article-tag';
            tagSpan.textContent = tag;
            tagsDiv.appendChild(tagSpan);
        });
        
        metadataDiv.appendChild(tagsDiv);
        tags.remove();
    }
    
    // Insert metadata after title
    if (title && title.nextSibling) {
        articleContent.insertBefore(metadataDiv, title.nextSibling);
    } else if (title) {
        articleContent.appendChild(metadataDiv);
    }
    
    // Remove the duplicate title (second h1)
    const headings = articleContent.querySelectorAll('h1');
    if (headings.length > 1) {
        headings[1].remove();
    }
}

// Add smooth scrolling to anchor links
function addSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Show error message
function showError(message) {
    const articleContent = document.getElementById('article-content');
    articleContent.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <h2>Oops! Something went wrong</h2>
            <p>${message}</p>
            <a href="articles.html" class="back-link">Go back to Articles</a>
        </div>
    `;
}
