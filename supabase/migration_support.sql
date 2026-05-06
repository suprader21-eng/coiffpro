-- ============================================================
-- MIGRATION : Table support_messages (chat barber ↔ admin)
-- Exécutez CE FICHIER UNIQUEMENT dans Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS support_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id    UUID REFERENCES salons(id) ON DELETE CASCADE,
  from_admin  BOOLEAN DEFAULT false,
  message     TEXT NOT NULL,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support_salon_access" ON support_messages;
CREATE POLICY "support_salon_access" ON support_messages FOR ALL
  USING (salon_id = get_salon_id_for_user(auth.uid()))
  WITH CHECK (salon_id = get_salon_id_for_user(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_support_salon ON support_messages(salon_id, created_at);
