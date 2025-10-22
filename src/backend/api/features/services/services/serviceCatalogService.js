// Ghi chu: Cac ham lay danh sach dich vu phuc vu API dich vu cong khai.
const { pool } = require('../../../../database/connection');

const SERVICE_SELECT_COLUMNS = `SELECT service_code AS code,
       name,
       description,
       category,
       price,
       image_url AS imageUrl,
       is_active AS isActive,
       created_at AS createdAt,
       updated_at AS updatedAt
     FROM services`;

// Chuyen doi dong du lieu sang doi tuong dich vu.
function mapServiceRow(row) {
  if (!row) {
    return null;
  }

  return {
    serviceCode: row.code,
    name: row.name,
    description: row.description ?? null,
    category: row.category ?? 'Khác',
    price: row.price !== undefined && row.price !== null ? Number(row.price) : null,
    imageUrl: row.imageUrl ?? null,
    isActive: Boolean(row.isActive),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// Chuan hoa bo loc trang thai active.
function normalizeActiveFilter(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const str = String(value).trim().toLowerCase();
  if (!str) {
    return null;
  }

  if (str === '1' || str === 'true') {
    return 1;
  }

  if (str === '0' || str === 'false') {
    return 0;
  }

  return null;
}

// Tra ve danh sach dich vu kem theo cac bo loc co ban.
async function listServices({ searchTerm, activeFilter, category } = {}) {
  try {
    const conditions = [];
    const params = [];

    const normalizedActive = normalizeActiveFilter(activeFilter);
    if (normalizedActive !== null) {
      conditions.push('is_active = ?');
      params.push(normalizedActive);
    }

    if (category && category.trim()) {
      conditions.push('category = ?');
      params.push(category.trim());
    }

    if (searchTerm) {
      const like = `%${searchTerm.trim()}%`;
      conditions.push('(service_code LIKE ? OR name LIKE ? OR description LIKE ?)');
      params.push(like, like, like);
    }

    let sql = `${SERVICE_SELECT_COLUMNS}`;

    if (conditions.length) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ' ORDER BY category ASC, service_code ASC';

    const [rows] = await pool.execute(sql, params);
    return rows.map(mapServiceRow);
  } catch (error) {
    console.error('Error listing services:', error);
    throw new Error('Failed to retrieve services list: ' + error.message);
  }
}

// Lay thong tin mot dich vu theo ma.
async function getServiceByCode(code) {
  try {
    const [rows] = await pool.execute(
      `${SERVICE_SELECT_COLUMNS} WHERE service_code = ?`,
      [code]
    );

    if (!rows.length) {
      return null;
    }

    return mapServiceRow(rows[0]);
  } catch (error) {
    console.error('Error getting service by code:', error);
    throw new Error('Failed to retrieve service: ' + error.message);
  }
}

// Lay danh sach tat ca cac danh muc dich vu hien co.
async function listCategories() {
  try {
    const sql = `SELECT DISTINCT category
                 FROM services
                 WHERE is_active = 1 AND category IS NOT NULL
                 ORDER BY category ASC`;

    const [rows] = await pool.execute(sql);
    return rows.map(row => row.category);
  } catch (error) {
    console.error('Error listing categories:', error);
    throw new Error('Failed to retrieve categories: ' + error.message);
  }
}

module.exports = {
  listServices,
  getServiceByCode,
  listCategories,
  mapServiceRow,
};
