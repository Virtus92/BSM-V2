'use client';

import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, ChevronDown, RefreshCw } from "lucide-react";
import { WorkflowInsight } from '@/lib/services/workflow-analyzer';
import { ExecutionResult } from '@/lib/services/execution-controller';
import { AutomationStats } from "@/components/automation/AutomationStats";
import { AutomationFilters } from "@/components/automation/AutomationFilters";
import { DigitalEmployeeList } from "@/components/automation/digital-employee-list";
import { ProcessList } from "@/components/automation/process-list";
import { DigitalEmployeeModal } from "@/components/automation/DigitalEmployeeModal";
import { ProcessModal } from "@/components/automation/ProcessModal";
import { AIAgentChatModal } from "@/components/automation/AIAgentChatModal";
import { ExecutionResultModal } from "@/components/automation/ExecutionResultModal";
import { useAutomationWorkflows } from "@/lib/hooks/useAutomationWorkflows";
import { classifyView } from "@/lib/services/executive-view-model";

export default function AutomationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const {
    workflows,
    filteredWorkflows,
    stats,
    loading,
    error,
    executing,
    searchTerm,
    categoryFilter,
    statusFilter,
    performanceFilter,
    setSearchTerm,
    setCategoryFilter,
    setStatusFilter,
    setPerformanceFilter,
    executeWorkflow,
    refetch
  } = useAutomationWorkflows();

  // Modal states - separate for Digital Employees and Processes
  const [digitalEmployeeModal, setDigitalEmployeeModal] = useState<WorkflowInsight | null>(null);
  const [processModal, setProcessModal] = useState<WorkflowInsight | null>(null);
  const [aiChatWorkflow, setAiChatWorkflow] = useState<WorkflowInsight | null>(null);
  const [aiChatInitialMessage, setAiChatInitialMessage] = useState<string>('');
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);

  // Handle URL params for deep linking
  useEffect(() => {
    const workflowId = searchParams.get('workflow');
    const action = searchParams.get('action');

    if (workflowId && workflows.length > 0) {
      const workflow = workflows.find(w => w.workflow.id === workflowId);
      if (workflow) {
        if (action === 'chat') {
          setAiChatWorkflow(workflow);
        } else {
          // Route to appropriate modal based on workflow type
          const view = classifyView(workflow, (workflow as any).triggers);
          if (view === 'digital_employee') {
            setDigitalEmployeeModal(workflow);
          } else {
            setProcessModal(workflow);
          }
        }
        // Clean URL
        router.replace('/dashboard/automation');
      }
    }
  }, [searchParams, workflows, router]);

  const handleWorkflowExecute = async (workflow: WorkflowInsight, payload?: unknown) => {
    // Choose a sensible default trigger for generic execution
    const hasChat = Array.isArray((workflow as any).triggers) && (workflow as any).triggers.some((t: any) => t.type === 'chat')
    const hasWebhook = Array.isArray((workflow as any).triggers) && (workflow as any).triggers.some((t: any) => t.type === 'webhook')
    const hasManual = Array.isArray((workflow as any).triggers) && (workflow as any).triggers.some((t: any) => t.type === 'manual')

    const triggerType: 'chat' | 'webhook' | 'manual' = hasWebhook ? 'webhook' : hasManual ? 'manual' : hasChat ? 'chat' : 'webhook'

    const result = await executeWorkflow(
      workflow.workflow.id,
      'test',
      payload,
      { triggerType }
    );

    if (result.success) {
      setExecutionResult(result);
      toast({
        title: "Workflow ausgeführt",
        description: `${workflow.workflow.name} wurde erfolgreich gestartet.`,
      });
    } else {
      toast({
        title: "Ausführung fehlgeschlagen",
        description: result.error || "Unbekannter Fehler",
        variant: "destructive",
      });
    }
  };

  const handleWorkflowOpen = (workflow: WorkflowInsight) => {
    // Route to appropriate modal based on workflow type
    const view = classifyView(workflow, (workflow as any).triggers);
    if (view === 'digital_employee') {
      setDigitalEmployeeModal(workflow);
    } else {
      setProcessModal(workflow);
    }
  };

  const handleAIChat = (workflow: WorkflowInsight) => {
    const triggers = (workflow as any).triggers as Array<{ type: string }> | undefined
    const hasChatTrigger = Array.isArray(triggers) && triggers.some(t => t.type === 'chat')
    if (hasChatTrigger) setAiChatWorkflow(workflow)
  };

  const handleDigitalEmployeeChat = async (employee: WorkflowInsight, message: string) => {
    // Don't close the digital employee modal here - let the chat modal manage its own state
    // setDigitalEmployeeModal(null);

    // Start AI chat with the message
    setAiChatInitialMessage(message);
    setAiChatWorkflow(employee);
  };

  const handleRefresh = async () => {
    await refetch();
    toast({
      title: "Aktualisiert",
      description: "Workflow-Daten wurden erfolgreich aktualisiert.",
    });
  };

  // Persist filters to URL and localStorage
  useEffect(() => {
    // Initialize from URL/localStorage on first mount
    const s = searchParams.get('status') as typeof statusFilter | null
    const c = searchParams.get('category') as typeof categoryFilter | null
    const p = searchParams.get('perf') as typeof performanceFilter | null
    const q = searchParams.get('q')

    const ls = (key: string) => (typeof window !== 'undefined' ? localStorage.getItem(key) : null)

    if (s) setStatusFilter(s)
    else if (ls('automation.status')) setStatusFilter(ls('automation.status') as any)

    if (c) setCategoryFilter(c)
    else if (ls('automation.category')) setCategoryFilter(ls('automation.category') as any)

    if (p) setPerformanceFilter(p)
    else if (ls('automation.perf')) setPerformanceFilter(ls('automation.perf') as any)

    if (q) setSearchTerm(q)
    else if (ls('automation.q')) setSearchTerm(ls('automation.q') || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Write to URL and localStorage on filter change
    const params = new URLSearchParams()
    if (statusFilter && statusFilter !== 'active') params.set('status', statusFilter)
    if (categoryFilter && categoryFilter !== 'all') params.set('category', categoryFilter)
    if (performanceFilter && performanceFilter !== 'all') params.set('perf', performanceFilter)
    if (searchTerm) params.set('q', searchTerm)
    const qs = params.toString()
    const url = qs ? `/dashboard/automation?${qs}` : '/dashboard/automation'
    router.replace(url)

    if (typeof window !== 'undefined') {
      localStorage.setItem('automation.status', statusFilter)
      localStorage.setItem('automation.category', categoryFilter)
      localStorage.setItem('automation.perf', performanceFilter)
      localStorage.setItem('automation.q', searchTerm)
    }
  }, [statusFilter, categoryFilter, performanceFilter, searchTerm, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Lade Automation Hub...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-3">
              <span className="text-mystery-gradient">Automation Hub</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Intelligente Geschäftsprozess-Automatisierung mit N8N Integration
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={loading}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="modern-card border-red-500/20 bg-red-500/5 fade-in-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="font-medium text-red-500">Verbindungsfehler</p>
              <p className="text-sm text-red-500/80">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards - desktop above filters */}
      <div className="hidden md:block">
        <AutomationStats stats={stats} />
      </div>

      {/* Statistics Cards - mobile collapsible above filters */}
      <div className="md:hidden">
        <details className="modern-card no-marker">
          <summary className="flex items-center justify-between cursor-pointer select-none bg-transparent">
            <span className="font-semibold">Live Statistiken</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </summary>
          <div className="mt-4">
            <AutomationStats stats={stats} />
          </div>
        </details>
      </div>

      {/* Search and Filter Controls */}
      <AutomationFilters
        searchTerm={searchTerm}
        categoryFilter={categoryFilter}
        statusFilter={statusFilter}
        performanceFilter={performanceFilter}
        totalWorkflows={workflows.length}
        filteredCount={filteredWorkflows.length}
        onSearchChange={setSearchTerm}
        onCategoryChange={setCategoryFilter}
        onStatusChange={setStatusFilter}
        onPerformanceChange={setPerformanceFilter}
      />

      {/* Workflow List grouped by mental model */}
      {(() => {
        const employees = filteredWorkflows.filter(w => classifyView(w) === 'digital_employee')
        const processes = filteredWorkflows.filter(w => classifyView(w) === 'process')
        return (
          <div className="space-y-10">
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Digitale Mitarbeiter</h2>
              <DigitalEmployeeList
                items={employees}
                executing={executing}
                onOpen={handleWorkflowOpen}
                onChat={handleAIChat}
                onExecute={(w) => handleWorkflowExecute(w)}
              />
            </div>
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Prozessautomatisierung</h2>
              <ProcessList
                items={processes}
                executing={executing}
                onOpen={handleWorkflowOpen}
                onExecute={(w) => handleWorkflowExecute(w)}
              />
            </div>
          </div>
        )
      })()}

      {/* Specialized Modals */}

      {/* Digital Employee Modal - Human-like interaction */}
      <DigitalEmployeeModal
        employee={digitalEmployeeModal as any}
        open={!!digitalEmployeeModal}
        onOpenChange={(open) => !open && setDigitalEmployeeModal(null)}
        onStartChat={handleDigitalEmployeeChat}
        executing={executing}
      />

      {/* Process Modal - System-like operations */}
      <ProcessModal
        process={processModal as any}
        open={!!processModal}
        onOpenChange={(open) => !open && setProcessModal(null)}
        onExecute={handleWorkflowExecute}
        executing={executing}
      />

      {/* AI Agent Chat Modal */}
      <AIAgentChatModal
        workflow={aiChatWorkflow}
        open={!!aiChatWorkflow}
        onOpenChange={(open) => {
          if (!open) {
            setAiChatWorkflow(null);
            setAiChatInitialMessage('');
            // Don't close other modals - they manage their own state
          } else {
            // When chat modal opens, close the digital employee modal
            setDigitalEmployeeModal(null);
          }
        }}
        initialMessage={aiChatInitialMessage}
      />

      {/* Execution Result Modal */}
      <ExecutionResultModal
        result={executionResult}
        open={!!executionResult}
        onOpenChange={(open) => !open && setExecutionResult(null)}
      />
    </div>
  );
}
