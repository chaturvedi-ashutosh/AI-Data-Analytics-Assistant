# AI-Powered Data Analytics Assistant

Part 1 establishes a PostgreSQL-backed Express API and a React dashboard that checks the API and displays database schema metadata. LLM-based SQL generation and query execution are intentionally left for later parts.

## Requirements

- Node.js 20 or newer and npm
- PostgreSQL 14 or newer, with `psql` available in the terminal
- Ollama is installed separately for a later implementation part; it is not used by this foundation

## Project structure

```text
backend/
  db/sql/                 PostgreSQL database, schema, seed, and reader-role scripts
  src/config/             Environment configuration
  src/controllers/        HTTP request/response handlers
  src/db/                 PostgreSQL connection pool
  src/middleware/         Async errors, request validation, and error responses
  src/routes/             Health and schema API routes
  src/services/           PostgreSQL schema introspection
  .env.example            Application environment template
frontend/
  src/components/         Dashboard building blocks
  src/services/           Express API client
  src/App.jsx              Initial analytics workspace
  vite.config.js           Tailwind plugin and local API proxy
  .env.example             Optional API base URL
```

The root npm workspace installs dependencies into the root `node_modules`. Each app keeps its own `package.json` and lockfile.

## Install dependencies

From the project root:

```sh
npm install
```

## Create and seed the database

Use an administrative PostgreSQL account only for database setup. These commands do not put the administrator password in the application configuration. PowerShell prompts for the password if PostgreSQL requires it:

```powershell
psql -h localhost -U postgres -d postgres -f backend/db/sql/00_create_database.sql
psql -h localhost -U postgres -d analytics_db -f backend/db/sql/01_schema.sql
psql -h localhost -U postgres -d analytics_db -f backend/db/sql/02_seed.sql
```

The seed is repeatable. It creates five regions, twelve customers, ten products, and twenty-one orders spread across 2024–2026 with completed, pending, processing, shipped, cancelled, and refunded statuses. `orders.total_amount` is derived from its order items.

### Run the schema and sample data in pgAdmin

1. In pgAdmin, connect to your PostgreSQL server and select the `analytics_db` database.
2. Open **Tools → Query Tool**.
3. Use **Open File** to open `backend/db/sql/01_schema.sql`, then execute it with **F5**.
4. Open `backend/db/sql/02_seed.sql` and execute it with **F5**.
5. Refresh **Schemas → public → Tables**. The tables and sample records should appear.

Run the schema file before the seed file. Both are repeatable and contain plain SQL suitable for pgAdmin’s Query Tool.
After seeding, expect 5 regions, 12 customers, 10 products, 21 orders, and 38 order items.

Create `analytics_user` under **Login/Group Roles** in pgAdmin and set its password there. Then open Query Tool for `analytics_db` as the database owner/admin, open `backend/db/sql/03_readonly_role.sql`, and execute it with **F5**. The SQL script grants `SELECT` access, sets read-only transactions and a statement timeout, and does not change the role password. The application never uses the administrative account.

## Configure the backend

Copy the template and set the database user and password to the `analytics_user` credentials:

```powershell
Copy-Item backend/.env.example backend/.env
```

Example local connection string:

```text
DATABASE_URL=postgresql://analytics_user:your_password@localhost:5432/analytics_db
```

The backend accepts either `DATABASE_URL` or the individual `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` variables. The application should use the restricted `analytics_user` account; reserve an administrative account for running the setup SQL. The remaining variables configure the API port, allowed frontend origin, connection pool, timeouts, and environment. Never commit `backend/.env`; the root `.gitignore` excludes it.

`frontend/.env.example` documents the optional `VITE_API_BASE_URL`. Leave it empty for local development, where Vite proxies `/api` to Express.

## Run locally

Start the backend and frontend in separate terminals from the project root:

```sh
npm run dev:backend
```

```sh
npm run dev:frontend
```

Vite serves the dashboard at `http://localhost:5173`. It proxies `/api` requests to Express at `http://localhost:3000`.

## API endpoints

### `GET /api/health`

Checks the Express API and PostgreSQL connection. Returns `200` when both are healthy, or `503` when the API is running but PostgreSQL is unavailable or `DATABASE_URL` is missing.

### `GET /api/schema`

Returns the tables, columns, PostgreSQL types, nullability, defaults, primary-key flags, and foreign-key relationships in the `public` schema. The optional `schema` query parameter is validated and only accepts `public`.

## Verify the connection and API

With PostgreSQL configured and both apps running, use PowerShell:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
Invoke-RestMethod http://localhost:3000/api/schema
```

Or open the frontend and check the API/database status and discovered tables in the dashboard. The question composer is a UI placeholder in Part 1; it does not generate SQL or execute queries yet.

To check the PostgreSQL credentials in `backend/.env` independently, run `npm --prefix backend run test:db` from the project root. The check reports the connected database, whether the session is read-only, whether it uses `analytics_user`, and the current sample-table row counts.

## Module responsibilities

- `backend/src/server.js` starts the HTTP server and closes the pool during shutdown.
- `backend/src/app.js` configures security headers, CORS, JSON parsing, API routes, and centralized errors.
- `backend/src/db/pool.js` owns the PostgreSQL connection pool and connection check.
- `backend/src/controllers/` turns route requests into API responses.
- `backend/src/routes/` defines health and validated schema endpoints.
- `backend/src/services/schemaService.js` reads table, column, key, and relationship metadata from PostgreSQL.
- `backend/src/middleware/` handles async errors and validates request query parameters.
- `backend/db/sql/` contains database creation, schema/index, sample-data, and read-only-role setup scripts.
- `frontend/src/services/analyticsApi.js` calls the backend API.
- `frontend/src/components/` contains dashboard pieces; `frontend/src/App.jsx` composes them and loads API/schema status.
- `backend/src/services/llmService.js` is an existing Ollama helper and is not connected to Part 1 routes.
