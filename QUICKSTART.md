# Quick Start Guide 🚀

Get your Task Collaboration Platform running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed
- Git (optional)

## Installation Steps

### 1. Database Setup (2 minutes)

```bash
# Start PostgreSQL service
sudo systemctl start postgresql  # Linux
# or
brew services start postgresql   # macOS

# Run the automated setup script
cd task-collab-platform
chmod +x setup.sh
./setup.sh
```

The script automatically:
- Creates the database
- Creates the user
- Runs migrations
- Sets up environment files

### 2. Start Backend (1 minute)

Open a new terminal:

```bash
cd task-collab-platform/backend
npm run dev
```

You should see:
```
╔═══════════════════════════════════════════╗
║  Task Collaboration Platform - Backend   ║
║  Server running on port 3001             ║
║  Environment: development                ║
╚═══════════════════════════════════════════╝
```

### 3. Start Frontend (1 minute)

Open another terminal:

```bash
cd task-collab-platform/frontend
npm run dev
```

You should see:
```
  VITE v5.0.8  ready in 523 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### 4. Open Application (30 seconds)

1. Open your browser to http://localhost:3000
2. Click "Sign up" to create an account
3. Create your first board!

## First Steps Tutorial

### Create Your First Board

1. **Register** - Sign up with your email
2. **Create Board** - Click "Create Board" button
3. **Add Lists** - Add columns like "To Do", "In Progress", "Done"
4. **Add Tasks** - Click "+" in any list to add tasks
5. **Drag & Drop** - Drag tasks between lists
6. **Assign Tasks** - Click task menu to assign to users

### Test Real-Time Sync

1. Open the same board in two browser tabs
2. Make changes in one tab
3. Watch them appear instantly in the other! 🎉

## What's Included

✅ **Full-Stack Application**
- Modern React frontend with TypeScript
- Node.js/Express backend with TypeScript
- PostgreSQL database with proper schema
- Real-time WebSocket communication

✅ **Complete Features**
- User authentication (JWT)
- Board, list, and task management
- Drag-and-drop interface
- Real-time collaboration
- Activity history
- Task search
- Priority levels
- Due dates
- User assignments

✅ **Production-Ready Code**
- Proper error handling
- Input validation
- Security best practices
- Optimized database queries
- State management (Zustand)
- API documentation
- Deployment guides

## Project Structure

```
task-collab-platform/
├── backend/              # Node.js + Express backend
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── services/     # Business logic
│   │   ├── db/          # Database schema
│   │   ├── socket/      # WebSocket handlers
│   │   └── server.ts    # Main entry point
│   └── package.json
│
├── frontend/            # React + TypeScript frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API & Socket services
│   │   ├── store/       # State management
│   │   └── App.tsx      # Main app
│   └── package.json
│
├── docs/               # Documentation
│   ├── API.md          # API reference
│   └── DEPLOYMENT.md   # Deployment guide
│
├── README.md           # Full documentation
└── setup.sh           # Automated setup script
```

## Common Commands

### Backend

```bash
cd backend

# Development
npm run dev

# Build
npm run build

# Production
npm start

# Run tests
npm test
```

### Frontend

```bash
cd frontend

# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview

# Run tests
npm test
```

## Troubleshooting

### Database Connection Error

**Problem:** Can't connect to PostgreSQL

**Solution:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Verify connection
psql -U taskuser -d taskcollab
```

### Port Already in Use

**Problem:** Port 3000 or 3001 already in use

**Solution:**
```bash
# Find and kill process on port 3001
sudo lsof -ti:3001 | xargs kill -9

# Or change port in .env files
```

### Module Not Found

**Problem:** Missing dependencies

**Solution:**
```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### WebSocket Not Connecting

**Problem:** Real-time updates not working

**Solution:**
1. Check backend is running
2. Verify VITE_SOCKET_URL in frontend/.env
3. Check browser console for errors
4. Ensure CORS is configured properly

## Next Steps

1. **Customize** - Modify colors, fonts, and styling in `frontend/tailwind.config.js`
2. **Add Features** - Add comments, file attachments, or notifications
3. **Deploy** - Follow `docs/DEPLOYMENT.md` to deploy to production
4. **Scale** - Add Redis for multi-server support (see deployment docs)

## Documentation

- **Full README**: `README.md` - Complete overview and architecture
- **API Docs**: `docs/API.md` - All API endpoints with examples
- **Deployment**: `docs/DEPLOYMENT.md` - Production deployment guide
- **Database Schema**: `backend/src/db/schema.sql` - Complete schema

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Framer Motion (animations)
- @dnd-kit (drag and drop)
- Zustand (state management)
- Socket.IO Client (WebSocket)
- Axios (HTTP client)

**Backend:**
- Node.js + Express
- TypeScript
- PostgreSQL
- Socket.IO (WebSocket)
- JWT (authentication)
- Bcrypt (password hashing)

## Support

If you encounter issues:

1. Check the logs in both terminals
2. Review the documentation
3. Check environment variables are set correctly
4. Ensure database is running and migrations completed

## Demo Credentials

For testing, you can create any user account. The first user created will own the first board.

---

**You're all set!** 🎉

Open http://localhost:3000 and start collaborating!
