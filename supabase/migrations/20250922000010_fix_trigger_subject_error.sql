-- Fix the trigger function to properly handle different table schemas
CREATE OR REPLACE FUNCTION trigger_log_data_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    action_type activity_action;
    resource_name VARCHAR(100);
    resource_identifier VARCHAR(255);
    old_vals JSONB;
    new_vals JSONB;
BEGIN
    -- Determine action type
    IF TG_OP = 'INSERT' THEN
        action_type := 'CREATE'::activity_action;
        new_vals := to_jsonb(NEW);
        old_vals := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        action_type := 'UPDATE'::activity_action;
        old_vals := to_jsonb(OLD);
        new_vals := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        action_type := 'DELETE'::activity_action;
        old_vals := to_jsonb(OLD);
        new_vals := NULL;
    END IF;

    -- Get resource name from table
    resource_name := TG_TABLE_NAME;

    -- Get resource identifier based on table schema
    resource_identifier := 'Unknown';

    BEGIN
        IF resource_name = 'customers' THEN
            resource_identifier := COALESCE(
                CASE WHEN TG_OP = 'DELETE' THEN old_vals->>'company_name' ELSE new_vals->>'company_name' END,
                CASE WHEN TG_OP = 'DELETE' THEN old_vals->>'contact_person' ELSE new_vals->>'contact_person' END,
                'Customer'
            );
        ELSIF resource_name = 'contact_requests' THEN
            resource_identifier := COALESCE(
                CASE WHEN TG_OP = 'DELETE' THEN old_vals->>'subject' ELSE new_vals->>'subject' END,
                'Contact Request'
            );
        ELSIF resource_name = 'user_profiles' THEN
            resource_identifier := COALESCE(
                CASE WHEN TG_OP = 'DELETE' THEN
                    CONCAT(old_vals->>'first_name', ' ', old_vals->>'last_name')
                ELSE
                    CONCAT(new_vals->>'first_name', ' ', new_vals->>'last_name')
                END,
                'User Profile'
            );
        ELSE
            resource_identifier := 'Record';
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            resource_identifier := 'Record';
    END;

    -- Only log for employee and admin actions (customers' actions on their own data are not logged)
    IF get_user_role() IN ('admin', 'employee') THEN
        PERFORM log_user_activity(
            action_type,
            resource_name,
            COALESCE(
                CASE WHEN TG_OP = 'DELETE' THEN (old_vals->>'id')::UUID ELSE (new_vals->>'id')::UUID END
            ),
            resource_identifier,
            old_vals,
            new_vals
        );
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;