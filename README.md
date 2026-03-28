# ContentSignal

Blog-to-revenue attribution for indie SaaS founders.

Know which blog post is paying your rent.

## What it does

ContentSignal joins your blog traffic to Stripe revenue so you can see exactly which posts drive trials and paid subscriptions. No data warehouse. No sales call. $0 to start.

## Stack

- Node.js + Express
- Plain HTML/CSS/JS (no build step)
- In-memory storage (mockup)

## Run locally

```bash
npm install
npm start
# Open http://localhost:3000
```

## Deploy on Replit

1. Import this repo at [replit.com/new](https://replit.com/new)
2. Click **Run** — no config needed
3. App listens on `process.env.PORT` automatically

## Routes

| Route | Description |
|---|---|
| `GET /` | Landing page |
| `GET /snippet` | Snippet generator |
| `GET /dashboard` | Attribution dashboard |
| `POST /api/track` | Ingest attribution event |
| `POST /api/webhook/stripe` | Simulated Stripe webhook |
| `GET /api/dashboard-data` | Dashboard JSON data |
