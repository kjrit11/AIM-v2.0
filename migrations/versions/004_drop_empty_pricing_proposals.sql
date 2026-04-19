-- migrations/versions/004_drop_empty_pricing_proposals.sql
--
-- Purpose:    Remove empty scaffold sales.pricing.proposals. Live proposal data
--             is in sales.app.proposals (3 rows as of 2026-04-18 audit). The
--             sales.app.proposals → sales.core.proposals migration happens
--             in Phase 6; this migration only drops the empty duplicate in
--             sales.pricing.
-- Author:     kevin@careinmotion
-- Date:       2026-04-18
-- Rollback:   RESTORE TABLE sales.pricing.proposals TO VERSION AS OF <N>;
--             or UNDROP TABLE sales.pricing.proposals (within 30-day retention).
-- References: docs/WAVE_1_CLEANUP.md, docs/ARCHITECTURE.md § Schema inventory

DROP TABLE IF EXISTS sales.pricing.proposals;

INSERT INTO sales.core.schema_migrations
VALUES ('004', '004_drop_empty_pricing_proposals.sql', CURRENT_TIMESTAMP(), '<operator-email>', 'bootstrap');
