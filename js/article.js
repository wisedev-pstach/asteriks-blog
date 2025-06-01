// Static site version - no API needed

// Site configuration and articles data will be loaded from static files
let siteConfig = {};
let articlesData = [];
let currentArticle = null;
let currentArticleIndex = -1;

// DOM elements
const articleTitle = document.querySelector('.article-title');
const articleAuthor = document.querySelector('.author-name');
const articleDate = document.querySelector('.article-date');
const articleTags = document.querySelector('.article-tags');
const articleImage = document.querySelector('.article-featured-image img');
const articleContent = document.querySelector('.article-content');
const prevArticleLink = document.querySelector('.prev-article');
const nextArticleLink = document.querySelector('.next-article');
const prevArticleTitle = document.querySelector('.prev-title');
const nextArticleTitle = document.querySelector('.next-title');
const relatedArticlesGrid = document.querySelector('.related-articles-grid');

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing article page...');
    
    // Get article ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');
    
    if (!articleId) {
        showError('No article ID specified');
        return;
    }
    
    // Load site data and article
    loadSiteData(articleId);
});

// Function to load site data from static JSON file
async function loadSiteData(articleId) {
    try {
        const response = await fetch('/articles/index.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch site configuration: ${response.status} ${response.statusText}`);
        }
        
        siteConfig = await response.json();
        articlesData = siteConfig.articles;
        
        // Update page title and other site elements
        updateSiteElements();
        
        // Find the requested article
        currentArticle = articlesData.find(article => article.id === articleId);
        currentArticleIndex = articlesData.findIndex(article => article.id === articleId);
        
        if (!currentArticle) {
            showError(`Article with ID "${articleId}" not found`);
            return;
        }
        
        // Load and display the article
        loadArticle(currentArticle);
        
        // Update navigation links
        updateNavigation();
    
        
        // Dispatch an event to notify that content has been loaded (for comments)
        document.dispatchEvent(new Event('contentLoaded'));
    } catch (error) {
        console.error('Error fetching site data:', error);
        showError(`Error loading article: ${error.message}`);
    }
}

// Update site elements based on configuration
function updateSiteElements() {
    // Update page title
    document.title = `${currentArticle ? currentArticle.title + ' - ' : ''}${siteConfig.site.title}`;
    
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

// Function to load and display an article
async function loadArticle(article) {
    // Update SEO meta tags with article information
    updateSEOMetaTags(article);
    
    // Load article content
    try {
        const response = await fetch(`/articles/${article.filename}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch article content: ${response.status} ${response.statusText}`);
        }
        
        const markdownContent = await response.text();
        
        // Process the markdown content
        // First, check if there's a front matter section (between --- and ---)
        let contentToRender = markdownContent;
        const frontMatterMatch = markdownContent.match(/^---[\s\S]*?---/);
        
        if (frontMatterMatch) {
            // Remove the front matter
            contentToRender = markdownContent.substring(frontMatterMatch[0].length).trim();
        }
        
        // Check if the first line is an image (starts with ![])
        const lines = contentToRender.split('\n');
        let firstNonEmptyLine = 0;
        while (firstNonEmptyLine < lines.length && lines[firstNonEmptyLine].trim() === '') {
            firstNonEmptyLine++;
        }
        
        // If we found an image as the first content, use it as the featured image
        if (firstNonEmptyLine < lines.length && lines[firstNonEmptyLine].trim().startsWith('![')) {
            const imgMatch = lines[firstNonEmptyLine].match(/!\[.*?\]\((.*?)\)/);
            if (imgMatch && imgMatch[1] && articleImage) {
                articleImage.src = imgMatch[1];
                articleImage.alt = article.title;
                
                // Remove the image line from the content to avoid duplication
                lines.splice(firstNonEmptyLine, 1);
                contentToRender = lines.join('\n');
            }
        }
        
        // Remove the title (# Title), author, date, and tags lines
        // These are typically the next few lines after the image
        let linesToRemove = 0;
        let currentLine = firstNonEmptyLine;
        
        // Remove the title (starts with # )
        if (currentLine < lines.length && lines[currentLine].trim().startsWith('#')) {
            linesToRemove++;
            currentLine++;
        }
        
        // Remove blank lines
        while (currentLine < lines.length && lines[currentLine].trim() === '') {
            linesToRemove++;
            currentLine++;
        }
        
        // Remove author line (starts with **Author:** or similar)
        if (currentLine < lines.length && 
            (lines[currentLine].trim().startsWith('**Author:**') || 
             lines[currentLine].trim().toLowerCase().includes('author'))) {
            linesToRemove++;
            currentLine++;
        }
        
        // Remove date line (starts with **Date:** or similar)
        if (currentLine < lines.length && 
            (lines[currentLine].trim().startsWith('**Date:**') || 
             lines[currentLine].trim().toLowerCase().includes('date'))) {
            linesToRemove++;
            currentLine++;
        }
        
        // Remove tags line (starts with **Tags:** or similar)
        if (currentLine < lines.length && 
            (lines[currentLine].trim().startsWith('**Tags:**') || 
             lines[currentLine].trim().toLowerCase().includes('tags'))) {
            linesToRemove++;
            currentLine++;
        }
        
        // Remove blank lines after metadata
        while (currentLine < lines.length && lines[currentLine].trim() === '') {
            linesToRemove++;
            currentLine++;
        }
        
        // Remove the identified lines
        if (linesToRemove > 0) {
            lines.splice(firstNonEmptyLine, linesToRemove);
            contentToRender = lines.join('\n');
        }
        
        // Convert markdown to HTML using marked.js
        const htmlContent = marked.parse(contentToRender);
        
        // Update article content
        articleContent.innerHTML = htmlContent;
        
        // Add syntax highlighting if Prism.js is available
        if (window.Prism) {
            Prism.highlightAll();
        }
        
        // Add structured data for better SEO
        addStructuredData(article);
    } catch (error) {
        console.error('Error fetching article content:', error);
        articleContent.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <h2>Could not load article content</h2>
                <p>Error: ${error.message}</p>
            </div>
        `;
    }
}

// Function to update navigation links
function updateNavigation() {
    // Previous article
    if (currentArticleIndex > 0) {
        const prevArticle = articlesData[currentArticleIndex - 1];
        prevArticleLink.href = `article.html?id=${prevArticle.id}`;
        prevArticleTitle.textContent = prevArticle.title;
        prevArticleLink.style.display = 'flex';
    } else {
        prevArticleLink.style.display = 'none';
    }
    
    // Next article
    if (currentArticleIndex < articlesData.length - 1) {
        const nextArticle = articlesData[currentArticleIndex + 1];
        nextArticleLink.href = `article.html?id=${nextArticle.id}`;
        nextArticleTitle.textContent = nextArticle.title;
        nextArticleLink.style.display = 'flex';
    } else {
        nextArticleLink.style.display = 'none';
    }
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
    
    card.innerHTML = `
        <a href="article.html?id=${article.id}" class="article-card-link">
            <div class="article-card-image">
                <img src="${article.image}" alt="${article.title}">
            </div>
            <div class="article-card-content">
                <h3>${article.title}</h3>
                <div class="article-card-meta">
                    <span class="article-card-date">${formattedDate}</span>
                    <span class="article-card-author">By ${article.author}</span>
                </div>
                <p class="article-card-excerpt">${article.excerpt}</p>
            </div>
        </a>
    `;
    
    return card;
}

// Function to update SEO meta tags with article information
function updateSEOMetaTags(article) {
    // Base URL for absolute URLs
    const baseUrl = window.location.origin;
    const articleUrl = `${baseUrl}/article.html?id=${article.id}`;
    
    // Create a clean excerpt from the article description
    const description = article.description || `Read about ${article.title} in our astronomy blog.`;
    const cleanDescription = description.replace(/\s+/g, ' ').trim();
    
    // Update basic meta tags
    document.querySelector('meta[name="description"]').setAttribute('content', cleanDescription);
    document.querySelector('meta[name="keywords"]').setAttribute('content', `astronomy, ${article.tags.join(', ')}, space science`);
    document.querySelector('meta[name="author"]').setAttribute('content', article.author);
    
    // Update Open Graph meta tags
    document.querySelector('meta[property="og:title"]').setAttribute('content', article.title);
    document.querySelector('meta[property="og:description"]').setAttribute('content', cleanDescription);
    document.querySelector('meta[property="og:url"]').setAttribute('content', articleUrl);
    document.querySelector('meta[property="og:image"]').setAttribute('content', `${baseUrl}${article.image}`);
    
    // Update Twitter Card meta tags
    document.querySelector('meta[name="twitter:title"]').setAttribute('content', article.title);
    document.querySelector('meta[name="twitter:description"]').setAttribute('content', cleanDescription);
    document.querySelector('meta[name="twitter:image"]').setAttribute('content', `${baseUrl}${article.image}`);
    
    // Update canonical URL
    document.querySelector('link[rel="canonical"]').setAttribute('href', articleUrl);
}

// Function to add structured data for better SEO
function addStructuredData(article) {
    // Format the date in ISO format
    const publishDate = new Date(article.date).toISOString();
    
    // Create structured data for the article
    const articleStructuredData = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": article.title,
        "image": [
            `${window.location.origin}${article.image}`
        ],
        "datePublished": publishDate,
        "dateModified": publishDate,
        "author": {
            "@type": "Person",
            "name": article.author
        },
        "publisher": {
            "@type": "Organization",
            "name": siteConfig.siteName,
            "logo": {
                "@type": "ImageObject",
                "url": `${window.location.origin}/images/logo.png`
            }
        },
        "description": article.description || `Read about ${article.title} in our astronomy blog.`,
        "keywords": article.tags.join(', ')
    };
    
    // Create a script element for the structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(articleStructuredData);
    
    // Add to the head of the document
    document.head.appendChild(script);
}

// Function to show error message
function showError(message) {
    if (articleContent) {
        articleContent.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <h2>Error</h2>
                <p>${message}</p>
                <a href="articles.html" class="btn btn-primary">Back to Articles</a>
            </div>
        `;
    }
    
    // Hide other elements
    if (articleTitle) articleTitle.textContent = 'Error';
    if (articleAuthor) articleAuthor.textContent = '';
    if (articleDate) articleDate.textContent = '';
    if (articleTags) articleTags.innerHTML = '';
    if (articleImage) articleImage.style.display = 'none';
}
