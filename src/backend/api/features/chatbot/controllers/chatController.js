const { createChatCompletion } = require('../services/chatService');

function hasApiKeyConfigured() {
  return Boolean(process.env.OPENAI_API_KEY || process.env.API_KEY || process.env.TOKEN);
}

async function chatCompletionHandler(req, res, next) {
  try {
    const { message, history, model, messages, context } = req.body || {};
    const hasMessagesPayload = Array.isArray(messages) && messages.length > 0;

    if (!hasMessagesPayload) {
      if (typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Message is required.' });
      }

      if (message.length > 1500) {
        return res.status(400).json({ error: 'Message is too long (limit 1500 characters).' });
      }
    }

    if (!hasApiKeyConfigured()) {
      return res.status(500).json({ error: 'Chat service is not configured.' });
    }

    const result = await createChatCompletion({
      userMessage: message,
      history,
      model,
      messages,
      context,
    });

    return res.json({
      reply: result.message.content,
      role: result.message.role,
      model: result.model,
      usage: result.usage,
    });
  } catch (error) {
    const status = error.status || error.statusCode;

    if (status && status >= 400 && status < 600) {
      const payload = { error: error.message || 'Chat service request failed.' };
      if (status === 429) {
        payload.error = 'OpenAI rate limit exceeded. Please check your plan, billing, or try again later.';
      }
      return res.status(status).json(payload);
    }

    return next(error);
  }
}

module.exports = {
  chatCompletionHandler,
};
