// Admin Dashboard JavaScript
const SESSION_KEY = 'ctechSession';

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
    // Fake data for demo (không gọi API thật)
    const fakeData = {
      summary: {
        totalUsers: Math.floor(Math.random() * 100) + 200, // 200-300
        ordersThisMonth: Math.floor(Math.random() * 50) + 100, // 100-150
        totalRevenue: (Math.random() * 30000000) + 40000000, // 40-70M
        activeServices: Math.floor(Math.random() * 5) + 10, // 10-15
      },
      topServices: [
        { name: 'Vé gửi xe tháng', orderCount: Math.floor(Math.random() * 50) + 150 },
        { name: 'Xuất ăn căn tin', orderCount: Math.floor(Math.random() * 40) + 120 },
        { name: 'Vé gửi xe ngày', orderCount: Math.floor(Math.random() * 60) + 140 },
        { name: 'Nước ép', orderCount: Math.floor(Math.random() * 30) + 80 },
        { name: 'Đồ học tập', orderCount: Math.floor(Math.random() * 25) + 90 },
      ]
    };

    // Update stat cards
    document.getElementById('totalUsers').textContent = fakeData.summary.totalUsers;
    document.getElementById('ordersThisMonth').textContent = fakeData.summary.ordersThisMonth;
    document.getElementById('totalRevenue').textContent = formatCurrency(fakeData.summary.totalRevenue);
    document.getElementById('activeServices').textContent = fakeData.summary.activeServices;

    // Update top services chart
    updateTopServicesChart(fakeData.topServices);

  } catch (error) {
    console.error('Error loading dashboard stats:', error);
  }
}

function updateTopServicesChart(topServices) {
  const chartContainer = document.querySelector('.chart-container');
  if (!chartContainer) return;

  const maxOrders = Math.max(...topServices.map(s => s.orderCount), 1);

  chartContainer.innerHTML = topServices.map(service => {
    const heightPercent = (service.orderCount / maxOrders) * 100;
    return `
      <div class="chart-bar" style="height: ${Math.max(heightPercent, 20)}px;">
        <div class="chart-label">${service.name}</div>
        <div class="chart-value">${service.orderCount}</div>
      </div>
    `;
  }).join('');
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
    renderUsersPagination(data.pagination);

  } catch (error) {
    console.error('Error loading users:', error);
    document.getElementById('usersTableBody').innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px; color: #dc2626;">
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
        <td colspan="6" style="text-align: center; padding: 40px; color: #6b7280;">
          Không có người dùng nào
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = users.map(user => {
    const roleBadgeClass = {
      'admin': 'badge-admin',
      'teacher': 'badge-teacher',
      'student': 'badge-student'
    }[user.role] || 'badge-info';

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
          <button class="btn-icon" onclick="editUser('${user.userId}')" title="Sửa">
            <span class="material-icons">edit</span>
          </button>
          ${user.role !== 'admin' ? `
          <button class="btn-icon" onclick="confirmDeleteUser('${user.userId}', '${user.fullName}')" title="Xóa">
            <span class="material-icons">delete</span>
          </button>
          ` : ''}
          <button class="btn-icon" onclick="resetUserPassword('${user.userId}')" title="Reset mật khẩu">
            <span class="material-icons">lock_reset</span>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderUsersPagination(pagination) {
  // Implement pagination UI if needed
  console.log('Pagination:', pagination);
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

function editUser(userId) {
  // TODO: Implement edit user modal
  alert('Chức năng sửa người dùng đang được phát triển');
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
        <td colspan="6" style="text-align: center; padding: 40px; color: #dc2626;">
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
        <td colspan="6" style="text-align: center; padding: 40px; color: #6b7280;">
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
        <span class="badge ${service.isActive ? 'badge-success' : 'badge-inactive'}">
          ${service.isActive ? 'Hoạt động' : 'Tạm dừng'}
        </span>
      </td>
      <td>
        <button class="btn-icon" onclick="editService('${service.serviceCode}')" title="Sửa">
          <span class="material-icons">edit</span>
        </button>
        <button class="btn-icon" onclick="confirmDeleteService('${service.serviceCode}', '${service.name}')" title="Xóa">
          <span class="material-icons">delete</span>
        </button>
      </td>
    </tr>
  `).join('');
}

async function confirmDeleteService(serviceCode, serviceName) {
  if (confirm(`Bạn có chắc muốn xóa dịch vụ "${serviceName}"?`)) {
    await deleteService(serviceCode);
  }
}

async function deleteService(serviceCode) {
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
      throw new Error(error.error || 'Không thể xóa dịch vụ');
    }

    alert('Đã xóa dịch vụ thành công');
    loadServices();

  } catch (error) {
    console.error('Error deleting service:', error);
    alert('Lỗi: ' + error.message);
  }
}

function editService(serviceCode) {
  // TODO: Implement edit service modal
  alert('Chức năng sửa dịch vụ đang được phát triển');
}

// ============== STATISTICS ==============
async function loadStatistics() {
  try {
    // Fake monthly data
    const months = ['2025-05', '2025-06', '2025-07', '2025-08', '2025-09', '2025-10'];
    const fakeMonthlyData = months.map(month => ({
      month,
      orders: Math.floor(Math.random() * 50) + 80,
      revenue: (Math.random() * 15000000) + 10000000
    }));

    updateMonthlyChart(fakeMonthlyData);

  } catch (error) {
    console.error('Error loading statistics:', error);
  }
}

function updateMonthlyChart(monthlyData) {
  // Fake chart implementation - chỉ log ra console
  console.log('Thống kê theo tháng (Fake data):', monthlyData);

  // TODO: Có thể thêm chart visualization sau (dùng Chart.js hoặc tương tự)
  // Hiện tại chỉ hiển thị text "Sẽ cập nhật sớm..." trong HTML
}

// ============== ADD USER MODAL ==============
function openAddUserModal() {
  document.getElementById('addUserModal').classList.add('active');
}

function closeAddUserModal() {
  document.getElementById('addUserModal').classList.remove('active');
  document.getElementById('addUserForm').reset();
}

async function addUser(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const userData = {
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role')
  };

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
      alert('Thêm tài khoản thành công!');
      closeAddUserModal();
      loadUsers();
    } else {
      const error = await response.json();
      alert('Lỗi: ' + (error.error || 'Không thể thêm tài khoản'));
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Lỗi khi thêm tài khoản');
  }
}

// Initialize on page load
if (checkAdminAuth()) {
  // Load initial data
  loadDashboardStats();
  console.log('Admin dashboard loaded');
}
