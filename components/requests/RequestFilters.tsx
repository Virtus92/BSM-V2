'use client';

import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface RequestFiltersProps {
  searchTerm: string;
  statusFilter: string;
  priorityFilter: string;
  totalRequests: number;
  filteredCount: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
}

export function RequestFilters({
  searchTerm,
  statusFilter,
  priorityFilter,
  totalRequests,
  filteredCount,
  onSearchChange,
  onStatusChange,
  onPriorityChange
}: RequestFiltersProps) {
  return (
    <div className="modern-card p-4 sm:p-6 fade-in-up stagger-delay-2">
      <div className="flex flex-col lg:flex-row gap-3 md:gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 flex-1 w-full">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Nach Name, E-Mail oder Betreff suchen..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-10 focus-ring bg-background/50 border-white/[0.08]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full sm:w-[180px] h-10 px-3 rounded-md border border-white/[0.08] bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="all">Alle Status</option>
            <option value="new">Neu</option>
            <option value="in_progress">In Bearbeitung</option>
            <option value="responded">Beantwortet</option>
            <option value="converted">Konvertiert</option>
            <option value="archived">Archiviert</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="w-full sm:w-[180px] h-10 px-3 rounded-md border border-white/[0.08] bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="all">Alle Prioritäten</option>
            <option value="low">Niedrig</option>
            <option value="medium">Mittel</option>
            <option value="high">Hoch</option>
            <option value="critical">Kritisch</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{filteredCount} von {totalRequests} Anfragen</span>
        </div>
      </div>
    </div>
  );
}
