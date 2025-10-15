const { TimetableParserError, parseTimetablePdfBuffer } = require('../services/timetableParserService');

const isPdfMimeType = (mimeType) => {
  if (!mimeType) {
    return true;
  }
  const normalized = mimeType.toLowerCase();
  return (
    normalized === 'application/pdf' ||
    normalized === 'application/octet-stream'
  );
};

const parseTimetableUploadHandler = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer || req.file.size === 0) {
      return res.status(400).json({ error: 'Vui lòng tải lên một file PDF hợp lệ.' });
    }

    if (!isPdfMimeType(req.file.mimetype)) {
      return res.status(415).json({ error: 'Chỉ hỗ trợ định dạng PDF.' });
    }

    const schedule = await parseTimetablePdfBuffer(req.file.buffer, {
      originalName: req.file.originalname,
    });

    if (!schedule) {
      return res.status(422).json({ error: 'Không tìm thấy dữ liệu thời khóa biểu trong file PDF.' });
    }

    return res.json(schedule);
  } catch (error) {
    if (error instanceof TimetableParserError || error.name === 'TimetableParserError') {
      const statusCode = error.statusCode || 500;
      if (statusCode >= 500) {
        console.error('Lỗi xử lý thời khóa biểu:', error);
        return res.status(statusCode).json({ error: 'Không thể xử lý file thời khóa biểu.' });
      }

      const payload = { error: error.message };
      if (error.details) {
        payload.details = error.details;
      }
      return res.status(statusCode).json(payload);
    }
    return next(error);
  }
};

module.exports = {
  parseTimetableUploadHandler,
};
