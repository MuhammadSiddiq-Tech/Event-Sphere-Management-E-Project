# Local Development Setup

## Prerequisites

- **Node.js** 20 LTS — [download](https://nodejs.org)
- **Docker Desktop** — [download](https://www.docker.com/products/docker-desktop)
- **Git**

---

## 1. Clone and Install

```bash
git clone <repo-url>
cd "Event Sphere Management E-Project"
npm install
```

## 2. Copy Environment Files

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Edit `server/.env` and set real values for:

- `JWT_ACCESS_SECRET` — at least 32 random characters
- `JWT_REFRESH_SECRET` — at least 32 random characters (different from access secret)
- `MONGO_URI` — leave as default for local Docker (`mongodb://localhost:27017/eventsphere?replicaSet=rs0`)

## 3. Start Docker Services

```bash
docker-compose up -d
```

This starts:

- **MongoDB 7** on port `27017` with replica set `rs0` enabled
- **MailHog** on port `1025` (SMTP) and `8025` (web UI)

## 4. Verify MongoDB Replica Set

```bash
docker-compose exec mongo mongosh --eval "rs.status()"
```

You should see `"set" : "rs0"` and `"health" : 1` for the member.

Alternatively, connect directly:

```bash
mongosh "mongodb://localhost:27017/eventsphere?replicaSet=rs0" --eval "rs.status().ok"
```

Expected output: `1`

## 5. Verify MailHog

Open `http://localhost:8025` in a browser. You should see the MailHog inbox UI.

The SMTP settings for `server/.env`:

```
SMTP_HOST=localhost
SMTP_PORT=1025
```

## 6. Start Development Servers

```bash
npm run dev
```

This starts both:

- API server: `http://localhost:5000`
- Vite dev server: `http://localhost:5173`

## 7. Access Points

| Service        | URL                            |
| -------------- | ------------------------------ |
| API health     | http://localhost:5000/health   |
| API root       | http://localhost:5000          |
| Client         | http://localhost:5173          |
| MailHog UI     | http://localhost:8025          |
| API docs (dev) | http://localhost:5000/api/docs |

## 8. Run Tests

```bash
npm test
```

Server unit tests run using Jest with ESM support (`--experimental-vm-modules`).

## 9. Stop Services

```bash
docker-compose down
```

To also remove the MongoDB data volume:

```bash
docker-compose down -v
```
