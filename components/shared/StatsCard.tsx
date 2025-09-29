'use client';

import { ReactNode } from 'react';
import { ModernCard } from './PageLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface StatsCardProps {
  title: string;
  description: string;
  count: number;
  subtitle?: string;
  icon: LucideIcon;
  href?: string;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'yellow';
  gradient?: boolean;
  isLoading?: boolean;
  actions?: ReactNode;
}

const colorMap = {
  blue: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    border: 'border-blue-500/20'
  },
  green: {
    bg: 'bg-green-500/10',
    text: 'text-green-500',
    border: 'border-green-500/20'
  },
  orange: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-500',
    border: 'border-orange-500/20'
  },
  purple: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-500',
    border: 'border-purple-500/20'
  },
  red: {
    bg: 'bg-red-500/10',
    text: 'text-red-500',
    border: 'border-red-500/20'
  },
  yellow: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-500',
    border: 'border-yellow-500/20'
  }
};

export function StatsCard({
  title,
  description,
  count,
  subtitle,
  icon: Icon,
  href,
  color = 'blue',
  gradient = true,
  isLoading = false,
  actions
}: StatsCardProps) {
  const colors = colorMap[color];

  if (isLoading) {
    return (
      <ModernCard gradient={gradient}>
        <div className="flex items-center justify-between space-y-0 pb-2">
          <div className="text-sm font-medium text-white/70">Laden...</div>
          <div className={`p-2 rounded-lg ${colors.bg}`}>
            <Icon className={`w-4 h-4 ${colors.text} animate-pulse`} />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-8 w-16 bg-white/10 rounded animate-pulse" />
          <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
          <div className="h-6 w-full bg-white/5 rounded animate-pulse" />
        </div>
      </ModernCard>
    );
  }

  const CardContent = (
    <>
      <div className="flex items-center justify-between space-y-0 pb-2">
        <div className="text-sm font-medium text-white">{title}</div>
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          <Icon className={`w-4 h-4 ${colors.text}`} />
        </div>
      </div>
      <div className="space-y-3">
        <div className="text-2xl font-bold text-white">{count.toLocaleString()}</div>
        {subtitle && (
          <p className="text-xs text-white/50">{subtitle}</p>
        )}
        <p className="text-sm text-white/70">{description}</p>
        {actions || (href && (
          <Link href={href}>
            <Button variant="outline" size="sm" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20">
              Anzeigen
            </Button>
          </Link>
        ))}
      </div>
    </>
  );

  return (
    <ModernCard gradient={gradient} className="hover:shadow-lg transition-shadow">
      {CardContent}
    </ModernCard>
  );
}