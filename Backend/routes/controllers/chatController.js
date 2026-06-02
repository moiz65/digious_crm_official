const ChatModel = require("../../models/chatModel");
const pool = require("../../config/database");
const path = require("path");
const fs = require("fs");

// Get all conversations for current user
exports.getConversations = async (req, res) => {
  try {
    const currentUserId = req.user.employeeId || req.user.userId;
    const conversations = await ChatModel.getConversations(currentUserId);

    res.json({
      success: true,
      data: conversations,
      total: conversations.length,
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get chat history with specific user
exports.getChatHistory = async (req, res) => {
  try {
    const currentUserId = req.user.employeeId || req.user.userId;
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const messages = await ChatModel.getMessages(
      currentUserId,
      userId,
      limit,
      offset,
    );

    // Mark messages as read when viewed
    if (messages.length > 0) {
      await ChatModel.markAsRead(userId, currentUserId);
    }

    res.json({
      success: true,
      data: messages,
      hasMore: messages.length === limit,
    });
  } catch (error) {
    console.error("Get chat history error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Send message via REST API (fallback)
exports.sendMessage = async (req, res) => {
  try {
    const currentUserId = req.user.employeeId || req.user.userId;
    const { to, message, type = "text" } = req.body;

    if (!to || !message) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required fields" });
    }

    const messageId = await ChatModel.saveMessage(
      currentUserId,
      to,
      message,
      type,
    );

    // Update conversation
    await ChatModel.updateConversation(
      currentUserId,
      to,
      message,
      currentUserId,
    );

    const messages = await ChatModel.getMessages(currentUserId, to, 1, 0);

    res.json({
      success: true,
      data: messages[0] || null,
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Upload file
exports.uploadFile = async (req, res) => {
  try {
    const currentUserId = req.user.employeeId || req.user.userId;
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "No file uploaded" });
    }

    const { to } = req.body;

    if (!to) {
      return res
        .status(400)
        .json({ success: false, error: "Recipient not specified" });
    }

    const fileUrl = `/uploads/chat/${req.file.filename}`;
    const fileData = {
      url: fileUrl,
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
    };

    const messageId = await ChatModel.saveMessage(
      currentUserId,
      to,
      `📎 ${req.file.originalname}`,
      "file",
      fileData,
    );

    await ChatModel.updateConversation(
      currentUserId,
      to,
      `📎 ${req.file.originalname}`,
      currentUserId,
    );

    const messages = await ChatModel.getMessages(currentUserId, to, 1, 0);

    res.json({
      success: true,
      data: messages[0] || null,
    });
  } catch (error) {
    console.error("Upload file error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.downloadFile = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user.employeeId || req.user.userId;

    console.log(`📥 Download request for message ID: ${messageId} by user ${currentUserId}`);

    const [messages] = await pool.query(
      `SELECT file_url, file_name, file_size, file_type FROM chat_messages 
       WHERE id = ? AND (from_user = ? OR to_user = ?) AND is_deleted = FALSE`,
      [messageId, currentUserId, currentUserId],
    );

    if (messages.length === 0) {
      console.log(`❌ Message ${messageId} not found for user ${currentUserId}`);
      return res.status(404).json({ success: false, error: "File not found" });
    }

    const message = messages[0];

    if (!message.file_url) {
      console.log(`❌ No file_url for message ${messageId}`);
      return res
        .status(404)
        .json({ success: false, error: "File URL not found" });
    }

    // Get just the filename from the URL
    const fileName = path.basename(message.file_url);
    const filePath = path.join(__dirname, "../../uploads/chat", fileName);

    console.log(`🔍 Looking for file: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found on disk: ${filePath}`);
      return res
        .status(404)
        .json({ success: false, error: "File not found on server" });
    }

    const stat = fs.statSync(filePath);
    console.log(
      `✅ File found: ${message.file_name}, Size: ${stat.size} bytes`,
    );

    // Set proper download headers
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(message.file_name || fileName)}"`,
    );
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Length", stat.size);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on("error", (err) => {
      console.error("Stream error:", err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: "Error reading file" });
      }
    });
  } catch (error) {
    console.error("Download file error:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const currentUserId = req.user.employeeId || req.user.userId;
    const { fromUserId } = req.body;

    const count = await ChatModel.markAsRead(fromUserId, currentUserId);

    res.json({
      success: true,
      message: `${count} messages marked as read`,
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete message
exports.deleteMessage = async (req, res) => {
  try {
    const currentUserId = req.user.employeeId || req.user.userId;
    const { messageId } = req.params;

    const deleted = await ChatModel.deleteMessage(messageId, currentUserId);

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, error: "Message not found" });
    }

    res.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
  try {
    const currentUserId = req.user.employeeId || req.user.userId;
    const count = await ChatModel.getUnreadCount(currentUserId);

    res.json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Search messages
exports.searchMessages = async (req, res) => {
  try {
    const currentUserId = req.user.employeeId || req.user.userId;
    const { q, limit = 50 } = req.query;

    if (!q) {
      return res.json({ success: true, data: [] });
    }

    const messages = await ChatModel.searchMessages(currentUserId, q, limit);

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("Search messages error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all active users to start a chat with
exports.getAvailableUsers = async (req, res) => {
  try {
    const currentUserId = req.user.employeeId || req.user.userId;
    const users = await ChatModel.getAvailableUsers(currentUserId);
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Get available users error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
