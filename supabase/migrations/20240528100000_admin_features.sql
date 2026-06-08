-- Admin features: storage, super-admin, locked toppings, realtime

ALTER TYPE topping_mode ADD VALUE IF NOT EXISTS 'locked';

CREATE TABLE system_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE system_admins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_system_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM system_admins WHERE user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE POLICY "Admins read self" ON system_admins
  FOR SELECT USING (user_id = auth.uid());

-- System admins manage companies
CREATE POLICY "System admins manage companies" ON companies
  FOR ALL USING (is_system_admin()) WITH CHECK (is_system_admin());

CREATE POLICY "System admins manage profiles" ON company_profiles
  FOR ALL USING (is_system_admin()) WITH CHECK (is_system_admin());

CREATE POLICY "System admins manage members" ON company_members
  FOR ALL USING (is_system_admin()) WITH CHECK (is_system_admin());

-- Members can insert profile on first setup
CREATE POLICY "Members insert profile" ON company_profiles
  FOR INSERT WITH CHECK (is_company_member(company_id));

-- Members read all products (including inactive) for admin panel
DROP POLICY IF EXISTS "Public read active products" ON products;
CREATE POLICY "Public read active products" ON products
  FOR SELECT USING (is_active = true OR is_company_member(company_id));

-- Storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-assets',
  'company-assets',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'company-assets');

CREATE POLICY "Members upload assets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'company-assets'
    AND (storage.foldername(name))[1] IN (
      SELECT company_id::text FROM company_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members update assets" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'company-assets'
    AND (storage.foldername(name))[1] IN (
      SELECT company_id::text FROM company_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members delete assets" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'company-assets'
    AND (storage.foldername(name))[1] IN (
      SELECT company_id::text FROM company_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System admins storage" ON storage.objects
  FOR ALL USING (
    bucket_id = 'company-assets' AND is_system_admin()
  );

-- Realtime for new orders
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
