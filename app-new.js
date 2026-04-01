// Legacy/shared helpers for pages that reference `app-new.js`.
// Keeps Share/Settings/Index from breaking even when `app.js` isn't loaded.

(function () {
    function fallbackToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    function showToast(message, type = 'info') {
        if (typeof window.showToast === 'function') return window.showToast(message, type);
        return fallbackToast(message, type);
    }

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

    function setActiveNav(el) {
        try {
            document.querySelectorAll('.nav-item.active').forEach(n => n.classList.remove('active'));
            el?.classList?.add('active');
        } catch {
            // no-op
        }
    }

    function globalSearch() {
        const q = (document.getElementById('globalSearch')?.value || '').trim();
        if (typeof window.searchNotes === 'function') {
            window.searchNotes(q);
        }
    }

    function closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = 'none';
    }

    function openModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = 'block';
    }

    function switchModal(fromId, toId) {
        closeModal(fromId);
        openModal(toId);
    }

    function login(e) {
        e?.preventDefault?.();
        const email = document.getElementById('loginEmail')?.value?.trim();
        if (email) localStorage.setItem('userEmail', email);
        closeModal('loginModal');
        showToast('Logged in');
        return false;
    }

    function signup(e) {
        e?.preventDefault?.();
        const name = document.getElementById('signupName')?.value?.trim();
        const email = document.getElementById('signupEmail')?.value?.trim();
        if (name) localStorage.setItem('userName', name);
        if (email) localStorage.setItem('userEmail', email);
        closeModal('signupModal');
        showToast('Account created');
        return false;
    }

    async function addNote() {
        const title = document.getElementById('title')?.value?.trim();
        const subject = document.getElementById('subject')?.value?.trim();
        const file = document.getElementById('fileInput')?.files?.[0];
        if (!title || !subject || !file) {
            showToast('Complete all fields', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('subject', subject);

        try {
            const res = await fetch('http://127.0.0.1:5000/upload', { method: 'POST', body: formData });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Upload failed');
            if (typeof window.addNoteToDB === 'function') {
                window.addNoteToDB({ id: data.id || Date.now(), title, subject, filename: data.filename });
            }
            showToast('Uploaded successfully');
        } catch (err) {
            showToast(err.message || 'Server offline', 'error');
        }
    }

    function exportNotes() {
        if (typeof window.exportAll === 'function') return window.exportAll();
        if (typeof window.getAllNotes === 'function') {
            window.getAllNotes(notes => {
                const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(notes || [], null, 2));
                const a = document.createElement('a');
                a.href = dataStr;
                a.download = 'college-notes.json';
                a.click();
            });
            return;
        }
        showToast('No local notes to export', 'error');
    }

    function clearLocalData() {
        try {
            indexedDB.deleteDatabase('NotesDB');
        } catch {
            // ignore
        }
        showToast('Local data cleared');
        setTimeout(() => location.reload(), 300);
    }

    function showDashboard() { location.href = 'dashboard.html'; }
    function showNotes() { location.href = 'Notes.html'; }
    function shareNotes() { location.href = 'Share.html'; }
    function showProfile() { location.href = 'Profile.html'; }

    window.toggleSidebar = window.toggleSidebar || toggleSidebar;
    window.toggleNotifications = window.toggleNotifications || toggleNotifications;
    window.toggleTheme = window.toggleTheme || toggleTheme;
    window.setActiveNav = window.setActiveNav || setActiveNav;
    window.globalSearch = window.globalSearch || globalSearch;
    window.closeModal = window.closeModal || closeModal;
    window.openModal = window.openModal || openModal;
    window.switchModal = window.switchModal || switchModal;
    window.login = window.login || login;
    window.signup = window.signup || signup;
    window.addNote = window.addNote || addNote;
    window.exportNotes = window.exportNotes || exportNotes;
    window.clearLocalData = window.clearLocalData || clearLocalData;
    window.showDashboard = window.showDashboard || showDashboard;
    window.showNotes = window.showNotes || showNotes;
    window.shareNotes = window.shareNotes || shareNotes;
    window.showProfile = window.showProfile || showProfile;
})();

