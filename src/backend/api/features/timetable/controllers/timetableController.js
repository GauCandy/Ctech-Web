const { TimetableParserError, parseTimetablePdfBuffer } = require('../services/timetableParserService');
const { pool } = require('../../../../database/connection');
const crypto = require('crypto');

// Generate random share ID
function generateShareId() {
  return crypto.randomBytes(6).toString('hex'); // 12 characters
}

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

// Share schedule handler
const shareScheduleHandler = async (req, res, next) => {
  try {
    const { scheduleData, fileName } = req.body;

    if (!scheduleData) {
      return res.status(400).json({ error: 'Thiếu dữ liệu thời khóa biểu.' });
    }

    // Generate unique share ID
    let shareId = generateShareId();
    let connection;

    try {
      connection = await pool.getConnection();

      // Check if shareId already exists (very unlikely but just in case)
      let attempts = 0;
      while (attempts < 5) {
        const [existing] = await connection.query(
          'SELECT share_id FROM shared_schedules WHERE share_id = ?',
          [shareId]
        );

        if (existing.length === 0) {
          break;
        }

        shareId = generateShareId();
        attempts++;
      }

      // Insert into database
      await connection.query(
        'INSERT INTO shared_schedules (share_id, schedule_data, file_name) VALUES (?, ?, ?)',
        [shareId, JSON.stringify(scheduleData), fileName || null]
      );

      return res.json({
        success: true,
        shareId,
        shareUrl: `/schedule?share=${shareId}`
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    console.error('Error sharing schedule:', error);
    return next(error);
  }
};

// Get shared schedule handler
const getSharedScheduleHandler = async (req, res, next) => {
  try {
    const { shareId } = req.params;

    if (!shareId) {
      return res.status(400).json({ error: 'Thiếu mã chia sẻ.' });
    }

    let connection;

    try {
      connection = await pool.getConnection();

      const [rows] = await connection.query(
        'SELECT schedule_data, file_name, created_at FROM shared_schedules WHERE share_id = ?',
        [shareId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Không tìm thấy thời khóa biểu được chia sẻ.' });
      }

      const schedule = rows[0];

      // Update view count and last viewed
      await connection.query(
        'UPDATE shared_schedules SET view_count = view_count + 1, last_viewed_at = NOW() WHERE share_id = ?',
        [shareId]
      );

      // Parse JSON data
      let scheduleData;
      try {
        scheduleData = typeof schedule.schedule_data === 'string'
          ? JSON.parse(schedule.schedule_data)
          : schedule.schedule_data;
      } catch (parseError) {
        console.error('Error parsing schedule data:', parseError);
        return res.status(500).json({ error: 'Dữ liệu thời khóa biểu bị lỗi.' });
      }

      return res.json({
        scheduleData,
        fileName: schedule.file_name,
        sharedAt: schedule.created_at
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    console.error('Error getting shared schedule:', error);
    return next(error);
  }
};

module.exports = {
  parseTimetableUploadHandler,
  shareScheduleHandler,
  getSharedScheduleHandler,
};
