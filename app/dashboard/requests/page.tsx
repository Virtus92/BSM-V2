'use client';

import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Loader2, AlertCircle, ChevronDown } from "lucide-react";
import { useContactRequests } from "@/lib/hooks/useContactRequests";
import { ContactRequestWithRelations } from "@/lib/shared-types";
import { RequestStats } from "@/components/requests/RequestStats";
import { RequestFilters } from "@/components/requests/RequestFilters";
import { RequestList } from "@/components/requests/RequestList";
import { RequestQuickModal } from "@/components/requests/RequestQuickModal";

export default function RequestsPage() {
  const { toast } = useToast();
  const {
    requests,
    filteredRequests,
    stats,
    loading,
    error,
    converting,
    searchTerm,
    statusFilter,
    priorityFilter,
    setSearchTerm,
    setStatusFilter,
    setPriorityFilter,
    
    convertToCustomer,
    isConvertible,
    formatDate
  } = useContactRequests();

  const [quickModalRequest, setQuickModalRequest] = useState<ContactRequestWithRelations | null>(null);

  const handleConvertToCustomer = async (requestId: string) => {
    const result = await convertToCustomer(requestId);
    if (result.success) {
      toast({
        title: "Erfolg",
        description: result.action === 'created'
          ? "Neuer Kunde wurde erstellt!"
          : "Mit bestehendem Kunden verknüpft!",
      });
    } else {
      toast({
        title: "Fehler",
        description: "Konvertierung fehlgeschlagen.",
        variant: "destructive",
      });
    }
  };

  // Handlers for updating status/priority are currently unused in the list view.

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Lade Anfragen...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-3">
              <span className="text-mystery-gradient">Anfragenverwaltung</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Verwalten Sie Kontaktanfragen und konvertieren Sie sie zu Kunden.
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="modern-card border-red-500/20 bg-red-500/5 fade-in-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="font-medium text-red-500">Fehler aufgetreten</p>
              <p className="text-sm text-red-500/80">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards - desktop above filters */}
      <div className="hidden md:block">
        <RequestStats stats={stats} />
      </div>

      {/* Statistics Cards - mobile collapsible above filters */}
      <div className="md:hidden">
        <details className="modern-card no-marker">
          <summary className="flex items-center justify-between cursor-pointer select-none bg-transparent">
            <span className="font-semibold">Statistiken</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </summary>
          <div className="mt-4">
            <RequestStats stats={stats} />
          </div>
        </details>
      </div>

      {/* Search and Filter Controls */}
      <RequestFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        totalRequests={requests.length}
        filteredCount={filteredRequests.length}
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
        onPriorityChange={setPriorityFilter}
      />

      {/* Request List */}
      <RequestList
        requests={filteredRequests}
        onRequestClick={setQuickModalRequest}
        onConvertToCustomer={handleConvertToCustomer}
        isConvertible={isConvertible}
        formatDate={formatDate}
        converting={converting}
      />

      {/* Request Quick Modal */}
      <RequestQuickModal
        request={quickModalRequest}
        open={!!quickModalRequest}
        onOpenChange={(open) => !open && setQuickModalRequest(null)}
        onConvertToCustomer={handleConvertToCustomer}
        isConvertible={isConvertible}
        converting={converting}
      />
    </div>
  );
}
