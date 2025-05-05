// Main JavaScript file for Toonzy website

document.addEventListener('DOMContentLoaded', function() {
    // Tab functionality for comic details page
    const tabButtons = document.querySelectorAll('.tab-btn');
    if (tabButtons.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Get the tab to activate
                const tabToActivate = button.getAttribute('data-tab');
                
                // Deactivate all tabs and buttons
                document.querySelectorAll('.tab-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                document.querySelectorAll('.tab-pane').forEach(pane => {
                    pane.classList.remove('active');
                });
                
                // Activate the selected tab and button
                button.classList.add('active');
                document.getElementById(tabToActivate)?.classList.add('active');
            });
        });
    }

    // Mobile menu toggle (for responsive design)
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
        });
    }

    // Favorites functionality
    const favoriteButtons = document.querySelectorAll('.btn-favorite');
    if (favoriteButtons.length > 0) {
        favoriteButtons.forEach(button => {
            button.addEventListener('click', () => {
                button.classList.toggle('favorited');
                
                // Here you would typically send an API request to add/remove from favorites
                // Since this is a static site, we'll just toggle the class and show a message
                const isFavorited = button.classList.contains('favorited');
                const message = isFavorited ? 
                    'Added to favorites!' : 
                    'Removed from favorites!';
                
                alert(message);
            });
        });
    }

    // Implement smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href !== '#') {
                e.preventDefault();
                
                document.querySelector(href).scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Implement image lazy loading
    if ('loading' in HTMLImageElement.prototype) {
        // Browser supports the loading attribute
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => {
            img.src = img.dataset.src;
        });
    } else {
        // Fallback for browsers that don't support loading attribute
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
        document.body.appendChild(script);
    }

    // Search functionality
    const searchForm = document.querySelector('.search-box');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const searchInput = this.querySelector('input');
            const searchTerm = searchInput.value.trim();
            
            if (searchTerm.length > 0) {
                // In a real implementation, this would redirect to search results page
                // For this static demo, just show an alert
                alert(`You searched for: ${searchTerm}`);
            }
        });
    }
});

/**
 * Hero Banner Carousel Functionality
 */
document.addEventListener('DOMContentLoaded', function() {
    // Get carousel elements
    const slides = document.querySelectorAll('.hero-slide');
    const indicators = document.querySelectorAll('.indicator');
    const prevBtn = document.querySelector('.banner-prev');
    const nextBtn = document.querySelector('.banner-next');
    
    if (!slides.length) return; // Exit if no slides found
    
    let currentSlide = 0;
    let slideInterval = null;
    const intervalTime = 2000; // 5 seconds between slides
    
    // Initialize carousel
    initCarousel();
    
    function initCarousel() {
        // Set initial active slide
        setActiveSlide(currentSlide);
        
        // Start automatic slide transition
        startSlideTimer();
        
        // Add event listeners
        prevBtn?.addEventListener('click', goToPrevSlide);
        nextBtn?.addEventListener('click', goToNextSlide);
        
        // Add indicator click events
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                currentSlide = index;
                setActiveSlide(currentSlide);
                resetSlideTimer();
            });
        });
        
        // Pause slideshow on mouseover
        const carousel = document.querySelector('.banner-carousel');
        carousel?.addEventListener('mouseenter', () => {
            clearInterval(slideInterval);
        });
        
        // Resume slideshow on mouseleave
        carousel?.addEventListener('mouseleave', () => {
            startSlideTimer();
        });
    }
    
    function setActiveSlide(index) {
        // Remove active class from all slides and indicators
        slides.forEach(slide => slide.classList.remove('active'));
        indicators.forEach(indicator => indicator.classList.remove('active'));
        
        // Add active class to current slide and indicator
        slides[index].classList.add('active');
        indicators[index]?.classList.add('active');
    }
    
    function goToNextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        setActiveSlide(currentSlide);
        resetSlideTimer();
    }
    
    function goToPrevSlide() {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        setActiveSlide(currentSlide);
        resetSlideTimer();
    }
    
    function startSlideTimer() {
        // Clear any existing interval
        clearInterval(slideInterval);
        
        // Start new interval
        slideInterval = setInterval(goToNextSlide, intervalTime);
    }
    
    function resetSlideTimer() {
        // Reset the interval timer
        clearInterval(slideInterval);
        startSlideTimer();
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', e => {
        // Only respond to keyboard if carousel is in viewport
        const carousel = document.querySelector('.banner-carousel');
        if (!carousel) return;
        
        const rect = carousel.getBoundingClientRect();
        const isInViewport = rect.top < window.innerHeight && rect.bottom >= 0;
        
        if (isInViewport) {
            if (e.key === 'ArrowLeft') {
                goToPrevSlide();
            } else if (e.key === 'ArrowRight') {
                goToNextSlide();
            }
        }
    });
    
    // Add swipe gestures for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    const carousel = document.querySelector('.banner-carousel');
    if (carousel) {
        carousel.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        carousel.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });
    }
    
    function handleSwipe() {
        const threshold = 50; // Minimum distance for swipe
        
        if (touchEndX < touchStartX - threshold) {
            // Swipe left - go to next slide
            goToNextSlide();
        } else if (touchEndX > touchStartX + threshold) {
            // Swipe right - go to previous slide
            goToPrevSlide();
        }
    }
});

// Handle tab button navigation
document.querySelectorAll('.tab-btn[data-href]').forEach(button => {
    button.addEventListener('click', () => {
        const href = button.getAttribute('data-href');
        if (href) {
            window.location.href = href;
        }
    });
});



// Day selection functionality - simplified for same content
document.addEventListener('DOMContentLoaded', function() {
    // Get all day items
    const dayItems = document.querySelectorAll('.day-item');
    
    // Add click event listener to each day item
    dayItems.forEach(day => {
        day.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent default link behavior
            
            // Remove active class from all day items
            dayItems.forEach(item => {
                item.classList.remove('active');
            });
            
            // Add active class to the clicked day item
            this.classList.add('active');
            
            // You could add more functionality here if needed
            // For example: updating a header to show which day is selected
            const selectedDay = this.textContent;
            const dayHeader = document.querySelector('.day-header');
            if (dayHeader) {
                dayHeader.textContent = `${selectedDay}'s Comics`;
            }
        });
    });
});



// Handle active class toggling for days and genres
document.addEventListener('DOMContentLoaded', function() {
    // Function to handle active class toggling for any group of elements
    function setupActiveToggle(selector) {
        const items = document.querySelectorAll(selector);
        
        items.forEach(item => {
            // Skip the "More" button for genres
            if (item.classList.contains('more')) {
                return;
            }
            
            item.addEventListener('click', function(e) {
                e.preventDefault(); // Prevent default link behavior
                
                // Remove active class from all items in this group
                items.forEach(i => {
                    if (!i.classList.contains('more')) {
                        i.classList.remove('active');
                    }
                });
                
                // Add active class to the clicked item
                this.classList.add('active');
            });
        });
    }
    
    // Apply the function to both days and genres
    setupActiveToggle('.day-item');
    setupActiveToggle('.genre-item');
    
    // Special handling for the "More" button in genres
    const moreButton = document.querySelector('.genre-item.more');
    if (moreButton) {
        moreButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Example functionality for "More" button - show hidden genres
            // You can replace this with your desired behavior
            alert('You clicked the More button. This would show additional genres.');
            
            // Alternatively, you could reveal hidden genre items:
            // const hiddenGenres = document.querySelector('.hidden-genres');
            // if (hiddenGenres) {
            //     hiddenGenres.style.display = 'block';
            //     this.style.display = 'none'; // Hide the "More" button
            // }
        });
    }
});