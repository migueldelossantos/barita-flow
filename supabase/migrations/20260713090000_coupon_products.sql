-- Coupon product scope

CREATE TABLE coupon_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (coupon_id, product_id)
);

CREATE INDEX idx_coupon_products_coupon ON coupon_products(coupon_id);
CREATE INDEX idx_coupon_products_product ON coupon_products(product_id);

ALTER TABLE coupon_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read coupon products" ON coupon_products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coupons c
      WHERE c.id = coupon_id AND c.is_active = true
    )
  );

CREATE POLICY "Members manage coupon products" ON coupon_products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM coupons c
      WHERE c.id = coupon_id AND is_company_member(c.company_id)
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM coupons c
      WHERE c.id = coupon_id AND is_company_member(c.company_id)
    )
  );
