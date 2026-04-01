// Shared app.js - Premium SaaS Dashboard + Upload/Notes
// Backend /notes integration + IndexedDB sync + charts

// Utils (toast, loading)
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function showLoading(show = true) {
    let loader = document.getElementById('globalLoader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'globalLoader';
        loader.className = 'loading-overlay';
        loader.innerHTML = '<div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>';
        document.body.appendChild(loader);
    }
    loader.style.display = show ? 'flex' : 'none';
}

// Upload (exact snippet)
async function uploadNote(title, subject, file) {
    if (!file || !title || !subject) {
        showToast('Complete all fields', 'error');
        return false;
    }
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("subject", subject);

    showLoading(true);
    try {
        const response = await fetch("http://127.0.0.1:5000/upload", {
            method: "POST",
            body: formData
        });
        const data = await response.json();
        if (response.ok) {
            showToast(data.message || 'Upload successful!');
            addNoteToDB({ id: (data.id || Date.now()), title, subject, filename: data.filename });
            return true;
        } else {
            showToast('Upload failed: ' + (data.error || 'Try again'), 'error');
        }
    } catch (err) {
        showToast('Server offline: ' + err.message, 'error');
    } finally {
        showLoading(false);
    }
    return false;
}

// Load notes for any grid
async function loadNotes(gridId = 'notesGrid') {
    try {
        const response = await fetch('http://127.0.0.1:5000/notes');
        const notes = await response.json();
        displayNotes(notes, gridId);
        notes.forEach(addNoteToDB);
    } catch {
        getAllNotes(notes => displayNotes(notes, gridId));
    }
}

function displayNotes(notes, gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = notes.map(note => `
        <div class="note-card">
            <div class="note-preview"></div>
            <div class="note-content">
                <h6 class="note-title">${note.title}</h6>
                <div class="note-meta">
                    <span>${note.subject}</span>
                </div>
                <div class="note-actions">
                    <a href="http://127.0.0.1:5000/project/uploads/${note.filename}" class="btn btn-sm btn-primary" target="_blank">
                        <i class="fas fa-download"></i> PDF
                    </a>
                </div>
            </div>
        </div>
    `).join('') || '<div class="empty-state"><i class="fas fa-inbox"></i><p>Empty. Upload first note.</p></div>';
}

// Dashboard-specific functions
async function loadDashboardData() {
    try {
        const response = await fetch('http://127.0.0.1:5000/notes');
        const notes = await response.json();
        renderDashboardStats(notes);
        renderRecentNotes(notes.slice(-4));
        renderTopNotes(notes.slice(0,3));
        renderSubjectsChart(notes);
        renderActivityChart(notes);
    } catch {
        getAllNotes(notes => {
            renderDashboardStats(notes);
            renderRecentNotes(notes.slice(-4));
            renderTopNotes(notes.slice(0,3));
            renderSubjectsChart(notes);
            renderActivityChart(notes);
        });
    }
}

function renderDashboardStats(notes) {
    document.getElementById('totalNotes').textContent = notes.length;
    document.getElementById('subjectsCount').textContent = [...new Set(notes.map(n => n.subject))].length;
    document.getElementById('storageUsed').textContent = notes.reduce((sum, n) => sum + 1, 0) + ' files';
}

function renderRecentNotes(notes) {
    document.getElementById('recentNotesGrid').innerHTML = notes.map(n => {
        return `<div class="note-card"><div class="note-preview" style="background:linear-gradient(135deg,${['#3b82f6','#8b5cf6','#10b981','#f59e0b'][Math.floor(Math.random()*4)]})"></div><div class="note-content"><h6>${n.title}</h6><div class="note-meta"><span>${n.subject}</span></div><div class="note-actions"><a href="http://127.0.0.1:5000/project/uploads/${n.filename}" class="btn btn-sm btn-primary" target="_blank"><i class="fas fa-download"></i></a></div></div></div>`;
    }).join('') || '<div class="empty-state text-center py-8"><i class="fas fa-clock-rotate-left fa-2x mb-3 opacity-50"></i><p>No recent notes</p></div>';
}

function renderTopNotes(notes) {
    const list = document.getElementById('topNotesList');
    list.innerHTML = notes.map((n, i) => {
        return `<div class="d-flex align-items-center p-3 border-bottom"><div class="rank-badge fs-6 fw-bold text-primary me-3">${i+1}</div><div class="flex-grow-1"><h6 class="mb-1">${n.title}</h6><small class="text-muted">${n.subject}</small></div><a href="http://127.0.0.1:5000/project/uploads/${n.filename}" class="btn btn-sm btn-primary ms-auto" target="_blank"><i class="fas fa-download"></i></a></div>`;
    }).join('') || '<div class="text-center py-4 text-muted">No top notes</div>';
}

function renderSubjectsChart(notes) {
    const ctx = document.getElementById('subjectsChart')?.getContext('2d');
    if (!ctx) return;
    const subjects = notes.reduce((acc, n) => { acc[n.subject || 'Other'] = (acc[n.subject || 'Other'] || 0) + 1; return acc; }, {});
    if (window.subjectsChart) window.subjectsChart.destroy();
    window.subjectsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(subjects),
            datasets: [{ data: Object.values(subjects), backgroundColor: ['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b'], borderWidth: 0 }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
}

function renderActivityChart(notes) {
    const ctx = document.getElementById('activityChart')?.getContext('2d');
    if (!ctx) return;
    const months = ['Jan','Feb','Mar','Apr','May','Jun'];
    const data = months.map(() => Math.floor(Math.random()*15));
    if (window.activityChart) window.activityChart.destroy();
    window.activityChart = new Chart(ctx, {
        type: 'line',
        data: { labels: months, datasets: [{ label: 'Activity', data, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', tension: 0.4 }] },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
}

// Search
function searchNotes(query, gridId = 'notesGrid') {
    loadNotes(gridId).then(() => {
        // Client-side filter if needed
    });
}

// Quick upload modal/placeholder
function quickUpload() {
    showToast('Opening upload...', 'info');
    setTimeout(() => location.href = 'Notes.html#uploadForm', 300);
}

// Export
function exportAll() {
    getAllNotes(notes => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notes, null, 2));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", "college-notes.json");
        dlAnchorElem.click();
        showToast('Notes exported!');
    });
}


// Basic UI helpers (used across pages)
function toggleSidebar() {
    document.getElementById('sidebar')?.classList.toggle('collapsed');
}

function toggleNotifications() {
    document.querySelector('.notif-list')?.classList.toggle('show');
}

function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const icon = document.getElementById('themeIcon');
    if (icon) icon.className = document.body.classList.contains('light-theme') ? 'fas fa-sun' : 'fas fa-moon';
}

// Globals
window.uploadNote = uploadNote;
window.loadNotes = loadNotes;
window.loadDashboardData = loadDashboardData;
window.showToast = showToast;
window.quickUpload = quickUpload;
window.exportAll = exportAll;
window.searchNotes = searchNotes;
if (typeof window.toggleSidebar !== 'function') window.toggleSidebar = toggleSidebar;
if (typeof window.toggleNotifications !== 'function') window.toggleNotifications = toggleNotifications;
if (typeof window.toggleTheme !== 'function') window.toggleTheme = toggleTheme;
