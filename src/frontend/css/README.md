# CSS Documentation - CTECH Frontend

## Tổng Quan Các File CSS

```
css/
├── main.css              # Core styles (2400+ lines)
├── enhancements.css      # Visual enhancements & hero
├── presentation-mode.css # Presentation theme
├── c5-animation.css      # 5C scroll animations
├── c5-modal.css          # 5C modal styles
├── floating-buttons.css  # Floating buttons
└── loader.css            # Page loader
```

---

## 📄 main.css

**Core stylesheet** với tất cả base styles và components.

### Structure

1. **CSS Variables** (Lines 1-79)
   ```css
   :root { ... }
   [data-theme="dark"] { ... }
   [data-theme="presentation"] { ... }
   ```

2. **Base Styles** (Lines 80-400)
   - HTML/Body
   - Typography
   - Scrollbar
   - Container

3. **Header** (Lines 415-648)
   - Site header (sticky)
   - Navigation
   - Theme toggle
   - User indicator

4. **Hero Section** (Lines 652-950)
   - Hero container
   - Background layers
   - Highlight cards
   - Hero intro

5. **Sections** (Lines 955-1085)
   - Section layout
   - Program/Campus/Services grids
   - Cards

6. **Footer** (Lines 1086-1225)
   - Footer layout
   - Contact info
   - Help floating button

7. **Chat Widget** (Lines 1229-2098)
   - Chat panel
   - Messages
   - Input form
   - Bubbles & styling

8. **5C Model Section** (Lines 2430-2729)
   - 5C grid
   - Cards
   - Icons
   - Dark mode variants

9. **Media Queries** (Lines 2158-2354)
   - Mobile (≤767px)
   - Tablet (768-1023px)
   - Desktop (≥1024px)

10. **Animations** (Lines 2358-2428)
    - Keyframes
    - Transitions

### Key CSS Variables

```css
/* Colors */
--primary: #16a34a;
--accent: #0ea5e9;
--text-main: #0f172a;

/* Transitions */
--transition-smooth: cubic-bezier(0.4, 0, 0.2, 1);
--transition-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);

/* Shadows */
--shadow-sm: 0 2px 8px rgba(15, 23, 42, 0.08);
--shadow-md: 0 4px 16px rgba(15, 23, 42, 0.12);
--shadow-lg: 0 8px 32px rgba(15, 23, 42, 0.16);
```

---

## 🎨 enhancements.css

**Visual enhancements** cho hero section và cards.

### Features

1. **Hero Improvements**
   ```css
   .hero {
     height: 100vh;
     display: flex;
     align-items: center;
   }
   ```

2. **Background Image**
   ```css
   .hero::before {
     background-image: url('/img/background.webp');
     opacity: 1; /* Dark: 0.5, Presentation: 0.6 */
   }
   ```

3. **Overlay Gradients**
   ```css
   .hero::after {
     /* Light mode: Green gradient */
     /* Dark mode: Dark gradient */
     /* Presentation: White gradient */
   }
   ```

4. **Enhanced Cards**
   - Gradient backgrounds
   - Hover effects
   - Border animations

5. **Floating Shape**
   - Animated decoration
   - Radial gradient
   - Float animation (25s loop)

### Responsive Adjustments

```css
@media (max-width: 768px) {
  .hero {
    height: auto;
    min-height: 100vh;
  }
}
```

---

## 📽️ presentation-mode.css

**Presentation theme** cho máy chiếu.

### Features

1. **Full Viewport Sections**
   ```css
   .section {
     min-height: 100vh;
     display: flex;
     align-items: center;
   }
   ```

2. **Section Indicators**
   - Fixed right sidebar
   - Dot navigation
   - Active state highlighting

3. **Optimized Typography**
   - Larger font sizes
   - Higher contrast
   - Bolder weights

4. **Resolution Scaling**
   - Optimal at 1920x1200
   - Auto-scale for other resolutions
   - Media queries cho tablet/mobile

### Presentation Indicators

```css
.presentation-indicators {
  position: fixed;
  right: 24px;
  top: 50%;
}

.presentation-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.presentation-indicator.active {
  background: var(--indicator-active-color);
}
```

---

## ✨ c5-animation.css

**Scroll animations** cho 5C cards.

### Animation States

```css
/* Initial - Hidden */
.c5-card {
  opacity: 0;
  transform: translateX(-60px) scale(0.95);
}

/* Animated - Visible */
.c5-card.is-animated {
  opacity: 1;
  transform: translateX(0) scale(1);
}
```

### Stagger Delays

```css
.c5-card--1.is-animated { transition-delay: 0.1s; }
.c5-card--2.is-animated { transition-delay: 0.2s; }
.c5-card--3.is-animated { transition-delay: 0.3s; }
.c5-card--4.is-animated { transition-delay: 0.4s; }
.c5-card--5.is-animated { transition-delay: 0.5s; }
```

### Hover Enhancement

```css
.c5-card.is-animated:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px rgba(14, 165, 233, 0.2);
}
```

---

## 🎭 c5-modal.css

**Modal styles** cho 5C detail view.

### Components

1. **Modal Backdrop**
   ```css
   .c5-modal-backdrop {
     position: fixed;
     inset: 0;
     background: rgba(0, 0, 0, 0.8);
     backdrop-filter: blur(8px);
   }
   ```

2. **Modal Panel**
   ```css
   .c5-modal__panel {
     max-width: 900px;
     border-radius: 24px;
     background: var(--surface);
   }
   ```

3. **Modal Header**
   - Icon với gradient background
   - Title & close button
   - Color-coded per C

4. **Modal Content**
   - Description text
   - Features list
   - Benefits

5. **Color Schemes**
   ```css
   /* C1 - Red */
   .c5-modal__icon.c5-card--1 { background: red gradient }

   /* C2 - Indigo */
   .c5-modal__icon.c5-card--2 { background: indigo gradient }

   /* C3 - Green */
   .c5-modal__icon.c5-card--3 { background: green gradient }

   /* C4 - Yellow */
   .c5-modal__icon.c5-card--4 { background: yellow gradient }

   /* C5 - Blue */
   .c5-modal__icon.c5-card--5 { background: blue gradient }
   ```

---

## 🔘 floating-buttons.css

**Floating action buttons** (Help, Scroll to top, etc.)

### Features

- Fixed positioning
- Z-index management
- Hover effects
- Hide/show logic
- Smooth transitions

```css
.help-floating {
  position: fixed;
  bottom: 24px;
  right: 32px;
  z-index: 50;
}

.help-floating.is-hidden {
  opacity: 0;
  pointer-events: none;
}
```

---

## ⏳ loader.css

**Page loader** animation.

### Components

1. **Backdrop**
   ```css
   .loader-backdrop {
     position: fixed;
     inset: 0;
     background: var(--bg-primary);
     z-index: 9999;
   }
   ```

2. **Logo Animation**
   ```css
   .loader-logo img {
     animation: pulse 2s ease-in-out infinite;
   }
   ```

3. **Fade Out**
   ```css
   .loader-backdrop.fade-out {
     opacity: 0;
     transition: opacity 0.5s ease;
   }
   ```

---

## 🎯 Best Practices

### 1. Theme Variables
Luôn sử dụng CSS variables thay vì hard-coded colors:

```css
/* ✅ Good */
color: var(--text-main);
background: var(--surface);

/* ❌ Bad */
color: #0f172a;
background: #ffffff;
```

### 2. Responsive Units
Ưu tiên `clamp()`, `vh`, `vw`:

```css
/* ✅ Good */
padding: clamp(40px, 5vh, 80px);
font-size: clamp(1rem, 2vw, 1.5rem);

/* ❌ Bad */
padding: 60px;
font-size: 20px;
```

### 3. Transitions
Sử dụng custom timing functions:

```css
/* ✅ Good */
transition: all 0.3s var(--transition-smooth);

/* ❌ Bad */
transition: all 0.3s linear;
```

### 4. Z-Index Scale
```css
/* Header */
z-index: 40;

/* Help button */
z-index: 50;

/* Chat widget */
z-index: 60;

/* Loader */
z-index: 9999;
```

---

## 🔧 Customization

### Changing Primary Color

```css
:root {
  --primary: #your-color;
  --primary-dark: #your-darker-color;
  --primary-light: #your-lighter-color;
}
```

### Adding New Theme

1. Add CSS variables:
```css
[data-theme="new-theme"] {
  --bg-primary: ...;
  --surface: ...;
  --text-main: ...;
}
```

2. Add theme-specific overrides:
```css
[data-theme="new-theme"] .hero::after {
  background: your-gradient;
}
```

### Adjusting Breakpoints

```css
/* Custom breakpoint */
@media (max-width: 1200px) {
  /* Your styles */
}
```

---

## 🐛 Common Issues

### Issue: Theme not applying
**Solution**: Check `data-theme` attribute on `<html>` element

### Issue: Animations not working
**Solution**: Ensure `is-animated` class is added via JavaScript

### Issue: Hero height issues
**Solution**: Check viewport height units and min/max-height values

### Issue: Colors not updating
**Solution**: Check CSS variable inheritance and specificity
