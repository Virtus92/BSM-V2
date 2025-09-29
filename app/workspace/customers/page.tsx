'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Loader2, AlertCircle, ChevronDown, Trash2 } from "lucide-react";
import { useCustomers } from "@/lib/hooks/useCustomers";
import { CustomerStats } from "@/components/crm/CustomerStats";
import { CustomerFilters } from "@/components/crm/CustomerFilters";
import { CustomerList } from "@/components/crm/CustomerList";
import { CustomerDetailModal } from "@/components/crm/CustomerDetailModal";
import { CustomerForm } from "@/components/crm/CustomerForm";
import type { Customer } from "@/lib/shared-types";
import { useRouter, useSearchParams } from "next/navigation";

export default function WorkspaceCustomersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const {
    customers,
    filteredCustomers,
    loading,
    error,
    searchTerm,
    statusFilter,
    stats,
    setSearchTerm,
    setStatusFilter,
    refetch
  } = useCustomers({ initialFilters: { assignedTo: 'me' } });

  const [quickModalCustomer, setQuickModalCustomer] = useState<Customer | null>(null);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'create') {
      setShowCreateForm(true);
      router.replace('/workspace/customers');
    }
  }, [searchParams, router]);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId) return;
    if (!customers || customers.length === 0) return;
    const customerToEdit = customers.find((c) => c.id === editId);
    if (customerToEdit) {
      setEditCustomer(customerToEdit);
      setShowCreateForm(false);
      router.replace('/workspace/customers');
    }
  }, [searchParams, customers, router]);

  const handleDeleteCustomer = (customer: Customer) => {
    setDeleteCustomer(customer);
  };

  const confirmDeleteCustomer = async () => {
    if (!deleteCustomer) return;
    const customerName = deleteCustomer.company_name || deleteCustomer.contact_person || 'Unbekannter Kunde';
    try {
      const response = await fetch(`/api/customers/${deleteCustomer.id}`, { method: 'DELETE' });
      if (response.ok) {
        await refetch();
        toast({ title: "Erfolgreich gelöscht", description: `Kunde "${customerName}" wurde erfolgreich gelöscht.`, });
      } else {
        const errorData = await response.json();
        toast({ title: "Fehler beim Löschen", description: errorData.error || "Kunde konnte nicht gelöscht werden.", variant: "destructive", });
      }
    } catch {
      toast({ title: "Unerwarteter Fehler", description: "Ein unerwarteter Fehler ist aufgetreten.", variant: "destructive", });
    } finally {
      setDeleteCustomer(null);
    }
  };

  const handleFormSuccess = async () => {
    await refetch();
    setEditCustomer(null);
    setShowCreateForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Lade Kunden...</span>
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
              <span className="text-mystery-gradient">Kunden</span>
            </h1>
            <p className="text-muted-foreground text-lg">Kundenbeziehungen im Workspace verwalten.</p>
          </div>
          <Button onClick={() => setShowCreateForm(true)} className="mystery-button">
            <Plus className="w-4 h-4 mr-2" />
            Neuer Kunde
          </Button>
        </div>
      </div>

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

      <div className="hidden md:block">
        <CustomerStats stats={stats} />
      </div>

      <div className="md:hidden">
        <details className="modern-card no-marker">
          <summary className="flex items-center justify-between cursor-pointer select-none bg-transparent">
            <span className="font-semibold">Statistiken</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </summary>
          <div className="mt-4">
            <CustomerStats stats={stats} />
          </div>
        </details>
      </div>

      <CustomerFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        totalCustomers={customers.length}
        filteredCount={filteredCustomers.length}
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
      />

      <CustomerList
        customers={filteredCustomers}
        onCustomerClick={setQuickModalCustomer}
        onEditCustomer={setEditCustomer}
        onDeleteCustomer={handleDeleteCustomer}
        onCreate={() => setShowCreateForm(true)}
      />

      <CustomerDetailModal
        open={!!quickModalCustomer}
        onOpenChange={(open) => !open && setQuickModalCustomer(null)}
        customerId={quickModalCustomer?.id || null}
        onUpdated={() => refetch()}
        canAssign={false}
      />

      <CustomerForm open={showCreateForm} onOpenChange={setShowCreateForm} onSuccess={handleFormSuccess} />

      <CustomerForm open={!!editCustomer} onOpenChange={(open) => !open && setEditCustomer(null)} customer={editCustomer} onSuccess={handleFormSuccess} />

      <Dialog open={!!deleteCustomer} onOpenChange={(open) => !open && setDeleteCustomer(null)}>
        <DialogContent className="max-w-md modern-card border-0">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <DialogTitle className="text-xl text-foreground">Kunde löschen</DialogTitle>
                <DialogDescription className="text-muted-foreground">Diese Aktion kann nicht rückgängig gemacht werden.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-foreground">
              Möchten Sie den Kunden <span className="font-semibold">&quot;{deleteCustomer?.company_name || deleteCustomer?.contact_person || 'Unbekannter Kunde'}&quot;</span> wirklich löschen?
            </p>
          </div>
          <DialogFooter className="flex gap-3">
            <Button variant="outline" onClick={() => setDeleteCustomer(null)} className="flex-1">Abbrechen</Button>
            <Button variant="destructive" onClick={confirmDeleteCustomer} className="flex-1">
              <Trash2 className="w-4 h-4 mr-2" />
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
