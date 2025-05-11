/**
 * PDF Viewer Implementation for Toonzy
 * This script handles the continuous scrolling manga-style reader with improved chapter navigation
 */

// Initialize PDF.js
if (typeof pdfjsLib === 'undefined') {
    console.error('PDF.js library not loaded!');
} else {
    // Set worker source to CDN
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
    
    // Create a global callback for when the viewer is ready
    window.VIEWER_READY = false;
}

class MangaReader {
    constructor(options) {
        // Get chapter from URL parameters
        this.currentChapter = this.getChapterFromUrl() || 1;
        this.totalChapters = 8; // Hardcoded total chapters (ch1.pdf to ch8.pdf)
        
        this.pdfUrl = `assets/pdfs/ch${this.currentChapter}.pdf`;
        this.container = options.container || document.getElementById('pdfContainer');
        this.currentPage = 1;
        this.totalPages = 0;
        this.pdfDoc = null;
        this.pageRendering = false;
        this.pageNumPending = null;
        this.scale = options.scale || 1.5;
        this.mobileScale = options.mobileScale || 1.0; // Separate scale for mobile
        this.continuousMode = true; // Always use continuous mode for vertical scrolling
        this.pageGap = options.pageGap || 20;
        this.pagesRendered = [];
        this.observers = [];
        this.visiblePage = 1;
        this.isMobile = window.innerWidth < 768;
        
        // Initialize UI elements
        this.pageCountElem = document.getElementById('totalPages');
        this.currentPageElem = document.getElementById('currentPage');
        this.prevButton = document.getElementById('prevPage');
        this.nextButton = document.getElementById('nextPage');
        this.prevChapterBtn = document.getElementById('prevChapter');
        this.nextChapterBtn = document.getElementById('nextChapter');
        
        // Update chapter title
        this.updateChapterTitle();
        
        // Initialize reader
        this.init();
        
        // Listen for orientation changes or window resizing
        window.addEventListener('resize', this.handleResize.bind(this));
        window.addEventListener('orientationchange', this.handleResize.bind(this));
    }
    
    // Get chapter number from URL parameters
    getChapterFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const chapter = urlParams.get('chapter');
        return chapter ? parseInt(chapter, 10) : null;
    }
    
    // Update the chapter title in the header
    updateChapterTitle() {
        const titleElement = document.querySelector('.comic-info h1');
        if (titleElement) {
            titleElement.textContent = `The Necromancer: Chapter ${this.currentChapter}`;
        }
    }
    
    init() {
        // Apply correct scale based on device
        this.updateScale();
        
        // Load PDF
        this.loadPdf();
        
        // Set up event listeners
        this.setUpEventListeners();
        
        // Set up scroll observer for continuous mode
        if (this.continuousMode) {
            this.setupIntersectionObserver();
        }
        
        // Update chapter navigation buttons state
        this.updateChapterNavigationButtons();
    }
    
    // Update chapter navigation buttons (disable if at first or last chapter)
    updateChapterNavigationButtons() {
        if (this.prevChapterBtn) {
            if (this.currentChapter <= 1) {
                this.prevChapterBtn.disabled = true;
                this.prevChapterBtn.classList.add('disabled');
            } else {
                this.prevChapterBtn.disabled = false;
                this.prevChapterBtn.classList.remove('disabled');
            }
        }
        
        if (this.nextChapterBtn) {
            if (this.currentChapter >= this.totalChapters) {
                this.nextChapterBtn.disabled = true;
                this.nextChapterBtn.classList.add('disabled');
            } else {
                this.nextChapterBtn.disabled = false;
                this.nextChapterBtn.classList.remove('disabled');
            }
        }
    }
    
    updateScale() {
        // Determine if we're on mobile and set appropriate scale
        this.isMobile = window.innerWidth < 768;
        this.currentScale = this.isMobile ? this.mobileScale : this.scale;
        
        // If we've already rendered pages, re-render them with the new scale
        if (this.pdfDoc && this.pagesRendered.length > 0) {
            this.renderContinuous();
        }
    }
    
    handleResize() {
        // Throttle the resize event to prevent excessive re-renders
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        this.resizeTimeout = setTimeout(() => {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth < 768;
            
            // Only update scale if we've crossed the mobile threshold
            if (wasMobile !== this.isMobile) {
                this.updateScale();
            }
        }, 300);
    }
    
    loadPdf() {
        // Show loading indicator
        this.showLoadingIndicator();
        
        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument(this.pdfUrl);
        
        loadingTask.promise.then(pdfDoc => {
            this.pdfDoc = pdfDoc;
            this.totalPages = pdfDoc.numPages;
            
            // Update UI
            if (this.pageCountElem) {
                this.pageCountElem.textContent = this.totalPages;
            }
            
            // Render first page
            if (this.continuousMode) {
                this.renderContinuous();
            } else {
                this.renderPage(this.currentPage);
            }
            
            // Hide loading indicator
            this.hideLoadingIndicator();
        }).catch(error => {
            console.error('Error loading PDF:', error);
            this.renderPlaceholder();
            this.hideLoadingIndicator();
        });
    }
    
    showLoadingIndicator() {
        // Create loading indicator if it doesn't exist
        if (!document.getElementById('pdf-loading')) {
            const loadingDiv = document.createElement('div');
            loadingDiv.id = 'pdf-loading';
            loadingDiv.classList.add('pdf-loading');
            loadingDiv.innerHTML = '<div class="spinner"></div><p>Loading comic...</p>';
            
            // Add loading indicator to container
            this.container.appendChild(loadingDiv);
        }
    }
    
    hideLoadingIndicator() {
        const loadingElement = document.getElementById('pdf-loading');
        if (loadingElement) {
            loadingElement.remove();
        }
    }
    
    renderPlaceholder() {
        // Create a placeholder when PDF loading fails
        this.container.innerHTML = '';
        const placeholderDiv = document.createElement('div');
        placeholderDiv.style.width = '100%';
        placeholderDiv.style.height = '300px';
        placeholderDiv.style.backgroundColor = '#f5f5f5';
        placeholderDiv.style.display = 'flex';
        placeholderDiv.style.flexDirection = 'column';
        placeholderDiv.style.alignItems = 'center';
        placeholderDiv.style.justifyContent = 'center';
        placeholderDiv.style.borderRadius = '15px';
        
        const text1 = document.createElement('div');
        text1.textContent = 'Comic Preview Not Available';
        text1.style.color = '#333';
        text1.style.fontSize = '24px';
        text1.style.fontFamily = 'Poppins, sans-serif';
        text1.style.marginBottom = '10px';
        
        const text2 = document.createElement('div');
        text2.textContent = 'Chapter ' + this.currentChapter + ', Page ' + this.currentPage;
        text2.style.color = '#333';
        text2.style.fontSize = '16px';
        text2.style.fontFamily = 'Poppins, sans-serif';
        
        placeholderDiv.appendChild(text1);
        placeholderDiv.appendChild(text2);
        this.container.appendChild(placeholderDiv);
        
        if (this.currentPageElem) {
            this.currentPageElem.textContent = this.currentPage;
        }
        if (this.pageCountElem) {
            this.pageCountElem.textContent = '10'; // Placeholder
        }
    }
    
    renderContinuous() {
        // For continuous mode, we need a container to hold multiple canvases
        const pdfContainer = document.querySelector('.pdf-container');
        
        // Clear the container first
        pdfContainer.innerHTML = '';
        this.pagesRendered = [];
        
        // Set the appropriate scale based on device
        const renderScale = this.isMobile ? this.mobileScale : this.scale;
        
        // Create and append canvases for each page in vertical arrangement
        for (let pageNum = 1; pageNum <= this.totalPages; pageNum++) {
            // Create page container
            const pageContainer = document.createElement('div');
            pageContainer.classList.add('page-container');
            pageContainer.id = `page-container-${pageNum}`;
            
            // Create canvas for the page
            const canvas = document.createElement('canvas');
            canvas.id = `page-${pageNum}`;
            canvas.classList.add('pdf-page');
            canvas.dataset.pageNumber = pageNum;
            pageContainer.appendChild(canvas);
            
            // Add a divider between pages (except for the last page)
            if (pageNum < this.totalPages) {
                const divider = document.createElement('div');
                divider.classList.add('page-divider');
                pageContainer.appendChild(divider);
            }
            
            // Add the page to the container
            pdfContainer.appendChild(pageContainer);
            
            // Render the page content
            this.renderPageToCanvas(pageNum, canvas, renderScale);
        }
        
        // Add double-tap feature for zooming on touch devices
        this.setupDoubleTapZoom();
        
        // Set up scroll detection for current page
        this.setupScrollDetection();
        
        // Add swipe detection for mobile
        this.setupSwipeDetection();
        
        window.VIEWER_READY = true;
        console.log('Manga reader ready with vertical scrolling');
    }
    
    renderPageToCanvas(pageNum, canvas, scale = null) {
        const renderScale = scale || (this.isMobile ? this.mobileScale : this.scale);
        
        this.pdfDoc.getPage(pageNum).then(page => {
            const viewport = page.getViewport({ scale: renderScale });
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            const context = canvas.getContext('2d');
            
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            
            page.render(renderContext).promise.then(() => {
                if (!this.pagesRendered.includes(pageNum)) {
                    this.pagesRendered.push(pageNum);
                }
            });
        });
    }
    
    setupScrollDetection() {
        // Use Intersection Observer API to detect which page is most visible
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.5 // Trigger when 50% of the element is visible
        };
        
        // Clear previous observers if they exist
        if (this.observers.length) {
            this.observers.forEach(observer => observer.disconnect());
            this.observers = [];
        }
        
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const pageNum = parseInt(entry.target.dataset.pageNumber, 10);
                    this.visiblePage = pageNum;
                    this.currentPage = pageNum;
                    
                    // Update page counter in UI
                    if (this.currentPageElem) {
                        this.currentPageElem.textContent = pageNum;
                    }
                }
            });
        }, options);
        
        // Observe all page elements
        document.querySelectorAll('.pdf-page').forEach(page => {
            observer.observe(page);
        });
        
        this.observers.push(observer);
        
        // Additionally track scroll position to enhance page detection
        window.addEventListener('scroll', () => {
            this.checkVisiblePages();
        });
    }
    
    setupDoubleTapZoom() {
        // Skip if not a touch device
        if (!('ontouchstart' in window)) return;
        
        const pages = document.querySelectorAll('.pdf-page');
        let lastTap = 0;
        let zoomedPage = null;
        
        pages.forEach(page => {
            page.addEventListener('touchend', (e) => {
                const currentTime = new Date().getTime();
                const tapLength = currentTime - lastTap;
                
                if (tapLength < 500 && tapLength > 0) {
                    // Double tap detected
                    e.preventDefault();
                    
                    if (zoomedPage === page) {
                        // Reset zoom
                        page.style.transform = 'scale(1)';
                        page.style.transformOrigin = 'center center';
                        zoomedPage = null;
                    } else {
                        // Reset any currently zoomed page
                        if (zoomedPage) {
                            zoomedPage.style.transform = 'scale(1)';
                        }
                        
                        // Calculate touch position for zoom center
                        const touch = e.changedTouches[0];
                        const rect = page.getBoundingClientRect();
                        const offsetX = ((touch.clientX - rect.left) / rect.width) * 100;
                        const offsetY = ((touch.clientY - rect.top) / rect.height) * 100;
                        
                        // Apply zoom
                        page.style.transformOrigin = `${offsetX}% ${offsetY}%`;
                        page.style.transform = 'scale(1.5)';
                        zoomedPage = page;
                    }
                }
                
                lastTap = currentTime;
            });
        });
    }
    
    setupSwipeDetection() {
        // Skip if not a touch device
        if (!('ontouchstart' in window)) return;
        
        let startX, startY;
        const threshold = 50; // Minimum distance for swipe
        const restraint = 100; // Maximum perpendicular distance
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const distX = endX - startX;
            const distY = endY - startY;
            
            // Detect horizontal swipe (only if vertical movement is limited)
            if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint) {
                if (distX > 0) {
                    // Right swipe - previous page
                    this.goPrevPage();
                } else {
                    // Left swipe - next page
                    this.goNextPage();
                }
            }
        }, { passive: true });
    }
    
    checkVisiblePages() {
        // Get all page elements
        const pages = document.querySelectorAll('.pdf-page');
        if (!pages.length) return;
        
        // Calculate which page is most visible in the viewport
        let bestVisibility = 0;
        let mostVisiblePage = this.visiblePage;
        
        pages.forEach(page => {
            const rect = page.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            
            // Calculate how much of the page is visible
            const visibleTop = Math.max(0, rect.top);
            const visibleBottom = Math.min(windowHeight, rect.bottom);
            const visibleHeight = Math.max(0, visibleBottom - visibleTop);
            
            // Calculate visibility as a percentage of the page height
            const visibility = visibleHeight / rect.height;
            
            if (visibility > bestVisibility) {
                bestVisibility = visibility;
                mostVisiblePage = parseInt(page.dataset.pageNumber, 10);
            }
        });
        
        // Update current page if changed
        if (mostVisiblePage !== this.visiblePage) {
            this.visiblePage = mostVisiblePage;
            this.currentPage = mostVisiblePage;
            
            // Update page counter in UI
            if (this.currentPageElem) {
                this.currentPageElem.textContent = mostVisiblePage;
            }
        }
    }
    
    goPrevPage() {
        if (this.currentPage <= 1) {
            // At first page, possibly navigate to previous chapter
            if (this.currentChapter > 1) {
                this.goToPrevChapter();
            }
            return;
        }
        
        this.currentPage--;
        
        // Scroll to the previous page with smooth animation
        const prevPage = document.getElementById(`page-${this.currentPage}`);
        if (prevPage) {
            // Calculate position to scroll to (top of the page minus a small offset)
            const offset = this.isMobile ? 60 : 80; // Smaller offset for mobile
            const rect = prevPage.getBoundingClientRect();
            const scrollTop = window.pageYOffset + rect.top - offset;
            
            // Scroll smoothly
            window.scrollTo({
                top: scrollTop,
                behavior: 'smooth'
            });
        }
    }
    
    goNextPage() {
        if (this.currentPage >= this.totalPages) {
            // At last page, possibly navigate to next chapter
            if (this.currentChapter < this.totalChapters) {
                this.goToNextChapter();
            }
            return;
        }
        
        this.currentPage++;
        
        // Scroll to the next page with smooth animation
        const nextPage = document.getElementById(`page-${this.currentPage}`);
        if (nextPage) {
            // Calculate position to scroll to (top of the page minus a small offset)
            const offset = this.isMobile ? 60 : 80; // Smaller offset for mobile
            const rect = nextPage.getBoundingClientRect();
            const scrollTop = window.pageYOffset + rect.top - offset;
            
            // Scroll smoothly
            window.scrollTo({
                top: scrollTop,
                behavior: 'smooth'
            });
        }
    }
    
    // Method to go to previous chapter
    goToPrevChapter() {
        if (this.currentChapter > 1) {
            window.location.href = `reader.html?chapter=${this.currentChapter - 1}`;
        }
    }
    
    // Method to go to next chapter
    goToNextChapter() {
        if (this.currentChapter < this.totalChapters) {
            window.location.href = `reader.html?chapter=${this.currentChapter + 1}`;
        }
    }
    
    setUpEventListeners() {
        // Previous page button
        if (this.prevButton) {
            this.prevButton.addEventListener('click', () => this.goPrevPage());
        }
        
        // Next page button
        if (this.nextButton) {
            this.nextButton.addEventListener('click', () => this.goNextPage());
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.goPrevPage();
            } else if (e.key === 'ArrowRight') {
                this.goNextPage();
            }
        });
        
        // Previous chapter button
        if (this.prevChapterBtn) {
            this.prevChapterBtn.addEventListener('click', () => {
                if (this.currentChapter > 1) {
                    this.goToPrevChapter();
                }
            });
        }
        
        // Next chapter button
        if (this.nextChapterBtn) {
            this.nextChapterBtn.addEventListener('click', () => {
                if (this.currentChapter < this.totalChapters) {
                    this.goToNextChapter();
                }
            });
        }
    }
}

// Initialize the manga reader when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on the reader page
    if (document.getElementById('pdfContainer')) {
        const isMobile = window.innerWidth < 768;
        
        const reader = new MangaReader({
            container: document.getElementById('pdfContainer'),
            scale: 1.5, // Desktop scale
            mobileScale: 1.0, // Mobile scale (smaller to fit screen better)
            pageGap: isMobile ? 15 : 30, // Smaller gap for mobile
        });
        
        // Add a small delay to ensure smooth first-load experience
        setTimeout(() => {
            // Scroll to top of first page
            window.scrollTo({
                top: 0,
                behavior: 'auto'
            });
        }, 200);
        
        // Add fixed position navigation buttons for better mobile experience
        if (isMobile) {
            addMobileNavButtons();
        }
        
        // Add styles for disabled buttons
        addDisabledButtonStyles();
    }
});

// Add floating navigation buttons for easier mobile navigation
function addMobileNavButtons() {
    // First check if these buttons already exist
    if (document.getElementById('mobile-nav-buttons')) return;
    
    const navButtons = document.createElement('div');
    navButtons.id = 'mobile-nav-buttons';
    navButtons.style.position = 'fixed';
    navButtons.style.bottom = '80px';
    navButtons.style.right = '20px';
    navButtons.style.zIndex = '999';
    navButtons.style.display = 'flex';
    navButtons.style.flexDirection = 'column';
    navButtons.style.gap = '10px';
    
    // Button to scroll to top
    const topButton = document.createElement('button');
    topButton.innerHTML = '↑';
    topButton.style.width = '40px';
    topButton.style.height = '40px';
    topButton.style.borderRadius = '50%';
    topButton.style.backgroundColor = '#38b7a9';
    topButton.style.color = 'white';
    topButton.style.border = 'none';
    topButton.style.fontSize = '20px';
    topButton.style.display = 'flex';
    topButton.style.alignItems = 'center';
    topButton.style.justifyContent = 'center';
    topButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
    
    topButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Button to scroll to bottom
    const bottomButton = document.createElement('button');
    bottomButton.innerHTML = '↓';
    bottomButton.style.width = '40px';
    bottomButton.style.height = '40px';
    bottomButton.style.borderRadius = '50%';
    bottomButton.style.backgroundColor = '#38b7a9';
    bottomButton.style.color = 'white';
    bottomButton.style.border = 'none';
    bottomButton.style.fontSize = '20px';
    bottomButton.style.display = 'flex';
    bottomButton.style.alignItems = 'center';
    bottomButton.style.justifyContent = 'center';
    bottomButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
    
    bottomButton.addEventListener('click', () => {
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });
    });
    
    navButtons.appendChild(topButton);
    navButtons.appendChild(bottomButton);
    document.body.appendChild(navButtons);
    
    // Hide buttons when at top or bottom of page
    window.addEventListener('scroll', () => {
        if (window.scrollY < 100) {
            topButton.style.opacity = '0.3';
        } else {
            topButton.style.opacity = '1';
        }
        
        if (window.scrollY + window.innerHeight > document.body.scrollHeight - 100) {
            bottomButton.style.opacity = '0.3';
        } else {
            bottomButton.style.opacity = '1';
        }
    });
}

// Add styles for disabled chapter navigation buttons
function addDisabledButtonStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .btn-chapter.disabled {
            opacity: 0.5;
            cursor: not-allowed;
            background-color: #888;
        }
    `;
    document.head.appendChild(style);
}