const OpenAI = require('openai');
const { loadChatbotDataBundle } = require('./dataBundle');

const DEFAULT_MODEL = process.env.OPENAI_MODEL || process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini';
const SYSTEM_PROMPT = process.env.CHATBOT_SYSTEM_PROMPT || 'You are a helpful assistant that responds with clear, concise information.';
const RESPONSES_ONLY_MODEL_PATTERN = /^(gpt-4\.1|gpt-4o|o1|o3|omni)/i;

let client;
let currentApiKeyIndex = 0; // Track which API key we're using (0 = primary, 1 = backup)
const MAX_CONVERSATION_MESSAGES = 10;
const MAX_SYSTEM_MESSAGES = 3;
const MAX_USER_MESSAGE_LENGTH = 1500;

class ChatInputError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'ChatInputError';
    this.status = status;
  }
}

function getAvailableApiKeys() {
  const keys = [];
  if (process.env.OPENAI_API_KEY) keys.push(process.env.OPENAI_API_KEY);
  if (process.env.OPENAI_API_KEY_2) keys.push(process.env.OPENAI_API_KEY_2);
  return keys;
}

function getClient() {
  const apiKeys = getAvailableApiKeys();

  if (apiKeys.length === 0) {
    throw new Error('OpenAI API key is not configured. Set OPENAI_API_KEY or OPENAI_API_KEY_2.');
  }

  const apiKey = apiKeys[currentApiKeyIndex];

  if (!client) {
    client = new OpenAI({ apiKey });
  }

  return client;
}

function switchToBackupKey() {
  const apiKeys = getAvailableApiKeys();

  if (currentApiKeyIndex < apiKeys.length - 1) {
    currentApiKeyIndex++;
    client = null; // Force recreate client with new key
    console.log(`[OpenAI] Switched to backup API key (index ${currentApiKeyIndex})`);
    return true;
  }

  return false;
}

function extractTextContent(content) {
  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (!part) {
          return '';
        }
        if (typeof part === 'string') {
          return part;
        }
        if (typeof part.text === 'string') {
          return part.text;
        }
        return '';
      })
      .filter(Boolean)
      .join('\n')
      .trim();
  }

  if (content && typeof content === 'object' && typeof content.text === 'string') {
    return content.text.trim();
  }

  return '';
}

function sanitizeMessage(message) {
  if (!message || typeof message !== 'object') {
    return null;
  }

  const rawRole = typeof message.role === 'string' ? message.role.trim().toLowerCase() : '';
  if (!rawRole) {
    return null;
  }

  const text = extractTextContent(message.content);
  if (!text) {
    return null;
  }

  let role = 'user';
  if (rawRole === 'assistant') {
    role = 'assistant';
  } else if (rawRole === 'system') {
    role = 'system';
  }

  return { role, content: text };
}

function normalizeHistoryMessages(history) {
  if (!Array.isArray(history)) {
    return { systemMessages: [], conversationMessages: [] };
  }

  const sanitized = history.map(sanitizeMessage).filter(Boolean);
  const systemMessages = sanitized
    .filter((item) => item.role === 'system')
    .slice(-MAX_SYSTEM_MESSAGES);

  const conversationMessages = sanitized
    .filter((item) => item.role !== 'system')
    .slice(-MAX_CONVERSATION_MESSAGES);

  return { systemMessages, conversationMessages };
}

function normalizeMessagesPayload(messages) {
  const sanitized = messages.map(sanitizeMessage).filter(Boolean);

  if (!sanitized.length) {
    throw new ChatInputError('Conversation messages payload is empty.');
  }

  const last = sanitized[sanitized.length - 1];

  if (!last || last.role !== 'user') {
    throw new ChatInputError('Conversation messages must end with a user message.');
  }

  const history = sanitized.slice(0, -1);
  const { systemMessages, conversationMessages } = normalizeHistoryMessages(history);

  return {
    userMessage: last.content,
    systemMessages,
    conversationMessages,
  };
}

function normalizeContextInput(context) {
  if (!context) {
    return '';
  }

  if (typeof context === 'string') {
    return context.trim();
  }

  if (Array.isArray(context)) {
    return context
      .map((item) => normalizeContextInput(item))
      .filter(Boolean)
      .join('\n\n')
      .trim();
  }

  if (typeof context === 'object') {
    if (typeof context.text === 'string') {
      return context.text.trim();
    }

    if (Array.isArray(context.content)) {
      return normalizeContextInput(context.content);
    }
  }

  return '';
}

function normalizeConversationInput({ message, history, messages }) {
  if (Array.isArray(messages) && messages.length) {
    return normalizeMessagesPayload(messages);
  }

  const trimmed = typeof message === 'string' ? message.trim() : '';

  if (!trimmed) {
    throw new ChatInputError('Message is required.');
  }

  const { systemMessages, conversationMessages } = normalizeHistoryMessages(history);

  return {
    userMessage: trimmed,
    systemMessages,
    conversationMessages,
  };
}

function shouldUseResponsesApi(model) {
  return process.env.OPENAI_FORCE_RESPONSES === '1' || RESPONSES_ONLY_MODEL_PATTERN.test(model);
}

function toResponsesMessage(role, content) {
  return {
    role,
    content: [
      {
        type: role === 'assistant' ? 'output_text' : 'input_text',
        text: content,
      },
    ],
  };
}

async function createViaResponsesApi(client, { messages, model }) {
  try {
    const response = await client.responses.create({
      model,
      input: messages.map((msg) => toResponsesMessage(msg.role, msg.content)),
    });

    const text = (response.output_text || '').trim();

    if (!text) {
      throw new Error('Chatbot did not return a response.');
    }

    return {
      model: response.model,
      message: {
        role: 'assistant',
        content: text,
      },
      usage: response.usage || null,
    };
  } catch (error) {
    // Check if error is quota/rate limit related
    if (error.status === 429 || error.code === 'insufficient_quota') {
      if (switchToBackupKey()) {
        console.log('[OpenAI] Retrying with backup API key...');
        const newClient = getClient();
        return createViaResponsesApi(newClient, { messages, model });
      }
    }
    throw error;
  }
}

async function createViaChatCompletions(client, { messages, model }) {
  try {
    const completion = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 600,
    });

    const choice = completion.choices && completion.choices[0] ? completion.choices[0].message : null;

    if (!choice || !choice.content) {
      throw new Error('Chatbot did not return a response.');
    }

    return {
      model: completion.model,
      message: choice,
      usage: completion.usage || null,
    };
  } catch (error) {
    // Check if error is quota/rate limit related
    if (error.status === 429 || error.code === 'insufficient_quota') {
      if (switchToBackupKey()) {
        console.log('[OpenAI] Retrying with backup API key...');
        const newClient = getClient();
        return createViaChatCompletions(newClient, { messages, model });
      }
    }
    throw error;
  }
}

async function createChatCompletion({ userMessage, history = [], model = DEFAULT_MODEL, messages, context }) {
  const { userMessage: resolvedMessage, systemMessages, conversationMessages } = normalizeConversationInput({
    message: userMessage,
    history,
    messages,
  });

  if (resolvedMessage.length > MAX_USER_MESSAGE_LENGTH) {
    throw new ChatInputError('Message is too long (limit 1500 characters).');
  }

  const client = getClient();
  const dataBundle = await loadChatbotDataBundle();
  const contextFromPayload = normalizeContextInput(context);

  const systemSegments = [SYSTEM_PROMPT];

  if (contextFromPayload) {
    systemSegments.push(contextFromPayload);
  }

  if (dataBundle && dataBundle.content) {
    systemSegments.push(`Reference data (aggregated from system files):\n${dataBundle.content}`);
  }

  if (dataBundle && Array.isArray(dataBundle.files) && dataBundle.files.length) {
    systemSegments.push(`(Data sources: ${dataBundle.files.join(', ')})`);
  }

  const assembled = [];

  const systemContent = systemSegments.filter(Boolean).join('\n\n').trim();

  if (systemContent) {
    assembled.push({ role: 'system', content: systemContent });
  }

  if (systemMessages.length) {
    assembled.push(...systemMessages);
  }

  if (conversationMessages.length) {
    assembled.push(...conversationMessages);
  }

  assembled.push({ role: 'user', content: resolvedMessage });

  if (shouldUseResponsesApi(model)) {
    return createViaResponsesApi(client, { messages: assembled, model });
  }

  return createViaChatCompletions(client, { messages: assembled, model });
}

module.exports = {
  createChatCompletion,
  ChatInputError,
};
