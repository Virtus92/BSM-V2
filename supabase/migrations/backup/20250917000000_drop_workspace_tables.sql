-- Drop workspace-based tables for single-tenant migration
-- Created: 2024-09-17

-- Drop existing tables if they exist
DROP TABLE IF EXISTS contact_request_notes CASCADE;
DROP TABLE IF EXISTS contact_requests CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS workspace_members CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_user_workspace_ids();
DROP FUNCTION IF EXISTS refresh_dashboard_stats();

-- Drop views
DROP MATERIALIZED VIEW IF EXISTS dashboard_stats CASCADE;
DROP VIEW IF EXISTS recent_activities CASCADE;

-- Drop types (will be recreated in next migration)
DROP TYPE IF EXISTS customer_status CASCADE;
DROP TYPE IF EXISTS workspace_plan CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;