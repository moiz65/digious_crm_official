// models/chatModel.js
const pool = require('../config/database');

class ChatModel {
    // Save message to database
    static async saveMessage(fromUser, toUser, message, type = 'text', fileData = null) {
        const connection = await pool.getConnection();
        try {
            let query = `
                INSERT INTO chat_messages (from_user, to_user, message, type, created_at)
                VALUES (?, ?, ?, ?, NOW())
            `;
            let params = [fromUser, toUser, message, type];
            
            if (fileData) {
                query = `
                    INSERT INTO chat_messages (from_user, to_user, message, file_url, file_name, file_size, file_type, type, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
                `;
                params = [fromUser, toUser, message, fileData.url, fileData.name, fileData.size, fileData.type, 'file'];
            }
            
            const [result] = await connection.query(query, params);
            return result.insertId;
        } finally {
            connection.release();
        }
    }
    
    // Get messages between two users
    static async getMessages(userId1, userId2, limit = 50, offset = 0) {
        const [rows] = await pool.query(
            `SELECT id, from_user, to_user, message, file_url, file_name, file_size, type, created_at, is_read
             FROM chat_messages 
             WHERE (from_user = ? AND to_user = ?) OR (from_user = ? AND to_user = ?)
             AND is_deleted = FALSE
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [userId1, userId2, userId2, userId1, limit, offset]
        );
        return rows.reverse();
    }
    
    // Get all conversations for a user
    static async getConversations(userId) {
        const [conversations] = await pool.query(
            `SELECT 
                c.*,
                CASE 
                    WHEN c.user1_id = ? THEN c.user2_id 
                    ELSE c.user1_id 
                END as other_user_id,
                (SELECT COUNT(*) FROM chat_messages 
                 WHERE to_user = ? AND from_user = other_user_id AND is_read = FALSE) as unread_count
             FROM chat_conversations c
             WHERE c.user1_id = ? OR c.user2_id = ?
             ORDER BY c.last_message_time DESC`,
            [userId, userId, userId, userId]
        );
        
        // Get user details for each conversation
        if (conversations.length > 0) {
            const userIds = conversations.map(c => c.other_user_id);
            const [users] = await pool.query(
                `SELECT id, name, employee_id, profile_photo, department 
                 FROM employee_onboarding WHERE id IN (?) AND status = 'Active'`,
                [userIds]
            );
            
            const userMap = {};
            users.forEach(u => { userMap[u.id] = u; });
            
            conversations.forEach(c => {
                c.other_user = userMap[c.other_user_id] || null;
            });
        }
        
        return conversations;
    }
    
    // Update or create conversation
    static async updateConversation(user1, user2, lastMessage, senderId) {
        const [user1Id, user2Id] = [Math.min(user1, user2), Math.max(user1, user2)];
        
        await pool.query(
            `INSERT INTO chat_conversations (user1_id, user2_id, last_message, last_message_time, last_message_sender_id)
             VALUES (?, ?, ?, NOW(), ?)
             ON DUPLICATE KEY UPDATE 
             last_message = ?, last_message_time = NOW(), last_message_sender_id = ?`,
            [user1Id, user2Id, lastMessage, senderId, lastMessage, senderId]
        );
    }
    
    // Mark messages as read
    static async markAsRead(fromUser, toUser) {
        const [result] = await pool.query(
            `UPDATE chat_messages 
             SET is_read = TRUE 
             WHERE from_user = ? AND to_user = ? AND is_read = FALSE`,
            [fromUser, toUser]
        );
        return result.affectedRows;
    }
    
    // Delete message (soft delete)
    static async deleteMessage(messageId, userId) {
        const [result] = await pool.query(
            `UPDATE chat_messages 
             SET is_deleted = TRUE, deleted_by = ? 
             WHERE id = ? AND (from_user = ? OR to_user = ?)`,
            [userId, messageId, userId, userId]
        );
        return result.affectedRows > 0;
    }
    
    // Get unread count
    static async getUnreadCount(userId) {
        const [result] = await pool.query(
            `SELECT COUNT(*) as count FROM chat_messages 
             WHERE to_user = ? AND is_read = FALSE AND is_deleted = FALSE`,
            [userId]
        );
        return result[0].count;
    }
    
    // Search messages
    static async searchMessages(userId, searchTerm, limit = 50) {
        const [rows] = await pool.query(
            `SELECT id, from_user, to_user, message, type, created_at
             FROM chat_messages 
             WHERE (from_user = ? OR to_user = ?)
             AND message LIKE ?
             AND is_deleted = FALSE
             ORDER BY created_at DESC
             LIMIT ?`,
            [userId, userId, `%${searchTerm}%`, limit]
        );
        
        // Fetch user details for both from_user and to_user
        if (rows.length > 0) {
            const userIds = [...new Set([...rows.map(r => r.from_user), ...rows.map(r => r.to_user)])];
            const [users] = await pool.query(
                `SELECT id, name, employee_id, profile_photo, department, designation 
                 FROM employee_onboarding WHERE id IN (?) AND status = 'Active'`,
                [userIds]
            );
            
            const userMap = {};
            users.forEach(u => { userMap[u.id] = u; });
            
            // Enrich rows with user details
            rows.forEach(r => {
                r.from_user_data = userMap[r.from_user] || null;
                r.to_user_data = userMap[r.to_user] || null;
            });
        }
        
        return rows;
    }

    // Get all active users to start a chat with (excluding current user)
    static async getAvailableUsers(currentUserId) {
        const [rows] = await pool.query(
            `SELECT id, name, employee_id, profile_photo, department, designation 
             FROM employee_onboarding 
             WHERE id != ? AND status = 'Active'
             ORDER BY name ASC`,
            [currentUserId]
        );
        return rows;
    }
}

module.exports = ChatModel;