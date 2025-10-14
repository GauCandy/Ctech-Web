const express = require('express');
const { chatCompletionHandler } = require('./controllers/chatController');

const router = express.Router();

router.post('/chat', chatCompletionHandler);

module.exports = {
  chatbotRouter: router,
};
