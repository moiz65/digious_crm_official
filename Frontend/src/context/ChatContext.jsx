// src/contexts/ChatContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";
import { API_BASE_URL, SOCKET_URL } from "../config/api";

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [typingStatus, setTypingStatus] = useState({});

  const currentUserId = user?.id || user?.employeeId;

  useEffect(() => {
    if (!token || !currentUserId) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket connected");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    });

    newSocket.on("online_users", (userIds) => {
      setOnlineUsers(userIds);
    });

    newSocket.on("user_online", ({ userId, online }) => {
      setOnlineUsers((prev) =>
        online ? [...prev, userId] : prev.filter((id) => id !== userId),
      );
    });

    newSocket.on("user_offline", ({ userId }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    newSocket.on("new_message", (message) => {
      console.log("📩 New message received:", message);

      // Always add to messages if in current chat
      setMessages((prev) => {
        // Check if message already exists
        const exists = prev.some((m) => m.id === message.id);
        if (!exists) {
          // If this is the current chat, add to messages
          if (currentChat?.other_user?.id === message.from_user) {
            return [...prev, message];
          }
        }
        return prev;
      });

      // Update conversation list (sidebar)
      setConversations((prev) => {
        const existingIndex = prev.findIndex(
          (c) => c.other_user?.id === message.from_user,
        );

        const newConversation = {
          id: existingIndex >= 0 ? prev[existingIndex].id : Date.now(),
          other_user: {
            id: message.from_user,
            name: message.from_user_name || "User",
          },
          other_user_id: message.from_user,
          last_message: message.message,
          last_message_time: message.created_at,
          unread_count:
            (existingIndex >= 0 ? prev[existingIndex]?.unread_count || 0 : 0) +
            1,
        };

        if (existingIndex >= 0) {
          const newConversations = [...prev];
          newConversations[existingIndex] = newConversation;
          return newConversations.sort(
            (a, b) =>
              new Date(b.last_message_time) - new Date(a.last_message_time),
          );
        } else {
          return [newConversation, ...prev];
        }
      });

      // Update unread count
      setUnreadCount((prev) => prev + 1);
    });

    // Also update new_file handler similarly
    newSocket.on("new_file", (fileData) => {
      console.log("📎 New file received:", fileData);

      setMessages((prev) => {
        const exists = prev.some((m) => m.id === fileData.id);
        if (!exists) {
          if (currentChat?.other_user?.id === fileData.from_user) {
            return [...prev, fileData];
          }
        }
        return prev;
      });

      // Update conversation list
      setConversations((prev) => {
        const existingIndex = prev.findIndex(
          (c) => c.other_user?.id === fileData.from_user,
        );

        const newConversation = {
          id: existingIndex >= 0 ? prev[existingIndex].id : Date.now(),
          other_user: {
            id: fileData.from_user,
            name: fileData.from_user_name || "User",
          },
          other_user_id: fileData.from_user,
          last_message: fileData.message,
          last_message_time: fileData.created_at,
          unread_count:
            (existingIndex >= 0 ? prev[existingIndex]?.unread_count || 0 : 0) +
            1,
        };

        if (existingIndex >= 0) {
          const newConversations = [...prev];
          newConversations[existingIndex] = newConversation;
          return newConversations.sort(
            (a, b) =>
              new Date(b.last_message_time) - new Date(a.last_message_time),
          );
        } else {
          return [newConversation, ...prev];
        }
      });

      setUnreadCount((prev) => prev + 1);
    });

    // Handle typing indicator
    newSocket.on("user_typing", ({ from, isTyping }) => {
      setTypingStatus((prev) => ({ ...prev, [from]: isTyping }));
    });

    // Handle read receipts
    newSocket.on("messages_read", ({ by, from }) => {
      console.log(`📖 Messages read by ${by} from ${from}`);

      // Update messages in current chat if open
      setMessages((prev) =>
        prev.map((msg) => ({
          ...msg,
          is_read: msg.from_user === by ? true : msg.is_read,
        })),
      );

      // Update conversations to remove unread count for that user
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.other_user?.id === by || conv.other_user_id === by) {
            return { ...conv, unread_count: 0 };
          }
          return conv;
        }),
      );

      // Update global unread count
      fetchUnreadCount();
    });

    // Also listen for conversations_update to update unread counts
    newSocket.on("conversations_update", (updatedConversations) => {
      setConversations(updatedConversations);

      // Update unread count from conversations
      const totalUnread = updatedConversations.reduce(
        (sum, conv) => sum + (conv.unread_count || 0),
        0,
      );
      setUnreadCount(totalUnread);
    });

    newSocket.on("unread_count_update", ({ count }) => {
      setUnreadCount(count);
    });

    newSocket.on("message_deleted", ({ messageId }) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    });

    fetchConversations();
    fetchUnreadCount();

    return () => {
      newSocket.disconnect();
    };
  }, [token, currentUserId]);

  const handleNewMessage = (message) => {
    // Add to messages if in current chat
    setMessages((prev) => {
      if (currentChat?.other_user?.id === message.from_user) {
        // Check if message already exists (prevent duplicates)
        const exists = prev.some((m) => m.id === message.id);
        if (!exists) {
          return [...prev, message];
        }
        return prev;
      }
      return prev;
    });

    // Update conversation list
    setConversations((prev) => {
      const existingIndex = prev.findIndex(
        (c) => c.other_user?.id === message.from_user,
      );

      const newConversation = {
        id: existingIndex >= 0 ? prev[existingIndex].id : Date.now(),
        other_user: {
          id: message.from_user,
          name: message.from_user_name || "User",
        },
        other_user_id: message.from_user,
        last_message: message.message,
        last_message_time: message.created_at,
        unread_count:
          (existingIndex >= 0 ? prev[existingIndex]?.unread_count || 0 : 0) + 1,
      };

      if (existingIndex >= 0) {
        const newConversations = [...prev];
        newConversations[existingIndex] = newConversation;
        return newConversations.sort(
          (a, b) =>
            new Date(b.last_message_time) - new Date(a.last_message_time),
        );
      } else {
        return [newConversation, ...prev];
      }
    });

    setUnreadCount((prev) => prev + 1);
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/chat/conversations`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      if (data.success) {
        setConversations(data.data);
      }
    } catch (error) {
      console.error("Fetch conversations error:", error);
    }
  };

  const fetchChatHistory = async (otherUserId, pageNum = 1) => {
    setIsLoading(true);
    const limit = 50;
    const offset = (pageNum - 1) * limit;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/chat/history/${otherUserId}?limit=${limit}&offset=${offset}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      if (data.success) {
        if (pageNum === 1) {
          setMessages(data.data);
        } else {
          setMessages((prev) => [...data.data, ...prev]);
        }
        return { messages: data.data, hasMore: data.hasMore };
      }
    } catch (error) {
      console.error("Fetch chat history error:", error);
    } finally {
      setIsLoading(false);
    }
    return { messages: [], hasMore: false };
  };

  const sendMessage = async (to, message) => {
    if (!socket || !isConnected) {
      console.error("Socket not connected");
      return false;
    }

    const optimisticMessage = {
      id: `temp_${Date.now()}`,
      from_user: currentUserId,
      to_user: to,
      message: message,
      type: "text",
      created_at: new Date().toISOString(),
      is_read: false,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    return new Promise((resolve) => {
      socket.emit(
        "send_message",
        { to, message, type: "text", from_name: user?.name },
        (response) => {
          if (response.success) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === optimisticMessage.id ? response.data : msg,
              ),
            );
            fetchConversations(); // Update sidebar immediately
            resolve(true);
          } else {
            setMessages((prev) =>
              prev.filter((msg) => msg.id !== optimisticMessage.id),
            );
            resolve(false);
          }
        },
      );
    });
  };

  const sendFile = async (to, file) => {
    if (!socket || !isConnected) {
      console.error("Socket not connected");
      return false;
    }

    const optimisticFileMessage = {
      id: `temp_file_${Date.now()}`,
      from_user: currentUserId,
      to_user: to,
      message: `📎 ${file.name}`,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      type: "file",
      created_at: new Date().toISOString(),
      is_read: false,
    };

    setMessages((prev) => [...prev, optimisticFileMessage]);

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target.result;
        const fileData = {
          to,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          fileBuffer: buffer,
          from_name: user?.name,
        };

        socket.emit("send_file", fileData, (response) => {
          if (response.success) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === optimisticFileMessage.id ? response.data : msg,
              ),
            );
            fetchConversations(); // Update sidebar immediately
            resolve(true);
          } else {
            setMessages((prev) =>
              prev.filter((msg) => msg.id !== optimisticFileMessage.id),
            );
            reject(response.error);
          }
        });
      };
      reader.onerror = () => {
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== optimisticFileMessage.id),
        );
        reject("Failed to read file");
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const markAsRead = async (fromUserId) => {
    if (socket && isConnected) {
      socket.emit("mark_read", { fromUserId });
    }
  };

  const sendTyping = (to, isTyping) => {
    if (socket && isConnected) {
      socket.emit("typing", { to, isTyping });
    }
  };

  const deleteMessage = async (messageId) => {
    if (socket && isConnected) {
      socket.emit("delete_message", { messageId });
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/chat/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setUnreadCount(data.data.unreadCount);
      }
    } catch (error) {
      console.error("Fetch unread count error:", error);
    }
  };

  const searchMessages = async (searchTerm) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/chat/search?q=${encodeURIComponent(searchTerm)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error("Search messages error:", error);
      return [];
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/chat/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        return data.data;
      }
    } catch (error) {
      console.error("Fetch available users error:", error);
    }
    return [];
  };

  // ✅ FIXED: selectChat function - proper user data handling
  const selectChat = (conversation) => {
    // Handle both cases: when conversation has other_user object or just other_user_id
    let chatUser = conversation.other_user;
    let otherUserId = chatUser?.id || conversation.other_user_id;

    // If no user data, fetch it
    if (!chatUser?.name && otherUserId) {
      // Use existing user data from conversations or fetch
      const existingConv = conversations.find(
        (c) => c.other_user?.id === otherUserId,
      );
      if (existingConv?.other_user) {
        chatUser = existingConv.other_user;
      }
    }

    if (!otherUserId) {
      console.error("Cannot select chat: missing user ID", conversation);
      return;
    }

    const fullConversation = {
      id: conversation.id,
      other_user: chatUser || { id: otherUserId, name: "Loading..." },
      other_user_id: otherUserId,
      last_message: conversation.last_message,
      last_message_time: conversation.last_message_time,
      unread_count: conversation.unread_count || 0,
    };

    setCurrentChat(fullConversation);
    fetchChatHistory(otherUserId);

    if (fullConversation.unread_count > 0) {
      markAsRead(otherUserId);
    }
  };

  const clearCurrentChat = () => {
    setCurrentChat(null);
    setMessages([]);
  };

  const value = {
    socket,
    isConnected,
    onlineUsers,
    conversations,
    currentChat,
    messages,
    unreadCount,
    isLoading,
    typingStatus,
    sendMessage,
    sendFile,
    sendTyping,
    deleteMessage,
    markAsRead,
    selectChat,
    clearCurrentChat,
    fetchConversations,
    fetchChatHistory,
    searchMessages,
    fetchAvailableUsers,
    setMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
