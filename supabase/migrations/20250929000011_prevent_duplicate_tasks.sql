-- Prevent duplicate auto-created tasks for the same user/request while active
-- 1) Make trigger idempotent: only insert if no active task exists for that (request, assignee)
CREATE OR REPLACE FUNCTION auto_create_task_from_assignment()
RETURNS TRIGGER AS $$
DECLARE
    _exists_active boolean;
BEGIN
    -- Only proceed for active assignments
    IF NEW.is_active IS DISTINCT FROM TRUE THEN
        RETURN NEW;
    END IF;

    -- Check if an active (not done/cancelled) task already exists for this (request, assignee)
    SELECT EXISTS (
        SELECT 1
        FROM tasks t
        WHERE t.assigned_to = NEW.assigned_to
          AND t.contact_request_id = NEW.contact_request_id
          AND t.status NOT IN ('done', 'cancelled')
    ) INTO _exists_active;

    IF NOT _exists_active THEN
        INSERT INTO tasks (
            title,
            description,
            assigned_to,
            assigned_by,
            contact_request_id,
            priority,
            estimated_hours,
            created_by,
            status
        )
        SELECT
            'Bearbeitung: ' || cr.subject,
            'Automatisch erstellte Aufgabe für Anfrage: ' || cr.subject || COALESCE(chr(10) || NEW.notes, ''),
            NEW.assigned_to,
            NEW.assigned_by,
            NEW.contact_request_id,
            COALESCE(NEW.priority, 'medium'),
            NEW.estimated_hours,
            COALESCE(NEW.assigned_by, NEW.assigned_to),
            'todo'
        FROM contact_requests cr
        WHERE cr.id = NEW.contact_request_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2) Enforce at DB level one active task per (request, assignee)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_task_per_user_request
ON tasks (contact_request_id, assigned_to)
WHERE status NOT IN ('done','cancelled','completed');
