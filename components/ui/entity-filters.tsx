/**
 * 🎯 Unified Entity Filters Component
 *
 * Wiederverwendbare Filter-Komponente für konsistente
 * Such- und Filterfunktionen.
 */

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Filter, X, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilterOption {
  value: string
  label: string
  count?: number
}

interface EntityFiltersProps {
  // Search
  searchTerm: string
  onSearchChange: (term: string) => void
  searchPlaceholder?: string

  // Filters
  filters: Array<{
    key: string
    label: string
    value: string
    options: FilterOption[]
    onChange: (value: string) => void
  }>

  // Results info
  totalCount?: number
  filteredCount?: number
  resultLabel?: string

  // Actions
  onRefresh?: () => void
  onClearFilters?: () => void

  // Styling
  className?: string
  compact?: boolean
}

export function EntityFilters({
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Suchen...',
  filters,
  totalCount,
  filteredCount,
  resultLabel = 'Ergebnisse',
  onRefresh,
  onClearFilters,
  className,
  compact = false
}: EntityFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const hasActiveFilters = filters.some(f => f.value !== 'all') || searchTerm.length > 0
  const hasAdvancedFilters = filters.length > 1

  const handleClearFilters = () => {
    onSearchChange('')
    filters.forEach(filter => filter.onChange('all'))
    onClearFilters?.()
  }

  return (
    <Card className={cn('modern-card', className)}>
      <CardContent className={cn('p-4', compact && 'p-3')}>
        <div className="space-y-4">
          {/* Main Row */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 glass-effect border-white/20 bg-background/5"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => onSearchChange('')}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>

            {/* Primary Filter (meist Status) */}
            {filters.length > 0 && (
              <Select value={filters[0].value} onValueChange={filters[0].onChange}>
                <SelectTrigger className="w-full sm:w-48 glass-effect border-white/20 bg-background/5">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder={filters[0].label} />
                </SelectTrigger>
                <SelectContent>
                  {filters[0].options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{option.label}</span>
                        {option.count !== undefined && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({option.count})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Advanced Filters Toggle */}
            {hasAdvancedFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="whitespace-nowrap"
              >
                <Filter className="w-4 h-4 mr-2" />
                {showAdvanced ? 'Weniger' : 'Mehr'} Filter
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showAdvanced && hasAdvancedFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-white/10">
              {filters.slice(1).map((filter) => (
                <div key={filter.key}>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    {filter.label}
                  </label>
                  <Select value={filter.value} onValueChange={filter.onChange}>
                    <SelectTrigger className="glass-effect border-white/20 bg-background/5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {filter.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center justify-between w-full">
                            <span>{option.label}</span>
                            {option.count !== undefined && (
                              <span className="text-xs text-muted-foreground ml-2">
                                ({option.count})
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}

          {/* Results Info & Actions */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              {totalCount !== undefined && filteredCount !== undefined ? (
                <span>
                  {filteredCount === totalCount ? (
                    `${totalCount} ${resultLabel}`
                  ) : (
                    `${filteredCount} von ${totalCount} ${resultLabel}`
                  )}
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-8 px-2 text-xs"
                >
                  <X className="w-3 h-3 mr-1" />
                  Filter zurücksetzen
                </Button>
              )}
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRefresh}
                  className="h-8 px-2 text-xs"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Aktualisieren
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper für Filter-Options
export function createFilterOptions<T>(
  items: T[],
  getValue: (item: T) => string,
  getLabel: (value: string) => string,
  includeAll: boolean = true
): FilterOption[] {
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    const value = getValue(item)
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {})

  const options: FilterOption[] = []

  if (includeAll) {
    options.push({
      value: 'all',
      label: 'Alle',
      count: items.length
    })
  }

  (Object.entries(counts) as [string, number][]).forEach(([value, count]) => {
    options.push({
      value,
      label: getLabel(value),
      count
    })
  })

  return options
}
