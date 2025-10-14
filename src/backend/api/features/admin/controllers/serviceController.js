// Ghi chu: Cung cap cac handler HTTP cho viec quan ly dich vu tu phia admin.
const {
  insertService,
  updateService,
  deleteService,
} = require('../services/catalogService');

// Tao dich vu moi thong qua dich vu xu ly du lieu.
async function createService(req, res) {
  try {
    const result = await insertService(req.body || {});
    return res.status(201).json(result);
  } catch (error) {
    console.error('Loi tao dich vu:', error);
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

    const updated = await updateService(code, req.body || {});
    if (!updated) {
      return res.status(404).json({ error: 'Khong tim thay dich vu.' });
    }

    return res.json(updated);
  } catch (error) {
    console.error('Loi cap nhat dich vu:', error);
    return res.status(error.status || 500).json({ error: error.message || 'Khong the cap nhat dich vu.' });
  }
}

// Xoa dich vu theo ma.
async function removeService(req, res) {
  try {
    const code = String(req.params.code || '').trim();
    if (!code) {
      return res.status(400).json({ error: 'Ma dich vu bat buoc.' });
    }

    const removed = await deleteService(code);
    if (!removed) {
      return res.status(404).json({ error: 'Khong tim thay dich vu.' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Loi xoa dich vu:', error);
    return res.status(error.status || 500).json({ error: error.message || 'Khong the xoa dich vu.' });
  }
}

module.exports = {
  createService,
  updateServiceDetails,
  removeService,
};
