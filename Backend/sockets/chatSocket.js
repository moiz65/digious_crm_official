// Backend/sockets/chatSocket.js
const ChatModel = require("../models/chatModel");
const pool = require("../config/database");

const onlineUsers = new Map();
const userSockets = new Map();

module.exports = (io) => {
  io.on("connection", (socket) => {
    const userId = socket.userId;
    console.log(`✅ User ${userId} connected`);

    onlineUsers.set(userId, socket.id);
    userSockets.set(socket.id, userId);

    // Send online users list to new user
    const onlineUserIds = Array.from(onlineUsers.keys());
    io.to(socket.id).emit("online_users", onlineUserIds);

    // Broadcast user online to others
    socket.broadcast.emit("user_online", { userId, online: true });

    // ============================================================
    // SEND MESSAGE - Real-time with conversation update
    // ============================================================
    socket.on("send_message", async (data, callback) => {
      try {
        const { to, message, type = "text", from_name } = data;

        if (!to || !message) {
          return callback({ success: false, error: "Missing required fields" });
        }

        const [sender] = await pool.query(
          `SELECT id, name FROM employee_onboarding WHERE id = ?`,
          [userId],
        );
        const senderName = sender[0]?.name || "User";

        const messageId = await ChatModel.saveMessage(
          userId,
          to,
          message,
          type,
        );
        await ChatModel.updateConversation(userId, to, message, userId);

        const messages = await ChatModel.getMessages(userId, to, 1, 0);
        const messageData = messages[0];
        messageData.from_user_name = senderName;
        messageData.sender_id = userId;

        // ✅ Send to recipient if online
        const recipientSocketId = onlineUsers.get(parseInt(to));
        if (recipientSocketId) {
          console.log(
            `📤 Sending message to recipient ${to}, socket: ${recipientSocketId}`,
          );
          io.to(recipientSocketId).emit("new_message", messageData);
        } else {
          console.log(`⚠️ Recipient ${to} is offline, message saved for later`);
        }

        // ✅ Also send back to sender for confirmation
        io.to(socket.id).emit("message_sent", messageData);

        // ✅ Update conversations for both users
        const senderConversations = await ChatModel.getConversations(userId);
        io.to(socket.id).emit("conversations_update", senderConversations);

        if (recipientSocketId) {
          const recipientConversations = await ChatModel.getConversations(
            parseInt(to),
          );
          io.to(recipientSocketId).emit(
            "conversations_update",
            recipientConversations,
          );
        }

        callback({ success: true, data: messageData });
      } catch (error) {
        console.error("Send message error:", error);
        callback({ success: false, error: error.message });
      }
    });

    // ============================================================
    // SEND FILE
    // ============================================================
    socket.on("send_file", async (fileData, callback) => {
      try {
        const { to, fileName, fileSize, fileType, fileBuffer } = fileData;

        if (!to || !fileBuffer) {
          return callback({ success: false, error: "Missing required fields" });
        }

        const [sender] = await pool.query(
          `SELECT name FROM employee_onboarding WHERE id = ?`,
          [userId],
        );
        const senderName = sender[0]?.name || "User";

        // Save file
        const uniqueFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${fileName}`;
        const fs = require("fs");
        const path = require("path");
        const uploadDir = path.join(__dirname, "../uploads/chat");

        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, uniqueFileName);
        const buffer = Buffer.from(fileBuffer);
        fs.writeFileSync(filePath, buffer);

        const fileUrl = `/uploads/chat/${uniqueFileName}`;
        const fileDataObj = {
          url: fileUrl,
          name: fileName,
          size: fileSize,
          type: fileType,
        };

        const messageId = await ChatModel.saveMessage(
          userId,
          to,
          `📎 ${fileName}`,
          "file",
          fileDataObj,
        );
        await ChatModel.updateConversation(
          userId,
          to,
          `📎 ${fileName}`,
          userId,
        );

        const messages = await ChatModel.getMessages(userId, to, 1, 0);
        const messageData = messages[0];
        messageData.from_user_name = senderName;

        const recipientSocketId = onlineUsers.get(parseInt(to));
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("new_file", messageData);
        }

        callback({ success: true, data: messageData });

        // Update conversations
        const conversations = await ChatModel.getConversations(userId);
        io.to(socket.id).emit("conversations_update", conversations);

        if (recipientSocketId) {
          const recipientConversations = await ChatModel.getConversations(
            parseInt(to),
          );
          io.to(recipientSocketId).emit(
            "conversations_update",
            recipientConversations,
          );
        }
      } catch (error) {
        console.error("Send file error:", error);
        callback({ success: false, error: error.message });
      }
    });

    // ============================================================
    // MARK AS READ - Real-time
    // ============================================================
    socket.on("mark_read", async (data) => {
      try {
        const { fromUserId } = data;

        console.log(
          `📖 User ${userId} marked messages from ${fromUserId} as read`,
        );

        // Update database
        const updatedCount = await ChatModel.markAsRead(fromUserId, userId);
        console.log(`✅ Updated ${updatedCount} messages as read`);

        // Get updated unread count for current user
        const unreadCount = await ChatModel.getUnreadCount(userId);
        io.to(socket.id).emit("unread_count_update", { count: unreadCount });

        // Get updated conversations for current user
        const conversations = await ChatModel.getConversations(userId);
        io.to(socket.id).emit("conversations_update", conversations);

        // Notify sender that messages are read
        const senderSocketId = onlineUsers.get(parseInt(fromUserId));
        if (senderSocketId) {
          io.to(senderSocketId).emit("messages_read", {
            by: userId,
            from: fromUserId,
          });

          // Also update sender's conversations
          const senderConversations = await ChatModel.getConversations(
            parseInt(fromUserId),
          );
          io.to(senderSocketId).emit(
            "conversations_update",
            senderConversations,
          );
        }
      } catch (error) {
        console.error("Mark read error:", error);
      }
    });

    // ============================================================
    // TYPING INDICATOR
    // ============================================================
    socket.on("typing", (data) => {
      const { to, isTyping } = data;
      const recipientSocketId = onlineUsers.get(parseInt(to));
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("user_typing", {
          from: userId,
          isTyping,
        });
      }
    });

    // ============================================================
    // DELETE MESSAGE
    // ============================================================
    socket.on("delete_message", async (data) => {
      try {
        const { messageId } = data;

        const [messages] = await pool.query(
          `SELECT from_user, to_user FROM chat_messages WHERE id = ?`,
          [messageId],
        );

        if (messages.length > 0) {
          const message = messages[0];
          const deleted = await ChatModel.deleteMessage(messageId, userId);

          if (deleted) {
            const otherUser =
              message.from_user === userId
                ? message.to_user
                : message.from_user;
            const recipientSocketId = onlineUsers.get(otherUser);
            if (recipientSocketId) {
              io.to(recipientSocketId).emit("message_deleted", { messageId });
            }
            io.to(socket.id).emit("message_deleted", { messageId });
          }
        }
      } catch (error) {
        console.error("Delete message error:", error);
      }
    });

    // ============================================================
    // DISCONNECT
    // ============================================================
    socket.on("disconnect", () => {
      console.log(`❌ User ${userId} disconnected`);
      onlineUsers.delete(userId);
      userSockets.delete(socket.id);
      socket.broadcast.emit("user_offline", { userId, online: false });
    });
  });

  return { onlineUsers, userSockets };
};
