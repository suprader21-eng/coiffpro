-- ============================================================
-- MIGRATION : Table products (stock produits)
-- Exécutez CE FICHIER UNIQUEMENT dans Supabase SQL Editor
-- (ne pas re-exécuter schema.sql qui causerait des erreurs)
-- ============================================================

CREATE TABLE IF NOT EXISTS products (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id             UUID REFERENCES salons(id) ON DELETE CASCADE,
  reference            TEXT NOT NULL,
  name                 TEXT NOT NULL,
  brand                TEXT DEFAULT '',
  category             TEXT DEFAULT 'Soins',
  stock_quantity       INTEGER DEFAULT 0,
  stock_alert          INTEGER DEFAULT 5,
  purchase_price_cents INTEGER DEFAULT 0,
  sale_price_cents     INTEGER DEFAULT 0,
  is_active            BOOLEAN DEFAULT true,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_access" ON products;
CREATE POLICY "products_access" ON products FOR ALL
  USING (salon_id = get_salon_id_for_user(auth.uid()))
  WITH CHECK (salon_id = get_salon_id_for_user(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_products_salon ON products(salon_id);
