-- Allow customers to read their own customer row under RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Remove previous policy with same intent, if present
DROP POLICY IF EXISTS "customer_access_own_data" ON customers;

-- Customers can select their own customer record
CREATE POLICY "customer_access_own_data" ON customers
FOR SELECT USING (
  user_id = auth.uid()
);

