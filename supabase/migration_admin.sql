-- ============================================================
-- MIGRATION : Colonnes admin sur la table salons
-- Exécutez CE FICHIER UNIQUEMENT dans Supabase SQL Editor
-- ============================================================

ALTER TABLE salons ADD COLUMN IF NOT EXISTS admin_notes    TEXT DEFAULT '';
ALTER TABLE salons ADD COLUMN IF NOT EXISTS admin_message  TEXT DEFAULT '';
ALTER TABLE salons ADD COLUMN IF NOT EXISTS custom_domain  TEXT DEFAULT '';
