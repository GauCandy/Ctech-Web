/**
 * Theme Manager - Quản lý 3 chế độ giao diện: Light, Dark, Presentation
 * Đồng bộ trên toàn bộ website và lưu preferences
 */

(function() {
  'use strict';

  const THEME_KEY = 'ctechTheme';
  const THEMES = {
    light: {
      name: 'light',
      label: 'Giao diện Sáng',
      icon: 'light_mode',
      description: 'Chế độ ban ngày'
    },
    dark: {
      name: 'dark',
      label: 'Giao diện Tối',
      icon: 'dark_mode',
      description: 'Chế độ ban đêm'
    },
    presentation: {
      name: 'presentation',
      label: 'Trình chiếu',
      icon: 'present_to_all',
      description: 'Độ tương phản cao'
    }
  };

  class ThemeManager {
    constructor() {
      this.currentTheme = this.loadTheme();
      this.listeners = [];
      this.init();
    }

    init() {
      // Apply theme on load
      this.applyTheme(this.currentTheme, false);

      // Listen for storage changes (sync across tabs)
      window.addEventListener('storage', (e) => {
        if (e.key === THEME_KEY && e.newValue) {
          this.applyTheme(e.newValue, false);
        }
      });

      // Listen for system theme changes
      if (window.matchMedia) {
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        darkModeQuery.addEventListener('change', (e) => {
          if (!localStorage.getItem(THEME_KEY)) {
            this.applyTheme(e.matches ? 'dark' : 'light', false);
          }
        });
      }
    }

    loadTheme() {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved && THEMES[saved]) {
        return saved;
      }

      // Auto-detect system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }

      return 'light';
    }

    saveTheme(theme) {
      try {
        localStorage.setItem(THEME_KEY, theme);
      } catch (e) {
        console.warn('Failed to save theme to localStorage:', e);
      }
    }

    applyTheme(theme, save = true) {
      if (!THEMES[theme]) {
        console.warn('Invalid theme:', theme);
        return;
      }

      this.currentTheme = theme;
      document.documentElement.setAttribute('data-theme', theme);

      if (save) {
        this.saveTheme(theme);
      }

      // Notify listeners
      this.notifyListeners(theme);

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('themechange', {
        detail: { theme, themeInfo: THEMES[theme] }
      }));
    }

    setTheme(theme) {
      this.applyTheme(theme, true);
    }

    getTheme() {
      return this.currentTheme;
    }

    getThemeInfo(theme) {
      return THEMES[theme || this.currentTheme];
    }

    getAllThemes() {
      return Object.values(THEMES);
    }

    cycleTheme() {
      const themeKeys = Object.keys(THEMES);
      const currentIndex = themeKeys.indexOf(this.currentTheme);
      const nextIndex = (currentIndex + 1) % themeKeys.length;
      this.setTheme(themeKeys[nextIndex]);
    }

    // Subscribe to theme changes
    subscribe(callback) {
      this.listeners.push(callback);
      return () => {
        this.listeners = this.listeners.filter(cb => cb !== callback);
      };
    }

    notifyListeners(theme) {
      this.listeners.forEach(callback => {
        try {
          callback(theme, THEMES[theme]);
        } catch (e) {
          console.error('Theme listener error:', e);
        }
      });
    }

    // Create theme toggle button
    createToggleButton(container, options = {}) {
      const {
        showLabel = true,
        showDropdown = true,
        className = ''
      } = options;

      const wrapper = document.createElement('div');
      wrapper.className = `theme-toggle ${className}`;
      wrapper.setAttribute('role', 'button');
      wrapper.setAttribute('aria-label', 'Chuyển chế độ giao diện');
      wrapper.setAttribute('tabindex', '0');

      const currentThemeInfo = this.getThemeInfo();

      wrapper.innerHTML = `
        <span class="material-icons theme-toggle__icon" aria-hidden="true">${currentThemeInfo.icon}</span>
        ${showLabel ? `<span class="theme-toggle__label">${currentThemeInfo.label}</span>` : ''}
      `;

      if (showDropdown) {
        const dropdown = document.createElement('div');
        dropdown.className = 'theme-toggle__dropdown';
        dropdown.setAttribute('role', 'menu');

        this.getAllThemes().forEach(theme => {
          const option = document.createElement('div');
          option.className = 'theme-toggle__option';
          option.setAttribute('role', 'menuitem');
          option.setAttribute('data-theme', theme.name);
          if (theme.name === this.currentTheme) {
            option.classList.add('active');
          }

          option.innerHTML = `
            <span class="material-icons theme-toggle__option-icon">${theme.icon}</span>
            <div class="theme-toggle__option-label">
              <div>${theme.label}</div>
              <div class="theme-toggle__option-description">${theme.description}</div>
            </div>
          `;

          option.addEventListener('click', (e) => {
            e.stopPropagation();
            this.setTheme(theme.name);
            dropdown.classList.remove('active');
          });

          dropdown.appendChild(option);
        });

        wrapper.appendChild(dropdown);

        // Toggle dropdown
        wrapper.addEventListener('click', (e) => {
          e.stopPropagation();
          dropdown.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
          if (!wrapper.contains(e.target)) {
            dropdown.classList.remove('active');
          }
        });

        // Keyboard support
        wrapper.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            dropdown.classList.toggle('active');
          } else if (e.key === 'Escape') {
            dropdown.classList.remove('active');
          }
        });
      } else {
        // Simple cycle through themes
        wrapper.addEventListener('click', () => {
          this.cycleTheme();
        });
      }

      // Update button on theme change
      this.subscribe((theme, themeInfo) => {
        const icon = wrapper.querySelector('.theme-toggle__icon');
        const label = wrapper.querySelector('.theme-toggle__label');
        if (icon) icon.textContent = themeInfo.icon;
        if (label) label.textContent = themeInfo.label;

        // Update active state in dropdown
        wrapper.querySelectorAll('.theme-toggle__option').forEach(opt => {
          opt.classList.toggle('active', opt.getAttribute('data-theme') === theme);
        });
      });

      if (container) {
        container.appendChild(wrapper);
      }

      return wrapper;
    }
  }

  // Create global instance
  window.ThemeManager = new ThemeManager();

  // Expose for easy access
  window.setTheme = (theme) => window.ThemeManager.setTheme(theme);
  window.getTheme = () => window.ThemeManager.getTheme();
  window.cycleTheme = () => window.ThemeManager.cycleTheme();

})();
