'use client';

import { Users, Shield, UserCheck, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface UserStatsData {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  employeeUsers: number;
  customerUsers: number;
  unconfirmedUsers: number;
  pendingApprovals: number;
  lastLoginToday: number;
}

interface UserStatsProps {
  stats: UserStatsData;
}

export function UserStats({ stats }: UserStatsProps) {
  const statItems = [
    {
      label: "Gesamt Benutzer",
      value: stats.totalUsers.toString(),
      icon: Users,
      color: "blue",
      bgColor: "bg-blue-500/10",
      textColor: "text-blue-500",
      hoverColor: "group-hover:bg-blue-500/20"
    },
    {
      label: "Aktive Benutzer",
      value: stats.activeUsers.toString(),
      description: `${Math.round((stats.activeUsers / stats.totalUsers) * 100)}% der Benutzer`,
      icon: CheckCircle,
      color: "green",
      bgColor: "bg-green-500/10",
      textColor: "text-green-500",
      hoverColor: "group-hover:bg-green-500/20"
    },
    {
      label: "Administratoren",
      value: stats.adminUsers.toString(),
      icon: Shield,
      color: "red",
      bgColor: "bg-red-500/10",
      textColor: "text-red-500",
      hoverColor: "group-hover:bg-red-500/20"
    },
    {
      label: "Mitarbeiter",
      value: stats.employeeUsers.toString(),
      icon: UserCheck,
      color: "purple",
      bgColor: "bg-purple-500/10",
      textColor: "text-purple-500",
      hoverColor: "group-hover:bg-purple-500/20"
    },
    {
      label: "Kunden",
      value: stats.customerUsers.toString(),
      icon: Users,
      color: "blue",
      bgColor: "bg-blue-500/10",
      textColor: "text-blue-500",
      hoverColor: "group-hover:bg-blue-500/20"
    },
    {
      label: "Unbestätigt",
      value: stats.unconfirmedUsers.toString(),
      description: stats.unconfirmedUsers > 0 ? "Benötigen E-Mail-Bestätigung" : "Alle bestätigt",
      icon: AlertTriangle,
      color: "yellow",
      bgColor: "bg-yellow-500/10",
      textColor: "text-yellow-500",
      hoverColor: "group-hover:bg-yellow-500/20"
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4 md:gap-6 fade-in-up stagger-delay-1">
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="modern-card p-4 sm:p-6 group">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${item.bgColor} flex items-center justify-center ${item.hoverColor} transition-colors`}>
                <Icon className={`w-6 h-6 ${item.textColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground truncate">{item.label}</p>
                <p className={`text-2xl lg:text-3xl font-bold ${item.color === 'blue' && item.label === 'Gesamt Benutzer' ? 'text-foreground' : item.textColor}`}>
                  {item.value}
                </p>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-1 truncate" title={item.description}>
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}