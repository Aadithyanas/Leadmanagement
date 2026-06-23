-- Migration for Soft Deletion (Trash feature)
-- Adds a deleted_at timestamp to the leads table

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
