'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserStats } from './UserStats';
import { UserSearchAndFilter } from './UserSearchAndFilter';
import { UnifiedUserList } from './UnifiedUserList';
import {
  Shield,
  UserCheck,
  User,
  Users
} from 'lucide-react';
import {
  CompleteUserData,
  getUserStats,
  filterUsersByRole,
  filterUsersByStatus,
  filterUsersBySearch
} from '@/lib/user-utils';

interface EnhancedUsersPageContainerProps {
  users: CompleteUserData[];
}

type ViewMode = 'all' | 'admin' | 'employee' | 'customer';
type DisplayMode = 'cards' | 'table';

export function EnhancedUsersPageContainer({ users }: EnhancedUsersPageContainerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Optimized filtering with useMemo
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Apply viewMode filtering first (tabs handle role filtering)
    if (viewMode !== 'all') {
      filtered = filterUsersByRole(filtered, viewMode);
    }

    // Apply search and status filters
    if (searchTerm) {
      filtered = filterUsersBySearch(filtered, searchTerm);
    }

    if (statusFilter) {
      filtered = filterUsersByStatus(filtered, statusFilter);
    }

    return filtered;
  }, [users, viewMode, searchTerm, statusFilter]);

  // Calculate user stats with useMemo for performance
  const userStats = useMemo(() => getUserStats(users), [users]);

  const tabs = [
    {
      id: 'all' as ViewMode,
      label: 'Übersicht',
      icon: Users,
      count: users.length,
      description: 'Alle Benutzer im System'
    },
    {
      id: 'admin' as ViewMode,
      label: 'Administratoren',
      icon: Shield,
      count: userStats.adminUsers,
      description: 'System-Administratoren'
    },
    {
      id: 'employee' as ViewMode,
      label: 'Mitarbeiter',
      icon: UserCheck,
      count: userStats.employeeUsers,
      description: 'Interne Mitarbeiter'
    },
    {
      id: 'customer' as ViewMode,
      label: 'Kunden',
      icon: User,
      count: userStats.customerUsers,
      description: 'Externe Kunden'
    }
  ];

  const renderContent = () => {
    // For "all" view, show filters and display modes
    if (viewMode === 'all') {
      return (
        <UnifiedUserList
          users={filteredUsers}
          viewMode={viewMode}
          displayMode={displayMode}
        />
      );
    }

    // For role-specific views, show grouped views without filtering
    return (
      <UnifiedUserList
        users={users}
        viewMode={viewMode}
        showGrouping={true}
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* User Statistics - always visible */}
      <UserStats stats={userStats} />

      {/* Tab Navigation */}
      <Card className="modern-card border-0">
        <CardContent className="p-2 sm:p-1">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1 sm:gap-1">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = viewMode === tab.id;

              return (
                <Button
                  key={tab.id}
                  variant={isActive ? 'default' : 'ghost'}
                  onClick={() => setViewMode(tab.id)}
                  className={`flex items-center justify-center gap-1 sm:gap-2 h-16 sm:h-12 px-2 sm:px-4 flex-col sm:flex-row ${
                    isActive
                      ? 'mystery-gradient text-white shadow-lg'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <TabIcon className="w-4 h-4 sm:w-4 sm:h-4" />
                  <div className="flex flex-col sm:flex-row items-center gap-0 sm:gap-2">
                    <span className="font-medium text-xs sm:text-sm leading-tight">{tab.label}</span>
                    <Badge
                      variant={isActive ? 'secondary' : 'outline'}
                      className={`text-xs px-1 sm:ml-1 ${
                        isActive
                          ? 'bg-white/20 text-white border-white/30'
                          : 'bg-background/50'
                      }`}
                    >
                      {tab.count}
                    </Badge>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tab Description */}
      <div className="text-center">
        <p className="text-muted-foreground">
          {tabs.find(tab => tab.id === viewMode)?.description}
        </p>
      </div>

      {/* Filters and Controls - only for 'all' view */}
      {viewMode === 'all' && (
        <UserSearchAndFilter
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          displayMode={displayMode}
          totalUsers={users.length}
          filteredCount={filteredUsers.length}
          onSearchChange={setSearchTerm}
          onStatusChange={setStatusFilter}
          onDisplayModeChange={setDisplayMode}
        />
      )}

      {/* Content */}
      <div className="fade-in-up">
        {renderContent()}
      </div>
    </div>
  );
}