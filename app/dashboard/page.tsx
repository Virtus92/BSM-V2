'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  FileText, 
  BarChart3, 
  Receipt,
  Briefcase,
  TrendingUp,
  Plus,
  ArrowRight,
  Activity,
  DollarSign,
  Target
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Kunden",
      value: "156",
      change: "+12%",
      icon: Users,
      color: "text-blue-500",
      href: "/dashboard/crm"
    },
    {
      title: "Aktive Projekte",
      value: "23",
      change: "+5%",
      icon: BarChart3,
      color: "text-green-500",
      href: "/dashboard/projects"
    },
    {
      title: "Offene Angebote",
      value: "8",
      change: "+2%",
      icon: Receipt,
      color: "text-yellow-500",
      href: "/dashboard/quotes"
    },
    {
      title: "Verträge",
      value: "42",
      change: "+18%",
      icon: Briefcase,
      color: "text-purple-500",
      href: "/dashboard/contracts"
    }
  ];

  const recentActivities = [
    {
      title: "Neuer Kunde: Mustermann GmbH",
      description: "Kunde wurde zum CRM hinzugefügt",
      time: "vor 2 Stunden",
      icon: Users,
      color: "text-blue-500"
    },
    {
      title: "Projekt 'Website Relaunch' abgeschlossen",
      description: "Status auf 'Abgeschlossen' geändert",
      time: "vor 4 Stunden",
      icon: BarChart3,
      color: "text-green-500"
    },
    {
      title: "Angebot #2024-001 versendet",
      description: "An Max Mustermann gesendet",
      time: "vor 1 Tag",
      icon: Receipt,
      color: "text-yellow-500"
    },
    {
      title: "Vertrag unterzeichnet",
      description: "Service-Vertrag mit ABC Corp",
      time: "vor 2 Tagen",
      icon: Briefcase,
      color: "text-purple-500"
    }
  ];

  const quickActions = [
    {
      title: "Neuer Kunde",
      description: "Kunde zum CRM hinzufügen",
      icon: Users,
      href: "/dashboard/crm?action=new",
      color: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20"
    },
    {
      title: "Projekt erstellen",
      description: "Neues Projekt anlegen",
      icon: BarChart3,
      href: "/dashboard/projects?action=new",
      color: "bg-green-500/10 hover:bg-green-500/20 border-green-500/20"
    },
    {
      title: "Angebot schreiben",
      description: "Neues Angebot erstellen",
      icon: Receipt,
      href: "/dashboard/quotes?action=new",
      color: "bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/20"
    },
    {
      title: "Dokument hochladen",
      description: "Datei zum Hub hinzufügen",
      icon: FileText,
      href: "/dashboard/documents?action=upload",
      color: "bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="fade-in-up">
        <h1 className="text-3xl font-bold mb-2">
          Willkommen im <span className="text-mystery-gradient">Dashboard</span>
        </h1>
        <p className="text-muted-foreground">
          Hier ist Ihre Business-Übersicht für heute.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="glass-effect border-0 hover:shadow-mystery transition-all duration-300 group fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-green-500 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {stat.change}
                </span>
                <span className="text-xs text-muted-foreground">vs letzter Monat</span>
              </div>
              <Link href={stat.href}>
                <Button variant="ghost" size="sm" className="w-full mt-3 group-hover:bg-primary/10 transition-all">
                  Details ansehen
                  <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions & Recent Activities */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <Card className="glass-effect border-0 fade-in-up" style={{ animationDelay: '0.5s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Schnellaktionen
            </CardTitle>
            <CardDescription>
              Häufig verwendete Aktionen für Ihren Workflow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start h-auto p-4 ${action.color} transition-all duration-300 group`}
                >
                  <action.icon className="mr-3 w-5 h-5 group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-sm text-muted-foreground">{action.description}</div>
                  </div>
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="glass-effect border-0 fade-in-up" style={{ animationDelay: '0.6s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Letzte Aktivitäten
            </CardTitle>
            <CardDescription>
              Ihre neuesten Aktionen im System
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-4 p-3 rounded-lg hover:bg-primary/5 transition-all duration-200">
                  <div className="p-2 rounded-lg bg-background border border-white/10">
                    <activity.icon className={`w-4 h-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{activity.title}</div>
                    <div className="text-xs text-muted-foreground">{activity.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card className="glass-effect border-0 fade-in-up" style={{ animationDelay: '0.7s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Performance Übersicht
          </CardTitle>
          <CardDescription>
            Ihre wichtigsten KPIs auf einen Blick
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
              <DollarSign className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-blue-500 mb-1">€45,200</div>
              <div className="text-sm text-muted-foreground">Monatsumsatz</div>
            </div>
            <div className="text-center p-6 rounded-lg bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/20">
              <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-green-500 mb-1">+23%</div>
              <div className="text-sm text-muted-foreground">Wachstum</div>
            </div>
            <div className="text-center p-6 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <Target className="w-8 h-8 text-purple-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-purple-500 mb-1">92%</div>
              <div className="text-sm text-muted-foreground">Zielerreichung</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}