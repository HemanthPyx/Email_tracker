# 📬 MailTracker — Email Registration Tracker

Never forget which email you used to sign up for a website. MailTracker scans your Gmail accounts, detects registration/welcome emails, and builds a searchable database of all your site registrations.

## Features

- 🔍 **Instant Search** — Find which email you used for any site
- 🤖 **Fully Automated** — Scans Gmail for registration emails automatically
- 📊 **Dashboard** — Overview of all accounts with stats and charts
- 🏷️ **Categories** — Organize emails by purpose (personal, work, gaming, etc.)
- 🔐 **Secure** — OAuth2 authentication, read-only Gmail access, JWT tokens
- 📱 **Responsive** — Works on desktop and mobile

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS v3 |
| Backend | Django + Django REST Framework |
| Database | PostgreSQL (Neon) / SQLite (local) |
| Auth | Google OAuth2 + JWT |
| Email API | Gmail API (read-only) |

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Google Cloud Console project with Gmail API enabled

### 1. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the **Gmail API** and **Google OAuth2 API**
4. Create OAuth2 credentials (Web application)
5. Add `http://localhost:5173/auth/callback` as an authorized redirect URI
6. Copy Client ID and Client Secret

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your Google OAuth credentials

python manage.py migrate
python manage.py runserver 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the App

Visit `http://localhost:5173` and sign in with Google!

## Deployment

- **Frontend** → Vercel (connect repo, set root to `frontend/`)
- **Backend** → Render (web service with `gunicorn config.wsgi`)
- **Database** → Neon PostgreSQL

## Environment Variables

### Backend (.env)
| Variable | Description |
|---|---|
| `SECRET_KEY` | Django secret key |
| `DATABASE_URL` | PostgreSQL connection string |
| `GOOGLE_CLIENT_ID` | Google OAuth2 client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth2 client secret |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL |
| `CORS_ALLOWED_ORIGINS` | Allowed frontend origins |

### Frontend (.env)
| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API URL |

## License

MIT
