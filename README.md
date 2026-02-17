# Task Collaboration Platform 🚀

A production-ready, real-time task collaboration platform similar to Trello/Notion with drag-and-drop, WebSocket sync, and modern UI/UX.

## 🎯 Features

### Core Functionality
- ✅ User authentication (signup/login with JWT)
- ✅ Create multiple boards with lists and tasks
- ✅ Drag-and-drop tasks across lists (real-time)
- ✅ Assign users to tasks
- ✅ Real-time updates via WebSocket
- ✅ Activity history tracking
- ✅ Task search functionality
- ✅ Task priorities and due dates

### Technical Highlights
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with proper indexing
- **Real-time**: Socket.IO for bidirectional communication
- **State Management**: Zustand (lightweight alternative to Redux)
- **Drag & Drop**: @dnd-kit library
- **Styling**: Tailwind CSS + Framer Motion animations

## 📁 Project Structure

```
task-collab-platform/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── services/         # Business logic
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Auth, validation
│   │   ├── db/              # Database connection & schema
│   │   ├── socket/          # WebSocket handlers
│   │   ├── types/           # TypeScript types
│   │   └── server.ts        # Express app entry
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API & Socket services
│   │   ├── store/          # Zustand state management
│   │   ├── hooks/          # Custom React hooks
│   │   ├── types/          # TypeScript types
│   │   └── App.tsx         # Main app component
│   ├── package.json
│   └── vite.config.ts
└── docs/
    ├── ARCHITECTURE.md     # System architecture
    ├── API.md             # API documentation
    └── DEPLOYMENT.md      # Deployment guide
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### 1. Database Setup

```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE taskcollab;
CREATE USER taskuser WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE taskcollab TO taskuser;
\q

# Run migrations
cd backend
cat src/db/schema.sql | psql -U taskuser -d taskcollab
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Start development server
npm run dev

# Server runs on http://localhost:3001
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# App runs on http://localhost:3000
```

### 4. Test the Application

1. Open http://localhost:3000
2. Register a new account
3. Create a board
4. Add lists and tasks
5. Try drag-and-drop!

## 🏗️ Architecture Overview

### Backend Architecture

```
┌─────────────────────────────────────────┐
│           Client Requests               │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│    Express Server (Port 3001)           │
│    ├── CORS Middleware                  │
│    ├── JWT Authentication               │
│    └── JSON Body Parser                 │
└─────────────┬───────────────────────────┘
              │
      ┌───────┴────────┐
      │                │
      ▼                ▼
┌───────────┐    ┌─────────────┐
│ REST API  │    │  Socket.IO  │
│ /api/*    │    │  Real-time  │
└─────┬─────┘    └──────┬──────┘
      │                  │
      │   ┌──────────────┤
      │   │              │
      ▼   ▼              ▼
┌──────────────┐  ┌─────────────┐
│ Controllers  │  │  Socket      │
│              │  │  Handlers    │
└──────┬───────┘  └──────┬──────┘
       │                  │
       ▼                  │
┌──────────────┐         │
│  Services    │         │
│  - Auth      │         │
│  - Board     │         │
│  - List      │         │
│  - Task      │         │
│  - Activity  │         │
└──────┬───────┘         │
       │                 │
       ▼                 │
┌──────────────┐        │
│ PostgreSQL   │◄───────┘
│ Database     │
└──────────────┘
```

### Frontend Architecture

```
┌─────────────────────────────────────────┐
│            React App (SPA)              │
└─────────────┬───────────────────────────┘
              │
      ┌───────┴────────┐
      │                │
      ▼                ▼
┌───────────┐    ┌─────────────┐
│   Pages   │    │ Components  │
│ - Login   │    │ - TaskCard  │
│ - Board   │    │ - ListCol   │
│ - Dash    │    │ - Navbar    │
└─────┬─────┘    └──────┬──────┘
      │                  │
      │   ┌──────────────┤
      │   │              │
      ▼   ▼              ▼
┌──────────────┐  ┌─────────────┐
│   Services   │  │   Store     │
│ - API (REST) │  │  (Zustand)  │
│ - Socket.IO  │  │  - Auth     │
└──────┬───────┘  │  - Board    │
       │          └─────────────┘
       │
       ▼
┌──────────────┐
│   Backend    │
│  API + WS    │
└──────────────┘
```

### Real-Time Sync Strategy

1. **User Action** → Component calls API service
2. **API Call** → Updates server database
3. **Server Response** → Returns updated data
4. **Local Update** → Updates Zustand store
5. **Socket Emit** → Broadcasts change to room
6. **Other Clients** → Receive socket event
7. **Auto Update** → Update their local store

```javascript
// Example: Creating a task
1. User clicks "Add Task"
2. TaskCard → taskAPI.create()
3. Server → INSERT INTO tasks
4. Server → Returns new task
5. Client → useBoardStore.addTask()
6. Client → socket.emit('task-created')
7. Other users → socket.on('task-created')
8. Other users → useBoardStore.addTask()
```

## 📡 API Documentation

### Authentication Endpoints

```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/profile (protected)
```

### Board Endpoints

```
POST   /api/boards (protected)
GET    /api/boards (protected)
GET    /api/boards/:boardId (protected)
PUT    /api/boards/:boardId (protected)
DELETE /api/boards/:boardId (protected)
POST   /api/boards/:boardId/members (protected)
```

### List Endpoints

```
POST   /api/boards/:boardId/lists (protected)
PUT    /api/lists/:listId (protected)
DELETE /api/lists/:listId (protected)
```

### Task Endpoints

```
POST   /api/lists/:listId/tasks (protected)
PUT    /api/tasks/:taskId (protected)
DELETE /api/tasks/:taskId (protected)
POST   /api/tasks/:taskId/assign (protected)
DELETE /api/tasks/:taskId/unassign (protected)
GET    /api/boards/:boardId/tasks/search (protected)
```

### Activity Endpoints

```
GET /api/boards/:boardId/activities (protected)
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

## 🔐 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT-based authentication
- ✅ Protected API routes
- ✅ Socket.IO authentication
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS configuration
- ✅ Input validation

## 📊 Database Schema

See `backend/src/db/schema.sql` for the complete schema.

**Key Tables:**
- `users` - User accounts
- `boards` - Project boards
- `board_members` - Board access control
- `lists` - Columns within boards
- `tasks` - Individual tasks
- `task_assignees` - Task assignments
- `activities` - Audit trail

**Relationships:**
- One-to-Many: User → Boards
- Many-to-Many: Users ↔ Boards (via board_members)
- Many-to-Many: Users ↔ Tasks (via task_assignees)
- One-to-Many: Board → Lists → Tasks

## ⚡ Performance Optimizations

1. **Database Indexes** on frequently queried columns
2. **Connection Pooling** for PostgreSQL
3. **Zustand** for minimal re-renders
4. **React.memo** for expensive components
5. **Optimistic Updates** before API confirmation
6. **Lazy Loading** for routes
7. **WebSocket** rooms for targeted updates

## 🚀 Deployment

### Backend Deployment (Heroku/Railway)

```bash
# Build
npm run build

# Start production
npm start
```

### Frontend Deployment (Vercel/Netlify)

```bash
# Build
npm run build

# Preview
npm run preview
```

### Environment Variables

**Backend:**
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
PORT=3001
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend.com
```

**Frontend:**
```
VITE_API_URL=https://your-backend.com/api
VITE_SOCKET_URL=https://your-backend.com
```

## 🛠️ Tech Stack Details

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Utility-first CSS
- **Framer Motion** - Animations
- **@dnd-kit** - Drag and drop
- **Zustand** - State management
- **Socket.IO Client** - WebSocket
- **Axios** - HTTP client
- **React Router** - Routing

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **Socket.IO** - WebSocket server
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Zod** - Schema validation

## 📈 Scalability Considerations

1. **Horizontal Scaling**
   - Stateless API servers
   - Redis for Socket.IO adapter (multi-server)
   - Load balancer distribution

2. **Database Scaling**
   - Read replicas for queries
   - Partitioning for large tables
   - Caching layer (Redis)

3. **Real-time Optimization**
   - Socket.IO Redis adapter
   - Room-based broadcasting
   - Message throttling

4. **Frontend Optimization**
   - Code splitting
   - Asset optimization
   - CDN for static files

## 👥 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Support

For issues or questions:
- Open a GitHub issue
- Check existing documentation
- Review the code comments

---

Built with ❤️ using modern web technologies
