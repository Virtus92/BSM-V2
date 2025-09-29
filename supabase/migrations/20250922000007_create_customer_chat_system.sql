-- Create customer_chat_messages table for real-time chat functionality
CREATE TABLE IF NOT EXISTS customer_chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_from_customer BOOLEAN NOT NULL DEFAULT true,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_customer_chat_messages_customer_id ON customer_chat_messages(customer_id);
CREATE INDEX idx_customer_chat_messages_created_at ON customer_chat_messages(created_at);
CREATE INDEX idx_customer_chat_messages_sender_id ON customer_chat_messages(sender_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customer_chat_messages_updated_at
    BEFORE UPDATE ON customer_chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add assigned_employee_id to customers table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'customers'
        AND column_name = 'assigned_employee_id'
    ) THEN
        ALTER TABLE customers
        ADD COLUMN assigned_employee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

        CREATE INDEX idx_customers_assigned_employee_id ON customers(assigned_employee_id);
    END IF;
END $$;

-- Enable RLS
ALTER TABLE customer_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_chat_messages
CREATE POLICY "Customers can view their own chat messages" ON customer_chat_messages
    FOR SELECT USING (
        customer_id IN (
            SELECT id FROM customers WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Customers can insert their own chat messages" ON customer_chat_messages
    FOR INSERT WITH CHECK (
        is_from_customer = true AND
        sender_id = auth.uid() AND
        customer_id IN (
            SELECT id FROM customers WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Employees can view chat messages for their assigned customers" ON customer_chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND user_type IN ('employee', 'admin')
        ) OR
        customer_id IN (
            SELECT id FROM customers
            WHERE assigned_employee_id = auth.uid()
        )
    );

CREATE POLICY "Employees can insert chat messages for assigned customers" ON customer_chat_messages
    FOR INSERT WITH CHECK (
        is_from_customer = false AND
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND user_type IN ('employee', 'admin')
        ) AND
        (
            customer_id IN (
                SELECT id FROM customers
                WHERE assigned_employee_id = auth.uid()
            ) OR
            EXISTS (
                SELECT 1 FROM user_profiles
                WHERE id = auth.uid()
                AND user_type = 'admin'
            )
        )
    );

-- Grant necessary permissions
GRANT SELECT, INSERT ON customer_chat_messages TO authenticated;