'use client';

import { ReactNode, useState } from 'react';
import { ModernCard } from './PageLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, MoreVertical, ArrowUp, ArrowDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => ReactNode;
  className?: string;
}

export interface Action<T> {
  label: string;
  icon?: any;
  onClick: (item: T) => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  disabled?: (item: T) => boolean;
}

interface DataTableProps<T> {
  title: string;
  description?: string;
  data: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  isLoading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  filterable?: boolean;
  onFilterClick?: () => void;
  emptyState?: {
    title: string;
    description: string;
    icon?: any;
    action?: ReactNode;
  };
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  title,
  description,
  data,
  columns,
  actions = [],
  isLoading = false,
  searchable = false,
  searchPlaceholder = "Suchen...",
  filterable = false,
  onFilterClick,
  emptyState,
  className = ''
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Search functionality
  const filteredData = searchable ? data.filter(item =>
    Object.values(item).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) : data;

  // Sort functionality
  const sortedData = sortColumn
    ? [...filteredData].sort((a, b) => {
        const aValue = String(a[sortColumn] || '');
        const bValue = String(b[sortColumn] || '');
        const comparison = aValue.localeCompare(bValue, undefined, { numeric: true });
        return sortDirection === 'asc' ? comparison : -comparison;
      })
    : filteredData;

  const handleSort = (columnKey: string) => {
    if (!columns.find(col => col.key === columnKey)?.sortable) return;

    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const getValue = (item: T, key: string) => {
    return key.includes('.')
      ? key.split('.').reduce((obj, k) => obj?.[k], item)
      : item[key];
  };

  if (isLoading) {
    return (
      <ModernCard title={title} description="Daten werden geladen..." className={className}>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-4 bg-white/10 rounded flex-1 animate-pulse" />
              <div className="h-4 bg-white/10 rounded w-20 animate-pulse" />
              <div className="h-4 bg-white/10 rounded w-16 animate-pulse" />
            </div>
          ))}
        </div>
      </ModernCard>
    );
  }

  return (
    <ModernCard
      title={title}
      description={description}
      className={className}
      actions={
        <div className="flex items-center space-x-2">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64 bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
          )}
          {filterable && (
            <Button
              variant="outline"
              size="sm"
              onClick={onFilterClick}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          )}
        </div>
      }
    >
      {sortedData.length === 0 ? (
        emptyState ? (
          <div className="text-center py-8">
            {emptyState.icon && (
              <emptyState.icon className="w-12 h-12 text-white/50 mx-auto mb-4" />
            )}
            <h3 className="font-medium mb-2 text-white">{emptyState.title}</h3>
            <p className="text-sm text-white/70 mb-4">{emptyState.description}</p>
            {emptyState.action}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-white/70">Keine Daten verfügbar</p>
          </div>
        )
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={`text-left py-3 px-4 text-sm font-medium text-white/80 ${
                      column.sortable ? 'cursor-pointer hover:text-white' : ''
                    } ${column.className || ''}`}
                    onClick={() => column.sortable && handleSort(String(column.key))}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      {column.sortable && sortColumn === column.key && (
                        sortDirection === 'asc' ?
                          <ArrowUp className="w-4 h-4" /> :
                          <ArrowDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                ))}
                {actions.length > 0 && (
                  <th className="text-left py-3 px-4 text-sm font-medium text-white/80 w-20">
                    Aktionen
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item, index) => (
                <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  {columns.map((column) => (
                    <td key={String(column.key)} className={`py-3 px-4 text-sm text-white ${column.className || ''}`}>
                      {column.render
                        ? column.render(getValue(item, String(column.key)), item)
                        : String(getValue(item, String(column.key)) || '-')
                      }
                    </td>
                  ))}
                  {actions.length > 0 && (
                    <td className="py-3 px-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
                          {actions.map((action, actionIndex) => (
                            <DropdownMenuItem
                              key={actionIndex}
                              onClick={() => action.onClick(item)}
                              disabled={action.disabled?.(item)}
                              className="text-white hover:bg-gray-800"
                            >
                              {action.icon && <action.icon className="w-4 h-4 mr-2" />}
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ModernCard>
  );
}