/**
 * Scroll Animations - Triggers animations when elements come into view
 */

(function() {
  'use strict';

  // Configuration
  const OBSERVER_OPTIONS = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1 // Trigger when 10% of element is visible
  };

  /**
   * Initialize scroll animations for elements
   */
  function initScrollAnimations() {
    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      // Fallback: show all elements immediately
      document.querySelectorAll('.c5-card').forEach(card => {
        card.classList.add('is-visible');
      });
      return;
    }

    // Create observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Add visible class when element enters viewport
          entry.target.classList.add('is-visible');
        } else {
          // Remove visible class when element leaves viewport
          // This allows animation to replay when scrolling back
          entry.target.classList.remove('is-visible');
        }
      });
    }, OBSERVER_OPTIONS);

    // Observe all c5-cards
    document.querySelectorAll('.c5-card').forEach(card => {
      observer.observe(card);
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollAnimations);
  } else {
    initScrollAnimations();
  }
})();
