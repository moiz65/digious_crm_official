// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('./controllers/chatController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

// All chat routes require authentication
router.use(authMiddleware);

// Conversations
router.get('/conversations', chatController.getConversations);

// Messages
router.get('/history/:userId', chatController.getChatHistory);
router.post('/message', chatController.sendMessage);
router.delete('/message/:messageId', chatController.deleteMessage);

// File handling
router.post('/upload', upload.single('file'), chatController.uploadFile);
router.get('/download/:messageId', chatController.downloadFile);

// Read receipts
router.post('/mark-read', chatController.markAsRead);
router.get('/unread-count', chatController.getUnreadCount);

// Search & Available Users
router.get('/search', chatController.searchMessages);
router.get('/users', chatController.getAvailableUsers);

module.exports = router;