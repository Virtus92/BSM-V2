'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TrendingUp, CheckCircle, Loader2 } from 'lucide-react';
import type { ContactRequestStatus } from '@/lib/shared-types';

interface Props {
  requestId: string;
  currentStatus: ContactRequestStatus;
}

export function RequestWorkActions({ requestId, currentStatus }: Props) {
  const [loading, setLoading] = useState(false);

  const startWork = async () => {
    setLoading(true);
    try {
      await fetch(`/api/requests/${requestId}/start`, { method: 'POST' });
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  const completeWork = async () => {
    setLoading(true);
    try {
      await fetch(`/api/requests/${requestId}/complete`, { method: 'POST' });
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  const canStart = currentStatus !== 'in_progress' && currentStatus !== 'converted' && currentStatus !== 'archived';
  const canComplete = currentStatus !== 'responded' && currentStatus !== 'archived';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <Button variant="outline" className="w-full" onClick={startWork} disabled={loading || !canStart}>
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TrendingUp className="w-4 h-4 mr-2" />}
        In Bearbeitung
      </Button>
      <Button variant="outline" className="w-full" onClick={completeWork} disabled={loading || !canComplete}>
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
        Abschließen
      </Button>
    </div>
  );
}
