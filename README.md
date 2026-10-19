# 📡 SimpleChat

**A private one-to-one chat where messages are encrypted in the browser with a passphrase you share in person, so the server only ever stores ciphertext.**

[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![SQLite](https://img.shields.io/badge/DB-SQLite-003B57?logo=sqlite)](https://www.sqlite.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## ✨ Features

- **Encrypted in the browser.** Each chat has a passphrase you agree on in person. The browser turns it into an AES-256 key and encrypts every message before sending. The server stores and relays only ciphertext.
- **One admin, many private chats.** The admin creates a chat per friend from a dashboard. Each friend opens their own chat and unlocks it with the passphrase.
- **Mystic Radio mode:** messages can be sent as numeric sequences ("number station" style). Click to reveal; they hide again after 30 seconds.
- **Unicode everywhere,** including Persian (Farsi) and other right-to-left text.
- Dark, glass-style interface that works on desktop and mobile.

## 🧠 How it works

```
 Friend's browser                       Server (FastAPI + SQLite)              Admin's browser
 passphrase ─► PBKDF2 ─► AES key        stores: chat id, sender, time,         passphrase ─► same AES key
 message ─► AES-256-CBC ─► ciphertext ─► ciphertext + IV  ─────────────────────► decrypt locally
```

- The derived key is kept in the browser's local storage and is never sent to the server.
- The server knows who is chatting and when, but not what is said.

## 💻 Run it locally

**Requirements:** Python 3.10+, Node.js 18+

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env    # set ADMIN_PASSWORD and SECRET_KEY (the server won't start without them)
uvicorn main:app --reload

# Frontend (second terminal)
cd frontend
npm install
npm run dev             # http://localhost:5173
```

Generate a secret key with `python -c "import secrets; print(secrets.token_urlsafe(48))"`.

**In production:**
- Serve over **HTTPS**.
- Set `CORS_ORIGINS` only if the frontend is on a different domain from the API.

## 🔒 Security model: what is and isn't protected

Being clear about limits matters more than big promises, so here they are.

**Protected**
- Message content, against the server operator and anyone with database access, as long as the passphrase is strong and shared out of band.
- Admin access: required secrets (the server refuses to start with default ones), constant-time password checks, and a lockout after 5 failed logins.
- Message and name size limits, so the API can't be flooded with huge payloads.

**Not protected (known limitations)**
- **Finding a chat by name.** Anyone who knows or guesses a friend's name can open that chat's encrypted history and post into it. They still can't read anything without the passphrase, but they can try to guess it offline.
- **Weak key derivation.** PBKDF2 uses 1,000 iterations and a fixed salt, which makes offline passphrase guessing cheaper than it should be. Use a long passphrase.
- **No tamper detection.** AES-CBC without authentication means a malicious server could alter ciphertext without being detected.
- **Metadata.** The server sees who talks to whom, when and how often.
- **Lost keys.** Clearing browser data deletes the stored key. Re-enter the passphrase to unlock the chat again.

## 🗺️ Roadmap

- Replace name lookup with invite link plus PIN
- Random per-chat salt and ~600,000 PBKDF2 iterations (with a migration for existing chats)
- Authenticated encryption (AES-GCM via the browser's Web Crypto API, which needs HTTPS)
- Automated tests for the API

## 📄 License

MIT, see [LICENSE](LICENSE).
