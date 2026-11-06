-- Run in analytics_db using a database owner or administrator account.
-- Create analytics_user in pgAdmin first and set its password there.

ALTER ROLE analytics_user LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION CONNECTION LIMIT 10;
ALTER ROLE analytics_user SET default_transaction_read_only = on;
ALTER ROLE analytics_user SET statement_timeout = '10s';
ALTER ROLE analytics_user SET idle_in_transaction_session_timeout = '15s';

REVOKE CREATE ON SCHEMA public FROM PUBLIC, analytics_user;
GRANT CONNECT ON DATABASE analytics_db TO analytics_user;
GRANT USAGE ON SCHEMA public TO analytics_user;

-- Remove any previous broad grants before granting the approved analytics scope.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM PUBLIC, analytics_user;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, analytics_user;
REVOKE SELECT (id, full_name, email, region_id, signup_date, created_at)
  ON TABLE public.customers FROM PUBLIC, analytics_user;
GRANT SELECT ON TABLE public.regions, public.products, public.orders, public.order_items TO analytics_user;

-- Expose customer analytics fields but keep names and email addresses unavailable to the app role.
GRANT SELECT (id, region_id, signup_date, created_at) ON TABLE public.customers TO analytics_user;

-- Future objects require an explicit grant after review; do not grant access by default.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM analytics_user;
