# College Notes Hub

Premium SaaS-style dashboard for college students to upload, organize, and share PDF notes.

## Features
- Premium Dashboard with stats and charts
- Secure PDF upload (10MB limit)
- Notes organization by title/subject
- MongoDB backend for persistence
- Responsive glassmorphism UI
- Offline support (IndexedDB fallback)
- Share via link (deployed version)

## Tech Stack
- Backend: Node.js (Express), MongoDB
- Frontend: HTML5, CSS3 (Glassmorphism), Vanilla JS
- File handling: Multer
- Charts: Chart.js

## Local Setup
1. `npm install`
2. Start MongoDB locally (or skip for static testing)
3. `npm start`
4. Open http://localhost:5001

**Note:** Without MongoDB, uploads/API will show 'MongoDB not connected' but static pages work.

## Production Deployment (Render.com - Free)
1. Push to GitHub: `git add . && git commit -m "Deploy-ready" && git push`
2. Go to https://render.com, connect GitHub repo.
3. New > Web Service
   - Runtime: Node
   - Build: `npm install`
   - Start: `npm start`
   - Env vars: `MONGODB_URI` = MongoDB Atlas free cluster URI
4. Deploy → Get https://your-app.onrender.com (free tier sleeps after inactivity).

## MongoDB Atlas (Free)
1. https://cloud.mongodb.com → New Cluster (free M0)
2. Create user, get connection string
3. Whitelist 0.0.0.0/0 (all IPs)
4. Set `MONGODB_URI` in Render dashboard.

**Live demo:** [Insert Render URL here after deploy]

© 2024 College Notes Hub
