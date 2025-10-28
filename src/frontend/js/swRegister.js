/**
 * Service Worker Registration
 * Register and manage Service Worker for offline functionality
 */

(function() {
  'use strict';

  // Check if Service Workers are supported
  if (!('serviceWorker' in navigator)) {
    console.warn('[SW] Service Workers not supported');
    return;
  }

  // Disable Service Worker in development (localhost)
  const isDevelopment = window.location.hostname === 'localhost' ||
                        window.location.hostname === '127.0.0.1' ||
                        window.location.port === '3000';

  if (isDevelopment) {
    console.log('[SW] Development mode - Service Worker disabled');
    console.log('[SW] To enable, remove the isDevelopment check in swRegister.js');

    // Unregister any existing service workers
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
        console.log('[SW] Unregistered existing service worker');
      });
    });

    return;
  }

  // Register Service Worker when page loads
  window.addEventListener('load', () => {
    registerServiceWorker();
  });

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[SW] Registered successfully:', registration.scope);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('[SW] Update found, installing new version');

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            showUpdateNotification();
          }
        });
      });

      // Check for updates periodically (every hour)
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);

    } catch (error) {
      console.error('[SW] Registration failed:', error);
    }
  }

  function showUpdateNotification() {
    // Create update notification
    const notification = document.createElement('div');
    notification.id = 'sw-update-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #16a34a;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
      ">
        <div style="font-weight: 600; margin-bottom: 8px;">Cập nhật mới có sẵn!</div>
        <div style="font-size: 14px; margin-bottom: 12px;">Làm mới trang để cập nhật phiên bản mới.</div>
        <button onclick="window.location.reload()" style="
          background: white;
          color: #16a34a;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          margin-right: 8px;
        ">Làm mới</button>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: transparent;
          color: white;
          border: 1px solid white;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        ">Để sau</button>
      </div>
      <style>
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      </style>
    `;

    document.body.appendChild(notification);
  }

  // Expose clear cache function globally
  window.clearAppCache = async function() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const messageChannel = new MessageChannel();

      return new Promise((resolve, reject) => {
        messageChannel.port1.onmessage = (event) => {
          if (event.data.success) {
            console.log('[SW] Cache cleared successfully');
            resolve();
          } else {
            reject(new Error('Failed to clear cache'));
          }
        };

        registration.active.postMessage(
          { type: 'CLEAR_CACHE' },
          [messageChannel.port2]
        );
      });
    } catch (error) {
      console.error('[SW] Failed to clear cache:', error);
      throw error;
    }
  };

  // Monitor online/offline status
  window.addEventListener('online', () => {
    console.log('[SW] Back online');
    showOnlineNotification();
  });

  window.addEventListener('offline', () => {
    console.log('[SW] Gone offline');
    showOfflineNotification();
  });

  function showOfflineNotification() {
    const notification = document.createElement('div');
    notification.id = 'offline-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #dc2626;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideDown 0.3s ease-out;
      ">
        <span class="material-icons" style="vertical-align: middle; margin-right: 8px;">cloud_off</span>
        <span style="vertical-align: middle;">Không có kết nối internet</span>
      </div>
      <style>
        @keyframes slideDown {
          from {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
      </style>
    `;

    document.body.appendChild(notification);
  }

  function showOnlineNotification() {
    const offlineNotif = document.getElementById('offline-notification');
    if (offlineNotif) {
      offlineNotif.remove();
    }

    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #16a34a;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideDown 0.3s ease-out;
      ">
        <span class="material-icons" style="vertical-align: middle; margin-right: 8px;">cloud_done</span>
        <span style="vertical-align: middle;">Đã kết nối lại internet</span>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

})();
