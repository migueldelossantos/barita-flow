CREATE TYPE product_option_selection AS ENUM ('required', 'optional', 'multiple');

CREATE TABLE product_option_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  selection_type product_option_selection NOT NULL DEFAULT 'required',
  min_selections INT NOT NULL DEFAULT 0 CHECK (min_selections >= 0),
  max_selections INT NOT NULL DEFAULT 1 CHECK (max_selections >= 1),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE product_option_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES product_option_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_adjustment NUMERIC(10,2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_option_groups_product ON product_option_groups(product_id);
CREATE INDEX idx_option_values_group ON product_option_values(group_id);
ALTER TABLE product_option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_option_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read option groups" ON product_option_groups FOR SELECT USING (true);
CREATE POLICY "Public read option values" ON product_option_values FOR SELECT USING (true);
CREATE POLICY "Members manage option groups" ON product_option_groups FOR ALL USING (EXISTS (SELECT 1 FROM products p WHERE p.id = product_id AND is_company_member(p.company_id))) WITH CHECK (EXISTS (SELECT 1 FROM products p WHERE p.id = product_id AND is_company_member(p.company_id)));
CREATE POLICY "Members manage option values" ON product_option_values FOR ALL USING (EXISTS (SELECT 1 FROM product_option_groups g JOIN products p ON p.id = g.product_id WHERE g.id = group_id AND is_company_member(p.company_id))) WITH CHECK (EXISTS (SELECT 1 FROM product_option_groups g JOIN products p ON p.id = g.product_id WHERE g.id = group_id AND is_company_member(p.company_id)));
