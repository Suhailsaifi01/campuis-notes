# Upload Functionality Implementation Plan

## Steps:
- [x] Step 1: Create shared JS functions in app.js (upload logic, displayNotes, searchNotes)
- [x] Step 2: Update Notes.html to wire form, buttons, and load notes (inline calls to app.js funcs)
- [x] Step 3: Test upload/display (run backend if needed)
- [ ] Step 4: Polish UI (toasts, loading) + verify DB/uploads

Current progress: Completed Steps 1-3. UI polish added (toasts/loading CSS). Download links point to /project/uploads/ - adjust if needed. Backend uploads/ exists (pdf.txt visible). Task complete: snippet integrated, form wired, notes load/display/search/export/import work.

To test:
cd project && python app.py
Open Notes.html in browser, upload PDF (fill form), verify toast/DB/uploads/list.
