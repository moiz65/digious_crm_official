// src/components/Chat/ChatSidebar.jsx
import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { Search, User, Circle, Plus, ArrowLeft } from 'lucide-react';

const ChatSidebar = ({ onSelectChat }) => {
    const { conversations, onlineUsers, unreadCount, searchMessages, fetchAvailableUsers } = useChat();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showUsersList, setShowUsersList] = useState(false);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    
    useEffect(() => {
        fetchAvailableUsers();
    }, []);
    
    const handleSearch = async (term) => {
        setSearchTerm(term);
        if (showUsersList) {
            return;
        }
        if (term.length >= 2) {
            setIsSearching(true);
            const results = await searchMessages(term);
            setSearchResults(results);
            setIsSearching(false);
        } else {
            setSearchResults([]);
        }
    };

    const handleStartNewChatClick = async () => {
        setShowUsersList(true);
        setSearchTerm('');
        setIsLoadingUsers(true);
        try {
            const users = await fetchAvailableUsers();
            setAvailableUsers(users);
        } catch (error) {
            console.error('Error fetching available users:', error);
        } finally {
            setIsLoadingUsers(false);
        }
    };
    
    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days > 7) {
            return date.toLocaleDateString();
        } else if (days > 0) {
            return `${days}d ago`;
        } else {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    };
    
    const displayItems = searchTerm.length >= 2 ? searchResults : conversations;
    const filteredUsers = availableUsers.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.designation?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const handleSelectChat = (chat) => {
        onSelectChat(chat);
        setShowUsersList(false);
        setSearchTerm('');
    };
    
    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
                {showUsersList ? (
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => {
                                setShowUsersList(false);
                                setSearchTerm('');
                            }}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <h2 className="text-lg font-semibold text-gray-800">New Chat</h2>
                    </div>
                ) : (
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">Messages</h2>
                        {unreadCount > 0 && (
                            <span className="text-xs text-red-500 mt-1 block">
                                {unreadCount} unread message{unreadCount !== 1 && 's'}
                            </span>
                        )}
                    </div>
                )}
                
                {!showUsersList && (
                    <button
                        onClick={handleStartNewChatClick}
                        className="p-2 bg-indigo-50 mr-[36px] hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                        title="Start New Chat"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New Chat</span>
                    </button>
                )}
            </div>
            
            {/* Search */}
            <div className="p-3 border-b border-gray-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={showUsersList ? "Search colleagues..." : "Search messages..."}
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-100 border-0 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>
            </div>
            
            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {showUsersList ? (
                    isLoadingUsers ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent"></div>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-12">
                            <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">No colleagues found</p>
                        </div>
                    ) : (
                        filteredUsers.map((userItem) => {
                            const isOnline = onlineUsers.includes(userItem.id);
                            return (
                                <button
                                    key={userItem.id}
                                    onClick={() => {
                                        const conversation = {
                                            id: `new_${userItem.id}`,
                                            other_user: userItem,
                                            other_user_id: userItem.id,
                                            last_message: null,
                                            last_message_time: null,
                                            unread_count: 0,
                                        };
                                        handleSelectChat(conversation);
                                    }}
                                    className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 text-left"
                                >
                                    <div className="relative flex-shrink-0">
                                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                            {userItem.name?.charAt(0) || '?'}
                                        </div>
                                        {isOnline && (
                                            <Circle className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 text-green-500 fill-green-500" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">
                                            {userItem.name}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {userItem.department || 'No Department'} • {userItem.designation || 'No Position'}
                                        </p>
                                    </div>
                                </button>
                            );
                        })
                    )
                ) : isSearching ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent"></div>
                    </div>
                ) : displayItems.length === 0 ? (
                    <div className="text-center py-12">
                        <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">
                            {searchTerm ? 'No results found' : 'No conversations yet'}
                        </p>
                        {!searchTerm && (
                            <p className="text-gray-400 text-xs mt-1">
                                Click "New Chat" to start a conversation
                            </p>
                        )}
                    </div>
                ) : (
                    displayItems.map((item) => {
                        const user = item.other_user || item;
                        const isOnline = onlineUsers.includes(user?.id);
                        const lastMessage = item.last_message || item.message;
                        const timestamp = item.last_message_time || item.created_at;
                        const unread = item.unread_count || 0;
                        
                        return (
                            <button
                                key={user?.id || item.id}
                                onClick={() => handleSelectChat(item)}
                                className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 text-left"
                            >
                                <div className="relative flex-shrink-0">
                                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                        {user?.name?.charAt(0) || '?'}
                                    </div>
                                    {isOnline && (
                                        <Circle className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 text-green-500 fill-green-500" />
                                    )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium text-gray-900 truncate">
                                            {user?.name || 'Unknown User'}
                                        </p>
                                        {timestamp && (
                                            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                                                {formatTime(timestamp)}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 truncate">
                                        {lastMessage || 'No messages yet'}
                                    </p>
                                </div>
                                
                                {unread > 0 && (
                                    <div className="flex-shrink-0 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs font-medium">
                                            {unread > 9 ? '9+' : unread}
                                        </span>
                                    </div>
                                )}
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ChatSidebar;