// Ghi chu: Cau hinh ket noi MySQL su dung mysql2/promise va bien moi truong.
const mysql = require('mysql2/promise');

const {
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_POOL_SIZE,
  DB_CONNECT_TIMEOUT,
  DB_SSL,
} = process.env;

if (!DB_HOST || !DB_NAME || !DB_USER) {
  throw new Error('Missing required database configuration in environment variables.');
}

// Chuyen doi chuoi sang boolean neu co.
function parseBoolean(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (['1', 'true', 'yes', 'y'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'n'].includes(normalized)) {
    return false;
  }

  return null;
}

const poolConfig = {
  host: DB_HOST,
  port: Number(DB_PORT) || 3306,
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: Number(DB_POOL_SIZE) || 10,
  queueLimit: 0,
};

// Neu co cau hinh timeout thi them vao pool.
const connectTimeout = Number(DB_CONNECT_TIMEOUT);
if (!Number.isNaN(connectTimeout) && connectTimeout > 0) {
  poolConfig.connectTimeout = connectTimeout;
}

// Ho tro bat SSL trong truong hop can thiet.
const sslFlag = parseBoolean(DB_SSL);
if (sslFlag === true) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool(poolConfig);

async function validateDatabaseTables() {
  try {
    const [tables] = await pool.query(`
      SELECT TABLE_NAME 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
    `);
    
    if (!tables || tables.length === 0) {
      throw new Error('No tables found in database. Database may be corrupted or not properly initialized.');
    }

    const requiredTables = ['services']; // Add other required tables here
    const existingTables = tables.map(t => t.TABLE_NAME.toLowerCase());
    
    const missingTables = requiredTables.filter(
      table => !existingTables.includes(table.toLowerCase())
    );

    if (missingTables.length > 0) {
      throw new Error(`Missing required tables: ${missingTables.join(', ')}`);
    }

    return true;
  } catch (error) {
    console.error('Database validation error:', error);
    throw error;
  }
}

// Initialize pool and validate tables
const initializeDatabase = async () => {
  try {
    await validateDatabaseTables();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

module.exports = {
  pool,
  getConnection: () => pool.getConnection(),
  query: (...args) => pool.query(...args),
  initializeDatabase
};
