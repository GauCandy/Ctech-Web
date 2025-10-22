// Ghi chu: Xu ly truy van co so du lieu cho viec quan ly danh muc dich vu.
const { pool } = require('../../../../database/connection');
const { exportServicesCatalog } = require('../../../../database/serviceExporter');

const SERVICE_PREFIX = 'DV';
const SERVICE_CODE_PAD = 3;

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

// Chuyen doi gia ve dang so hop le hoac null.
function normalizePrice(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    return null;
  }
  return Number(num.toFixed(2));
}

// Phan tich gia tri active tu nhieu dinh dang khac nhau.
function parseActiveFlag(value) {
  if (value === undefined) {
    return null;
  }
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  if (value === null) {
    return null;
  }
  const str = String(value).trim().toLowerCase();
  if (!str) {
    return null;
  }
  if (str === '1' || str === 'true' || str === 'yes') {
    return 1;
  }
  if (str === '0' || str === 'false' || str === 'no') {
    return 0;
  }
  return null;
}

// Neu khong khai bao thi mac dinh active.
function normalizeActiveFlag(value) {
  const parsed = parseActiveFlag(value);
  return parsed === null ? 1 : parsed;
}

// Sinh ma dich vu moi dua tren tien to va so thu tu.
async function generateNextServiceCode(connection) {
  const [rows] = await connection.execute(
    'SELECT service_code FROM services WHERE service_code LIKE ? ORDER BY service_code DESC LIMIT 1',
    [`${SERVICE_PREFIX}%`]
  );

  let sequence = 0;
  if (rows.length) {
    const suffix = rows[0].service_code.slice(SERVICE_PREFIX.length);
    const parsed = parseInt(suffix, 10);
    if (!Number.isNaN(parsed)) {
      sequence = parsed;
    }
  }

  return `${SERVICE_PREFIX}${String(sequence + 1).padStart(SERVICE_CODE_PAD, '0')}`;
}

// Chuyen doi dong du lieu SQL sang doi tuong goi y.
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

// Chen dich vu moi, bao gom xu ly giao dich.
async function insertService({ name, description, category, price, activeFlag }) {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const serviceCode = await generateNextServiceCode(connection);

    await connection.execute(
      `INSERT INTO services (service_code, name, description, category, price, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [serviceCode, name, description, category || 'Khác', price, activeFlag]
    );

    await connection.commit();
    try {
      await exportServicesCatalog();
    } catch (exportError) {
      console.warn('Failed to refresh services catalog after insert:', exportError.message || exportError);
    }

    return {
      serviceCode,
      name,
      description,
      category: category || 'Khác',
      price,
      isActive: Boolean(activeFlag),
    };
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Failed to rollback transaction:', rollbackError);
      }
    }
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Cap nhat dich vu theo ma voi cac cot cho phep.
async function updateService(code, updates) {
  const assignments = [];
  const params = [];

  if (Object.prototype.hasOwnProperty.call(updates, 'name')) {
    assignments.push('name = ?');
    params.push(updates.name);
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'description')) {
    assignments.push('description = ?');
    params.push(updates.description);
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'category')) {
    assignments.push('category = ?');
    params.push(updates.category || 'Khác');
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'price')) {
    assignments.push('price = ?');
    params.push(updates.price);
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'image_url')) {
    assignments.push('image_url = ?');
    params.push(updates.image_url);
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'is_active')) {
    assignments.push('is_active = ?');
    params.push(updates.is_active);
  }

  if (!assignments.length) {
    return null;
  }

  params.push(code);
  const [result] = await pool.execute(
    `UPDATE services SET ${assignments.join(', ')} WHERE service_code = ?`,
    params
  );

  if (result.affectedRows === 0) {
    return null;
  }

  const [rows] = await pool.execute(`${SERVICE_SELECT_COLUMNS} WHERE service_code = ?`, [code]);
  const service = mapServiceRow(rows[0]);

  if (service) {
    try {
      await exportServicesCatalog();
    } catch (exportError) {
      console.warn('Failed to refresh services catalog after update:', exportError.message || exportError);
    }
  }

  return service;
}

// Xoa dich vu theo ma, tra ve true neu thanh cong.
async function deleteService(code) {
  const [result] = await pool.execute('DELETE FROM services WHERE service_code = ?', [code]);
  const success = result.affectedRows > 0;

  if (success) {
    try {
      await exportServicesCatalog();
    } catch (exportError) {
      console.warn('Failed to refresh services catalog after delete:', exportError.message || exportError);
    }
  }

  return success;
}

module.exports = {
  normalizePrice,
  parseActiveFlag,
  normalizeActiveFlag,
  insertService,
  updateService,
  deleteService,
};
