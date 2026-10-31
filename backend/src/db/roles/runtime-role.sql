-- Run as a database administrator after migrations, connected to the target DB.
-- Set the login password out of band using the deployment secret manager.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'community_scam_app') THEN
    EXECUTE 'CREATE ROLE community_scam_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT';
  END IF;
END $$;
ALTER ROLE community_scam_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
DO $$ BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO community_scam_app', current_database());
END $$;

GRANT USAGE ON SCHEMA public TO community_scam_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO community_scam_app;

REVOKE ALL ON SCHEMA restricted FROM PUBLIC;
REVOKE ALL ON TABLE restricted.challenge_contacts FROM PUBLIC;
GRANT USAGE ON SCHEMA restricted TO community_scam_app;
GRANT INSERT ON TABLE restricted.challenge_contacts TO community_scam_app;
REVOKE SELECT, UPDATE, DELETE ON TABLE restricted.challenge_contacts FROM community_scam_app;
