import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

// GET /api/admin/users - List all users
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

    // Get search parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';

    const admin = createAdminClient();

    // First get auth users
    const { data: authUsers, error: listUsersError } = await admin.auth.admin.listUsers();

    if (listUsersError) {
      logger.error('Failed to fetch auth users', listUsersError, {
        component: 'API',
        userId: user.id,
        metadata: { endpoint: '/api/admin/users', method: 'GET' }
      });
      return NextResponse.json({ error: 'Failed to fetch auth users' }, { status: 500 });
    }

    if (!authUsers?.users || authUsers.users.length === 0) {
      return NextResponse.json({
        users: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0
        }
      });
    }

    const userIds = authUsers.users.map(u => u.id);

    // Get user profiles and related data
    const [
      { data: userProfiles, error: profilesError },
      { data: customers, error: customersError },
      { data: employees, error: employeesError }
    ] = await Promise.all([
      admin.from('user_profiles').select('*').in('id', userIds),
      admin.from('customers').select('*').in('user_id', userIds),
      admin.from('employee_profiles').select(`
        id, user_id, employee_id, job_title, department_id,
        departments!employee_profiles_department_id_fkey (name)
      `).in('user_id', userIds)
    ]);

    if (profilesError) {
      logger.warn('Profiles fetch error', {
        component: 'API',
        userId: user.id,
        metadata: { endpoint: '/api/admin/users', method: 'GET', error: profilesError.message }
      });
    }
    if (customersError) {
      logger.warn('Customers fetch error', {
        component: 'API',
        userId: user.id,
        metadata: { endpoint: '/api/admin/users', method: 'GET', error: customersError.message }
      });
    }
    if (employeesError) {
      logger.warn('Employees fetch error', {
        component: 'API',
        userId: user.id,
        metadata: { endpoint: '/api/admin/users', method: 'GET', error: employeesError.message }
      });
    }

    // Merge all data together
    let completeUsers = authUsers.users.map(authUser => {
      const profile = userProfiles?.find(p => p.id === authUser.id);
      const customerData = customers?.find(c => c.user_id === authUser.id);
      const employeeData = employees?.find(e => e.user_id === authUser.id);

      return {
        id: authUser.id,
        email: authUser.email || '',
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        email_confirmed_at: authUser.email_confirmed_at,
        profile,
        customer: customerData,
        employee: employeeData
      };
    });

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      completeUsers = completeUsers.filter(user =>
        user.email.toLowerCase().includes(searchLower) ||
        user.profile?.first_name?.toLowerCase().includes(searchLower) ||
        user.profile?.last_name?.toLowerCase().includes(searchLower) ||
        user.customer?.company_name?.toLowerCase().includes(searchLower) ||
        user.employee?.job_title?.toLowerCase().includes(searchLower)
      );
    }

    if (role) {
      completeUsers = completeUsers.filter(user => user.profile?.user_type === role);
    }

    if (status === 'active') {
      completeUsers = completeUsers.filter(user =>
        user.profile?.is_active !== false && user.email_confirmed_at
      );
    } else if (status === 'inactive') {
      completeUsers = completeUsers.filter(user =>
        user.profile?.is_active === false || !user.email_confirmed_at
      );
    }

    // Apply pagination
    const total = completeUsers.length;
    const from = (page - 1) * limit;
    const to = from + limit;
    const paginatedUsers = completeUsers.slice(from, to);

    return NextResponse.json({
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Admin users GET error', error as Error, {
      component: 'API',
      metadata: { endpoint: '/api/admin/users', method: 'GET' }
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/users - Create new user
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
    const { email, password, user_type, first_name, last_name, is_active = true } = body;

    // Validate required fields
    if (!email || !password || !user_type) {
      return NextResponse.json({
        error: 'Missing required fields: email, password, user_type'
      }, { status: 400 });
    }

    // Validate user type
    if (!['admin', 'employee', 'customer'].includes(user_type)) {
      return NextResponse.json({
        error: 'Invalid user_type. Must be admin, employee, or customer'
      }, { status: 400 });
    }

    const admin = createAdminClient();

    // Create auth user
    const { data: authData, error: createUserError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        created_by: user.id
      }
    });

    if (createUserError) {
      logger.error('Auth user creation error', createUserError, {
        component: 'API',
        userId: user.id,
        metadata: { endpoint: '/api/admin/users', method: 'POST', email }
      });
      return NextResponse.json({
        error: `Failed to create user: ${createUserError.message}`
      }, { status: 400 });
    }

    // Create user profile (email is stored in auth, not in user_profiles)
    const { error: profileError } = await admin
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        user_type,
        first_name,
        last_name,
        is_active,
        activation_required: false,
        activated_at: new Date().toISOString()
      });

    if (profileError) {
      // Cleanup: delete auth user if profile creation fails
      await admin.auth.admin.deleteUser(authData.user.id);
      logger.error('Profile creation error', profileError, {
        component: 'API',
        userId: user.id,
        metadata: { endpoint: '/api/admin/users', method: 'POST', newUserId: authData.user.id, email }
      });
      return NextResponse.json({
        error: 'Failed to create user profile'
      }, { status: 500 });
    }

    // Log admin activity
    await admin.from('user_activity_logs').insert({
      user_id: user.id,
      action: 'USER_CREATED',
      resource_type: 'user',
      resource_id: authData.user.id,
      additional_context: {
        created_user_email: email,
        created_user_type: user_type
      },
      severity: 'low'
    });

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email,
        user_type,
        first_name,
        last_name,
        is_active
      }
    });

  } catch (error) {
    logger.error('Admin users POST error', error as Error, {
      component: 'API',
      metadata: { endpoint: '/api/admin/users', method: 'POST' }
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}