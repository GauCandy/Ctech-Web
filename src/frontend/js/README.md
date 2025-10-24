# JavaScript Documentation - CTECH Frontend

## Tổng Quan Các File JS

```
js/
├── themeManager.js        # Theme switching & persistence
├── headerManager.js       # Header scroll behavior
├── scrollAnimations.js    # General scroll animations
├── presentationMode.js    # Presentation mode logic
├── c5Modal.js             # 5C modal functionality
└── c5ScrollAnimation.js   # 5C scroll-triggered animations
```

---

## 🎨 themeManager.js

**Quản lý theme switching** và lưu preference vào localStorage.

### Features

- Theme toggle dropdown
- LocalStorage persistence
- Theme change events
- CSS variable updates

### API

```javascript
// Set theme
ThemeManager.setTheme('dark');

// Get current theme
const theme = ThemeManager.getTheme(); // 'light' | 'dark' | 'presentation'

// Init theme system
ThemeManager.init();

// Listen to theme changes
document.addEventListener('themeChanged', (e) => {
  console.log('New theme:', e.detail.theme);
});
```

### Implementation

```javascript
const ThemeManager = {
  themes: ['light', 'dark', 'presentation'],

  init() {
    // Load saved theme or default to 'light'
    const savedTheme = localStorage.getItem('theme') || 'light';
    this.setTheme(savedTheme);
    this.setupToggle();
  },

  setTheme(theme) {
    if (!this.themes.includes(theme)) return;

    // Update DOM
    document.documentElement.setAttribute('data-theme', theme);

    // Save to localStorage
    localStorage.setItem('theme', theme);

    // Dispatch event
    document.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme }
    }));
  },

  getTheme() {
    return document.documentElement.getAttribute('data-theme');
  }
};
```

### Usage in HTML

```html
<!-- Theme toggle dropdown -->
<div class="theme-toggle__dropdown">
  <div class="theme-toggle__option" data-theme="light">
    <span>☀️</span>
    <span>Sáng</span>
  </div>
  <div class="theme-toggle__option" data-theme="dark">
    <span>🌙</span>
    <span>Tối</span>
  </div>
  <div class="theme-toggle__option" data-theme="presentation">
    <span>📽️</span>
    <span>Trình chiếu</span>
  </div>
</div>
```

---

## 📜 headerManager.js

**Quản lý header behavior** khi scroll.

### Features

- Sticky header
- Hide on scroll down
- Show on scroll up
- Transparent when at top

### Implementation

```javascript
const HeaderManager = {
  header: null,
  lastScrollY: 0,
  threshold: 100,

  init() {
    this.header = document.querySelector('.site-header');
    window.addEventListener('scroll', this.handleScroll.bind(this));
  },

  handleScroll() {
    const currentScrollY = window.scrollY;

    // At top - transparent
    if (currentScrollY < 50) {
      this.header.classList.add('at-top');
    } else {
      this.header.classList.remove('at-top');
    }

    // Scroll down - hide
    if (currentScrollY > this.lastScrollY && currentScrollY > this.threshold) {
      this.header.classList.add('hidden');
    }
    // Scroll up - show
    else if (currentScrollY < this.lastScrollY) {
      this.header.classList.remove('hidden');
    }

    this.lastScrollY = currentScrollY;
  }
};
```

### CSS Required

```css
.site-header {
  position: fixed;
  top: 0;
  transition: transform 0.3s ease;
}

.site-header.hidden {
  transform: translateY(-100%);
}

.site-header.at-top {
  background: transparent;
}
```

---

## ✨ scrollAnimations.js

**General scroll animations** sử dụng IntersectionObserver.

### Features

- Fade in on scroll
- Slide in animations
- Threshold configuration
- Performance optimized

### Implementation

```javascript
const ScrollAnimations = {
  init() {
    this.observeElements();
  },

  observeElements() {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.2 // Trigger khi 20% element visible
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          // Optional: unobserve sau khi animate
          // observer.unobserve(entry.target);
        }
      });
    }, options);

    // Observe tất cả elements với class 'animate-on-scroll'
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      observer.observe(el);
    });
  }
};
```

### Usage in HTML

```html
<div class="card animate-on-scroll">
  <!-- Content -->
</div>
```

### CSS Required

```css
.animate-on-scroll {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.6s ease;
}

.animate-on-scroll.animate-in {
  opacity: 1;
  transform: translateY(0);
}
```

---

## 📽️ presentationMode.js

**Presentation mode logic** với section indicators.

### Features

- Section navigation indicators
- Smooth scroll to sections
- Auto-highlight active section
- Keyboard navigation (Arrow keys)

### Implementation

```javascript
const PresentationMode = {
  sections: [],
  indicators: [],
  currentIndex: 0,

  init() {
    this.sections = document.querySelectorAll('section');
    this.createIndicators();
    this.setupListeners();
    this.updateActiveIndicator();
  },

  createIndicators() {
    const container = document.createElement('div');
    container.className = 'presentation-indicators';

    this.sections.forEach((section, index) => {
      const indicator = document.createElement('button');
      indicator.className = 'presentation-indicator';
      indicator.setAttribute('data-index', index);
      indicator.addEventListener('click', () => this.goToSection(index));
      container.appendChild(indicator);
      this.indicators.push(indicator);
    });

    document.body.appendChild(container);
  },

  goToSection(index) {
    if (index >= 0 && index < this.sections.length) {
      this.sections[index].scrollIntoView({ behavior: 'smooth' });
      this.currentIndex = index;
      this.updateActiveIndicator();
    }
  },

  updateActiveIndicator() {
    this.indicators.forEach((ind, idx) => {
      if (idx === this.currentIndex) {
        ind.classList.add('active');
      } else {
        ind.classList.remove('active');
      }
    });
  },

  setupListeners() {
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.goToSection(this.currentIndex + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.goToSection(this.currentIndex - 1);
      }
    });

    // Update on scroll
    window.addEventListener('scroll', this.checkActiveSection.bind(this));
  },

  checkActiveSection() {
    const scrollY = window.scrollY + window.innerHeight / 2;

    this.sections.forEach((section, index) => {
      const sectionTop = section.offsetTop;
      const sectionBottom = sectionTop + section.offsetHeight;

      if (scrollY >= sectionTop && scrollY < sectionBottom) {
        if (this.currentIndex !== index) {
          this.currentIndex = index;
          this.updateActiveIndicator();
        }
      }
    });
  }
};
```

---

## 🎭 c5Modal.js

**5C Modal functionality** - open/close modal khi click vào cards.

### Features

- Open modal on card click
- Close on ESC key
- Close on backdrop click
- Focus trap
- Prevent body scroll

### Implementation

```javascript
const C5Modal = {
  modal: null,
  backdrop: null,

  init() {
    this.createModal();
    this.setupListeners();
  },

  createModal() {
    // Create modal structure
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'c5-modal-backdrop';
    this.backdrop.setAttribute('hidden', '');

    this.modal = document.createElement('div');
    this.modal.className = 'c5-modal__panel';

    this.backdrop.appendChild(this.modal);
    document.body.appendChild(this.backdrop);
  },

  setupListeners() {
    // Click on cards
    document.querySelectorAll('[data-c5-id]').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-c5-id');
        this.open(id);
      });
    });

    // Close on backdrop click
    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) {
        this.close();
      }
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.backdrop.hasAttribute('hidden')) {
        this.close();
      }
    });
  },

  open(id) {
    // Load content based on ID
    this.loadContent(id);

    // Show modal
    this.backdrop.removeAttribute('hidden');

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Focus trap
    this.trapFocus();
  },

  close() {
    this.backdrop.setAttribute('hidden', '');
    document.body.style.overflow = '';
  },

  loadContent(id) {
    const content = this.getContentForId(id);
    this.modal.innerHTML = `
      <div class="c5-modal__header">
        <div class="c5-modal__icon c5-card--${id}">
          <span class="material-icons">${content.icon}</span>
        </div>
        <h2>${content.title}</h2>
        <button class="c5-modal__close">×</button>
      </div>
      <div class="c5-modal__content">
        <p>${content.description}</p>
        <ul>
          ${content.features.map(f => `<li>${f}</li>`).join('')}
        </ul>
      </div>
    `;

    // Close button
    this.modal.querySelector('.c5-modal__close').addEventListener('click', () => {
      this.close();
    });
  },

  getContentForId(id) {
    const contents = {
      '1': {
        title: 'Chất lượng giảng dạy',
        icon: 'school',
        description: '...',
        features: ['...', '...']
      },
      // ... other Cs
    };
    return contents[id];
  },

  trapFocus() {
    const focusableElements = this.modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    this.modal.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    });

    firstElement.focus();
  }
};
```

---

## 🎬 c5ScrollAnimation.js

**5C scroll-triggered animations** với logic reset.

### Features

- Animate khi scroll DOWN vào viewport
- Giữ nguyên khi scroll UP/DOWN trong vùng
- Reset khi scroll UP qua section
- Throttled scroll events

### Implementation

```javascript
(function() {
  'use strict';

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    const c5Section = document.querySelector('.section-5c');
    const c5Cards = document.querySelectorAll('.c5-card');

    if (!c5Section || c5Cards.length === 0) return;

    let previousScrollY = window.scrollY;
    let hasAnimated = false;
    let isAboveSection = true;
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

      // Section trong viewport (20% visible)
      const isInViewport = (
        sectionRect.top < viewportHeight * 0.8 &&
        sectionRect.bottom > viewportHeight * 0.2
      );

      // Đang ở trên section
      const isCurrentlyAbove = sectionRect.top > viewportHeight;

      // Logic 1: Scroll DOWN + In viewport + Chưa animate → Animate
      if (scrollDirection === 'down' && isInViewport && !hasAnimated) {
        animateCards();
        hasAnimated = true;
        isAboveSection = false;
      }

      // Logic 2: Scroll UP qua section → Reset để animate lại lần sau
      if (isCurrentlyAbove && !isAboveSection) {
        resetAnimation();
        hasAnimated = false;
        isAboveSection = true;
      }

      // Logic 3: Đang trong/dưới section → Giữ flag
      if (!isCurrentlyAbove) {
        isAboveSection = false;
      }

      previousScrollY = currentScrollY;
    }

    function animateCards() {
      c5Cards.forEach(card => {
        card.classList.add('is-animated');
      });
    }

    function resetAnimation() {
      c5Cards.forEach(card => {
        card.classList.remove('is-animated');
      });
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    checkSectionPosition();
  }
})();
```

### Logic Flow

```
1. Page load → Cards hidden (no animation)

2. Scroll DOWN tới 5C section
   → isInViewport = true
   → scrollDirection = 'down'
   → hasAnimated = false
   → ADD class 'is-animated' → ANIMATE
   → hasAnimated = true

3. Scroll DOWN/UP trong vùng section
   → hasAnimated = true → Không animate lại
   → Cards giữ nguyên trạng thái

4. Scroll UP qua section (ra khỏi viewport phía trên)
   → isCurrentlyAbove = true
   → isAboveSection = false
   → REMOVE class 'is-animated' → RESET
   → hasAnimated = false
   → isAboveSection = true

5. Scroll DOWN lại tới 5C
   → Quay lại bước 2 → Animate lại
```

---

## 🔧 Debugging Tools

### Enable Debug Mode

```javascript
// In console
localStorage.setItem('debug', 'true');

// Check if debug enabled
if (localStorage.getItem('debug') === 'true') {
  console.log('Debug mode enabled');
}
```

### Log Theme Changes

```javascript
document.addEventListener('themeChanged', (e) => {
  console.log('[Theme] Changed to:', e.detail.theme);
});
```

### Test Animations Manually

```javascript
// Trigger 5C animations
document.querySelectorAll('.c5-card').forEach(card => {
  card.classList.add('is-animated');
});

// Reset 5C animations
document.querySelectorAll('.c5-card').forEach(card => {
  card.classList.remove('is-animated');
});
```

### Check Scroll Position

```javascript
window.addEventListener('scroll', () => {
  console.log('ScrollY:', window.scrollY);
  console.log('Viewport height:', window.innerHeight);
});
```

---

## 🎯 Best Practices

### 1. Event Delegation

```javascript
// ✅ Good - One listener
document.addEventListener('click', (e) => {
  if (e.target.matches('.card')) {
    handleCardClick(e.target);
  }
});

// ❌ Bad - Multiple listeners
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', handleCardClick);
});
```

### 2. Throttling/Debouncing

```javascript
// ✅ Good - Throttled scroll
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      handleScroll();
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });
```

### 3. Cleanup

```javascript
// ✅ Good - Remove listeners when done
const controller = new AbortController();

element.addEventListener('click', handler, {
  signal: controller.signal
});

// Later...
controller.abort();
```

### 4. Feature Detection

```javascript
// ✅ Good - Check support
if ('IntersectionObserver' in window) {
  // Use IntersectionObserver
} else {
  // Fallback
}
```

---

## 🐛 Common Issues

### Issue: Animation doesn't trigger
**Solution**: Check class names, ensure JS file is loaded, check console for errors

### Issue: Theme not persisting
**Solution**: Check localStorage, ensure `setTheme()` is called, check browser permissions

### Issue: Scroll events firing too much
**Solution**: Use throttling with `requestAnimationFrame`, add `{ passive: true }`

### Issue: Modal not closing
**Solution**: Check event listeners, ensure backdrop/close button exists, check `hidden` attribute

---

## 📚 External Dependencies

- **None!** - Pure Vanilla JavaScript
- No jQuery
- No React/Vue
- No external libraries

## Browser APIs Used

- `IntersectionObserver` - Scroll animations
- `localStorage` - Theme persistence
- `requestAnimationFrame` - Performance optimization
- `CustomEvent` - Event communication
- `MutationObserver` - DOM change detection (if needed)
