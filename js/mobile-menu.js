/**
 * Mobile Menu Implementation for Toonzy
 * This script handles the mobile menu toggle and related mobile navigation functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Set up mobile menu - add toggle button if it doesn't exist
    setupMobileMenu();
    
    // Handle orientation changes
    window.addEventListener('orientationchange', function() {
        // Close mobile menu on orientation change
        const mainNav = document.querySelector('.main-nav');
        if (mainNav && mainNav.classList.contains('active')) {
            mainNav.classList.remove('active');
        }
    });
    
    // Handle window resize (for desktop/mobile transitions)
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            // If window width is greater than 768px, ensure mobile menu is reset
            if (window.innerWidth > 768) {
                const mainNav = document.querySelector('.main-nav');
                if (mainNav) {
                    mainNav.classList.remove('active');
                    mainNav.style.display = '';
                }
            }
        }, 250);
    });
});

function setupMobileMenu() {
    const header = document.querySelector('.header-content');
    
    // Skip if header doesn't exist or we've already added the menu toggle
    if (!header || document.querySelector('.menu-toggle')) {
        return;
    }
    
    // Create mobile menu toggle button
    const menuToggle = document.createElement('button');
    menuToggle.className = 'menu-toggle';
    menuToggle.setAttribute('aria-label', 'Toggle navigation menu');
    menuToggle.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
    `;
    
    // Insert the toggle button after the logo
    const logo = header.querySelector('.logo');
    if (logo) {
        logo.parentNode.insertBefore(menuToggle, logo.nextSibling);
    } else {
        // If no logo, just prepend to header
        header.prepend(menuToggle);
    }
    
    // Add mobile menu functionality
    const mainNav = document.querySelector('.main-nav');
    if (mainNav) {
        // Initially hide menu on mobile
        if (window.innerWidth <= 768) {
            mainNav.classList.add('mobile-hidden');
        }
        
        // Add CSS for mobile menu if not already present
        if (!document.getElementById('mobile-menu-styles')) {
            const style = document.createElement('style');
            style.id = 'mobile-menu-styles';
            style.textContent = `
                @media (max-width: 768px) {
                    .menu-toggle {
                        display: flex !important;
                        align-items: center;
                        justify-content: center;
                        background: transparent;
                        border: none;
                        color: white;
                        cursor: pointer;
                        padding: 5px;
                        z-index: 1001;
                    }
                    
                    .main-nav {
                        display: none;
                        width: 100%;
                        order: 3;
                    }
                    
                    .main-nav.active {
                        display: block;
                        animation: fadeIn 0.3s ease-in-out;
                    }
                    
                    .main-nav ul {
                        flex-direction: column;
                        align-items: center;
                        padding: 10px 0;
                    }
                    
                    .main-nav ul li {
                        width: 100%;
                        text-align: center;
                    }
                    
                    .main-nav ul li a {
                        display: block;
                        padding: 12px 20px;
                        margin: 5px 0;
                    }
                    
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(-10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Toggle menu on click
        menuToggle.addEventListener('click', function() {
            mainNav.classList.toggle('active');
            
            // Toggle aria-expanded attribute for accessibility
            const expanded = mainNav.classList.contains('active');
            menuToggle.setAttribute('aria-expanded', expanded);
            
            if (expanded) {
                // Add event listener to close menu when clicking outside
                setTimeout(() => {
                    document.addEventListener('click', closeMenuOnClickOutside);
                }, 10);
            } else {
                document.removeEventListener('click', closeMenuOnClickOutside);
            }
        });
        
        // Function to close menu when clicking outside
        function closeMenuOnClickOutside(event) {
            if (!mainNav.contains(event.target) && !menuToggle.contains(event.target)) {
                mainNav.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', false);
                document.removeEventListener('click', closeMenuOnClickOutside);
            }
        }
        
        // Close menu when a nav link is clicked
        mainNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    mainNav.classList.remove('active');
                    menuToggle.setAttribute('aria-expanded', false);
                }
            });
        });
    }
}

// Function to enhance touch targets for better mobile experience
function enhanceTouchTargets() {
    // Only apply on mobile devices
    if (window.innerWidth > 768) return;
    
    // Navigation links
    document.querySelectorAll('.main-nav a, .btn-settings, .coins').forEach(element => {
        element.style.padding = '12px 20px';
    });
    
    // Buttons
    document.querySelectorAll('button:not(.menu-toggle)').forEach(button => {
        if (button.offsetWidth < 44 || button.offsetHeight < 44) {
            button.style.minWidth = '44px';
            button.style.minHeight = '44px';
        }
    });
    
    // Filter and sort buttons
    document.querySelectorAll('.filter-btn, .sort-btn').forEach(btn => {
        btn.style.padding = '8px 15px';
    });
    
    // Chapter item links
    document.querySelectorAll('.chapter-item').forEach(item => {
        item.style.padding = '12px 10px';
    });
}

// Call this function after page load
document.addEventListener('DOMContentLoaded', function() {
    // Add a slight delay to ensure the DOM is fully processed
    setTimeout(enhanceTouchTargets, 500);
});