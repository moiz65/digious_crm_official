// src/components/Chat/ChatWindow.jsx
// Add this effect to listen for message updates while chat is open

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import ChatHeader from './ChatHeader';
import { Loader } from 'lucide-react';

const ChatWindow = ({ onBack }) => {
    const {
        currentChat,
        messages,
        isLoading,
        fetchChatHistory,
        sendTyping,
        markAsRead,
        typingStatus,
        socket,
        isConnected,
        setMessages,
    } = useChat();
    
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const messagesContainerRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const hasMarkedReadRef = useRef(false);
    const isInitialLoadRef = useRef(true);

    const user = currentChat?.other_user;

    // ✅ Listen for new messages via socket while chat is open
    useEffect(() => {
        if (!socket || !isConnected) return;
        
        const handleNewMessage = (message) => {
            // If message is from current chat user, add to messages
            if (user?.id === message.from_user) {
                console.log("📩 Real-time message received in chat window:", message);
                setMessages((prev) => {
                    const exists = prev.some((m) => m.id === message.id);
                    if (!exists) {
                        return [...prev, message];
                    }
                    return prev;
                });
            }
        };
        
        const handleNewFile = (fileData) => {
            if (user?.id === fileData.from_user) {
                console.log("📎 Real-time file received in chat window:", fileData);
                setMessages((prev) => {
                    const exists = prev.some((m) => m.id === fileData.id);
                    if (!exists) {
                        return [...prev, fileData];
                    }
                    return prev;
                });
            }
        };
        
        socket.on("new_message", handleNewMessage);
        socket.on("new_file", handleNewFile);
        
        return () => {
            socket.off("new_message", handleNewMessage);
            socket.off("new_file", handleNewFile);
        };
    }, [socket, isConnected, user?.id]);

    // Mark messages as read when chat opens
    useEffect(() => {
        if (user?.id && currentChat?.unread_count > 0 && !hasMarkedReadRef.current) {
            hasMarkedReadRef.current = true;
            markAsRead(user.id);
        }
    }, [user?.id, currentChat?.unread_count]);

    // Reset mark read flag when chat changes
    useEffect(() => {
        hasMarkedReadRef.current = false;
        isInitialLoadRef.current = true;
    }, [currentChat?.other_user?.id]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (messagesContainerRef.current && messages.length > 0) {
            setTimeout(() => {
                messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
            }, 100);
        }
    }, [messages]);

    const loadMoreMessages = async () => {
        if (!hasMore || loadingMore || isLoading) return;
        
        const previousScrollHeight = messagesContainerRef.current?.scrollHeight || 0;
        
        setLoadingMore(true);
        const nextPage = page + 1;
        const result = await fetchChatHistory(user.id, nextPage);
        
        if (result && result.messages.length > 0) {
            setPage(nextPage);
            setHasMore(result.hasMore);
            
            setTimeout(() => {
                if (messagesContainerRef.current) {
                    const newScrollHeight = messagesContainerRef.current.scrollHeight;
                    const scrollDiff = newScrollHeight - previousScrollHeight;
                    messagesContainerRef.current.scrollTop = scrollDiff;
                }
            }, 100);
        } else {
            setHasMore(false);
        }
        setLoadingMore(false);
    };

    const handleScroll = (e) => {
        const { scrollTop } = e.currentTarget;
        if (scrollTop < 50 && hasMore && !loadingMore && !isLoading) {
            loadMoreMessages();
        }
    };

    const handleTyping = (isTypingNow) => {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        
        if (user?.id) {
            sendTyping(user.id, isTypingNow);
        }
        
        if (isTypingNow) {
            typingTimeoutRef.current = setTimeout(() => {
                if (user?.id) {
                    sendTyping(user.id, false);
                }
            }, 2000);
        }
    };

    if (!user) {
        return null;
    }

    const isOtherTyping = typingStatus[user.id] === true;

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <ChatHeader user={user} onBack={onBack} />

            {/* Messages Container */}
            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-x-hidden px-4 py-3 space-y-2 chat-messages-scroll"
                style={{
                    scrollBehavior: 'smooth',
                    background: '#f9fafb'
                }}
            >
                {loadingMore && (
                    <div className="flex justify-center py-3">
                        <Loader className="w-5 h-5 text-gray-400 animate-spin" />
                    </div>
                )}
                
                <div className="space-y-2">
                    {messages.filter(Boolean).map((message, index) => (
                        <MessageBubble key={message.id || index} message={message} />
                    ))}
                </div>
                
                {isOtherTyping && (
                    <div className="flex justify-start py-2">
                        <div className="bg-gray-200 rounded-2xl rounded-bl-none px-4 py-2">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ChatInput onTyping={handleTyping} />
        </div>
    );
};

export default ChatWindow;