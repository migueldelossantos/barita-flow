-- Plans, onboarding and limits. Existing DEMO/RENTA tenants continue to work.
ALTER TYPE license_type ADD VALUE IF NOT EXISTS 'FREE';
ALTER TYPE license_type ADD VALUE IF NOT EXISTS 'BASICA';
ALTER TYPE license_type ADD VALUE IF NOT EXISTS 'PREMIUM';

-- A phone obtained from Google is not guaranteed; this column is updated during onboarding.
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Members may edit business information, but never the plan or expiry fields.
CREATE OR REPLACE FUNCTION update_own_company_profile(
  p_company_id UUID,
  p_name TEXT,
  p_phone TEXT,
  p_setup_complete BOOLEAN
) RETURNS VOID AS $$
BEGIN
  IF NOT is_company_member(p_company_id) THEN
    RAISE EXCEPTION 'Sin permisos para actualizar esta empresa.';
  END IF;
  UPDATE companies
  SET name = p_name, phone = p_phone, is_setup_complete = p_setup_complete
  WHERE id = p_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_own_company_profile(UUID, TEXT, TEXT, BOOLEAN) TO authenticated;

CREATE OR REPLACE FUNCTION company_license_allows(p_company_id UUID, p_feature TEXT)
RETURNS BOOLEAN AS $$
  SELECT CASE p_feature
    WHEN 'promotions' THEN c.license_type IN ('BASICA', 'PREMIUM', 'RENTA')
    ELSE c.license_expires_at > now()
  END
  FROM companies c WHERE c.id = p_company_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION enforce_company_product_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_license license_type;
  product_total INTEGER;
BEGIN
  SELECT license_type INTO current_license FROM companies WHERE id = NEW.company_id;
  IF NOT EXISTS (SELECT 1 FROM companies WHERE id = NEW.company_id AND license_expires_at > now()) THEN
    RAISE EXCEPTION 'La licencia de esta empresa está vencida.';
  END IF;
  IF current_license = 'FREE' THEN
    SELECT count(*) INTO product_total FROM products WHERE company_id = NEW.company_id;
    IF product_total >= 10 THEN
      RAISE EXCEPTION 'Tu licencia FREE permite hasta 10 productos. Contrata la licencia Básica para continuar.';
    END IF;
  ELSIF current_license IN ('BASICA') THEN
    SELECT count(*) INTO product_total FROM products WHERE company_id = NEW.company_id;
    IF product_total >= 50 THEN
      RAISE EXCEPTION 'Tu licencia Básica permite hasta 50 productos. Contrata Premium para continuar.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS products_license_limit ON products;
CREATE TRIGGER products_license_limit BEFORE INSERT ON products
  FOR EACH ROW EXECUTE FUNCTION enforce_company_product_limit();

CREATE OR REPLACE FUNCTION enforce_company_order_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_license license_type;
  monthly_total INTEGER;
BEGIN
  SELECT license_type INTO current_license FROM companies WHERE id = NEW.company_id;
  IF NOT EXISTS (SELECT 1 FROM companies WHERE id = NEW.company_id AND license_expires_at > now()) THEN
    RAISE EXCEPTION 'La licencia de esta empresa está vencida.';
  END IF;
  IF current_license = 'FREE' THEN
    SELECT count(*) INTO monthly_total FROM orders
      WHERE company_id = NEW.company_id
        AND created_at >= date_trunc('month', now());
    IF monthly_total >= 100 THEN
      RAISE EXCEPTION 'Tu licencia FREE permite hasta 100 órdenes por mes. Contrata la licencia Básica para continuar.';
    END IF;
  ELSIF current_license = 'BASICA' THEN
    SELECT count(*) INTO monthly_total FROM orders
      WHERE company_id = NEW.company_id
        AND created_at >= date_trunc('month', now());
    IF monthly_total >= 1000 THEN
      RAISE EXCEPTION 'Tu licencia Básica permite hasta 1,000 órdenes por mes. Contrata Premium para continuar.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS orders_license_limit ON orders;
CREATE TRIGGER orders_license_limit BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION enforce_company_order_limit();

CREATE OR REPLACE FUNCTION enforce_coupon_license()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT company_license_allows(NEW.company_id, 'promotions') THEN
    RAISE EXCEPTION 'Cupones y ofertas están disponibles desde la licencia Básica.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS coupons_license_limit ON coupons;
CREATE TRIGGER coupons_license_limit BEFORE INSERT OR UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION enforce_coupon_license();
