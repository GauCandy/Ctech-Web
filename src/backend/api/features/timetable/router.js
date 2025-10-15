const express = require('express');
const multer = require('multer');
const { parseTimetableUploadHandler } = require('./controllers/timetableController');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB
    files: 1,
  },
});

router.post('/parse', upload.single('file'), parseTimetableUploadHandler);

module.exports = {
  timetableRouter: router,
};
