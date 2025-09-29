'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, LayoutGrid, List } from 'lucide-react';
import { CreateUserModal } from './CreateUserModal';

interface UserSearchAndFilterProps {
  searchTerm: string;
  statusFilter: string;
  displayMode: 'cards' | 'table';
  totalUsers: number;
  filteredCount: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onDisplayModeChange: (value: 'cards' | 'table') => void;
}

export function UserSearchAndFilter({
  searchTerm,
  statusFilter,
  displayMode,
  totalUsers,
  filteredCount,
  onSearchChange,
  onStatusChange,
  onDisplayModeChange
}: UserSearchAndFilterProps) {
  return (
    <div className="modern-card p-3 sm:p-4 lg:p-6 fade-in-up stagger-delay-2">
      <div className="space-y-3 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-4">
        {/* Main Controls Row */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs lg:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Suchen..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-9 sm:h-10 focus-ring bg-background/50 border-white/[0.08] text-sm"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full sm:w-[140px] lg:w-[160px] h-9 sm:h-10 px-3 rounded-md border border-white/[0.08] bg-background/50 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">Alle Status</option>
            <option value="active">Aktiv</option>
            <option value="inactive">Inaktiv</option>
            <option value="pending">Ausstehend</option>
          </select>
        </div>

        {/* Secondary Controls Row */}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          {/* Display Mode Toggle */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-background/50 border border-white/[0.08]">
            <Button
              variant={displayMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onDisplayModeChange('cards')}
              className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
            >
              <LayoutGrid className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Karten</span>
            </Button>
            <Button
              variant={displayMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onDisplayModeChange('table')}
              className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
            >
              <List className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Tabelle</span>
            </Button>
          </div>

          {/* Add User + Count */}
          <div className="flex items-center gap-2 sm:gap-3">
            <CreateUserModal />
            <div className="hidden sm:flex items-center gap-2 text-xs lg:text-sm text-muted-foreground">
              <span>{filteredCount} von {totalUsers}</span>
            </div>
          </div>
        </div>

        {/* Mobile Count */}
        <div className="sm:hidden text-center">
          <span className="text-xs text-muted-foreground">
            {filteredCount} von {totalUsers} Benutzern
          </span>
        </div>
      </div>
    </div>
  );
}