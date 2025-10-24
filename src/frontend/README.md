# Frontend - CTECH Website

## Tổng Quan

Frontend của CTECH website, sử dụng Vanilla JavaScript, CSS3 và HTML5 với responsive design và theme system.

## Cấu Trúc Thư Mục

```
frontend/
├── css/                    # Stylesheets
│   ├── main.css           # Core styles
│   ├── enhancements.css   # Visual enhancements
│   ├── presentation-mode.css      # Presentation theme
│   ├── responsive-normal-mode.css # NEW! Responsive behavior
│   ├── c5-animation.css   # 5C scroll animations
│   ├── c5-modal.css       # 5C modal styles
│   ├── floating-buttons.css   # Floating action buttons
│   └── loader.css         # Page loader
├── js/                     # JavaScript files
│   ├── themeManager.js    # Theme switching logic
│   ├── headerManager.js   # Header scroll behavior
│   ├── scrollAnimations.js    # Scroll animations
│   ├── presentationMode.js    # Presentation mode
│   ├── responsiveHelper.js    # NEW! Responsive utilities
│   ├── c5Modal.js         # 5C modal functionality
│   └── c5ScrollAnimation.js   # 5C scroll triggers
├── img/                    # Images & assets
│   ├── background.webp    # Hero background
│   ├── logo.webp          # CTECH logo
│   └── 5C/                # 5C model images
├── main.html              # Main homepage
├── login.html             # Login page
├── services.html          # Services page
└── schedule.html          # Schedule page
```

---

## 🎨 Theme System

### Các Theme Khả Dụng

1. **Light Mode** (Default)
   - Background: Gradient xanh lá nhạt
   - Text: Tối (#0f172a)
   - Surface: Trắng với opacity

2. **Dark Mode**
   - Background: Tối (#0f172a)
   - Text: Sáng (#f1f5f9)
   - Surface: Xám đậm

3. **Presentation Mode**
   - Background: Trắng sáng
   - High contrast cho máy chiếu
   - Font đậm hơn
   - Border rõ ràng hơn

### Theme Toggle

Sử dụng `themeManager.js`:

```javascript
// Đổi theme
ThemeManager.setTheme('dark');

// Lấy theme hiện tại
const currentTheme = ThemeManager.getTheme();

// Lắng nghe thay đổi theme
document.addEventListener('themeChanged', (e) => {
  console.log('New theme:', e.detail.theme);
});
```

---

## 📱 Responsive Design

### 🎯 Auto-Scaling System (NEW!)

Website tự động điều chỉnh giữa 2 chế độ:

#### 1. **Fullscreen Mode** (≥1440px viewport, height ≥800px)
- Hero section chiếm toàn bộ viewport (100vh)
- Tối ưu cho trình chiếu và màn hình lớn
- Content được center hoàn hảo
- **Perfect cho presentation!**

#### 2. **Windowed Mode** (Cửa sổ bình thường)
- Hero tự động điều chỉnh theo content
- Padding linh hoạt dựa trên viewport
- Typography scale tự động
- **Perfect cho sử dụng hàng ngày!**

### Breakpoints

```javascript
const BREAKPOINTS = {
  mobile: 600,      // < 600px
  tablet: 900,      // 600px - 899px
  desktop: 1440,    // 900px - 1439px
  large: 1920       // ≥ 1440px
};
```

```css
/* Mobile */
@media (max-width: 599px) { ... }

/* Tablet */
@media (min-width: 600px) and (max-width: 899px) { ... }

/* Desktop Medium */
@media (min-width: 900px) and (max-width: 1439px) { ... }

/* Desktop Large */
@media (min-width: 1440px) { ... }

/* Extra Large */
@media (min-width: 1920px) { ... }
```

### 🔍 Debug Mode

Thêm `?debug=true` vào URL để xem viewport info:
```
http://localhost:3000/?debug=true
```

Features:
- ✅ Viewport size indicator (góc dưới trái)
- ✅ Hero mode indicator (góc trên phải)
- ✅ Console logs chi tiết
- ✅ Visual feedback

### 📐 Viewport Classes (Auto-detected)

Body tự động nhận các class:
- `viewport-mobile` - Màn hình nhỏ (< 600px)
- `viewport-tablet` - Tablet (600-899px)
- `viewport-desktop` - Desktop (900-1439px)
- `viewport-large` - Desktop lớn (≥1440px)
- `viewport-windowed` - Cửa sổ không full
- `viewport-fullscreen` - Fullscreen mode

---

## ✨ Animations

### Hero Section
- Background parallax effect
- Cards slide-in animation với stagger delay
- Hover effects với transform & shadow

### 5C Model Section
Scroll-triggered animation:
- Cards ẩn khi load page
- Hiện khi scroll vào viewport (từ trên xuống)
- Giữ nguyên khi scroll lên xuống
- Reset khi scroll lên trên section rồi xuống lại

**Implementation**: `c5ScrollAnimation.js`

```javascript
// Logic:
// 1. Scroll DOWN + viewport → Animate
// 2. Scroll UP/DOWN trong vùng → Giữ nguyên
// 3. Scroll UP qua section → Reset cho lần sau
```

---

## 🎯 Key Features

### 1. Hero Section
- Full viewport height (100vh)
- Auto-scale với mọi màn hình
- Background image với overlay gradient
- Responsive padding

**CSS**: `enhancements.css`, `main.css`

### 2. Theme Switcher
- Dropdown menu với 3 options
- Lưu preference vào localStorage
- Smooth transitions

**JS**: `themeManager.js`

### 3. Scroll Animations
- IntersectionObserver API
- RequestAnimationFrame throttling
- Performance optimized

**JS**: `scrollAnimations.js`, `c5ScrollAnimation.js`

### 4. Chat Widget
- Floating chat button
- Modal với AI chatbot
- Message history
- Syntax highlighting cho code

**CSS**: `main.css` (chat-widget classes)

### 5. 5C Modal
- Click card → Open modal
- Chi tiết về từng C
- Close với ESC key hoặc click outside
- Focus trap

**JS**: `c5Modal.js`
**CSS**: `c5-modal.css`

---

## 🚀 Performance Optimization

### CSS
- Minification ready
- CSS variables cho theme
- Hardware-accelerated animations
- Will-change property

### JavaScript
- Event delegation
- Throttled scroll events
- Lazy loading ready
- No jQuery dependency

### Images
- WebP format
- Responsive images
- Lazy loading attributes

---

## 📐 CSS Architecture

### Naming Convention
```css
/* BEM-like methodology */
.block { }
.block__element { }
.block--modifier { }

/* Examples */
.hero { }
.hero-content { }
.hero--dark { }

.chat-widget { }
.chat-widget__header { }
.chat-widget__message--user { }
```

### CSS Variables
```css
:root {
  --bg-primary: ...;
  --surface: ...;
  --text-main: ...;
  --primary: #16a34a;
  --accent: #0ea5e9;
  --transition-smooth: cubic-bezier(0.4, 0, 0.2, 1);
}

[data-theme="dark"] {
  --bg-primary: ...;
  --text-main: #f1f5f9;
}
```

---

## 🔧 JavaScript Modules

### themeManager.js
Quản lý theme switching và persistence.

**Methods:**
- `setTheme(theme)` - Set theme
- `getTheme()` - Get current theme
- `init()` - Initialize theme system

### headerManager.js
Quản lý header scroll behavior (sticky, hide/show).

### scrollAnimations.js
Scroll-triggered animations cho các elements.

### c5Modal.js
Modal functionality cho 5C cards.

**Events:**
- Click card → Open modal
- Click outside → Close modal
- ESC key → Close modal

### c5ScrollAnimation.js
Scroll animation logic cho 5C section.

**Logic Flow:**
```
Scroll DOWN → Vào viewport → Animate
Scroll UP → Giữ nguyên
Scroll UP qua section → Reset flag
Scroll DOWN lại → Animate lại
```

---

## 📱 Pages Overview

### main.html
Homepage với:
- Hero section
- Giới thiệu (5C model)
- Chương trình đào tạo
- Đời sống sinh viên
- Tin tức

### login.html
Login/Register page với:
- Form validation
- JWT authentication
- Remember me option

### services.html
Dịch vụ sinh viên:
- Danh sách dịch vụ
- QR code payment
- Purchase history

### schedule.html
Thời khóa biểu:
- Calendar view
- Week/Day selector
- Export to PDF

---

## 🎨 Color Palette

### Primary Colors
- **Primary**: `#16a34a` (Green)
- **Primary Dark**: `#047857`
- **Primary Light**: `#22c55e`

### Accent Colors
- **Accent**: `#0ea5e9` (Blue)
- **Accent Light**: `#38bdf8`

### Neutrals
- **Text Main**: `#0f172a` (Light) / `#f1f5f9` (Dark)
- **Text Muted**: `#475569` (Light) / `#cbd5e1` (Dark)

---

## 📚 Typography

### Font Family
```css
font-family: 'Be Vietnam Pro', 'Segoe UI', Tahoma, sans-serif;
```

### Font Weights
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

### Scale
```css
/* Headings */
h1: clamp(2.5rem, 5.5vw, 4rem)
h2: clamp(2rem, 4vw, 2.8rem)
h3: clamp(1.6rem, 3vw, 2.2rem)

/* Body */
body: 1rem (16px)
small: 0.875rem (14px)
```

---

## 🛠️ Development Tips

### Adding New Theme
1. Add CSS variables in `:root` and `[data-theme="new-theme"]`
2. Add option to theme toggle dropdown (HTML)
3. Update `themeManager.js` validation

### Adding New Animation
1. Define keyframes in CSS
2. Add trigger logic in JS (scroll, click, etc.)
3. Use IntersectionObserver for scroll-triggered

### Debugging
```javascript
// Enable debug mode
localStorage.setItem('debug', 'true');

// Check current theme
console.log(document.documentElement.getAttribute('data-theme'));

// Test animations
document.querySelectorAll('.c5-card').forEach(card => {
  card.classList.add('is-animated');
});
```

---

## 📖 Documentation Chi Tiết

- [CSS Documentation](css/README.md)
- [JavaScript Documentation](js/README.md)

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari, Chrome Android
