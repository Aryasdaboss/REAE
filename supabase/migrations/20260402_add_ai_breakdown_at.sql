-- Phase 2: Add aiBreakdownAt column to tasks table
-- Used by the "Break it down" Edge Function to enforce the 10-per-day rate limit.
-- Tracks when a breakdown was last requested for each task.
-- NULL means breakdown has never been used on this task.

ALTER TABLE tasks
ADD COLUMN "aiBreakdownAt" timestamptz NULL;
