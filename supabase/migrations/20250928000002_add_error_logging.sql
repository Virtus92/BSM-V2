-- Add error logging system for Error Boundary
-- Migration: 20250928000002_add_error_logging.sql

-- Create error_logs table for client-side error tracking
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Error identification
    error_id VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Error details
    error_message TEXT NOT NULL,
    error_stack TEXT,
    component_stack TEXT,
    error_boundary VARCHAR(100),

    -- Context information
    url TEXT,
    user_agent TEXT,
    environment VARCHAR(20) DEFAULT 'production',
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),

    -- Additional metadata
    additional_context JSONB DEFAULT '{}'::jsonb,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolution_notes TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_environment ON error_logs(environment);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved_at ON error_logs(resolved_at);

-- Create RLS policies for error_logs
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Users can insert their own error logs
CREATE POLICY "Users can insert own error logs" ON error_logs
FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Admins can view all error logs
CREATE POLICY "Admins can view all error logs" ON error_logs
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND user_type = 'admin'
        AND is_active = true
    )
);

-- Admins can update error logs (for resolution)
CREATE POLICY "Admins can update error logs" ON error_logs
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND user_type = 'admin'
        AND is_active = true
    )
);

-- Create function to clean up old error logs (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM error_logs
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND severity IN ('low', 'medium');

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get error statistics
CREATE OR REPLACE FUNCTION get_error_statistics(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '7 days',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    total_errors BIGINT,
    critical_errors BIGINT,
    high_errors BIGINT,
    medium_errors BIGINT,
    low_errors BIGINT,
    resolved_errors BIGINT,
    unique_users BIGINT,
    most_common_error TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_errors,
        COUNT(*) FILTER (WHERE severity = 'critical') as critical_errors,
        COUNT(*) FILTER (WHERE severity = 'high') as high_errors,
        COUNT(*) FILTER (WHERE severity = 'medium') as medium_errors,
        COUNT(*) FILTER (WHERE severity = 'low') as low_errors,
        COUNT(*) FILTER (WHERE resolved_at IS NOT NULL) as resolved_errors,
        COUNT(DISTINCT user_id) as unique_users,
        (
            SELECT error_message
            FROM error_logs
            WHERE created_at BETWEEN start_date AND end_date
            GROUP BY error_message
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ) as most_common_error
    FROM error_logs
    WHERE created_at BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users for statistics function
GRANT EXECUTE ON FUNCTION get_error_statistics TO authenticated;

-- Create view for error summary (admins only)
CREATE OR REPLACE VIEW error_summary AS
SELECT
    DATE_TRUNC('day', created_at) as error_date,
    severity,
    COUNT(*) as error_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(*) FILTER (WHERE resolved_at IS NOT NULL) as resolved_count
FROM error_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), severity
ORDER BY error_date DESC, severity;

-- Grant access to error_summary view for admins
GRANT SELECT ON error_summary TO authenticated;

-- Create RLS policy for error_summary
ALTER VIEW error_summary SET (security_barrier = true);
CREATE POLICY "Admins can view error summary" ON error_logs
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND user_type = 'admin'
        AND is_active = true
    )
);

-- Add comment for documentation
COMMENT ON TABLE error_logs IS 'Client-side error logging for Error Boundary system';
COMMENT ON FUNCTION cleanup_old_error_logs() IS 'Automatically cleans up error logs older than 30 days (low/medium severity only)';
COMMENT ON FUNCTION get_error_statistics(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) IS 'Returns error statistics for a given date range';