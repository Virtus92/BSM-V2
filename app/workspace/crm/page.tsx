'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WorkspaceCRMRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect /workspace/crm to /workspace/customers
    router.replace('/workspace/customers');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <p className="text-muted-foreground">Umleitung zu Kunden...</p>
      </div>
    </div>
  );
}