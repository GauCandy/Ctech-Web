/**
 * Presentation Mode - Navigate between sections with arrow keys
 * Optimized for 1920x1200 resolution with auto-scaling for other sizes
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    sectionSelector: 'section.hero, section.section',
    scrollDuration: 800, // milliseconds
    debounceDelay: 600, // prevent rapid scrolling
    enableIndicator: true
  };

  let sections = [];
  let currentSectionIndex = 0;
  let isScrolling = false;
  let scrollTimeout = null;

  /**
   * Initialize presentation mode
   */
  function initPresentationMode() {
    // Get all sections
    sections = Array.from(document.querySelectorAll(CONFIG.sectionSelector));

    if (sections.length === 0) {
      console.warn('No sections found for presentation mode');
      return;
    }

    // Set up keyboard navigation
    setupKeyboardNavigation();

    // Set up scroll detection to update current section
    setupScrollDetection();

    // Add section indicators
    if (CONFIG.enableIndicator) {
      createSectionIndicators();
    }

    // Apply viewport scaling
    applyViewportScaling();

    // Update current section on load
    updateCurrentSection();
  }

  /**
   * Setup keyboard navigation
   */
  function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // Ignore if user is typing in an input
      if (e.target.matches('input, textarea, select')) {
        return;
      }

      switch(e.key) {
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          navigateToSection(currentSectionIndex + 1);
          break;

        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          navigateToSection(currentSectionIndex - 1);
          break;

        case 'Home':
          e.preventDefault();
          navigateToSection(0);
          break;

        case 'End':
          e.preventDefault();
          navigateToSection(sections.length - 1);
          break;
      }
    });
  }

  /**
   * Navigate to specific section by index
   */
  function navigateToSection(index) {
    // Prevent navigation if already scrolling
    if (isScrolling) return;

    // Validate index
    if (index < 0 || index >= sections.length) return;

    const targetSection = sections[index];
    if (!targetSection) return;

    // Set scrolling flag
    isScrolling = true;
    currentSectionIndex = index;

    // Smooth scroll to section
    targetSection.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

    // Update indicator
    updateSectionIndicator(index);

    // Reset scrolling flag after delay
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isScrolling = false;
    }, CONFIG.debounceDelay);
  }

  /**
   * Setup scroll detection to update current section
   */
  function setupScrollDetection() {
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking && !isScrolling) {
        window.requestAnimationFrame(() => {
          updateCurrentSection();
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  /**
   * Update current section based on scroll position
   */
  function updateCurrentSection() {
    const scrollPosition = window.scrollY + (window.innerHeight / 3);

    sections.forEach((section, index) => {
      const sectionTop = section.offsetTop;
      const sectionBottom = sectionTop + section.offsetHeight;

      if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
        if (currentSectionIndex !== index) {
          currentSectionIndex = index;
          updateSectionIndicator(index);
        }
      }
    });
  }

  /**
   * Create visual indicators for sections
   */
  function createSectionIndicators() {
    const indicatorContainer = document.createElement('div');
    indicatorContainer.className = 'presentation-indicators';
    indicatorContainer.setAttribute('aria-label', 'Section navigation');

    sections.forEach((section, index) => {
      const indicator = document.createElement('button');
      indicator.className = 'presentation-indicator';
      indicator.setAttribute('aria-label', `Go to section ${index + 1}`);
      indicator.dataset.index = index;

      indicator.addEventListener('click', () => {
        navigateToSection(index);
      });

      indicatorContainer.appendChild(indicator);
    });

    document.body.appendChild(indicatorContainer);

    // Set first indicator as active
    updateSectionIndicator(0);
  }

  /**
   * Update active indicator
   */
  function updateSectionIndicator(index) {
    const indicators = document.querySelectorAll('.presentation-indicator');
    indicators.forEach((indicator, i) => {
      if (i === index) {
        indicator.classList.add('active');
        indicator.setAttribute('aria-current', 'true');
      } else {
        indicator.classList.remove('active');
        indicator.removeAttribute('aria-current');
      }
    });
  }

  /**
   * Apply viewport scaling for optimal presentation
   * Optimized for 1920x1200, scales for other resolutions
   */
  function applyViewportScaling() {
    const baseWidth = 1920;
    const baseHeight = 1200;

    function updateScale() {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calculate scale factors
      const scaleX = viewportWidth / baseWidth;
      const scaleY = viewportHeight / baseHeight;

      // Use the smaller scale to ensure everything fits
      const scale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 100%

      // Apply scale via CSS custom property
      document.documentElement.style.setProperty('--presentation-scale', scale);

      // Add class to indicate if we're at optimal resolution
      if (viewportWidth === baseWidth && viewportHeight === baseHeight) {
        document.body.classList.add('optimal-resolution');
      } else {
        document.body.classList.remove('optimal-resolution');
      }
    }

    // Update on load and resize
    updateScale();
    window.addEventListener('resize', updateScale);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPresentationMode);
  } else {
    initPresentationMode();
  }
})();
