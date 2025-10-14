// Ghi chu: Khoi tao co so du lieu bang cach nap schema neu ton tai.
const path = require('path');
const fs = require('fs/promises');
const { pool } = require('./connection');

async function setupDatabase() {
  const connection = await pool.getConnection();
  try {
    await connection.query('SELECT 1');

    const schemaPath = path.join(__dirname, 'schema.sql');
    try {
      const schemaSql = await fs.readFile(schemaPath, 'utf8');
      const statements = schemaSql
        .split(/;\s*(?:\r?\n|$)/)
        .map((statement) => statement.trim())
        .filter(Boolean);

      // Thuc thi tung cau lenh trong file schema theo thu tu.
      for (const statement of statements) {
        try {
          await connection.query(statement);
        } catch (error) {
          if (error.code === 'ER_TABLEACCESS_DENIED_ERROR' || error.code === 'ER_DBACCESS_DENIED_ERROR') {
            console.warn('Bo qua apply schema do thieu quyen tao bang:', error.message);
            break;
          }
          if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            continue;
          }
          throw error;
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  } finally {
    connection.release();
  }
}

module.exports = {
  setupDatabase,
};
