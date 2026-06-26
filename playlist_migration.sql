CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS playlist_id UUID REFERENCES playlists(id) ON DELETE SET NULL DEFAULT NULL;

ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's playlists"
  ON playlists FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert playlists"
  ON playlists FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update playlists"
  ON playlists FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete playlists"
  ON playlists FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM organization_members WHERE user_id = auth.uid()
    )
  );
