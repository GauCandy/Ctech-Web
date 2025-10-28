// Admin Dashboard JavaScript
const SESSION_KEY = 'ctechSession';

// Chart instances
let topServicesChartInstance = null;
let revenueChartInstance = null;
let ordersChartInstance = null;

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
  const ctx = document.getElementById('topServicesChart');
  if (!ctx) return;

  // Destroy previous chart if exists
  if (topServicesChartInstance) {
    topServicesChartInstance.destroy();
  }

  const labels = topServices.map(s => s.name);
  const data = topServices.map(s => s.orderCount);

  // Create gradient
  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(0, 71, 171, 0.8)');
  gradient.addColorStop(1, 'rgba(0, 51, 128, 0.6)');

  topServicesChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Số lượng đơn hàng',
        data: data,
        backgroundColor: gradient,
        borderColor: 'rgba(0, 71, 171, 1)',
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
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: {
            font: {
              size: 12
            },
            color: '#6b7280'
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
            color: '#6b7280'
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
        <span class="badge ${service.isActive ? 'badge-success' : 'badge-warning'}">
          ${service.isActive ? 'Hoạt động' : 'Tạm dừng'}
        </span>
      </td>
      <td>
        <button class="btn-icon" onclick="editService('${service.serviceCode}')" title="Chỉnh sửa">
          <span class="material-icons">edit</span>
        </button>
        <button class="btn-icon" onclick="toggleServiceStatus('${service.serviceCode}', ${service.isActive})" title="${service.isActive ? 'Tắt dịch vụ' : 'Bật dịch vụ'}">
          <span class="material-icons">${service.isActive ? 'toggle_on' : 'toggle_off'}</span>
        </button>
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
      method: 'DELETE', // Giữ nguyên method DELETE nhưng backend đã đổi thành toggle
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

function editService(serviceCode) {
  // TODO: Implement edit service modal
  alert('Chức năng sửa dịch vụ đang được phát triển');
}

// ============== STATISTICS ==============
async function loadStatistics() {
  try {
    // Fake monthly data - 6 tháng gần nhất
    const months = ['Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10'];
    const fakeMonthlyData = months.map((month, index) => ({
      month,
      orders: Math.floor(Math.random() * 50) + 80 + (index * 5), // Tăng dần theo trend
      revenue: (Math.random() * 15000000) + 10000000 + (index * 2000000)
    }));

    updateMonthlyCharts(fakeMonthlyData);

  } catch (error) {
    console.error('Error loading statistics:', error);
  }
}

function updateMonthlyCharts(monthlyData) {
  // Revenue Line Chart
  createRevenueChart(monthlyData);

  // Orders Line Chart
  createOrdersChart(monthlyData);
}

function createRevenueChart(monthlyData) {
  const ctx = document.getElementById('revenueChart');
  if (!ctx) return;

  // Destroy previous chart if exists
  if (revenueChartInstance) {
    revenueChartInstance.destroy();
  }

  const labels = monthlyData.map(d => d.month);
  const data = monthlyData.map(d => d.revenue);

  // Create gradient for line
  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(34, 197, 94, 0.8)');
  gradient.addColorStop(1, 'rgba(22, 163, 74, 0.3)');

  // Create gradient for area under line
  const areaGradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
  areaGradient.addColorStop(0, 'rgba(34, 197, 94, 0.4)');
  areaGradient.addColorStop(1, 'rgba(34, 197, 94, 0.05)');

  revenueChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Doanh thu (VNĐ)',
        data: data,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: areaGradient,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgb(34, 197, 94)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: 'rgb(22, 163, 74)',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 3,
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
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: {
            font: {
              size: 12
            },
            color: '#6b7280',
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
            color: '#374151'
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

  // Destroy previous chart if exists
  if (ordersChartInstance) {
    ordersChartInstance.destroy();
  }

  const labels = monthlyData.map(d => d.month);
  const data = monthlyData.map(d => d.orders);

  // Create gradient for area under line
  const areaGradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
  areaGradient.addColorStop(0, 'rgba(0, 71, 171, 0.4)');
  areaGradient.addColorStop(1, 'rgba(0, 71, 171, 0.05)');

  ordersChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Số đơn hàng',
        data: data,
        borderColor: 'rgb(0, 71, 171)',
        backgroundColor: areaGradient,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgb(0, 71, 171)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: 'rgb(0, 51, 128)',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 3,
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
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: {
            font: {
              size: 12
            },
            color: '#6b7280',
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
            color: '#374151'
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
