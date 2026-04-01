/**
 * College Notes Hub - Frontend Integration Logic (Node + MongoDB)
 */

const API_URL = 'http://127.0.0.1:5001/api/notes';
const FILE_URL = (filename) => `http://127.0.0.1:5001/uploads/${encodeURIComponent(filename)}`;

let allNotes = [];
let searchTimeout;

document.addEventListener('DOMContentLoaded', () => {
    fetchNotes();
    
    const searchInput = document.querySelector('.search-global');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => handleSearch(e.target.value), 300);
        });
    }

    // Handle New Note Submission
    const noteForm = document.querySelector('#noteForm');
    if (noteForm) {
        noteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                title: document.querySelector('#noteTitle').value,
                subject: document.querySelector('#noteSubject').value,
                content: "" // Placeholder for content
            };

            try {
                const res = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                if (res.status === 503) {
                    showToast('MongoDB is not running (start MongoDB at 127.0.0.1:27017) and try again.', 'error');
                    return;
                }
                if (res.ok) {
                    showToast('Note saved successfully!', 'success');
                    noteForm.reset();
                    fetchNotes();
                }
            } catch (err) {
                showToast('Error saving note', 'error');
            });
    });

async function fetchNotes() {
    const notesGrid = document.querySelector('.notes-grid');
    if (!notesGrid) return;

    try {
        notesGrid.innerHTML = '<div class="spinner-border text-primary" role="status"></div>';
        const response = await fetch(API_URL);
        if (response.status === 503) {
            showToast('MongoDB is not running (start MongoDB at 127.0.0.1:27017) and refresh.', 'error');
            notesGrid.innerHTML = '';
            return;
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const notes = await response.json();
        allNotes = notes;

        renderNotes(allNotes, notesGrid);
        updateStats(allNotes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        showToast('Could not connect to Node server on Port 5001', 'error');
    }
}

function updateStats(notes) {
    const totalNotesEl = document.querySelector('#totalNotesCount');
    if (totalNotesEl) {
        totalNotesEl.innerText = notes.length;
    }
}

function handleSearch(query) {
    const searchTerm = query.toLowerCase().trim();
    const filtered = searchTerm === "" 
        ? allNotes 
        : allNotes.filter(n => 
            (n.title || '').toLowerCase().includes(searchTerm) || 
            (n.subject || '').toLowerCase().includes(searchTerm)
        );
    renderNotes(filtered, document.querySelector('.notes-grid'));
}

async function deleteNote(id) {
    if (!confirm('Are you sure?')) return;
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (res.ok) {
        showToast('Note deleted', 'success');
        fetchNotes();
    }
}

function renderNotes(notes, container) {
    container.innerHTML = notes.map(note => `
        <div class="note-card fade-in-up">
            <div class="note-preview"></div>
            <div class="note-content">
                <h3 class="note-title">${escapeHtml(note.title || '')}</h3>
                <div class="note-meta">
                    <span><i class="fas fa-tag"></i> ${escapeHtml(note.subject || '')}</span>
                </div>
                <div class="note-actions mt-3">
                    ${note.filename ? `<a class="btn btn-sm btn-primary" target="_blank" href="${FILE_URL(note.filename)}"><i class="fas fa-file-pdf"></i> PDF</a>` : ''}
                    <button class="btn btn-sm btn-danger" onclick="deleteNote('${note._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    if (notes.length === 0) {
        container.innerHTML = `<div class="glass-card" style="padding: 2rem; text-align: center; grid-column: 1/-1;">
            <p class="text-secondary">No matching notes found.</p>
        </div>`;
    }
}

function escapeHtml(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}




