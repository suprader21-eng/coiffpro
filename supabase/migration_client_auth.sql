-- Client portal: link Supabase auth users to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS clients_auth_user_id_idx ON clients(auth_user_id);

-- Allow clients to read/update their own record
CREATE POLICY IF NOT EXISTS "clients_own_read" ON clients
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY IF NOT EXISTS "clients_own_update" ON clients
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- Allow clients to read their own appointments
CREATE POLICY IF NOT EXISTS "appointments_client_read" ON appointments
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
  );

-- Allow clients to cancel their own appointments (update status only)
CREATE POLICY IF NOT EXISTS "appointments_client_cancel" ON appointments
  FOR UPDATE USING (
    client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
  );
