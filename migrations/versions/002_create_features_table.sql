-- migrations/versions/002_create_features_table.sql
--
-- Purpose:    Feature flag storage. Consumed by /src/lib/features.ts from Phase 3.
--             Also holds config-style values (e.g. pricing_approver_email) that
--             are admin-editable without a deploy.
-- Author:     kevin@careinmotion
-- Date:       2026-04-18
-- Rollback:   DROP TABLE sales.core.features;
-- References: docs/ARCHITECTURE.md § Feature flags,
--             docs/modules/PRICING_AGENT.md § 6.7 (pricing_approver_email config)

CREATE TABLE IF NOT EXISTS sales.core.features (
  key          STRING NOT NULL,
  enabled      BOOLEAN NOT NULL DEFAULT FALSE,
  rollout_pct  INT NOT NULL DEFAULT 0,
  description  STRING,
  value        STRING,                          -- optional config value (e.g. email, threshold)
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  updated_by   STRING                            -- optional: who made the last change
) USING DELTA;

-- Informational primary key. Databricks Unity Catalog accepts this as a
-- non-enforced constraint; helps query planners and schema introspection tools.
-- If your Databricks runtime rejects this syntax, drop the line — the table
-- still works without it.
ALTER TABLE sales.core.features ADD CONSTRAINT pk_features_key PRIMARY KEY (key);

-- Seed the initial flags, all disabled until wired up
INSERT INTO sales.core.features (key, enabled, rollout_pct, description, value, updated_at, updated_by) VALUES
  ('demo_mode',              false, 0,   'When true, routes queries to sales_demo catalog',                 NULL, CURRENT_TIMESTAMP(), 'migration-002'),
  ('verbose_logging',        false, 0,   'When true, logger emits DEBUG-level entries',                     NULL, CURRENT_TIMESTAMP(), 'migration-002'),
  ('proposal_v2',            false, 0,   'Enables Phase 6 proposal generator UI',                           NULL, CURRENT_TIMESTAMP(), 'migration-002'),
  ('ai_task_extraction',     false, 0,   'Enables AI task extraction in Notepad Phase 8',                   NULL, CURRENT_TIMESTAMP(), 'migration-002'),
  ('pricing_approver_email', true,  100, 'Email address of the user authorized to approve below-floor pricing quotes',
                                         'kevin@careinmotion.com',
                                         CURRENT_TIMESTAMP(), 'migration-002');

INSERT INTO sales.core.schema_migrations
VALUES ('002', '002_create_features_table.sql', CURRENT_TIMESTAMP(), '<operator-email>', 'bootstrap');
