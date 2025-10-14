const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const inputArg = process.argv[2];
let spreadsheetPath = inputArg
  ? path.resolve(process.cwd(), inputArg)
  : path.resolve(__dirname, '2025-2026.xlsx');

if (inputArg && !fs.existsSync(spreadsheetPath)) {
  const fallbackPath = path.resolve(__dirname, inputArg);
  if (fs.existsSync(fallbackPath)) {
    spreadsheetPath = fallbackPath;
  }
}

if (!fs.existsSync(spreadsheetPath)) {
  console.error('Khong tim thay file Excel can xu ly.');
  console.error('Cach dung: node export-excel.js [duong-dan-toi-file.xlsx]');
  process.exit(1);
}

const workbookBaseName =
  path.basename(spreadsheetPath, path.extname(spreadsheetPath)) || 'workbook';
const outputDir = path.dirname(spreadsheetPath);
const scheduleOutputPath = path.join(
  outputDir,
  `${workbookBaseName}.schedule.json`
);

const normalizeValue = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    if (value.result !== undefined) {
      return value.result;
    }
    if (value.text) {
      return value.text;
    }
    if (Array.isArray(value.richText)) {
      return value.richText.map((fragment) => fragment.text).join('');
    }
    if (value.hyperlink) {
      return value.text ?? value.hyperlink;
    }
  }

  return value;
};

const toStringValue = (value) => {
  const normalized = normalizeValue(value);
  if (normalized === null || normalized === undefined) {
    return null;
  }
  return String(normalized);
};

const cleanSingleLine = (value) => {
  if (!value) {
    return null;
  }

  const text = value
    .replace(/\u00a0/g, ' ')
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return text === '' ? null : text;
};

const cleanClassName = (value) => {
  const text = cleanSingleLine(value);
  if (!text) {
    return null;
  }
  return text.replace(/-\s+/g, '-');
};

const cleanMultiline = (value) => {
  if (!value) {
    return null;
  }

  const text = value
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');

  return text.length === 0 ? null : text;
};

const toSearchable = (text) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const normalizeDayLabel = (value) => {
  const text = cleanSingleLine(value);
  if (!text) {
    return null;
  }

  const search = toSearchable(text);

  if (search.includes('chu nhat')) {
    return 'Chu nhat';
  }

  const match = search.match(/thu\s*(\d+)/);
  if (match) {
    return `Thu ${match[1]}`;
  }

  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

const normalizePeriodLabel = (value) => {
  const text = cleanSingleLine(value);
  if (!text) {
    return null;
  }

  const match = toSearchable(text).match(/tiet\s*(\d+)/);
  if (match) {
    return `Tiet ${match[1]}`;
  }

  return text;
};

const findScheduleHeaderRow = (sheet) => {
  for (let rowNumber = 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const firstCell = cleanSingleLine(toStringValue(row.getCell(1).value));
    const secondCell = cleanSingleLine(toStringValue(row.getCell(2).value));
    const firstSearch = firstCell ? toSearchable(firstCell) : null;
    const secondSearch = secondCell ? toSearchable(secondCell) : null;

    if (
      firstSearch &&
      secondSearch &&
      firstSearch.includes('ten lop') &&
      secondSearch.includes('buoi')
    ) {
      return rowNumber;
    }
  }

  return null;
};

const buildScheduleForSheet = (sheet) => {
  const headerRowIndex = findScheduleHeaderRow(sheet);
  if (!headerRowIndex || headerRowIndex + 2 > sheet.rowCount) {
    return null;
  }

  const dayRow = sheet.getRow(headerRowIndex);
  const periodRow = sheet.getRow(headerRowIndex + 2);
  const columnMappings = [];
  const dayPeriods = new Map();

  for (let col = 3; col <= sheet.columnCount; col += 1) {
    const day = normalizeDayLabel(toStringValue(dayRow.getCell(col).value));
    const period = normalizePeriodLabel(
      toStringValue(periodRow.getCell(col).value)
    );

    if (!day || !period) {
      continue;
    }

    columnMappings.push({ column: col, day, period });

    if (!dayPeriods.has(day)) {
      dayPeriods.set(day, []);
    }
    const periods = dayPeriods.get(day);
    if (!periods.includes(period)) {
      periods.push(period);
    }
  }

  if (columnMappings.length === 0) {
    return null;
  }

  const schedule = {};
  const dataStartRow = headerRowIndex + 3;

  for (
    let rowNumber = dataStartRow;
    rowNumber <= sheet.rowCount;
    rowNumber += 1
  ) {
    const row = sheet.getRow(rowNumber);
    const className = cleanClassName(toStringValue(row.getCell(1).value));
    const session = cleanSingleLine(toStringValue(row.getCell(2).value));

    if (!className || !session) {
      continue;
    }

    const cellValues = columnMappings.map(({ column }) =>
      cleanMultiline(toStringValue(row.getCell(column).value))
    );
    const hasScheduleData = cellValues.some((value) => value !== null);

    if (!hasScheduleData) {
      continue;
    }

    if (!schedule[className]) {
      schedule[className] = {};
    }

    if (!schedule[className][session]) {
      schedule[className][session] = {};
      dayPeriods.forEach((periods, day) => {
        schedule[className][session][day] = {};
        periods.forEach((period) => {
          schedule[className][session][day][period] = null;
        });
      });
    }

    columnMappings.forEach(({ day, period }, idx) => {
      const value = cellValues[idx];
      if (value === null) {
        return;
      }

      const current = schedule[className][session][day][period];
      if (current === null) {
        schedule[className][session][day][period] = value;
      } else if (current === value) {
        return;
      } else if (Array.isArray(current)) {
        if (!current.includes(value)) {
          current.push(value);
        }
      } else {
        schedule[className][session][day][period] = [current, value];
      }
    });
  }

  return Object.keys(schedule).length > 0 ? schedule : null;
};

(async () => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(spreadsheetPath);

  const scheduleBySheet = {};

  workbook.eachSheet((sheet) => {
    const structuredSchedule = buildScheduleForSheet(sheet);
    if (structuredSchedule) {
      scheduleBySheet[sheet.name] = structuredSchedule;
    }
  });

  if (Object.keys(scheduleBySheet).length === 0) {
    console.warn(
      'Khong tim thay du lieu thoi khoa bieu phu hop trong workbook.'
    );
    return;
  }

  const scheduleOutput = {
    workbook: path.basename(spreadsheetPath),
    generatedAt: new Date().toISOString(),
    sheets: scheduleBySheet,
  };

  fs.writeFileSync(scheduleOutputPath, JSON.stringify(scheduleOutput, null, 2), {
    encoding: 'utf8',
  });

  console.log(`Da xuat: ${path.basename(scheduleOutputPath)}`);
})().catch((error) => {
  console.error('Khong doc duoc file Excel:', error);
  process.exitCode = 1;
});
