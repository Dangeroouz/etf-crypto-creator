# Setup Guide

This guide explains how to run the project locally and in Docker.

## Prerequisites

- Node.js 20+
- npm
- MongoDB instance
- Redis instance
- Docker (optional, for full-stack compose)

## Local Development

### 1. Install dependencies

```bash
npm install
npm --prefix client install
npm --prefix server install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Then edit `.env.local` and set values for:

- `MONGODB_URI`
- `REDIS_URL`
- `JWT_SECRET`
- `FRONTEND_URL`
- `VITE_API_URL`

### 3. Start supporting services

Use Docker:

```bash
docker compose up -d mongodb redis
```

Or run MongoDB and Redis using your local installations.

### 4. Run the backend

```bash
npm --prefix server run dev
```

### 5. Run the frontend

```bash
npm --prefix client run dev
```

The client usually runs on `http://localhost:5173` and the API on `http://localhost:3333`.

## Docker Compose

From the repository root:

```bash
docker compose up --build
```

This will start:

- MongoDB
- Redis
- Express API
- React frontend

## Health check

API:

```bash
curl http://localhost:3333/health
```

Frontend:

```bash
curl http://localhost:5173
```

## Common Issues

### MongoDB connection errors

Verify:

- MongoDB is running
- your `MONGODB_URI` matches the local or container service
- credentials and database names are valid

### Redis errors

Check if Redis is running and accessible at `REDIS_URL`.

### JWT errors

Ensure `JWT_SECRET` is present and long enough for production-grade use.

## Testing

```bash
npm test
npx playwright test
```
