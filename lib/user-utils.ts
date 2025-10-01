import {
  Shield,
  UserCheck,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  Building,
  Briefcase
} from 'lucide-react';

// Unified user interfaces
export interface UserProfile {
  first_name?: string;
  last_name?: string;
  phone?: string;
  user_type: string;
  avatar_url?: string;
  is_active?: boolean;
  last_seen_at?: string;
  timezone?: string;
  language?: string;
  notifications_enabled?: boolean;
}

export interface CustomerData {
  id: string;
  company_name?: string;
  contact_person?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  website?: string;
  industry?: string;
  created_at: string;
}

export interface EmployeeData {
  id: string;
  employee_id?: string;
  job_title?: string;
  hire_date?: string;
  direct_phone?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  working_hours_per_week?: number;
  time_zone?: string;
  skills?: string[];
  certifications?: string[];
  languages?: string[];
  performance_rating?: number;
  is_active?: boolean;
  department?: {
    id: string;
    name: string;
  };
  manager?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email: string;
  };
}

export interface CompleteUserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  profile?: UserProfile;
  customer?: CustomerData;
  employee?: EmployeeData;
}

// Role themes for consistent design
export const ROLE_THEMES = {
  admin: {
    color: 'red',
    icon: Shield,
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    text: 'text-red-400',
    accent: 'text-red-300',
    variant: 'destructive' as const,
    label: 'Administrator'
  },
  employee: {
    color: 'blue',
    icon: UserCheck,
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    accent: 'text-blue-300',
    variant: 'default' as const,
    label: 'Mitarbeiter'
  },
  customer: {
    color: 'purple',
    icon: User,
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    text: 'text-purple-400',
    accent: 'text-purple-300',
    variant: 'secondary' as const,
    label: 'Kunde'
  },
  unknown: {
    color: 'gray',
    icon: User,
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/20',
    text: 'text-gray-400',
    accent: 'text-gray-300',
    variant: 'outline' as const,
    label: 'Unbekannt'
  }
} as const;

export type UserType = keyof typeof ROLE_THEMES;

// Status themes for consistent badges
export const STATUS_THEMES = {
  active: {
    label: 'Aktiv',
    color: 'bg-green-500/20 text-green-300 border-green-500/30',
    icon: CheckCircle
  },
  inactive: {
    label: 'Inaktiv',
    color: 'bg-red-500/20 text-red-300 border-red-500/30',
    icon: AlertTriangle
  },
  pending: {
    label: 'Unbestätigt',
    color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    icon: Clock
  }
} as const;

// Shared utility functions
export const getUserDisplayName = (user: CompleteUserData | any): string => {
  // Handle nested profile structure
  if (user.profile?.first_name || user.profile?.last_name) {
    return `${user.profile.first_name || ''} ${user.profile.last_name || ''}`.trim();
  }
  // Handle flat structure (API response)
  if (user.first_name || user.last_name) {
    return `${user.first_name || ''} ${user.last_name || ''}`.trim();
  }
  if (user.customer?.contact_person) {
    return user.customer.contact_person;
  }
  return user.email || 'Unbekannter Benutzer';
};

export const getUserRoleInfo = (userType?: string) => {
  const type = (userType as UserType) || 'unknown';
  return ROLE_THEMES[type] || ROLE_THEMES.unknown;
};

export const getUserStatusInfo = (user: CompleteUserData | any) => {
  // Handle both nested profile structure and flat structure
  const isActive = user.profile?.is_active ?? user.is_active;

  // If we have email_confirmed_at info, use it
  if (user.email_confirmed_at !== undefined) {
    if (!user.email_confirmed_at) {
      return STATUS_THEMES.pending;
    }
  }

  // Otherwise just use is_active status
  if (isActive === false) {
    return STATUS_THEMES.inactive;
  }
  return STATUS_THEMES.active;
};

export const formatUserDate = (dateString?: string, includeTime = false): string => {
  if (!dateString) return 'Nie';

  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return new Date(dateString).toLocaleDateString('de-DE', options);
};

export const getLastLoginStatus = (lastLogin?: string) => {
  if (!lastLogin) {
    return {
      text: 'Nie angemeldet',
      color: 'text-red-400',
      icon: AlertTriangle
    };
  }

  const loginDate = new Date(lastLogin);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - loginDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return {
      text: 'Heute',
      color: 'text-green-400',
      icon: CheckCircle
    };
  }
  if (diffDays <= 7) {
    return {
      text: `Vor ${diffDays} ${diffDays === 1 ? 'Tag' : 'Tagen'}`,
      color: 'text-blue-400',
      icon: Clock
    };
  }
  if (diffDays <= 30) {
    return {
      text: `Vor ${diffDays} Tagen`,
      color: 'text-yellow-400',
      icon: Clock
    };
  }

  return {
    text: `Vor ${diffDays} Tagen`,
    color: 'text-red-400',
    icon: AlertTriangle
  };
};

export const getCustomerTier = (requestCount = 0, orderCount = 0, isRecentlyActive = false) => {
  const totalActivity = requestCount + orderCount;

  if (totalActivity >= 10 || (isRecentlyActive && totalActivity >= 5)) {
    return {
      level: 'Premium',
      color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      icon: Star
    };
  }
  if (totalActivity >= 3 || isRecentlyActive) {
    return {
      level: 'Standard',
      color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      icon: User
    };
  }

  return {
    level: 'Basic',
    color: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    icon: User
  };
};

export const getUserStats = (users: CompleteUserData[]) => {
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u =>
      u.profile?.is_active !== false && u.email_confirmed_at
    ).length,
    adminUsers: users.filter(u => u.profile?.user_type === 'admin').length,
    employeeUsers: users.filter(u => u.profile?.user_type === 'employee').length,
    customerUsers: users.filter(u => u.profile?.user_type === 'customer').length,
    unconfirmedUsers: users.filter(u => !u.email_confirmed_at).length,
    pendingApprovals: users.filter(u =>
      !u.email_confirmed_at || u.profile?.is_active === false
    ).length,
    lastLoginToday: users.filter(u =>
      u.last_sign_in_at &&
      new Date(u.last_sign_in_at).toDateString() === new Date().toDateString()
    ).length
  };

  return stats;
};

export const getUserAdditionalInfo = (user: CompleteUserData) => {
  const roleInfo = getUserRoleInfo(user.profile?.user_type);
  const statusInfo = getUserStatusInfo(user);
  const lastLoginInfo = getLastLoginStatus(user.last_sign_in_at);

  return {
    role: roleInfo,
    status: statusInfo,
    lastLogin: lastLoginInfo,
    displayName: getUserDisplayName(user),
    formattedCreatedAt: formatUserDate(user.created_at),
    formattedLastLogin: formatUserDate(user.last_sign_in_at, true)
  };
};

// Filter functions
export const filterUsersByRole = (users: CompleteUserData[], role: string) => {
  if (role === 'all' || !role) return users;
  return users.filter(user => user.profile?.user_type === role);
};

export const filterUsersByStatus = (users: CompleteUserData[], status: string) => {
  if (!status) return users;

  return users.filter(user => {
    switch (status) {
      case 'active':
        return user.profile?.is_active !== false && user.email_confirmed_at;
      case 'inactive':
        return user.profile?.is_active === false;
      case 'pending':
        return !user.email_confirmed_at;
      default:
        return true;
    }
  });
};

export const filterUsersBySearch = (users: CompleteUserData[], searchTerm: string) => {
  if (!searchTerm) return users;

  const term = searchTerm.toLowerCase();
  return users.filter(user =>
    user.email.toLowerCase().includes(term) ||
    getUserDisplayName(user).toLowerCase().includes(term) ||
    user.customer?.company_name?.toLowerCase().includes(term) ||
    user.employee?.job_title?.toLowerCase().includes(term) ||
    user.employee?.department?.name?.toLowerCase().includes(term)
  );
};