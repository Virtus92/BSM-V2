'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Webhook,
  Database,
  Workflow,
  Bell,
  Play,
  Eye,
  MessageSquare,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import { WorkflowInsight } from '@/lib/services/workflow-analyzer';
import { getExecutiveStatus } from '@/lib/services/executive-view-model';

interface AutomationListProps {
  workflows: WorkflowInsight[];
  onWorkflowClick: (workflow: WorkflowInsight) => void;
  onWorkflowExecute: (workflow: WorkflowInsight) => void;
  onAIChat: (workflow: WorkflowInsight) => void;
  executing: string[];
}

const categoryConfig = {
  ai_agent: {
    icon: Bot,
    label: 'AI Agent',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    gradient: 'from-purple-500/20 to-purple-600/10'
  },
  webhook_service: {
    icon: Webhook,
    label: 'API Service',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    gradient: 'from-blue-500/20 to-blue-600/10'
  },
  data_processor: {
    icon: Database,
    label: 'Data Processing',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    gradient: 'from-green-500/20 to-green-600/10'
  },
  automation_pipeline: {
    icon: Workflow,
    label: 'Automation',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    gradient: 'from-orange-500/20 to-orange-600/10'
  },
  notification_system: {
    icon: Bell,
    label: 'Notifications',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    gradient: 'from-red-500/20 to-red-600/10'
  }
};

// Removed unused function

export function AutomationList({
  workflows,
  onWorkflowClick,
  onWorkflowExecute,
  onAIChat,
  executing
}: AutomationListProps) {
  if (workflows.length === 0) {
    return (
      <Card className="modern-card">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Workflow className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keine Workflows gefunden</h3>
            <p className="text-muted-foreground">
              Versuchen Sie andere Suchbegriffe oder Filter.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 fade-in-up">
      {workflows.map((workflow, index) => {
        const config = categoryConfig[workflow.category];
        const Icon = config.icon;
        const isExecuting = executing.includes(workflow.workflow.id);

        // Calculate performance metrics
        const successRate = workflow.executionHistory.total > 0
          ? Math.round((workflow.executionHistory.successful / workflow.executionHistory.total) * 100)
          : 0;

        const needsAttention = successRate < 80 && workflow.executionHistory.total > 0;

        // Performance color
        const performanceColor =
          successRate >= 95 ? 'text-green-500' :
          successRate >= 80 ? 'text-yellow-500' :
          'text-red-500';

        return (
          <Card
            key={workflow.workflow.id}
            className={`modern-card hover:shadow-lg transition-all duration-200 cursor-pointer border ${config.borderColor}`}
            style={{ animationDelay: `${index * 50}ms` }}
            onClick={() => onWorkflowClick(workflow)}
          >
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${config.color}`} />
                    </div>
                    <div className="flex-1">
                      {/* Title and Status */}
                      <div className="mb-2">
                        <h3 className="font-semibold text-lg">🔴 TEST {workflow.workflow.name}</h3>
                        {/* Status badges directly under agent name */}
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge variant={workflow.workflow.active ? "default" : "secondary"}>
                            {workflow.workflow.active ? 'Aktiv' : 'Inaktiv'}
                          </Badge>
                          {/* Executive status derived from real executions */}
                          {(() => {
                            const s = getExecutiveStatus(workflow)
                            const toneClass = s.tone === 'good' ? 'text-green-600 border-green-600'
                              : s.tone === 'bad' ? 'text-red-600 border-red-600'
                              : s.tone === 'warn' ? 'text-yellow-600 border-yellow-600'
                              : 'text-blue-600 border-blue-600'
                            return (
                              <Badge variant="outline" className={`text-xs ${toneClass}`}>
                                {s.label}{s.details ? ` • ${s.details}` : ''}
                              </Badge>
                            )
                          })()}
                          {needsAttention && (
                            <Badge variant="outline" className="text-red-500 border-red-500">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Aufmerksamkeit erforderlich
                            </Badge>
                          )}
                          {/* Trigger badges */}
                          {Array.isArray((workflow as any).triggers) && (
                            <>
                              {(workflow as any).triggers.some((t: any) => t.type === 'chat') && (
                                <Badge variant="outline" className="text-xs">Chat</Badge>
                              )}
                              {(workflow as any).triggers.some((t: any) => t.type === 'webhook') && (
                                <Badge variant="outline" className="text-xs">Webhook</Badge>
                              )}
                              {(workflow as any).triggers.some((t: any) => t.type === 'telegram') && (
                                <Badge variant="outline" className="text-xs">Telegram</Badge>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-2">
                        {workflow.businessMetrics.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <Badge variant="outline" className="text-xs">
                          {config.label}
                        </Badge>
                        {workflow.executionHistory.lastExecution && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>Zuletzt: {workflow.executionHistory.lastExecution.toLocaleString('de-DE')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
                    {workflow.businessMetrics.kpis.slice(0, 4).map((kpi, index) => (
                      <div key={index} className="text-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                        <p className="text-lg font-bold">{kpi.value}</p>
                        <p className="text-xs text-muted-foreground">{kpi.label}</p>
                        {kpi.trend && (
                          <div className={`flex items-center justify-center gap-1 mt-1 ${
                            kpi.trend === 'up' ? 'text-green-500' :
                            kpi.trend === 'down' ? 'text-red-500' :
                            'text-muted-foreground'
                          }`}>
                            <TrendingUp className={`w-3 h-3 ${kpi.trend === 'down' ? 'rotate-180' : ''}`} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Execution Stats */}
                  <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    {/* Mobile: optimized spacing and breathing room */}
                    <div className="space-y-4 md:hidden">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm font-medium">{workflow.executionHistory.successful} erfolgreich</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                          <span className="text-sm font-medium">{workflow.executionHistory.failed} fehlgeschlagen</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                        <div className="flex items-center gap-3">
                          <Activity className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          <span className="text-sm font-medium">{workflow.executionHistory.total} gesamt</span>
                        </div>
                        <span className={`text-sm font-semibold ${performanceColor}`}>
                          {successRate}% Erfolgsrate
                        </span>
                      </div>
                    </div>

                    {/* Desktop: inline */}
                    <div className="hidden md:flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm">
                            <span className="font-semibold text-green-500">{workflow.executionHistory.successful}</span>
                            <span className="text-muted-foreground"> erfolgreich</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm">
                            <span className="font-semibold text-red-500">{workflow.executionHistory.failed}</span>
                            <span className="text-muted-foreground"> fehlgeschlagen</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-blue-500" />
                          <span className="text-sm">
                            <span className="font-semibold text-blue-500">{workflow.executionHistory.total}</span>
                            <span className="text-muted-foreground"> gesamt</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${performanceColor}`}>
                          {successRate}% Erfolgsrate
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex md:flex-col flex-col gap-3 md:ml-4 mt-6 md:mt-0 w-full md:w-auto">
                  {/* Context-aware primary action */}
                  {(((workflow as any).triggers && (workflow as any).triggers.some((t: any) => t.type === 'chat')) ||
                    (workflow.category === 'ai_agent' && workflow.capabilities.hasAIComponents)) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAIChat(workflow);
                      }}
                      className="gap-2 w-full md:w-auto"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Chat
                    </Button>
                  )}

                  {/* Execute button (only if triggerable) */}
                  {(workflow.capabilities.hasWebhookTrigger || workflow.capabilities.canExecuteManually || workflow.capabilities.hasAIComponents) && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onWorkflowExecute(workflow);
                      }}
                      disabled={isExecuting || !workflow.workflow.active}
                      className="mystery-button gap-2 w-full md:w-auto"
                    >
                      {isExecuting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Ausführen...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Ausführen
                        </>
                      )}
                    </Button>
                  )}

                  {/* Details button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onWorkflowClick(workflow);
                    }}
                    className="w-full md:w-auto"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
