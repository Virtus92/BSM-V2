// Shared component library exports
export { PageLayout, ModernCard } from './PageLayout';
export type { QuickAction } from './PageLayout';

export { StatsCard } from './StatsCard';
export { DataTable } from './DataTable';
export type { Column, Action } from './DataTable';

export {
  StatusBadge,
  TaskStatusBadge,
  PriorityBadge,
  RequestStatusBadge,
  UserTypeBadge,
  taskStatusMap,
  priorityStatusMap,
  requestStatusMap,
  userTypeMap
} from './StatusBadge';

// Re-export commonly used UI components for consistency
export { Badge } from '@/components/ui/badge';
export { Button } from '@/components/ui/button';
export { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
export { Input } from '@/components/ui/input';
export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Utility exports
export { cn } from '@/lib/utils';
export { formatUserDate, getUserDisplayName } from '@/lib/user-utils';