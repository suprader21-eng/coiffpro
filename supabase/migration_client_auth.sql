-- Client portal: link Supabase auth users to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS clients_auth_user_id_idx ON clients(auth_user_id);

-- Drop policies if they already exist (idempotent)
DROP POLICY IF EXISTS "clients_own_read" ON clients;
DROP POLICY IF EXISTS "clients_own_update" ON clients;
DROP POLICY IF EXISTS "appointments_client_read" ON appointments;
DROP POLICY IF EXISTS "appointments_client_cancel" ON appointments;

-- Allow clients to read their own record
CREATE POLICY "clients_own_read" ON clients
  FOR SELECT USING (auth.uid() = auth_user_id);

-- Allow clients to update their own record
CREATE POLICY "clients_own_update" ON clients
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- Allow clients to read their own appointments
CREATE POLICY "appointments_client_read" ON appointments
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
  );

-- Allow clients to cancel their own appointments
CREATE POLICY "appointments_client_cancel" ON appointments
  FOR UPDATE USING (
    client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
  );
