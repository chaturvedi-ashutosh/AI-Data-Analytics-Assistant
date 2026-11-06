# AI-Powered Data Analytics Assistant

Part 1 establishes the PostgreSQL-backed Express API and React dashboard. Part 2 adds local Ollama-based SQL generation. Part 3 validates generated SQL and executes approved analytics queries in a PostgreSQL read-only transaction using a restricted database role.

## Requirements

- Node.js 20 or newer and npm
- PostgreSQL 14 or newer, with `psql` available in the terminal
- Ollama installed locally, with the configured model pulled (`ollama pull qwen2.5-coder:7b`)

## Project structure

```text
backend/
  db/sql/                 PostgreSQL database, schema, seed, and reader-role scripts
  src/config/             Environment configuration
  src/controllers/        HTTP request/response handlers
  src/db/                 PostgreSQL connection pool
  src/middleware/         Async errors, request validation, and error responses
  src/routes/             Health, schema, and SQL-generation API routes
  src/services/           Schema, prompt, Ollama, SQL parsing, and generation modules
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

Create `analytics_user` under **Login/Group Roles** in pgAdmin and set its password there. Then open Query Tool for `analytics_db` as the database owner/admin, open `backend/db/sql/03_readonly_role.sql`, and execute it with **F5**. Run this updated script again if the role was configured earlier: it removes previous broad grants, gives column-limited customer access (excluding names and email), sets connection and statement limits, and enables read-only transactions. The script does not change the role password. The application never uses the administrative account.

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

### `POST /api/analyze`

Accepts `{"question":"Which products generated the highest revenue?"}`. On success, returns the question, SQL, explanation, result column names, up to 500 rows, a truncation flag, execution time in milliseconds, and `status: "success"`. Validation failures return HTTP 422 with `status: "rejected"` and do not execute the query.

## Verify the connection and API

With PostgreSQL configured and both apps running, use PowerShell:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
Invoke-RestMethod http://localhost:3000/api/schema
```

Or open the frontend and check the API/database status and discovered tables in the dashboard. The question composer sends questions to `POST /api/analyze`, which validates and executes approved SQL using the read-only role; the dashboard displays the SQL and bounded result rows.

## Generate SQL with Ollama

Copy the updated `backend/.env.example` settings into `backend/.env` (or add them to the existing file) and configure `OLLAMA_HOST`, `OLLAMA_MODEL`, timeout, temperature, and context size as needed. The defaults use `http://127.0.0.1:11434` and `qwen2.5-coder:7b`. Keep the local `.env` private; no API key is required for local Ollama.

Start Ollama and confirm the model is installed:

```powershell
ollama list
```

With the backend running, submit a question in the dashboard or call:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/analyze -ContentType 'application/json' -Body '{"question":"Which products generated the highest revenue?"}'
```

Example response:

```json
{
  "question": "Which products generated the highest revenue?",
  "sql": "SELECT p.name, SUM(oi.line_total) AS revenue FROM products AS p JOIN order_items AS oi ON oi.product_id = p.id GROUP BY p.name ORDER BY revenue DESC LIMIT 10",
  "explanation": "Ranks products by the sum of their order line totals.",
  "columns": ["name", "revenue"],
  "rows": [{"name": "27-inch Monitor", "revenue": "1395.00"}],
  "truncated": false,
  "executionTime": 18,
  "status": "success"
}
```

Ambiguous questions return `status: "clarification_needed"`, `sql: null`, and a brief clarification. Rejected SQL returns HTTP 422 with `status: "rejected"`; it is logged and never reaches PostgreSQL. The validator parses PostgreSQL SQL, checks approved tables and columns, safe functions, read-only CTEs and FK joins, and rejects multiple statements. Execution adds a maximum row count, uses a five-second statement timeout, verifies the connected role, and runs inside `BEGIN READ ONLY` / `COMMIT`. The database role independently denies writes and cannot read customer names or email addresses. The LLM has no database connection or execution tool.

## SQL generation tests

Run the SQL validator checks for selects, joins, grouping, subqueries, CTEs, DML/DDL, multiple statements, unauthorized tables and columns, dangerous functions, malformed SQL, and length limits:

```powershell
npm --prefix backend test
```

To verify the PostgreSQL role and database-level write protections, run `npm --prefix backend run test:db` from the project root after applying `03_readonly_role.sql`. It checks the analytics role, private customer columns, sample rows, and attempts safe no-row INSERT/UPDATE/DELETE statements that must be denied by PostgreSQL.

## Module responsibilities

- `backend/src/server.js` starts the HTTP server and closes the pool during shutdown.
- `backend/src/app.js` configures security headers, CORS, JSON parsing, API routes, and centralized errors.
- `backend/src/db/pool.js` owns the PostgreSQL connection pool and connection check.
- `backend/src/controllers/` turns route requests into API responses.
- `backend/src/routes/` defines health, schema, and validated analytics endpoints.
- `backend/src/services/schemaService.js` reads table, column, key, and relationship metadata from PostgreSQL and adds business definitions for prompts.
- `backend/src/middleware/` handles async errors and validates request query parameters.
- `backend/db/sql/` contains database creation, schema/index, sample-data, and read-only-role setup scripts.
- `frontend/src/services/analyticsApi.js` calls the backend API.
- `frontend/src/components/` contains dashboard pieces; `frontend/src/App.jsx` composes them and loads API/schema status.
- `backend/src/services/llmService.js` calls the configured local Ollama model with a timeout; `promptService.js` builds schema-aware instructions.
- `backend/src/services/sqlGenerationService.js` loads PostgreSQL schema metadata and obtains structured SQL from the model; model output remains untrusted.
- `backend/src/services/sqlValidator.js` parses PostgreSQL SQL and checks statement types, approved schema, columns, functions, CTEs, and join relationships.
- `backend/src/services/queryService.js` verifies the database role, sets a transaction-local timeout, executes in a read-only transaction, and caps returned rows.
- `backend/src/controllers/analytics.controller.js` and `backend/src/routes/analytics.routes.js` implement `POST /api/analyze`, including rejection logging and the generation/validation/execution flow.
