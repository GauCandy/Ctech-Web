// Admin Dashboard JavaScript
const SESSION_KEY = 'ctechSession';
const THEME_KEY = 'ctechAdminTheme';

// Chart instances
let topServicesChartInstance = null;
let revenueChartInstance = null;
let ordersChartInstance = null;

// ============== THEME MANAGEMENT ==============
function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem(THEME_KEY, newTheme);
  updateThemeIcon(newTheme);

  // Re-render charts with new theme colors
  const currentPage = document.querySelector('.page-content:not(.hidden)');
  if (currentPage && currentPage.id === 'page-dashboard') {
    loadDashboardStats();
  } else if (currentPage && currentPage.id === 'page-statistics') {
    loadStatistics();
  }
}

function updateThemeIcon(theme) {
  const themeIcon = document.getElementById('themeIcon');
  if (themeIcon) {
    themeIcon.textContent = theme === 'light' ? 'dark_mode' : 'light_mode';
  }
}

// Helper functions
function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch (error) {
    console.error('Error parsing session:', error);
    return null;
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount || 0);
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

function formatDateTime(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getChartColors() {
  const theme = document.documentElement.getAttribute('data-theme');
  if (theme === 'dark') {
    return {
      primary: 'rgb(59, 130, 246)',
      primaryGradientStart: 'rgba(59, 130, 246, 0.8)',
      primaryGradientEnd: 'rgba(37, 99, 235, 0.6)',
      primaryArea: 'rgba(59, 130, 246, 0.4)',
      success: 'rgb(16, 185, 129)',
      successArea: 'rgba(16, 185, 129, 0.4)',
      gridColor: 'rgba(255, 255, 255, 0.1)',
      textColor: '#cbd5e1'
    };
  } else {
    return {
      primary: 'rgb(0, 71, 171)',
      primaryGradientStart: 'rgba(0, 71, 171, 0.8)',
      primaryGradientEnd: 'rgba(0, 51, 128, 0.6)',
      primaryArea: 'rgba(0, 71, 171, 0.4)',
      success: 'rgb(34, 197, 94)',
      successArea: 'rgba(34, 197, 94, 0.4)',
      gridColor: 'rgba(0, 0, 0, 0.05)',
      textColor: '#6b7280'
    };
  }
}

// Check admin authentication
function checkAdminAuth() {
  try {
    const session = getSession();

    if (!session || !session.token || !session.user || session.user.role !== 'admin') {
      window.location.href = '/login';
      return false;
    }

    // Set admin name
    const adminNameEl = document.getElementById('adminName');
    if (adminNameEl) {
      adminNameEl.textContent = session.user.fullName || 'Admin';
    }

    return true;
  } catch (error) {
    console.error('Error checking admin auth:', error);
    window.location.href = '/login';
    return false;
  }
}

// Logout
function logout() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('ctechDisplayName');
  window.location.href = '/login';
}

// Show page
function showPage(pageId, event) {
  if (event) {
    event.preventDefault();
  }

  // Hide all pages
  document.querySelectorAll('.page-content').forEach(page => {
    page.classList.add('hidden');
  });

  // Show selected page
  const targetPage = document.getElementById('page-' + pageId);
  if (targetPage) {
    targetPage.classList.remove('hidden');
  }

  // Update active menu item
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.classList.remove('active');
  });
  if (event && event.currentTarget) {
    event.currentTarget.classList.add('active');
  }

  // Load data for the page
  switch(pageId) {
    case 'dashboard':
      loadDashboardStats();
      break;
    case 'users':
      loadUsers();
      break;
    case 'services':
      loadServices();
      break;
    case 'statistics':
      loadStatistics();
      break;
  }
}

// ============== DASHBOARD ==============
async function loadDashboardStats() {
  try {
    const session = getSession();
    if (!session || !session.token) {
      window.location.href = '/login';
      return;
    }

    const response = await fetch('/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${session.token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load stats');
    }

    const data = await response.json();

    // Update stat cards
    document.getElementById('totalUsers').textContent = data.summary.totalUsers;
    document.getElementById('ordersThisMonth').textContent = data.summary.ordersThisMonth;
    document.getElementById('totalRevenue').textContent = formatCurrency(data.summary.totalRevenue);
    document.getElementById('activeServices').textContent = data.summary.activeServices;

    // Update top services chart
    if (data.topServices && data.topServices.length > 0) {
      updateTopServicesChart(data.topServices);
    } else {
      const ctx = document.getElementById('topServicesChart');
      if (ctx && ctx.parentElement) {
        ctx.parentElement.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 40px;">Chưa có dữ liệu dịch vụ</p>';
      }
    }

  } catch (error) {
    console.error('Error loading dashboard stats:', error);
    document.getElementById('totalUsers').textContent = '0';
    document.getElementById('ordersThisMonth').textContent = '0';
    document.getElementById('totalRevenue').textContent = formatCurrency(0);
    document.getElementById('activeServices').textContent = '0';
  }
}

function updateTopServicesChart(topServices) {
  const ctx = document.getElementById('topServicesChart');
  if (!ctx) return;

  if (topServicesChartInstance) {
    topServicesChartInstance.destroy();
  }

  const labels = topServices.map(s => s.name);
  const data = topServices.map(s => s.orderCount);
  const colors = getChartColors();

  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, colors.primaryGradientStart);
  gradient.addColorStop(1, colors.primaryGradientEnd);

  topServicesChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Số lượng đơn hàng',
        data: data,
        backgroundColor: gradient,
        borderColor: colors.primary,
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          },
          callbacks: {
            label: function(context) {
              return 'Đơn hàng: ' + context.parsed.y;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: colors.gridColor,
            drawBorder: false
          },
          ticks: {
            font: {
              size: 12
            },
            color: colors.textColor
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 12
            },
            color: colors.textColor
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
      }
    }
  });
}

// ============== USERS MANAGEMENT ==============
let currentUsersPage = 1;
let currentUsersSearch = '';

async function loadUsers(page = 1, search = '') {
  try {
    const session = getSession();
    if (!session || !session.token) {
      window.location.href = '/login';
      return;
    }

    currentUsersPage = page;
    currentUsersSearch = search;

    const params = new URLSearchParams({
      page,
      limit: 20
    });

    if (search) {
      params.append('search', search);
    }

    const response = await fetch(`/api/admin/users?${params}`, {
      headers: {
        'Authorization': `Bearer ${session.token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load users');
    }

    const data = await response.json();
    renderUsersTable(data.users);

  } catch (error) {
    console.error('Error loading users:', error);
    document.getElementById('usersTableBody').innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px; color: var(--danger);">
          Lỗi khi tải danh sách người dùng
        </td>
      </tr>
    `;
  }
}

function renderUsersTable(users) {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  if (!users || users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
          Không có người dùng nào
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = users.map(user => {
    const roleBadgeClass = {
      'admin': 'badge-admin',
      'teacher': 'badge-user',
      'student': 'badge-user'
    }[user.role] || 'badge-user';

    const roleText = {
      'admin': 'Admin',
      'teacher': 'Giáo viên',
      'student': 'Sinh viên'
    }[user.role] || user.role;

    return `
      <tr>
        <td>${user.userId}</td>
        <td>${user.fullName || '-'}</td>
        <td>${user.email || '-'}</td>
        <td><span class="badge ${roleBadgeClass}">${roleText}</span></td>
        <td><span class="badge badge-success">Hoạt động</span></td>
        <td>
          <div class="table-actions">
            <button class="btn-icon" onclick="resetUserPassword('${user.userId}')" title="Reset mật khẩu">
              <span class="material-icons">lock_reset</span>
            </button>
            ${user.role !== 'admin' ? `
            <button class="btn-icon delete" onclick="confirmDeleteUser('${user.userId}', '${user.fullName}')" title="Xóa">
              <span class="material-icons">delete</span>
            </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function confirmDeleteUser(userId, userName) {
  if (confirm(`Bạn có chắc muốn xóa người dùng "${userName}"?`)) {
    await deleteUser(userId);
  }
}

async function deleteUser(userId) {
  try {
    const session = getSession();
    if (!session || !session.token) {
      window.location.href = '/login';
      return;
    }

    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Không thể xóa người dùng');
    }

    alert('Đã xóa người dùng thành công');
    loadUsers(currentUsersPage, currentUsersSearch);

  } catch (error) {
    console.error('Error deleting user:', error);
    alert('Lỗi: ' + error.message);
  }
}

async function resetUserPassword(userId) {
  const newPassword = prompt('Nhập mật khẩu mới cho người dùng:');
  if (!newPassword) return;

  if (newPassword.length < 8) {
    alert('Mật khẩu phải có ít nhất 8 ký tự');
    return;
  }

  try {
    const session = getSession();
    if (!session || !session.token) {
      window.location.href = '/login';
      return;
    }

    const response = await fetch(`/api/admin/accounts/${userId}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`
      },
      body: JSON.stringify({ newPassword })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Không thể reset mật khẩu');
    }

    alert('Đã reset mật khẩu thành công');

  } catch (error) {
    console.error('Error resetting password:', error);
    alert('Lỗi: ' + error.message);
  }
}

// ============== USER MODAL ==============
function openAddUserModal() {
  document.getElementById('addUserModal').classList.add('active');
}

function closeAddUserModal() {
  document.getElementById('addUserModal').classList.remove('active');
  document.getElementById('addUserForm').reset();
  // Reset field visibility
  toggleRoleFields('');
}

function toggleRoleFields(role) {
  const genderField = document.getElementById('genderField');
  const birthDateField = document.getElementById('birthDateField');
  const classCodeField = document.getElementById('classCodeField');
  const positionField = document.getElementById('positionField');
  const departmentField = document.getElementById('departmentField');

  // Hide all role-specific fields first
  if (classCodeField) classCodeField.style.display = 'none';
  if (positionField) positionField.style.display = 'none';

  // Show/hide fields based on role
  if (role === 'student') {
    if (genderField) genderField.style.display = 'block';
    if (birthDateField) birthDateField.style.display = 'block';
    if (classCodeField) classCodeField.style.display = 'block';
    if (departmentField) departmentField.style.display = 'block';
  } else if (role === 'teacher') {
    if (genderField) genderField.style.display = 'block';
    if (birthDateField) birthDateField.style.display = 'block';
    if (positionField) positionField.style.display = 'block';
    if (departmentField) departmentField.style.display = 'block';
  } else if (role === 'admin') {
    if (genderField) genderField.style.display = 'none';
    if (birthDateField) birthDateField.style.display = 'none';
    if (departmentField) departmentField.style.display = 'block';
  } else {
    // No role selected
    if (genderField) genderField.style.display = 'block';
    if (birthDateField) birthDateField.style.display = 'block';
    if (departmentField) departmentField.style.display = 'block';
  }
}

async function addUser(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const role = formData.get('role');

  // Build request payload based on role
  const userData = {
    role: role
  };

  const profileInfo = {
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    phoneNumber: formData.get('phoneNumber') || null,
    gender: formData.get('gender') || 'other',
    birthDate: formData.get('birthDate') || null
  };

  // Add role-specific fields
  if (role === 'student') {
    userData.student = {
      ...profileInfo,
      classCode: formData.get('classCode') || null,
      department: formData.get('department') || null
    };
  } else if (role === 'teacher') {
    userData.teacher = {
      ...profileInfo,
      department: formData.get('department') || null,
      position: formData.get('position') || null
    };
  } else if (role === 'admin') {
    userData.admin = {
      fullName: profileInfo.fullName,
      email: profileInfo.email,
      phoneNumber: profileInfo.phoneNumber,
      department: formData.get('department') || null
    };
  }

  try {
    const session = getSession();
    if (!session || !session.token) {
      alert('Phiên đăng nhập hết hạn');
      window.location.href = '/login';
      return;
    }

    const response = await fetch('/api/admin/accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`
      },
      body: JSON.stringify(userData)
    });

    if (response.ok) {
      const result = await response.json();
      const userId = result.user?.userId || 'N/A';
      const password = result.initialPassword || 'N/A';

      // Show success modal with credentials
      document.getElementById('createdUserId').value = userId;
      document.getElementById('createdPassword').value = password;

      closeAddUserModal();
      document.getElementById('accountCreatedModal').classList.add('active');
      loadUsers();
    } else {
      const error = await response.json();
      alert('Lỗi: ' + (error.message || error.error || 'Không thể thêm tài khoản'));
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Lỗi khi thêm tài khoản');
  }
}

function closeAccountCreatedModal() {
  document.getElementById('accountCreatedModal').classList.remove('active');
  // Clear values for security
  document.getElementById('createdUserId').value = '';
  document.getElementById('createdPassword').value = '';
}

function copyToClipboard(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  // Select and copy
  input.select();
  input.setSelectionRange(0, 99999); // For mobile devices

  try {
    document.execCommand('copy');

    // Visual feedback
    const button = event.target.closest('button');
    const originalHTML = button.innerHTML;
    button.innerHTML = '<span class="material-icons">check</span>';
    button.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
    button.style.color = 'white';

    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.style.background = '';
      button.style.color = '';
    }, 1500);
  } catch (err) {
    console.error('Failed to copy:', err);
  }

  // Deselect
  window.getSelection().removeAllRanges();
}

// ============== SERVICES MANAGEMENT ==============
async function loadServices() {
  try {
    const session = getSession();
    if (!session || !session.token) {
      window.location.href = '/login';
      return;
    }

    const response = await fetch('/api/services');

    if (!response.ok) {
      throw new Error('Failed to load services');
    }

    const data = await response.json();
    renderServicesTable(data.services);

  } catch (error) {
    console.error('Error loading services:', error);
    document.getElementById('servicesTableBody').innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px; color: var(--danger);">
          Lỗi khi tải danh sách dịch vụ
        </td>
      </tr>
    `;
  }
}

function renderServicesTable(services) {
  const tbody = document.getElementById('servicesTableBody');
  if (!tbody) return;

  if (!services || services.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
          Không có dịch vụ nào
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = services.map(service => `
    <tr>
      <td>${service.serviceCode}</td>
      <td>${service.name}</td>
      <td>${service.category || '-'}</td>
      <td>${formatCurrency(service.price)}</td>
      <td>
        <span class="badge ${service.isActive ? 'badge-success' : 'badge-warning'}">
          ${service.isActive ? 'Hoạt động' : 'Tạm dừng'}
        </span>
      </td>
      <td>
        <div class="table-actions">
          <button class="btn-icon" onclick="editService('${service.serviceCode}')" title="Chỉnh sửa">
            <span class="material-icons">edit</span>
          </button>
          <button class="btn-icon" onclick="toggleServiceStatus('${service.serviceCode}', ${service.isActive})" title="${service.isActive ? 'Tắt dịch vụ' : 'Bật dịch vụ'}">
            <span class="material-icons">${service.isActive ? 'toggle_on' : 'toggle_off'}</span>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function toggleServiceStatus(serviceCode, currentStatus) {
  const action = currentStatus ? 'tắt' : 'bật';
  if (!confirm(`Bạn có chắc muốn ${action} dịch vụ này?`)) {
    return;
  }

  try {
    const session = getSession();
    if (!session || !session.token) {
      window.location.href = '/login';
      return;
    }

    const response = await fetch(`/api/admin/services/${serviceCode}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Không thể thay đổi trạng thái dịch vụ');
    }

    const result = await response.json();
    alert(result.message || 'Đã thay đổi trạng thái dịch vụ thành công');
    loadServices();

  } catch (error) {
    console.error('Error toggling service:', error);
    alert('Lỗi: ' + error.message);
  }
}

// ============== SERVICE MODALS ==============
function openAddServiceModal() {
  document.getElementById('addServiceModal').classList.add('active');
}

function closeAddServiceModal() {
  document.getElementById('addServiceModal').classList.remove('active');
  document.getElementById('addServiceForm').reset();
}

async function addService(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const serviceData = {
    name: formData.get('name'),
    description: formData.get('description'),
    category: formData.get('category'),
    price: parseFloat(formData.get('price')),
    isActive: parseInt(formData.get('isActive'))
  };

  try {
    const session = getSession();
    if (!session || !session.token) {
      alert('Phiên đăng nhập hết hạn');
      window.location.href = '/login';
      return;
    }

    const response = await fetch('/api/admin/services', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`
      },
      body: JSON.stringify(serviceData)
    });

    if (response.ok) {
      alert('Thêm dịch vụ thành công!');
      closeAddServiceModal();
      loadServices();
    } else {
      const error = await response.json();
      alert('Lỗi: ' + (error.error || 'Không thể thêm dịch vụ'));
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Lỗi khi thêm dịch vụ');
  }
}

async function editService(serviceCode) {
  try {
    const session = getSession();
    if (!session || !session.token) {
      window.location.href = '/login';
      return;
    }

    // Fetch service details
    const response = await fetch('/api/services');
    if (!response.ok) {
      throw new Error('Failed to load service details');
    }

    const data = await response.json();
    const service = data.services.find(s => s.serviceCode === serviceCode);

    if (!service) {
      alert('Không tìm thấy dịch vụ');
      return;
    }

    // Populate form
    document.getElementById('editServiceCode').value = service.serviceCode;
    document.getElementById('editServiceName').value = service.name;
    document.getElementById('editServiceDescription').value = service.description || '';
    document.getElementById('editServiceCategory').value = service.category || '';
    document.getElementById('editServicePrice').value = service.price;
    document.getElementById('editServiceActive').value = service.isActive ? '1' : '0';

    // Open modal
    document.getElementById('editServiceModal').classList.add('active');

  } catch (error) {
    console.error('Error loading service details:', error);
    alert('Lỗi khi tải thông tin dịch vụ');
  }
}

function closeEditServiceModal() {
  document.getElementById('editServiceModal').classList.remove('active');
  document.getElementById('editServiceForm').reset();
}

async function updateService(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const serviceCode = formData.get('serviceCode');
  const serviceData = {
    name: formData.get('name'),
    description: formData.get('description'),
    category: formData.get('category'),
    price: parseFloat(formData.get('price')),
    isActive: parseInt(formData.get('isActive'))
  };

  try {
    const session = getSession();
    if (!session || !session.token) {
      alert('Phiên đăng nhập hết hạn');
      window.location.href = '/login';
      return;
    }

    const response = await fetch(`/api/admin/services/${serviceCode}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`
      },
      body: JSON.stringify(serviceData)
    });

    if (response.ok) {
      alert('Cập nhật dịch vụ thành công!');
      closeEditServiceModal();
      loadServices();
    } else {
      const error = await response.json();
      alert('Lỗi: ' + (error.error || 'Không thể cập nhật dịch vụ'));
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Lỗi khi cập nhật dịch vụ');
  }
}

// ============== STATISTICS ==============
async function loadStatistics() {
  try {
    const session = getSession();
    if (!session || !session.token) {
      window.location.href = '/login';
      return;
    }

    // Gọi API để lấy dữ liệu thống kê thực
    const response = await fetch('/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${session.token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load statistics');
    }

    const data = await response.json();

    // Nếu có dữ liệu monthlyOrders từ backend
    if (data.monthlyOrders && data.monthlyOrders.length > 0) {
      updateMonthlyCharts(data.monthlyOrders);
    } else {
      // Hiển thị thông báo nếu chưa có dữ liệu
      showNoDataMessage();
    }

  } catch (error) {
    console.error('Error loading statistics:', error);
    showNoDataMessage();
  }
}

function showNoDataMessage() {
  const revenueCtx = document.getElementById('revenueChart');
  const ordersCtx = document.getElementById('ordersChart');

  if (revenueCtx && revenueCtx.parentElement) {
    revenueCtx.parentElement.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 40px;">Chưa có dữ liệu thống kê</p>';
  }

  if (ordersCtx && ordersCtx.parentElement) {
    ordersCtx.parentElement.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 40px;">Chưa có dữ liệu thống kê</p>';
  }
}

function updateMonthlyCharts(monthlyData) {
  createRevenueChart(monthlyData);
  createOrdersChart(monthlyData);
}

function createRevenueChart(monthlyData) {
  const ctx = document.getElementById('revenueChart');
  if (!ctx) return;

  if (revenueChartInstance) {
    revenueChartInstance.destroy();
  }

  const labels = monthlyData.map(d => {
    const [year, month] = d.month.split('-');
    return `Tháng ${parseInt(month)}`;
  });
  const data = monthlyData.map(d => d.revenue);
  const colors = getChartColors();

  const areaGradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
  areaGradient.addColorStop(0, colors.successArea);
  areaGradient.addColorStop(1, 'rgba(34, 197, 94, 0.05)');

  revenueChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Doanh thu (VNĐ)',
        data: data,
        borderColor: colors.success,
        backgroundColor: areaGradient,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: colors.success,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 16,
          titleFont: {
            size: 15,
            weight: 'bold'
          },
          bodyFont: {
            size: 14
          },
          callbacks: {
            label: function(context) {
              return 'Doanh thu: ' + formatCurrency(context.parsed.y);
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: colors.gridColor,
            drawBorder: false
          },
          ticks: {
            font: {
              size: 12
            },
            color: colors.textColor,
            callback: function(value) {
              return (value / 1000000).toFixed(0) + 'M';
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 13,
              weight: '500'
            },
            color: colors.textColor
          }
        }
      },
      animation: {
        duration: 1500,
        easing: 'easeInOutQuart'
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  });
}

function createOrdersChart(monthlyData) {
  const ctx = document.getElementById('ordersChart');
  if (!ctx) return;

  if (ordersChartInstance) {
    ordersChartInstance.destroy();
  }

  const labels = monthlyData.map(d => {
    const [year, month] = d.month.split('-');
    return `Tháng ${parseInt(month)}`;
  });
  const data = monthlyData.map(d => d.orders);
  const colors = getChartColors();

  const areaGradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
  areaGradient.addColorStop(0, colors.primaryArea);
  areaGradient.addColorStop(1, 'rgba(0, 71, 171, 0.05)');

  ordersChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Số đơn hàng',
        data: data,
        borderColor: colors.primary,
        backgroundColor: areaGradient,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: colors.primary,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 16,
          titleFont: {
            size: 15,
            weight: 'bold'
          },
          bodyFont: {
            size: 14
          },
          callbacks: {
            label: function(context) {
              return 'Đơn hàng: ' + context.parsed.y;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: colors.gridColor,
            drawBorder: false
          },
          ticks: {
            font: {
              size: 12
            },
            color: colors.textColor,
            stepSize: 20
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 13,
              weight: '500'
            },
            color: colors.textColor
          }
        }
      },
      animation: {
        duration: 1500,
        easing: 'easeInOutQuart'
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  });
}

// Initialize on page load
initTheme();
if (checkAdminAuth()) {
  loadDashboardStats();
  console.log('Admin dashboard loaded');
}
