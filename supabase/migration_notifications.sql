-- ============================================================
-- MIGRATION : Paramètres notifications + logo sur salons
-- Exécutez CE FICHIER UNIQUEMENT dans Supabase SQL Editor
-- ============================================================

ALTER TABLE salons ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT
  '{"reminder_24h":true,"confirmation":true,"review_request":true,"loyalty":true,"reactivation":false}';

ALTER TABLE salons ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT '';
