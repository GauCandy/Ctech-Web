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

  const defaultRelative = 'src/backend/api/features/chatbot/services.txt';
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
  lines.push(`### ${service.service_code} - ${service.name}`);
  lines.push(`Trạng thái: ${formatStatus(Boolean(service.is_active))}`);
  lines.push(`Giá tham khảo: ${formatPrice(service.price)}`);

  if (service.updated_at || service.created_at) {
    const updated = service.updated_at || service.created_at;
    lines.push(`Cập nhật lần cuối: ${new Date(updated).toISOString()}`);
  }

  lines.push('Mô tả:');
  lines.push(formatDescription(service.description));
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
    if (ext !== '.txt') {
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
    sections.push(`## ${name}`);
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

  const lines = [
    '# Danh sách dịch vụ hiện có',
    `# Sinh lúc: ${timestamp}`,
    '# Ghi chú: File này được tạo tự động để hỗ trợ mô hình AI hiểu các dịch vụ của trường.',
    '',
  ];

  const { sections: supplementSections, files: extraFiles } = await collectSupplementarySections({
    dataDir,
  });

  if (supplementSections.length) {
    lines.push('## Tài liệu tham chiếu');
    lines.push(...supplementSections);
  }

  if (!services.length) {
    lines.push('Hiện chưa có dịch vụ nào trong hệ thống.');
  } else {
    for (const service of services) {
      lines.push(buildSection(service));
      lines.push('---');
    }
  }

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
