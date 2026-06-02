// src/components/Chat/ChatDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import { MessageCircle, X } from 'lucide-react';

const ChatDashboard = () => {
    const { conversations, currentChat, selectChat, unreadCount, clearCurrentChat } = useChat();
    const [isOpen, setIsOpen] = useState(false);
    
    const handleClose = () => {
        setIsOpen(false);
        clearCurrentChat();
    };
    
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110"
            >
                <div className="relative">
                    <MessageCircle className="w-6 h-6" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>
            </button>
        );
    }
    
    return (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[550px] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden border border-gray-200">
            {/* Close button */}
            <button
                onClick={handleClose}
                className="absolute top-[1.1rem] right-3 z-10 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
                <X className="w-4 h-4 text-gray-500" />
            </button>
            
            {currentChat ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                    <ChatWindow onBack={() => clearCurrentChat()} />
                </div>
            ) : (
                <div className="flex-1 overflow-hidden">
                    <ChatSidebar onSelectChat={selectChat} />
                </div>
            )}
        </div>
    );
};

export default ChatDashboard;