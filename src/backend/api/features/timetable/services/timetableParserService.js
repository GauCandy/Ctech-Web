// ugh miễn nó còn chạy thì đừng động vào

const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// Debug mode - set to true to output JSON files to debug folder
const DEBUG_MODE = process.env.DEBUG === 'true';
const DEBUG_DIR = path.join(__dirname, '../../../../../../debug');

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

// Utility functions
const removeDiacritics = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');

const toPlainLower = (value = '') => removeDiacritics(value).toLowerCase();

const normalizeText = (value = '') =>
  removeDiacritics(value)
    .replace(/[^\w\s-/]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const extractNumbers = (value = '') =>
  value
    .split(/[^0-9]+/)
    .map((part) => Number.parseInt(part, 10))
    .filter(Number.isFinite);

const uniqueSortedNumbers = (numbers) =>
  Array.from(new Set(numbers)).sort((a, b) => a - b);

const expandWeekRange = (start, end) => {
  if (!Number.isFinite(start)) {
    return [];
  }
  if (!Number.isFinite(end)) {
    return [start];
  }
  const length = Math.max(0, end - start) + 1;
  return Array.from({ length }, (_, idx) => start + idx);
};

const parseWeekRange = (plain) => {
  if (!plain) {
    return null;
  }

  const rangeMatch = plain.match(/tuan\s*(\d+)\s*[-~–]\s*(\d+)/);
  if (rangeMatch) {
    const start = Number.parseInt(rangeMatch[1], 10);
    const end = Number.parseInt(rangeMatch[2], 10);
    return {
      start,
      end,
      weeks: expandWeekRange(start, end),
    };
  }

  const listMatch = plain.match(/tuan\s*((?:\d+\s*,\s*)+\d+)/);
  if (listMatch) {
    const weeks = uniqueSortedNumbers(
      listMatch[1]
        .split(',')
        .map((part) => Number.parseInt(part.trim(), 10))
        .filter(Number.isFinite)
    );
    if (weeks.length > 0) {
      return {
        start: weeks[0],
        end: weeks[weeks.length - 1],
        weeks,
      };
    }
  }

  const singleMatch = plain.match(/tuan\s*(\d+)/);
  if (singleMatch) {
    const week = Number.parseInt(singleMatch[1], 10);
    return {
      start: week,
      end: week,
      weeks: [week],
    };
  }

  return null;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const toIsoDateString = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDaysUtc = (date, days) =>
  new Date(date.getTime() + days * DAY_IN_MS);

const formatDayLabel = (label) => {
  const normalized = normalizeText(label).replace(/\s+/g, '');
  if (normalized.startsWith('thu')) {
    return `Thu ${normalized.replace('thu', '')}`;
  }
  if (normalized === 'chunhat') {
    return 'CN';
  }
  return label.trim();
};

const isSessionLabel = (text) => {
  const normalized = normalizeText(text);
  return normalized === 'sang' || normalized === 'chieu' || normalized === 'toi';
};

const isClassCandidate = (item, tableLeftEdge) => {
  if (item.x >= tableLeftEdge - 5) {
    return false;
  }

  const raw = item.raw.trim();
  if (!raw) {
    return false;
  }

  const normalized = normalizeText(raw).replace(/\s+/g, '');

  if (!/[a-z]/i.test(normalized) || !/\d/.test(normalized)) {
    return false;
  }

  if (
    normalized.includes('sang') ||
    normalized.includes('chieu') ||
    normalized.includes('toi') ||
    normalized.includes('tenlop') ||
    normalized.includes('buoi')
  ) {
    return false;
  }

  if (normalized.startsWith('tuan') || normalized.startsWith('ngay')) {
    return false;
  }

  return raw.length <= 30;
};

const loadPdfModule = async () =>
  import('pdfjs-dist/legacy/build/pdf.mjs').then((mod) => mod);

const toContentItems = (textContent) =>
  textContent.items
    .map((item) => ({
      raw: item.str || '',
      text: (item.str || '').trim(),
      x: item.transform[4],
      y: item.transform[5],
      width: item.width ?? 0,
    }))
    .filter((item) => item.raw && item.raw.trim().length > 0);

const buildDayLayout = (items) => {
  const periodItems = items
    .filter((item) => /^tiet\s*\d+$/.test(normalizeText(item.raw)))
    .sort((a, b) => a.x - b.x);

  if (periodItems.length === 0) {
    throw new TimetableParserError('Không tìm thấy thông tin tiết trong file PDF.', 422);
  }

  const dayGroups = [];
  let currentGroup = null;

  periodItems.forEach((item) => {
    const match = item.raw.match(/\d+/);
    if (!match) {
      return;
    }

    const periodNumber = Number.parseInt(match[0], 10);
    const width = item.width ?? 0;
    const center = item.x + width / 2;

    if (periodNumber === 1 || !currentGroup) {
      currentGroup = {
        periods: [],
        centers: [],
      };
      dayGroups.push(currentGroup);
    }

    currentGroup.periods.push({
      number: periodNumber,
      center,
      left: item.x,
      right: item.x + width,
    });
    currentGroup.centers.push(center);
  });

  const edgesForCenters = (centers) => {
    const edges = [];
    if (centers.length === 0) {
      return edges;
    }

    if (centers.length === 1) {
      const delta = 10;
      edges.push(centers[0] - delta);
      edges.push(centers[0] + delta);
      return edges;
    }

    const deltas = centers.map((value, index) => {
      if (index === 0) {
        return centers[1] - centers[0];
      }
      return centers[index] - centers[index - 1];
    });

    edges.push(centers[0] - deltas[0] / 2);
    for (let i = 1; i < centers.length; i += 1) {
      edges.push((centers[i - 1] + centers[i]) / 2);
    }
    edges.push(
      centers[centers.length - 1] +
        (centers[centers.length - 1] - centers[centers.length - 2]) / 2
    );

    return edges;
  };

  const dayHeaders = items
    .filter((item) => {
      const normalized = normalizeText(item.raw);
      return /^thu\s*\d$/.test(normalized) || normalized === 'chunhat';
    })
    .sort((a, b) => a.x - b.x);

  dayGroups.forEach((group, index) => {
    group.edges = edgesForCenters(group.centers);
    group.leftEdge = group.edges[0];
    group.rightEdge = group.edges[group.edges.length - 1];
    const header = dayHeaders[index];
    group.name = header ? formatDayLabel(header.raw) : `Day ${index + 1}`;
  });

  const periodRowY =
    periodItems.reduce((sum, item) => sum + item.y, 0) / periodItems.length;

  const dayPeriodOrder = {};
  dayGroups.forEach((group) => {
    dayPeriodOrder[group.name] = group.periods.map(
      (period) => `Tiet ${period.number}`
    );
  });

  return {
    dayGroups,
    dayPeriodOrder,
    periodRowY,
    tableLeftEdge: dayGroups[0]?.leftEdge ?? 0,
  };
};

const segmentByRange = (anchors) => {
  const sorted = anchors.slice().sort((a, b) => b.y - a.y);
  return sorted.map((entry, index) => {
    const previous = sorted[index - 1];
    const next = sorted[index + 1];
    const top =
      index === 0 ? Number.POSITIVE_INFINITY : (previous.y + entry.y) / 2;
    const bottom =
      index === sorted.length - 1
        ? Number.NEGATIVE_INFINITY
        : (entry.y + next.y) / 2;

    return {
      name: entry.name,
      anchor: entry,
      top,
      bottom,
    };
  });
};

const groupLinesIntoBlocks = (lines) => {
  const sorted = lines.slice().sort((a, b) => b.y - a.y);
  const groups = [];
  const GAP_THRESHOLD = 6;

  let currentGroup = null;

  sorted.forEach((line) => {
    if (!currentGroup || currentGroup.lastY - line.y > GAP_THRESHOLD) {
      currentGroup = {
        lines: [],
        lastY: line.y,
        minX: line.x,
        maxX: line.x + line.width,
        minY: line.y,
        maxY: line.y,
      };
      groups.push(currentGroup);
    }

    currentGroup.lines.push(line);
    currentGroup.lastY = line.y;
    currentGroup.minX = Math.min(currentGroup.minX, line.x);
    currentGroup.maxX = Math.max(currentGroup.maxX, line.x + line.width);
    currentGroup.minY = Math.min(currentGroup.minY, line.y);
    currentGroup.maxY = Math.max(currentGroup.maxY, line.y);
  });

  return groups.map((group) => {
    const orderedLines = group.lines.slice().sort((a, b) => b.y - a.y);
    const text = orderedLines.map((line) => line.raw.trim()).join('\n');
    return {
      text,
      lines: orderedLines.map((line) => line.raw.trim()),
      bounds: {
        minX: group.minX,
        maxX: group.maxX,
        minY: group.minY,
        maxY: group.maxY,
      },
    };
  });
};

const parseDateMatchToUtc = (match) => {
  if (!match) {
    return null;
  }

  const day = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const year = Number.parseInt(match[3], 10);

  if (
    !Number.isFinite(day) ||
    !Number.isFinite(month) ||
    !Number.isFinite(year)
  ) {
    return null;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const utcDate = new Date(Date.UTC(year, month - 1, day));

  if (
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() !== month - 1 ||
    utcDate.getUTCDate() !== day
  ) {
    return null;
  }

  return utcDate;
};

const parseLessonBlock = (text) => {
  if (!text) {
    return { raw: '' };
  }

  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const result = {
    raw: text,
  };

  const notes = [];
  const rooms = new Set();
  const roomAssignments = [];
  const weeksOff = new Set();
  const weekPeriodAdjustments = [];
  let weeks = null;
  let dates = null;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    const plain = toPlainLower(trimmed);
    let handled = false;
    let noteCandidate = false;

    if (!result.subject && plain.includes('tiet')) {
      const subjectMatch = trimmed.match(
        /^([\p{L}]{1,5}\s?\d{1,3})\.?\s*(.+)$/u
      );

      if (subjectMatch) {
        const code = subjectMatch[1].replace(/\s+/g, '').toUpperCase();
        let name = subjectMatch[2].trim();
        let hours = null;

        const plainName = toPlainLower(name);
        const hoursPlainMatch = plainName.match(/\((\d+)\s*tiet\)/);
        if (hoursPlainMatch) {
          hours = Number.parseInt(hoursPlainMatch[1], 10);
          const hoursTextMatch = name.match(/\([^)]*\)/);
          if (hoursTextMatch) {
            name = name.replace(hoursTextMatch[0], '').trim();
          }
        }

        result.subject = {
          code,
          name,
        };

        if (Number.isFinite(hours)) {
          result.subject.hours = hours;
        }

        handled = true;
        return;
      }
    }

    if (!result.teacher) {
      const teacherMatch = trimmed.match(/^GV[:：]?\s*(.+)$/i);
      if (teacherMatch) {
        result.teacher = teacherMatch[1].trim();
        handled = true;
        return;
      }

      if (/^[\p{L}\s.'-]+$/u.test(trimmed) && /\s/u.test(trimmed)) {
        result.teacher = trimmed;
        handled = true;
        return;
      }
    }

    if (plain.includes('nghi')) {
      noteCandidate = true;
      const nghIndex = plain.indexOf('nghi');
      const offText = nghIndex >= 0 ? plain.slice(nghIndex) : plain;

      // Extract all week numbers first
      const allWeekNumbers = extractNumbers(offText);

      if (DEBUG_MODE) {
        console.log('[DEBUG] Week off parsing:', {
          originalText: trimmed,
          normalizedText: plain,
          offText,
          allWeekNumbers
        });
      }

      if (allWeekNumbers.length >= 2) {
        // Check if there's a range pattern between first and last number
        // Look for pattern: "tuan <num1> <separator> <num2>"
        const firstNum = allWeekNumbers[0];
        const lastNum = allWeekNumbers[allWeekNumbers.length - 1];

        // Find the text between first and last number
        const firstNumIndex = offText.indexOf(String(firstNum));
        const lastNumIndex = offText.lastIndexOf(String(lastNum));

        if (firstNumIndex !== -1 && lastNumIndex !== -1 && lastNumIndex > firstNumIndex) {
          const betweenText = offText.substring(firstNumIndex + String(firstNum).length, lastNumIndex);

          if (DEBUG_MODE) {
            console.log('[DEBUG] Between text analysis:', {
              firstNum,
              lastNum,
              betweenText,
              hasDen: /den|đến/i.test(betweenText),
              hasCommaOrAnd: /,|va|và|and/i.test(betweenText)
            });
          }

          // Normalize between text to remove all special chars
          const normalizedBetween = toPlainLower(betweenText);

          // Check if "den" exists in between (indicating RANGE)
          // After normalization: "đến" → "den" (đ→d, ế→e, n→n)
          const hasDen = /\bden\b/i.test(normalizedBetween);
          const hasCommaOrAnd = /,|va|and/i.test(normalizedBetween);

          if (DEBUG_MODE) {
            console.log('[DEBUG] Normalized between:', normalizedBetween);
          }

          if (hasDen) {
            // CONTINUOUS RANGE: 10 đến 13 => [10, 11, 12, 13]
            const weeks = expandWeekRange(firstNum, lastNum);
            weeks.forEach((week) => weeksOff.add(week));
            if (DEBUG_MODE) {
              console.log('[DEBUG] Detected RANGE (has "den"):', Array.from(weeks));
            }
            handled = true;
          } else if (hasCommaOrAnd) {
            // DISCRETE LIST: 10 và 13 => [10, 13] only
            allWeekNumbers.forEach((num) => weeksOff.add(num));
            if (DEBUG_MODE) {
              console.log('[DEBUG] Detected DISCRETE:', allWeekNumbers);
            }
            handled = true;
          } else {
            // Ambiguous - default to all numbers found
            allWeekNumbers.forEach((num) => weeksOff.add(num));
            if (DEBUG_MODE) {
              console.log('[DEBUG] AMBIGUOUS - using all numbers:', allWeekNumbers);
            }
            handled = true;
          }
        } else {
          // Can't find both numbers in text - just add all
          allWeekNumbers.forEach((num) => weeksOff.add(num));
          handled = true;
        }
      } else if (allWeekNumbers.length === 1) {
        // Single week off
        weeksOff.add(allWeekNumbers[0]);
        handled = true;
      }
    }

    if (plain.startsWith('tuan')) {
      handled = true;
      const isPeriodAdjustment = plain.includes('hoc');
      const range = parseWeekRange(plain);

      if (range && !isPeriodAdjustment) {
        if (!weeks) {
          weeks = range;
        } else {
          const combinedList = uniqueSortedNumbers([
            ...(weeks.weeks ?? []),
            ...(range.weeks ?? []),
          ]);
          const start =
            weeks.start === undefined
              ? range.start
              : Math.min(weeks.start, range.start);
          const end =
            weeks.end === undefined
              ? range.end
              : Math.max(weeks.end, range.end);
          weeks = {
            start,
            end,
            weeks: combinedList.length > 0 ? combinedList : undefined,
          };
        }
      }

      const dateMatch = trimmed.match(
        /(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s*[-~-]\s*(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/
      );
      if (dateMatch) {
        dates = {
          start: dateMatch[1],
          end: dateMatch[2],
        };
      }

      const residual = plain
        .replace(/tuan/g, '')
        .replace(/[\d\s,;~–-]/g, '')
        .trim();
      if (residual.length > 0) {
        noteCandidate = true;
      }
    }

    const periodAdjustmentMatch = plain.match(
      /tuan\s*(\d+)\s*hoc\s*(\d+)\s*tiet/
    );
    if (periodAdjustmentMatch) {
      const week = Number.parseInt(periodAdjustmentMatch[1], 10);
      const periods = Number.parseInt(periodAdjustmentMatch[2], 10);
      if (Number.isFinite(week) && Number.isFinite(periods)) {
        weekPeriodAdjustments.push({ week, periods });
        handled = true;
      }
    }

    const lowerTrimmed = toPlainLower(trimmed);
    const likelyRoomLine =
      /^p[\s.\d-]/i.test(trimmed) || lowerTrimmed.startsWith('phong ');

    if (likelyRoomLine) {
      const roomRangeMatch = trimmed.match(/^(.*?)(?:\s*\(([^)]+)\))$/);
      if (roomRangeMatch) {
        const roomName = roomRangeMatch[1].trim();
        const rangePlain = toPlainLower(roomRangeMatch[2] || '');
        const range = parseWeekRange(rangePlain);

        if (roomName) {
          if (range) {
            roomAssignments.push({
              room: roomName,
              weekStart: range.start,
              weekEnd: range.end,
            });
          } else {
            rooms.add(roomName);
          }
          handled = true;
          return;
        }
      } else {
        rooms.add(trimmed);
        handled = true;
        return;
      }
    } else if (/(^|\b)P\.\s*/i.test(trimmed) || /phong/i.test(plain)) {
      rooms.add(trimmed);
      handled = true;
      return;
    }

    if (noteCandidate || !handled) {
      notes.push(trimmed);
    }
  });

  const lesson = {
    raw: text,
  };

  if (result.subject) {
    lesson.subject = result.subject;
  }

  if (result.teacher) {
    lesson.teacher = result.teacher;
  }

  if (weeks) {
    lesson.weeks = weeks;
  }

  if (weekPeriodAdjustments.length > 0) {
    lesson.weekPeriods = weekPeriodAdjustments;
  }

  const offWeeks = uniqueSortedNumbers(Array.from(weeksOff));
  if (offWeeks.length > 0) {
    lesson.weeksOff = offWeeks;
  }

  if (dates) {
    lesson.dates = dates;
  }

  const roomList = Array.from(rooms);
  if (roomList.length > 0) {
    if (roomList.length === 1) {
      lesson.room = roomList[0];
    } else {
      lesson.rooms = roomList;
    }
  }

  if (roomAssignments.length > 0) {
    lesson.roomAssignments = roomAssignments;
  }

  const uniqueNotes = Array.from(new Set(notes));
  if (uniqueNotes.length > 0) {
    lesson.notes = uniqueNotes;
  }

  return lesson;
};

const toTextArray = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
      .filter((entry) => entry.length > 0);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  return [];
};

const buildDayEntries = async (periodOrder, periodMap) => {
  const periods =
    Array.isArray(periodOrder) && periodOrder.length > 0
      ? periodOrder
      : Object.keys(periodMap);

  const groups = [];
  let activeGroups = new Map();

  periods.forEach((periodLabel, index) => {
    const texts = toTextArray(periodMap[periodLabel]);
    const nextActive = new Map();

    texts.forEach((text) => {
      const existing = activeGroups.get(text);
      if (existing) {
        existing.endIndex = index;
        nextActive.set(text, existing);
      } else {
        const group = {
          text,
          startIndex: index,
          endIndex: index,
        };
        groups.push(group);
        nextActive.set(text, group);
      }
    });

    activeGroups = nextActive;
  });

  return groups.map((group) => {
    const subset = periods.slice(group.startIndex, group.endIndex + 1);
    const parsed = parseLessonBlock(group.text);

    const entry = {
      startPeriod: subset[0],
      endPeriod: subset[subset.length - 1],
      periods: subset,
      raw: parsed.raw,
    };

    if (parsed.subject) {
      entry.subject = parsed.subject;
    }
    if (parsed.teacher) {
      entry.teacher = parsed.teacher;
    }
    if (parsed.weeks) {
      entry.weeks = parsed.weeks;
    }
    if (parsed.weeksOff) {
      entry.weeksOff = parsed.weeksOff;
    }
    if (parsed.dates) {
      entry.dates = parsed.dates;
    }
    if (parsed.room) {
      entry.room = parsed.room;
    }
    if (parsed.rooms) {
      entry.rooms = parsed.rooms;
    }
    if (parsed.roomAssignments) {
      entry.roomAssignments = parsed.roomAssignments;
    }
    if (parsed.weekPeriods) {
      entry.weekPeriods = parsed.weekPeriods;
    }
    if (parsed.notes) {
      entry.notes = parsed.notes;
    }

    return entry;
  });
};

const computeWeekAnchors = (startDateUtc, weekRange) => {
  if (
    !startDateUtc ||
    !weekRange ||
    !Number.isFinite(weekRange.start) ||
    !Number.isFinite(weekRange.end)
  ) {
    return [];
  }

  const anchors = [];

  for (
    let week = weekRange.start;
    week <= weekRange.end;
    week += 1
  ) {
    const offsetWeeks = week - weekRange.start;
    const weekStartDate = addDaysUtc(startDateUtc, offsetWeeks * 7);
    const weekEndDate = addDaysUtc(weekStartDate, 6);

    anchors.push({
      week,
      startDate: toIsoDateString(weekStartDate),
      endDate: toIsoDateString(weekEndDate),
    });
  }

  return anchors;
};

const determineCurrentWeekInfo = (anchors, weekRange, startDateUtc) => {
  if (!anchors || anchors.length === 0 || !startDateUtc || !weekRange) {
    return null;
  }

  const todayLocal = new Date();
  const todayUtc = new Date(
    Date.UTC(
      todayLocal.getFullYear(),
      todayLocal.getMonth(),
      todayLocal.getDate()
    )
  );

  const diffDays = Math.floor(
    (todayUtc.getTime() - startDateUtc.getTime()) / DAY_IN_MS
  );

  const totalDays = anchors.length * 7;

  if (totalDays <= 0) {
    return null;
  }

  let status = 'within-range';
  let effectiveDiff = diffDays;

  if (diffDays < 0) {
    status = 'before-range';
    effectiveDiff = 0;
  } else if (diffDays >= totalDays) {
    status = 'after-range';
    effectiveDiff = totalDays - 1;
  }

  const offsetWeeks = Math.floor(effectiveDiff / 7);
  const currentWeek = weekRange.start + offsetWeeks;
  const currentWeekRange =
    anchors.find((anchor) => anchor.week === currentWeek) ?? null;

  return {
    today: toIsoDateString(todayUtc),
    status,
    currentWeek,
    currentWeekRange,
  };
};

const extractTimetableMetadata = (items, tableLeftEdge) => {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const limitX = Number.isFinite(tableLeftEdge)
    ? tableLeftEdge
    : Number.POSITIVE_INFINITY;

  const headerCandidates = items.filter((item) => item.x < limitX);

  if (headerCandidates.length === 0) {
    return null;
  }

  const blocks = groupLinesIntoBlocks(headerCandidates);

  const metadata = {
    source: 'header_table',
  };

  let found = false;
  let startDateUtc = null;
  let endDateUtc = null;

  for (const block of blocks) {
    const trimmed = block.text.trim();
    if (!trimmed) {
      continue;
    }

    const plain = toPlainLower(trimmed);

    if (plain.includes('ghi chu')) {
      continue;
    }

    if (plain.includes('khoa')) {
      const facultyParts = trimmed.split(':');
      const facultyName =
        facultyParts.length > 1
          ? facultyParts.slice(1).join(':').trim()
          : trimmed;
      if (facultyName) {
        metadata.faculty = facultyName;
        metadata.facultyRaw = trimmed;
        found = true;
      }
    }

    if (plain.includes('tuan')) {
      const weekMatches = Array.from(
        plain.matchAll(/tu\s*tuan\s*(\d+)[^0-9]+(\d+)/g)
      );

      if (weekMatches.length > 0) {
        const primary = weekMatches[0];
        const startWeek = Number.parseInt(primary[1], 10);
        const endWeek = Number.parseInt(primary[2], 10);

        if (Number.isFinite(startWeek) && Number.isFinite(endWeek)) {
          metadata.weekRange = { start: startWeek, end: endWeek };
          metadata.weekRangeRaw = trimmed;
          found = true;
        }

        if (weekMatches.length > 1) {
          const secondary = weekMatches.find((match) => {
            const altStart = Number.parseInt(match[1], 10);
            const altEnd = Number.parseInt(match[2], 10);
            return (
              Number.isFinite(altStart) &&
              Number.isFinite(altEnd) &&
              (!metadata.weekRange ||
                altStart !== metadata.weekRange.start ||
                altEnd !== metadata.weekRange.end)
            );
          });

          if (secondary) {
            const altStart = Number.parseInt(secondary[1], 10);
            const altEnd = Number.parseInt(secondary[2], 10);
            if (Number.isFinite(altStart) && Number.isFinite(altEnd)) {
              metadata.fullWeekRange = { start: altStart, end: altEnd };
            }
          }
        }
      }
    }

    if (plain.includes('ngay')) {
      const containsHolidayKeywords =
        plain.includes('nghi') || plain.includes('le');
      const isDateRangeLine =
        plain.includes('tu ngay') || plain.startsWith('ngay');

      if (!isDateRangeLine && containsHolidayKeywords) {
        continue;
      }

      if (!isDateRangeLine) {
        continue;
      }

      const dateMatches = Array.from(
        trimmed.matchAll(/(\d{1,2})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{4})/g)
      );

      if (dateMatches.length > 0) {
        const startCandidate = parseDateMatchToUtc(dateMatches[0]);
        if (startCandidate) {
          startDateUtc = startDateUtc ?? startCandidate;
          found = true;
        }
      }

      if (dateMatches.length > 1) {
        const endCandidate = parseDateMatchToUtc(dateMatches[1]);
        if (endCandidate) {
          endDateUtc = endDateUtc ?? endCandidate;
          found = true;
        }
      }
    }
  }

  if (!found) {
    return null;
  }

  if (startDateUtc || endDateUtc) {
    metadata.dateRange = {};
    if (startDateUtc) {
      metadata.dateRange.startDate = toIsoDateString(startDateUtc);
    }
    if (endDateUtc) {
      metadata.dateRange.endDate = toIsoDateString(endDateUtc);
    }
  }

  if (metadata.weekRange && startDateUtc) {
    const anchors = computeWeekAnchors(startDateUtc, metadata.weekRange);
    if (anchors.length > 0) {
      metadata.weekDateAnchors = anchors;
      metadata.totalWeeks = anchors.length;

      const currentWeekInfo = determineCurrentWeekInfo(
        anchors,
        metadata.weekRange,
        startDateUtc
      );

      if (currentWeekInfo) {
        metadata.today = currentWeekInfo.today;
        metadata.currentWeek = currentWeekInfo.currentWeek;
        metadata.currentWeekStatus = currentWeekInfo.status;
        metadata.currentWeekRange = currentWeekInfo.currentWeekRange;
      }
    }
  }

  return metadata;
};

const sessionRankLookup = {
  [toPlainLower('Sáng')]: 0,
  [toPlainLower('Chiều')]: 1,
  [toPlainLower('Tối')]: 2,
};

const parseDayIndex = (dayName) => {
  const normalized = toPlainLower(dayName || '');
  const match = normalized.match(/thu\s*(\d)/);
  if (match) {
    return Number.parseInt(match[1], 10);
  }
  if (normalized.includes('chunhat')) {
    return 8;
  }
  return Number.POSITIVE_INFINITY;
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
    console.warn('Không thể xóa thư mục tạm:', error);
  }
};

const saveDebugJson = async (data, filename) => {
  if (!DEBUG_MODE) return;

  try {
    // Ensure debug directory exists
    await fs.mkdir(DEBUG_DIR, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const debugFilename = `${timestamp}_${filename}`;
    const debugPath = path.join(DEBUG_DIR, debugFilename);

    await fs.writeFile(debugPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`[DEBUG] Saved debug file: ${debugFilename}`);
  } catch (error) {
    console.warn('[DEBUG] Failed to save debug file:', error.message);
  }
};

const parseTimetablePdfBuffer = async (buffer, { originalName } = {}) => {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new TimetableParserError(
      'Dữ liệu PDF không hợp lệ.',
      400
    );
  }

  console.log('[PDF Parser] Processing PDF upload with manual parser');

  const { tempDir, filePath } = await createTempPdfFile(buffer, originalName);

  try {
    const pdfjs = await loadPdfModule();
    const loadingTask = pdfjs.getDocument({
      url: filePath,
      standardFontDataUrl: null,
      useSystemFonts: false,
      verbosity: 0 // Disable verbose warnings
    });
    const pdfDocument = await loadingTask.promise;

    let dayLayout = null;
    let timetableMetadata = null;
    const pageSchedules = new Map();

    for (let pageIndex = 1; pageIndex <= pdfDocument.numPages; pageIndex += 1) {
      const page = await pdfDocument.getPage(pageIndex);
      const textContent = await page.getTextContent();
      const items = toContentItems(textContent);

      if (!dayLayout) {
        dayLayout = buildDayLayout(items);
      }

      if (!timetableMetadata) {
        timetableMetadata = extractTimetableMetadata(
          items,
          dayLayout.tableLeftEdge
        );
      }

      const { dayGroups, dayPeriodOrder, periodRowY, tableLeftEdge } = dayLayout;

      const classAnchors = items
        .filter((item) => isClassCandidate(item, tableLeftEdge))
        .map((item) => ({
          name: item.raw.trim(),
          x: item.x,
          y: item.y,
        }));

      const classRanges = segmentByRange(classAnchors);

      if (classRanges.length === 0) {
        classRanges.push({
          name: 'Unknown',
          anchor: { x: 0, y: Number.POSITIVE_INFINITY },
          top: Number.POSITIVE_INFINITY,
          bottom: Number.NEGATIVE_INFINITY,
        });
      }

      const sessionAnchors = items
        .filter((item) => isSessionLabel(item.raw) && item.x < tableLeftEdge)
        .map((item) => ({
          name: item.raw.trim(),
          x: item.x,
          y: item.y,
        }));

      const sessionsByClass = new Map();

      classRanges.forEach((classRange) => {
        const sessionForClass = sessionAnchors
          .filter(
            (anchor) => anchor.y <= classRange.top && anchor.y > classRange.bottom
          )
          .map((anchor) => ({
            name: anchor.name,
            x: anchor.x,
            y: anchor.y,
          }));

        const segmentedSessions =
          sessionForClass.length > 0
            ? segmentByRange(sessionForClass)
            : [
                {
                  name: 'Chung',
                  anchor: { x: 0, y: (classRange.top + classRange.bottom) / 2 },
                  top: classRange.top,
                  bottom: classRange.bottom,
                },
              ];

        sessionsByClass.set(classRange.name, segmentedSessions);
      });

      const excludedPrefixes = [
        'tiet',
        'thu',
        'chu nhat',
        'mon hoc',
        'ten lop',
        'buoi',
        'ghi chu',
        'khoa',
        'ngay',
      ];

      const scheduleLines = items.filter((item) => {
        if (item.y >= periodRowY) {
          return false;
        }

        if (item.x <= tableLeftEdge) {
          return false;
        }

        const normalized = normalizeText(item.raw);

        return !excludedPrefixes.some((prefix) => normalized.startsWith(prefix));
      });

      const classSchedules = new Map();
      const collectionBuckets = new Map();
      const coverageTolerance = 2;

      const ensureDaySchedule = (className, sessionName, dayName, dayGroup) => {
        if (!classSchedules.has(className)) {
          classSchedules.set(className, new Map());
        }
        const sessionMap = classSchedules.get(className);
        if (!sessionMap.has(sessionName)) {
          sessionMap.set(sessionName, new Map());
        }
        const dayMap = sessionMap.get(sessionName);
        if (!dayMap.has(dayName)) {
          const periodMap = {};
          dayGroup.periods.forEach((period) => {
            periodMap[`Tiet ${period.number}`] = null;
          });
          dayMap.set(dayName, periodMap);
        }
        return dayMap.get(dayName);
      };

      const mergeValue = (current, value) => {
        if (!value) {
          return current;
        }
        if (current === null || current === undefined) {
          return value;
        }
        if (typeof current === 'string') {
          if (current === value) {
            return current;
          }
          return [current, value];
        }
        if (Array.isArray(current)) {
          if (!current.includes(value)) {
            current.push(value);
          }
          return current;
        }
        return value;
      };

      scheduleLines.forEach((line) => {
        const classRange = classRanges.find(
          (range) => line.y <= range.top && line.y > range.bottom
        );

        if (!classRange) {
          return;
        }

        const sessionRanges = sessionsByClass.get(classRange.name) ?? [];
        const sessionRange =
          sessionRanges.find(
            (range) => line.y <= range.top && line.y > range.bottom
          ) ?? sessionRanges[0];

        const centerX = line.x + (line.width ?? 0) / 2;

        const dayGroup = dayGroups.find(
          (group) =>
            centerX >= group.leftEdge - 1 && centerX <= group.rightEdge + 1
        );

        if (!dayGroup) {
          return;
        }

        const primaryKey = classRange.name.trim();
        const sessionKey = sessionRange.name.trim();
        const dayKey = dayGroup.name;

        const bucketKey = `${primaryKey}__${sessionKey}__${dayKey}`;

        if (!collectionBuckets.has(bucketKey)) {
          collectionBuckets.set(bucketKey, {
            className: primaryKey,
            sessionName: sessionKey,
            dayName: dayKey,
            dayGroup,
            lines: [],
          });
        }

        const bucket = collectionBuckets.get(bucketKey);
        bucket.lines.push({
          raw: line.raw,
          x: line.x,
          y: line.y,
          width: line.width ?? 0,
        });
      });

      collectionBuckets.forEach((bucket) => {
        const periodMap = ensureDaySchedule(
          bucket.className,
          bucket.sessionName,
          bucket.dayName,
          bucket.dayGroup
        );

        const blocks = groupLinesIntoBlocks(bucket.lines);

        blocks.forEach((block) => {
          const text = block.text.replace(/\u00a0/g, ' ').trim();
          if (!text) {
            return;
          }

          const coveredPeriods = bucket.dayGroup.periods.filter((period) => {
            const adjustedLeft = period.left - coverageTolerance;
            const adjustedRight = period.right + coverageTolerance;
            return (
              block.bounds.maxX >= adjustedLeft &&
              block.bounds.minX <= adjustedRight
            );
          });

          const targetPeriods =
            coveredPeriods.length > 0 ? coveredPeriods : bucket.dayGroup.periods;

          targetPeriods.forEach((period) => {
            const periodKey = `Tiet ${period.number}`;
            const currentValue = periodMap[periodKey];
            periodMap[periodKey] = mergeValue(currentValue, text);
          });
        });
      });

      if (classSchedules.size > 0) {
        const pageKey =
          pdfDocument.numPages === 1 ? 'Trang 1' : `Trang ${pageIndex}`;
        pageSchedules.set(pageKey, {
          classes: classSchedules,
          dayPeriods: { ...dayPeriodOrder },
        });
      }
    }

    if (pageSchedules.size === 0) {
      throw new TimetableParserError(
        'Không tìm thấy dữ liệu thời khóa biểu trong file PDF.',
        422
      );
    }

    const simplifiedSheets = {};

    // Process all pages in parallel
    const pageResults = await Promise.all(
      Array.from(pageSchedules.entries()).map(async ([pageKey, { classes, dayPeriods }]) => {
        const classEvents = {};

        // Process all classes in parallel
        const classResults = await Promise.all(
          Array.from(classes.entries()).map(async ([className, sessionMap]) => {
            const events = [];

            // Process all sessions in parallel
            const sessionResults = await Promise.all(
              Array.from(sessionMap.entries()).map(async ([sessionName, dayMap]) => {
                // Process all days in parallel
                const dayResults = await Promise.all(
                  Array.from(dayMap.entries()).map(async ([dayName, periodMap]) => {
                    const periodOrder = dayPeriods[dayName] ?? Object.keys(periodMap);
                    const entries = await buildDayEntries(periodOrder, periodMap);
                    return { entries, sessionName, dayName };
                  })
                );

                return dayResults;
              })
            );

            // Flatten session results
            const allDayResults = sessionResults.flat();

            // Define mergeEventData function once per class
            const mergeEventData = (target, entry) => {
              if (entry.subject?.code) {
                target.subjectCode = entry.subject.code;
              }
              if (entry.subject?.name) {
                target.subjectName = entry.subject.name;
              }
              if (Number.isFinite(entry.subject?.hours)) {
                target.hours = entry.subject.hours;
              }
              if (entry.teacher) {
                target.teacher = entry.teacher;
              }
              if (entry.weeks) {
                if (
                  Number.isFinite(entry.weeks.start) &&
                  (target.weekStart === undefined ||
                    entry.weeks.start < target.weekStart)
                ) {
                  target.weekStart = entry.weeks.start;
                }
                if (
                  Number.isFinite(entry.weeks.end) &&
                  (target.weekEnd === undefined ||
                    entry.weeks.end > target.weekEnd)
                ) {
                  target.weekEnd = entry.weeks.end;
                }
              }
              if (Array.isArray(entry.weeksOff) && entry.weeksOff.length > 0) {
                const combined = target.weeksOff
                  ? uniqueSortedNumbers([...target.weeksOff, ...entry.weeksOff])
                  : uniqueSortedNumbers(entry.weeksOff);
                target.weeksOff = combined;
              }
              if (entry.room) {
                const existingRooms = target.rooms
                  ? target.rooms
                  : target.room
                  ? [target.room]
                  : [];
                if (!existingRooms.includes(entry.room)) {
                  existingRooms.push(entry.room);
                }
                if (existingRooms.length <= 1) {
                  target.room = existingRooms[0];
                  delete target.rooms;
                } else {
                  delete target.room;
                  target.rooms = existingRooms;
                }
              }
              if (Array.isArray(entry.rooms) && entry.rooms.length > 0) {
                const newRooms = Array.from(new Set(entry.rooms));
                const existingRooms = target.rooms
                  ? target.rooms
                  : target.room
                  ? [target.room]
                  : [];
                const combinedRooms = Array.from(
                  new Set([...existingRooms, ...newRooms])
                );
                if (combinedRooms.length <= 1) {
                  target.room = combinedRooms[0];
                  delete target.rooms;
                } else {
                  delete target.room;
                  target.rooms = combinedRooms;
                }
              }
              if (entry.roomAssignments && entry.roomAssignments.length > 0) {
                const assignments = target.roomAssignments
                  ? [...target.roomAssignments]
                  : [];
                entry.roomAssignments.forEach((assign) => {
                  const key = JSON.stringify(assign);
                  if (
                    !assignments.some(
                      (current) => JSON.stringify(current) === key
                    )
                  ) {
                    assignments.push(assign);
                  }
                });
                target.roomAssignments = assignments;
              }
              if (entry.weekPeriods && entry.weekPeriods.length > 0) {
                const adjustments = target.weekPeriods
                  ? [...target.weekPeriods]
                  : [];
                entry.weekPeriods.forEach((adjust) => {
                  if (
                    !adjustments.some(
                      (current) =>
                        current.week === adjust.week &&
                        current.periods === adjust.periods
                    )
                  ) {
                    adjustments.push(adjust);
                  }
                });
                target.weekPeriods = adjustments;
              }
            };

            // Process all day results
            allDayResults.forEach(({ entries, sessionName, dayName }) => {
              const bucketEvents = [];
              let currentEvent = null;

              entries.forEach((entry) => {
                const hasSubject =
                  Boolean(entry.subject?.code) || Boolean(entry.subject?.name);

                if (hasSubject || !currentEvent) {
                  currentEvent = {
                    session: sessionName,
                    day: dayName,
                  };
                  bucketEvents.push(currentEvent);
                }

                mergeEventData(currentEvent, entry);
              });

              bucketEvents
                .filter((event) =>
                  Boolean(
                    event.subjectCode ||
                      event.subjectName ||
                    event.teacher ||
                    event.weekStart !== undefined ||
                    event.weekEnd !== undefined ||
                    event.weeksOff ||
                    event.room ||
                    event.rooms ||
                    event.roomAssignments ||
                    event.weekPeriods
                  )
                )
                .forEach((event) => events.push(event));
            });

            return { className, events };
          })
        );

        // Merge all class results
        classResults.forEach(({ className, events }) => {
          if (events.length > 0) {
            events.sort((a, b) => {
              const sessionA =
                sessionRankLookup[toPlainLower(a.session)] ??
                Number.POSITIVE_INFINITY;
              const sessionB =
                sessionRankLookup[toPlainLower(b.session)] ??
                Number.POSITIVE_INFINITY;

              if (sessionA !== sessionB) {
                return sessionA - sessionB;
              }

              const dayA = parseDayIndex(a.day);
              const dayB = parseDayIndex(b.day);

              if (dayA !== dayB) {
                return dayA - dayB;
              }

              const subjectA = a.subjectCode || a.subjectName || '';
              const subjectB = b.subjectCode || b.subjectName || '';
              return subjectA.localeCompare(subjectB);
            });

            classEvents[className] = events;
          }
        });

        return { pageKey, classEvents };
      })
    );

    // Build simplified sheets from page results
    pageResults.forEach(({ pageKey, classEvents }) => {
      if (Object.keys(classEvents).length > 0) {
        simplifiedSheets[pageKey] = classEvents;
      }
    });

    if (Object.keys(simplifiedSheets).length === 0) {
      throw new TimetableParserError(
        'Không tìm thấy dữ liệu thời khóa biểu sau khi chuyển đổi.',
        422
      );
    }

    const scheduleOutput = {
      document: originalName || 'uploaded.pdf',
      generatedAt: new Date().toISOString(),
      metadata: timetableMetadata || null,
      sheets: simplifiedSheets,
    };

    // Save debug files if DEBUG mode is enabled
    await saveDebugJson(scheduleOutput, 'schedule_output.json');
    await saveDebugJson({ pageSchedules: Array.from(pageSchedules.entries()) }, 'page_schedules_raw.json');

    console.log('[PDF Parser] Manual parsing complete');

    return scheduleOutput;
  } catch (error) {
    if (error instanceof TimetableParserError) {
      throw error;
    }
    throw new TimetableParserError(
      'Không thể xử lý file thời khóa biểu.',
      500,
      { cause: error }
    );
  } finally {
    await removeTempDirSafe(tempDir);
  }
};

module.exports = {
  TimetableParserError,
  parseTimetablePdfBuffer,
};
