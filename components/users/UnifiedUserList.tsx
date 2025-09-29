'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Eye,
  Mail,
  Phone,
  Building,
  Calendar,
  Briefcase,
  Users,
  Star,
  Globe,
  MapPin
} from 'lucide-react';
import Link from 'next/link';
import {
  CompleteUserData,
  getUserDisplayName,
  getUserRoleInfo,
  getUserStatusInfo,
  getLastLoginStatus,
  formatUserDate,
  getCustomerTier,
  ROLE_THEMES
} from '@/lib/user-utils';

interface UnifiedUserListProps {
  users: CompleteUserData[];
  viewMode: 'all' | 'admin' | 'employee' | 'customer';
  displayMode?: 'cards' | 'table';
  showGrouping?: boolean;
  maxItems?: number;
}

export function UnifiedUserList({
  users,
  viewMode,
  displayMode = 'cards',
  showGrouping = false,
  maxItems
}: UnifiedUserListProps) {
  const processedUsers = useMemo(() => {
    let filtered = users;

    // Filter by view mode
    if (viewMode !== 'all') {
      filtered = filtered.filter(user => user.profile?.user_type === viewMode);
    }

    // Limit if specified
    if (maxItems) {
      filtered = filtered.slice(0, maxItems);
    }

    // Add computed data
    return filtered.map(user => {
      const roleInfo = getUserRoleInfo(user.profile?.user_type);
      const statusInfo = getUserStatusInfo(user);
      const lastLoginInfo = getLastLoginStatus(user.last_sign_in_at);
      const displayName = getUserDisplayName(user);

      return {
        ...user,
        computed: {
          displayName,
          roleInfo,
          statusInfo,
          lastLoginInfo
        }
      };
    });
  }, [users, viewMode, maxItems]);

  // Group users for role-specific views
  const groupedUsers = useMemo(() => {
    if (!showGrouping || viewMode === 'all') {
      return { [viewMode]: processedUsers };
    }

    switch (viewMode) {
      case 'employee':
        return processedUsers.reduce((groups, user) => {
          const deptName = user.employee?.department?.name || 'Ohne Abteilung';
          if (!groups[deptName]) groups[deptName] = [];
          groups[deptName].push(user);
          return groups;
        }, {} as Record<string, typeof processedUsers>);

      case 'customer':
        return processedUsers.reduce((groups, user) => {
          const tier = getCustomerTier(0, 0, !!user.last_sign_in_at).level;
          const tierKey = `${tier}-Kunden`;
          if (!groups[tierKey]) groups[tierKey] = [];
          groups[tierKey].push(user);
          return groups;
        }, {} as Record<string, typeof processedUsers>);

      default:
        return { [viewMode]: processedUsers };
    }
  }, [processedUsers, showGrouping, viewMode]);

  if (processedUsers.length === 0) {
    const roleInfo = ROLE_THEMES[viewMode as keyof typeof ROLE_THEMES] || ROLE_THEMES.unknown;
    const RoleIcon = roleInfo.icon;

    return (
      <Card className="modern-card border-0">
        <CardContent className="text-center py-12">
          <div className={`mx-auto w-20 h-20 rounded-2xl ${roleInfo.bg} flex items-center justify-center mb-4`}>
            <RoleIcon className={`w-10 h-10 ${roleInfo.text}`} />
          </div>
          <CardTitle className="text-xl mb-2">
            Keine {roleInfo.label} gefunden
          </CardTitle>
          <CardDescription className="mb-6 max-w-md mx-auto">
            {viewMode === 'all'
              ? 'Es wurden keine Benutzer gefunden, die Ihren Suchkriterien entsprechen.'
              : `Es sind keine ${roleInfo.label}-Accounts im System vorhanden.`
            }
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  const renderUserCard = (user: typeof processedUsers[0]) => {
    const { computed } = user;
    const RoleIcon = computed.roleInfo.icon;
    const StatusIcon = computed.statusInfo.icon;
    const LastLoginIcon = computed.lastLoginInfo.icon;

    return (
      <div
        key={user.id}
        className={`group p-3 sm:p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] ${computed.roleInfo.border} ${computed.roleInfo.bg} hover:border-opacity-40`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <Link href={`/dashboard/users/${user.id}`} className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${computed.roleInfo.bg} flex items-center justify-center ring-2 ring-white/5`}>
              <RoleIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${computed.roleInfo.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={`font-semibold text-sm sm:text-base group-hover:${computed.roleInfo.accent} transition-colors line-clamp-1 mb-1`}>
                {computed.displayName}
              </h4>
              {/* Role-specific subtitle */}
              {user.customer?.company_name && (
                <p className="text-xs sm:text-sm text-muted-foreground truncate flex items-center gap-1">
                  <Building className="w-3 h-3" />
                  {user.customer.company_name}
                </p>
              )}
              {user.employee?.job_title && (
                <p className="text-xs sm:text-sm text-muted-foreground truncate flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  {user.employee.job_title}
                </p>
              )}
              {user.employee?.employee_id && (
                <p className="text-xs text-muted-foreground">ID: {user.employee.employee_id}</p>
              )}
            </div>
          </Link>
          <div className="flex flex-col gap-1">
            <Badge variant={computed.roleInfo.variant} className="text-xs">
              <RoleIcon className="w-3 h-3 mr-1" />
              {computed.roleInfo.label}
            </Badge>
            <Badge variant="outline" className={`${computed.statusInfo.color} text-xs`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {computed.statusInfo.label}
            </Badge>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="w-3 h-3" />
            <span className="truncate">{user.email}</span>
          </div>

          {(user.profile?.phone || user.customer?.phone) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-3 h-3" />
              <span>{user.profile?.phone || user.customer?.phone}</span>
            </div>
          )}

          {user.employee?.department?.name && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building className="w-3 h-3" />
              <span className="truncate">{user.employee.department.name}</span>
            </div>
          )}

          {user.customer?.website && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="w-3 h-3" />
              <a
                href={user.customer.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {user.customer.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div className={`flex items-center gap-2 text-xs ${computed.lastLoginInfo.color}`}>
            <LastLoginIcon className="w-3 h-3" />
            <span className="truncate">{computed.lastLoginInfo.text}</span>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/dashboard/users/${user.id}`}>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 hover:${computed.roleInfo.bg}`}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </Link>

            {/* Role-specific actions */}
            {user.customer && (
              <Link href={`/dashboard/crm?customer=${user.customer.id}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 hover:${computed.roleInfo.bg}`}
                >
                  <Building className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTableRow = (user: typeof processedUsers[0]) => {
    const { computed } = user;
    const RoleIcon = computed.roleInfo.icon;
    const StatusIcon = computed.statusInfo.icon;

    return (
      <tr key={user.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
        <td className="py-4 px-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${computed.roleInfo.bg} flex items-center justify-center`}>
              <RoleIcon className={`w-5 h-5 ${computed.roleInfo.text}`} />
            </div>
            <div>
              <div className="font-medium">{computed.displayName}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </div>
        </td>
        <td className="py-4 px-4">
          <Badge variant={computed.roleInfo.variant} className="text-xs">
            <RoleIcon className="w-3 h-3 mr-1" />
            {computed.roleInfo.label}
          </Badge>
        </td>
        <td className="py-4 px-4">
          <Badge variant="outline" className={`${computed.statusInfo.color} text-xs`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {computed.statusInfo.label}
          </Badge>
        </td>
        <td className="py-4 px-4 text-sm text-muted-foreground">
          {formatUserDate(user.created_at)}
        </td>
        <td className="py-4 px-4">
          <div className="space-y-1 text-sm text-muted-foreground">
            {(user.profile?.phone || user.customer?.phone) && (
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {user.profile?.phone || user.customer?.phone}
              </div>
            )}
            {(user.customer?.company_name || user.employee?.job_title) && (
              <div className="flex items-center gap-1">
                <Building className="w-3 h-3" />
                <span className="truncate max-w-32">
                  {user.customer?.company_name || user.employee?.job_title || ''}
                </span>
              </div>
            )}
          </div>
        </td>
        <td className="py-4 px-4 text-right">
          <Link href={`/dashboard/users/${user.id}`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
        </td>
      </tr>
    );
  };

  if (showGrouping && Object.keys(groupedUsers).length > 1) {
    const roleInfo = ROLE_THEMES[viewMode as keyof typeof ROLE_THEMES] || ROLE_THEMES.unknown;
    const RoleIcon = roleInfo.icon;

    return (
      <Card className="modern-card border-0">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${roleInfo.bg} flex items-center justify-center`}>
              <RoleIcon className={`w-5 h-5 ${roleInfo.text}`} />
            </div>
            <div>
              <CardTitle className={roleInfo.accent}>{roleInfo.label}</CardTitle>
              <CardDescription>
                {processedUsers.length} {roleInfo.label} in {Object.keys(groupedUsers).length} {Object.keys(groupedUsers).length === 1 ? 'Gruppe' : 'Gruppen'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {Object.entries(groupedUsers).map(([groupName, groupUsers]) => (
            <div key={groupName} className="space-y-4">
              <div className={`flex items-center gap-3 pb-2 border-b ${roleInfo.border}`}>
                <Building className={`w-5 h-5 ${roleInfo.text}`} />
                <h4 className={`font-semibold ${roleInfo.accent}`}>{groupName}</h4>
                <Badge variant="outline" className={`${roleInfo.bg} ${roleInfo.text} ${roleInfo.border}`}>
                  {groupUsers.length} {groupUsers.length === 1 ? 'Benutzer' : 'Benutzer'}
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {groupUsers.map(renderUserCard)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (displayMode === 'table') {
    return (
      <Card className="modern-card border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Benutzerliste</CardTitle>
                <CardDescription>
                  {processedUsers.length} {processedUsers.length === 1 ? 'Benutzer' : 'Benutzer'} gefunden
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Benutzer</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Rolle</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Erstellt</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Kontakt</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {processedUsers.map(renderTableRow)}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Cards view
  return (
    <Card className="modern-card border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Benutzerliste</CardTitle>
              <CardDescription>
                {processedUsers.length} {processedUsers.length === 1 ? 'Benutzer' : 'Benutzer'} gefunden
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {processedUsers.map(renderUserCard)}
        </div>
      </CardContent>
    </Card>
  );
}