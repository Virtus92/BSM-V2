'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit, ChevronDown } from 'lucide-react';
import type { ContactRequestStatus } from '@/lib/shared-types';

interface RequestStatusDropdownProps {
  requestId: string;
  currentStatus: ContactRequestStatus;
}

const statusOptions: { value: ContactRequestStatus; label: string; color: string }[] = [
  { value: 'new', label: 'Neu', color: 'text-blue-500' },
  { value: 'in_progress', label: 'In Bearbeitung', color: 'text-yellow-500' },
  { value: 'responded', label: 'Beantwortet', color: 'text-green-500' },
  { value: 'converted', label: 'Konvertiert', color: 'text-purple-500' },
  { value: 'archived', label: 'Archiviert', color: 'text-gray-500' },
];

export function RequestStatusDropdown({ requestId, currentStatus }: RequestStatusDropdownProps) {
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (newStatus: ContactRequestStatus) => {
    if (newStatus === currentStatus) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/contact/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        window.location.reload();
      } else {
        alert('Fehler beim Ändern des Status');
      }
    } catch (error) {
      alert('Fehler beim Ändern des Status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full col-span-2"
          disabled={updating}
        >
          <Edit className="w-4 h-4 mr-2" />
          Status ändern
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {statusOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleStatusChange(option.value)}
            className={`cursor-pointer ${option.value === currentStatus ? 'bg-accent' : ''}`}
          >
            <div className="flex items-center justify-between w-full">
              <span className={option.color}>{option.label}</span>
              {option.value === currentStatus && (
                <span className="text-xs text-muted-foreground">Aktuell</span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}