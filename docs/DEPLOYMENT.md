# Deployment Guide

This guide covers deploying the Task Collaboration Platform to production.

## Table of Contents
1. [Environment Setup](#environment-setup)
2. [Database Deployment](#database-deployment)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Scaling Considerations](#scaling-considerations)

---

## Environment Setup

### Required Services
- **PostgreSQL 14+** (managed database)
- **Node.js 18+** hosting (backend)
- **Static hosting** (frontend)
- **Redis** (optional, for multi-server Socket.IO)

### Recommended Providers

**Backend:**
- Railway.app (easiest)
- Heroku
- Render
- AWS EC2/ECS

**Frontend:**
- Vercel (recommended)
- Netlify
- Cloudflare Pages

**Database:**
- Railway PostgreSQL
- AWS RDS
- Supabase
- Heroku Postgres

---

## Database Deployment

### Option 1: Railway (Recommended)

1. Create Railway account at railway.app
2. Create new PostgreSQL database
3. Copy connection string

### Option 2: AWS RDS

1. Create PostgreSQL instance in RDS
2. Configure security groups (allow port 5432)
3. Note connection details

### Run Migrations

```bash
# Set DATABASE_URL environment variable
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Run migration
psql $DATABASE_URL < backend/src/db/schema.sql
```

---

## Backend Deployment

### Option 1: Railway

1. **Create Project:**
   ```bash
   cd backend
   railway login
   railway init
   railway link
   ```

2. **Set Environment Variables:**
   ```bash
   railway variables set DATABASE_URL="postgresql://..."
   railway variables set JWT_SECRET="$(openssl rand -base64 32)"
   railway variables set NODE_ENV="production"
   railway variables set ALLOWED_ORIGINS="https://your-frontend.vercel.app"
   ```

3. **Deploy:**
   ```bash
   railway up
   ```

4. **Note the URL:** Railway provides a URL like `https://your-app.railway.app`

### Option 2: Heroku

1. **Create App:**
   ```bash
   heroku create your-app-name
   ```

2. **Add PostgreSQL:**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

3. **Set Config:**
   ```bash
   heroku config:set JWT_SECRET="$(openssl rand -base64 32)"
   heroku config:set NODE_ENV="production"
   heroku config:set ALLOWED_ORIGINS="https://your-frontend.vercel.app"
   ```

4. **Deploy:**
   ```bash
   git push heroku main
   ```

### Option 3: Docker Container

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy source
COPY backend .

# Build TypeScript
RUN npm run build

# Start
CMD ["npm", "start"]
```

**Build and Run:**
```bash
docker build -t taskcollab-backend .
docker run -p 3001:3001 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="your-secret" \
  taskcollab-backend
```

---

## Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Configure:**
   Create `frontend/vercel.json`:
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "framework": "vite"
   }
   ```

3. **Set Environment:**
   Create `frontend/.env.production`:
   ```env
   VITE_API_URL=https://your-backend.railway.app/api
   VITE_SOCKET_URL=https://your-backend.railway.app
   ```

4. **Deploy:**
   ```bash
   cd frontend
   vercel --prod
   ```

### Option 2: Netlify

1. **Build Command:** `npm run build`
2. **Publish Directory:** `dist`
3. **Environment Variables:**
   ```
   VITE_API_URL=https://your-backend.railway.app/api
   VITE_SOCKET_URL=https://your-backend.railway.app
   ```

### Option 3: Static S3 + CloudFront

1. **Build:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Upload to S3:**
   ```bash
   aws s3 sync dist/ s3://your-bucket/
   ```

3. **Configure CloudFront** for SPA routing

---

## Post-Deployment Checklist

### Backend

- [ ] Environment variables set correctly
- [ ] Database migrations run successfully
- [ ] CORS configured for frontend domain
- [ ] JWT secret is strong and secure
- [ ] Health endpoint accessible (`/health`)
- [ ] Logs configured and monitoring setup

### Frontend

- [ ] API URL points to production backend
- [ ] Socket URL points to production backend
- [ ] Build successful with no errors
- [ ] Routes work correctly (SPA fallback)
- [ ] Assets loading properly

### Security

- [ ] HTTPS enabled on both frontend and backend
- [ ] JWT secret is environment variable (not hardcoded)
- [ ] Database credentials secured
- [ ] CORS restricted to frontend domain only
- [ ] Rate limiting configured (optional but recommended)

### Testing

- [ ] User can register and login
- [ ] Boards can be created
- [ ] Tasks can be added and moved
- [ ] Real-time updates work across multiple tabs
- [ ] Mobile responsive

---

## Scaling Considerations

### Horizontal Scaling (Multiple Backend Servers)

**Problem:** Socket.IO connections tied to specific servers.

**Solution:** Redis adapter for Socket.IO

1. **Add Redis:**
   ```bash
   npm install @socket.io/redis-adapter redis
   ```

2. **Update Socket Setup:**
   ```typescript
   import { createAdapter } from '@socket.io/redis-adapter';
   import { createClient } from 'redis';

   const pubClient = createClient({ url: process.env.REDIS_URL });
   const subClient = pubClient.duplicate();

   await Promise.all([pubClient.connect(), subClient.connect()]);

   io.adapter(createAdapter(pubClient, subClient));
   ```

3. **Deploy Redis:**
   - Railway Redis
   - AWS ElastiCache
   - Redis Cloud

### Database Scaling

**Read Replicas:**
```typescript
// Separate read/write pools
const writePool = new Pool({ connectionString: WRITE_DB_URL });
const readPool = new Pool({ connectionString: READ_DB_URL });

// Use read pool for queries
export const queryRead = (text, params) => readPool.query(text, params);
export const queryWrite = (text, params) => writePool.query(text, params);
```

**Connection Pooling:**
```typescript
const pool = new Pool({
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Caching Layer

**Redis for Frequently Accessed Data:**
```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache board data
export const getCachedBoard = async (boardId: string) => {
  const cached = await redis.get(`board:${boardId}`);
  if (cached) return JSON.parse(cached);

  const board = await fetchBoardFromDB(boardId);
  await redis.setex(`board:${boardId}`, 300, JSON.stringify(board));
  return board;
};
```

### CDN for Static Assets

- Upload frontend build to CDN
- Configure CloudFront or similar
- Enable compression and caching

### Load Balancing

**Nginx Config:**
```nginx
upstream backend {
    server backend1.example.com:3001;
    server backend2.example.com:3001;
    server backend3.example.com:3001;
}

server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## Monitoring

### Application Monitoring

**Recommended Tools:**
- Sentry (error tracking)
- LogRocket (session replay)
- Datadog (APM)

**Setup Sentry:**
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

app.use(Sentry.Handlers.errorHandler());
```

### Database Monitoring

- Enable slow query logging
- Monitor connection pool usage
- Track query performance

### Server Monitoring

- CPU and memory usage
- Request rate and latency
- Error rate
- WebSocket connection count

---

## Backup Strategy

### Database Backups

**Automated Daily Backups:**
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_$DATE.sql"

pg_dump $DATABASE_URL > $BACKUP_FILE
aws s3 cp $BACKUP_FILE s3://your-backups/

# Keep only last 30 days
find . -name "backup_*.sql" -mtime +30 -delete
```

**Schedule with cron:**
```bash
0 2 * * * /path/to/backup.sh
```

### Disaster Recovery

1. Test restore procedure monthly
2. Store backups in multiple regions
3. Document recovery steps
4. Keep environment variable backups

---

## Performance Optimization

### Frontend

- Code splitting with React.lazy
- Image optimization
- Minification and compression
- Service Worker for offline support

### Backend

- Database query optimization
- Add appropriate indexes
- Implement caching
- Use connection pooling
- Compress API responses

### Database

```sql
-- Add indexes for common queries
CREATE INDEX idx_tasks_list_position ON tasks(list_id, position);
CREATE INDEX idx_activities_board_created ON activities(board_id, created_at DESC);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM tasks WHERE list_id = 'abc';
```

---

## Security Hardening

1. **Rate Limiting:**
   ```typescript
   import rateLimit from 'express-rate-limit';

   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 100
   });

   app.use('/api/', limiter);
   ```

2. **Helmet for Security Headers:**
   ```typescript
   import helmet from 'helmet';
   app.use(helmet());
   ```

3. **Input Validation:**
   ```typescript
   import { z } from 'zod';

   const taskSchema = z.object({
     title: z.string().min(1).max(255),
     priority: z.enum(['low', 'medium', 'high', 'urgent'])
   });
   ```

4. **SQL Injection Prevention:**
   - Always use parameterized queries
   - Never concatenate user input

---

## Troubleshooting

### Common Issues

**WebSocket Not Connecting:**
- Check CORS configuration
- Verify JWT token is valid
- Ensure backend URL is correct
- Check firewall rules

**Database Connection Errors:**
- Verify connection string
- Check database is running
- Verify network access
- Check connection pool limits

**Slow Queries:**
- Add database indexes
- Implement caching
- Optimize N+1 queries
- Use database query analysis

---

## Support

For deployment issues:
1. Check application logs
2. Review environment variables
3. Test with curl/Postman
4. Check network connectivity

---

**Deployment Complete! 🚀**

Your Task Collaboration Platform is now live and scalable!
