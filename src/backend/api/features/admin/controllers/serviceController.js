// Ghi chu: Cung cap cac handler HTTP cho viec quan ly dich vu tu phia admin.
const {
  insertService,
  updateService,
  deleteService,
  normalizePrice,
  normalizeActiveFlag,
} = require('../services/catalogService');

// Tao dich vu moi thong qua dich vu xu ly du lieu.
async function createService(req, res) {
  try {
    const body = req.body || {};

    // Validate required field
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return res.status(400).json({ error: 'Ten dich vu bat buoc.' });
    }

    // Normalize and prepare data
    const serviceData = {
      name: body.name.trim(),
      description: body.description ? String(body.description).trim() : null,
      category: body.category ? String(body.category).trim() : 'Khác',
      price: normalizePrice(body.price),
      activeFlag: normalizeActiveFlag(body.isActive),
    };

    console.log('[CREATE SERVICE] Du lieu dau vao:', JSON.stringify(serviceData, null, 2));
    const result = await insertService(serviceData);
    console.log('[CREATE SERVICE] Tao dich vu thanh cong:', result.serviceCode, '-', result.name);

    return res.status(201).json(result);
  } catch (error) {
    console.error('[CREATE SERVICE] Loi tao dich vu:', error);
    return res.status(error.status || 500).json({ error: error.message || 'Khong the tao dich vu.' });
  }
}

// Cap nhat chi tiet dich vu theo ma dich vu.
async function updateServiceDetails(req, res) {
  try {
    const code = String(req.params.code || '').trim();
    if (!code) {
      return res.status(400).json({ error: 'Ma dich vu bat buoc.' });
    }

    const body = req.body || {};
    const updates = {};

    // Only add fields that are provided
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || !body.name.trim()) {
        return res.status(400).json({ error: 'Ten dich vu khong hop le.' });
      }
      updates.name = body.name.trim();
    }

    if (body.description !== undefined) {
      updates.description = body.description ? String(body.description).trim() : null;
    }

    if (body.category !== undefined) {
      updates.category = body.category ? String(body.category).trim() : 'Khác';
    }

    if (body.price !== undefined) {
      updates.price = normalizePrice(body.price);
    }

    if (body.isActive !== undefined) {
      updates.is_active = normalizeActiveFlag(body.isActive);
    }

    console.log('[UPDATE SERVICE] Ma dich vu:', code, '- Du lieu cap nhat:', JSON.stringify(updates, null, 2));
    const updated = await updateService(code, updates);
    if (!updated) {
      console.log('[UPDATE SERVICE] Khong tim thay dich vu:', code);
      return res.status(404).json({ error: 'Khong tim thay dich vu.' });
    }

    console.log('[UPDATE SERVICE] Cap nhat thanh cong:', code);
    return res.json(updated);
  } catch (error) {
    console.error('[UPDATE SERVICE] Loi cap nhat dich vu:', error);
    return res.status(error.status || 500).json({ error: error.message || 'Khong the cap nhat dich vu.' });
  }
}

// Upload hinh anh cho dich vu.
async function uploadServiceImage(req, res) {
  try {
    const code = String(req.params.code || '').trim();
    if (!code) {
      return res.status(400).json({ error: 'Ma dich vu bat buoc.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Khong co file nao duoc upload.' });
    }

    // Đường dẫn tương đối từ root
    const imageUrl = `/uploads/services/${req.file.filename}`;

    // Cập nhật image_url vào database
    const updated = await updateService(code, { image_url: imageUrl });
    if (!updated) {
      return res.status(404).json({ error: 'Khong tim thay dich vu.' });
    }

    console.log('[UPLOAD IMAGE] Upload thanh cong:', code, '-', imageUrl);
    return res.json({
      imageUrl,
      message: 'Upload hinh anh thanh cong.'
    });
  } catch (error) {
    console.error('[UPLOAD IMAGE] Loi upload hinh anh:', error);
    return res.status(error.status || 500).json({ error: error.message || 'Khong the upload hinh anh.' });
  }
}

// Xoa dich vu theo ma.
async function removeService(req, res) {
  try {
    const code = String(req.params.code || '').trim();
    if (!code) {
      return res.status(400).json({ error: 'Ma dich vu bat buoc.' });
    }

    console.log('[DELETE SERVICE] Xoa dich vu:', code);
    const removed = await deleteService(code);
    if (!removed) {
      console.log('[DELETE SERVICE] Khong tim thay dich vu:', code);
      return res.status(404).json({ error: 'Khong tim thay dich vu.' });
    }

    console.log('[DELETE SERVICE] Xoa thanh cong:', code);
    return res.status(204).send();
  } catch (error) {
    console.error('[DELETE SERVICE] Loi xoa dich vu:', error);
    return res.status(error.status || 500).json({ error: error.message || 'Khong the xoa dich vu.' });
  }
}

module.exports = {
  createService,
  updateServiceDetails,
  uploadServiceImage,
  removeService,
};
