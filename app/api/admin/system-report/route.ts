import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (!profile || profile.user_type !== 'admin') {
      return NextResponse.json({ error: 'Access denied - Admin only' }, { status: 403 });
    }

    const admin = createAdminClient();

    // Comprehensive system statistics
    const [
      userStats,
      taskStats,
      requestStats,
      customerStats,
      activityStats,
      performanceStats
    ] = await Promise.all([
      // User Statistics
      admin
        .from('user_profiles')
        .select('user_type, is_active, created_at'),

      // Task Statistics
      admin
        .from('tasks')
        .select('status, priority, created_at, completed_at'),

      // Request Statistics
      admin
        .from('contact_requests')
        .select('status, priority, created_at, updated_at'),

      // Customer Statistics
      admin
        .from('customers')
        .select('status, created_at, assigned_employee_id'),

      // Activity Statistics (last 30 days)
      admin
        .from('user_activity_logs')
        .select('action, severity, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),

      // Employee Performance
      admin
        .from('employee_profiles')
        .select('performance_score, department_id, is_active')
        .eq('is_active', true)
    ]);

    // Process statistics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // User Statistics
    const users = userStats.data || [];
    const userBreakdown = {
      total: users.length,
      admin: users.filter(u => u.user_type === 'admin').length,
      employee: users.filter(u => u.user_type === 'employee').length,
      customer: users.filter(u => u.user_type === 'customer').length,
      active: users.filter(u => u.is_active === true).length,
      inactive: users.filter(u => u.is_active === false).length,
      newThisMonth: users.filter(u => new Date(u.created_at) >= thirtyDaysAgo).length
    };

    // Task Statistics
    const tasks = taskStats.data || [];
    const taskBreakdown = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed' || t.status === 'done').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      pending: tasks.filter(t => t.status === 'todo' || t.status === 'pending').length,
      urgent: tasks.filter(t => t.priority === 'urgent').length,
      high: tasks.filter(t => t.priority === 'high').length,
      completedThisMonth: tasks.filter(t =>
        t.completed_at && new Date(t.completed_at) >= thirtyDaysAgo
      ).length
    };

    // Request Statistics
    const requests = requestStats.data || [];
    const requestBreakdown = {
      total: requests.length,
      new: requests.filter(r => r.status === 'new').length,
      inProgress: requests.filter(r => r.status === 'in_progress').length,
      responded: requests.filter(r => r.status === 'responded').length,
      converted: requests.filter(r => r.status === 'converted').length,
      archived: requests.filter(r => r.status === 'archived').length,
      urgent: requests.filter(r => r.priority === 'urgent').length,
      newThisMonth: requests.filter(r => new Date(r.created_at) >= thirtyDaysAgo).length
    };

    // Customer Statistics
    const customers = customerStats.data || [];
    const customerBreakdown = {
      total: customers.length,
      active: customers.filter(c => c.status === 'active').length,
      inactive: customers.filter(c => c.status === 'inactive').length,
      prospect: customers.filter(c => c.status === 'prospect').length,
      assigned: customers.filter(c => c.assigned_employee_id).length,
      unassigned: customers.filter(c => !c.assigned_employee_id).length,
      newThisMonth: customers.filter(c => new Date(c.created_at) >= thirtyDaysAgo).length
    };

    // Activity Statistics
    const activities = activityStats.data || [];
    const activityBreakdown = {
      total: activities.length,
      critical: activities.filter(a => a.severity === 'critical').length,
      high: activities.filter(a => a.severity === 'high').length,
      medium: activities.filter(a => a.severity === 'medium').length,
      low: activities.filter(a => a.severity === 'low').length,
      averagePerDay: Math.round(activities.length / 30)
    };

    // Performance Statistics
    const performance = performanceStats.data || [];
    const performanceBreakdown = {
      totalEmployees: performance.length,
      averageScore: performance.length > 0
        ? Math.round(performance.reduce((acc, emp) => acc + (emp.performance_score || 0), 0) / performance.length)
        : 0,
      highPerformers: performance.filter(emp => (emp.performance_score || 0) >= 80).length,
      lowPerformers: performance.filter(emp => (emp.performance_score || 0) < 60).length
    };

    // System Health Metrics
    const systemHealth = {
      userGrowthRate: userBreakdown.newThisMonth,
      taskCompletionRate: taskBreakdown.total > 0
        ? Math.round((taskBreakdown.completed / taskBreakdown.total) * 100)
        : 0,
      requestResponseRate: requestBreakdown.total > 0
        ? Math.round(((requestBreakdown.responded + requestBreakdown.converted) / requestBreakdown.total) * 100)
        : 0,
      customerSatisfaction: performanceBreakdown.averageScore,
      systemLoad: activityBreakdown.averagePerDay
    };

    const reportData = {
      generatedAt: now.toISOString(),
      reportPeriod: {
        from: thirtyDaysAgo.toISOString(),
        to: now.toISOString(),
        days: 30
      },
      summary: {
        totalUsers: userBreakdown.total,
        totalTasks: taskBreakdown.total,
        totalRequests: requestBreakdown.total,
        totalCustomers: customerBreakdown.total,
        averagePerformance: performanceBreakdown.averageScore
      },
      users: userBreakdown,
      tasks: taskBreakdown,
      requests: requestBreakdown,
      customers: customerBreakdown,
      activities: activityBreakdown,
      performance: performanceBreakdown,
      systemHealth
    };

    // Log report generation
    await admin.from('user_activity_logs').insert({
      user_id: user.id,
      action: 'SYSTEM_REPORT_GENERATED',
      resource_type: 'system',
      additional_context: {
        report_period_days: 30,
        total_users: userBreakdown.total,
        total_tasks: taskBreakdown.total,
        total_requests: requestBreakdown.total
      },
      severity: 'low'
    });

    return NextResponse.json({
      success: true,
      report: reportData
    });

  } catch (error) {
    console.error('System report generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (!profile || profile.user_type !== 'admin') {
      return NextResponse.json({ error: 'Access denied - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { format = 'json', period = 30 } = body;

    // Generate report with custom parameters
    const reportResponse = await GET(request);
    const reportData = await reportResponse.json();

    if (!reportData.success) {
      return reportResponse;
    }

    // Format-specific processing
    if (format === 'csv') {
      // Convert to CSV format
      const csvData = convertToCSV(reportData.report);
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="system-report-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    if (format === 'excel') {
      // For Excel, return structured data that frontend can convert
      return NextResponse.json({
        success: true,
        format: 'excel',
        filename: `system-report-${new Date().toISOString().split('T')[0]}.xlsx`,
        data: reportData.report
      });
    }

    return NextResponse.json(reportData);

  } catch (error) {
    console.error('System report generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function convertToCSV(reportData: any): string {
  const lines = [];

  // Header
  lines.push('BSM System Report');
  lines.push(`Generated: ${new Date(reportData.generatedAt).toLocaleString('de-DE')}`);
  lines.push(`Report Period: ${reportData.reportPeriod.days} days`);
  lines.push('');

  // Summary
  lines.push('SUMMARY');
  lines.push('Metric,Value');
  lines.push(`Total Users,${reportData.summary.totalUsers}`);
  lines.push(`Total Tasks,${reportData.summary.totalTasks}`);
  lines.push(`Total Requests,${reportData.summary.totalRequests}`);
  lines.push(`Total Customers,${reportData.summary.totalCustomers}`);
  lines.push(`Average Performance,${reportData.summary.averagePerformance}%`);
  lines.push('');

  // User Breakdown
  lines.push('USER BREAKDOWN');
  lines.push('Type,Count');
  lines.push(`Admin,${reportData.users.admin}`);
  lines.push(`Employee,${reportData.users.employee}`);
  lines.push(`Customer,${reportData.users.customer}`);
  lines.push(`Active,${reportData.users.active}`);
  lines.push(`Inactive,${reportData.users.inactive}`);
  lines.push('');

  // System Health
  lines.push('SYSTEM HEALTH');
  lines.push('Metric,Value');
  lines.push(`Task Completion Rate,${reportData.systemHealth.taskCompletionRate}%`);
  lines.push(`Request Response Rate,${reportData.systemHealth.requestResponseRate}%`);
  lines.push(`Customer Satisfaction,${reportData.systemHealth.customerSatisfaction}%`);
  lines.push(`Daily Activity Average,${reportData.systemHealth.systemLoad}`);

  return lines.join('\n');
}