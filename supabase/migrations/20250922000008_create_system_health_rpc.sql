-- Create system health metrics RPC function
CREATE OR REPLACE FUNCTION get_system_health_metrics()
RETURNS JSON AS $$
DECLARE
    uptime_percentage DECIMAL;
    response_time_score DECIMAL;
    error_rate_score DECIMAL;
    active_sessions INTEGER;
    total_requests INTEGER;
    failed_requests INTEGER;
BEGIN
    -- Calculate basic health metrics
    -- This is a simplified version - in production you'd track real metrics

    -- Active user sessions in last hour
    SELECT COUNT(DISTINCT user_id) INTO active_sessions
    FROM user_activity_logs
    WHERE created_at > NOW() - INTERVAL '1 hour';

    -- Total and failed requests (using activity logs as proxy)
    SELECT COUNT(*) INTO total_requests
    FROM user_activity_logs
    WHERE created_at > NOW() - INTERVAL '24 hours';

    SELECT COUNT(*) INTO failed_requests
    FROM user_activity_logs
    WHERE created_at > NOW() - INTERVAL '24 hours'
    AND severity IN ('critical', 'error');

    -- Calculate scores (0-100)
    uptime_percentage := CASE
        WHEN total_requests = 0 THEN 100
        ELSE GREATEST(0, 100 - (failed_requests::DECIMAL / total_requests::DECIMAL * 100))
    END;

    response_time_score := CASE
        WHEN active_sessions > 100 THEN 85 -- High load
        WHEN active_sessions > 50 THEN 95  -- Medium load
        ELSE 99 -- Low load
    END;

    error_rate_score := CASE
        WHEN failed_requests = 0 THEN 100
        WHEN failed_requests < 5 THEN 95
        WHEN failed_requests < 20 THEN 85
        ELSE 70
    END;

    RETURN json_build_object(
        'uptime_percentage', uptime_percentage,
        'response_time_score', response_time_score,
        'error_rate_score', error_rate_score,
        'active_sessions', active_sessions,
        'total_requests', total_requests,
        'failed_requests', failed_requests,
        'calculated_at', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_system_health_metrics() TO authenticated;