const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── In-memory stores ──────────────────────────────────────────────────────────
let tracks = [];
let conversions = [];

// ── Seed data (populated on startup) ─────────────────────────────────────────
function seedData() {
  const now = Date.now();

  tracks = [
    { src: '/blog/how-we-hit-10k-mrr', medium: 'organic', campaign: '', content: '', landing: '/blog/how-we-hit-10k-mrr', ts: now - 900000 },
    { src: 'hn.algolia.com', medium: 'referral', campaign: '', content: '', landing: '/', ts: now - 600000 },
    { src: '/blog/stripe-webhooks-guide', medium: 'organic', campaign: '', content: '', landing: '/blog/stripe-webhooks-guide', ts: now - 300000 },
  ];

  conversions = [
    { email: 'a***@gmail.com', amount_cents: 4900, plan: 'Starter', source: '/blog/how-we-hit-10k-mrr', landing: '/blog/how-we-hit-10k-mrr', ts: now - 880000 },
    { email: 'b***@hey.com', amount_cents: 9900, plan: 'Growth', source: 'hn.algolia.com', landing: '/', ts: now - 580000 },
    { email: 'c***@outlook.com', amount_cents: 4900, plan: 'Starter', source: '/blog/stripe-webhooks-guide', landing: '/blog/stripe-webhooks-guide', ts: now - 120000 },
    { email: 'd***@proton.me', amount_cents: 9900, plan: 'Growth', source: '/blog/how-we-hit-10k-mrr', landing: '/blog/how-we-hit-10k-mrr', ts: now - 60000 },
    { email: 'e***@fastmail.com', amount_cents: 19900, plan: 'Pro', source: 'twitter.com', landing: '/', ts: now - 30000 },
  ];
}

seedData();

// ── CORS middleware ───────────────────────────────────────────────────────────
app.use('/api', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── POST /api/track ───────────────────────────────────────────────────────────
app.post('/api/track', (req, res) => {
  const { src, medium, campaign, content, landing, ts } = req.body;
  tracks.push({ src: src || 'direct', medium: medium || '', campaign: campaign || '', content: content || '', landing: landing || '/', ts: ts || Date.now() });
  res.json({ ok: true });
});

// ── POST /api/webhook/stripe ──────────────────────────────────────────────────
app.post('/api/webhook/stripe', (req, res) => {
  const { email, amount_cents, plan, event_type } = req.body;
  const lastTrack = tracks.length > 0 ? tracks[tracks.length - 1] : { src: 'direct', landing: '/' };
  const conversion = {
    email: email || 'u***@unknown.com',
    amount_cents: amount_cents || 0,
    plan: plan || 'unknown',
    source: lastTrack.src,
    landing: lastTrack.landing,
    ts: Date.now(),
  };
  conversions.push(conversion);
  res.json({ ok: true, conversion_recorded: true });
});

// ── GET /api/dashboard-data ───────────────────────────────────────────────────
// Used by the dashboard page to fetch live data as JSON
app.get('/api/dashboard-data', (req, res) => {
  // Aggregate by source
  const sourceMap = {};

  // Count unique track visitors per source
  for (const t of tracks) {
    const key = t.src;
    if (!sourceMap[key]) sourceMap[key] = { source: key, visitors: 0, trials: 0, paid: 0, mrr: 0 };
    sourceMap[key].visitors += 1;
  }

  // Aggregate conversions
  for (const c of conversions) {
    const key = c.source;
    if (!sourceMap[key]) sourceMap[key] = { source: key, visitors: 0, trials: 0, paid: 0, mrr: 0 };
    sourceMap[key].trials += 1;
    if (c.amount_cents > 0) {
      sourceMap[key].paid += 1;
      sourceMap[key].mrr += c.amount_cents / 100;
    }
  }

  const rows = Object.values(sourceMap).sort((a, b) => b.mrr - a.mrr);

  // Last 10 conversions (most recent first), mask email
  const feed = [...conversions]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 10)
    .map(c => ({
      email: maskEmail(c.email),
      source: c.source,
      landing: c.landing,
      plan: c.plan,
      mrr: (c.amount_cents / 100).toFixed(2),
    }));

  res.json({ rows, feed });
});

function maskEmail(email) {
  if (!email) return 'u***@...';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const masked = local[0] + '***';
  const domainParts = domain.split('.');
  return `${masked}@${domainParts[domainParts.length - 2] || domain}.${domainParts[domainParts.length - 1] || ''}`;
}

// ── Serve HTML pages ──────────────────────────────────────────────────────────
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/snippet', (req, res) => res.sendFile(path.join(__dirname, 'public', 'snippet.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`ContentSignal running on http://0.0.0.0:${PORT}`);
});
