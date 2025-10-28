/**
 * Header Manager - Quản lý header component chung cho tất cả các trang
 */
(() => {
  'use strict';

  const sessionKey = 'ctechSession';
  const displayNameKey = 'ctechDisplayName';

  /**
   * Escape HTML để tránh XSS
   */
  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  /**
   * Chuẩn hóa tên
   */
  function normalizeNamePart(value) {
    if (!value) return '';
    const lower = value.toLocaleLowerCase('vi-VN');
    return lower.charAt(0).toLocaleUpperCase('vi-VN') + lower.slice(1);
  }

  /**
   * Lấy tên riêng từ họ tên đầy đủ
   */
  function extractGivenName(value) {
    if (!value) return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    const parts = trimmed.split(/\s+/);
    return normalizeNamePart(parts[parts.length - 1]);
  }

  /**
   * Kiểm tra xem có phải là identifier không
   */
  function isLikelyIdentifier(value) {
    if (!value) return true;
    const sample = String(value).trim();
    if (!sample) return true;
    if (/[0-9]/.test(sample)) return true;
    if (!/\s/.test(sample) && sample === sample.toUpperCase()) return true;
    return false;
  }

  /**
   * Load session từ localStorage
   */
  function loadSession() {
    try {
      const raw = localStorage.getItem(sessionKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.token) {
        return parsed;
      }
    } catch (error) {
      console.warn('Không thể đọc session từ localStorage:', error);
    }
    return null;
  }

  /**
   * Lưu session vào localStorage
   */
  function saveSession(sessionPayload) {
    if (!sessionPayload || typeof sessionPayload !== 'object') {
      localStorage.removeItem(sessionKey);
      localStorage.removeItem(displayNameKey);
      return;
    }

    try {
      localStorage.setItem(sessionKey, JSON.stringify(sessionPayload));
    } catch (error) {
      console.warn('Không thể lưu session vào localStorage:', error);
    }

    const candidate =
      (sessionPayload.user &&
        (sessionPayload.user.displayName ||
          sessionPayload.user.fullName ||
          sessionPayload.user.name ||
          sessionPayload.user.userId)) ||
      '';

    if (candidate && !isLikelyIdentifier(candidate)) {
      try {
        localStorage.setItem(displayNameKey, candidate);
      } catch (error) {
        console.warn('Không thể lưu displayName vào localStorage:', error);
      }
    } else {
      localStorage.removeItem(displayNameKey);
    }
  }

  /**
   * Xóa session
   */
  function clearSession() {
    localStorage.removeItem(sessionKey);
    localStorage.removeItem(displayNameKey);
  }

  /**
   * Lấy display name từ storage
   */
  function loadDisplayNameFromStorage(session) {
    const stored = localStorage.getItem(displayNameKey) || '';
    if (stored && !isLikelyIdentifier(stored)) {
      return stored;
    }

    if (session && session.user) {
      const fromProfile =
        session.user.fullName ||
        session.user.displayName ||
        session.user.name ||
        session.user.userId;
      if (fromProfile && !isLikelyIdentifier(fromProfile)) {
        return fromProfile;
      }
    }

    return '';
  }

  /**
   * Xử lý đăng xuất
   */
  function handleLogout() {
    clearSession();
    window.location.href = '/login';
  }

  /**
   * Ẩn một phần email
   */
  function maskEmail(email) {
    if (!email || typeof email !== 'string') return '';
    const [local, domain] = email.split('@');
    if (!domain) return email;
    const maskedLocal = local.length > 2
      ? local[0] + '*'.repeat(Math.min(local.length - 1, 5))
      : local;
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Ẩn một phần số điện thoại
   */
  function maskPhone(phone) {
    if (!phone || typeof phone !== 'string') return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 4) return phone;
    const lastDigits = cleaned.slice(-3);
    return '*'.repeat(Math.min(cleaned.length - 3, 6)) + lastDigits;
  }

  /**
   * Hiển thị modal đổi mật khẩu
   */
  function showChangePasswordModal() {
    const existingModal = document.getElementById('changePasswordModal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'changePasswordModal';
    modal.className = 'user-modal-overlay';
    modal.innerHTML = `
      <div class="user-modal">
        <div class="user-modal-header">
          <h3>Đổi mật khẩu</h3>
          <button type="button" class="user-modal-close" data-close-modal>
            <span class="material-icons">close</span>
          </button>
        </div>
        <form class="user-modal-form" data-change-password-form>
          <div class="user-form-group">
            <label for="currentPassword">Mật khẩu hiện tại</label>
            <input type="password" id="currentPassword" name="currentPassword" required autocomplete="current-password">
          </div>
          <div class="user-form-group">
            <label for="newPassword">Mật khẩu mới</label>
            <input type="password" id="newPassword" name="newPassword" required autocomplete="new-password">
          </div>
          <div class="user-form-group">
            <label for="confirmPassword">Xác nhận mật khẩu mới</label>
            <input type="password" id="confirmPassword" name="confirmPassword" required autocomplete="new-password">
          </div>
          <div class="user-modal-error" data-error-message style="display: none;"></div>
          <div class="user-modal-actions">
            <button type="button" class="user-modal-btn user-modal-btn-secondary" data-close-modal>Hủy</button>
            <button type="submit" class="user-modal-btn user-modal-btn-primary">Đổi mật khẩu</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Close modal handlers
    const closeButtons = modal.querySelectorAll('[data-close-modal]');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => modal.remove());
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    // Form submit handler
    const form = modal.querySelector('[data-change-password-form]');
    form.addEventListener('submit', handleChangePassword);

    // Focus first input
    setTimeout(() => {
      const firstInput = modal.querySelector('#currentPassword');
      if (firstInput) firstInput.focus();
    }, 100);
  }

  /**
   * Xử lý đổi mật khẩu
   */
  async function handleChangePassword(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');
    const errorDiv = form.querySelector('[data-error-message]');
    const submitBtn = form.querySelector('button[type="submit"]');

    // Validate
    if (newPassword !== confirmPassword) {
      errorDiv.textContent = 'Mật khẩu xác nhận không khớp';
      errorDiv.style.display = 'block';
      return;
    }

    if (newPassword.length < 6) {
      errorDiv.textContent = 'Mật khẩu mới phải có ít nhất 6 ký tự';
      errorDiv.style.display = 'block';
      return;
    }

    // Disable button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang xử lý...';
    errorDiv.style.display = 'none';

    try {
      const session = loadSession();
      if (!session || !session.token) {
        throw new Error('Phiên đăng nhập hết hạn');
      }

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Đổi mật khẩu thất bại');
      }

      // Success
      alert('Đổi mật khẩu thành công! Bạn sẽ được đăng xuất.');
      handleLogout();

    } catch (error) {
      errorDiv.textContent = error.message || 'Có lỗi xảy ra, vui lòng thử lại';
      errorDiv.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Đổi mật khẩu';
    }
  }

  /**
   * Cập nhật user indicator
   */
  function updateIndicator(indicator) {
    if (!indicator) return;

    const session = loadSession();
    const rawName =
      loadDisplayNameFromStorage(session) ||
      (session && session.user && (session.user.fullName || session.user.displayName || session.user.name)) ||
      '';
    const safeName = isLikelyIdentifier(rawName) ? '' : rawName;

    if (session && session.token) {
      const rawUserId = session && session.user && (session.user.userId || session.user.id);
      const displayUserId = isLikelyIdentifier(rawUserId) ? '' : String(rawUserId || '');
      const greetingName =
        extractGivenName(safeName) ||
        extractGivenName(displayUserId) ||
        normalizeNamePart(displayUserId) ||
        'bạn';

      const fullName = session.user.fullName || session.user.displayName || session.user.name || 'Người dùng';
      const email = session.user.email || '';
      const phone = session.user.phoneNumber || session.user.phone || '';
      const isAdmin = session.user && session.user.role === 'admin';

      indicator.innerHTML = `
        <div class="user-menu">
          <button type="button" class="user-menu-trigger" data-user-menu-trigger>
            <span class="material-icons">account_circle</span>
          </button>
          <div class="user-dropdown" data-user-dropdown hidden>
            <div class="user-dropdown-header">
              <div class="user-avatar">
                <span class="material-icons">person</span>
              </div>
              <div class="user-info">
                <div class="user-name">${escapeHtml(fullName)}</div>
                ${email ? `<div class="user-contact">${escapeHtml(maskEmail(email))}</div>` : ''}
                ${phone ? `<div class="user-contact">${escapeHtml(maskPhone(phone))}</div>` : ''}
              </div>
            </div>
            <div class="user-dropdown-divider"></div>
            <div class="user-dropdown-menu">
              ${isAdmin ? '<a href="/admin" class="user-dropdown-item"><span class="material-icons">admin_panel_settings</span>Admin Panel</a>' : ''}
              <button type="button" class="user-dropdown-item" data-change-password>
                <span class="material-icons">lock</span>
                Đổi mật khẩu
              </button>
              <button type="button" class="user-dropdown-item" data-logout>
                <span class="material-icons">logout</span>
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      `;

      // Setup event listeners
      const trigger = indicator.querySelector('[data-user-menu-trigger]');
      const dropdown = indicator.querySelector('[data-user-dropdown]');
      const logoutBtn = indicator.querySelector('[data-logout]');
      const changePasswordBtn = indicator.querySelector('[data-change-password]');

      if (trigger && dropdown) {
        trigger.addEventListener('click', (e) => {
          e.stopPropagation();
          const isHidden = dropdown.hasAttribute('hidden');
          dropdown.toggleAttribute('hidden', !isHidden);
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
          if (!indicator.contains(e.target)) {
            dropdown.setAttribute('hidden', '');
          }
        });
      }

      if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
      }

      if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
          dropdown.setAttribute('hidden', '');
          showChangePasswordModal();
        });
      }
    } else {
      indicator.innerHTML = '<a class="user-link" href="/login">Đăng nhập</a>';
    }
  }

  /**
   * Đồng bộ session với server
   */
  async function syncSessionWithServer(indicator) {
    const session = loadSession();
    if (!session || !session.token) return;

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${session.token}`
        }
      });

      if (response.status === 401 || response.status === 403) {
        handleLogout();
        return;
      }

      if (!response.ok) {
        throw new Error(`Unexpected status ${response.status}`);
      }

      const payload = await response.json();
      saveSession(payload);
      updateIndicator(indicator);
    } catch (error) {
      console.warn('Không thể đồng bộ thông tin người dùng:', error);
    }
  }

  /**
   * Khởi tạo header
   */
  function initHeader() {
    const indicator = document.querySelector('[data-user-indicator]');
    if (!indicator) return;

    // Cập nhật indicator ban đầu
    updateIndicator(indicator);

    // Đồng bộ với server
    const session = loadSession();
    if (session && session.token) {
      syncSessionWithServer(indicator);
    }

    // Lắng nghe storage event để sync giữa các tab
    window.addEventListener('storage', (event) => {
      if (event.key === sessionKey || event.key === displayNameKey) {
        updateIndicator(indicator);
      }
    });
  }

  /**
   * Export HeaderManager
   */
  window.HeaderManager = {
    init: initHeader,
    updateIndicator: updateIndicator,
    loadSession: loadSession,
    handleLogout: handleLogout
  };

  // Auto init khi DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeader);
  } else {
    initHeader();
  }
})();
