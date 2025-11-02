// ============================================
// SCHEDULE MANAGER - Quản lý nhiều thời khóa biểu (Simplified)
// ============================================

class ScheduleManager {
  constructor() {
    this.savedSchedules = this.loadFromLocalStorage();
    this.currentScheduleId = null;
    this.currentScheduleData = null;
    this.isServerAvailable = true;
    this.serverCheckInterval = null;
    this.hasCheckedServerOnce = false;
    this.isUploading = false;
    this.uploadSuccessTimestamp = null;
    this.isSharedScheduleLoaded = false;
    this.viewingSharedSchedule = false; // Track if viewing a shared (not saved) schedule
    this.sharedScheduleTitle = null; // Title of the shared schedule being viewed

    this.initElements();
    this.initEventListeners();
    this.migrateOldData(); // Add contentHash to old schedules
    this.initServerMonitoring();
    this.renderScheduleDropdown();
    this.checkForSharedSchedule();
    this.initializeWithSavedSchedules();
  }

  initElements() {
    // Upload elements
    this.uploadForm = document.getElementById('upload-form');
    this.pdfFileInput = document.getElementById('pdf-file');
    this.uploadStatus = document.getElementById('upload-status');
    this.uploadSection = document.querySelector('.upload-section');

    // Selector elements
    this.scheduleSelect = document.getElementById('schedule-select');
    this.savedCount = document.getElementById('saved-count-inline');
    this.shareAllBtn = document.getElementById('share-all-btn');
    this.deleteCurrentBtn = document.getElementById('delete-current-btn');
    this.saveSharedBtn = document.getElementById('save-shared-btn');
    this.clearAllBtn = document.getElementById('clear-all-btn');

    // Schedule container elements
    this.scheduleContainer = document.getElementById('schedule-container');
    this.scheduleClassName = document.getElementById('schedule-class-name');
    this.weekSelect = document.getElementById('week-select');
    this.scheduleView = document.getElementById('schedule-view');
    this.scheduleMeta = document.getElementById('schedule-meta');
    this.uploadAnotherBtn = document.getElementById('upload-another-btn');

    // Share elements
    this.shareBtn = document.getElementById('share-btn');
    this.shareModal = document.getElementById('share-modal');
    this.closeShareModal = document.getElementById('close-share-modal');
    this.shareLinkInput = document.getElementById('share-link-input');
    this.copyLinkBtn = document.getElementById('copy-link-btn');
    this.copyStatus = document.getElementById('copy-status');

    // Share all elements
    this.shareAllModal = document.getElementById('share-all-modal');
    this.closeShareAllModal = document.getElementById('close-share-all-modal');
    this.shareAllCount = document.getElementById('share-all-count');
    this.shareAllProgress = document.getElementById('share-all-progress');
    this.shareAllResults = document.getElementById('share-all-results');
    this.shareAllLinks = document.getElementById('share-all-links');
    this.copyAllLinksBtn = document.getElementById('copy-all-links-btn');

    // Constants
    this.daysMap = {
      'Thu 2': 'Thứ 2',
      'Thu 3': 'Thứ 3',
      'Thu 4': 'Thứ 4',
      'Thu 5': 'Thứ 5',
      'Thu 6': 'Thứ 6',
      'Thu 7': 'Thứ 7',
      'CN': 'Chủ nhật'
    };
    this.daysOrder = ['Thu 2', 'Thu 3', 'Thu 4', 'Thu 5', 'Thu 6', 'Thu 7', 'CN'];
    this.sessionsOrder = ['Sáng', 'Chiều', 'Tối'];
  }

  initEventListeners() {
    // File input change - Upload nhiều files
    this.pdfFileInput?.addEventListener('change', (e) => this.handleFilesSelected(e));

    // Upload form submit
    this.uploadForm?.addEventListener('submit', (e) => this.handleUploadSubmit(e));

    // Upload another button
    this.uploadAnotherBtn?.addEventListener('click', () => this.showUploadSection());

    // Week select change
    this.weekSelect?.addEventListener('change', () => this.renderSchedule());

    // Schedule select change
    this.scheduleSelect?.addEventListener('change', (e) => this.handleScheduleSelect(e.target.value));

    // Share all button
    this.shareAllBtn?.addEventListener('click', () => this.handleShareAll());

    // Delete current button
    this.deleteCurrentBtn?.addEventListener('click', () => this.handleDeleteCurrent());

    // Save shared button
    this.saveSharedBtn?.addEventListener('click', () => this.handleSaveShared());

    // Clear all button
    this.clearAllBtn?.addEventListener('click', () => this.handleClearAll());

    // Share button
    this.shareBtn?.addEventListener('click', () => this.handleShare());

    // Close share modal
    this.closeShareModal?.addEventListener('click', () => this.closeModal(this.shareModal));
    this.shareModal?.addEventListener('click', (e) => {
      if (e.target === this.shareModal) this.closeModal(this.shareModal);
    });

    // Copy link button
    this.copyLinkBtn?.addEventListener('click', () => this.handleCopyLink());

    // Close share all modal
    this.closeShareAllModal?.addEventListener('click', () => this.closeModal(this.shareAllModal));
    this.shareAllModal?.addEventListener('click', (e) => {
      if (e.target === this.shareAllModal) this.closeModal(this.shareAllModal);
    });

    // Copy all links button
    this.copyAllLinksBtn?.addEventListener('click', () => this.handleCopyAllLinks());

    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!this.shareModal.hidden) this.closeModal(this.shareModal);
        if (!this.shareAllModal.hidden) this.closeModal(this.shareAllModal);
      }
    });
  }

  // ============================================
  // UPLOAD FUNCTIONS
  // ============================================

  async handleFilesSelected(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Auto upload
    await this.uploadMultipleFiles(files);
  }

  async handleUploadSubmit(e) {
    e.preventDefault();
    const files = Array.from(this.pdfFileInput.files);
    await this.uploadMultipleFiles(files);
  }

  async uploadMultipleFiles(files) {
    if (files.length === 0) return;

    // Clear shared schedule state if uploading new files
    this.isSharedScheduleLoaded = false;
    this.viewingSharedSchedule = false;

    this.isUploading = true;
    this.uploadStatus.innerHTML = `<div class="status-loading"><span class="material-icons spinning">sync</span> Đang xử lý ${files.length} file(s)...</div>`;

    let successCount = 0;
    let errorCount = 0;
    let duplicateCount = 0;
    let lastUploadedId = null;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        this.uploadStatus.innerHTML = `<div class="status-loading"><span class="material-icons spinning">sync</span> Đang xử lý ${i + 1}/${files.length}: ${file.name}...</div>`;

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/timetable/parse', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const scheduleData = await response.json();

        // Lưu vào localStorage và lấy ID + duplicate status
        const result = this.saveSchedule(file.name, scheduleData);

        if (result.isDuplicate) {
          duplicateCount++;
        } else {
          successCount++;
        }

        lastUploadedId = result.id; // Track last uploaded/found

      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        errorCount++;
      }
    }

    // Mark upload as completed
    this.isUploading = false;
    this.uploadSuccessTimestamp = Date.now();

    // Show results
    let statusMessage = '';
    if (errorCount === 0 && duplicateCount === 0) {
      statusMessage = `<div class="status-success"><span class="material-icons">check_circle</span> Tải lên thành công ${successCount} file(s)!</div>`;
    } else if (errorCount === 0 && duplicateCount > 0) {
      statusMessage = `<div class="status-warning"><span class="material-icons">info</span> Thành công: ${successCount}, Trùng lặp: ${duplicateCount}</div>`;
    } else {
      statusMessage = `<div class="status-warning"><span class="material-icons">warning</span> Thành công: ${successCount}, Trùng: ${duplicateCount}, Lỗi: ${errorCount}</div>`;
    }
    this.uploadStatus.innerHTML = statusMessage;

    // Auto-clear upload success message after 5 seconds
    const currentTimestamp = this.uploadSuccessTimestamp;
    setTimeout(() => {
      if (this.uploadSuccessTimestamp === currentTimestamp && !this.isUploading) {
        // Safe to update with server status now
        this.uploadSuccessTimestamp = null;
        this.updateOfflineNotification(false);
      }
    }, 5000);

    // Refresh dropdown
    this.renderScheduleDropdown();

    // Show schedule container and hide upload section immediately after upload
    if (successCount > 0) {
      this.scheduleContainer.hidden = false;
      this.uploadSection.style.display = 'none';

      // Auto-select the last uploaded schedule
      if (lastUploadedId) {
        this.scheduleSelect.value = lastUploadedId;
        this.handleScheduleSelect(lastUploadedId);
      }

      // Clear file input
      this.pdfFileInput.value = '';
    }
  }

  showUploadSection() {
    // Trigger file picker directly instead of showing upload section
    this.pdfFileInput.value = '';
    this.pdfFileInput.click();
  }

  // ============================================
  // LOCALSTORAGE FUNCTIONS
  // ============================================

  loadFromLocalStorage() {
    try {
      const data = localStorage.getItem('savedSchedules');
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return {};
    }
  }

  migrateOldData() {
    // Add contentHash to old schedules that don't have it
    let needsSave = false;
    Object.values(this.savedSchedules).forEach(schedule => {
      if (!schedule.contentHash && schedule.scheduleData) {
        schedule.contentHash = this.hashScheduleData(schedule.scheduleData);
        needsSave = true;
      }
    });

    if (needsSave) {
      this.saveToLocalStorage();
      console.log('Migrated old schedules with content hash');
    }
  }

  saveToLocalStorage() {
    try {
      localStorage.setItem('savedSchedules', JSON.stringify(this.savedSchedules));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  saveSchedule(fileName, scheduleData) {
    // Create content hash to detect duplicates
    const contentHash = this.hashScheduleData(scheduleData);

    // Check if we already have a schedule with the same content
    const existingSchedule = Object.values(this.savedSchedules).find(s =>
      s.contentHash === contentHash
    );

    if (existingSchedule) {
      // Schedule with identical content already exists
      // Update the filename to the new one
      console.log(`Duplicate content detected. Updating "${existingSchedule.fileName}" -> "${fileName}"`);
      existingSchedule.fileName = fileName;
      this.saveToLocalStorage();
      return { id: existingSchedule.id, isDuplicate: true };
    }

    const id = this.generateScheduleId();
    const shareCode = this.generateShareCode();

    // Handle duplicate file names
    const uniqueFileName = this.getUniqueFileName(fileName);

    this.savedSchedules[id] = {
      id,
      fileName: uniqueFileName,
      scheduleData,
      shareCode,
      contentHash, // Store hash for duplicate detection
      isPublic: false, // Not public until user clicks share
      createdAt: new Date().toISOString()
    };
    this.saveToLocalStorage();
    return { id, isDuplicate: false }; // Return ID and status
  }

  hashScheduleData(scheduleData) {
    // Create a simple hash from schedule data JSON
    const jsonString = JSON.stringify(scheduleData);
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  getUniqueFileName(fileName) {
    const existingNames = Object.values(this.savedSchedules).map(s => s.fileName);

    if (!existingNames.includes(fileName)) {
      return fileName;
    }

    // Extract base name and extension
    const lastDot = fileName.lastIndexOf('.');
    const baseName = lastDot > 0 ? fileName.substring(0, lastDot) : fileName;
    const extension = lastDot > 0 ? fileName.substring(lastDot) : '';

    // Find next available number
    let counter = 2;
    let newName = `${baseName} (${counter})${extension}`;

    while (existingNames.includes(newName)) {
      counter++;
      newName = `${baseName} (${counter})${extension}`;
    }

    return newName;
  }

  generateShareCode() {
    // Generate a unique 8-character share code
    return Math.random().toString(36).substring(2, 10);
  }

  deleteSchedule(id) {
    delete this.savedSchedules[id];
    this.saveToLocalStorage();

    // Clear last viewed if it was this schedule
    if (localStorage.getItem('lastViewedScheduleId') === id) {
      localStorage.removeItem('lastViewedScheduleId');
    }

    this.renderScheduleDropdown();

    // If current schedule is deleted, reset view
    if (this.currentScheduleId === id) {
      this.scheduleSelect.value = '';
      this.handleScheduleSelect('');
    }

    // If no schedules left, show upload section
    if (Object.keys(this.savedSchedules).length === 0) {
      this.uploadSection.style.display = 'flex';
      this.scheduleContainer.hidden = true;
    }
  }

  clearAllSchedules() {
    if (!confirm('Bạn có chắc chắn muốn xóa tất cả thời khóa biểu đã lưu?')) {
      return;
    }
    this.savedSchedules = {};
    this.saveToLocalStorage();
    localStorage.removeItem('lastViewedScheduleId');
    this.renderScheduleDropdown();
    this.scheduleSelect.value = '';
    this.handleScheduleSelect('');

    // Clear URL parameters
    window.history.replaceState({}, '', window.location.pathname);

    // Reset shared schedule state
    this.viewingSharedSchedule = false;
    this.isSharedScheduleLoaded = false;
    this.currentScheduleId = null;
    this.currentScheduleData = null;

    // Show upload section again since no schedules left
    this.uploadSection.style.display = 'flex';
    this.scheduleContainer.hidden = true;
  }

  generateScheduleId() {
    return 'sch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // ============================================
  // RENDER SCHEDULE DROPDOWN
  // ============================================

  renderScheduleDropdown() {
    const schedules = Object.values(this.savedSchedules);

    // Update count in option text
    const countText = schedules.length;

    // Show/hide dropdown
    if (schedules.length === 0) {
      this.scheduleSelect.hidden = true;
      this.shareAllBtn.hidden = true;
      this.clearAllBtn.hidden = true;
      return;
    }

    this.scheduleSelect.hidden = false;
    this.shareAllBtn.hidden = false;
    this.clearAllBtn.hidden = false;

    // Populate dropdown
    this.scheduleSelect.innerHTML = `<option value="">-- Chọn thời khóa biểu (${countText}) --</option>`;

    // Sort by name
    schedules.sort((a, b) => a.fileName.localeCompare(b.fileName));

    schedules.forEach(schedule => {
      const option = document.createElement('option');
      option.value = schedule.id;
      option.textContent = schedule.fileName.replace('.pdf', '');
      if (schedule.id === this.currentScheduleId) {
        option.selected = true;
      }
      this.scheduleSelect.appendChild(option);
    });
  }

  handleScheduleSelect(id) {
    if (!id) {
      this.scheduleView.innerHTML = `
        <div class="schedule-empty">
          <span class="material-icons">event_busy</span>
          <p>Chọn thời khóa biểu và tuần để xem lịch</p>
        </div>
      `;
      this.weekSelect.innerHTML = '<option value="">Chọn tuần...</option>';
      this.deleteCurrentBtn.hidden = true;
      this.saveSharedBtn.hidden = true;
      this.currentScheduleId = null;
      this.currentScheduleData = null;
      return;
    }

    this.viewSchedule(id);
  }

  // ============================================
  // VIEW SCHEDULE
  // ============================================

  viewSchedule(id) {
    const schedule = this.savedSchedules[id];
    if (!schedule) return;

    this.currentScheduleId = id;
    this.currentScheduleData = schedule.scheduleData;
    this.viewingSharedSchedule = false; // Reset flag when viewing owned schedule

    // Save last viewed schedule for next visit
    localStorage.setItem('lastViewedScheduleId', id);

    // Update URL with share code (but not public yet)
    if (schedule.shareCode) {
      const newUrl = `${window.location.pathname}?share=${schedule.shareCode}`;
      window.history.replaceState({ scheduleId: id }, '', newUrl);
    }

    this.populateDropdowns();

    // Show delete button, hide save button for owned schedules
    this.deleteCurrentBtn.hidden = false;
    this.saveSharedBtn.hidden = true;

    this.scheduleView.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ============================================
  // POPULATE DROPDOWNS AND RENDER SCHEDULE
  // ============================================

  populateDropdowns() {
    if (!this.currentScheduleData || !this.currentScheduleData.metadata) {
      return;
    }

    const metadata = this.currentScheduleData.metadata;
    const weekRange = metadata.weekRange || {};
    const startWeek = weekRange.start || 1;
    const endWeek = weekRange.end || 16;

    // Populate week select
    this.weekSelect.innerHTML = '<option value="">Chọn tuần...</option>';
    for (let week = startWeek; week <= endWeek; week++) {
      const option = document.createElement('option');
      option.value = week;
      option.textContent = `Tuần ${week}`;
      this.weekSelect.appendChild(option);
    }

    // Determine default week
    const currentWeek = metadata.currentWeek || startWeek;
    if (currentWeek >= startWeek && currentWeek <= endWeek) {
      this.weekSelect.value = currentWeek;
    } else {
      this.weekSelect.value = startWeek;
    }

    // Render schedule
    this.renderSchedule();
  }

  renderSchedule() {
    const selectedWeek = parseInt(this.weekSelect.value, 10);
    if (!selectedWeek || !this.currentScheduleData) {
      this.scheduleView.innerHTML = `
        <div class="schedule-empty">
          <span class="material-icons">event_busy</span>
          <p>Chọn tuần để xem thời khóa biểu</p>
        </div>
      `;
      return;
    }

    // Build schedule grid
    const scheduleGrid = {};
    this.daysOrder.forEach(day => {
      scheduleGrid[day] = {};
      this.sessionsOrder.forEach(session => {
        scheduleGrid[day][session] = [];
      });
    });

    // Collect all subjects
    const sheets = this.currentScheduleData.sheets || {};
    Object.values(sheets).forEach(sheet => {
      Object.values(sheet).forEach(subjectList => {
        subjectList.forEach(subject => {
          // Check if subject is in selected week
          if (subject.weekStart <= selectedWeek && subject.weekEnd >= selectedWeek) {
            // Check if not in weeksOff
            if (subject.weeksOff && subject.weeksOff.includes(selectedWeek)) {
              return;
            }

            const day = subject.day;
            const session = subject.session;

            if (scheduleGrid[day] && scheduleGrid[day][session]) {
              scheduleGrid[day][session].push(subject);
            }
          }
        });
      });
    });

    // Render HTML
    let html = '<div class="schedule-grid">';

    // Header row
    html += '<div class="schedule-row schedule-row-header">';
    html += '<div class="schedule-cell schedule-cell-header schedule-cell-session">Buổi</div>';
    this.daysOrder.forEach(day => {
      html += `<div class="schedule-cell schedule-cell-header">${this.daysMap[day] || day}</div>`;
    });
    html += '</div>';

    // Rows for each session
    this.sessionsOrder.forEach(session => {
      html += '<div class="schedule-row">';
      html += `<div class="schedule-cell schedule-cell-session"><strong>${session}</strong></div>`;

      this.daysOrder.forEach(day => {
        const subjects = scheduleGrid[day][session];
        html += '<div class="schedule-cell">';

        if (subjects.length > 0) {
          subjects.forEach(subject => {
            const room = subject.room ||
              (subject.roomAssignments && subject.roomAssignments.find(r =>
                selectedWeek >= r.weekStart && selectedWeek <= r.weekEnd
              )?.room) || 'Chưa xác định';

            const periodsToday = this.getPeriodsForDay(subject, selectedWeek);
            const totalHours = subject.hours || 0;

            html += `
              <div class="subject-block">
                <div class="subject-block-header">
                  <span class="subject-code-small">${this.escapeHtml(subject.subjectCode || '')}</span>
                  <span class="subject-periods-badge">${periodsToday} tiết</span>
                </div>
                <div class="subject-name-small">${this.escapeHtml(subject.subjectName || 'Không rõ')}</div>
                <div class="subject-info-small">
                  <div><span class="material-icons icon-tiny">person</span>${this.escapeHtml(subject.teacher || 'N/A')}</div>
                  <div><span class="material-icons icon-tiny">room</span>${this.escapeHtml(room)}</div>
                  <div><span class="material-icons icon-tiny">schedule</span>Tổng: ${totalHours} tiết</div>
                </div>
              </div>
            `;
          });
        }

        html += '</div>';
      });

      html += '</div>';
    });

    html += '</div>';
    this.scheduleView.innerHTML = html;
  }

  getPeriodsForDay(subject, week) {
    if (subject.weekPeriods && subject.weekPeriods.length > 0) {
      const wp = subject.weekPeriods.find(w => w.week === week);
      if (wp && wp.periods) {
        return wp.periods;
      }
    }
    return subject.periods || 0;
  }

  // ============================================
  // SHARE FUNCTIONS
  // ============================================

  async handleShare() {
    if (!this.currentScheduleData || !this.currentScheduleId) {
      alert('Không có dữ liệu thời khóa biểu để chia sẻ.');
      return;
    }

    const schedule = this.savedSchedules[this.currentScheduleId];
    if (!schedule) return;

    // Use existing share code and mark as public
    const title = schedule.fileName.replace('.pdf', '');
    const shareCode = schedule.shareCode;

    await this.publishShareLink(shareCode, schedule.scheduleData, title);
  }

  async publishShareLink(shareCode, scheduleData, title) {
    try {
      this.shareBtn.disabled = true;
      this.shareBtn.innerHTML = '<span class="material-icons spinning">sync</span> Đang chia sẻ...';

      const response = await fetch('/api/timetable/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shareCode: shareCode,  // Send existing share code
          timetableData: scheduleData,
          title: title
        })
      });

      if (!response.ok) {
        throw new Error('Không thể chia sẻ');
      }

      // Mark as public in localStorage
      if (this.currentScheduleId && this.savedSchedules[this.currentScheduleId]) {
        this.savedSchedules[this.currentScheduleId].isPublic = true;
        this.saveToLocalStorage();
      }

      const fullUrl = window.location.origin + window.location.pathname + '?share=' + shareCode;

      // Show modal with share link
      this.shareLinkInput.value = fullUrl;
      this.openModal(this.shareModal);

    } catch (error) {
      console.error('Share error:', error);
      alert('Có lỗi xảy ra khi chia sẻ. Vui lòng thử lại.');
    } finally {
      this.shareBtn.disabled = false;
      this.shareBtn.innerHTML = '<span class="material-icons">share</span> Chia sẻ';
    }
  }

  async createShareLink(scheduleData, title) {
    try {
      this.shareBtn.disabled = true;
      this.shareBtn.innerHTML = '<span class="material-icons spinning">sync</span> Đang tạo...';

      const response = await fetch('/api/timetable/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timetableData: scheduleData,
          title: title
        })
      });

      if (!response.ok) {
        throw new Error('Không thể tạo link share');
      }

      const result = await response.json();
      const fullUrl = window.location.origin + result.shareUrl;

      // Show modal with share link
      this.shareLinkInput.value = fullUrl;
      this.openModal(this.shareModal);

    } catch (error) {
      console.error('Share error:', error);
      alert('Có lỗi xảy ra khi tạo link chia sẻ. Vui lòng thử lại.');
    } finally {
      this.shareBtn.disabled = false;
      this.shareBtn.innerHTML = '<span class="material-icons">share</span> Chia sẻ';
    }
  }

  async handleCopyLink() {
    try {
      await navigator.clipboard.writeText(this.shareLinkInput.value);
      this.copyStatus.innerHTML = '<div class="copy-success"><span class="material-icons">check_circle</span> Đã sao chép link!</div>';
      setTimeout(() => {
        this.copyStatus.innerHTML = '';
      }, 3000);
    } catch (error) {
      // Fallback
      this.shareLinkInput.select();
      document.execCommand('copy');
      this.copyStatus.innerHTML = '<div class="copy-success"><span class="material-icons">check_circle</span> Đã sao chép link!</div>';
      setTimeout(() => {
        this.copyStatus.innerHTML = '';
      }, 3000);
    }
  }

  // ============================================
  // SHARE ALL
  // ============================================

  async handleShareAll() {
    const schedules = Object.values(this.savedSchedules);
    if (schedules.length === 0) {
      alert('Không có thời khóa biểu nào để chia sẻ.');
      return;
    }

    this.shareAllCount.textContent = schedules.length;
    this.shareAllProgress.innerHTML = '';
    this.shareAllResults.hidden = true;
    this.shareAllLinks.innerHTML = '';
    this.openModal(this.shareAllModal);

    const results = [];

    for (let i = 0; i < schedules.length; i++) {
      const schedule = schedules[i];

      this.shareAllProgress.innerHTML = `
        <div class="progress-item">
          <span class="material-icons spinning">sync</span>
          Đang tạo link ${i + 1}/${schedules.length}: ${this.escapeHtml(schedule.fileName)}...
        </div>
      `;

      try {
        const response = await fetch('/api/timetable/share', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            timetableData: schedule.scheduleData,
            title: schedule.fileName.replace('.pdf', '')
          })
        });

        if (!response.ok) {
          throw new Error('Failed');
        }

        const result = await response.json();
        const fullUrl = window.location.origin + result.shareUrl;

        results.push({
          fileName: schedule.fileName,
          url: fullUrl,
          success: true
        });

      } catch (error) {
        console.error(`Error sharing ${schedule.fileName}:`, error);
        results.push({
          fileName: schedule.fileName,
          success: false
        });
      }
    }

    // Show results
    this.shareAllProgress.hidden = true;
    this.shareAllResults.hidden = false;

    let html = '';
    results.forEach(result => {
      if (result.success) {
        html += `
          <div class="share-link-item">
            <div class="share-link-item-name">${this.escapeHtml(result.fileName)}</div>
            <div class="share-link-item-url">
              <input type="text" value="${result.url}" readonly class="share-link-input-small">
              <button type="button" class="btn-copy-small" data-url="${result.url}">
                <span class="material-icons">content_copy</span>
              </button>
            </div>
          </div>
        `;
      } else {
        html += `
          <div class="share-link-item share-link-item-error">
            <div class="share-link-item-name">${this.escapeHtml(result.fileName)}</div>
            <div class="share-link-item-error-msg">
              <span class="material-icons">error</span> Lỗi
            </div>
          </div>
        `;
      }
    });

    this.shareAllLinks.innerHTML = html;

    // Add copy event listeners
    this.shareAllLinks.querySelectorAll('.btn-copy-small').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const url = e.currentTarget.dataset.url;
        try {
          await navigator.clipboard.writeText(url);
          e.currentTarget.innerHTML = '<span class="material-icons">check</span>';
          setTimeout(() => {
            e.currentTarget.innerHTML = '<span class="material-icons">content_copy</span>';
          }, 2000);
        } catch (error) {
          console.error('Copy error:', error);
        }
      });
    });
  }

  async handleCopyAllLinks() {
    const inputs = this.shareAllLinks.querySelectorAll('.share-link-input-small');
    const urls = Array.from(inputs).map(input => input.value);
    const text = urls.join('\n');

    try {
      await navigator.clipboard.writeText(text);
      this.copyAllLinksBtn.innerHTML = '<span class="material-icons">check_circle</span> Đã sao chép!';
      setTimeout(() => {
        this.copyAllLinksBtn.innerHTML = '<span class="material-icons">content_copy</span> Sao chép tất cả link';
      }, 3000);
    } catch (error) {
      console.error('Copy error:', error);
    }
  }

  handleDeleteCurrent() {
    if (!this.currentScheduleId) return;

    const schedule = this.savedSchedules[this.currentScheduleId];
    if (confirm(`Xóa thời khóa biểu "${schedule.fileName}"?`)) {
      this.deleteSchedule(this.currentScheduleId);
    }
  }

  handleSaveShared() {
    if (!this.viewingSharedSchedule || !this.currentScheduleData) {
      return;
    }

    // Get share code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const shareCode = urlParams.get('share');

    // Create filename from title
    const fileName = this.sharedScheduleTitle + '.pdf';

    // Save to localStorage
    const result = this.saveSchedule(fileName, this.currentScheduleData);
    const scheduleId = result.id;

    // Update the saved schedule with the share code and mark as public
    if (this.savedSchedules[scheduleId]) {
      this.savedSchedules[scheduleId].shareCode = shareCode;
      this.savedSchedules[scheduleId].isPublic = true;
      this.saveToLocalStorage();
    }

    // Reset viewing state
    this.viewingSharedSchedule = false;
    this.isSharedScheduleLoaded = false;

    // Refresh UI
    this.renderScheduleDropdown();
    this.scheduleSelect.value = scheduleId;
    this.handleScheduleSelect(scheduleId);

    // Show success message
    this.uploadStatus.innerHTML = '<div class="status-success"><span class="material-icons">check_circle</span> Đã lưu thời khóa biểu!</div>';
    setTimeout(() => {
      this.uploadStatus.innerHTML = '';
    }, 3000);

    // Show normal controls
    this.scheduleSelect.hidden = false;
    this.shareAllBtn.hidden = false;
    this.clearAllBtn.hidden = false;
    this.saveSharedBtn.hidden = true;
  }

  handleClearAll() {
    this.clearAllSchedules();
  }

  // ============================================
  // MODAL FUNCTIONS
  // ============================================

  openModal(modal) {
    modal.hidden = false;
    modal.classList.add('modal-visible');
    document.body.style.overflow = 'hidden';
  }

  closeModal(modal) {
    modal.hidden = true;
    modal.classList.remove('modal-visible');
    document.body.style.overflow = '';
    if (modal === this.shareModal) {
      this.copyStatus.innerHTML = '';
    }
  }

  // ============================================
  // CHECK FOR SHARED SCHEDULE
  // ============================================

  async checkForSharedSchedule() {
    const urlParams = new URLSearchParams(window.location.search);
    const shareCode = urlParams.get('share');

    if (!shareCode) return;

    // Check if we already have this schedule saved locally
    const localSchedule = Object.values(this.savedSchedules).find(s => s.shareCode === shareCode);
    if (localSchedule) {
      // Already saved, just view it normally
      this.viewingSharedSchedule = false;
      return;
    }

    try {
      this.uploadStatus.innerHTML = '<div class="status-loading"><span class="material-icons spinning">sync</span> Đang tải thời khóa biểu được chia sẻ...</div>';

      const response = await fetch(`/api/timetable/share/${shareCode}`);

      if (!response.ok) {
        throw new Error('Không tìm thấy thời khóa biểu');
      }

      const result = await response.json();
      this.currentScheduleData = result.data;
      this.sharedScheduleTitle = result.title || 'Thời khóa biểu được chia sẻ';
      this.isSharedScheduleLoaded = true;
      this.viewingSharedSchedule = true; // Mark as viewing shared (not saved)

      // Don't show success message if user already has schedules
      const hasSchedules = Object.keys(this.savedSchedules).length > 0;
      if (!hasSchedules) {
        this.uploadStatus.innerHTML = '<div class="status-success"><span class="material-icons">check_circle</span> Đã tải thời khóa biểu được chia sẻ!</div>';

        // Auto-clear shared schedule success message after 5 seconds
        setTimeout(() => {
          if (this.isSharedScheduleLoaded) {
            this.uploadStatus.innerHTML = '';
          }
        }, 5000);
      } else {
        // Clear any existing messages
        this.uploadStatus.innerHTML = '';
      }

      this.populateDropdowns();
      this.scheduleContainer.hidden = false;
      this.uploadSection.style.display = 'none';

      // Show Save button, hide Delete button for shared schedules
      this.deleteCurrentBtn.hidden = true;
      this.saveSharedBtn.hidden = false;
      this.scheduleSelect.hidden = true; // Hide dropdown when viewing shared
      this.shareAllBtn.hidden = true; // Hide share all
      this.clearAllBtn.hidden = true; // Hide clear all

    } catch (error) {
      console.error('Load shared timetable error:', error);
      this.uploadStatus.innerHTML = '<div class="status-error"><span class="material-icons">error</span> Không thể tải thời khóa biểu được chia sẻ.</div>';
    }
  }

  // ============================================
  // INITIALIZE WITH SAVED SCHEDULES
  // ============================================

  initializeWithSavedSchedules() {
    // Skip if shared schedule is being loaded
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('share')) {
      return; // checkForSharedSchedule() will handle it
    }

    const schedules = Object.values(this.savedSchedules);

    // If no saved schedules, show upload section
    if (schedules.length === 0) {
      this.uploadSection.style.display = 'flex';
      this.scheduleContainer.hidden = true;
      // Server monitoring will update the message
      return;
    }

    // Has saved schedules - show them instead of upload section
    this.uploadSection.style.display = 'none';
    this.scheduleContainer.hidden = false;

    // Server monitoring will handle status messages

    // Try to restore last viewed schedule
    const lastViewedId = localStorage.getItem('lastViewedScheduleId');
    if (lastViewedId && this.savedSchedules[lastViewedId]) {
      this.scheduleSelect.value = lastViewedId;
      this.handleScheduleSelect(lastViewedId);
    } else {
      // Auto-select first schedule
      const firstSchedule = schedules[0];
      if (firstSchedule) {
        this.scheduleSelect.value = firstSchedule.id;
        this.handleScheduleSelect(firstSchedule.id);
      }
    }
  }

  // ============================================
  // SERVER MONITORING
  // ============================================

  initServerMonitoring() {
    // Create persistent offline banner (hidden by default)
    this.createOfflineBanner();

    // Check immediately
    this.checkServerHealth();

    // Monitor browser online/offline events
    window.addEventListener('online', () => {
      console.log('[Server Monitor] Browser is online');
      this.checkServerHealth();
    });

    window.addEventListener('offline', () => {
      console.log('[Server Monitor] Browser is offline');
      this.handleServerOffline();
    });

    // Periodic health check every 30 seconds
    this.serverCheckInterval = setInterval(() => {
      this.checkServerHealth();
    }, 30000);
  }

  createOfflineBanner() {
    // Create a persistent banner at the top
    const banner = document.createElement('div');
    banner.id = 'server-offline-banner';
    banner.className = 'server-offline-banner';
    banner.style.display = 'none';
    banner.innerHTML = `
      <div class="banner-content">
        <div class="offline-icon-wrapper">
          <span class="material-icons offline-icon">cloud_off</span>
        </div>
        <div class="banner-text">
          <div class="offline-badge">OFFLINE MODE</div>
          <span class="banner-subtitle">Máy chủ không khả dụng - Bạn chỉ có thể xem các thời khóa biểu đã tải lên</span>
        </div>
      </div>
    `;
    document.body.insertBefore(banner, document.body.firstChild);
    this.offlineBanner = banner;
  }

  showOfflineBanner() {
    if (this.offlineBanner) {
      this.offlineBanner.style.display = 'flex';
      document.body.classList.add('server-offline');
    }
  }

  hideOfflineBanner() {
    if (this.offlineBanner) {
      this.offlineBanner.style.display = 'none';
      document.body.classList.remove('server-offline');
    }
  }

  async checkServerHealth() {
    try {
      // Try to fetch health endpoint with short timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch('/api/status', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        this.handleServerOnline();
      } else {
        this.handleServerOffline();
      }
    } catch (error) {
      console.log('[Server Monitor] Server unreachable:', error.message);
      this.handleServerOffline();
    }
  }

  handleServerOnline() {
    const wasOffline = !this.isServerAvailable;
    const isFirstCheck = !this.hasCheckedServerOnce;
    this.isServerAvailable = true;
    this.hasCheckedServerOnce = true;

    this.hideOfflineBanner();

    if (wasOffline && !isFirstCheck) {
      console.log('[Server Monitor] Server is back online');
      this.updateOfflineNotification(true); // true = reconnected
    } else if (isFirstCheck) {
      console.log('[Server Monitor] Initial check - server is online');
      this.updateOfflineNotification(false); // false = initially online
    }
  }

  handleServerOffline() {
    const wasOnline = this.isServerAvailable;
    const isFirstCheck = !this.hasCheckedServerOnce;
    this.isServerAvailable = false;
    this.hasCheckedServerOnce = true;

    this.showOfflineBanner();

    if (wasOnline && !isFirstCheck) {
      console.log('[Server Monitor] Server went offline');
      this.updateOfflineNotification();
    } else if (isFirstCheck) {
      console.log('[Server Monitor] Initial check - server is offline');
      this.updateOfflineNotification();
    }
  }

  updateOfflineNotification(isReconnected = false) {
    // Don't override upload messages
    if (this.isUploading) {
      console.log('[Server Monitor] Skipping notification update - upload in progress');
      return;
    }

    // Don't override recent upload success message (within 5 seconds)
    if (this.uploadSuccessTimestamp) {
      const timeSinceUpload = Date.now() - this.uploadSuccessTimestamp;
      if (timeSinceUpload < 5000) {
        console.log('[Server Monitor] Skipping notification update - recent upload success');
        return;
      }
    }

    const schedules = Object.values(this.savedSchedules);

    if (!this.isServerAvailable) {
      // Server is offline - show prominent message
      if (schedules.length > 0) {
        // Has saved schedules - can still view
        this.uploadStatus.innerHTML = `
          <div class="status-warning" style="background: #fef3c7; color: #92400e; padding: 1.25rem; border-radius: 0.5rem; border-left: 4px solid #f59e0b;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
              <span class="material-icons" style="font-size: 1.5rem;">cloud_off</span>
              <strong style="font-size: 1.1rem;">Bạn đang ở chế độ offline</strong>
            </div>
            <p style="margin: 0;">
              Máy chủ không khả dụng hoặc mất kết nối. Bạn chỉ có thể xem ${schedules.length} thời khóa biểu đã tải lên trước đó.
              <br>Upload và chia sẻ thời khóa biểu mới sẽ khả dụng khi kết nối được khôi phục.
            </p>
          </div>
        `;
      } else {
        // No saved schedules - can't do anything
        this.uploadStatus.innerHTML = `
          <div class="status-error" style="padding: 1.25rem; border-radius: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
              <span class="material-icons" style="font-size: 1.5rem;">cloud_off</span>
              <strong style="font-size: 1.1rem;">Không có kết nối</strong>
            </div>
            <p style="margin: 0;">
              Máy chủ không khả dụng. Bạn chưa có thời khóa biểu nào đã lưu để xem offline.
              <br>Vui lòng kiểm tra kết nối internet hoặc thử lại sau.
            </p>
          </div>
        `;
      }

      // Disable upload and share features
      if (this.shareBtn) {
        this.shareBtn.disabled = true;
        this.shareBtn.setAttribute('data-offline', 'true');
        this.shareBtn.title = 'Chia sẻ cần kết nối internet';
      }
      if (this.shareAllBtn) {
        this.shareAllBtn.disabled = true;
        this.shareAllBtn.setAttribute('data-offline', 'true');
        this.shareAllBtn.title = 'Chia sẻ cần kết nối internet';
      }
      if (this.pdfFileInput) {
        this.pdfFileInput.disabled = true;
      }

    } else {
      // Server is online
      // Don't show info if viewing shared schedule
      if (schedules.length > 0 && !this.viewingSharedSchedule) {
        if (isReconnected) {
          // Reconnected - show success message
          this.uploadStatus.innerHTML = `
            <div class="status-success">
              <span class="material-icons">cloud_done</span>
              Đã kết nối lại! Bạn có ${schedules.length} thời khóa biểu đã lưu.
            </div>
          `;
        } else {
          // Initially online - show info message
          this.uploadStatus.innerHTML = `
            <div class="status-info" style="background: #eff6ff; color: #1e40af; padding: 1rem; border-radius: 0.5rem;">
              <span class="material-icons" style="vertical-align: middle;">info</span>
              Bạn có ${schedules.length} thời khóa biểu đã lưu. Chọn từ danh sách bên dưới để xem.
            </div>
          `;
        }
      }

      // Re-enable features
      if (this.shareBtn) {
        this.shareBtn.disabled = false;
        this.shareBtn.removeAttribute('data-offline');
        this.shareBtn.title = '';
      }
      if (this.shareAllBtn) {
        this.shareAllBtn.disabled = false;
        this.shareAllBtn.removeAttribute('data-offline');
        this.shareAllBtn.title = '';
      }
      if (this.pdfFileInput) {
        this.pdfFileInput.disabled = false;
      }
    }
  }

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.scheduleManager = new ScheduleManager();
  });
} else {
  window.scheduleManager = new ScheduleManager();
}
