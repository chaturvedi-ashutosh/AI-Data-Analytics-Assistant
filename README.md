# AI Data Analytics Assistant

Project scaffold with a Vite frontend and an Express API.

## Requirements

- Node.js 20 or newer
- npm

## Install dependencies

```sh
npm install
```

Dependencies for both workspaces install into the root `node_modules`.

## Start the apps

Run each app in a separate terminal from the project root:

```sh
npm run dev:frontend
```

```sh
npm run dev:backend
```

Vite prints the frontend URL when it starts. The API listens on `http://localhost:3000` by default.

## Backend

Copy `backend/.env.example` to `backend/.env` if you need to change the defaults. The starter API endpoints are `GET /api` and `GET /api/health`.

Build the frontend from the project root with `npm run build`.

## Current status

The frontend is the standard Vite starter page, ready for the application UI to be built. The backend is an Express starter with CORS, JSON parsing, error handling, and a health endpoint.
