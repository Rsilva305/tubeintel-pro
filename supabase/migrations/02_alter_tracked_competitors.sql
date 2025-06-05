-- Alter tracked_competitors table to use BIGINT for numeric fields
ALTER TABLE public.tracked_competitors 
  ALTER COLUMN subscriber_count TYPE BIGINT,
  ALTER COLUMN video_count TYPE BIGINT,
  ALTER COLUMN view_count TYPE BIGINT; 