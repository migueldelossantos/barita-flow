CREATE TABLE IF NOT EXISTS company_order_counters (
  company_id UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  last_order_number INT NOT NULL DEFAULT 0
);

INSERT INTO company_order_counters (company_id, last_order_number)
SELECT company_id, COALESCE(MAX(order_number), 0)
FROM orders
GROUP BY company_id
ON CONFLICT (company_id) DO UPDATE
SET last_order_number = GREATEST(company_order_counters.last_order_number, EXCLUDED.last_order_number);

ALTER TABLE orders
  ALTER COLUMN order_number DROP DEFAULT;

ALTER TABLE orders
  ADD CONSTRAINT orders_company_order_number_unique UNIQUE (company_id, order_number);

CREATE OR REPLACE FUNCTION assign_company_order_number()
RETURNS TRIGGER AS $$
DECLARE
  next_order_number INT;
BEGIN
  INSERT INTO company_order_counters (company_id, last_order_number)
  VALUES (NEW.company_id, 1)
  ON CONFLICT (company_id)
  DO UPDATE SET last_order_number = company_order_counters.last_order_number + 1
  RETURNING last_order_number INTO next_order_number;

  NEW.order_number := next_order_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS orders_assign_order_number ON orders;

CREATE TRIGGER orders_assign_order_number
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION assign_company_order_number();
