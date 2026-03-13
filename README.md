# 📡 SimpleChat

SimpleChat is a secure, private, one-on-one chat application built with **True End-to-End Encryption (E2EE)** and a unique **Mystic Radio** numeric encoding feature. It is designed for maximum privacy, where even the server operator cannot read your messages.

## 🚀 Key Features

- **True E2EE**: Encryption keys are generated and stored exclusively in your browser's local storage. They are never sent to the server.
- **Mystic Radio Mode**: Messages are encoded into numeric sequences before encryption, providing a vintage "number station" vibe.
- **Ephemeral Reveals**: Messages are decrypted only when clicked and automatically revert to numeric sequences after 30 seconds.
- **Zero-Storage Promise**: The server only handles encrypted blobs. Without your local browser key, the messages are mathematically impossible to decipher.
- **Glassmorphic UI**: A modern, sleek dark-mode interface optimized for both desktop and mobile.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, CSS3 (Glassmorphism), Crypto-JS.
- **Backend**: FastAPI (Python), SQLAlchemy, SQLite.
- **Security**: AES-256-CBC encryption via Crypto-JS for non-secure context compatibility.

---

## 💻 Local Setup

### 1. Prerequisite
- Python 3.10+
- Node.js 18+

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and set your ADMIN_USERNAME, ADMIN_PASSWORD, and SECRET_KEY
uvicorn main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The app will be available at `http://localhost:5173`.

---

## 🔒 Security Note
This application uses **True E2EE**. 
- **Warning**: If you clear your browser's `LocalStorage` or "Site Data," you will lose the encryption keys for your chats. 
- **Recommendation**: Save the invite links (which contain the keys in the URL hash) if you need to access chats from different devices or after clearing browser data.

## 📄 License
MIT License. Feel free to use and modify for personal or educational purposes.
