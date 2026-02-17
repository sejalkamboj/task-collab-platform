import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { AuthPayload } from '../types';

interface AuthSocket extends Socket {
  user?: AuthPayload;
}

export const setupSocketIO = (io: SocketIOServer) => {
  // Authentication middleware for Socket.IO
  io.use((socket: AuthSocket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'default-secret'
      ) as AuthPayload;
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthSocket) => {
    console.log('Client connected:', socket.user?.userId);

    // Join board room
    socket.on('join-board', (boardId: string) => {
      socket.join(`board:${boardId}`);
      console.log(`User ${socket.user?.userId} joined board ${boardId}`);
    });

    // Leave board room
    socket.on('leave-board', (boardId: string) => {
      socket.leave(`board:${boardId}`);
      console.log(`User ${socket.user?.userId} left board ${boardId}`);
    });

    // Broadcast task updates
    socket.on('task-updated', (data: { boardId: string; task: any }) => {
      socket.to(`board:${data.boardId}`).emit('task-updated', data.task);
    });

    // Broadcast task creation
    socket.on('task-created', (data: { boardId: string; task: any }) => {
      socket.to(`board:${data.boardId}`).emit('task-created', data.task);
    });

    // Broadcast task deletion
    socket.on('task-deleted', (data: { boardId: string; taskId: string }) => {
      socket.to(`board:${data.boardId}`).emit('task-deleted', data.taskId);
    });

    // Broadcast list updates
    socket.on('list-updated', (data: { boardId: string; list: any }) => {
      socket.to(`board:${data.boardId}`).emit('list-updated', data.list);
    });

    // Broadcast list creation
    socket.on('list-created', (data: { boardId: string; list: any }) => {
      socket.to(`board:${data.boardId}`).emit('list-created', data.list);
    });

    // Broadcast list deletion
    socket.on('list-deleted', (data: { boardId: string; listId: string }) => {
      socket.to(`board:${data.boardId}`).emit('list-deleted', data.listId);
    });

    // Broadcast task movement (drag and drop)
    socket.on('task-moved', (data: {
      boardId: string;
      taskId: string;
      sourceListId: string;
      targetListId: string;
      newPosition: number;
    }) => {
      socket.to(`board:${data.boardId}`).emit('task-moved', data);
    });

    // Broadcast user typing indicator
    socket.on('user-typing', (data: { boardId: string; taskId: string; userName: string }) => {
      socket.to(`board:${data.boardId}`).emit('user-typing', data);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.user?.userId);
    });
  });

  return io;
};

// Helper function to emit to a specific board
export const emitToBoardRoom = (
  io: SocketIOServer,
  boardId: string,
  event: string,
  data: any
) => {
  io.to(`board:${boardId}`).emit(event, data);
};
