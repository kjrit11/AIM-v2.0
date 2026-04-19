-- migrations/versions/003_drop_stale_industry_news_feed.sql
--
-- Purpose:    Remove stale sales.app.industry_news_feed (79 rows, last updated
--             2026-03-25). Live intel data lives in sales.gold.industry_news_feed
--             (504 rows, daily updates as of 2026-04-18 audit).
-- Author:     kevin@careinmotion
-- Date:       2026-04-18
-- Rollback:   Delta time travel —
--             RESTORE TABLE sales.app.industry_news_feed TO VERSION AS OF <N>
--             — where N is the version prior to the drop. Time travel retention
--             on this table is 30 days by default. If retention has expired, use
--             UNDROP TABLE sales.app.industry_news_feed (within retention window)
--             or accept data loss.
-- References: docs/WAVE_1_CLEANUP.md, docs/GOTCHAS.md § "sales.app.industry_news_feed is stale"

DROP TABLE IF EXISTS sales.app.industry_news_feed;

INSERT INTO sales.core.schema_migrations
VALUES ('003', '003_drop_stale_industry_news_feed.sql', CURRENT_TIMESTAMP(), '<operator-email>', 'bootstrap');
