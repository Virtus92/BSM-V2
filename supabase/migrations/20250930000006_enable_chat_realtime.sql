-- Enable Realtime for customer_chat_messages table
-- This allows the Supabase client to receive INSERT/UPDATE/DELETE events in real-time

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE customer_chat_messages;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Table already in publication, ignore error
END $$;

-- Add comment for documentation
COMMENT ON TABLE customer_chat_messages IS 'Real-time chat messages between customers and employees. Realtime enabled for live updates.';