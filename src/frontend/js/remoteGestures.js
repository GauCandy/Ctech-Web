/**
 * Remote Gestures - Hỗ trợ cử chỉ cho bút thuyết trình
 * Double-tap Enter/Select để chuyển theme
 */

(function() {
  'use strict';

  let lastEnterTime = 0;
  const DOUBLE_TAP_THRESHOLD = 400; // milliseconds

  document.addEventListener('keydown', (e) => {
    // Double tap Enter key to cycle theme
    if (e.key === 'Enter') {
      const currentTime = Date.now();
      const timeSinceLastPress = currentTime - lastEnterTime;

      // Check if this is a double tap
      if (timeSinceLastPress < DOUBLE_TAP_THRESHOLD && timeSinceLastPress > 0) {
        // Double tap detected - cycle theme
        e.preventDefault();

        if (window.ThemeManager && typeof window.ThemeManager.cycleTheme === 'function') {
          window.ThemeManager.cycleTheme();
        }

        // Reset to prevent triple tap
        lastEnterTime = 0;
        return;
      }

      // Update last press time
      lastEnterTime = currentTime;
    }
  });
})();
