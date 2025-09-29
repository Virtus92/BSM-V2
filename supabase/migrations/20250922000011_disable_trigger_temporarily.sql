-- Temporarily disable the problematic trigger until we can fix it properly
DROP TRIGGER IF EXISTS trigger_customers_activity_log ON customers;

-- Also disable the trigger on other tables that might have the same issue
DROP TRIGGER IF EXISTS trigger_contact_requests_activity_log ON contact_requests;
DROP TRIGGER IF EXISTS trigger_customer_notes_activity_log ON customer_notes;

-- We'll re-enable them later with the fixed function