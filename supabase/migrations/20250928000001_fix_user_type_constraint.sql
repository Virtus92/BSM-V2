-- Fix user_type constraint to include 'employee'
-- Migration: 20250928000001_fix_user_type_constraint.sql

-- Remove old constraint
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_type_check;

-- Add correct constraint that includes 'employee'
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_type_check
CHECK (user_type IN ('admin', 'employee', 'customer'));

-- Ensure any existing data is valid
UPDATE user_profiles
SET user_type = 'employee'
WHERE user_type NOT IN ('admin', 'employee', 'customer');

-- Add missing fields to user_profiles if they don't exist
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS activation_required BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE;

-- Create employee_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS employee_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE,
    job_title VARCHAR(100),
    department_id UUID,
    hire_date DATE,
    direct_phone VARCHAR(50),
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(50),
    working_hours_per_week INTEGER DEFAULT 40,
    time_zone VARCHAR(100) DEFAULT 'Europe/Berlin',
    skills TEXT[] DEFAULT '{}',
    certifications TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{}',
    performance_rating DECIMAL(3,2),
    manager_id UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create departments table if it doesn't exist
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    head_of_department_id UUID REFERENCES auth.users(id),
    budget DECIMAL(12,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint to employee_profiles.department_id
ALTER TABLE employee_profiles
ADD CONSTRAINT fk_employee_department
FOREIGN KEY (department_id) REFERENCES departments(id);

-- Add proper task assignment relationships
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Update tasks table to ensure proper data types
ALTER TABLE tasks ALTER COLUMN priority TYPE VARCHAR(20);
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_priority_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_priority_check
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

ALTER TABLE tasks ALTER COLUMN status TYPE VARCHAR(20);
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'cancelled', 'blocked'));

-- Create proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON user_profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_employee_profiles_user_id ON employee_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_profiles_department_id ON employee_profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- Add updated_at trigger for employee_profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_employee_profiles_updated_at ON employee_profiles;
CREATE TRIGGER update_employee_profiles_updated_at
    BEFORE UPDATE ON employee_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default department if none exists
INSERT INTO departments (name, description, is_active)
SELECT 'General', 'Default department for employees', true
WHERE NOT EXISTS (SELECT 1 FROM departments);