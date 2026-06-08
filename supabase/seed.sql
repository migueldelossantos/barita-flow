-- Demo company for local testing
-- Replace UUID when testing: http://localhost:3000/menu/00000000-0000-4000-8000-000000000001

INSERT INTO companies (id, name, phone, license_type, license_expires_at, is_setup_complete)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'Barista Demo',
  '5215512345678',
  'DEMO',
  now() + interval '30 days',
  true
);

INSERT INTO company_profiles (
  company_id, slogan, banner_url, logo_url, address,
  whatsapp_phone, transfer_owner_name, transfer_bank, transfer_clabe
) VALUES (
  '00000000-0000-4000-8000-000000000001',
  'El mejor café de la ciudad',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&q=80',
  'Av. Reforma 123, CDMX',
  '5215512345678',
  'Juan Pérez',
  'BBVA',
  '012180001234567890'
);

INSERT INTO categories (id, company_id, name, short_name, description, sort_order) VALUES
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'Principal', 'principal', 'Platillos principales', 0),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', 'Snacks', 'snacks', 'Botanas', 1),
  ('10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001', 'Refrescos', 'refrescos', 'Bebidas frías', 2);

INSERT INTO products (id, company_id, category_id, code, name, description, price, image_url, is_bestseller, sales_count) VALUES
  ('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'BURG-001', 'Hamburguesa clásica', 'Carne angus, pan artesanal', 179.00, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80', true, 120),
  ('20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'BURG-002', 'Hamburguesa BBQ', 'Salsa BBQ ahumada', 199.00, 'https://images.unsplash.com/photo-1553979450-d2229ba6763e?w=600&q=80', true, 95),
  ('20000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'SNK-001', 'Papas fritas', 'Porción grande', 65.00, 'https://images.unsplash.com/photo-1573080496219-b080a9456a38?w=600&q=80', false, 40),
  ('20000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'BEB-001', 'Coca-Cola', '355 ml', 35.00, 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=600&q=80', true, 200),
  ('20000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'BEB-002', 'Agua mineral', '500 ml', 25.00, null, false, 80);

INSERT INTO product_toppings (product_id, name, mode, sort_order) VALUES
  ('20000000-0000-4000-8000-000000000001', 'Cebolla', 'default_included', 0),
  ('20000000-0000-4000-8000-000000000001', 'Tomate', 'default_included', 1),
  ('20000000-0000-4000-8000-000000000001', 'Chile', 'optional', 2),
  ('20000000-0000-4000-8000-000000000001', 'Catsup', 'optional', 3),
  ('20000000-0000-4000-8000-000000000001', 'Mostaza', 'optional', 4),
  ('20000000-0000-4000-8000-000000000001', 'Mayonesa', 'optional', 5);

INSERT INTO product_addons (product_id, addon_product_id, sort_order) VALUES
  ('20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000004', 0),
  ('20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000005', 1);
