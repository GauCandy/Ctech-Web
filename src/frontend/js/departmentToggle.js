/**
 * Department Cards Toggle Handler
 * Handles expand/collapse functionality for training program departments
 */

(function() {
  'use strict';

  // Wait for DOM to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDepartments);
  } else {
    initDepartments();
  }

  function initDepartments() {
    const departmentCards = document.querySelectorAll('.department-card');

    if (!departmentCards.length) {
      return;
    }

    departmentCards.forEach(card => {
      const header = card.querySelector('.department-header');
      const toggle = card.querySelector('.department-toggle');

      if (!header || !toggle) return;

      // Handle click on header
      header.addEventListener('click', () => {
        toggleDepartment(card);
      });

      // Handle keyboard navigation
      header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleDepartment(card);
        }
      });

      // Make header focusable for accessibility
      header.setAttribute('tabindex', '0');
      header.setAttribute('role', 'button');
      header.setAttribute('aria-expanded', 'false');
    });

    // Optional: Auto-expand first department on desktop
    if (window.innerWidth >= 768) {
      const firstCard = departmentCards[0];
      if (firstCard) {
        // Small delay to ensure smooth initial animation
        setTimeout(() => {
          toggleDepartment(firstCard);
        }, 300);
      }
    }
  }

  function toggleDepartment(card) {
    const isExpanded = card.classList.contains('expanded');
    const header = card.querySelector('.department-header');

    // Toggle the expanded state
    card.classList.toggle('expanded');

    // Update ARIA attribute for accessibility
    if (header) {
      header.setAttribute('aria-expanded', !isExpanded);
    }

    // Optional: Close other expanded cards (accordion behavior)
    // Uncomment below if you want only one department open at a time
    /*
    const allCards = document.querySelectorAll('.department-card');
    allCards.forEach(otherCard => {
      if (otherCard !== card && otherCard.classList.contains('expanded')) {
        otherCard.classList.remove('expanded');
        const otherHeader = otherCard.querySelector('.department-header');
        if (otherHeader) {
          otherHeader.setAttribute('aria-expanded', 'false');
        }
      }
    });
    */

    // Smooth scroll into view if card is being expanded and partially hidden
    if (!isExpanded) {
      setTimeout(() => {
        const cardRect = card.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        // Check if card is partially below viewport
        if (cardRect.bottom > viewportHeight) {
          card.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest'
          });
        }
      }, 100); // Small delay to allow expansion animation to start
    }
  }

  // Re-initialize on dynamic content changes (if needed)
  window.reinitDepartments = initDepartments;

})();
