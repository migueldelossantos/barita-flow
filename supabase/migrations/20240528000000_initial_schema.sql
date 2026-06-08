-- BaristaFlow: multi-tenant ordering system

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- License types
CREATE TYPE license_type AS ENUM ('DEMO', 'RENTA');
CREATE TYPE delivery_method AS ENUM ('delivery', 'pickup', 'dine_in');
CREATE TYPE payment_method AS ENUM ('cash', 'transfer');
CREATE TYPE order_status AS ENUM (
  'open',
  'active',
  'waiting',
  'preparing',
  'completed',
  'delivered',
  'finished'
);
CREATE TYPE topping_mode AS ENUM ('default_included', 'required_choice', 'optional');

-- Companies (tenants) — created by system owner
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  license_type license_type NOT NULL DEFAULT 'DEMO',
  license_expires_at TIMESTAMPTZ NOT NULL,
  is_setup_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Extended profile (filled by business on first login)
CREATE TABLE company_profiles (
  company_id UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  slogan TEXT,
  logo_url TEXT,
  banner_url TEXT,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  whatsapp_phone TEXT,
  transfer_owner_name TEXT,
  transfer_bank TEXT,
  transfer_clabe TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Link Supabase auth users to companies
CREATE TABLE company_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_bestseller BOOLEAN NOT NULL DEFAULT false,
  sales_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);

CREATE TABLE product_toppings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mode topping_mode NOT NULL DEFAULT 'optional',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quick-add products linked to a main product (e.g. drinks with burger)
CREATE TABLE product_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  addon_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE (product_id, addon_product_id)
);

CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_percent NUMERIC(5, 2),
  discount_amount NUMERIC(10, 2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  order_number SERIAL,
  status order_status NOT NULL DEFAULT 'active',
  delivery_method delivery_method NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  customer_lat DOUBLE PRECISION,
  customer_lng DOUBLE PRECISION,
  payment_method payment_method NOT NULL DEFAULT 'cash',
  cash_amount NUMERIC(10, 2),
  coupon_code TEXT,
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL,
  line_total NUMERIC(10, 2) NOT NULL,
  special_instructions TEXT,
  configuration JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_item_toppings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  topping_name TEXT NOT NULL,
  is_selected BOOLEAN NOT NULL DEFAULT true
);

-- Indexes
CREATE INDEX idx_categories_company ON categories(company_id);
CREATE INDEX idx_products_company ON products(company_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_bestseller ON products(company_id, is_bestseller) WHERE is_bestseller = true;
CREATE INDEX idx_orders_company ON orders(company_id, created_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER company_profiles_updated_at BEFORE UPDATE ON company_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Increment sales on order
CREATE OR REPLACE FUNCTION increment_product_sales()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    UPDATE products
    SET sales_count = sales_count + NEW.quantity
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_items_sales AFTER INSERT ON order_items
  FOR EACH ROW EXECUTE FUNCTION increment_product_sales();

-- RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_toppings ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_toppings ENABLE ROW LEVEL SECURITY;

-- Public read for menu (anon)
CREATE POLICY "Public read companies" ON companies FOR SELECT USING (true);
CREATE POLICY "Public read profiles" ON company_profiles FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read active products" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Public read toppings" ON product_toppings FOR SELECT USING (true);
CREATE POLICY "Public read addons" ON product_addons FOR SELECT USING (true);
CREATE POLICY "Public read active coupons" ON coupons FOR SELECT USING (is_active = true);

-- Public insert orders (customers)
CREATE POLICY "Public insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert order items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert order toppings" ON order_item_toppings FOR INSERT WITH CHECK (true);

-- Members manage their company data
CREATE OR REPLACE FUNCTION is_company_member(p_company_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM company_members
    WHERE company_id = p_company_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE POLICY "Members manage categories" ON categories FOR ALL
  USING (is_company_member(company_id)) WITH CHECK (is_company_member(company_id));

CREATE POLICY "Members manage products" ON products FOR ALL
  USING (is_company_member(company_id)) WITH CHECK (is_company_member(company_id));

CREATE POLICY "Members manage toppings" ON product_toppings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_id AND is_company_member(p.company_id)
    )
  );

CREATE POLICY "Members manage addons" ON product_addons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_id AND is_company_member(p.company_id)
    )
  );

CREATE POLICY "Members manage coupons" ON coupons FOR ALL
  USING (is_company_member(company_id)) WITH CHECK (is_company_member(company_id));

CREATE POLICY "Members read orders" ON orders FOR SELECT
  USING (is_company_member(company_id));

CREATE POLICY "Members update orders" ON orders FOR UPDATE
  USING (is_company_member(company_id));

CREATE POLICY "Members read order items" ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id AND is_company_member(o.company_id)
    )
  );

CREATE POLICY "Members update profile" ON company_profiles FOR ALL
  USING (is_company_member(company_id)) WITH CHECK (is_company_member(company_id));

CREATE POLICY "Members read own membership" ON company_members FOR SELECT
  USING (user_id = auth.uid());

-- Storage bucket for logos (run in dashboard or separate migration)
-- insert into storage.buckets (id, name, public) values ('company-assets', 'company-assets', true);
