# Frontend Architecture

Frontend cho CTECH Web System sử dụng vanilla JavaScript, CSS3, và HTML5 - không có framework phức tạp.

## Cấu trúc thư mục

```
src/frontend/
├── css/                           # Stylesheets
│   ├── main.css                  # Global styles
│   ├── login.css                 # Login page styles
│   ├── services.css              # Services page styles
│   ├── schedule.css              # Schedule page styles
│   ├── presentation-*.css        # Presentation mode themes
│   ├── c5-*.css                  # 5C department styles
│   ├── departments.css           # Department section styles
│   ├── user-menu.css            # User dropdown menu
│   ├── floating-buttons.css     # Floating action buttons
│   ├── responsive-*.css         # Responsive layouts
│   ├── mobile-optimization.css  # Mobile optimizations
│   └── enhancements.css         # UI enhancements
│
├── js/                           # JavaScript modules
│   ├── themeManager.js          # Theme switching (light/dark)
│   ├── presentationMode.js      # Presentation fullscreen mode
│   ├── presentationSlides.js    # Slide navigation
│   ├── remoteGestures.js        # Remote control gestures
│   ├── headerManager.js         # Header visibility control
│   ├── admin.js                 # Admin panel logic
│   ├── c5Modal.js               # 5C modal dialogs
│   ├── c5ScrollAnimation.js     # 5C scroll animations
│   ├── departmentToggle.js      # Department section toggle
│   ├── departmentCarousel.js    # Department carousel
│   ├── scrollAnimations.js      # Global scroll animations
│   ├── mobileMenu.js            # Mobile hamburger menu
│   ├── responsiveHelper.js      # Responsive utilities
│   └── swRegister.js            # Service Worker registration
│
├── img/                          # Images và assets
│   ├── 5C/                      # 5C department images
│   └── (other images)
│
├── main.html                     # Home page
├── login.html                    # Login page
├── services.html                 # Services catalog page
├── schedule.html                 # Timetable page
├── admin.html                    # Admin panel page
└── presentation.html             # Presentation mode page
```

## Core Pages

### 1. main.html (Home Page)

**Features:**
- Welcome section với hero banner
- Departments showcase (5C system)
- Services preview
- News/announcements
- User dropdown menu
- Theme toggle button
- Presentation mode trigger

**Gesture Navigation:**
- **Enter x2**: Toggle theme
- **Enter x3**: Enter presentation mode
- **Up x2**: Navigate to services page

**Key Sections:**
```html
<header> - Navigation với user menu
<section class="hero"> - Hero banner
<section class="departments"> - 5C departments
<section class="services-preview"> - Quick services access
<section class="news"> - Announcements
<footer> - School info
```

### 2. login.html

**Features:**
- Username/password form
- Remember me checkbox
- Login with JWT
- Error handling
- Redirect to home on success
- Admin redirect to /admin

**API Integration:**
```javascript
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
})
```

### 3. services.html

**Features:**
- Service catalog grid
- Category filter
- Search functionality
- Service details modal
- Order placement
- Voucher application
- Shopping cart

**Gesture Navigation:**
- **Enter x2**: Toggle theme
- **Up x2**: Navigate to schedule page
- **Up x3**: Navigate to home page

**API Integration:**
```javascript
// Get services
fetch('/api/services?category=Gửi xe')

// Create order
fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ serviceId, quantity })
})
```

### 4. schedule.html

**Features:**
- Timetable display (grid layout)
- PDF upload
- Week view
- Subject details
- Teacher info
- Room numbers

**Gesture Navigation:**
- **Enter x2**: Toggle theme
- **Up x2**: Navigate to home page
- **Up x3**: Navigate to services page

**API Integration:**
```javascript
// Upload timetable PDF
const formData = new FormData();
formData.append('file', pdfFile);

fetch('/api/timetable/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
})

// Get timetable
fetch('/api/timetable', {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

### 5. admin.html

**Features:**
- User management (CRUD)
- Service management (CRUD)
- Order monitoring
- Statistics dashboard
- Image upload for services

**Admin Authentication:**
```javascript
fetch('/api/admin/users', {
  headers: { 'X-Admin-Token': adminToken }
})
```

### 6. presentation.html

**Features:**
- Fullscreen presentation mode
- Slide-based layout
- Auto-advance slides
- Manual navigation (arrow keys, remote)
- Multiple theme options (professional, creative, projector)
- Exit on Enter x2

**Gesture Navigation:**
- **Enter x2**: Exit to home
- **Arrow Left/Right**: Navigate slides
- **Arrow Up/Down**: Navigate slides

**Themes:**
- Professional (blue gradient)
- Creative (vibrant colors)
- Projector (high contrast, readability)

## JavaScript Modules

### 1. themeManager.js

Theme switching system với localStorage persistence.

**Features:**
```javascript
class ThemeManager {
  constructor() {
    this.themes = ['light', 'dark', 'blue', 'green'];
    this.currentTheme = localStorage.getItem('theme') || 'light';
  }

  cycleTheme() {
    // Cycle through themes
  }

  setTheme(themeName) {
    document.body.className = `theme-${themeName}`;
    localStorage.setItem('theme', themeName);
  }
}

// Global instance
window.ThemeManager = new ThemeManager();
```

**Usage:**
```javascript
// Toggle theme
window.ThemeManager.cycleTheme();

// Set specific theme
window.ThemeManager.setTheme('dark');
```

### 2. presentationMode.js

Fullscreen presentation mode với Fullscreen API.

**Features:**
```javascript
function enterPresentationMode() {
  const elem = document.documentElement;

  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) {
    elem.webkitRequestFullscreen();
  }

  window.location.href = '/presentation.html';
}

function exitPresentationMode() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  }

  window.location.href = '/home';
}
```

### 3. presentationSlides.js

Slide navigation logic.

**Features:**
```javascript
class SlideManager {
  constructor() {
    this.currentSlide = 0;
    this.slides = document.querySelectorAll('.slide');
  }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
    this.showSlide(this.currentSlide);
  }

  prevSlide() {
    this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
    this.showSlide(this.currentSlide);
  }

  showSlide(index) {
    this.slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });
  }
}
```

**Keyboard Navigation:**
```javascript
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    slideManager.nextSlide();
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    slideManager.prevSlide();
  }
});
```

### 4. remoteGestures.js

Remote control gesture detection (Skycolor T230).

**Gesture Pattern:**
```javascript
let tapCount = 0;
let tapTimer = null;
const TAP_THRESHOLD = 500; // ms

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    tapCount++;

    if (tapTimer) clearTimeout(tapTimer);

    // Triple tap
    if (tapCount === 3) {
      handleTripleTap();
      tapCount = 0;
      return;
    }

    // Double tap (wait for potential triple)
    tapTimer = setTimeout(() => {
      if (tapCount === 2) {
        handleDoubleTap();
      }
      tapCount = 0;
    }, TAP_THRESHOLD);
  }
});
```

**Gestures by Page:**
- Home: Enter x2 = theme, Enter x3 = presentation, Up x2 = services
- Services: Enter x2 = theme, Up x2 = schedule, Up x3 = home
- Schedule: Enter x2 = theme, Up x2 = home, Up x3 = services
- Presentation: Enter x2 = exit

### 5. headerManager.js

Dynamic header visibility based on scroll.

**Features:**
```javascript
let lastScrollTop = 0;
const header = document.querySelector('header');

window.addEventListener('scroll', () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

  if (scrollTop > lastScrollTop) {
    // Scrolling down - hide header
    header.classList.add('hidden');
  } else {
    // Scrolling up - show header
    header.classList.remove('hidden');
  }

  lastScrollTop = scrollTop;
});
```

### 6. admin.js

Admin panel logic (user/service management).

**Features:**
```javascript
// Get admin token
const adminToken = localStorage.getItem('adminToken');

// Fetch users
async function fetchUsers() {
  const response = await fetch('/api/admin/users', {
    headers: { 'X-Admin-Token': adminToken }
  });
  return await response.json();
}

// Create user
async function createUser(userData) {
  const response = await fetch('/api/admin/users', {
    method: 'POST',
    headers: {
      'X-Admin-Token': adminToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });
  return await response.json();
}

// Update service with image
async function updateService(serviceId, formData) {
  const response = await fetch(`/api/admin/services/${serviceId}`, {
    method: 'PUT',
    headers: { 'X-Admin-Token': adminToken },
    body: formData // multipart/form-data
  });
  return await response.json();
}
```

### 7. c5Modal.js

Modal dialogs cho 5C department details.

**Features:**
```javascript
class C5Modal {
  constructor() {
    this.modal = document.getElementById('c5-modal');
    this.setupEventListeners();
  }

  open(departmentData) {
    this.modal.querySelector('.modal-title').textContent = departmentData.title;
    this.modal.querySelector('.modal-body').innerHTML = departmentData.content;
    this.modal.classList.add('active');
  }

  close() {
    this.modal.classList.remove('active');
  }
}
```

### 8. departmentCarousel.js

Carousel cho department showcase.

**Features:**
```javascript
class DepartmentCarousel {
  constructor(container) {
    this.container = container;
    this.currentIndex = 0;
    this.autoPlayInterval = 5000;
    this.startAutoPlay();
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.items.length;
    this.updatePosition();
  }

  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.items.length) % this.items.length;
    this.updatePosition();
  }

  startAutoPlay() {
    setInterval(() => this.next(), this.autoPlayInterval);
  }
}
```

### 9. swRegister.js

Service Worker registration cho PWA support.

**Features:**
```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('Service Worker registered', reg))
    .catch(err => console.log('Service Worker registration failed', err));
}
```

## CSS Architecture

### Global Styles (main.css)

**Variables:**
```css
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --success-color: #28a745;
  --danger-color: #dc3545;
  --background: #ffffff;
  --text-color: #333333;
  --border-radius: 8px;
  --transition: all 0.3s ease;
}
```

**Themes:**
```css
body.theme-light { /* light theme colors */ }
body.theme-dark {
  --background: #1a1a1a;
  --text-color: #ffffff;
}
body.theme-blue { /* blue accent colors */ }
body.theme-green { /* green accent colors */ }
```

### Responsive Design

**Breakpoints:**
```css
/* Mobile */
@media (max-width: 576px) { }

/* Tablet */
@media (max-width: 768px) { }

/* Desktop */
@media (min-width: 992px) { }

/* Large Desktop */
@media (min-width: 1200px) { }
```

### Presentation Themes

**Professional:**
```css
.presentation-professional {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Segoe UI', Arial, sans-serif;
}
```

**Creative:**
```css
.presentation-creative {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  animation: gradient-shift 10s ease infinite;
}
```

**Projector:**
```css
.presentation-projector {
  background: #ffffff;
  color: #000000;
  font-size: 1.5em; /* Larger for readability */
}
```

## Authentication Flow

### Login Process
```javascript
// 1. User submits form
const username = document.getElementById('username').value;
const password = document.getElementById('password').value;

// 2. Send to API
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});

// 3. Store token
const data = await response.json();
localStorage.setItem('token', data.token);
localStorage.setItem('user', JSON.stringify(data.user));

// 4. Redirect
if (data.user.role === 'admin') {
  window.location.href = '/admin';
} else {
  window.location.href = '/home';
}
```

### Protected Requests
```javascript
const token = localStorage.getItem('token');

fetch('/api/orders', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

### Logout
```javascript
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}
```

## UI Components

### User Dropdown Menu
```html
<div class="user-menu">
  <button class="user-avatar">
    <img src="/img/user.png" alt="User">
    <span>Nguyễn Văn A</span>
  </button>
  <div class="dropdown">
    <a href="/profile">Thông tin cá nhân</a>
    <a href="/orders">Lịch sử đơn hàng</a>
    <a href="/schedule">Thời khóa biểu</a>
    <a href="#" onclick="logout()">Đăng xuất</a>
  </div>
</div>
```

### Service Card
```html
<div class="service-card">
  <img src="/uploads/services/parking.jpg" alt="Vé gửi xe">
  <h3>Vé gửi xe ngày</h3>
  <p class="price">5,000đ</p>
  <p class="description">Vé gửi xe một ngày cho học sinh, sinh viên</p>
  <button onclick="orderService(1)">Đặt dịch vụ</button>
</div>
```

### Modal Dialog
```html
<div class="modal" id="service-modal">
  <div class="modal-overlay" onclick="closeModal()"></div>
  <div class="modal-content">
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <h2 class="modal-title">Chi tiết dịch vụ</h2>
    <div class="modal-body">
      <!-- Service details -->
    </div>
  </div>
</div>
```

## Performance Optimization

### 1. Lazy Loading Images
```html
<img src="placeholder.jpg" data-src="actual-image.jpg" class="lazy">
```

```javascript
const lazyImages = document.querySelectorAll('.lazy');
const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      imageObserver.unobserve(img);
    }
  });
});

lazyImages.forEach(img => imageObserver.observe(img));
```

### 2. Debounce Search
```javascript
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

const searchInput = document.getElementById('search');
searchInput.addEventListener('input', debounce((e) => {
  searchServices(e.target.value);
}, 300));
```

### 3. CSS Animations với GPU
```css
.slide {
  transform: translateX(0);
  transition: transform 0.3s ease;
  will-change: transform; /* GPU acceleration */
}
```

## Browser Compatibility

### Feature Detection
```javascript
// Fullscreen API
if (document.fullscreenEnabled) {
  // Use standard API
} else if (document.webkitFullscreenEnabled) {
  // Use webkit prefix
}

// Service Worker
if ('serviceWorker' in navigator) {
  // Register service worker
}

// LocalStorage
if (typeof(Storage) !== 'undefined') {
  // Use localStorage
}
```

### Polyfills
```javascript
// Promise polyfill for older browsers
if (typeof Promise === 'undefined') {
  // Load promise polyfill
}

// Fetch polyfill
if (!window.fetch) {
  // Load fetch polyfill
}
```

## Accessibility

### ARIA Labels
```html
<button aria-label="Toggle theme" onclick="ThemeManager.cycleTheme()">
  <svg aria-hidden="true"><!-- icon --></svg>
</button>

<nav aria-label="Main navigation">
  <ul role="menubar">
    <li role="menuitem"><a href="/home">Trang chủ</a></li>
  </ul>
</nav>
```

### Keyboard Navigation
- Tab order for all interactive elements
- Enter/Space for button activation
- Arrow keys for slide navigation
- Escape to close modals

### Focus Management
```css
button:focus,
a:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.modal.active {
  /* Trap focus inside modal */
}
```

## Testing

### Manual Testing Checklist
- [ ] Login/logout flow
- [ ] Service browsing và filtering
- [ ] Order creation
- [ ] Timetable upload
- [ ] Theme switching
- [ ] Presentation mode
- [ ] Remote gestures
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility

### Browser Testing
- Chrome/Edge >= 90
- Firefox >= 88
- Safari >= 14
- Mobile Chrome (Android)
- Mobile Safari (iOS)

## Deployment

### Build Process
Frontend không cần build process - direct serving của static files.

### Production Optimization
1. **Minify CSS/JS**: Use tools like UglifyJS, cssnano
2. **Compress Images**: Use WebP format, optimize sizes
3. **Enable Gzip**: Server-side compression
4. **CDN**: Serve static assets từ CDN
5. **Cache Headers**: Set appropriate cache headers

### Cache Headers (Express)
```javascript
app.use(express.static('frontend', {
  maxAge: '1d', // Cache for 1 day
  etag: true
}));
```

## Future Enhancements

- [ ] React/Vue migration cho complex state management
- [ ] TypeScript for type safety
- [ ] Webpack/Vite for bundling
- [ ] Unit testing với Jest
- [ ] E2E testing với Cypress
- [ ] Progressive Web App enhancements
- [ ] Push notifications
- [ ] Real-time updates với WebSocket
