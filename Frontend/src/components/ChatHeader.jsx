// src/components/Chat/ChatHeader.jsx
import React from 'react';
import { ArrowLeft, MoreVertical, Circle } from 'lucide-react';
import { useChat } from '../context/ChatContext';

const ChatHeader = ({ user, onBack }) => {
    const { onlineUsers } = useChat();
    const isOnline = onlineUsers.includes(user?.id);
    
    return (
        <div className="px-4 py-3 border-b border-gray-100 bg-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
                
                <div className="relative">
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {user?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    {isOnline && (
                        <Circle className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 text-green-500 fill-green-500" />
                    )}
                </div>
                
                <div>
                    <h3 className="font-medium text-gray-800 text-sm">{user?.name || 'Unknown User'}</h3>
                    <p className="text-xs text-gray-400">
                        {isOnline ? 'Online' : 'Offline'}
                    </p>
                </div>
            </div>
            
            <button className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>
        </div>
    );
};

export default ChatHeader;