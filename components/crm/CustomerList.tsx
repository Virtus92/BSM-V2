'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Edit, Trash2, Mail, Phone, Building2, Plus, Eye } from 'lucide-react';
import { Customer, getStatusColor as getColor, getStatusLabel as getLabel } from '@/lib/shared-types';

interface CustomerListProps {
  customers: Customer[];
  onCustomerClick: (customer: Customer) => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customer: Customer) => void;
  onCreate: () => void;
}

export function CustomerList({
  customers,
  onCustomerClick,
  onEditCustomer,
  onDeleteCustomer,
  onCreate
}: CustomerListProps) {
  if (customers.length === 0) {
    return (
      <div className="modern-card fade-in-up stagger-delay-3">
        <div className="text-center py-12">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-muted/10 flex items-center justify-center mb-4">
            <Users className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Keine Kunden gefunden</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Erstellen Sie Ihren ersten Kunden um zu beginnen.
          </p>
          <Button onClick={onCreate} className="mystery-button">
            <Plus className="w-4 h-4 mr-2" />
            Ersten Kunden erstellen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-card fade-in-up stagger-delay-3">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Kundenliste</h3>
            <p className="text-sm text-muted-foreground">
              {customers.length} {customers.length === 1 ? 'Kunde' : 'Kunden'} gefunden
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        {/* Mobile Card Layout */}
        <div className="grid grid-cols-1 gap-4 lg:hidden">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="p-4 rounded-xl border border-white/[0.08] hover:border-white/[0.15] cursor-pointer transition-all duration-200 bg-background/30 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div onClick={() => onCustomerClick(customer)} className="flex-1">
                  <h4 className="font-semibold group-hover:text-primary transition-colors">
                    {customer.company_name || customer.contact_person}
                  </h4>
                  {customer.contact_person && (
                    <p className="text-sm text-muted-foreground">
                      {customer.contact_person}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getColor(customer.status || 'prospect', 'customer')}>
                    {getLabel(customer.status || 'prospect', 'customer')}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                <span>{customer.industry || 'Keine Branche'}</span>
              </div>

              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCustomerClick(customer)}
                  className="hover:bg-primary/10 flex-1 mr-2"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Öffnen
                </Button>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onEditCustomer(customer); }}
                    className="hover:bg-primary/10 h-8 w-8 p-0"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onDeleteCustomer(customer); }}
                    className="hover:bg-red-500/10 text-red-500 h-8 w-8 p-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-8 gap-4 p-4 text-sm font-medium text-muted-foreground border-b border-white/[0.08]">
            <div className="col-span-2">Unternehmen</div>
            <div>Kontakt</div>
            <div>Status</div>
            <div>Priorität</div>
            <div>Branche</div>
            <div>Umsatz</div>
            <div className="text-right">Aktionen</div>
          </div>
          <div className="space-y-2">
            {customers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => onCustomerClick(customer)}
                className="grid grid-cols-8 gap-4 p-4 rounded-xl hover:bg-white/[0.03] cursor-pointer transition-all duration-200 border border-transparent hover:border-white/[0.08] group"
              >
                <div className="col-span-2">
                  <div className="space-y-1">
                    <p className="font-medium group-hover:text-primary transition-colors">
                      {customer.company_name || customer.contact_person}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {customer.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {customer.email}
                        </span>
                      )}
                      {customer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  {customer.contact_person && (
                    <p className="font-medium">{customer.contact_person}</p>
                  )}
                  {customer.city && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {customer.city}
                    </p>
                  )}
                </div>
                <div>
                  <Badge className={getColor(customer.status || 'prospect', 'customer')}>
                    {getLabel(customer.status || 'prospect', 'customer')}
                  </Badge>
                </div>
                <div />
                <div>
                  <span className="text-sm">{customer.industry || '-'}</span>
                </div>
                <div />
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); onEditCustomer(customer); }}
                      className="hover:bg-primary/10 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); onDeleteCustomer(customer); }}
                      className="hover:bg-red-500/10 text-red-500 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
