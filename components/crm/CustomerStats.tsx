'use client';

import { Users, Target, TrendingUp, Euro } from 'lucide-react';
import { CustomerStats as CustomerStatsType } from '@/lib/shared-types';
import { formatCurrency } from '@/lib/utils/formatters';

interface CustomerStatsProps {
  stats: CustomerStatsType;
}

export function CustomerStats({ stats }: CustomerStatsProps) {
  const statItems = [
    {
      label: "Gesamt Kunden",
      value: stats.total.toString(),
      icon: Users,
      color: "blue",
      bgColor: "bg-blue-500/10",
      textColor: "text-blue-500",
      hoverColor: "group-hover:bg-blue-500/20"
    },
    {
      label: "Aktive Kunden",
      value: stats.active.toString(),
      icon: Target,
      color: "green",
      bgColor: "bg-green-500/10",
      textColor: "text-green-500",
      hoverColor: "group-hover:bg-green-500/20"
    },
    {
      label: "Leads",
      value: stats.lead.toString(),
      icon: TrendingUp,
      color: "yellow",
      bgColor: "bg-yellow-500/10",
      textColor: "text-yellow-500",
      hoverColor: "group-hover:bg-yellow-500/20"
    },
    {
      label: "Gesamtumsatz",
      value: formatCurrency(stats.totalRevenue),
      icon: Euro,
      color: "purple",
      bgColor: "bg-purple-500/10",
      textColor: "text-purple-500",
      hoverColor: "group-hover:bg-purple-500/20"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 fade-in-up stagger-delay-1">
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="modern-card p-4 sm:p-6 group">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${item.bgColor} flex items-center justify-center ${item.hoverColor} transition-colors`}>
                <Icon className={`w-6 h-6 ${item.textColor}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                <p className={`text-3xl font-bold ${item.color === 'blue' ? '' : item.textColor}`}>
                  {item.value}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
