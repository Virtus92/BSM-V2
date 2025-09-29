import { createClient } from '@supabase/supabase-js';

// Admin client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase admin credentials');
}

export const createAdminClient = () => {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Helper function to check if user has admin privileges
export async function requireAdminUser(userId: string) {
  const adminClient = createAdminClient();

  const { data: profile, error } = await adminClient
    .from('user_profiles')
    .select('user_type, is_active')
    .eq('id', userId)
    .single();

  if (error || !profile?.is_active || profile?.user_type !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }

  return profile;
}

// Admin-specific user operations
export const adminUserOperations = {
  async listAllUsers() {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient.auth.admin.listUsers();

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return data;
  },

  async getUserById(userId: string) {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient.auth.admin.getUserById(userId);

    if (error) {
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    return data;
  },

  async updateUserEmail(userId: string, email: string) {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient.auth.admin.updateUserById(userId, { email });

    if (error) {
      throw new Error(`Failed to update user email: ${error.message}`);
    }

    return data;
  },

  async deleteUser(userId: string) {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient.auth.admin.deleteUser(userId);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }

    return data;
  },

  async inviteUser(email: string, data?: object) {
    const adminClient = createAdminClient();
    const { data: result, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data,
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    });

    if (error) {
      throw new Error(`Failed to invite user: ${error.message}`);
    }

    return result;
  },

  async resetUserPassword(userId: string) {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: '', // This will be fetched from user record
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`
      }
    });

    if (error) {
      throw new Error(`Failed to generate password reset: ${error.message}`);
    }

    return data;
  },

  async createUser(userData: {
    email: string;
    password: string;
    email_confirm?: boolean;
    user_metadata?: object;
  }) {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: userData.email_confirm,
      user_metadata: userData.user_metadata
    });

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return data;
  }
};