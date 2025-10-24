/**
 * Responsive Helper
 * Giúp tối ưu hóa giao diện dựa trên viewport size
 */

(function() {
  'use strict';

  // Viewport breakpoints
  const BREAKPOINTS = {
    mobile: 600,
    tablet: 900,
    desktop: 1440,
    large: 1920
  };

  /**
   * Detect viewport size và thêm class vào body
   */
  function updateViewportClass() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const body = document.body;

    // Remove all viewport classes
    body.classList.remove(
      'viewport-mobile',
      'viewport-tablet',
      'viewport-desktop',
      'viewport-large',
      'viewport-windowed',
      'viewport-fullscreen'
    );

    // Add appropriate viewport class
    if (width < BREAKPOINTS.mobile) {
      body.classList.add('viewport-mobile');
    } else if (width < BREAKPOINTS.tablet) {
      body.classList.add('viewport-tablet');
    } else if (width < BREAKPOINTS.desktop) {
      body.classList.add('viewport-desktop');
    } else {
      body.classList.add('viewport-large');
    }

    // Detect if window is in fullscreen or windowed mode
    const isFullscreen = (
      window.innerWidth === window.screen.width &&
      window.innerHeight === window.screen.height
    ) || (
      document.fullscreenElement !== null ||
      document.webkitFullscreenElement !== null ||
      document.mozFullScreenElement !== null
    );

    if (isFullscreen || (width >= BREAKPOINTS.large && height >= 1000)) {
      body.classList.add('viewport-fullscreen');
    } else {
      body.classList.add('viewport-windowed');
    }

    // Update CSS custom property for viewport height (fix for mobile browsers)
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    document.documentElement.style.setProperty('--vw', `${window.innerWidth * 0.01}px`);
  }

  /**
   * Adjust hero section height based on viewport
   */
  function adjustHeroHeight() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isPresentationMode = document.body.dataset.theme === 'presentation';
    const isDebug = window.location.search.includes('debug=true');

    let heroMode = 'auto';

    // Presentation mode luôn fullscreen
    if (isPresentationMode) {
      hero.style.minHeight = '100vh';
      hero.style.height = '100vh';
      heroMode = 'presentation';
      if (isDebug) hero.setAttribute('data-hero-mode', heroMode);
      return;
    }

    // Viewport lớn (≥1440px và height ≥800px): fullscreen
    if (width >= BREAKPOINTS.desktop && height >= 800) {
      hero.style.minHeight = '100vh';
      hero.style.height = '100vh';
      hero.style.padding = '0';
      heroMode = 'fullscreen';
    }
    // Viewport lớn nhưng thấp: auto với padding
    else if (width >= BREAKPOINTS.desktop && height < 800) {
      hero.style.minHeight = 'auto';
      hero.style.height = 'auto';
      hero.style.padding = 'clamp(50px, 6vh, 80px) 0 clamp(40px, 5vh, 70px)';
      heroMode = 'auto (wide-short)';
    }
    // Viewport trung bình: auto với padding
    else if (width >= BREAKPOINTS.tablet) {
      hero.style.minHeight = 'auto';
      hero.style.height = 'auto';
      hero.style.padding = 'clamp(60px, 8vh, 100px) 0 clamp(40px, 6vh, 80px)';
      heroMode = 'auto (tablet)';
    }
    // Mobile: auto với padding lớn hơn
    else {
      hero.style.minHeight = 'auto';
      hero.style.height = 'auto';
      hero.style.padding = 'clamp(60px, 10vh, 100px) 0 clamp(40px, 8vh, 80px)';
      heroMode = 'auto (mobile)';
    }

    // Set debug attributes
    if (isDebug) {
      hero.setAttribute('data-hero-mode', heroMode);
      document.body.setAttribute('data-debug', 'true');
      document.body.setAttribute('data-viewport-info', `${width}x${height}`);

      console.log('Hero adjusted:', {
        width,
        height,
        mode: heroMode,
        minHeight: hero.style.minHeight,
        heightStyle: hero.style.height,
        padding: hero.style.padding
      });
    } else {
      hero.removeAttribute('data-hero-mode');
      document.body.removeAttribute('data-debug');
      document.body.removeAttribute('data-viewport-info');
    }
  }

  /**
   * Optimize images based on viewport
   */
  function optimizeImages() {
    const width = window.innerWidth;
    const images = document.querySelectorAll('img[data-src-mobile], img[data-src-tablet], img[data-src-desktop]');

    images.forEach(img => {
      let src;
      if (width < BREAKPOINTS.mobile && img.dataset.srcMobile) {
        src = img.dataset.srcMobile;
      } else if (width < BREAKPOINTS.tablet && img.dataset.srcTablet) {
        src = img.dataset.srcTablet;
      } else if (img.dataset.srcDesktop) {
        src = img.dataset.srcDesktop;
      }

      if (src && img.src !== src) {
        img.src = src;
      }
    });
  }

  /**
   * Adjust grid columns based on viewport and content
   */
  function adjustGridColumns() {
    const grids = document.querySelectorAll('.program-grid, .campus-grid, .services-grid');
    const width = window.innerWidth;

    grids.forEach(grid => {
      const items = grid.children.length;

      if (width < BREAKPOINTS.mobile) {
        grid.style.gridTemplateColumns = '1fr';
      } else if (width < BREAKPOINTS.tablet) {
        grid.style.gridTemplateColumns = items === 3 ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(280px, 1fr))';
      } else if (width < BREAKPOINTS.desktop) {
        grid.style.gridTemplateColumns = items === 3 ? 'repeat(3, 1fr)' : 'repeat(auto-fit, minmax(300px, 1fr))';
      }
    });
  }

  /**
   * Toggle navigation on mobile
   */
  function initMobileNav() {
    const header = document.querySelector('.site-header');
    const navLinks = document.querySelector('.nav-links');

    if (!header || !navLinks) return;

    // Create mobile menu toggle if it doesn't exist
    let menuToggle = header.querySelector('.mobile-menu-toggle');
    if (!menuToggle && window.innerWidth < BREAKPOINTS.tablet) {
      menuToggle = document.createElement('button');
      menuToggle.className = 'mobile-menu-toggle';
      menuToggle.innerHTML = '<span class="material-icons">menu</span>';
      menuToggle.setAttribute('aria-label', 'Toggle menu');
      menuToggle.setAttribute('aria-expanded', 'false');

      const headerInner = header.querySelector('.header-inner');
      if (headerInner) {
        headerInner.insertBefore(menuToggle, navLinks);
      }

      menuToggle.addEventListener('click', function() {
        const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
        menuToggle.setAttribute('aria-expanded', !isExpanded);
        navLinks.classList.toggle('active');
        menuToggle.querySelector('.material-icons').textContent = isExpanded ? 'menu' : 'close';
      });
    }
  }

  /**
   * Debounce function
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Initialize responsive helpers
   */
  function init() {
    // Initial setup
    updateViewportClass();
    adjustHeroHeight();
    optimizeImages();
    adjustGridColumns();
    initMobileNav();

    // Update on resize (debounced)
    const debouncedResize = debounce(() => {
      updateViewportClass();
      adjustHeroHeight();
      optimizeImages();
      adjustGridColumns();
    }, 250);

    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', debouncedResize);

    // Update on fullscreen change
    document.addEventListener('fullscreenchange', () => {
      updateViewportClass();
      adjustHeroHeight();
    });
    document.addEventListener('webkitfullscreenchange', () => {
      updateViewportClass();
      adjustHeroHeight();
    });
    document.addEventListener('mozfullscreenchange', () => {
      updateViewportClass();
      adjustHeroHeight();
    });

    // Listen for theme changes from ThemeManager
    if (window.ThemeManager) {
      window.ThemeManager.subscribe((theme) => {
        // Re-adjust hero when theme changes
        setTimeout(() => {
          adjustHeroHeight();
        }, 100);
      });
    }

    // Smooth scroll to sections
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#' || href === '') return;

        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const offsetTop = target.offsetTop - 80; // Account for fixed header
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
      });
    });

    // Log viewport info (for debugging)
    if (window.location.search.includes('debug=true')) {
      console.log('Viewport Info:', {
        width: window.innerWidth,
        height: window.innerHeight,
        isFullscreen: document.body.classList.contains('viewport-fullscreen'),
        classes: Array.from(document.body.classList)
      });
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export for external use
  window.ResponsiveHelper = {
    updateViewportClass,
    adjustHeroHeight,
    optimizeImages,
    adjustGridColumns,
    BREAKPOINTS
  };

})();
