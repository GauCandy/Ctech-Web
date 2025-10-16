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

      indicator.innerHTML = `
        <span class="user-pill">Xin chào, <strong>${escapeHtml(greetingName)}</strong></span>
        <button type="button" class="user-logout" data-logout>Đăng xuất</button>
      `;

      const logoutBtn = indicator.querySelector('[data-logout]');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
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
