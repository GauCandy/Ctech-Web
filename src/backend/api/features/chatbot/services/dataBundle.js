const fs = require('fs/promises');
const path = require('path');

const DEFAULT_DATA_DIR = 'src/backend/api/features/chatbot/data';
const AGGREGATED_FILE = 'src/backend/api/features/chatbot/services.md';
const parsedTtl = Number(process.env.CHATBOT_DATA_CACHE_MS);
const CACHE_TTL_MS = Number.isFinite(parsedTtl) && parsedTtl > 0 ? parsedTtl : 30000;

let cachedBundle = null;
let cachedPath = null;
let cachedAt = 0;

function resolveAggregatedPath() {
  const override = (process.env.CHATBOT_SERVICES_PATH || '').trim();
  const base = override || AGGREGATED_FILE;
  return path.resolve(process.cwd(), base);
}

function resolveDataDir() {
  const override = (process.env.CHATBOT_DATA_DIR || '').trim();
  const base = override || DEFAULT_DATA_DIR;
  return path.resolve(process.cwd(), base);
}

async function loadServicesFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return raw.trim();
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      console.warn('Chưa tìm thấy file services.md (knowledge base) cho BotChat:', filePath);
      return '';
    }
    console.warn('Không thể đọc file services.md (knowledge base):', filePath, error.message || error);
    return '';
  }
}

async function loadChatbotDataBundle() {
  const servicesPath = resolveAggregatedPath();
  const now = Date.now();

  if (cachedBundle && cachedPath === servicesPath && now - cachedAt < CACHE_TTL_MS) {
    return cachedBundle;
  }

  const content = await loadServicesFile(servicesPath);
  const relative = path.relative(process.cwd(), servicesPath);

  const bundle = {
    content,
    files: content ? [relative || servicesPath] : [],
    directory: resolveDataDir(),
  };

  cachedBundle = bundle;
  cachedPath = servicesPath;
  cachedAt = now;
  return bundle;
}

module.exports = {
  loadChatbotDataBundle,
  resolveDataDir,
  resolveAggregatedPath,
};
