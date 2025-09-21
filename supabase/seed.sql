-- Simple seed data - basic data is already in the migration
-- Add additional sample activities for testing

INSERT INTO activities (
    workspace_id,
    action,
    entity_type,
    entity_name,
    description,
    user_name,
    user_email
) VALUES
(
    '01234567-89ab-cdef-0123-456789abcdef',
    'created',
    'customers',
    'TechCorp Solutions GmbH',
    'Neuer Kunde "TechCorp Solutions GmbH" wurde erstellt',
    'System',
    'system@virtusumbra.de'
),
(
    '01234567-89ab-cdef-0123-456789abcdef',
    'created',
    'customers',
    'Digital Marketing Plus',
    'Neuer Kunde "Digital Marketing Plus" wurde erstellt',
    'System',
    'system@virtusumbra.de'
);

-- Refresh dashboard stats
SELECT refresh_dashboard_stats();