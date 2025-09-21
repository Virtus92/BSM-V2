'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import Link from 'next/link';
import { RequestConversionModal } from './RequestConversionModal';
import type { ContactRequestWithRelations } from '@/lib/shared-types';

interface RequestDetailActionsProps {
  request: ContactRequestWithRelations;
}

export function RequestDetailActions({ request }: RequestDetailActionsProps) {
  const [showConversionModal, setShowConversionModal] = useState(false);

  const handleConvertClick = () => {
    setShowConversionModal(true);
  };


  const handleConversionSuccess = () => {
    setShowConversionModal(false);
    // Refresh the page to show updated status
    window.location.reload();
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {request.converted_customer ? (
          <Link href={`/dashboard/crm/${request.converted_customer.id}`} className="inline-flex">
            <Button size="sm" variant="outline" className="h-8">
              <UserPlus className="w-4 h-4 mr-2" />
              Kunde ansehen
            </Button>
          </Link>
        ) : (
          <Button size="sm" variant="outline" className="h-8" onClick={handleConvertClick}>
            <UserPlus className="w-4 h-4 mr-2" />
            Zu Kunde konvertieren
          </Button>
        )}
      </div>

      {/* Conversion Modal */}
      <RequestConversionModal
        request={request}
        open={showConversionModal}
        onOpenChange={setShowConversionModal}
        onSuccess={handleConversionSuccess}
      />
    </>
  );
}