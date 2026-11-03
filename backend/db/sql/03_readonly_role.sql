-- Run in analytics_db using a database owner or administrator account.
-- Create analytics_user in pgAdmin first and set its password there.

ALTER ROLE analytics_user LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION;
ALTER ROLE analytics_user SET default_transaction_read_only = on;
ALTER ROLE analytics_user SET statement_timeout = '10s';

REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT CONNECT ON DATABASE analytics_db TO analytics_user;
GRANT USAGE ON SCHEMA public TO analytics_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_user;

-- Run as the same owner that creates future public-schema tables.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO analytics_user;
