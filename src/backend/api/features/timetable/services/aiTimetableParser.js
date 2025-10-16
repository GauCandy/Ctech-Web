const OpenAI = require('openai');
const fs = require('fs/promises');
const path = require('path');
const { getCachedResult, setCachedResult, generateHash } = require('./aiCache');

const AI_ENABLED = process.env.USE_AI_PARSER === 'true';
const AI_FALLBACK = process.env.AI_FALLBACK === 'true'; // Use AI only when regex fails
const DEBUG_MODE = process.env.DEBUG === 'true';
const FALLBACK_LOG_DIR = path.join(__dirname, '../../../../../../debug/ai_fallback');

let openaiClient = null;

// Initialize OpenAI client if enabled
if ((AI_ENABLED || AI_FALLBACK) && process.env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * Log cases where AI had to handle parsing (for improvement)
 */
async function logAIFallback(originalText, regexResult, aiResult, reason) {
  if (!DEBUG_MODE) return;

  try {
    await fs.mkdir(FALLBACK_LOG_DIR, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFilename = `${timestamp}_fallback.json`;
    const logPath = path.join(FALLBACK_LOG_DIR, logFilename);

    const logData = {
      timestamp: new Date().toISOString(),
      reason,
      originalText,
      regexResult,
      aiResult,
    };

    await fs.writeFile(logPath, JSON.stringify(logData, null, 2), 'utf8');
    console.log(`[AI Fallback] Logged case: ${logFilename}`);
  } catch (error) {
    console.warn('[AI Fallback] Failed to log:', error.message);
  }
}

/**
 * Parse a lesson block text using AI
 * @param {string} text - The raw text from PDF cell
 * @returns {Promise<Object>} - Parsed lesson data
 */
async function parseWithAI(text) {
  if (!AI_ENABLED && !AI_FALLBACK) {
    throw new Error('AI parser is not enabled');
  }

  if (!openaiClient) {
    throw new Error('OpenAI API key is missing');
  }

  // Check cache first
  const cached = await getCachedResult(text);
  if (cached) {
    return cached;
  }

  const prompt = `Bạn là trợ lý phân tích thời khóa biểu. Hãy trích xuất thông tin từ văn bản sau và trả về JSON theo format chính xác.

VĂN BẢN CẦN PHÂN TÍCH:
"""
${text}
"""

YÊU CẦU:
1. Trích xuất tất cả thông tin có trong văn bản
2. Với phần tuần nghỉ, hãy phân tích CHI TIẾT:
   - Nếu có "đến" hoặc "den" giữa 2 số → tạo danh sách liên tiếp (VD: "tuần 10 đến 13" → [10,11,12,13])
   - Nếu có dấu "," hoặc "và" → chỉ lấy các số đó (VD: "tuần 10, 13" → [10,13])
3. Nếu không có thông tin nào, trả về null cho field đó

FORMAT JSON:
{
  "subjectCode": "Mã môn (VD: MĐ12)",
  "subjectName": "Tên môn học",
  "hours": số giờ (number, không có đơn vị),
  "teacher": "Tên giáo viên",
  "weekStart": tuần bắt đầu (number),
  "weekEnd": tuần kết thúc (number),
  "weeksOff": [array các tuần nghỉ - CHÚ Ý: nếu có "đến" thì expand thành list đầy đủ],
  "room": "Phòng học (nếu có)",
  "notes": ["Các ghi chú khác"]
}

CHÚ Ý QUAN TRỌNG về weeksOff:
- "Nghỉ tuần 10 đến 13" → weeksOff: [10, 11, 12, 13]
- "Nghỉ tuần 10, 11" → weeksOff: [10, 11]
- "Nghỉ tuần 10 và 14" → weeksOff: [10, 14]
- "nghỉ tuần 10,11" → weeksOff: [10, 11]

CHỈ TRẢ VỀ JSON, KHÔNG THÊM TEXT NÀO KHÁC.`;

  try {
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini', // Cheapest and fast
      messages: [
        {
          role: 'system',
          content: 'Bạn là trợ lý phân tích thời khóa biểu. Chỉ trả về JSON hợp lệ, không thêm markdown hay text khác.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1, // Low temperature for consistent results
      max_tokens: 500,
    });

    const content = response.choices[0].message.content.trim();

    if (DEBUG_MODE) {
      console.log('[AI Parser] Raw response:', content);
    }

    // Remove markdown code blocks if present
    let jsonStr = content;
    if (content.startsWith('```')) {
      jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }

    const parsed = JSON.parse(jsonStr);

    if (DEBUG_MODE) {
      console.log('[AI Parser] Parsed result:', parsed);
    }

    // Save to cache for future use
    await setCachedResult(text, parsed);

    return parsed;
  } catch (error) {
    console.error('[AI Parser] Error:', error.message);
    throw error;
  }
}

/**
 * Parse multiple lesson blocks in parallel
 * @param {Array<string>} texts - Array of text blocks
 * @returns {Promise<Array<Object>>} - Array of parsed results
 */
async function parseBatchWithAI(texts) {
  if (!AI_ENABLED || !openaiClient) {
    throw new Error('AI parser is not enabled or API key is missing');
  }

  const promises = texts.map((text) => parseWithAI(text));
  return Promise.all(promises);
}

module.exports = {
  AI_ENABLED,
  AI_FALLBACK,
  parseWithAI,
  parseBatchWithAI,
  logAIFallback,
};
