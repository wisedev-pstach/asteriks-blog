// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Navigation scroll effect
    const header = document.querySelector('header');
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    // Scroll event for header
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
    
    // Mobile menu toggle
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });
    
    // Close mobile menu when clicking a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });
    
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    // Function to handle element visibility
    const observerCallback = (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    };
    
    // Create observer
    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    // Observe article cards
    document.querySelectorAll('.article-card').forEach(card => {
        observer.observe(card);
        // Add staggered delay for cards
        const index = Array.from(card.parentNode.children).indexOf(card);
        card.style.transitionDelay = `${index * 0.1}s`;
    });
    
    // Observe topic cards
    document.querySelectorAll('.topic-card').forEach(card => {
        observer.observe(card);
        // Add staggered delay for cards
        const index = Array.from(card.parentNode.children).indexOf(card);
        card.style.transitionDelay = `${index * 0.1}s`;
    });
    
    // Parallax effect for background
    const parallaxSection = document.querySelector('.parallax-section');
    
    window.addEventListener('scroll', () => {
        const scrollPosition = window.pageYOffset;
        const sectionOffset = parallaxSection.offsetTop;
        const distance = scrollPosition - sectionOffset;
        
        if (scrollPosition > sectionOffset - window.innerHeight && 
            scrollPosition < sectionOffset + parallaxSection.offsetHeight) {
            parallaxSection.style.backgroundPositionY = `${distance * 0.5}px`;
        }
    });
    
    // Star field mouse movement effect
    const stars = document.querySelector('.stars');
    const twinkling = document.querySelector('.twinkling');
    
    document.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        
        stars.style.transform = `translate(${-x * 10}px, ${-y * 10}px)`;
        twinkling.style.transform = `translate(${-x * 20}px, ${-y * 20}px)`;
    });
    
    // Newsletter form submission (prevent default for demo)
    const newsletterForm = document.querySelector('.newsletter-form');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = newsletterForm.querySelector('input').value;
            
            if (email) {
                // Show success message (in a real app, you'd send this to a server)
                const formContainer = newsletterForm.parentElement;
                newsletterForm.innerHTML = '<p class="success-message">Thank you for subscribing! 🚀</p>';
                
                // Style the success message
                const successMessage = document.querySelector('.success-message');
                successMessage.style.fontSize = '1.2rem';
                successMessage.style.fontWeight = '600';
                successMessage.style.color = '#00d9ff';
                successMessage.style.padding = '20px';
                successMessage.style.animation = 'fadeInUp 0.5s ease forwards';
            }
        });
    }
    
    // Add particle effect to the hero section
    createParticles();
});

// Particle effect
function createParticles() {
    const heroSection = document.querySelector('.hero');
    const particleContainer = document.createElement('div');
    particleContainer.className = 'particle-container';
    
    // Style the particle container
    particleContainer.style.position = 'absolute';
    particleContainer.style.top = '0';
    particleContainer.style.left = '0';
    particleContainer.style.width = '100%';
    particleContainer.style.height = '100%';
    particleContainer.style.overflow = 'hidden';
    particleContainer.style.zIndex = '0';
    
    // Add to hero section
    heroSection.appendChild(particleContainer);
    
    // Create particles
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        createParticle(particleContainer);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    
    // Random size between 1-4px
    const size = Math.random() * 3 + 1;
    
    // Random position
    const posX = Math.random() * 100;
    const posY = Math.random() * 100;
    
    // Random opacity
    const opacity = Math.random() * 0.5 + 0.3;
    
    // Random color (stars/space theme)
    const colors = ['#ffffff', '#6c63ff', '#00d9ff', '#ff6584'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    // Random animation duration
    const duration = Math.random() * 20 + 10;
    
    // Style the particle
    particle.style.position = 'absolute';
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.borderRadius = '50%';
    particle.style.backgroundColor = color;
    particle.style.left = `${posX}%`;
    particle.style.top = `${posY}%`;
    particle.style.opacity = opacity;
    particle.style.animation = `float ${duration}s ease-in-out infinite`;
    particle.style.animationDelay = `${Math.random() * 5}s`;
    
    // Add to container
    container.appendChild(particle);
    
    // Remove and recreate particles occasionally for variety
    setTimeout(() => {
        particle.remove();
        createParticle(container);
    }, duration * 1000);
}

// Simple fade-in for the hero title - no typing animation to avoid conflicts
document.addEventListener('DOMContentLoaded', () => {
    const title = document.querySelector('.hero .title');
    if (title) {
        // Make sure the title has the proper HTML with highlight span
        if (!title.innerHTML.includes('span')) {
            title.innerHTML = `Explore the <span class="highlight">Universe</span>`;
        }
        
        // Apply a simple fade-in animation
        title.style.opacity = '0';
        title.style.transform = 'translateY(20px)';
        title.style.transition = 'opacity 1s ease, transform 1s ease';
        
        // Trigger the animation after a short delay
        setTimeout(() => {
            title.style.opacity = '1';
            title.style.transform = 'translateY(0)';
        }, 300);
    }
});

// Add custom cursor effect
document.addEventListener('DOMContentLoaded', () => {
    const body = document.querySelector('body');
    
    // Create custom cursor elements
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    
    const cursorDot = document.createElement('div');
    cursorDot.className = 'cursor-dot';
    
    // Style the cursors
    cursor.style.position = 'fixed';
    cursor.style.width = '30px';
    cursor.style.height = '30px';
    cursor.style.borderRadius = '50%';
    cursor.style.border = '2px solid rgba(108, 99, 255, 0.5)';
    cursor.style.pointerEvents = 'none';
    cursor.style.transform = 'translate(-50%, -50%)';
    cursor.style.transition = 'width 0.3s, height 0.3s, border-color 0.3s';
    cursor.style.zIndex = '9999';
    
    cursorDot.style.position = 'fixed';
    cursorDot.style.width = '5px';
    cursorDot.style.height = '5px';
    cursorDot.style.borderRadius = '50%';
    cursorDot.style.backgroundColor = '#6c63ff';
    cursorDot.style.pointerEvents = 'none';
    cursorDot.style.transform = 'translate(-50%, -50%)';
    cursorDot.style.zIndex = '9999';
    
    // Add to body
    body.appendChild(cursor);
    body.appendChild(cursorDot);
    
    // Update cursor position on mouse move
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
        
        cursorDot.style.left = `${e.clientX}px`;
        cursorDot.style.top = `${e.clientY}px`;
    });
    
    // Add hover effect for links and buttons
    const hoverElements = document.querySelectorAll('a, button, .article-card, .topic-card');
    
    hoverElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            cursor.style.width = '50px';
            cursor.style.height = '50px';
            cursor.style.borderColor = 'rgba(255, 101, 132, 0.5)';
        });
        
        element.addEventListener('mouseleave', () => {
            cursor.style.width = '30px';
            cursor.style.height = '30px';
            cursor.style.borderColor = 'rgba(108, 99, 255, 0.5)';
        });
    });
    
    // Hide default cursor
    body.style.cursor = 'none';
    
    // Hide custom cursor when mouse leaves window
    document.addEventListener('mouseout', (e) => {
        if (e.relatedTarget === null) {
            cursor.style.display = 'none';
            cursorDot.style.display = 'none';
        }
    });
    
    document.addEventListener('mouseover', () => {
        cursor.style.display = 'block';
        cursorDot.style.display = 'block';
    });
});
