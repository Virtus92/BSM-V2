'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Workflow,
  Activity,
  Zap,
  TrendingUp,
  CheckCircle,
  BarChart3,
  Bot,
  Webhook,
  Database,
  Bell
} from "lucide-react";
import { AutomationStats as StatsType } from "@/lib/hooks/useAutomationWorkflows";

interface AutomationStatsProps {
  stats: StatsType;
}

export function AutomationStats({ stats }: AutomationStatsProps) {
  const {
    totalWorkflows,
    activeWorkflows,
    totalExecutions,
    successfulExecutions,
    avgSuccessRate,
    categoryCounts,
    liveSystems
  } = stats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 fade-in-up">
      {/* Total Workflows */}
      <Card className="modern-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Workflows Gesamt
          </CardTitle>
          <Workflow className="w-4 h-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-1">{totalWorkflows}</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-green-500 flex items-center gap-1">
              <Activity className="w-3 h-3" />
              {activeWorkflows} aktiv
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Successful Executions */}
      <Card className="modern-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Erfolgreiche Ausführungen
          </CardTitle>
          <CheckCircle className="w-4 h-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-1 text-green-500">
            {successfulExecutions.toLocaleString()}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              von {totalExecutions.toLocaleString()} gesamt
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Average Success Rate */}
      <Card className="modern-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Ø Erfolgsrate
          </CardTitle>
          <BarChart3 className="w-4 h-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-1">{avgSuccessRate}%</div>
          <div className="flex items-center gap-2">
            <span className={`text-xs flex items-center gap-1 ${
              avgSuccessRate >= 95 ? 'text-green-500' :
              avgSuccessRate >= 80 ? 'text-yellow-500' :
              'text-red-500'
            }`}>
              <TrendingUp className="w-3 h-3" />
              {avgSuccessRate >= 95 ? 'Exzellent' :
               avgSuccessRate >= 80 ? 'Gut' : 'Verbesserungsbedarf'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Live Systems */}
      <Card className="modern-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Live Systeme
          </CardTitle>
          <Zap className="w-4 h-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-1 text-orange-500">{liveSystems}</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Produktive Systeme
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card className="modern-card md:col-span-2 xl:col-span-4">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Workflow-Kategorien
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* AI Agents */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <Bot className="w-6 h-6 text-purple-500" />
              <div>
                <p className="font-semibold text-purple-500">
                  {categoryCounts.ai_agent || 0}
                </p>
                <p className="text-xs text-muted-foreground">AI Agents</p>
              </div>
            </div>

            {/* API Services */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Webhook className="w-6 h-6 text-blue-500" />
              <div>
                <p className="font-semibold text-blue-500">
                  {categoryCounts.webhook_service || 0}
                </p>
                <p className="text-xs text-muted-foreground">API Services</p>
              </div>
            </div>

            {/* Data Processing */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <Database className="w-6 h-6 text-green-500" />
              <div>
                <p className="font-semibold text-green-500">
                  {categoryCounts.data_processor || 0}
                </p>
                <p className="text-xs text-muted-foreground">Data Processing</p>
              </div>
            </div>

            {/* Automation */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <Workflow className="w-6 h-6 text-orange-500" />
              <div>
                <p className="font-semibold text-orange-500">
                  {categoryCounts.automation_pipeline || 0}
                </p>
                <p className="text-xs text-muted-foreground">Automation</p>
              </div>
            </div>

            {/* Notifications */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <Bell className="w-6 h-6 text-red-500" />
              <div>
                <p className="font-semibold text-red-500">
                  {categoryCounts.notification_system || 0}
                </p>
                <p className="text-xs text-muted-foreground">Notifications</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}