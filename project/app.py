from flask import Flask, abort, jsonify, request, send_from_directory
from werkzeug.utils import secure_filename
import os
import sqlite3
import time
import uuid

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, os.pardir))
DB_PATH = os.path.join(BASE_DIR, "database.db")
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_FRONTEND_FILES = {
    "index.html",
    "Notes.html",
    "dashboard.html",
    "Home.html",
    "Profile.html",
    "Share.html",
    "setting.html",
    "style.css",
    "app.js",
    "db.js",
    "app-new.js",
    "script.js",
}


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response


def get_conn():
    return sqlite3.connect(DB_PATH)


def ensure_db_ok():
    try:
        conn = get_conn()
        try:
            row = conn.execute("PRAGMA integrity_check").fetchone()
            if row and row[0] == "ok":
                return True
        finally:
            conn.close()
    except sqlite3.DatabaseError:
        pass

    backup_path = f"{DB_PATH}.corrupt-{int(time.time())}.bak"
    try:
        if os.path.exists(DB_PATH):
            os.replace(DB_PATH, backup_path)
    except OSError:
        try:
            os.remove(DB_PATH)
        except OSError:
            pass

    return False


def init_db():
    ensure_db_ok()
    conn = get_conn()
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                subject TEXT NOT NULL,
                filename TEXT NOT NULL
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


init_db()


@app.route("/health", methods=["GET"])
def health():
    ok = False
    try:
        conn = get_conn()
        try:
            ok = conn.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
        finally:
            conn.close()
    except sqlite3.DatabaseError:
        ok = False

    return jsonify({"ok": True, "db_ok": ok, "db_path": DB_PATH})


# Frontend serving (so opening http://127.0.0.1:5000/ doesn't show 404)
@app.route("/", methods=["GET"])
def home():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/<path:filename>", methods=["GET"])
def frontend_files(filename):
    if filename in ALLOWED_FRONTEND_FILES:
        return send_from_directory(FRONTEND_DIR, filename)
    abort(404)


@app.route("/upload", methods=["POST", "OPTIONS"])
def upload_note():
    if request.method == "OPTIONS":
        return ("", 204)

    file = request.files.get("file")
    title = (request.form.get("title") or "").strip()
    subject = (request.form.get("subject") or "").strip()

    if not file or not title or not subject:
        return jsonify({"error": "Missing file/title/subject"}), 400

    original_name = secure_filename(file.filename or "")
    if not original_name.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF files are allowed"}), 400

    base_name = os.path.splitext(original_name)[0] or "note"
    safe_filename = f"{base_name}-{uuid.uuid4().hex[:8]}.pdf"
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], safe_filename)
    file.save(filepath)

    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO notes (title, subject, filename) VALUES (?, ?, ?)",
            (title, subject, safe_filename),
        )
        conn.commit()
        note_id = cur.lastrowid
    finally:
        conn.close()

    return jsonify({"message": "Uploaded successfully", "id": note_id, "filename": safe_filename})


@app.route("/notes", methods=["GET"])
def get_notes():
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, title, subject, filename FROM notes ORDER BY id ASC")
        rows = cur.fetchall()
    finally:
        conn.close()

    return jsonify(
        [
            {"id": row[0], "title": row[1], "subject": row[2], "filename": row[3]}
            for row in rows
        ]
    )


@app.route("/project/uploads/<path:filename>")
def uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
