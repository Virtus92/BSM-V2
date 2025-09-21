'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';

interface CustomerFiltersProps {
  searchTerm: string;
  statusFilter: string;
  totalCustomers: number;
  filteredCount: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export function CustomerFilters({
  searchTerm,
  statusFilter,
  totalCustomers,
  filteredCount,
  onSearchChange,
  onStatusChange
}: CustomerFiltersProps) {
  return (
    <div className="modern-card p-4 sm:p-6 fade-in-up stagger-delay-2">
      <div className="flex flex-col lg:flex-row gap-3 md:gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 flex-1 w-full">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Kunden suchen..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-10 focus-ring bg-background/50 border-white/[0.08]"
            />
          </div>

          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="w-full sm:w-[180px] h-10 focus-ring bg-background/50 border-white/[0.08]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="active">Aktiv</SelectItem>
              <SelectItem value="prospect">Lead</SelectItem>
              <SelectItem value="inactive">Inaktiv</SelectItem>
              <SelectItem value="archived">Archiviert</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{filteredCount} von {totalCustomers} Kunden</span>
        </div>
      </div>
    </div>
  );
}
