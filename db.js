let db;

let request = indexedDB.open("NotesDB", 2);

request.onerror = function(e) {
    console.error('Database error:', e.target.errorCode);
};

request.onupgradeneeded = function (e) {
    db = e.target.result;
    if (!db.objectStoreNames.contains('notes')) {
        let store = db.createObjectStore("notes", { 
            keyPath: "id", 
            autoIncrement: false 
        });
    }
};

request.onsuccess = function (e) {
    db = e.target.result;
    console.log('Database opened successfully');
};

request.onblocked = function() {
    console.warn('Database upgrade blocked');
};

function addNoteToDB(note) {
    if (!db) {
        console.error('Database not ready');
        return;
    }
    let tx = db.transaction("notes", "readwrite");
    let store = tx.objectStore("notes");
    let req = store.put(note);
    req.onsuccess = () => console.log('Note added');
    req.onerror = () => console.error('Add note failed');
}

function getAllNotes(callback) {
    if (!db) {
        console.error('Database not ready');
        callback([]);
        return;
    }
    let tx = db.transaction("notes", "readonly");
    let store = tx.objectStore("notes");
    let request = store.getAll();
    request.onsuccess = function () {
        callback(request.result || []);
    };
    request.onerror = () => callback([]);
}
