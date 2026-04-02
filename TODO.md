# Deployment Plan Progress

## Approved Plan Steps:
1. [✅] Update package.json: Add multer dependency.
2. [✅] Edit server.js: 
   - Added multer upload /upload POST (saves PDFs to uploads/, saves note to Mongo).
   - Added /notes GET.
   - Serve /uploads static.
3. [✅] Fix frontend hardcoded URLs: Replaced 'http://127.0.0.1:5000' with relative '/upload', '/notes', '/uploads/' in app.js, app-new.js, dashboard.html.
4. [✅] Update README.md: Added Render deployment + Mongo Atlas instructions.
5. [ ] Test locally: `npm install && npm start`, verify upload/API on localhost:5001.
6. [ ] Commit/push to GitHub: `git add . && git commit -m "Deploy-ready fixes" && git push`.
7. [ ] Deploy to Render.com: Link GitHub repo, set env vars (free MongoDB Atlas), get shareable URL.

**Current status: Starting step 1**

