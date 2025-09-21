'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { getStatusColor, getStatusLabel } from '@/lib/shared-types';
import { FileSignature, Building2, Link as LinkIcon, Calendar, Edit, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Contract = {
  id: string
  contract_number: string
  status: string | null
  contract_value: number | null
  start_date: string | null
  end_date: string | null
  customers?: { id: string; company_name: string; contact_person: string | null } | null
  quotes?: { id: string; quote_number: string; title: string | null } | null
}

interface ContractQuickModalProps {
  contract: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (contract: Contract) => void;
}

export function ContractQuickModal({ contract, open, onOpenChange, onEdit }: ContractQuickModalProps) {
  const router = useRouter();
  if (!contract) return null;

  const handleOpenDetail = () => {
    router.push(`/dashboard/contracts/${contract.id}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl modern-card border-0">
        <DialogHeader className="pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileSignature className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">{contract.contract_number}</DialogTitle>
              <DialogDescription>Vertrag Schnellansicht</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <Badge className={getStatusColor(contract.status || 'draft', 'contract')}>
                {getStatusLabel(contract.status || 'draft', 'contract')}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Wert</div>
              <div className="font-medium">{formatCurrency(contract.contract_value)}</div>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Kunde</div>
                <div className="font-medium">{contract.customers?.company_name || '-'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Angebot</div>
                <div className="font-medium">{contract.quotes?.quote_number || '-'}</div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/[0.08]">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Start: {formatDate(contract.start_date)}</span>
              {contract.end_date && <span>• Ende: {formatDate(contract.end_date)}</span>}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(contract)}>
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
