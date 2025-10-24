/**
 * 5C Cards Scroll Animation
 * Animation chỉ chạy khi cards vào viewport
 * Sử dụng Intersection Observer API để detect viewport entry
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
    const c5Cards = document.querySelectorAll('.c5-card');

    if (c5Cards.length === 0) {
      return; // Không có 5C cards, thoát
    }

    // Check if browser supports Intersection Observer
    if (!('IntersectionObserver' in window)) {
      // Fallback: hiện tất cả cards ngay lập tức
      c5Cards.forEach(card => card.classList.add('is-visible'));
      return;
    }

    // Intersection Observer options
    const observerOptions = {
      root: null, // viewport
      rootMargin: '0px 0px -100px 0px', // Trigger khi card còn cách đáy viewport 100px
      threshold: 0.1 // 10% của card phải visible
    };

    // Callback khi card vào/ra viewport
    const observerCallback = (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Card vào viewport → add class để trigger animation
          entry.target.classList.add('is-visible');

          // Optional: Unobserve card sau khi đã animate (không animate lại)
          // Nếu muốn animate lại mỗi lần scroll vào, comment dòng dưới
          observer.unobserve(entry.target);
        }
      });
    };

    // Create observer
    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe tất cả cards
    c5Cards.forEach(card => {
      observer.observe(card);
    });
  }
})();
