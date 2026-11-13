-- scripts/db-bootstrap.sql
\set ON_ERROR_STOP on

-- Cluster-wide roles, created once.
SELECT format('CREATE ROLE portal_owner LOGIN PASSWORD %L NOSUPERUSER NOBYPASSRLS NOREPLICATION', :'owner_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'portal_owner') \gexec

SELECT format('CREATE ROLE portal_app LOGIN PASSWORD %L NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOREPLICATION', :'app_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'portal_app') \gexec

SELECT format('ALTER ROLE portal_owner %s', CASE WHEN :'allow_createdb' = 'on' THEN 'CREATEDB' ELSE 'NOCREATEDB' END) \gexec
ALTER ROLE portal_app CONNECTION LIMIT :conn_limit;
ALTER ROLE portal_app SET statement_timeout = '15s';
ALTER ROLE portal_app SET lock_timeout = '10s';

-- The database, owned by portal_owner.
SELECT format('CREATE DATABASE %I OWNER portal_owner', :'dbname')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'dbname') \gexec

SELECT format('REVOKE ALL ON DATABASE %I FROM PUBLIC', :'dbname') \gexec
SELECT format('GRANT CONNECT ON DATABASE %I TO portal_app', :'dbname') \gexec

\connect :dbname

-- Extensions need a superuser; pg_trgm powers the search indexes.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER SCHEMA public OWNER TO portal_owner;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO portal_app;

-- Nothing is granted by default. rls.sql grants table by table.
ALTER DEFAULT PRIVILEGES FOR ROLE portal_owner IN SCHEMA public REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE portal_owner IN SCHEMA public REVOKE ALL ON SEQUENCES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE portal_owner IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE portal_owner IN SCHEMA public REVOKE ALL ON TABLES FROM portal_app;
ALTER DEFAULT PRIVILEGES FOR ROLE portal_owner IN SCHEMA public REVOKE ALL ON SEQUENCES FROM portal_app;
