CREATE TYPE license_request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE license_request_kind AS ENUM ('change', 'reactivation');

CREATE TABLE license_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  requested_license license_type NOT NULL,
  kind license_request_kind NOT NULL DEFAULT 'change',
  status license_request_status NOT NULL DEFAULT 'pending',
  customer_note TEXT,
  admin_note TEXT,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_license_requests_status_created ON license_requests(status, created_at DESC);
CREATE INDEX idx_license_requests_company ON license_requests(company_id, created_at DESC);

ALTER TABLE license_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read own license requests" ON license_requests FOR SELECT
  USING (is_company_member(company_id));

CREATE POLICY "Members create own license requests" ON license_requests FOR INSERT
  WITH CHECK (is_company_member(company_id) AND status = 'pending');

CREATE POLICY "System admins manage license requests" ON license_requests FOR ALL
  USING (is_system_admin()) WITH CHECK (is_system_admin());
