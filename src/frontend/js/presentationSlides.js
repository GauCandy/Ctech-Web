/**
 * Presentation Slides Controller
 * Full-screen slide presentation for 5-10 minute presentations
 */

(function() {
  'use strict';

  let currentSlide = 0;
  let totalSlides = 0;
  let startTime = null;
  let timerInterval = null;
  let presentationContainer = null;

  /**
   * Initialize presentation slides
   */
  function initPresentationSlides() {
    // Get presentation container
    presentationContainer = document.querySelector('.presentation-slides');
    if (!presentationContainer) {
      console.warn('Presentation slides container not found');
      return;
    }

    // Get all slides
    const slides = presentationContainer.querySelectorAll('.slide');
    totalSlides = slides.length;

    // Setup event listeners
    setupEventListeners();

    // Update progress
    updateProgress();

    console.log(`Presentation initialized with ${totalSlides} slides`);
  }

  /**
   * Setup all event listeners
   */
  function setupEventListeners() {
    // Close button
    const closeBtn = document.querySelector('.presentation-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closePresentation);
    }

    // Navigation buttons
    const prevBtn = document.querySelector('.nav-prev');
    const nextBtn = document.querySelector('.nav-next');

    if (prevBtn) {
      prevBtn.addEventListener('click', previousSlide);
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', nextSlide);
    }

    // Keyboard navigation
    document.addEventListener('keydown', handleKeyboard);

    // Slide dots
    const dots = document.querySelectorAll('.slide-dot');
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => goToSlide(index));
    });
  }

  /**
   * Handle keyboard navigation
   */
  function handleKeyboard(e) {
    // Only handle when presentation is active
    if (!presentationContainer || !presentationContainer.classList.contains('active')) {
      return;
    }

    // Ignore if user is typing in an input
    if (e.target.matches('input, textarea')) {
      return;
    }

    switch(e.key) {
      case 'ArrowRight':
      case 'PageDown':
      case ' ':
        e.preventDefault();
        nextSlide();
        break;

      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault();
        previousSlide();
        break;

      case 'Home':
        e.preventDefault();
        goToSlide(0);
        break;

      case 'End':
        e.preventDefault();
        goToSlide(totalSlides - 1);
        break;

      case 'Escape':
        e.preventDefault();
        closePresentation();
        break;
    }
  }

  /**
   * Open presentation
   */
  function openPresentation() {
    if (!presentationContainer) {
      console.error('Presentation container not found');
      return;
    }

    // Show presentation
    presentationContainer.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Start timer
    startTime = Date.now();
    startTimer();

    // Go to first slide
    goToSlide(0);

    console.log('Presentation opened');
  }

  /**
   * Close presentation
   */
  function closePresentation() {
    if (!presentationContainer) return;

    // Hide presentation
    presentationContainer.classList.remove('active');
    document.body.style.overflow = '';

    // Stop timer
    stopTimer();

    // Reset to first slide
    currentSlide = 0;

    console.log('Presentation closed');
  }

  /**
   * Go to specific slide
   */
  function goToSlide(index) {
    if (index < 0 || index >= totalSlides) return;

    const slides = presentationContainer.querySelectorAll('.slide');

    // Remove active class from all slides
    slides.forEach(slide => slide.classList.remove('active'));

    // Add active class to target slide
    slides[index].classList.add('active');

    // Update current slide index
    currentSlide = index;

    // Update UI
    updateProgress();
    updateDots();
    updateNavButtons();

    console.log(`Navigated to slide ${index + 1}/${totalSlides}`);
  }

  /**
   * Go to next slide
   */
  function nextSlide() {
    if (currentSlide < totalSlides - 1) {
      goToSlide(currentSlide + 1);
    }
  }

  /**
   * Go to previous slide
   */
  function previousSlide() {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  }

  /**
   * Update progress bar and text
   */
  function updateProgress() {
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');

    if (progressFill) {
      const percentage = ((currentSlide + 1) / totalSlides) * 100;
      progressFill.style.width = `${percentage}%`;
    }

    if (progressText) {
      progressText.textContent = `Slide ${currentSlide + 1} / ${totalSlides}`;
    }
  }

  /**
   * Update slide dots
   */
  function updateDots() {
    const dots = document.querySelectorAll('.slide-dot');
    dots.forEach((dot, index) => {
      if (index === currentSlide) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  /**
   * Update navigation buttons state
   */
  function updateNavButtons() {
    const prevBtn = document.querySelector('.nav-prev');
    const nextBtn = document.querySelector('.nav-next');

    if (prevBtn) {
      prevBtn.disabled = currentSlide === 0;
    }

    if (nextBtn) {
      nextBtn.disabled = currentSlide === totalSlides - 1;
      nextBtn.textContent = currentSlide === totalSlides - 1 ? 'Kết thúc' : 'Tiếp theo';
    }
  }

  /**
   * Start presentation timer
   */
  function startTimer() {
    stopTimer(); // Clear any existing timer

    timerInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      updateTimerDisplay(elapsed);
    }, 1000);
  }

  /**
   * Stop presentation timer
   */
  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  /**
   * Update timer display
   */
  function updateTimerDisplay(elapsed) {
    const timerElement = document.querySelector('.presentation-timer');
    if (!timerElement) return;

    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);

    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Public API
   */
  window.PresentationSlides = {
    open: openPresentation,
    close: closePresentation,
    next: nextSlide,
    previous: previousSlide,
    goTo: goToSlide
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPresentationSlides);
  } else {
    initPresentationSlides();
  }

})();
