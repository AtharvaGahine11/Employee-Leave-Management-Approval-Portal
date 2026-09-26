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

    let socketUrl = 'http://localhost:5001';
    if (import.meta.env.VITE_SOCKET_URL) {
      socketUrl = import.meta.env.VITE_SOCKET_URL;
    } else if (import.meta.env.PROD && typeof window !== 'undefined') {
      socketUrl = window.location.origin;
    } else if (import.meta.env.VITE_API_BASE_URL) {
      try {
        socketUrl = new URL(import.meta.env.VITE_API_BASE_URL, window.location.origin).origin;
      } catch {
        socketUrl = window.location.origin;
      }
    } else if (typeof window !== 'undefined') {
      socketUrl = window.location.origin;
    }

    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 3,
      timeout: 5000,
    });

    newSocket.on('connect_error', (err) => {
      // Gracefully handle serverless environments without crashing
      setIsConnected(false);
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
