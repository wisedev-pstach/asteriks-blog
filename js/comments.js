// Giscus comments integration for Asterisk* blog
// This script handles loading and configuring the Giscus commenting system

function loadComments() {
    // Only load comments on article pages
    if (!window.location.pathname.includes('article.html')) {
        return;
    }

    // Get the article ID from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');
    
    if (!articleId) {
        console.error('No article ID found in URL');
        return;
    }
    
    // Listen for messages from the Giscus iframe to inject custom styles and handle DOM manipulation
    window.addEventListener('message', (event) => {
        if (event.origin !== 'https://giscus.app') return;
        if (!(typeof event.data === 'object' && event.data.giscus)) return;
        
        const giscusFrame = document.querySelector('iframe.giscus-frame');
        if (!giscusFrame) return;
        
        // If the message indicates the iframe is ready
        if (event.data.giscus.discussion) {
            // Get our custom CSS
            fetch('/css/giscus-custom.css')
                .then(response => response.text())
                .then(css => {
                    // Create a more robust script to manipulate the DOM
                    const manipulationScript = `
                        function moveReactionsToTop() {
                            console.log('Moving reactions to top...');
                            const timeline = document.querySelector('.gsc-timeline');
                            const reactions = document.querySelector('.gsc-reactions');
                            const header = document.querySelector('.gsc-header');
                            const commentsCount = document.querySelector('.gsc-comments-count');
                            
                            if (!timeline || !reactions) {
                                console.log('Required elements not found, retrying in 500ms');
                                setTimeout(moveReactionsToTop, 500);
                                return;
                            }
                            
                            console.log('Found required elements, proceeding with DOM manipulation');
                            
                            // Create a custom container for reactions at the top
                            const reactionsTopContainer = document.createElement('div');
                            reactionsTopContainer.className = 'reactions-top-container';
                            reactionsTopContainer.style.marginBottom = '20px';
                            reactionsTopContainer.style.paddingBottom = '10px';
                            reactionsTopContainer.style.borderBottom = '1px solid rgba(100, 255, 218, 0.1)';
                            reactionsTopContainer.style.display = 'flex';
                            reactionsTopContainer.style.alignItems = 'center';
                            
                            // Create a label for reactions
                            const reactionsLabel = document.createElement('div');
                            reactionsLabel.textContent = 'Reactions: ';
                            reactionsLabel.style.color = '#64ffda';
                            reactionsLabel.style.marginRight = '10px';
                            reactionsLabel.style.fontSize = '0.9rem';
                            
                            // Style the reaction buttons
                            const reactionButtons = reactions.querySelectorAll('button');
                            reactionButtons.forEach(button => {
                                button.style.borderRadius = '30px';
                                button.style.padding = '4px 12px';
                                button.style.marginRight = '8px';
                                button.style.transition = 'all 0.3s ease';
                                button.style.backgroundColor = 'rgba(22, 33, 62, 0.7)';
                                button.style.border = '1px solid rgba(100, 255, 218, 0.1)';
                                
                                button.addEventListener('mouseover', () => {
                                    button.style.backgroundColor = 'rgba(100, 255, 218, 0.2)';
                                    button.style.borderColor = '#64ffda';
                                    button.style.transform = 'translateY(-2px)';
                                    button.style.boxShadow = '0 4px 12px rgba(100, 255, 218, 0.2)';
                                });
                                
                                button.addEventListener('mouseout', () => {
                                    if (!button.classList.contains('gsc-reaction-selected')) {
                                        button.style.backgroundColor = 'rgba(22, 33, 62, 0.7)';
                                        button.style.borderColor = 'rgba(100, 255, 218, 0.1)';
                                        button.style.transform = 'translateY(0)';
                                        button.style.boxShadow = 'none';
                                    }
                                });
                            });
                            
                            // Add elements to the container
                            reactionsTopContainer.appendChild(reactionsLabel);
                            reactionsTopContainer.appendChild(reactions.cloneNode(true));
                            
                            // Insert at the top of the comments section
                            const mainContainer = document.querySelector('.gsc-main');
                            if (mainContainer && mainContainer.firstChild) {
                                mainContainer.insertBefore(reactionsTopContainer, mainContainer.firstChild);
                                reactions.style.display = 'none'; // Hide the original reactions
                                
                                console.log('Successfully moved reactions to top');
                            } else {
                                console.log('Could not find main container, insertion failed');
                            }
                        }
                        
                        // Initial call with a slight delay to ensure DOM is ready
                        setTimeout(moveReactionsToTop, 1000);
                        
                        // Also set up a mutation observer to handle dynamic content changes
                        const observer = new MutationObserver((mutations) => {
                            for (const mutation of mutations) {
                                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                                    // Check if our custom container exists, if not try to create it again
                                    if (!document.querySelector('.reactions-top-container')) {
                                        console.log('Detected DOM changes, attempting to move reactions again');
                                        moveReactionsToTop();
                                    }
                                }
                            }
                        });
                        
                        // Start observing the document body for DOM changes
                        observer.observe(document.body, { childList: true, subtree: true });
                    `;
                    
                    // Combine CSS with the manipulation script
                    const customTheme = css + '\n<style></style>\n<script>' + manipulationScript + '</script>';
                    
                    // Inject into the iframe
                    giscusFrame.contentWindow.postMessage({
                        giscus: {
                            setConfig: {
                                theme: 'custom',
                                customTheme: customTheme
                            }
                        }
                    }, 'https://giscus.app');
                })
                .catch(error => console.error('Error loading custom Giscus CSS:', error));
        }
    });

    // Create the comments container if it doesn't exist
    let commentsContainer = document.getElementById('comments-container');
    if (!commentsContainer) {
        commentsContainer = document.createElement('div');
        commentsContainer.id = 'comments-container';
        commentsContainer.className = 'comments-section';
        
        // Add a heading
        const heading = document.createElement('h2');
        heading.textContent = 'Comments';
        commentsContainer.appendChild(heading);
        
        // Add a description
        const description = document.createElement('p');
        description.className = 'comments-description';
        description.textContent = 'Comments are powered by GitHub Discussions. You\'ll need a GitHub account to participate.';
        commentsContainer.appendChild(description);
        
        // Create the actual giscus container
        const giscusContainer = document.createElement('div');
        giscusContainer.className = 'giscus-container';
        commentsContainer.appendChild(giscusContainer);
        
        // Add the comments container to the page in a better position
        const articleContainer = document.querySelector('.article-container');
        if (articleContainer) {
            // Insert comments inside article container for better visual integration
            articleContainer.appendChild(commentsContainer);
        }
    }

    // Configure and load Giscus
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', 'wisedev-pstach/asteriks-blog'); // Your GitHub repo
    script.setAttribute('data-repo-id', 'R_kgDOOzbK4g'); // Your repo ID
    script.setAttribute('data-category', 'Article Comments');
    script.setAttribute('data-category-id', 'DIC_kwDOOzbK4s4Cq5Tm'); // Your category ID
    script.setAttribute('data-mapping', 'specific');
    script.setAttribute('data-term', articleId);
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'top');
    script.setAttribute('data-theme', 'dark_dimmed');
    script.setAttribute('data-theme-dark', 'dark_dimmed');
    script.setAttribute('data-loading', 'eager');
    // This is the key attribute for positioning reactions at the top
    script.setAttribute('data-reactions-placement', 'top');
    script.setAttribute('data-lang', 'en');
    script.setAttribute('data-loading', 'lazy');
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;

    // Add the script to the giscus container
    const giscusContainer = document.querySelector('.giscus-container');
    if (giscusContainer) {
        giscusContainer.innerHTML = ''; // Clear any existing content
        giscusContainer.appendChild(script);
    }
}



// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', loadComments);

// Also initialize when the page content changes (for SPA-like behavior)
document.addEventListener('contentLoaded', loadComments);
