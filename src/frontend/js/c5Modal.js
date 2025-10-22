/**
 * 5C Modal - Handle modal interactions for 5C cards
 */

(function() {
  'use strict';

  // Modal data for each card
  const C5_DATA = {
    1: {
      title: 'Chất lượng giảng dạy',
      icon: 'school',
      iconClass: 'c5-card--1',
      description: 'Đội ngũ giảng viên giỏi chuyên môn, có bằng thạc sĩ, tiến sĩ và nhiều năm kinh nghiệm thực tế từ các doanh nghiệp lớn. Họ không chỉ truyền đạt kiến thức mà còn chia sẻ kinh nghiệm thực tiễn, giúp sinh viên hiểu sâu và ứng dụng vào công việc sau này.'
    },
    2: {
      title: 'Cơ sở vật chất hiện đại',
      icon: 'apartment',
      iconClass: 'c5-card--2',
      description: 'Hệ thống phòng học, phòng thí nghiệm và xưởng thực hành được trang bị thiết bị hiện đại, đạt tiêu chuẩn quốc tế. Không gian học tập rộng rãi, thoáng mát, tạo môi trường thuận lợi cho việc nghiên cứu và phát triển kỹ năng.'
    },
    3: {
      title: 'Chương trình thực tiễn',
      icon: 'work',
      iconClass: 'c5-card--3',
      description: 'Chương trình đào tạo gắn liền với thực tế doanh nghiệp, sinh viên được tiếp cận và thực hiện các dự án thực tế ngay trong quá trình học. Điều này giúp sinh viên ứng dụng kiến thức vào thực tiễn, rèn luyện kỹ năng giải quyết vấn đề và làm việc nhóm.'
    },
    4: {
      title: 'Doanh nghiệp hợp tác',
      icon: 'handshake',
      iconClass: 'c5-card--4',
      description: 'CTECH có mạng lưới liên kết rộng khắp với các tập đoàn, doanh nghiệp lớn trong và ngoài nước. Sinh viên có cơ hội thực tập tại các doanh nghiệp uy tín, tạo nền tảng vững chắc cho việc làm sau khi tốt nghiệp.'
    },
    5: {
      title: 'Hội nhập quốc tế',
      icon: 'public',
      iconClass: 'c5-card--5',
      description: 'Hợp tác đào tạo với các trường đại học và tổ chức quốc tế, chương trình liên thông giúp sinh viên có cơ hội học tập và làm việc ở nước ngoài. Môi trường đa văn hóa giúp sinh viên phát triển toàn diện và có tầm nhìn quốc tế.'
    }
  };

  let modal = null;
  let modalOverlay = null;
  let modalContainer = null;
  let isOpen = false;

  /**
   * Initialize modal functionality
   */
  function initC5Modal() {
    modal = document.getElementById('c5Modal');
    if (!modal) return;

    modalOverlay = modal.querySelector('.c5-modal__overlay');
    modalContainer = modal.querySelector('.c5-modal__container');

    // Add click handlers to all c5 cards
    const cards = document.querySelectorAll('.c5-card[data-c5-id]');
    cards.forEach(card => {
      card.addEventListener('click', handleCardClick);

      // Also support keyboard navigation
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick.call(card);
        }
      });
    });

    // Close modal handlers
    const closeButtons = modal.querySelectorAll('[data-close-modal]');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', closeModal);
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeModal();
      }
    });

    // Prevent body scroll when modal is open
    modal.addEventListener('transitionend', () => {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });
  }

  /**
   * Handle card click event
   */
  function handleCardClick(e) {
    const card = this;
    const cardId = card.dataset.c5Id;

    if (!cardId || !C5_DATA[cardId]) return;

    openModal(cardId);
  }

  /**
   * Fetch images for a 5C category
   */
  async function fetchC5Images(cardId) {
    try {
      const response = await fetch(`/api/services/5c-images/${cardId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }
      const data = await response.json();
      return data.images || [];
    } catch (error) {
      console.error('Error fetching 5C images:', error);
      return [];
    }
  }

  /**
   * Open modal with card data
   */
  async function openModal(cardId) {
    const data = C5_DATA[cardId];
    if (!data) return;

    // Update modal content
    const modalIcon = document.getElementById('modalIcon');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    const modalGallery = document.getElementById('modalGallery');

    // Set icon
    modalIcon.innerHTML = `<span class="material-icons">${data.icon}</span>`;
    modalIcon.className = 'c5-modal__icon ' + data.iconClass;

    // Set title and description
    modalTitle.textContent = data.title;
    modalDescription.textContent = data.description;

    // Show modal first (before loading images)
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('is-open');
    isOpen = true;

    // Show loading state
    modalGallery.innerHTML = '<div class="c5-modal__loading">Đang tải hình ảnh...</div>';

    // Fetch images from API
    const images = await fetchC5Images(cardId);

    // Clear loading state
    modalGallery.innerHTML = '';

    // Set gallery layout class based on number of images
    modalGallery.className = 'c5-modal__gallery';
    if (images.length === 1) {
      modalGallery.classList.add('c5-modal__gallery--single');
    } else if (images.length === 2) {
      modalGallery.classList.add('c5-modal__gallery--dual');
    } else if (images.length === 3) {
      modalGallery.classList.add('c5-modal__gallery--triple');
    } else if (images.length === 4) {
      modalGallery.classList.add('c5-modal__gallery--quad');
    } else if (images.length >= 5) {
      modalGallery.classList.add('c5-modal__gallery--many');
    }

    // Render images
    const maxDisplay = images.length >= 5 ? 4 : images.length;
    for (let i = 0; i < maxDisplay; i++) {
      const imagePath = images[i];

      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'c5-modal__image-wrapper';

      const img = document.createElement('img');
      img.src = imagePath;
      img.alt = `${data.title} - Hình ${i + 1}`;
      img.className = 'c5-modal__image';

      // Handle image load error
      img.onerror = function() {
        imgWrapper.style.display = 'none';
      };

      imgWrapper.appendChild(img);

      // For 5+ images, add overlay on last image
      if (images.length >= 5 && i === 3) {
        const overlay = document.createElement('div');
        overlay.className = 'c5-modal__image-overlay';
        overlay.textContent = `+${images.length - 4}`;
        imgWrapper.appendChild(overlay);
      }

      modalGallery.appendChild(imgWrapper);
    }

    // If no images, show message
    if (images.length === 0) {
      modalGallery.innerHTML = '<div class="c5-modal__no-images">Chưa có hình ảnh</div>';
    }

    // Focus close button for accessibility
    setTimeout(() => {
      const closeBtn = modal.querySelector('.c5-modal__close');
      if (closeBtn) closeBtn.focus();
    }, 300);
  }

  /**
   * Close modal
   */
  function closeModal() {
    if (!modal || !isOpen) return;

    modal.setAttribute('aria-hidden', 'true');
    modal.classList.remove('is-open');
    isOpen = false;
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initC5Modal);
  } else {
    initC5Modal();
  }
})();
