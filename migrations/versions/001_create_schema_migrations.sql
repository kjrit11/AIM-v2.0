-- migrations/versions/001_create_schema_migrations.sql
--
-- Purpose:    Bootstrap the migration tracking table.
-- Author:     kevin@careinmotion
-- Date:       2026-04-18
-- Rollback:   DROP TABLE sales.core.schema_migrations;
-- References: docs/MIGRATIONS.md, docs/WAVE_1_CLEANUP.md

CREATE TABLE IF NOT EXISTS sales.core.schema_migrations (
  version    STRING NOT NULL,
  filename   STRING NOT NULL,
  applied_at TIMESTAMP NOT NULL,
  applied_by STRING NOT NULL,
  checksum   STRING NOT NULL
) USING DELTA;

-- Manually record this migration's own application.
-- Replace '<operator-email>' with Kevin's actual email before running.
-- The checksum field stays 'bootstrap' for Wave 1; the runner (Phase 3+) fills real checksums.
INSERT INTO sales.core.schema_migrations
VALUES ('001', '001_create_schema_migrations.sql', CURRENT_TIMESTAMP(), '<operator-email>', 'bootstrap');
