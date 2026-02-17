# Task Collaboration Platform

A real-time task management and collaboration platform built with React, Node.js, PostgreSQL, and WebSockets. Teams can create boards, manage tasks across lists, assign members, and see changes instantly across all connected clients.

---

## Features

- User authentication with JWT (signup, login, token refresh)
- Create and manage project boards with custom background colors
- Add multiple lists per board and reorder them
- Create, edit, delete, and drag-and-drop tasks between lists
- Assign tasks to board members with priority levels and due dates
- Invite members to boards by email and manage their roles
- Real-time updates across all connected users via WebSockets
- Activity history log per board
- Search and pagination on task queries

---

## Tech Stack

**Frontend**
- React 18
- Vite
- @hello-pangea/dnd (drag and drop)
- Socket.io client
- date-fns

**Backend**
- Node.js with Express
- PostgreSQL
- Prisma ORM
- Socket.io
- JSON Web Tokens (JWT)
- Bcrypt
- Zod (validation)

---

## Project Structure

```
task-collab-platform/
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma           # Database schema
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── activityController.js
│   │   │   ├── authController.js
│   │   │   ├── boardController.js
│   │   │   ├── listController.js
│   │   │   └── taskController.js
│   │   ├── middleware/
│   │   │   ├── auth.js             # JWT authentication middleware
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── activity.js
│   │   │   ├── auth.js
│   │   │   ├── boards.js
│   │   │   ├── lists.js
│   │   │   ├── tasks.js
│   │   │   └── users.js            # User search for member invite
│   │   ├── socket/
│   │   │   └── socketHandler.js    # WebSocket event handling
│   │   ├── utils/
│   │   │   ├── jwt.js
│   │   │   └── validators.js       # Zod schemas
│   │   ├── app.js                  # Express app setup
│   │   └── server.js               # HTTP + WebSocket server entry
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MemberManager.jsx   # Invite and manage board members
│   │   │   ├── Sidebar.jsx
│   │   │   └── Toast.jsx
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx
│   │   │   └── SocketContext.jsx
│   │   ├── hooks/
│   │   │   └── useToast.js
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx        # Login and signup
│   │   │   ├── BoardView.jsx       # Board with drag-and-drop lists
│   │   │   └── Dashboard.jsx       # Board listing and creation
│   │   ├── services/
│   │   │   └── api.js              # All API calls, single port config
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── docs/
    ├── ARCHITECTURE.md
    ├── API.md
    
```

---

## Getting Started

### Prerequisites

- Node.js v18 or higher
- PostgreSQL v14 or higher
- Git

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/task-collab-platform.git
cd task-collab-platform
```

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/taskcollab?schema=public"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

Create the database, run migrations, and start the server:

```bash
psql -U postgres -c "CREATE DATABASE taskcollab;"
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Backend runs at `http://localhost:3001`

### 3. Frontend setup

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for access tokens |
| `JWT_REFRESH_SECRET` | Secret key for refresh tokens |
| `PORT` | Backend server port (default 3001) |
| `NODE_ENV` | development or production |
| `FRONTEND_URL` | Allowed CORS origin |

---

## API Overview

All endpoints are prefixed with `/api/v1`.

| Method | Endpoint | Description |
|---|---|---|
| POST | /auth/signup | Create account |
| POST | /auth/login | Login |
| GET | /boards | Get all boards for current user |
| POST | /boards | Create a board |
| GET | /boards/:id | Get board with lists and tasks |
| POST | /boards/:id/members | Add member to board |
| DELETE | /boards/:id/members/:userId | Remove member |
| POST | /lists | Create a list |
| PATCH | /lists/:id | Update a list |
| DELETE | /lists/:id | Delete a list |
| POST | /tasks | Create a task |
| PATCH | /tasks/:id | Update a task |
| PATCH | /tasks/:id/move | Move task to another list |
| DELETE | /tasks/:id | Delete a task |
| GET | /users/search?email= | Search users by email for inviting |
| GET | /activity/board/:id | Get board activity history |

---

## WebSocket Events

The server uses Socket.io rooms named `board:{boardId}`.

**Client to server**

| Event | Description |
|---|---|
| join:board | Subscribe to a board room |
| leave:board | Unsubscribe from a board room |
| task:create | Notify others of new task |
| task:update | Notify others of task update |
| task:move | Notify others of task movement |
| task:delete | Notify others of task deletion |
| list:create | Notify others of new list |
| list:delete | Notify others of list deletion |

**Server to client**

| Event | Description |
|---|---|
| task:created | A new task was created |
| task:updated | A task was updated |
| task:moved | A task was moved between lists |
| task:deleted | A task was deleted |
| list:created | A new list was added |
| list:deleted | A list was removed |
| user:joined | A user joined the board |
| user:left | A user left the board |

---

## Database Schema

The database has 7 tables: User, Board, BoardMember, List, Task, Label, TaskLabel, and Activity.

Key relationships:
- A user can own multiple boards and be a member of others
- A board has multiple lists, each with ordered tasks
- Tasks can be assigned to any board member
- Every action is logged in the Activity table

Full schema is in `backend/prisma/schema.prisma`.

---

## Security

- Passwords hashed with bcrypt
- JWT authentication on all protected routes
- Input validation with Zod on every endpoint
- SQL injection protection via Prisma ORM
- CORS restricted to frontend origin
- Rate limiting on all API routes (100 requests per 15 minutes)

## Deployment

See `docs/DEPLOYMENT.md` for full production deployment instructions covering VPS setup, environment configuration, Nginx reverse proxy, and database backups.

---

---



