-- ============================================================
-- COIFFPRO — Schema complet v2
-- Exécutez dans Supabase SQL Editor
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- SALONS (un compte = un salon barber)
CREATE TABLE salons (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug                  TEXT UNIQUE NOT NULL, -- ex: "shop-karim-lyon"
  owner_name            TEXT NOT NULL,
  email                 TEXT UNIQUE NOT NULL,
  phone                 TEXT,
  -- Infos salon
  name                  TEXT NOT NULL DEFAULT 'Mon Salon',
  tagline               TEXT DEFAULT 'Coiffure & Barbier',
  description           TEXT,
  address               TEXT,
  city                  TEXT,
  postal_code           TEXT,
  instagram             TEXT,
  website               TEXT,
  google_link           TEXT,
  google_maps_embed     TEXT,
  -- Branding
  primary_color         TEXT DEFAULT '#1a1a1a',
  accent_color          TEXT DEFAULT '#c8a96e',
  logo_url              TEXT,
  -- Business
  plan                  TEXT DEFAULT 'pro' CHECK (plan IN ('pro')),
  plan_price            INTEGER DEFAULT 5000, -- centimes = 50€
  status                TEXT DEFAULT 'trial' CHECK (status IN ('trial','active','suspended','cancelled')),
  trial_ends_at         TIMESTAMPTZ DEFAULT NOW() + INTERVAL '14 days',
  -- Stripe
  stripe_customer_id         TEXT,
  stripe_subscription_id     TEXT,
  stripe_subscription_status TEXT,
  -- SumUp
  sumup_merchant_code   TEXT,
  sumup_access_token    TEXT,
  -- Meta
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- HEURES D'OUVERTURE
CREATE TABLE salon_hours (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id  UUID REFERENCES salons(id) ON DELETE CASCADE,
  day_index INTEGER NOT NULL CHECK (day_index BETWEEN 0 AND 6), -- 0=lundi
  day_name  TEXT NOT NULL,
  is_open   BOOLEAN DEFAULT true,
  open_time TEXT DEFAULT '09:00',
  close_time TEXT DEFAULT '19:00',
  UNIQUE(salon_id, day_index)
);

-- PHOTOS DU SALON
CREATE TABLE salon_photos (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id  UUID REFERENCES salons(id) ON DELETE CASCADE,
  url       TEXT NOT NULL,
  alt       TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- EMPLOYEES / COLLABORATEURS
CREATE TABLE employees (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id    UUID REFERENCES salons(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  role        TEXT DEFAULT 'Coiffeur(se)',
  bio         TEXT,
  avatar_url  TEXT,
  color       TEXT DEFAULT '#c8a96e',
  rating      DECIMAL(2,1) DEFAULT 5.0,
  review_count INTEGER DEFAULT 0,
  specialties TEXT[] DEFAULT '{}',
  is_active   BOOLEAN DEFAULT true,
  is_owner    BOOLEAN DEFAULT false,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- SERVICES
CREATE TABLE services (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id    UUID REFERENCES salons(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  category    TEXT DEFAULT 'Coupes',
  duration_minutes INTEGER DEFAULT 30,
  price_cents INTEGER DEFAULT 2000, -- en centimes
  is_active   BOOLEAN DEFAULT true,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- SERVICES ↔ EMPLOYEES (qui fait quoi)
CREATE TABLE service_employees (
  service_id  UUID REFERENCES services(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  PRIMARY KEY (service_id, employee_id)
);

-- CLIENTS DU SALON
CREATE TABLE clients (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id      UUID REFERENCES salons(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  phone         TEXT NOT NULL,
  email         TEXT,
  notes         TEXT,
  visit_count   INTEGER DEFAULT 0,
  total_spent_cents INTEGER DEFAULT 0,
  last_visit_at TIMESTAMPTZ,
  loyalty_points INTEGER DEFAULT 0, -- 1 point par visite
  gift_available BOOLEAN DEFAULT false,
  gift_given_at  TIMESTAMPTZ,
  tags          TEXT[] DEFAULT '{}',
  gdpr_consent  BOOLEAN DEFAULT false,
  gdpr_date     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(salon_id, phone)
);

-- RENDEZ-VOUS
CREATE TABLE appointments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id        UUID REFERENCES salons(id) ON DELETE CASCADE,
  client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
  employee_id     UUID REFERENCES employees(id) ON DELETE SET NULL,
  service_id      UUID REFERENCES services(id) ON DELETE SET NULL,
  -- Timing
  scheduled_at    TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  -- Status
  status          TEXT DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','completed','cancelled','no_show')),
  -- Prix & paiement
  price_cents     INTEGER NOT NULL DEFAULT 0,
  discount_type   TEXT CHECK (discount_type IN ('percent','fixed',NULL)),
  discount_value  INTEGER DEFAULT 0, -- % ou centimes
  final_price_cents INTEGER, -- calculé
  paid            BOOLEAN DEFAULT false,
  payment_method  TEXT CHECK (payment_method IN ('cash','card','sumup','online',NULL)),
  sumup_payment_id TEXT,
  -- SMS
  reminder_sent   BOOLEAN DEFAULT false,
  review_sent     BOOLEAN DEFAULT false,
  -- Meta
  client_note     TEXT,
  internal_note   TEXT,
  source          TEXT DEFAULT 'online' CHECK (source IN ('online','manual','phone','instagram')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- REMISES / PROMOTIONS
CREATE TABLE discounts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id    UUID REFERENCES salons(id) ON DELETE CASCADE,
  code        TEXT,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('percent','fixed','loyalty_gift')),
  value       INTEGER NOT NULL, -- % ou centimes
  min_visits  INTEGER DEFAULT 0, -- nombre de visites minimum pour débloquer
  valid_from  TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  max_uses    INTEGER,
  use_count   INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- AVIS
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id    UUID REFERENCES salons(id) ON DELETE CASCADE,
  client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  rating      INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  source      TEXT DEFAULT 'google',
  is_verified BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- CAMPAGNES SMS
CREATE TABLE sms_campaigns (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id         UUID REFERENCES salons(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  message          TEXT NOT NULL,
  target_segment   TEXT DEFAULT 'all',
  status           TEXT DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sending','sent','failed')),
  scheduled_at     TIMESTAMPTZ,
  sent_at          TIMESTAMPTZ,
  recipients_count INTEGER DEFAULT 0,
  delivered_count  INTEGER DEFAULT 0,
  cost_cents       INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- LOGS SMS
CREATE TABLE sms_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id        UUID REFERENCES salons(id),
  client_id       UUID REFERENCES clients(id),
  appointment_id  UUID REFERENCES appointments(id),
  campaign_id     UUID REFERENCES sms_campaigns(id),
  type            TEXT CHECK (type IN ('reminder','confirmation','review','loyalty','campaign','discount')),
  message         TEXT,
  phone           TEXT,
  status          TEXT DEFAULT 'sent',
  twilio_sid      TEXT,
  sent_at         TIMESTAMPTZ DEFAULT NOW()
);

-- PAIEMENTS SUMUP
CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id        UUID REFERENCES salons(id),
  appointment_id  UUID REFERENCES appointments(id),
  client_id       UUID REFERENCES clients(id),
  amount_cents    INTEGER NOT NULL,
  discount_cents  INTEGER DEFAULT 0,
  final_cents     INTEGER NOT NULL,
  method          TEXT NOT NULL,
  sumup_checkout_id TEXT,
  sumup_status    TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','refunded')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ABONNEMENTS PLATEFORME (mes clients à moi)
CREATE TABLE platform_subscriptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id        UUID REFERENCES salons(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  amount_cents    INTEGER DEFAULT 5000,
  status          TEXT DEFAULT 'trialing',
  trial_end       TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEXES ──
CREATE INDEX idx_appointments_salon_date ON appointments(salon_id, scheduled_at);
CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_clients_salon ON clients(salon_id);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_sms_logs_salon ON sms_logs(salon_id);

-- ── ROW LEVEL SECURITY ──
ALTER TABLE salons           ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_hours      ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_photos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees        ENABLE ROW LEVEL SECURITY;
ALTER TABLE services         ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients          ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews          ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_campaigns    ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments         ENABLE ROW LEVEL SECURITY;

-- Politique : chaque salon voit uniquement ses propres données
CREATE OR REPLACE FUNCTION get_salon_id_for_user(user_uuid UUID)
RETURNS UUID LANGUAGE sql SECURITY DEFINER AS $$
  SELECT id FROM salons WHERE email = (SELECT email FROM auth.users WHERE id = user_uuid)
$$;

-- Salons : owner voit son salon
CREATE POLICY "salon_owner" ON salons FOR ALL
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Données du salon : via la fonction helper
DO $$ DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['salon_hours','salon_photos','employees','services','clients','appointments','discounts','reviews','sms_campaigns','payments'] LOOP
    EXECUTE format('
      CREATE POLICY "%I_access" ON %I FOR ALL
      USING (salon_id = get_salon_id_for_user(auth.uid()))', t, t);
  END LOOP;
END $$;

-- Lecture publique pour la page de réservation (salon actif uniquement)
CREATE POLICY "public_salon_read" ON salons FOR SELECT USING (status IN ('trial','active'));
CREATE POLICY "public_hours_read" ON salon_hours FOR SELECT USING (true);
CREATE POLICY "public_photos_read" ON salon_photos FOR SELECT USING (true);
CREATE POLICY "public_employees_read" ON employees FOR SELECT USING (is_active = true);
CREATE POLICY "public_services_read" ON services FOR SELECT USING (is_active = true);
CREATE POLICY "public_appointment_insert" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "public_client_upsert" ON clients FOR INSERT WITH CHECK (true);

-- ── TRIGGERS ──

-- Met à jour updated_at sur salons
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER salons_updated_at BEFORE UPDATE ON salons FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Incrémente visit_count + loyalty quand RDV terminé
CREATE OR REPLACE FUNCTION on_appointment_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE clients SET
      visit_count = visit_count + 1,
      loyalty_points = loyalty_points + 1,
      total_spent_cents = total_spent_cents + COALESCE(NEW.final_price_cents, NEW.price_cents),
      last_visit_at = NOW(),
      gift_available = ((loyalty_points + 1) % 10 = 0)
    WHERE id = NEW.client_id;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER appt_completed
  AFTER UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION on_appointment_completed();

-- Calcule le prix final avec remise
CREATE OR REPLACE FUNCTION calc_final_price()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.discount_type = 'percent' THEN
    NEW.final_price_cents = ROUND(NEW.price_cents * (1 - NEW.discount_value::DECIMAL / 100));
  ELSIF NEW.discount_type = 'fixed' THEN
    NEW.final_price_cents = GREATEST(0, NEW.price_cents - NEW.discount_value);
  ELSE
    NEW.final_price_cents = NEW.price_cents;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER calc_price BEFORE INSERT OR UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION calc_final_price();

-- ── DONNÉES INITIALES ──
-- À insérer après création du compte via l'inscription
-- Les fonctions seed sont appelées depuis l'API /api/register


-- Champs SumUp OAuth (à ajouter si vous avez déjà créé le schema)
-- ALTER TABLE salons ADD COLUMN IF NOT EXISTS sumup_access_token TEXT;
-- ALTER TABLE salons ADD COLUMN IF NOT EXISTS sumup_refresh_token TEXT;
-- ALTER TABLE salons ADD COLUMN IF NOT EXISTS sumup_token_expires_at TIMESTAMPTZ;
-- (sumup_merchant_code existe déjà dans le schema)

-- Colonnes supplémentaires pour Stripe (ajouter si pas déjà présentes)
-- ALTER TABLE salons ADD COLUMN IF NOT EXISTS stripe_subscription_status TEXT;
-- ALTER TABLE salons ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- ═══ FIXES ADDITIONNELS ═══
-- Ajouter les colonnes manquantes si elles n'existent pas
ALTER TABLE salons ADD COLUMN IF NOT EXISTS stripe_subscription_status TEXT DEFAULT 'trialing';
ALTER TABLE salons ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- S'assurer que 'trialing' est dans le check constraint
-- (À exécuter dans Supabase SQL Editor si le check constraint existe déjà)
-- ALTER TABLE salons DROP CONSTRAINT IF EXISTS salons_status_check;
-- ALTER TABLE salons ADD CONSTRAINT salons_status_check
--   CHECK (status IN ('trial','trialing','active','suspended','cancelled'));

-- ═══ PRODUITS & STOCK ═══
-- Exécutez ce bloc dans Supabase SQL Editor
CREATE TABLE IF NOT EXISTS products (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id             UUID REFERENCES salons(id) ON DELETE CASCADE,
  reference            TEXT NOT NULL,           -- numéro / SKU produit
  name                 TEXT NOT NULL,
  brand                TEXT DEFAULT '',
  category             TEXT DEFAULT 'Soins',
  stock_quantity       INTEGER DEFAULT 0,
  stock_alert          INTEGER DEFAULT 5,        -- seuil alerte stock faible
  purchase_price_cents INTEGER DEFAULT 0,
  sale_price_cents     INTEGER DEFAULT 0,
  is_active            BOOLEAN DEFAULT true,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "products_access" ON products FOR ALL
  USING (salon_id = get_salon_id_for_user(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_products_salon ON products(salon_id);
