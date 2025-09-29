import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/admin/users/[id] - Get user details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    const userId = id;
    const admin = createAdminClient();

    // Get user profile
    const { data: userProfile, error: profileError } = await admin
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get auth user data
    const { data: authUser, error: authUserError } = await admin.auth.admin.getUserById(userId);

    if (authUserError) {
      console.error('Auth user fetch error:', authUserError);
    }

    // Get customer data if user is customer
    let customerData = null;
    if (userProfile.user_type === 'customer') {
      const { data: customer } = await admin
        .from('customers')
        .select('*')
        .eq('user_id', userId)
        .single();
      customerData = customer;
    }

    // Get recent activity
    const { data: activities } = await admin
      .from('user_activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      user: {
        ...userProfile,
        auth_data: authUser?.user || null,
        customer_data: customerData,
        recent_activities: activities || []
      }
    });

  } catch (error) {
    console.error('Admin user GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/users/[id] - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    const userId = id;
    const body = await request.json();
    const {
      user_type,
      first_name,
      last_name,
      is_active,
      email,
      password,
      activation_required
    } = body;

    const admin = createAdminClient();

    // Check if user exists
    const { data: existingUser, error: userError } = await admin
      .from('user_profiles')
      .select('user_type, email')
      .eq('id', userId)
      .single();

    if (userError || !existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prepare profile update
    const profileUpdate: any = {};
    if (user_type && ['admin', 'employee', 'customer'].includes(user_type)) {
      profileUpdate.user_type = user_type;
    }
    if (first_name !== undefined) profileUpdate.first_name = first_name;
    if (last_name !== undefined) profileUpdate.last_name = last_name;
    if (is_active !== undefined) profileUpdate.is_active = is_active;
    if (email !== undefined) profileUpdate.email = email;
    if (activation_required !== undefined) {
      profileUpdate.activation_required = activation_required;
      if (!activation_required) {
        profileUpdate.activated_at = new Date().toISOString();
      }
    }

    // Update user profile
    if (Object.keys(profileUpdate).length > 0) {
      const { error: updateError } = await admin
        .from('user_profiles')
        .update(profileUpdate)
        .eq('id', userId);

      if (updateError) {
        console.error('Profile update error:', updateError);
        return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 });
      }
    }

    // Update auth user if email or password changed
    const authUpdate: any = {};
    if (email && email !== existingUser.email) {
      authUpdate.email = email;
    }
    if (password) {
      authUpdate.password = password;
    }

    if (Object.keys(authUpdate).length > 0) {
      const { error: authUpdateError } = await admin.auth.admin.updateUserById(userId, authUpdate);
      if (authUpdateError) {
        console.error('Auth update error:', authUpdateError);
        return NextResponse.json({ error: 'Failed to update auth data' }, { status: 500 });
      }
    }

    // Log admin activity
    await admin.from('user_activity_logs').insert({
      user_id: user.id,
      action: 'USER_UPDATED',
      resource_type: 'user',
      resource_id: userId,
      additional_context: {
        updated_fields: Object.keys({ ...profileUpdate, ...authUpdate }),
        target_user_email: email || existingUser.email
      },
      severity: 'low'
    });

    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Admin user PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    const userId = id;

    // Prevent self-deletion
    if (userId === user.id) {
      return NextResponse.json({
        error: 'Cannot delete your own account'
      }, { status: 400 });
    }

    const admin = createAdminClient();

    // Get user details for logging
    const { data: userToDelete } = await admin
      .from('user_profiles')
      .select('email, user_type')
      .eq('id', userId)
      .single();

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete from auth (this will cascade to profile due to foreign key)
    const { error: authDeleteError } = await admin.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error('Auth user deletion error:', authDeleteError);
      return NextResponse.json({
        error: 'Failed to delete user'
      }, { status: 500 });
    }

    // Log admin activity
    await admin.from('user_activity_logs').insert({
      user_id: user.id,
      action: 'USER_DELETED',
      resource_type: 'user',
      resource_id: userId,
      additional_context: {
        deleted_user_email: userToDelete.email,
        deleted_user_type: userToDelete.user_type
      },
      severity: 'medium'
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Admin user DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}