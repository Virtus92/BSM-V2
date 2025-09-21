'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, Bot, Webhook, Database, Workflow, Bell } from "lucide-react";
import { CategoryFilter, StatusFilter, PerformanceFilter } from "@/lib/hooks/useAutomationWorkflows";

interface AutomationFiltersProps {
  searchTerm: string;
  categoryFilter: CategoryFilter;
  statusFilter: StatusFilter;
  performanceFilter: PerformanceFilter;
  totalWorkflows: number;
  filteredCount: number;
  onSearchChange: (search: string) => void;
  onCategoryChange: (category: CategoryFilter) => void;
  onStatusChange: (status: StatusFilter) => void;
  onPerformanceChange: (performance: PerformanceFilter) => void;
}

const categoryIcons = {
  ai_agent: Bot,
  webhook_service: Webhook,
  data_processor: Database,
  automation_pipeline: Workflow,
  notification_system: Bell
};

const categoryLabels = {
  ai_agent: 'AI Agents',
  webhook_service: 'API Services',
  data_processor: 'Data Processing',
  automation_pipeline: 'Automation',
  notification_system: 'Notifications'
};

export function AutomationFilters({
  searchTerm,
  categoryFilter,
  statusFilter,
  performanceFilter,
  totalWorkflows,
  filteredCount,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onPerformanceChange
}: AutomationFiltersProps) {
  const activeFiltersCount = [
    categoryFilter !== 'all',
    statusFilter !== 'all',
    performanceFilter !== 'all',
    searchTerm.length > 0
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    onSearchChange('');
    onCategoryChange('all');
    onStatusChange('all');
    onPerformanceChange('all');
  };

  return (
    <div className="space-y-4 fade-in-up">
      {/* Search and Filter Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Workflows durchsuchen..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Primary Status Chips */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <Button
            variant={statusFilter === 'active' ? 'default' : 'outline'}
            size="sm"
            className="whitespace-nowrap"
            onClick={() => onStatusChange('active')}
          >
            Aktiv
          </Button>
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            className="whitespace-nowrap"
            onClick={() => onStatusChange('all')}
          >
            Alle
          </Button>
          <Button
            variant={statusFilter === 'inactive' ? 'default' : 'outline'}
            size="sm"
            className="whitespace-nowrap"
            onClick={() => onStatusChange('inactive')}
          >
            Inaktiv
          </Button>
        </div>

        {/* Category Filter */}
        <Select value={categoryFilter} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full sm:w-48">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <SelectValue placeholder="Kategorie" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Kategorien</SelectItem>
            {Object.entries(categoryLabels).map(([value, label]) => {
              const Icon = categoryIcons[value as keyof typeof categoryIcons];
              return (
                <SelectItem key={value} value={value}>
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* Performance Filter */}
        <Select value={performanceFilter} onValueChange={onPerformanceChange}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Performance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Performance</SelectItem>
            <SelectItem value="excellent">Exzellent (≥95%)</SelectItem>
            <SelectItem value="good">Gut (80-94%)</SelectItem>
            <SelectItem value="poor">Verbesserungsbedarf (&lt;80%)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters and Results */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Results Count */}
          <span className="text-sm text-muted-foreground">
            {filteredCount === totalWorkflows
              ? `${totalWorkflows} Workflows`
              : `${filteredCount} von ${totalWorkflows} Workflows`
            }
          </span>

          {/* Active Filters */}
          {activeFiltersCount > 0 && (
            <>
              <span className="text-sm text-muted-foreground">•</span>
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount} Filter aktiv
              </Badge>
            </>
          )}

          {/* Individual Filter Badges */}
          {searchTerm && (
            <Badge variant="outline" className="text-xs">
              &quot;{searchTerm}&quot;
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                onClick={() => onSearchChange('')}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}

          {categoryFilter !== 'all' && (
            <Badge variant="outline" className="text-xs">
              <div className="flex items-center gap-1">
                {React.createElement(categoryIcons[categoryFilter], { className: "w-3 h-3" })}
                {categoryLabels[categoryFilter]}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                onClick={() => onCategoryChange('all')}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}

          {statusFilter !== 'all' && (
            <Badge variant="outline" className="text-xs">
              {statusFilter === 'active' ? 'Aktiv' : 'Inaktiv'}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                onClick={() => onStatusChange('all')}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}

          {performanceFilter !== 'all' && (
            <Badge variant="outline" className="text-xs">
              {performanceFilter === 'excellent' ? 'Exzellent' :
               performanceFilter === 'good' ? 'Gut' : 'Verbesserungsbedarf'}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                onClick={() => onPerformanceChange('all')}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}
        </div>

        {/* Clear All Filters */}
        {activeFiltersCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="w-full sm:w-auto"
          >
            <X className="w-4 h-4 mr-2" />
            Filter zurücksetzen
          </Button>
        )}
      </div>
    </div>
  );
}
