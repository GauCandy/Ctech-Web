const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { promisify } = require('util');
const { execFile } = require('child_process');

const execFileAsync = promisify(execFile);

const PROJECT_ROOT = path.resolve(__dirname, '../../../../../..');
const PDF_SCRIPT_PATH = path.join(PROJECT_ROOT, 'pdf.js');
const PDF_SCRIPT_DIR = path.dirname(PDF_SCRIPT_PATH);

class TimetableParserError extends Error {
  constructor(message, statusCode = 500, details) {
    super(message);
    this.name = 'TimetableParserError';
    this.statusCode = statusCode;
    if (details) {
      this.details = details;
    }
  }
}

const ensurePdfScriptExists = async () => {
  try {
    await fs.access(PDF_SCRIPT_PATH);
  } catch (error) {
    throw new TimetableParserError(
      'Không tìm thấy trình phân tích thời khóa biểu (pdf.js).',
      500,
      { cause: error }
    );
  }
};

const createTempPdfFile = async (buffer, originalName) => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ttb-'));
  const parsedName = path.parse(originalName ?? 'uploaded');
  const safeStem =
    parsedName.name && parsedName.name.trim().length > 0
      ? parsedName.name.replace(/[^\w.-]+/g, '_')
      : 'uploaded';
  const uniqueSuffix = crypto.randomUUID();
  const fileName = `${safeStem}-${uniqueSuffix}.pdf`;
  const filePath = path.join(tempDir, fileName);
  await fs.writeFile(filePath, buffer);
  return { tempDir, filePath };
};

const removeTempDirSafe = async (dirPath) => {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch (error) {
    // Ignore cleanup failures to avoid masking the core error.
    console.warn('Không thể xóa thư mục tạm:', error);
  }
};

const parseTimetablePdfBuffer = async (buffer, { originalName } = {}) => {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new TimetableParserError(
      'Dữ liệu PDF không hợp lệ.',
      400
    );
  }

  await ensurePdfScriptExists();

  const { tempDir, filePath } = await createTempPdfFile(buffer, originalName);
  const outputJsonPath = path.join(
    tempDir,
    `${path.basename(filePath, path.extname(filePath))}.schedule.json`
  );

  try {
    const execResult = await execFileAsync(
      process.execPath,
      [PDF_SCRIPT_PATH, filePath],
      { cwd: PDF_SCRIPT_DIR, timeout: 60_000 }
    ).catch((error) => {
      const stderr = error.stderr ? error.stderr.toString() : '';
      const stdout = error.stdout ? error.stdout.toString() : '';
      throw new TimetableParserError(
        'Không thể xử lý file thời khóa biểu.',
        500,
        {
          exitCode: error.code,
          stdout,
          stderr,
          cause: error,
        }
      );
    });

    const stdout = execResult?.stdout ? execResult.stdout.toString() : '';
    const stderr = execResult?.stderr ? execResult.stderr.toString() : '';

    let rawJson;
    try {
      rawJson = await fs.readFile(outputJsonPath, 'utf8');
    } catch (error) {
      throw new TimetableParserError(
        'Không tìm thấy dữ liệu thời khóa biểu trong file PDF.',
        422,
        {
          stdout,
          stderr,
        }
      );
    }

    try {
      const schedule = JSON.parse(rawJson);
      return schedule;
    } catch (error) {
      throw new TimetableParserError(
        'Dữ liệu thời khóa biểu tạo ra không hợp lệ.',
        500,
        {
          stdout,
          stderr,
          cause: error,
        }
      );
    }
  } finally {
    await removeTempDirSafe(tempDir);
  }
};

module.exports = {
  TimetableParserError,
  parseTimetablePdfBuffer,
};
