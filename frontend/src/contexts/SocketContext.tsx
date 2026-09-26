import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { NotificationItem } from '../types';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinRequestRoom: (requestId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_API_BASE_URL
      ? new URL(import.meta.env.VITE_API_BASE_URL).origin
      : 'http://localhost:5000';

    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      // Join user room & role room
      newSocket.emit('join_user_room', user.id);
      newSocket.emit('join_role_room', user.role);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen for real-time notifications
    newSocket.on('new_notification', (notification: NotificationItem) => {
      const typeMap: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
        INFO: 'info',
        SUCCESS: 'success',
        WARNING: 'warning',
        DANGER: 'error',
      };
      showToast(notification.message, typeMap[notification.type] || 'info', notification.title);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user, showToast]);

  const joinRequestRoom = (requestId: string) => {
    if (socket && isConnected) {
      socket.emit('join_request_room', requestId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinRequestRoom }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};
