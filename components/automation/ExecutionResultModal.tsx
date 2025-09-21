/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Activity,
  RefreshCw,
  Eye,
  Download,
  FileText,
  AlertTriangle,
  BarChart3,
  Square
} from "lucide-react";

interface ExecutionNode {
  nodeId: string;
  nodeName: string;
  status: 'success' | 'error' | 'running' | 'pending';
  output?: any;
  error?: string;
  duration?: number;
  startTime?: string;
  endTime?: string;
}

interface ExecutionResult {
  success: boolean;
  executionId?: string;
  data?: any;
  error?: string;
  duration?: number;
  startTime?: string;
  endTime?: string;
  status?: 'running' | 'success' | 'error';
  nodeResults?: ExecutionNode[];
  workflowId?: string;
  progress?: number;
}

interface ExecutionResultModalProps {
  result: ExecutionResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExecutionResultModal({ result, open, onOpenChange }: ExecutionResultModalProps) {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentResult, setCurrentResult] = useState<ExecutionResult | null>(result);

  // Monitor live execution
  useEffect(() => {
    if (!result?.executionId || result.status !== 'running') {
      setIsMonitoring(false);
      return;
    }

    setIsMonitoring(true);
    setCurrentResult(result);

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/automation/executions/${result.executionId}`);
        if (response.ok) {
          const data = await response.json();
          setCurrentResult(prev => ({ ...prev, ...data }));

          // Stop monitoring when execution completes
          if (data.status === 'success' || data.status === 'error') {
            setIsMonitoring(false);
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('Failed to fetch execution status:', error);
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      setIsMonitoring(false);
    };
  }, [result]);

  // Update currentResult when result prop changes
  useEffect(() => {
    if (result) {
      setCurrentResult(result);
    }
  }, [result]);

  const stopExecution = async () => {
    if (!currentResult?.executionId) return;

    try {
      const response = await fetch(`/api/automation/executions/${currentResult.executionId}/stop`, {
        method: 'POST'
      });

      if (response.ok) {
        setCurrentResult(prev => prev ? { ...prev, status: 'error', error: 'Stopped by user' } : null);
        setIsMonitoring(false);
      }
    } catch (error) {
      console.error('Failed to stop execution:', error);
    }
  };

  const downloadData = () => {
    if (!currentResult?.data) return;

    const dataStr = JSON.stringify(currentResult.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `execution-${currentResult.executionId || 'result'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!currentResult) return null;

  const isRunning = currentResult.status === 'running' || isMonitoring;
  const isSuccess = currentResult.status === 'success' || currentResult.success;
  const isError = currentResult.status === 'error' || (!currentResult.success && !isRunning);

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getNodeStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col modern-card border-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isRunning ? 'bg-blue-500/10' :
              isSuccess ? 'bg-green-500/10' :
              'bg-red-500/10'
            }`}>
              {isRunning ? (
                <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
              ) : isSuccess ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isRunning ? 'Workflow wird ausgeführt' :
                 isSuccess ? 'Ausführung erfolgreich' :
                 'Ausführung fehlgeschlagen'}
              </h2>
              {currentResult.executionId && (
                <p className="text-sm text-muted-foreground">ID: {currentResult.executionId}</p>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Badge variant={isRunning ? "default" : isSuccess ? "default" : "destructive"}>
                {isRunning ? (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    Läuft
                  </div>
                ) : isSuccess ? 'Erfolgreich' : 'Fehlgeschlagen'}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Execution Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="modern-card">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="font-bold">{formatDuration(currentResult.duration)}</span>
                </div>
                <p className="text-xs text-muted-foreground">Ausführungszeit</p>
              </CardContent>
            </Card>

            <Card className="modern-card">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-orange-500" />
                  <span className="font-bold">{currentResult.nodeResults?.length || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground">Nodes verarbeitet</p>
              </CardContent>
            </Card>

            <Card className="modern-card">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  {isRunning ? (
                    <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                  ) : isSuccess ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="font-bold">
                    {isRunning ? `${currentResult.progress || 0}%` :
                     isSuccess ? '100%' : '0%'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Fortschritt</p>
              </CardContent>
            </Card>

            <Card className="modern-card">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-purple-500" />
                  <span className="font-bold">
                    {currentResult.nodeResults?.filter(n => n.status === 'success').length || 0}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Erfolgreich</p>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar for Running Executions */}
          {isRunning && (
            <Card className="modern-card">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Execution Progress</span>
                    <span>{currentResult.progress || 0}%</span>
                  </div>
                  <Progress value={currentResult.progress || 0} className="h-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      {currentResult.startTime && `Gestartet: ${new Date(currentResult.startTime).toLocaleTimeString()}`}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={stopExecution}
                      className="text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                    >
                      <Square className="w-3 h-3 mr-1" />
                      Stop
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {isError && currentResult.error && (
            <Card className="modern-card border-red-500/20 bg-red-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-500">
                  <AlertTriangle className="w-5 h-5" />
                  Fehler Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-600 font-mono text-sm">
                  {currentResult.error}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Node Execution Results */}
          {currentResult.nodeResults && currentResult.nodeResults.length > 0 && (
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Node Ausführung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {currentResult.nodeResults.map((node, index) => (
                    <div key={node.nodeId} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
                          <span className="text-xs font-medium">{index + 1}</span>
                        </div>
                        {getNodeStatusIcon(node.status)}
                        <div>
                          <p className="text-sm font-medium">{node.nodeName}</p>
                          <p className="text-xs text-muted-foreground">ID: {node.nodeId}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {node.duration && (
                          <span className="text-xs text-muted-foreground">
                            {formatDuration(node.duration)}
                          </span>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {node.status}
                        </Badge>
                        {node.output && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-6 h-6 p-0"
                            onClick={() => {
                              console.log('Node output:', node.output);
                            }}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Output Data */}
          {currentResult.data && !isRunning && (
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Execution Output
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Ergebnis-Daten verfügbar
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadData}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download JSON
                    </Button>
                  </div>
                  <details className="bg-white/[0.02] border border-white/[0.05] rounded p-3">
                    <summary className="cursor-pointer text-sm font-medium">
                      Output Data Preview
                    </summary>
                    <pre className="mt-2 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-words">
                      {JSON.stringify(currentResult.data, null, 2)}
                    </pre>
                  </details>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {currentResult.startTime && (
              <>Gestartet: {new Date(currentResult.startTime).toLocaleString('de-DE')}</>
            )}
            {currentResult.endTime && (
              <> • Beendet: {new Date(currentResult.endTime).toLocaleString('de-DE')}</>
            )}
          </div>
          <div className="flex gap-2">
            {isRunning && (
              <Button
                variant="outline"
                onClick={() => setIsMonitoring(!isMonitoring)}
              >
                <RefreshCw className={`w-4 h-4 ${isMonitoring ? 'animate-spin' : ''}`} />
                {isMonitoring ? 'Auto-Update' : 'Manual'}
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Schließen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
