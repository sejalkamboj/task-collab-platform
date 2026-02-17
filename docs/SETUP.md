# Task Collaboration Platform - Setup Guide

## 🚀 Quick Start

This guide will help you set up and run the Real-Time Task Collaboration Platform locally.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** or **yarn** - Comes with Node.js

## Project Structure

```
task-collab-platform/
├── backend/              # Node.js + Express + Prisma + Socket.io
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/   # Auth, validation, error handling
│   │   ├── routes/       # API routes
│   │   ├── socket/       # WebSocket handlers
│   │   ├── utils/        # JWT, validators
│   │   ├── app.js        # Express app
│   │   └── server.js     # Server entry point
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   └── package.json
├── frontend/             # React + Vite + Socket.io-client
│   ├── src/
│   │   ├── App.jsx       # Main application
│   │   ├── App.css       # Styles
│   │   └── main.jsx      # Entry point
│   ├── index.html
│   └── package.json
└── docs/
    └── ARCHITECTURE.md   # System architecture
```

## Step 1: Database Setup

### Option A: Local PostgreSQL

1. Install PostgreSQL on your system
2. Create a new database:

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE taskcollab;

# Exit
\q
```

3. Note your connection details:
   - Host: `localhost`
   - Port: `5432` (default)
   - User: `postgres` (or your username)
   - Password: (your password)
   - Database: `taskcollab`

### Option B: Docker PostgreSQL

```bash
docker run --name taskcollab-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=taskcollab \
  -p 5432:5432 \
  -d postgres:15
```

## Step 2: Backend Setup

1. Navigate to backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
cp .env.example .env
```

4. Edit `.env` file with your database credentials:

```env
# Database - Update with your PostgreSQL credentials
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/taskcollab?schema=public"

# JWT Secrets - CHANGE THESE IN PRODUCTION!
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"

# Server
PORT=3000
NODE_ENV=development

# Frontend URL
FRONTEND_URL="http://localhost:5173"
```

5. Generate Prisma client:

```bash
npm run prisma:generate
```

6. Run database migrations:

```bash
npm run prisma:migrate
```

This will create all the necessary tables in your database.

7. Start the backend server:

```bash
npm run dev
```

You should see:
```
╔══════════════════════════════════════════════════════════╗
║   🚀 Task Collaboration Platform Server                 ║
║   ✅ HTTP Server running on port 3000                   ║
║   ✅ WebSocket Server initialized                        ║
╚══════════════════════════════════════════════════════════╝
```

## Step 3: Frontend Setup

1. Open a new terminal and navigate to frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

You should see:
```
  VITE v5.0.11  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## Step 4: Access the Application

1. Open your browser and go to: `http://localhost:5173`

2. Create a new account:
   - Click "Sign up"
   - Enter your name, email, and password
   - Click "Sign Up"

3. Start using the platform:
   - Create your first board
   - Add lists to organize tasks
   - Create tasks and drag them between lists
   - Watch real-time updates as you collaborate!

## Testing Real-Time Features

To test real-time collaboration:

1. Open the application in two different browser windows (or use incognito mode)
2. Sign in with two different accounts
3. Create a board and add the second user as a member
4. Both users join the same board
5. Make changes in one window and watch them appear instantly in the other!

## Troubleshooting

### Backend won't start

**Problem**: `Error: connect ECONNREFUSED ::1:5432`

**Solution**: PostgreSQL is not running. Start PostgreSQL service:
- **Windows**: Start PostgreSQL from Services
- **Mac**: `brew services start postgresql`
- **Linux**: `sudo service postgresql start`

---

**Problem**: `Prisma Client could not locate`

**Solution**: Regenerate Prisma client:
```bash
cd backend
npm run prisma:generate
```

### Frontend won't connect

**Problem**: `WebSocket connection failed`

**Solution**: 
1. Make sure backend is running on port 3000
2. Check CORS settings in `backend/src/app.js`
3. Verify `FRONTEND_URL` in backend `.env` matches your frontend URL

### Database migration fails

**Problem**: `Migration failed`

**Solution**:
1. Drop the database and recreate it:
```sql
DROP DATABASE taskcollab;
CREATE DATABASE taskcollab;
```
2. Run migrations again:
```bash
npm run prisma:migrate
```

## Production Deployment

### Environment Variables

Update these for production:

**Backend `.env`**:
```env
DATABASE_URL="postgresql://user:pass@prod-host:5432/taskcollab"
JWT_SECRET="[Generate strong random string]"
JWT_REFRESH_SECRET="[Generate another strong random string]"
PORT=3000
NODE_ENV=production
FRONTEND_URL="https://your-frontend-domain.com"
```

### Build Commands

**Frontend**:
```bash
cd frontend
npm run build
```

This creates a `dist` folder with optimized production files.

**Backend**:
```bash
cd backend
npm run prisma:generate
npm start
```

### Deployment Options

#### Option 1: Traditional VPS (DigitalOcean, AWS EC2, etc.)

1. Set up PostgreSQL on your server
2. Clone repository
3. Follow backend and frontend setup steps
4. Use PM2 to run backend:
```bash
npm install -g pm2
pm2 start src/server.js --name taskcollab-api
```
5. Serve frontend with Nginx or Apache

#### Option 2: Platform as a Service

**Backend (Render, Railway, Heroku)**:
- Connect GitHub repository
- Set environment variables
- Deploy

**Frontend (Vercel, Netlify)**:
- Connect GitHub repository
- Build command: `npm run build`
- Publish directory: `dist`

**Database (Supabase, Neon, Railway)**:
- Create PostgreSQL instance
- Copy connection string to `DATABASE_URL`

### Nginx Configuration (Optional)

If you're serving both frontend and backend from the same domain:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

## API Documentation

### Authentication

**POST** `/api/v1/auth/signup`
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**POST** `/api/v1/auth/login`
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Boards

**GET** `/api/v1/boards` - Get all boards

**POST** `/api/v1/boards` - Create board
```json
{
  "name": "Product Roadmap",
  "description": "Q1 2024 Planning",
  "background": "#6366f1"
}
```

**GET** `/api/v1/boards/:id` - Get board with lists and tasks

### Lists

**POST** `/api/v1/lists` - Create list
```json
{
  "boardId": "uuid",
  "name": "To Do"
}
```

### Tasks

**POST** `/api/v1/tasks` - Create task
```json
{
  "listId": "uuid",
  "title": "Design homepage",
  "description": "Create mockups",
  "priority": "high",
  "assigneeId": "uuid"
}
```

**PATCH** `/api/v1/tasks/:id/move` - Move task
```json
{
  "listId": "uuid",
  "position": 2
}
```

## WebSocket Events

### Client → Server

- `join:board` - Join board room
- `leave:board` - Leave board room
- `task:create` - Notify task creation
- `task:update` - Notify task update
- `task:move` - Notify task movement
- `list:create` - Notify list creation

### Server → Client

- `board:joined` - Board joined successfully
- `task:created` - New task created
- `task:updated` - Task updated
- `task:moved` - Task moved
- `list:created` - New list created
- `user:joined` - User joined board
- `user:left` - User left board

## Performance Optimization

### Backend

- Database indexes already configured in Prisma schema
- Connection pooling enabled by default
- Rate limiting active (100 requests per 15 minutes)

### Frontend

- Code splitting with Vite
- Lazy loading for components
- React.memo for expensive components
- Debounced search and autosave

## Security Best Practices

1. **Change JWT secrets** in production (use strong random strings)
2. **Use HTTPS** in production
3. **Enable CORS** only for your frontend domain
4. **Keep dependencies updated**: `npm audit` and `npm update`
5. **Use environment variables** for all secrets
6. **Implement rate limiting** (already configured)
7. **Sanitize user inputs** (validators already in place)

## Database Backup

Regular backups are essential:

```bash
# Backup
pg_dump taskcollab > backup_$(date +%Y%m%d).sql

# Restore
psql taskcollab < backup_20240101.sql
```

## Monitoring & Logging

For production, consider adding:

- **Application monitoring**: New Relic, Datadog
- **Error tracking**: Sentry
- **Logging**: Winston (already configured), LogDNA, Papertrail
- **Uptime monitoring**: UptimeRobot, Pingdom

## Support & Resources

- **Architecture Documentation**: `/docs/ARCHITECTURE.md`
- **Prisma Docs**: https://www.prisma.io/docs
- **Socket.io Docs**: https://socket.io/docs/
- **React Docs**: https://react.dev/

## Next Steps

Now that your platform is running:

1. **Customize the design**: Edit `frontend/src/App.css`
2. **Add features**: User profiles, file uploads, comments
3. **Enhance security**: Add 2FA, session management
4. **Scale**: Add Redis for Socket.io adapter
5. **Monitor**: Set up logging and error tracking

Happy collaborating! 🎉
