# ETF Crypto Creator

ETF Crypto Creator is a full-stack application for creating and tracking custom cryptocurrency indices. Users can browse market data, build a portfolio from supported assets, save index configurations, and review historical performance with charts.

## Highlights

- React + Vite frontend with Tailwind styling
- Express + MongoDB backend with JWT auth
- Redis-based caching for market data endpoints
- Binance market data integration for price, stats, and historical series
- Portfolio/index creation and management flows
- Docker-ready setup for local development and deployment

## Tech Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS, Recharts
- Backend: Node.js, Express, MongoDB, Mongoose, Redis, JWT
- External data: Binance public API
- Testing: Node.js built-in test runner + Playwright

## Project Structure

```text
.
├── client/                  # Frontend app
│   ├── src/                # React source code
│   ├── public/             # Static assets
│   ├── package.json        # Frontend scripts and dependencies
│   └── vite.config.ts      # Vite config
├── server/                 # Backend app
│   ├── config/             # Database config
│   ├── controllers/        # Route handlers
│   ├── middleware/         # Auth, validation, rate limiting, error handling
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── services/           # Business logic, Binance, auth
│   ├── tests/              # Backend tests
│   ├── index.js            # Express app bootstrap
│   └── package.json        # Backend scripts and dependencies
├── tests/                  # E2E / browser tests
├── .env.example            # Example environment file
├── .gitignore              # Repo hygiene rules
├── compose.yml             # Docker compose for full stack
├── init-mongo.js           # MongoDB initialization script
├── package.json            # Root scripts for local workflows
├── playwright.config.ts    # Playwright config
├── LICENSE                 # If added in a real repo
└── README.md               # Project documentation
```

## Architecture Overview

The application follows a simple three-layer architecture:

1. Frontend layer
   - React client provides routing, auth flow, portfolio creation, and chart visualization.
   - Stores and services call the backend API for user and market data.

2. API layer
   - Express server exposes public and protected routes.
   - Auth routes handle registration/login/token verification.
   - Index routes manage user-created portfolio definitions.
   - Market data endpoints query Binance and cache responses through Redis.

3. Data layer
   - MongoDB stores users and saved indices.
   - Redis stores short-lived cache entries for price/history requests.
   - Binance is the live market data source.

### Request flow example

```text
Browser -> React client -> Express API -> Redis cache -> Binance API
                         \-> MongoDB for saved indices and auth
```

## Demo / Screenshots

Add screenshots to the docs folder and reference them here once captured:

```text
docs/screenshots/
├── home-page.png
├── create-index.png
├── my-indices.png
└── analytics.png
```

Example:

```md
![Home page](docs/screenshots/home-page.png)
```

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/Dangeroouz/etf-crypto-creator.git
cd etf-crypto-creator
```

### 2. Configure environment variables

Copy the example file:

```bash
cp .env.example .env.local
```

Then update the values for your local environment:

```env
MONGODB_URI=mongodb://<username>:<password>@localhost:27017/etf-crypto?authSource=admin
REDIS_URL=redis://localhost:6379
JWT_SECRET=replace-with-a-long-random-secret
PORT=3333
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:3333
```

### 3. Start MongoDB and Redis

Using Docker:

```bash
docker compose up -d mongodb redis
```

Or install and run them locally if preferred.

### 4. Install dependencies

```bash
npm install
npm --prefix client install
npm --prefix server install
```

### 5. Run the app

Server:

```bash
npm --prefix server run dev
```

Client:

```bash
npm --prefix client run dev
```

Alternatively, run the full stack with Docker:

```bash
docker compose up --build
```

### 6. Validate

```bash
npm test
```

## Testing

The project includes:

- backend unit tests via Node test runner
- Playwright browser coverage for end-to-end scenarios

Run tests:

```bash
npm test
npx playwright test
```

## Security Notes

- Never commit real secrets, API keys, or production credentials.
- Use `.env.local` or deployment secret managers instead of checking raw env files into git.
- Keep generated tokens and DB credentials out of the repository history.

## Repository Hygiene

This repository is kept in a cleaner state by:

- keeping sample config in `.env.example`
- ignoring local environment files and generated outputs
- keeping runtime/test artifacts such as Playwright reports out of source control
- documenting how to run and configure the app

## Meaningful Commits

Use clear commit messages such as:

```bash
git commit -m "feat: add auth flow and JWT middleware"
git commit -m "feat: add Binance market data service"
git commit -m "docs: add project architecture and setup guide"
git commit -m "test: cover auth rate limiting behavior"
```

## License

This project currently uses the ISC license as defined in package metadata unless otherwise updated.
