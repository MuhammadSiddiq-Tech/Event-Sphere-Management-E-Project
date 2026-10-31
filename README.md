# EventSphere Management

An expo and trade-show management web application built as an Aptech eProject.

## Prerequisites

- **Node.js** 20 LTS
- **Docker Desktop** (for MongoDB replica set + MailHog)
- **Git**

## Quick Start

1. Clone the repository:

   ```bash
   git clone <repo-url>
   cd "Event Sphere Management E-Project"
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy environment files and fill in the required values:

   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

4. Start Docker services (MongoDB replica set + MailHog):

   ```bash
   docker-compose up -d
   ```

5. Start development servers:
   ```bash
   npm run dev
   ```

## Access Points

| Service      | URL                          |
| ------------ | ---------------------------- |
| API          | http://localhost:5000        |
| Health check | http://localhost:5000/health |
| Client       | http://localhost:5173        |
| MailHog UI   | http://localhost:8025        |

## Scripts

```bash
npm test        # Run server unit tests
npm run lint    # Lint all JS/JSX files
npm run build   # Build the client for production
npm run dev     # Start both client and server in dev mode
```

## Documentation

- [Architecture overview](./architecture.md)
- [Docker & local setup guide](./docs/setup.md)
- [PRD / requirements](./prd.md)
- [Design system](./design.md)
- [Task plan](./tasks.md)
