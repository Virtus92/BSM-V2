-- Customer Notes System
-- Enhanced note-taking system for customer detail pages
-- Replaces single notes field with proper multi-note management

-- Create priority enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priority_level') THEN
        CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'critical');
    END IF;
END $$;

-- Customer Notes Table
CREATE TABLE customer_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

    -- Note Content
    title VARCHAR(255),
    content TEXT NOT NULL,

    -- Metadata
    is_internal BOOLEAN DEFAULT false, -- Internal notes vs customer-visible
    note_type VARCHAR(50) DEFAULT 'general', -- general, meeting, call, task, follow_up
    priority priority_level DEFAULT 'medium',

    -- User tracking
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),

    -- Optional due date for task-type notes
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT customer_notes_type_check
        CHECK (note_type IN ('general', 'meeting', 'call', 'task', 'follow_up', 'quote', 'support'))
);

-- Indexes for performance
CREATE INDEX idx_customer_notes_customer_id ON customer_notes(customer_id);
CREATE INDEX idx_customer_notes_created_at ON customer_notes(created_at DESC);
CREATE INDEX idx_customer_notes_type ON customer_notes(note_type);
CREATE INDEX idx_customer_notes_priority ON customer_notes(priority);
CREATE INDEX idx_customer_notes_due_date ON customer_notes(due_date) WHERE due_date IS NOT NULL;

-- Row Level Security
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_notes
CREATE POLICY "Users can view customer notes"
    ON customer_notes FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create customer notes"
    ON customer_notes FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update customer notes they created"
    ON customer_notes FOR UPDATE
    USING (created_by = auth.uid());

CREATE POLICY "Users can delete customer notes they created"
    ON customer_notes FOR DELETE
    USING (created_by = auth.uid());

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_customer_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customer_notes_updated_at
    BEFORE UPDATE ON customer_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_notes_updated_at();

-- Migrate existing customer notes to new system
INSERT INTO customer_notes (customer_id, content, note_type, created_by)
SELECT
    id as customer_id,
    notes as content,
    'general' as note_type,
    created_by
FROM customers
WHERE notes IS NOT NULL AND notes != '';

-- Remove old notes column from customers (after migration)
-- ALTER TABLE customers DROP COLUMN IF EXISTS notes;

-- Add helpful views (will be created after customers table is fixed)
-- CREATE OR REPLACE VIEW customer_notes_summary AS
-- SELECT
--     c.id as customer_id,
--     COALESCE(c.name, c.contact_person, c.company_name, c.company) as display_name,
--     COALESCE(c.company, c.company_name) as company_name,
--     COUNT(cn.id) as total_notes,
--     COUNT(cn.id) FILTER (WHERE cn.note_type = 'task' AND cn.completed_at IS NULL) as open_tasks,
--     COUNT(cn.id) FILTER (WHERE cn.due_date IS NOT NULL AND cn.due_date < NOW() AND cn.completed_at IS NULL) as overdue_tasks,
--     MAX(cn.created_at) as last_note_date
-- FROM customers c
-- LEFT JOIN customer_notes cn ON c.id = cn.customer_id
-- GROUP BY c.id, c.name, c.company;