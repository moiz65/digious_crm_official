// src/pages/ChatPage.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ChatProvider } from '../context/ChatContext';
import ChatDashboard from '../components/ChatDashboard';

const ChatPage = () => {
    const { user } = useAuth();
    
    if (!user) {
        return null;
    }
    
    return (
        <ChatProvider>
            <div className="h-screen bg-gray-100">
                {/* Your existing layout with sidebar */}
                <div className="flex h-full">
                    {/* Main content area */}
                    <div className="flex-1">
                        <div className="p-4">
                            <h1 className="text-2xl font-bold">Chat Page</h1>
                            <p>Welcome to the Chat Page!</p>
                        </div>
                    </div>
                </div>
                
                {/* Chat widget - appears floating */}
                <ChatDashboard />
            </div>
        </ChatProvider>
    );
};

export default ChatPage;