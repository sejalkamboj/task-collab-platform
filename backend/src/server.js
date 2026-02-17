import { createServer } from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import { initializeSocket } from './socket/socketHandler.js';

dotenv.config();

const PORT = process.env.PORT || 3000;
const server = createServer(app);

// Initialize WebSocket
const io = initializeSocket(server);

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🚀 Task Collaboration Platform Server                 ║
║                                                          ║
║   ✅ HTTP Server running on port ${PORT}                   ║
║   ✅ WebSocket Server initialized                        ║
║   ✅ Ready to accept connections                         ║
║                                                          ║
║   API: http://localhost:${PORT}/api/v1                     ║
║   Health: http://localhost:${PORT}/health                  ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default server;
