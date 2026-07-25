ALTER TABLE company_profiles
  ADD COLUMN IF NOT EXISTS menu_enabled BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE company_profiles
  ADD COLUMN IF NOT EXISTS menu_open_time TIME;

ALTER TABLE company_profiles
  ADD COLUMN IF NOT EXISTS menu_close_time TIME;
