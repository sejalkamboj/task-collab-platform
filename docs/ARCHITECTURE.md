# Task Collaboration Platform - Architecture Documentation

## System Overview

A real-time task collaboration platform enabling teams to create boards, manage tasks, and collaborate seamlessly with instant updates across all connected clients.

## Frontend Architecture

### Technology Stack
- **Framework**: React 18 with Hooks
- **State Management**: Context API + React Query for server state
- **Real-time**: Socket.io-client
- **Drag & Drop**: react-beautiful-dnd
- **Styling**: CSS Modules with design tokens
- **Build Tool**: Vite
- **Testing**: Vitest + React Testing Library

### Component Architecture

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   └── SignupForm.jsx
│   ├── board/
│   │   ├── Board.jsx
│   │   ├── BoardList.jsx
│   │   └── BoardCard.jsx
│   ├── list/
│   │   ├── List.jsx
│   │   ├── ListHeader.jsx
│   │   └── AddList.jsx
│   ├── task/
│   │   ├── Task.jsx
│   │   ├── TaskDetail.jsx
│   │   ├── TaskForm.jsx
│   │   └── TaskCard.jsx
│   ├── common/
│   │   ├── Header.jsx
│   │   ├── Avatar.jsx
│   │   ├── SearchBar.jsx
│   │   └── ActivityFeed.jsx
│   └── layout/
│       ├── AppLayout.jsx
│       └── Sidebar.jsx
├── contexts/
│   ├── AuthContext.jsx
│   ├── SocketContext.jsx
│   └── BoardContext.jsx
├── hooks/
│   ├── useAuth.js
│   ├── useBoard.js
│   ├── useTasks.js
│   └── useRealtime.js
├── services/
│   ├── api.js
│   ├── socket.js
│   └── auth.js
└── utils/
    ├── constants.js
    └── helpers.js
```

### State Management Strategy

1. **Local Component State**: UI-specific state (modals, dropdowns)
2. **Context API**: Global app state (auth, current board)
3. **React Query**: Server state caching and synchronization
4. **WebSocket Events**: Real-time updates trigger cache invalidation

### Real-time Synchronization

**Event Flow**:
```
User Action → Optimistic Update → API Call → WebSocket Broadcast → Other Clients Update
```

**Socket Events**:
- `board:updated` - Board metadata changes
- `list:created` / `list:updated` / `list:deleted`
- `task:created` / `task:updated` / `task:deleted` / `task:moved`
- `member:added` / `member:removed`
- `activity:new` - Activity log entries

**Conflict Resolution**: Last-write-wins with server timestamp authority

## Backend Architecture

### Technology Stack
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **ORM**: Prisma
- **Real-time**: Socket.io
- **Authentication**: JWT + bcrypt
- **Validation**: Zod
- **Testing**: Jest + Supertest

### API Architecture

**REST API Structure**:
```
/api/v1/
├── /auth
│   ├── POST /signup
│   ├── POST /login
│   └── POST /refresh
├── /boards
│   ├── GET    /
│   ├── POST   /
│   ├── GET    /:id
│   ├── PATCH  /:id
│   ├── DELETE /:id
│   └── /members
│       ├── POST   /:boardId/members
│       └── DELETE /:boardId/members/:userId
├── /lists
│   ├── POST   /
│   ├── PATCH  /:id
│   ├── DELETE /:id
│   └── PATCH  /:id/position
├── /tasks
│   ├── GET    / (with pagination & search)
│   ├── POST   /
│   ├── GET    /:id
│   ├── PATCH  /:id
│   ├── DELETE /:id
│   └── PATCH  /:id/move
└── /activity
    └── GET /board/:boardId
```

### Folder Structure

```
backend/
├── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── boardController.js
│   │   ├── listController.js
│   │   ├── taskController.js
│   │   └── activityController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   ├── models/
│   │   └── (Prisma schema)
│   ├── routes/
│   │   ├── auth.js
│   │   ├── boards.js
│   │   ├── lists.js
│   │   ├── tasks.js
│   │   └── activity.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── boardService.js
│   │   ├── taskService.js
│   │   └── activityService.js
│   ├── socket/
│   │   ├── socketHandler.js
│   │   └── events.js
│   ├── utils/
│   │   ├── jwt.js
│   │   └── validators.js
│   └── app.js
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.js
└── tests/
```

### Database Schema Design

**Core Entities**:

```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  password      String
  name          String
  avatar        String?
  createdAt     DateTime @default(now())
  
  // Relations
  ownedBoards   Board[]  @relation("BoardOwner")
  boardMembers  BoardMember[]
  tasks         Task[]   @relation("TaskAssignee")
  createdTasks  Task[]   @relation("TaskCreator")
  activities    Activity[]
}

model Board {
  id          String   @id @default(uuid())
  name        String
  description String?
  background  String?  // color/gradient
  ownerId     String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  owner       User     @relation("BoardOwner", fields: [ownerId])
  members     BoardMember[]
  lists       List[]
  activities  Activity[]
}

model BoardMember {
  id        String   @id @default(uuid())
  boardId   String
  userId    String
  role      String   @default("member") // owner, admin, member
  joinedAt  DateTime @default(now())
  
  board     Board    @relation(fields: [boardId])
  user      User     @relation(fields: [userId])
  
  @@unique([boardId, userId])
}

model List {
  id        String   @id @default(uuid())
  boardId   String
  name      String
  position  Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  board     Board    @relation(fields: [boardId])
  tasks     Task[]
}

model Task {
  id          String   @id @default(uuid())
  listId      String
  title       String
  description String?
  position    Int
  dueDate     DateTime?
  priority    String?  // low, medium, high
  createdById String
  assigneeId  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  list        List     @relation(fields: [listId])
  createdBy   User     @relation("TaskCreator", fields: [createdById])
  assignee    User?    @relation("TaskAssignee", fields: [assigneeId])
  labels      TaskLabel[]
  activities  Activity[]
}

model Label {
  id    String @id @default(uuid())
  name  String
  color String
  
  tasks TaskLabel[]
}

model TaskLabel {
  taskId  String
  labelId String
  
  task    Task   @relation(fields: [taskId])
  label   Label  @relation(fields: [labelId])
  
  @@id([taskId, labelId])
}

model Activity {
  id        String   @id @default(uuid())
  boardId   String
  userId    String
  taskId    String?
  action    String   // created, updated, moved, deleted, assigned
  metadata  Json     // Additional context
  createdAt DateTime @default(now())
  
  board     Board    @relation(fields: [boardId])
  user      User     @relation(fields: [userId])
  task      Task?    @relation(fields: [taskId])
}
```

**Indexes for Performance**:
```sql
CREATE INDEX idx_board_members ON BoardMember(boardId, userId);
CREATE INDEX idx_list_board ON List(boardId);
CREATE INDEX idx_task_list ON Task(listId);
CREATE INDEX idx_task_assignee ON Task(assigneeId);
CREATE INDEX idx_activity_board ON Activity(boardId, createdAt DESC);
```

## Real-time Communication Strategy

### WebSocket Architecture

**Connection Flow**:
1. Client authenticates via JWT
2. Socket.io handshake with token validation
3. Client joins board-specific rooms
4. Server broadcasts events to room participants

**Room Structure**:
- `board:{boardId}` - All members of a board
- `user:{userId}` - Personal notifications

**Event Types**:
```javascript
// Server → Client
socket.emit('board:updated', { boardId, data })
socket.emit('list:created', { boardId, list })
socket.emit('task:moved', { boardId, taskId, fromListId, toListId, position })
socket.emit('activity:new', { boardId, activity })

// Client → Server
socket.emit('join:board', { boardId })
socket.emit('leave:board', { boardId })
```

**Optimistic Updates**:
1. Client updates local state immediately
2. Client sends API request
3. On success: WebSocket broadcasts to others
4. On failure: Client reverts local state

### Scalability Considerations

**Current Architecture** (Single Server):
- Redis for Socket.io adapter (horizontal scaling ready)
- PostgreSQL with connection pooling
- JWT stateless authentication

**Future Scaling**:

1. **Horizontal Scaling**:
   - Redis adapter for Socket.io (multi-server support)
   - Load balancer with sticky sessions
   - Stateless backend services

2. **Database Optimization**:
   - Read replicas for queries
   - Caching layer (Redis) for frequently accessed data
   - Pagination on all list endpoints

3. **WebSocket Optimization**:
   - Dedicated WebSocket servers
   - Room-based broadcasting to reduce overhead
   - Message throttling for high-frequency updates

4. **Content Delivery**:
   - CDN for static assets
   - Image optimization and lazy loading
   - Code splitting for frontend

## Security Considerations

1. **Authentication**: JWT with refresh tokens, httpOnly cookies
2. **Authorization**: Role-based access control (RBAC)
3. **Input Validation**: Zod schemas on all API endpoints
4. **SQL Injection**: Prisma ORM with parameterized queries
5. **XSS Protection**: Content Security Policy, input sanitization
6. **Rate Limiting**: Express rate limiter on API routes
7. **CORS**: Configured for specific origins only

## Deployment Architecture

**Development**:
- Frontend: `npm run dev` (Vite dev server on :5173)
- Backend: `npm run dev` (nodemon on :3000)
- Database: PostgreSQL (Docker or local)

**Production**:
```
┌─────────────┐
│   Nginx     │ (Reverse proxy + SSL)
└──────┬──────┘
       │
   ┌───┴────┐
   │        │
┌──▼───┐ ┌─▼────────┐
│React │ │ Node.js  │
│ SPA  │ │ + Socket │
└──────┘ └─────┬────┘
                │
         ┌──────▼──────┐
         │ PostgreSQL  │
         └─────────────┘
```

**Environment Variables**:
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
FRONTEND_URL=http://localhost:5173
NODE_ENV=production
PORT=3000
```

## Testing Strategy

**Frontend**:
- Unit: Component logic with Vitest
- Integration: User flows with Testing Library
- E2E: Critical paths with Playwright (optional)

**Backend**:
- Unit: Service layer business logic
- Integration: API endpoints with Supertest
- Real-time: Socket.io event handling

**Coverage Target**: 70%+ on critical paths

## Performance Optimization

1. **Frontend**:
   - React.memo for expensive components
   - Virtual scrolling for large task lists
   - Debounced search and autosave
   - Code splitting per route

2. **Backend**:
   - Database query optimization with indexes
   - Pagination on all list endpoints
   - Connection pooling
   - Caching frequently accessed boards

3. **Real-time**:
   - Throttle high-frequency events (drag events)
   - Binary protocol for Socket.io when needed
   - Selective event subscriptions

## Monitoring & Logging

**Application Logs**:
- Winston for structured logging
- Log levels: error, warn, info, debug

**Metrics** (Future):
- Active WebSocket connections
- API response times
- Database query performance
- Error rates

**Health Checks**:
- `/health` endpoint
- Database connection status
- Socket.io server status
