'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MoreVertical, Settings, Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

export interface QuickAction {
  icon: any;
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive';
}

interface PageLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  subtitle?: string;
  backHref?: string;
  actions?: QuickAction[];
  rightContent?: ReactNode;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  searchValue?: string;
  showFilter?: boolean;
  onFilterClick?: () => void;
  metadata?: {
    count?: number;
    label?: string;
    status?: string;
  };
}

export function PageLayout({
  children,
  title,
  description,
  subtitle,
  backHref,
  actions = [],
  rightContent,
  showSearch = false,
  searchPlaceholder = "Suchen...",
  onSearchChange,
  searchValue = '',
  showFilter = false,
  onFilterClick,
  metadata
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header Section */}
        <div className="space-y-4">
          {/* Back Navigation */}
          {backHref && (
            <Link href={backHref}>
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurück
              </Button>
            </Link>
          )}

          {/* Title & Actions Row */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left: Title & Description */}
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-white">
                  {title}
                </h1>
                {metadata && (
                  <div className="flex items-center space-x-2">
                    {metadata.count !== undefined && (
                      <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                        {metadata.count} {metadata.label || 'Einträge'}
                      </Badge>
                    )}
                    {metadata.status && (
                      <Badge
                        variant="outline"
                        className="bg-green-500/10 text-green-400 border-green-500/20"
                      >
                        {metadata.status}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              {description && (
                <p className="text-lg text-white/70">
                  {description}
                </p>
              )}
              {subtitle && (
                <p className="text-sm text-white/50">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Right: Actions & Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search */}
              {showSearch && (
                <div className="relative min-w-[250px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20"
                  />
                </div>
              )}

              {/* Filter Button */}
              {showFilter && (
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

              {/* Quick Actions */}
              {actions.map((action, index) => {
                const ActionButton = (
                  <Button
                    key={index}
                    variant={action.variant || 'default'}
                    size="sm"
                    onClick={action.onClick}
                    className="flex items-center space-x-2"
                  >
                    <action.icon className="w-4 h-4" />
                    <span>{action.label}</span>
                  </Button>
                );

                return action.href ? (
                  <Link key={index} href={action.href}>
                    {ActionButton}
                  </Link>
                ) : (
                  ActionButton
                );
              })}

              {/* Additional Right Content */}
              {rightContent}

              {/* Settings Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
                  <DropdownMenuItem className="text-white hover:bg-gray-800">
                    <Settings className="w-4 h-4 mr-2" />
                    Einstellungen
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem className="text-white hover:bg-gray-800">
                    Ansicht anpassen
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-white hover:bg-gray-800">
                    Daten exportieren
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}

// Shared Card Component for consistent styling
interface ModernCardProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  gradient?: boolean;
}

export function ModernCard({
  children,
  title,
  description,
  actions,
  className = '',
  gradient = true
}: ModernCardProps) {
  return (
    <Card className={`${gradient ? 'modern-card border-0' : 'bg-white/5 border-white/10'} ${className}`}>
      {(title || description || actions) && (
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            {title && (
              <CardTitle className="text-white">{title}</CardTitle>
            )}
            {description && (
              <CardDescription className="text-white/70">{description}</CardDescription>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </CardHeader>
      )}
      <CardContent className="text-white">
        {children}
      </CardContent>
    </Card>
  );
}