const express = require('express');
const router = express.Router();
const { auth, admin } = require('../middleware/auth');
const {
  startChat,
  sendMessage,
  adminSendMessage,
  getMyChats,
  getAllChats,
  getChat,
  updateChatStatus,
  getChatStats
} = require('../controllers/chatController');

// User routes
router.post('/start', auth, startChat);
router.post('/:chatId/message', auth, sendMessage);
router.get('/my-chats', auth, getMyChats);

// Admin routes
router.get('/', auth, admin, getAllChats);
router.get('/stats', auth, admin, getChatStats);
router.get('/:id', auth, admin, getChat);
router.post('/:chatId/admin-message', auth, admin, adminSendMessage);
router.put('/:id/status', auth, admin, updateChatStatus);

module.exports = router;