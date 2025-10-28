/**
 * Mobile Menu Manager
 * Quản lý mobile navigation menu
 */
(() => {
  'use strict';

  let menuToggle = null;
  let navLinks = null;
  let isMenuOpen = false;

  /**
   * Toggle mobile menu
   */
  function toggleMenu() {
    isMenuOpen = !isMenuOpen;

    if (navLinks) {
      if (isMenuOpen) {
        navLinks.classList.add('active');
        menuToggle?.setAttribute('aria-expanded', 'true');
      } else {
        navLinks.classList.remove('active');
        menuToggle?.setAttribute('aria-expanded', 'false');
      }
    }
  }

  /**
   * Close mobile menu
   */
  function closeMenu() {
    if (isMenuOpen) {
      isMenuOpen = false;
      navLinks?.classList.remove('active');
      menuToggle?.setAttribute('aria-expanded', 'false');
    }
  }

  /**
   * Handle click outside menu
   */
  function handleClickOutside(event) {
    if (!isMenuOpen) return;

    // Check if click is outside menu and toggle button
    if (menuToggle && navLinks) {
      const clickedToggle = menuToggle.contains(event.target);
      const clickedMenu = navLinks.contains(event.target);

      if (!clickedToggle && !clickedMenu) {
        closeMenu();
      }
    }
  }

  /**
   * Handle escape key
   */
  function handleEscape(event) {
    if (event.key === 'Escape' && isMenuOpen) {
      closeMenu();
      menuToggle?.focus();
    }
  }

  /**
   * Handle link click in mobile menu
   */
  function handleLinkClick(event) {
    // Close menu when a link is clicked
    if (window.innerWidth <= 768) {
      closeMenu();
    }
  }

  /**
   * Create mobile menu toggle button if it doesn't exist
   */
  function createMobileToggle() {
    const header = document.querySelector('.site-header');
    const headerActions = document.querySelector('.header-actions');

    if (!header || !headerActions) return null;

    // Check if toggle already exists
    let toggle = headerActions.querySelector('.mobile-menu-toggle');

    if (!toggle) {
      // Create toggle button
      toggle = document.createElement('button');
      toggle.className = 'mobile-menu-toggle';
      toggle.setAttribute('type', 'button');
      toggle.setAttribute('aria-label', 'Toggle navigation menu');
      toggle.setAttribute('aria-expanded', 'false');

      // Add icon
      const icon = document.createElement('span');
      icon.className = 'material-icons';
      icon.textContent = 'menu';
      toggle.appendChild(icon);

      // Insert before nav-links or at the beginning of header-actions
      const navLinks = headerActions.querySelector('.nav-links');
      if (navLinks) {
        headerActions.insertBefore(toggle, navLinks);
      } else {
        headerActions.insertBefore(toggle, headerActions.firstChild);
      }
    }

    return toggle;
  }

  /**
   * Initialize mobile menu
   */
  function initMobileMenu() {
    // Get or create toggle button
    menuToggle = createMobileToggle();
    navLinks = document.querySelector('.nav-links');

    if (!menuToggle || !navLinks) {
      console.warn('Mobile menu: Toggle button or nav links not found');
      return;
    }

    // Add click event to toggle
    menuToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleMenu();
    });

    // Add click events to all nav links
    const links = navLinks.querySelectorAll('a');
    links.forEach(link => {
      link.addEventListener('click', handleLinkClick);
    });

    // Close menu when clicking outside
    document.addEventListener('click', handleClickOutside);

    // Close menu on escape key
    document.addEventListener('keydown', handleEscape);

    // Close menu on window resize to desktop size
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && isMenuOpen) {
        closeMenu();
      }
    });

    console.log('Mobile menu initialized');
  }

  /**
   * Cleanup mobile menu
   */
  function cleanup() {
    if (menuToggle) {
      menuToggle.removeEventListener('click', toggleMenu);
    }

    if (navLinks) {
      const links = navLinks.querySelectorAll('a');
      links.forEach(link => {
        link.removeEventListener('click', handleLinkClick);
      });
    }

    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('keydown', handleEscape);
  }

  /**
   * Export MobileMenu API
   */
  window.MobileMenu = {
    init: initMobileMenu,
    toggle: toggleMenu,
    close: closeMenu,
    cleanup: cleanup,
    isOpen: () => isMenuOpen
  };

  // Auto init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileMenu);
  } else {
    initMobileMenu();
  }
})();
