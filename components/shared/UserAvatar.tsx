'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { User, Shield, UserCheck, Briefcase, Building } from 'lucide-react';

// Import utilities
import {
  getUserDisplayName,
  getUserRoleInfo,
  getUserStatusInfo,
  getAssigneeInitials,
  getAssigneeColor,
  formatAssigneeName
} from '@/lib/user-utils';

import type { CompleteUserData, TaskAssignee } from '@/lib/user-utils';
import type { AssigneeOption } from '@/lib/assignment-utils';

// ============================================================================
// TYPES
// ============================================================================

export interface UserAvatarProps {
  user?: CompleteUserData | TaskAssignee | AssigneeOption | null;
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'xl';
  showStatus?: boolean;
  showRole?: boolean;
  showName?: boolean;
  showEmail?: boolean;
  showInitials?: boolean;
  layout?: 'horizontal' | 'vertical';
  className?: string;
  fallbackIcon?: React.ComponentType<{ className?: string }>;
  onClick?: (user: CompleteUserData | TaskAssignee | AssigneeOption) => void;
}

// ============================================================================
// SIZE CONFIGURATIONS
// ============================================================================

const sizeConfig = {
  xs: {
    avatar: 'w-6 h-6',
    text: 'text-xs',
    badge: 'text-xs h-4 px-1',
    initials: 'text-xs'
  },
  sm: {
    avatar: 'w-8 h-8',
    text: 'text-sm',
    badge: 'text-xs h-5 px-2',
    initials: 'text-xs'
  },
  default: {
    avatar: 'w-10 h-10',
    text: 'text-sm',
    badge: 'text-xs h-5 px-2',
    initials: 'text-sm'
  },
  lg: {
    avatar: 'w-12 h-12',
    text: 'text-base',
    badge: 'text-sm h-6 px-3',
    initials: 'text-base'
  },
  xl: {
    avatar: 'w-16 h-16',
    text: 'text-lg',
    badge: 'text-sm h-7 px-3',
    initials: 'text-lg'
  }
};

// ============================================================================
// USER AVATAR COMPONENT
// ============================================================================

export function UserAvatar({
  user,
  size = 'default',
  showStatus = false,
  showRole = false,
  showName = false,
  showEmail = false,
  showInitials = true,
  layout = 'horizontal',
  className,
  fallbackIcon: FallbackIcon = User,
  onClick
}: UserAvatarProps) {
  const config = sizeConfig[size];

  // Handle empty user case
  if (!user) {
    return (
      <div className={cn(
        'flex items-center gap-2',
        layout === 'vertical' && 'flex-col text-center',
        className
      )}>
        <Avatar className={config.avatar}>
          <AvatarFallback className="bg-gray-500/10">
            <FallbackIcon className={cn(
              'text-gray-400',
              size === 'xs' && 'w-3 h-3',
              size === 'sm' && 'w-4 h-4',
              size === 'default' && 'w-5 h-5',
              size === 'lg' && 'w-6 h-6',
              size === 'xl' && 'w-8 h-8'
            )} />
          </AvatarFallback>
        </Avatar>
        {showName && (
          <span className={cn(config.text, 'text-gray-500')}>
            Nicht zugewiesen
          </span>
        )}
      </div>
    );
  }

  // Get user information
  const displayName = 'name' in user
    ? user.name || formatAssigneeName(user)
    : getUserDisplayName(user);

  const initials = 'name' in user
    ? getAssigneeInitials(user)
    : getUserDisplayName(user)
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

  const email = user.email || '';
  const avatarUrl = 'avatar_url' in user ? user.avatar_url : undefined;

  // Get role information
  let roleInfo;
  if ('user_type' in user && user.user_type) {
    roleInfo = getUserRoleInfo(user.user_type);
  } else if ('profile' in user && user.profile?.user_type) {
    roleInfo = getUserRoleInfo(user.profile.user_type);
  }

  // Get status information for CompleteUserData
  let statusInfo;
  if ('profile' in user && 'email_confirmed_at' in user) {
    statusInfo = getUserStatusInfo(user);
  }

  // Get background color for avatar
  const bgColor = 'user_type' in user
    ? getAssigneeColor(user)
    : roleInfo?.bg || 'bg-gray-500';

  const handleClick = () => {
    if (onClick && user) {
      onClick(user);
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        layout === 'vertical' && 'flex-col text-center',
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
      onClick={handleClick}
    >
      {/* Avatar */}
      <div className="relative">
        <Avatar className={config.avatar}>
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback className={cn(
            bgColor,
            'text-white font-medium',
            config.initials
          )}>
            {showInitials ? initials : (
              <FallbackIcon className={cn(
                'text-white',
                size === 'xs' && 'w-3 h-3',
                size === 'sm' && 'w-4 h-4',
                size === 'default' && 'w-5 h-5',
                size === 'lg' && 'w-6 h-6',
                size === 'xl' && 'w-8 h-8'
              )} />
            )}
          </AvatarFallback>
        </Avatar>

        {/* Status indicator (small dot) */}
        {showStatus && statusInfo && (
          <div className={cn(
            'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white',
            statusInfo.label === 'Aktiv' && 'bg-green-500',
            statusInfo.label === 'Inaktiv' && 'bg-red-500',
            statusInfo.label === 'Unbestätigt' && 'bg-yellow-500'
          )} />
        )}
      </div>

      {/* Text content */}
      {(showName || showEmail || showRole) && (
        <div className={cn(
          'flex flex-col',
          layout === 'horizontal' && 'items-start',
          layout === 'vertical' && 'items-center'
        )}>
          {/* Name */}
          {showName && (
            <div className={cn(config.text, 'font-medium text-foreground')}>
              {displayName}
            </div>
          )}

          {/* Email */}
          {showEmail && email && (
            <div className={cn(
              config.text,
              'text-muted-foreground',
              size === 'xs' && 'text-xs'
            )}>
              {email}
            </div>
          )}

          {/* Role and Status Badges */}
          {(showRole || showStatus) && (
            <div className={cn(
              'flex gap-1 mt-1',
              layout === 'vertical' && 'justify-center'
            )}>
              {showRole && roleInfo && (
                <Badge
                  variant={roleInfo.variant}
                  className={cn(
                    roleInfo.bg,
                    roleInfo.text,
                    roleInfo.border,
                    config.badge
                  )}
                >
                  <roleInfo.icon className="w-3 h-3 mr-1" />
                  {roleInfo.label}
                </Badge>
              )}

              {showStatus && statusInfo && (
                <Badge
                  variant="outline"
                  className={cn(statusInfo.color, config.badge)}
                >
                  <statusInfo.icon className="w-3 h-3 mr-1" />
                  {statusInfo.label}
                </Badge>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SPECIALIZED USER AVATAR COMPONENTS
// ============================================================================

export function CompactUserAvatar({
  user,
  size = 'sm',
  className
}: Pick<UserAvatarProps, 'user' | 'size' | 'className'>) {
  return (
    <UserAvatar
      user={user}
      size={size}
      showName={true}
      showInitials={true}
      layout="horizontal"
      className={className}
    />
  );
}

export function DetailedUserAvatar({
  user,
  size = 'default',
  className,
  onClick
}: Pick<UserAvatarProps, 'user' | 'size' | 'className' | 'onClick'>) {
  return (
    <UserAvatar
      user={user}
      size={size}
      showName={true}
      showEmail={true}
      showRole={true}
      showStatus={true}
      showInitials={true}
      layout="horizontal"
      className={className}
      onClick={onClick}
    />
  );
}

export function UserAvatarCard({
  user,
  size = 'lg',
  className,
  onClick
}: Pick<UserAvatarProps, 'user' | 'size' | 'className' | 'onClick'>) {
  return (
    <div className={cn(
      'p-4 rounded-lg border bg-card hover:bg-accent transition-colors',
      onClick && 'cursor-pointer',
      className
    )}>
      <UserAvatar
        user={user}
        size={size}
        showName={true}
        showEmail={true}
        showRole={true}
        showStatus={true}
        showInitials={true}
        layout="vertical"
        onClick={onClick}
      />
    </div>
  );
}

// ============================================================================
// USER LIST COMPONENT
// ============================================================================

export interface UserListProps {
  users: (CompleteUserData | TaskAssignee | AssigneeOption)[];
  size?: 'xs' | 'sm' | 'default' | 'lg';
  maxDisplay?: number;
  showOverflow?: boolean;
  layout?: 'horizontal' | 'vertical' | 'grid';
  className?: string;
  onUserClick?: (user: CompleteUserData | TaskAssignee | AssigneeOption) => void;
}

export function UserList({
  users,
  size = 'sm',
  maxDisplay = 5,
  showOverflow = true,
  layout = 'horizontal',
  className,
  onUserClick
}: UserListProps) {
  const displayUsers = users.slice(0, maxDisplay);
  const overflowCount = users.length - maxDisplay;

  const containerClasses = cn(
    'flex gap-2',
    layout === 'vertical' && 'flex-col',
    layout === 'grid' && 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    className
  );

  return (
    <div className={containerClasses}>
      {displayUsers.map((user, index) => (
        <CompactUserAvatar
          key={user.id || index}
          user={user}
          size={size}
          onClick={onUserClick}
        />
      ))}

      {showOverflow && overflowCount > 0 && (
        <div className={cn(
          'flex items-center justify-center rounded-full bg-muted text-muted-foreground',
          sizeConfig[size].avatar,
          sizeConfig[size].text
        )}>
          +{overflowCount}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ASSIGNMENT DISPLAY COMPONENT
// ============================================================================

export interface AssignmentDisplayProps {
  assignee?: TaskAssignee | AssigneeOption | null;
  size?: 'xs' | 'sm' | 'default' | 'lg';
  showName?: boolean;
  showUnassigned?: boolean;
  className?: string;
  onAssigneeClick?: (assignee: TaskAssignee | AssigneeOption) => void;
}

export function AssignmentDisplay({
  assignee,
  size = 'sm',
  showName = true,
  showUnassigned = true,
  className,
  onAssigneeClick
}: AssignmentDisplayProps) {
  if (!assignee && !showUnassigned) {
    return null;
  }

  return (
    <UserAvatar
      user={assignee}
      size={size}
      showName={showName}
      showInitials={true}
      layout="horizontal"
      className={className}
      onClick={onAssigneeClick}
      fallbackIcon={User}
    />
  );
}