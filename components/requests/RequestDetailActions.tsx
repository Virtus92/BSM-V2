'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import Link from 'next/link';
import { RequestConversionModal } from './RequestConversionModal';
import type { ContactRequestWithRelations } from '@/lib/shared-types';

interface RequestDetailActionsProps {
  request: ContactRequestWithRelations;
}

export function RequestDetailActions({ request }: RequestDetailActionsProps) {
  const router = useRouter();
  const [showConversionModal, setShowConversionModal] = useState(false);

  const handleConvertClick = async () => {
    setShowConversionModal(true);

    // Log the conversion attempt
    await logClientActivity(
      'READ',
      'contact_request',
      request.id,
      {
        action: 'conversion_modal_opened',
        request_subject: request.subject
      }
    );
  };

  const handleConversionSuccess = async (customerId: string, action: 'created' | 'linked') => {
    setShowConversionModal(false);

    // Log successful conversion
    await logClientActivity(
      'REQUEST_CONVERTED',
      'contact_request',
      request.id,
      {
        action: 'request_converted_to_customer',
        request_subject: request.subject,
        customer_id: customerId
      }
    );

    // Navigate to the customer page
    if (customerId) {
      const basePath = window.location.pathname.startsWith('/workspace') ? '/workspace' : '/dashboard';
      router.push(`${basePath}/customers/${customerId}`);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {request.converted_customer ? (
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => {
              const basePath = window.location.pathname.startsWith('/workspace') ? '/workspace' : '/dashboard';
              router.push(`${basePath}/customers/${request.converted_customer.id}`);
            }}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Kunde ansehen
          </Button>
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