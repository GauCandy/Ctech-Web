const fs = require('fs/promises');
const path = require('path');

let poolModule = null;

const DEFAULT_EXPORT_PATH = resolveExportPath(process.env.SERVICES_EXPORT_PATH);
const DEFAULT_DATA_DIR = resolveDataDir(process.env.CHATBOT_DATA_DIR);

function getPool() {
  if (!poolModule) {
    poolModule = require('./connection');
  }
  return poolModule.pool;
}

function resolveExportPath(customPath) {
  if (customPath && typeof customPath === 'string') {
    return path.resolve(process.cwd(), customPath);
  }

  const defaultRelative = 'src/backend/api/features/chatbot/services.md';
  return path.resolve(process.cwd(), defaultRelative);
}

function resolveDataDir(customDir) {
  if (customDir && typeof customDir === 'string' && customDir.trim()) {
    return path.resolve(process.cwd(), customDir.trim());
  }
  return path.resolve(process.cwd(), 'src/backend/api/features/chatbot/data');
}

function formatPrice(value) {
  if (value === null || value === undefined) {
    return 'Không công bố';
  }

  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    return '0 (Miễn phí)';
  }

  return `${number.toLocaleString('vi-VN')} VND`;
}

function formatStatus(isActive) {
  return isActive ? 'Hoạt động' : 'Ngừng cung cấp';
}

function formatDescription(description) {
  if (!description) {
    return 'Không có mô tả chi tiết.';
  }

  const trimmed = description.trim();
  return trimmed || 'Không có mô tả chi tiết.';
}

function buildSection(service) {
  const lines = [];
  const statusIcon = service.is_active ? '✅' : '⛔';

  lines.push(`### ${statusIcon} ${service.service_code} - ${service.name}`);
  lines.push('');

  // Service info table
  lines.push('| Thông tin | Chi tiết |');
  lines.push('|-----------|----------|');
  lines.push(`| **Trạng thái** | ${formatStatus(Boolean(service.is_active))} |`);
  lines.push(`| **Giá** | ${formatPrice(service.price)} |`);

  if (service.updated_at || service.created_at) {
    const updated = service.updated_at || service.created_at;
    const dateStr = new Date(updated).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    lines.push(`| **Cập nhật** | ${dateStr} |`);
  }

  lines.push('');

  const description = formatDescription(service.description);
  if (description !== 'Không có mô tả chi tiết.') {
    lines.push('**Mô tả:**');
    lines.push('');
    lines.push(description);
  } else {
    lines.push('> *Hiện nhà trường chưa cung cấp mô tả chi tiết cho dịch vụ này.*');
  }

  lines.push('');
  return lines.join('\n');
}

async function collectSupplementarySections({ dataDir }) {
  let entries;
  try {
    entries = await fs.readdir(dataDir, { withFileTypes: true });
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return { sections: [], files: [] };
    }
    throw error;
  }

  const sections = [];
  const files = [];
  const entriesSorted = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'vi'));

  for (const name of entriesSorted) {
    const ext = path.extname(name).toLowerCase();
    if (ext !== '.txt' && ext !== '.md') {
      continue;
    }

    const fullPath = path.join(dataDir, name);

    let raw;
    try {
      raw = await fs.readFile(fullPath, 'utf8');
    } catch (error) {
      console.warn('Không thể đọc tệp dữ liệu bổ sung:', fullPath, error.message || error);
      continue;
    }

    const trimmed = raw.trim();
    if (!trimmed) {
      continue;
    }

    const relative = path.relative(process.cwd(), fullPath) || name;
    files.push(relative);
    const baseName = path.basename(name, ext);
    sections.push(`## 📄 ${baseName}`);
    sections.push(trimmed);
    sections.push('');
  }

  return { sections, files };
}

async function fetchServices(connection) {
  const executor = connection && typeof connection.execute === 'function' ? connection : getPool();
  const [rows] = await executor.execute(
    `SELECT service_code,
            name,
            description,
            price,
            is_active,
            created_at,
            updated_at
       FROM services
      ORDER BY service_code ASC`
  );
  return rows;
}

async function ensureDirectory(targetPath) {
  const dir = path.dirname(targetPath);
  await fs.mkdir(dir, { recursive: true });
}

async function exportServicesCatalog({ outputPath, connection } = {}) {
  const targetPath = outputPath ? path.resolve(process.cwd(), outputPath) : DEFAULT_EXPORT_PATH;
  const dataDir = DEFAULT_DATA_DIR;

  const services = await fetchServices(connection);
  const timestamp = new Date().toISOString();
  const dateFormatted = new Date().toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const lines = [
    '# 🤖 CTECH Chatbot Knowledge Base',
    '',
    '> **Tài liệu tham chiếu cho BotChat Support - Trợ lý ảo Trường Cao đẳng CTECH**',
    '',
    `📅 **Cập nhật:** ${dateFormatted}  `,
    `🔄 **Trạng thái:** Tự động đồng bộ từ hệ thống  `,
    `📊 **Tổng số dịch vụ:** ${services.length}`,
    '',
    '---',
    '',
  ];

  const { sections: supplementSections, files: extraFiles } = await collectSupplementarySections({
    dataDir,
  });

  if (supplementSections.length) {
    lines.push('# 📚 Hướng dẫn và Thông tin chung');
    lines.push('');
    lines.push(...supplementSections);
    lines.push('---');
    lines.push('');
  }

  lines.push('# 🛒 Danh sách dịch vụ');
  lines.push('');

  if (!services.length) {
    lines.push('> ⚠️ Hiện chưa có dịch vụ nào trong hệ thống.');
  } else {
    // Group services by status
    const activeServices = services.filter(s => s.is_active);
    const inactiveServices = services.filter(s => !s.is_active);

    if (activeServices.length > 0) {
      lines.push('## ✅ Dịch vụ đang hoạt động');
      lines.push('');
      for (const service of activeServices) {
        lines.push(buildSection(service));
        lines.push('');
      }
    }

    if (inactiveServices.length > 0) {
      lines.push('## ⛔ Dịch vụ ngừng cung cấp');
      lines.push('');
      lines.push('> **Lưu ý:** Các dịch vụ bên dưới đã ngừng hoạt động. Chỉ cung cấp thông tin khi người dùng hỏi.');
      lines.push('');
      for (const service of inactiveServices) {
        lines.push(buildSection(service));
        lines.push('');
      }
    }
  }

  lines.push('---');
  lines.push('');
  lines.push('## 📞 Liên hệ hỗ trợ');
  lines.push('');
  lines.push('- 📧 Email: contact@ctech.edu.vn');
  lines.push('- ☎️ Hotline: 1800 6770');
  lines.push('');
  lines.push(`> *Tài liệu được tạo tự động lúc ${timestamp}*`);

  const payload = `${lines.join('\n')}`.trimEnd() + '\n';
  await ensureDirectory(targetPath);
  await fs.writeFile(targetPath, payload, 'utf8');

  return {
    path: targetPath,
    servicesCount: services.length,
    includedFiles: extraFiles,
  };
}

module.exports = {
  exportServicesCatalog,
  DEFAULT_EXPORT_PATH,
  DEFAULT_DATA_DIR,
};
