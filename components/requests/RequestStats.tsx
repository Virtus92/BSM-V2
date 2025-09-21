'use client';

import { MessageSquare, Clock, UserPlus } from 'lucide-react';
import { ContactRequestStats } from '@/lib/shared-types';
import { formatPercentage } from '@/lib/utils/formatters';

interface RequestStatsProps {
  stats: ContactRequestStats;
}

export function RequestStats({ stats }: RequestStatsProps) {
  const statItems = [
    {
      label: "Gesamt Anfragen",
      value: stats.total.toString(),
      icon: MessageSquare,
      color: "blue",
      bgColor: "bg-blue-500/10",
      textColor: "text-blue-500",
      hoverColor: "group-hover:bg-blue-500/20"
    },
    {
      label: "Neue Anfragen",
      value: stats.new.toString(),
      icon: Clock,
      color: "green",
      bgColor: "bg-green-500/10",
      textColor: "text-green-500",
      hoverColor: "group-hover:bg-green-500/20"
    },
    {
      label: "In Bearbeitung",
      value: stats.inProgress.toString(),
      icon: Clock,
      color: "yellow",
      bgColor: "bg-yellow-500/10",
      textColor: "text-yellow-500",
      hoverColor: "group-hover:bg-yellow-500/20"
    },
    {
      label: "Konvertiert",
      value: stats.converted.toString(),
      description: `${formatPercentage(stats.conversionRate)} Conversion Rate`,
      icon: UserPlus,
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
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
