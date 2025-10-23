/**
 * 5C Cards Scroll Animation
 * Animation chỉ chạy khi scroll từ trên xuống vào viewport
 * Giữ nguyên animation khi scroll lên xuống
 * Reset animation khi scroll lên trên section rồi xuống lại
 */

(function() {
  'use strict';

  // Đợi DOM load xong
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    const c5Section = document.querySelector('.section-5c');
    const c5Cards = document.querySelectorAll('.c5-card');

    if (!c5Section || c5Cards.length === 0) {
      return; // Không có section 5C, thoát
    }

    let previousScrollY = window.scrollY;
    let hasAnimated = false;
    let isAboveSection = true; // Track nếu đang ở trên section

    // Throttle scroll event để tăng performance
    let ticking = false;

    function handleScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          checkSectionPosition();
          ticking = false;
        });
        ticking = true;
      }
    }

    function checkSectionPosition() {
      const currentScrollY = window.scrollY;
      const scrollDirection = currentScrollY > previousScrollY ? 'down' : 'up';

      const sectionRect = c5Section.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Section đang trong viewport (ít nhất 20% của section visible)
      const isInViewport = (
        sectionRect.top < viewportHeight * 0.8 &&
        sectionRect.bottom > viewportHeight * 0.2
      );

      // Check nếu đang ở trên section (chưa scroll tới)
      const isCurrentlyAbove = sectionRect.top > viewportHeight;

      // Logic animation:
      // 1. Nếu scroll xuống VÀ section vào viewport VÀ chưa animate → animate
      if (scrollDirection === 'down' && isInViewport && !hasAnimated) {
        animateCards();
        hasAnimated = true;
        isAboveSection = false;
      }

      // 2. Nếu scroll lên trên section (ra khỏi viewport phía trên) → reset flag để animate lại
      if (isCurrentlyAbove && !isAboveSection) {
        resetAnimation();
        hasAnimated = false;
        isAboveSection = true;
      }

      // 3. Nếu đang ở trong hoặc dưới section → giữ nguyên
      if (!isCurrentlyAbove) {
        isAboveSection = false;
      }

      previousScrollY = currentScrollY;
    }

    function animateCards() {
      c5Cards.forEach((card) => {
        card.classList.add('is-animated');
      });
    }

    function resetAnimation() {
      c5Cards.forEach((card) => {
        card.classList.remove('is-animated');
      });
    }

    // Listen scroll event
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Check initial position
    checkSectionPosition();
  }
})();
