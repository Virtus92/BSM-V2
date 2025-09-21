'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FileText, Edit, ExternalLink, Building2, BarChart3, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatters';
import { useRouter } from 'next/navigation';

type Document = {
  id: string
  title: string | null
  filename: string
  document_type: string | null
  created_at: string
  customers?: { id: string; company_name: string } | null
  projects?: { id: string; name: string } | null
}

interface DocumentQuickModalProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (document: Document) => void;
}

export function DocumentQuickModal({ document, open, onOpenChange, onEdit }: DocumentQuickModalProps) {
  const router = useRouter();
  if (!document) return null;

  const handleOpenDetail = () => {
    router.push(`/dashboard/documents/${document.id}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl modern-card border-0">
        <DialogHeader className="pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">{document.title || document.filename}</DialogTitle>
              <DialogDescription>Dokument Schnellansicht</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Typ</div>
              <div className="font-medium capitalize">{document.document_type || 'other'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Hochgeladen</div>
              <div className="font-medium">{formatDate(document.created_at)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Kunde</div>
              <div className="font-medium flex items-center gap-1">
                {document.customers ? (
                  <>
                    <Building2 className="w-4 h-4" />
                    {document.customers.company_name}
                  </>
                ) : '-'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Projekt</div>
              <div className="font-medium flex items-center gap-1">
                {document.projects ? (
                  <>
                    <BarChart3 className="w-4 h-4" />
                    {document.projects.name}
                  </>
                ) : '-'}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/[0.08]">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(document.created_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(document)}>
                <Edit className="w-4 h-4 mr-2" />
                Bearbeiten
              </Button>
              <Button className="mystery-button" size="sm" onClick={handleOpenDetail}>
                Öffnen
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
