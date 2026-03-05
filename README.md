# URL Shortener

A distributed URL shortening service with real-time click analytics. Built with a microservices architecture using Node.js, Python, Redis, and PostgreSQL.

![Architecture](https://img.shields.io/badge/architecture-microservices-00e5ff?style=flat-square) ![Redis](https://img.shields.io/badge/cache-redis-red?style=flat-square) ![PostgreSQL](https://img.shields.io/badge/database-postgresql-336791?style=flat-square) ![Docker](https://img.shields.io/badge/deploy-docker-2496ed?style=flat-square)

---

## Architecture

```
Client / Frontend (React)
        │
        ├──▶ URL Service (Node.js :3000)
        │         │
        │         ├── PostgreSQL  (stores URLs)
        │         ├── Redis Cache (cache-aside pattern)
        │         └── Redis Pub/Sub ──▶ Analytics Service (Python :3001)
        │                                       │
        └──▶ Analytics Service                  └── PostgreSQL (stores clicks)
```

**URL Service** handles shortening and redirects. On every redirect it publishes a click event to a Redis channel.

**Analytics Service** subscribes to that channel, enriches each click with country (via IP geolocation) and device type (via user-agent parsing), then persists it to PostgreSQL.

**Redis** serves two roles — a cache layer for fast redirects and a pub/sub message bus between services.

---

## Features

- Shorten any URL to a 7-character code
- Redirect with Redis cache-aside (cache hit skips the database entirely)
- Async click tracking via Redis Pub/Sub — zero latency impact on redirects
- Per-URL analytics: total clicks, by country, by device, clicks over time
- React dashboard with live stats and copy-to-clipboard
- Fully containerized — one command to run everything

---

## Tech Stack

| Layer | Technology |
|---|---|
| URL Service | Node.js, Express |
| Analytics Service | Python, FastAPI |
| Cache + Messaging | Redis (cache-aside + Pub/Sub) |
| Database | PostgreSQL |
| Frontend | React, Vite |
| Infrastructure | Docker, Docker Compose |

---

## Getting Started

**Prerequisites:** Docker Desktop

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/url-shortener.git
cd url-shortener

# Start everything
docker compose up --build
```

That's it. All services start automatically.

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| URL Service | http://localhost:3000 |
| Analytics Service | http://localhost:3001 |

---

## API Reference

### Shorten a URL
```
POST /shorten
Content-Type: application/json

{ "url": "https://example.com" }
```
```json
{
  "short_url": "http://localhost:3000/aB3xK9p",
  "code": "aB3xK9p"
}
```

### Redirect
```
GET /:code
→ 302 redirect to original URL
```

### Get Analytics
```
GET http://localhost:3001/stats/:code
```
```json
{
  "code": "aB3xK9p",
  "total_clicks": 42,
  "by_country": [{ "country": "United States", "count": 38 }],
  "by_device": [{ "device": "Desktop", "count": 35 }],
  "timeline": [{ "day": "2026-03-05", "count": 42 }]
}
```

---

## Project Structure

```
url-shortener/
├── url-service/
│   ├── src/
│   │   ├── index.js       # Express app entry point
│   │   ├── routes.js      # API endpoints
│   │   ├── db.js          # PostgreSQL connection pool
│   │   └── redis.js       # Redis client
│   └── Dockerfile
├── analytics-service/
│   ├── main.py            # FastAPI app + /stats endpoint
│   ├── subscriber.py      # Redis Pub/Sub listener
│   ├── db.py              # PostgreSQL connection
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Main dashboard component
│   │   └── main.jsx
│   └── Dockerfile
├── db/
│   └── init.sql           # Database schema
└── docker-compose.yml
```

---

## How the Cache Works

On every redirect request:

1. Check Redis for `url:{code}`
2. **Cache hit** → redirect immediately (no DB query)
3. **Cache miss** → fetch from PostgreSQL, store in Redis (TTL: 24h), then redirect

This means repeated visits to the same short URL never touch the database.

---

## Stopping the Services

```bash
docker compose down        # stop containers
docker compose down -v     # stop containers + delete database
```
