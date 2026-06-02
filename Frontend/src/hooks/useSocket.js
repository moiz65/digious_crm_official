// src/hooks/useSocket.js
import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { SOCKET_URL } from '../config/api';

export const useSocket = () => {
    const { token } = useAuth();
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    
    useEffect(() => {
        if (!token) return;
        
        const newSocket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket'],
            reconnection: true
        });
        
        newSocket.on('connect', () => {
            console.log('Socket connected');
            setIsConnected(true);
        });
        
        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        });
        
        newSocket.on('connect_error', (error) => {
            console.error('Socket error:', error);
            setIsConnected(false);
        });
        
        setSocket(newSocket);
        
        return () => {
            newSocket.disconnect();
        };
    }, [token]);
    
    return { socket, isConnected };
};