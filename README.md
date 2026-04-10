# TechPulse – Personalized AI News Narrator

> Your daily tech briefing, summarized by AI and narrated for a hands-free morning routine.

![TechPulse](https://img.shields.io/badge/TechPulse-AI%20News%20Narrator-6366f1?style=for-the-badge)

[![TechPulse Demo Video](https://img.youtube.com/vi/8LTd-p104Ec/maxresdefault.jpg)](https://www.youtube.com/watch?v=8LTd-p104Ec)  
**👉 [Click here to watch the full TechPulse Demo Video on YouTube](https://www.youtube.com/watch?v=8LTd-p104Ec)**

## ✨ Features

- **📡 Multi-Source Aggregation** — Pull news from RSS feeds (TechCrunch, The Verge, Ars Technica, etc.)
- **🤖 AI Summarization** — Each article condensed to < 200 words using Google Gemini (with extractive fallback)
- **🎧 Voice Narration** — Text-to-speech playback with a professional podcast-like player
- **⏭ Queue Controls** — Play All, Skip, Back, Pause/Resume, Stop
- **📊 Dashboard** — Glass-morphism dark theme with stats and article cards
- **⚙️ Settings** — Manage RSS sources and topic keywords
- **⏰ Daily Cron** — Automatic midnight fetch so articles are ready when you wake up

---

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- Gemini API Key ([get one here](https://aistudio.google.com/apikey))

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd techpulse

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment
```bash
# Copy the local env template
cp backend/.env.local backend/.env
```

Edit `backend/.env` and add your keys:
```env
GEMINI_API_KEY=your-gemini-api-key-here
```

### 3. Seed Demo Data
```bash
cd backend && npm run seed
```

### 4. Start Development Servers
```bash
# Terminal 1 — Backend
cd backend && npm run dev
# → http://localhost:3001

# Terminal 2 — Frontend
cd frontend && npm run dev
# → http://localhost:5173
```

---

## 🌐 Production Deployment (Vercel)

### Prerequisites
- [Vercel account](https://vercel.com)
- [Vercel CLI](https://vercel.com/cli) installed (`npm i -g vercel`)

### 1. Set Environment Variables

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables** and add:

| Variable         | Required | Description                                                |
| ---------------- | -------- | ---------------------------------------------------------- |
| `GEMINI_API_KEY` | ✅ Yes    | Google Gemini API key for AI summaries                     |
| `CRON_SECRET`    | ✅ Yes    | Secret to authenticate cron requests                       |
| `FRONTEND_URL`   | ✅ Yes    | Your production URL (e.g., `https://techpulse.vercel.app`) |
| `NODE_ENV`       | Optional | Set to `production`                                        |
| `NEWSAPI_KEY`    | Optional | NewsAPI key for additional sources                         |

> **Tip:** Generate a `CRON_SECRET` with: `openssl rand -hex 32`

### 2. Deploy

```bash
# From the project root
vercel

# For production deployment
vercel --prod
```

### 3. Verify Cron Job

After deployment, go to **Vercel Dashboard → Your Project → Settings → Cron Jobs** to verify the schedule is active.

The cron job is configured in [`vercel.json`](vercel.json):
```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 0 * * *"
    }
  ]
}
```

This triggers the [`api/cron.js`](api/cron.js) serverless function at **midnight UTC daily**, which:
1. Fetches articles from all active RSS sources
2. Deduplicates against existing articles
3. Summarizes new articles using Gemini
4. Stores them in the database

You can also manually trigger it:
```bash
curl -X GET https://your-app.vercel.app/api/cron \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Environment Files Reference

| File              | Purpose                         | Commit to Git?     |
| ----------------- | ------------------------------- | ------------------ |
| `.env.local`      | Local development defaults      | ❌ No               |
| `.env.production` | Production template / reference | ✅ Yes (no secrets) |
| `.env`            | Active local config (your keys) | ❌ No               |

---

## 📁 Project Structure

```
techpulse/
├── api/
│   └── cron.js                # Vercel Cron serverless function
├── backend/
│   ├── server.js              # Express server + in-process cron
│   ├── .env.local             # Local dev environment template
│   ├── .env.production        # Production environment template
│   ├── db/database.js         # SQLite connection
│   ├── routes/
│   │   ├── articles.js        # Article CRUD + filtering
│   │   ├── sources.js         # RSS source management
│   │   ├── topics.js          # Topic keyword management
│   │   └── fetch.js           # Manual fetch trigger
│   └── services/
│       ├── fetcher.js         # RSS feed parser
│       └── summarizer.js      # Gemini summarization
├── frontend/
│   └── src/
│       ├── App.jsx            # Main app + TTS engine
│       ├── index.css          # Glassmorphism dark theme
│       └── components/
│           ├── Dashboard.jsx  # Article feed + stats
│           ├── AudioPlayer.jsx# Persistent player bar
│           ├── Settings.jsx   # Source/topic management
│           └── Toast.jsx      # Notifications
├── database/
│   └── schema.sql             # SQLite schema + defaults
├── scripts/
│   ├── daily-fetch.js         # Standalone cron script
│   └── seed-demo.js           # Demo data seeder
├── vercel.json                # Vercel config + cron schedule
└── .gitignore
```

## 🎨 Design

- **Theme**: Dark glassmorphism with purple/indigo accent gradients
- **Typography**: Inter + JetBrains Mono
- **Animations**: Subtle glow effects, shimmer loading, slide transitions
- **Responsive**: Fully responsive down to mobile

## 🔧 API Endpoints

| Method | Endpoint                 | Description                                 |
| ------ | ------------------------ | ------------------------------------------- |
| GET    | `/api/articles`          | List articles (filter: date, topic, unread) |
| GET    | `/api/articles/today`    | Today's articles                            |
| GET    | `/api/articles/stats`    | Dashboard statistics                        |
| PATCH  | `/api/articles/:id/read` | Mark read/unread                            |
| GET    | `/api/sources`           | List RSS sources                            |
| POST   | `/api/sources`           | Add a source                                |
| DELETE | `/api/sources/:id`       | Remove a source                             |
| GET    | `/api/topics`            | List topics                                 |
| POST   | `/api/topics`            | Add a topic                                 |
| DELETE | `/api/topics/:id`        | Remove a topic                              |
| POST   | `/api/fetch`             | Trigger fetch + summarize                   |
| GET    | `/api/cron`              | Vercel cron endpoint (auth required)        |

## 📝 License
MIT
