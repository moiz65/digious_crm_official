// src/hooks/useChat.js
import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';

export const useChat = (otherUserId) => {
    const { user, token } = useAuth();
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const messagesEndRef = useRef(null);
    
    const loadMessages = useCallback(async (reset = false) => {
        if (!otherUserId) return;
        
        setIsLoading(true);
        const currentPage = reset ? 1 : page;
        const limit = 50;
        
        try {
            const response = await fetch(
                `${API_BASE_URL}/chat/history/${otherUserId}?limit=${limit}&offset=${(currentPage - 1) * limit}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await response.json();
            
            if (data.success) {
                if (reset) {
                    setMessages(data.data);
                    setPage(2);
                } else {
                    setMessages(prev => [...data.data, ...prev]);
                    setPage(prev => prev + 1);
                }
                setHasMore(data.hasMore);
            }
        } catch (error) {
            console.error('Load messages error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [otherUserId, token, page]);
    
    const sendMessage = useCallback(async (message) => {
        try {
            const response = await fetch(`${API_BASE_URL}/chat/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ to: otherUserId, message, type: 'text' })
            });
            const data = await response.json();
            if (data.success && data.data) {
                setMessages(prev => [...prev, data.data]);
                return true;
            }
        } catch (error) {
            console.error('Send message error:', error);
        }
        return false;
    }, [otherUserId, token]);
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    
    useEffect(() => {
        if (otherUserId) {
            loadMessages(true);
        }
    }, [otherUserId]);
    
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    
    return {
        messages,
        isLoading,
        hasMore,
        loadMore: () => loadMessages(false),
        sendMessage,
        messagesEndRef,
        scrollToBottom
    };
};