# Architecture Overview

## System Context

ETF Crypto Creator is a small crypto portfolio builder and analytics product. It allows users to:

- create custom crypto indices
- review live market data from Binance
- compare portfolio performance over time
- save and revisit created indices
- authenticate through a JWT-backed API

## High-Level Components

### 1. Client application

Location: `client/`

Responsibilities:

- render pages and dashboard views
- manage auth state via Zustand stores
- fetch crypto data and portfolio data from the backend
- visualize market/trend data through charts

Key modules:

- `client/src/components/*` for screens and UI fragments
- `client/src/store/*` for global state
- `client/src/services/*` for API integrations

### 2. API server

Location: `server/`

Responsibilities:

- authenticate users
- validate requests
- expose protected and public endpoints
- interact with MongoDB and Redis
- aggregate market data from Binance

Key modules:

- `server/index.js` for bootstrapping and route registration
- `server/controllers/*` for handler logic
- `server/services/*` for auth and market-data logic
- `server/middleware/*` for security and validation

### 3. Data stores

- MongoDB stores persisted user data and saved indices.
- Redis caches live price and history responses.
- Binance provides the market price and historical dataset used by analytics views.

## Runtime Flow

### Authentication flow

1. User submits login/register form in the client.
2. Client calls `/api/auth/*` endpoints.
3. Server verifies credentials and issues JWT tokens.
4. Protected routes use `verifyToken` middleware.
5. Client stores the token and sends it in the Authorization header.

### Index creation flow

1. User chooses tokens and weighting strategy in the frontend.
2. Client sends the index payload to `/api/indices`.
3. Server validates the model and stores it in MongoDB.
4. Client can fetch and render saved indices from the backend.

### Market data flow

1. Client requests symbol/market info via API endpoints.
2. Server checks Redis cache.
3. If a cache miss occurs, it calls Binance.
4. Result is cached for a short TTL and returned to the client.

## Deployment Model

The repository supports:

- local development with separate terminal processes for client/server
- Docker Compose for MongoDB, Redis, API, and frontend

## Design Notes

- The system is intentionally modular and not overly complex.
- The backend keeps a thin boundary around API requests and business logic.
- Caching reduces repeated calls to Binance and improves responsiveness.
- The app is suited for a simple SaaS-style MVP or portfolio dashboard.
