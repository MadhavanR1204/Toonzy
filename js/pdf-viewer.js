/**
 * PDF Viewer Implementation for Toonzy
 * This script handles the continuous scrolling manga-style reader
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
        this.pdfUrl = options.pdfUrl || 'assets/dummy.pdf';
        this.container = options.container || document.getElementById('pdfContainer');
        this.currentPage = 1;
        this.totalPages = 0;
        this.pdfDoc = null;
        this.pageRendering = false;
        this.pageNumPending = null;
        this.scale = options.scale || 1.5;
        this.continuousMode = true; // Always use continuous mode for vertical scrolling
        this.pageGap = options.pageGap || 20;
        this.pagesRendered = [];
        this.observers = [];
        this.visiblePage = 1;
        
        // Initialize UI elements
        this.pageCountElem = document.getElementById('totalPages');
        this.currentPageElem = document.getElementById('currentPage');
        this.prevButton = document.getElementById('prevPage');
        this.nextButton = document.getElementById('nextPage');
        this.prevChapterBtn = document.getElementById('prevChapter');
        this.nextChapterBtn = document.getElementById('nextChapter');
        
        // Initialize reader
        this.init();
    }
    
    init() {
        // Load PDF
        this.loadPdf();
        
        // Set up event listeners
        this.setUpEventListeners();
        
        // Set up scroll observer for continuous mode
        if (this.continuousMode) {
            this.setupIntersectionObserver();
        }
    }
    
    loadPdf() {
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
        }).catch(error => {
            console.error('Error loading PDF:', error);
            this.renderPlaceholder();
        });
    }
    
    renderPlaceholder() {
        // Create a placeholder when PDF loading fails
        this.container.width = 800;
        this.container.height = 1200;
        this.ctx.fillStyle = '#f5f5f5';
        this.ctx.fillRect(0, 0, this.container.width, this.container.height);
        
        this.ctx.fillStyle = '#333';
        this.ctx.font = '24px Poppins, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Comic Preview Not Available', this.container.width / 2, this.container.height / 2);
        this.ctx.font = '16px Poppins, sans-serif';
        this.ctx.fillText('Page ' + this.currentPage, this.container.width / 2, this.container.height / 2 + 30);
        
        if (this.currentPageElem) {
            this.currentPageElem.textContent = this.currentPage;
        }
        if (this.pageCountElem) {
            this.pageCountElem.textContent = '10'; // Placeholder
        }
    }
    
    renderPage(num) {
        this.pageRendering = true;
        
        // Using promise to fetch the page
        this.pdfDoc.getPage(num).then(page => {
            const viewport = page.getViewport({scale: this.scale});
            this.container.height = viewport.height;
            this.container.width = viewport.width;
            
            // Render PDF page into canvas context
            const renderContext = {
                canvasContext: this.ctx,
                viewport: viewport
            };
            
            const renderTask = page.render(renderContext);
            
            // Wait for rendering to finish
            renderTask.promise.then(() => {
                this.pageRendering = false;
                
                if (this.pageNumPending !== null) {
                    // New page rendering is pending
                    this.renderPage(this.pageNumPending);
                    this.pageNumPending = null;
                }
            });
        });
        
        // Update page counter
        if (this.currentPageElem) {
            this.currentPageElem.textContent = num;
        }
    }
    
    renderContinuous() {
        // For continuous mode, we need a container to hold multiple canvases
        const pdfContainer = document.querySelector('.pdf-container');
        
        // Clear the container first
        pdfContainer.innerHTML = '';
        
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
            this.renderPageToCanvas(pageNum, canvas);
        }
        
        // Set up scroll detection for current page
        this.setupScrollDetection();
        
        window.VIEWER_READY = true;
        console.log('Manga reader ready with vertical scrolling');
    }
    
    renderPageToCanvas(pageNum, canvas) {
        this.pdfDoc.getPage(pageNum).then(page => {
            const viewport = page.getViewport({scale: this.scale});
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            const context = canvas.getContext('2d');
            
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            
            page.render(renderContext);
            this.pagesRendered.push(pageNum);
        });
    }
    
    setupScrollDetection() {
        // Use Intersection Observer API to detect which page is most visible
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.5 // Trigger when 50% of the element is visible
        };
        
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
    
    queueRenderPage(num) {
        if (this.pageRendering) {
            this.pageNumPending = num;
        } else {
            this.renderPage(num);
        }
    }
    
    goPrevPage() {
        if (this.currentPage <= 1) {
            return;
        }
        this.currentPage--;
        
        // Scroll to the previous page with smooth animation
        const prevPage = document.getElementById(`page-${this.currentPage}`);
        if (prevPage) {
            // Calculate position to scroll to (top of the page minus a small offset)
            const offset = 80; // Height of the header
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
            return;
        }
        this.currentPage++;
        
        // Scroll to the next page with smooth animation
        const nextPage = document.getElementById(`page-${this.currentPage}`);
        if (nextPage) {
            // Calculate position to scroll to (top of the page minus a small offset)
            const offset = 80; // Height of the header
            const rect = nextPage.getBoundingClientRect();
            const scrollTop = window.pageYOffset + rect.top - offset;
            
            // Scroll smoothly
            window.scrollTo({
                top: scrollTop,
                behavior: 'smooth'
            });
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
        
        // Chapter navigation (would be implemented with actual chapter data)
        if (this.prevChapterBtn) {
            this.prevChapterBtn.addEventListener('click', () => {
                // In a real implementation, this would navigate to the previous chapter
                alert('Previous chapter would be loaded here');
            });
        }
        
        if (this.nextChapterBtn) {
            this.nextChapterBtn.addEventListener('click', () => {
                // In a real implementation, this would navigate to the next chapter
                alert('Next chapter would be loaded here');
            });
        }
    }
}

// Initialize the manga reader when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on the reader page
    if (document.getElementById('pdfContainer')) {
        const reader = new MangaReader({
            pdfUrl: 'assets/dummy.pdf',
            container: document.getElementById('pdfContainer'),
            scale: 1.5,
            pageGap: 30, // Increase gap between pages for better separation
        });
        
        // Add a small delay to ensure smooth first-load experience
        setTimeout(() => {
            // Scroll to top of first page
            window.scrollTo({
                top: 0,
                behavior: 'auto'
            });
        }, 200);
    }
});