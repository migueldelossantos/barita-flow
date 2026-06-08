CREATE POLICY "Members update company" ON companies
  FOR UPDATE USING (is_company_member(id)) WITH CHECK (is_company_member(id));
