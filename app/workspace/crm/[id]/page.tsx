'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function WorkspaceCRMCustomerRedirect() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    // Redirect /workspace/crm/[id] to /workspace/customers/[id]
    const customerId = params.id;
    if (customerId) {
      router.replace(`/workspace/customers/${customerId}`);
    } else {
      router.replace('/workspace/customers');
    }
  }, [router, params.id]);

  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <p className="text-muted-foreground">Umleitung zu Kunden...</p>
      </div>
    </div>
  );
}