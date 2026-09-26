import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

let io: Server | null = null;

export const initSocketIO = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: (origin: any, callback: any) => {
        if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
          return callback(null, true);
        }
        callback(null, true);
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`🔌 Socket connected: ${socket.id}`);

    // Join user room by employee ID
    socket.on('join_user_room', (employeeId: string) => {
      if (employeeId) {
        socket.join(`user:${employeeId}`);
        logger.debug(`Socket ${socket.id} joined room user:${employeeId}`);
      }
    });

    // Join role room (e.g. role:MANAGER, role:HR)
    socket.on('join_role_room', (role: string) => {
      if (role) {
        socket.join(`role:${role}`);
        logger.debug(`Socket ${socket.id} joined room role:${role}`);
      }
    });

    // Join request specific room for real-time comments
    socket.on('join_request_room', (requestId: string) => {
      if (requestId) {
        socket.join(`request:${requestId}`);
        logger.debug(`Socket ${socket.id} joined room request:${requestId}`);
      }
    });

    socket.on('disconnect', () => {
      logger.debug(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  logger.info('🚀 Socket.IO engine initialized');
  return io;
};

export const getSocketIO = (): Server | null => io;

export const emitToUser = (employeeId: string, event: string, payload: any) => {
  if (io) {
    io.to(`user:${employeeId}`).emit(event, payload);
  }
};

export const emitToRole = (role: string, event: string, payload: any) => {
  if (io) {
    io.to(`role:${role}`).emit(event, payload);
  }
};

export const emitToRequestRoom = (requestId: string, event: string, payload: any) => {
  if (io) {
    io.to(`request:${requestId}`).emit(event, payload);
  }
};
