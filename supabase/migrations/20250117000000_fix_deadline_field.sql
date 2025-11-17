-- Fix deadline field to accept text instead of date
-- This allows users to enter flexible deadlines like "2 weeks", "End of March", etc.

ALTER TABLE rfq_submissions 
ALTER COLUMN deadline TYPE TEXT;