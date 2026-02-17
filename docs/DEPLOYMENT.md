# Deployment Guide

This guide covers deploying the Task Collaboration Platform using Neon (database), Render (backend), and Vercel (frontend). All three services have free tiers.

---

## Overview

| Service | Purpose | URL after deploy |
|---|---|---|
| Neon | PostgreSQL database | managed, no public URL |
| Render | Node.js backend + WebSocket | https://taskcollab-api-yt8x.onrender.com |
| Vercel | React frontend | https://task-collab-platform-woad.vercel.app/ |

---

## Prerequisites

- Code pushed to a GitHub repository
- Accounts on neon.tech, render.com, and vercel.com (all free, sign up with GitHub)

---

## Step 1 — Database on Neon

1. Go to https://neon.tech and sign in with GitHub
2. Click "Create Project"
3. Name it `taskcollab`, choose the region closest to you, click Create
4. Once created, click "Connection Details" or the "Connect" button
5. From the dropdown select "Prisma" to get the correctly formatted connection string
6. Copy the connection string — it looks like this:

```
postgresql://neondb_owner:abc123@ep-cool-sun-123.us-east-2.aws.neon.tech/neondb?sslmode=require
```

Keep this string ready for the next step. Make sure it starts with `postgresql://` and ends with `?sslmode=require`.

---

## Step 2 — Backend on Render

1. Go to https://render.com and sign in with GitHub
2. Click "New" then "Web Service"
3. Connect your GitHub repository
4. Fill in the following settings:

| Field | Value |
|---|---|
| Name | taskcollab-api |
| Root Directory | backend |
| Runtime | Node |
| Build Command | `npm install && npx prisma generate && npx prisma migrate deploy` |
| Start Command | `node src/server.js` |

5. Scroll down to "Environment Variables" and add each one by clicking "+ Add Environment Variable":

| Key | Value |
|---|---|
| DATABASE_URL | your Neon connection string from Step 1 |
| JWT_SECRET | any long random string e.g. taskcollab-jwt-secret-key-2024 |
| JWT_REFRESH_SECRET | another long random string e.g. taskcollab-refresh-secret-2024 |
| PORT | 3001 |
| NODE_ENV | production |
| FRONTEND_URL | https://taskcollab.vercel.app (update this after Vercel deploy) |

6. Click "Deploy Web Service"
7. Wait 3-5 minutes for the build to complete
8. Copy your backend URL from the top of the page — it looks like `https://taskcollab-api.onrender.com`

### Common Render build errors

**Error: Unknown command "deployyarn"**
The build command has a typo. Go to Settings, find Build Command, select all text and retype it exactly as shown above.

**Error: the URL must start with the protocol postgresql://**
The DATABASE_URL is missing or incorrectly formatted. Go to Environment tab, check the value starts with `postgresql://` and has no extra spaces.

**Error: P1001 - Can't reach database server**
The Neon connection string is wrong or the Neon project is paused. Log in to neon.tech and verify the project is active.

---

## Step 3 — Update frontend API URLs

Before deploying to Vercel, update three files in your frontend to point to the Render backend URL.

**frontend/src/services/api.js** — line 1:
```js
const API_BASE = 'https://taskcollab-api.onrender.com/api/v1'
```

**frontend/src/components/MemberManager.jsx** — the API_BASE is imported from api.js so no change needed if using the latest version.

**frontend/src/contexts/SocketContext.jsx** — the io() call:
```js
const s = io('https://taskcollab-api.onrender.com', {
```

After making these changes, push to GitHub:

```bash
git add .
git commit -m "Update API URLs for production"
git push
```

---

## Step 4 — Frontend on Vercel

1. Go to https://vercel.com and sign in with GitHub
2. Click "Add New Project"
3. Import your GitHub repository
4. Set the following configuration:

| Field | Value |
|---|---|
| Framework Preset | Vite |
| Root Directory | frontend |
| Build Command | npm run build |
| Output Directory | dist |

5. Click "Deploy"
6. Wait 1-2 minutes
7. Copy your Vercel URL — it looks like `https://task-collab-platform.vercel.app`

---

## Step 5 — Update FRONTEND_URL on Render

Now that you have the real Vercel URL, update the environment variable on Render:

1. Go to your Render service dashboard
2. Click the "Environment" tab
3. Find `FRONTEND_URL` and update it to your actual Vercel URL
4. Click "Save Changes"
5. Render will automatically redeploy with the new value

This is required for CORS to work correctly between the frontend and backend.

---

## Step 6 — Verify the deployment

1. Open your Vercel URL in the browser
2. Sign up for a new account
3. Create a board and add a list and task
4. Open the same URL in another browser or incognito window
5. Sign in with a different account
6. Have the board owner invite the second user via the Members panel
7. Both users should see real-time updates when tasks are moved or created

To verify the backend is running independently:
```
https://taskcollab-api.onrender.com/health
```
This should return `{"status":"ok"}`.

---

## Important notes

**Render free tier sleeps after 15 minutes of inactivity.** The first request after inactivity can take 30-60 seconds while the server wakes up. This is normal on the free plan. Upgrading to a paid plan removes this limitation.

**Neon free tier** allows one project with 0.5 GB storage and automatic scaling to zero when inactive. This is sufficient for development and small production workloads.

**Vercel free tier** has no such cold start issue — the frontend is served as static files from a CDN and is always fast.

---

## Environment variables reference

### Backend (.env for local, Render for production)

| Variable | Description | Example |
|---|---|---|
| DATABASE_URL | PostgreSQL connection string | postgresql://user:pass@host/db?sslmode=require |
| JWT_SECRET | Secret for signing access tokens | any-long-random-string |
| JWT_REFRESH_SECRET | Secret for signing refresh tokens | another-long-random-string |
| PORT | Port the server listens on | 3001 |
| NODE_ENV | Environment name | production |
| FRONTEND_URL | Allowed CORS origin | https://your-app.vercel.app |

---

## Redeploying after code changes

Render and Vercel both automatically redeploy when you push to the main branch on GitHub.

```bash
git add .
git commit -m "your change description"
git push
```

Render will run the build command again and restart the server. Vercel will rebuild the frontend and update the CDN. Both usually complete within 2-3 minutes.

To trigger a manual redeploy without a code change, go to the Render or Vercel dashboard and click "Manual Deploy" or "Redeploy".
