\set ON_ERROR_STOP on

SELECT 'CREATE DATABASE analytics_db'
WHERE NOT EXISTS (
  SELECT 1
  FROM pg_database
  WHERE datname = 'analytics_db'
)
\gexec
