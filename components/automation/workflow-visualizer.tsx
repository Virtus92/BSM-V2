'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import type { WorkflowInsight } from '@/lib/services/workflow-analyzer';

interface WorkflowVisualizerProps {
  nodes: WorkflowInsight['nodes'];
  className?: string;
}

export function WorkflowVisualizer({ nodes, className }: WorkflowVisualizerProps) {
  if (!nodes || nodes.length === 0) return null;

  return (
    <div className={className}>
      <div className="overflow-x-auto">
        <div className="flex items-stretch gap-3 py-2 min-w-full">
          {nodes.map((node, index) => (
            <React.Fragment key={node.id}>
              <Card className="min-w-[220px] max-w-[260px] p-3 rounded-xl bg-white/[0.02] border-white/[0.08]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{index + 1}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10">
                    {node.category}
                  </span>
                </div>
                <p className="text-sm font-medium truncate" title={node.name}>{node.name}</p>
                {node.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {node.description}
                  </p>
                )}
              </Card>
              {index < nodes.length - 1 && (
                <div className="flex items-center">
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

