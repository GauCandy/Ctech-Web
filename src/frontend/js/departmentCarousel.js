/**
 * Department Carousel - 3D Coverflow Effect
 * Auto-advances every 1 second with smooth 3D transitions
 */

(function() {
  'use strict';

  // Wait for DOM to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCarousel);
  } else {
    initCarousel();
  }

  let currentIndex = 0;
  let autoScrollInterval = null;
  let isHovering = false;
  let carousel, track, cards, prevBtn, nextBtn, dotsContainer;

  function initCarousel() {
    carousel = document.querySelector('.departments-carousel');
    if (!carousel) return;

    track = carousel.querySelector('.carousel-track');
    cards = Array.from(carousel.querySelectorAll('.department-card'));
    prevBtn = carousel.querySelector('.carousel-prev');
    nextBtn = carousel.querySelector('.carousel-next');
    dotsContainer = carousel.querySelector('.carousel-dots');

    if (!track || !cards.length) return;

    // Create dots
    createDots();

    // Setup event listeners
    setupEventListeners();

    // Initial position
    updateCardPositions();

    // Start auto-scroll
    startAutoScroll();
  }

  function createDots() {
    if (!dotsContainer) return;

    dotsContainer.innerHTML = '';

    cards.forEach((card, i) => {
      const dot = document.createElement('button');
      dot.classList.add('carousel-dot');
      dot.setAttribute('aria-label', `Đến slide ${i + 1}`);
      dot.addEventListener('click', () => {
        goToSlide(i);
        stopAutoScroll();
        startAutoScroll();
      });
      dotsContainer.appendChild(dot);
    });

    updateDots();
  }

  function updateDots() {
    if (!dotsContainer) return;

    const dots = dotsContainer.querySelectorAll('.carousel-dot');
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentIndex);
    });
  }

  function setupEventListeners() {
    // Next button
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        next();
        stopAutoScroll();
        startAutoScroll();
      });
    }

    // Previous button
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        previous();
        stopAutoScroll();
        startAutoScroll();
      });
    }

    // Pause on hover
    carousel.addEventListener('mouseenter', () => {
      isHovering = true;
      stopAutoScroll();
    });

    carousel.addEventListener('mouseleave', () => {
      isHovering = false;
      startAutoScroll();
    });

    // Touch/swipe support
    let touchStartX = 0;
    let touchEndX = 0;

    track.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      stopAutoScroll();
    });

    track.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
      startAutoScroll();
    });

    function handleSwipe() {
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) { // Minimum swipe distance
        if (diff > 0) {
          next();
        } else {
          previous();
        }
      }
    }

    // Click on side cards to go to them
    cards.forEach((card, index) => {
      card.addEventListener('click', () => {
        if (index !== currentIndex) {
          goToSlide(index);
          stopAutoScroll();
          startAutoScroll();
        }
      });
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!isElementInViewport(carousel)) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        previous();
        stopAutoScroll();
        startAutoScroll();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
        stopAutoScroll();
        startAutoScroll();
      }
    });
  }

  function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  function updateCardPositions() {
    if (!cards.length) return;

    cards.forEach((card, index) => {
      // Remove all position classes
      card.classList.remove(
        'card-center',
        'card-left-1', 'card-left-2', 'card-left-3', 'card-left-far',
        'card-right-1', 'card-right-2', 'card-right-3', 'card-right-far'
      );

      // Calculate distance from current index
      let distance = index - currentIndex;

      // Handle wraparound for circular navigation
      if (distance > cards.length / 2) {
        distance -= cards.length;
      } else if (distance < -cards.length / 2) {
        distance += cards.length;
      }

      // Apply appropriate class based on distance
      if (distance === 0) {
        card.classList.add('card-center');
      } else if (distance === -1) {
        card.classList.add('card-left-1');
      } else if (distance === 1) {
        card.classList.add('card-right-1');
      } else if (distance === -2) {
        card.classList.add('card-left-2');
      } else if (distance === 2) {
        card.classList.add('card-right-2');
      } else if (distance === -3) {
        card.classList.add('card-left-3');
      } else if (distance === 3) {
        card.classList.add('card-right-3');
      } else if (distance < -3) {
        card.classList.add('card-left-far');
      } else if (distance > 3) {
        card.classList.add('card-right-far');
      }
    });

    updateDots();
  }

  function goToSlide(index) {
    currentIndex = index;
    updateCardPositions();
  }

  function next() {
    currentIndex = (currentIndex + 1) % cards.length;
    updateCardPositions();
  }

  function previous() {
    currentIndex = (currentIndex - 1 + cards.length) % cards.length;
    updateCardPositions();
  }

  function startAutoScroll() {
    stopAutoScroll(); // Clear any existing interval

    // Auto-scroll every 2 seconds (2000ms)
    autoScrollInterval = setInterval(() => {
      if (!isHovering) {
        next();
      }
    }, 2000);
  }

  function stopAutoScroll() {
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      autoScrollInterval = null;
    }
  }

  // Pause auto-scroll when page is not visible
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAutoScroll();
    } else {
      if (!isHovering) {
        startAutoScroll();
      }
    }
  });

  // Handle window resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateCardPositions();
    }, 250);
  });

  // Expose reinit function for dynamic content
  window.reinitDepartmentCarousel = initCarousel;

})();
