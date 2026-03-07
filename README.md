# AI-Based Interview Preparation Platform

Full-stack practice suite with coding challenges, AI helpers, dashboards, and OAuth login. Frontend is React (Vite), backend is Express/Mongo, deployed on Vercel + Render.

## Tech Stack
- Frontend: React 19, Vite, React Router, Axios
- Backend: Node.js/Express, Mongoose
- Auth: JWT + Google OAuth + GitHub OAuth
- Realtime: Socket.io (peer practice)
- Styling: CSS (custom), Lucide icons
- DB: MongoDB Atlas (or local Mongo for dev)

## Features (high level)
- Email/password auth, Google, GitHub
- Coding challenges with test runner
- Interview dashboards, notes, reports, progress export
- Peer practice & matchmaking (Socket.io)
- AI helpers (chat, critiques, insights) via OpenAI API keys

## Quick Start (Local)
```bash
# 1) Frontend
cd vite-project
cp .env.local .env.local.example  # if you want a template
# set VITE_API_URL=http://localhost:5000
npm install

# 2) Backend
cd server
cp .env .env.example  # optional template
# set MONGODB_URI (local or Atlas), JWT_SECRET, GOOGLE_/GITHUB_ creds
npm install

# 3) Run
cd server && npm run dev   # starts API on :5000
cd ../ && npm run dev      # starts Vite on :5173
```

Minimum backend `.env` keys:
```
MONGODB_URI=...            # local mongodb://127.0.0.1:27017/interview-platform or Atlas SRV
JWT_SECRET=interview-prep-jwt-secret-2024-production-key-change-this
JWT_EXPIRE=30d
PORT=5000
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
```

Frontend `.env.local` keys:
```
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=...
VITE_OPENAI_API_KEY=...    # optional for AI helpers
```

## Production Deploy (Render + Vercel)
- Backend (Render):
  - Environment variables: same as above, but `FRONTEND_URL` points to Vercel domain and callback URLs point to Render domain.
  - `MONGODB_URI` should use Atlas SRV.
- Frontend (Vercel):
  - `VITE_API_URL=https://<your-render-backend>`
  - `VITE_GOOGLE_CLIENT_ID=<same as backend>`
  - Redeploy after changing env vars.

## OAuth URLs (production)
- Google/GitHub callback: `https://<render-backend>/api/auth/google/callback` and `/github/callback`
- Homepage/origin: `https://<vercel-frontend>`

## Scripts
Frontend (vite-project):
```
npm run dev        # Vite dev server
npm run build      # Production build
npm run preview    # Preview build
```
Backend (server):
```
npm run dev        # Nodemon dev server
npm start          # Production start
```

## Local Mongo vs Atlas
- Local dev: `mongodb://127.0.0.1:27017/interview-platform` (ensure mongod is running or `docker run -p 27017:27017 mongo`).
- Cloud: Atlas SRV string with database name, IP whitelisted.

## Notes
- If using Java/C++ runners, ensure the execution environment has required toolchains (Render native node cannot apt-get; use a Docker service if you need JDK).
- Clear `localStorage` when switching environments to avoid stale tokens.

## License
Proprietary / Internal use.
