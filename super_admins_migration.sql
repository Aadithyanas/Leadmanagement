-- 1. Create super_admins table
CREATE TABLE IF NOT EXISTS super_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on super_admins
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- 2. Insert the specific user as super admin
INSERT INTO super_admins (user_id) 
VALUES ('166a3981-2515-4e28-8cdc-556c7c7d98fd')
ON CONFLICT (user_id) DO NOTHING;

-- 3. Update existing policies to allow super_admins
-- We will add an OR condition to the existing policies. 
-- Since we don't know the exact names of your current RLS policies, 
-- you might need to manually drop the old ones and recreate them, 
-- or use ALTER POLICY if you know their names.

-- Here is the general approach to recreate policies for 'organizations' table
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON organizations;
CREATE POLICY "Enable read access for users in org or super admin"
ON organizations
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM organization_members WHERE user_id = auth.uid() AND org_id = id)
  OR EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
);

-- Repeat for 'leads', 'discussions', 'organization_members', 'teams', 'settings'
-- Example for 'leads':
DROP POLICY IF EXISTS "Users can view leads in their org" ON leads;
CREATE POLICY "Users can view leads in their org or super admin"
ON leads
FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM organization_members WHERE user_id = auth.uid() AND org_id = leads.org_id)
  OR EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
);

-- Please review your Supabase dashboard > Authentication > Policies and add:
-- OR EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
-- to the "USING" and "WITH CHECK" expressions for all relevant tables.
