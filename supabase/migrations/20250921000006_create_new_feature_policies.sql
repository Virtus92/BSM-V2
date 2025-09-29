-- Create RLS policies for new features: Documents, Tasks, Employee Management
-- This ensures proper security and access control

-- ============================================================================
-- DOCUMENT MANAGEMENT POLICIES
-- ============================================================================

-- Admin full access to documents
CREATE POLICY "admin_documents_all" ON documents
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.user_type = 'admin'
            AND up.is_active = true
        )
    );

-- Employees can access documents they created or are assigned to
CREATE POLICY "employee_documents_access" ON documents
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.user_type IN ('employee', 'admin')
            AND up.is_active = true
        )
        AND (
            created_by = auth.uid()
            OR assigned_to = auth.uid()
            OR visibility IN ('public', 'internal')
        )
    );

-- Employees can create documents
CREATE POLICY "employee_documents_create" ON documents
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.user_type IN ('employee', 'admin')
            AND up.is_active = true
        )
        AND created_by = auth.uid()
    );

-- Employees can update documents they created or are assigned to
CREATE POLICY "employee_documents_update" ON documents
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.user_type IN ('employee', 'admin')
            AND up.is_active = true
        )
        AND (created_by = auth.uid() OR assigned_to = auth.uid())
    );

-- Customers can only view public documents or documents assigned to them
CREATE POLICY "customer_documents_read" ON documents
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.user_type = 'customer'
            AND up.is_active = true
        )
        AND (
            visibility = 'public'
            OR (customer_id IS NOT NULL AND customer_id IN (
                SELECT c.id FROM customers c WHERE c.user_id = auth.uid()
            ))
        )
    );

-- Document access logs - employees and admins can read their own logs
CREATE POLICY "document_access_logs_read" ON document_access_logs
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.user_type = 'admin'
            AND up.is_active = true
        )
    );

-- ============================================================================
-- TASK MANAGEMENT POLICIES
-- ============================================================================

-- Admin full access to tasks
CREATE POLICY "admin_tasks_all" ON tasks
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.user_type = 'admin'
            AND up.is_active = true
        )
    );

-- Employees can see tasks they created or are assigned to
CREATE POLICY "employee_tasks_access" ON tasks
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.user_type IN ('employee', 'admin')
            AND up.is_active = true
        )
        AND (
            created_by = auth.uid()
            OR assigned_to = auth.uid()
        )
    );

-- Employees can create tasks
CREATE POLICY "employee_tasks_create" ON tasks
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.user_type IN ('employee', 'admin')
            AND up.is_active = true
        )
        AND created_by = auth.uid()
    );

-- Employees can update tasks they created or are assigned to
CREATE POLICY "employee_tasks_update" ON tasks
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.user_type IN ('employee', 'admin')
            AND up.is_active = true
        )
        AND (created_by = auth.uid() OR assigned_to = auth.uid())
    );

-- Customers can view tasks related to their requests
CREATE POLICY "customer_tasks_read" ON tasks
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.user_type = 'customer'
            AND up.is_active = true
        )
        AND (
            customer_id IN (
                SELECT c.id FROM customers c WHERE c.user_id = auth.uid()
            )
            OR contact_request_id IN (
                SELECT cr.id FROM contact_requests cr
                WHERE cr.customer_user_id = auth.uid()
            )
        )
    );

-- Task comments policies
CREATE POLICY "task_comments_read" ON task_comments
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = task_id
            AND (
                -- Admins can see all
                EXISTS (
                    SELECT 1 FROM user_profiles up
                    WHERE up.id = auth.uid()
                    AND up.user_type = 'admin'
                    AND up.is_active = true
                )
                -- Employees can see if they're involved with the task
                OR (
                    EXISTS (
                        SELECT 1 FROM user_profiles up
                        WHERE up.id = auth.uid()
                        AND up.user_type IN ('employee', 'admin')
                        AND up.is_active = true
                    )
                    AND (t.created_by = auth.uid() OR t.assigned_to = auth.uid())
                    AND (is_internal = false OR user_id = auth.uid())
                )
                -- Customers can see non-internal comments on their tasks
                OR (
                    EXISTS (
                        SELECT 1 FROM user_profiles up
                        WHERE up.id = auth.uid()
                        AND up.user_type = 'customer'
                        AND up.is_active = true
                    )
                    AND is_internal = false
                    AND (
                        t.customer_id IN (
                            SELECT c.id FROM customers c WHERE c.user_id = auth.uid()
                        )
                        OR t.contact_request_id IN (
                            SELECT cr.id FROM contact_requests cr
                            WHERE cr.customer_user_id = auth.uid()
                        )
                    )
                )
            )
        )
    );

CREATE POLICY "task_comments_create" ON task_comments
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = task_id
            AND (
                -- Employees and admins can comment on tasks they're involved with
                (
                    EXISTS (
                        SELECT 1 FROM user_profiles up
                        WHERE up.id = auth.uid()
                        AND up.user_type IN ('employee', 'admin')
                        AND up.is_active = true
                    )
                    AND (t.created_by = auth.uid() OR t.assigned_to = auth.uid())
                )
                -- Customers can comment on their own tasks (non-internal only)
                OR (
                    EXISTS (
                        SELECT 1 FROM user_profiles up
                        WHERE up.id = auth.uid()
                        AND up.user_type = 'customer'
                        AND up.is_active = true
                    )
                    AND is_internal = false
                    AND (
                        t.customer_id IN (
                            SELECT c.id FROM customers c WHERE c.user_id = auth.uid()
                        )
                        OR t.contact_request_id IN (
                            SELECT cr.id FROM contact_requests cr
                            WHERE cr.customer_user_id = auth.uid()
                        )
                    )
                )
            )
        )
    );

-- Task time entries - only employees and admins
CREATE POLICY "task_time_entries_access" ON task_time_entries
    FOR ALL TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.user_type = 'admin'
            AND up.is_active = true
        )
    );

-- ============================================================================
-- DEPARTMENT POLICIES
-- ============================================================================

-- All authenticated users can read departments
CREATE POLICY "departments_read_all" ON departments
    FOR SELECT TO authenticated
    USING (is_active = true);

-- Only admins can manage departments
CREATE POLICY "admin_departments_manage" ON departments
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.user_type = 'admin'
            AND up.is_active = true
        )
    );

-- ============================================================================
-- EMPLOYEE PROFILES POLICIES
-- ============================================================================

-- Users can read their own employee profile
CREATE POLICY "employee_profiles_read_own" ON employee_profiles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Users can update their own employee profile (limited fields)
CREATE POLICY "employee_profiles_update_own" ON employee_profiles
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

-- Managers can read profiles of their team members
CREATE POLICY "managers_read_team_profiles" ON employee_profiles
    FOR SELECT TO authenticated
    USING (
        manager_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.user_type IN ('admin', 'employee')
            AND up.is_active = true
        )
    );

-- Admins can manage all employee profiles
CREATE POLICY "admin_employee_profiles_all" ON employee_profiles
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.user_type = 'admin'
            AND up.is_active = true
        )
    );

-- ============================================================================
-- EMPLOYEE PERFORMANCE POLICIES
-- ============================================================================

-- Employees can read their own performance reviews
CREATE POLICY "performance_read_own" ON employee_performance
    FOR SELECT TO authenticated
    USING (
        employee_id = auth.uid()
        OR reviewed_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.user_type = 'admin'
            AND up.is_active = true
        )
    );

-- Managers and admins can create and manage performance reviews
CREATE POLICY "performance_manage_authorized" ON employee_performance
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.user_type IN ('admin', 'employee')
            AND up.is_active = true
        )
        AND (
            reviewed_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM employee_profiles ep
                WHERE ep.user_id = employee_id::uuid
                AND ep.manager_id = auth.uid()
            )
            OR EXISTS (
                SELECT 1 FROM user_profiles up
                WHERE up.id = auth.uid()
                AND up.user_type = 'admin'
            )
        )
    );

-- ============================================================================
-- REQUEST ASSIGNMENTS POLICIES
-- ============================================================================

-- Admin full access to request assignments
CREATE POLICY "admin_request_assignments_all" ON request_assignments
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.user_type = 'admin'
            AND up.is_active = true
        )
    );

-- Employees can see assignments they're involved with
CREATE POLICY "employee_request_assignments_involved" ON request_assignments
    FOR SELECT TO authenticated
    USING (
        (assigned_to = auth.uid() OR assigned_by = auth.uid())
        AND EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.user_type IN ('employee', 'admin')
            AND up.is_active = true
        )
    );

-- Employees can create assignments
CREATE POLICY "employee_request_assignments_create" ON request_assignments
    FOR INSERT TO authenticated
    WITH CHECK (
        assigned_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.user_type IN ('employee', 'admin')
            AND up.is_active = true
        )
    );

-- Employees can update assignments they created or are assigned to
CREATE POLICY "employee_request_assignments_update" ON request_assignments
    FOR UPDATE TO authenticated
    USING (
        (assigned_to = auth.uid() OR assigned_by = auth.uid())
        AND EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.user_type IN ('employee', 'admin')
            AND up.is_active = true
        )
    );

-- Customers can view assignments for their requests
CREATE POLICY "customer_request_assignments_own" ON request_assignments
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.user_type = 'customer'
            AND up.is_active = true
        )
        AND contact_request_id IN (
            SELECT cr.id FROM contact_requests cr
            WHERE cr.customer_user_id = auth.uid()
        )
    );