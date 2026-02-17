import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = verifyAccessToken(token);
      socket.userId = decoded.userId;
      
      // Load user data
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, avatar: true }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.userId})`);

    // Join board room
    socket.on('join:board', async (boardId) => {
      try {
        // Verify user has access to board
        const board = await prisma.board.findUnique({
          where: { id: boardId },
          include: { members: true }
        });

        if (!board) {
          return socket.emit('error', { message: 'Board not found' });
        }

        const hasAccess = board.ownerId === socket.userId || 
                         board.members.some(m => m.userId === socket.userId);

        if (!hasAccess) {
          return socket.emit('error', { message: 'Access denied' });
        }

        socket.join(`board:${boardId}`);
        console.log(`${socket.user.name} joined board: ${boardId}`);

        // Notify others that user joined
        socket.to(`board:${boardId}`).emit('user:joined', {
          user: socket.user,
          boardId
        });

        // Send current board state
        socket.emit('board:joined', { boardId });
      } catch (error) {
        console.error('Error joining board:', error);
        socket.emit('error', { message: 'Failed to join board' });
      }
    });

    // Leave board room
    socket.on('leave:board', (boardId) => {
      socket.leave(`board:${boardId}`);
      console.log(`${socket.user.name} left board: ${boardId}`);

      socket.to(`board:${boardId}`).emit('user:left', {
        user: socket.user,
        boardId
      });
    });

    // Board events
    socket.on('board:update', (data) => {
      socket.to(`board:${data.boardId}`).emit('board:updated', data);
    });

    // List events
    socket.on('list:create', (data) => {
      socket.to(`board:${data.boardId}`).emit('list:created', data);
    });

    socket.on('list:update', (data) => {
      socket.to(`board:${data.boardId}`).emit('list:updated', data);
    });

    socket.on('list:delete', (data) => {
      socket.to(`board:${data.boardId}`).emit('list:deleted', data);
    });

    socket.on('list:reorder', (data) => {
      socket.to(`board:${data.boardId}`).emit('list:reordered', data);
    });

    // Task events
    socket.on('task:create', (data) => {
      socket.to(`board:${data.boardId}`).emit('task:created', data);
    });

    socket.on('task:update', (data) => {
      socket.to(`board:${data.boardId}`).emit('task:updated', data);
    });

    socket.on('task:delete', (data) => {
      socket.to(`board:${data.boardId}`).emit('task:deleted', data);
    });

    socket.on('task:move', (data) => {
      socket.to(`board:${data.boardId}`).emit('task:moved', data);
    });

    // Member events
    socket.on('member:add', (data) => {
      socket.to(`board:${data.boardId}`).emit('member:added', data);
    });

    socket.on('member:remove', (data) => {
      socket.to(`board:${data.boardId}`).emit('member:removed', data);
    });

    // Activity events
    socket.on('activity:new', (data) => {
      socket.to(`board:${data.boardId}`).emit('activity:new', data);
    });

    // Typing indicators (optional feature)
    socket.on('task:typing', (data) => {
      socket.to(`board:${data.boardId}`).emit('task:typing', {
        ...data,
        user: socket.user
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name}`);
    });
  });

  return io;
};

export default initializeSocket;
