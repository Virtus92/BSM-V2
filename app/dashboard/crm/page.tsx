'use client';

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users, 
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  Building2,
  Calendar,
  Euro,
  TrendingUp,
  Activity,
  Clock,
  Target,
  Briefcase
} from "lucide-react";

// TypeScript types for customer data
interface CustomerStatus {
  value: 'lead' | 'kunde' | 'vip' | 'inaktiv';
  label: string;
  color: string;
}

interface CustomerInteraction {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'note';
  description: string;
  date: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  status: CustomerStatus['value'];
  lastContact: string;
  value: number;
  interactions: CustomerInteraction[];
  createdAt: string;
}

// Customer status definitions
const customerStatuses: Record<CustomerStatus['value'], CustomerStatus> = {
  lead: { value: 'lead', label: 'Lead', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  kunde: { value: 'kunde', label: 'Kunde', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  vip: { value: 'vip', label: 'VIP', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  inaktiv: { value: 'inaktiv', label: 'Inaktiv', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' }
};

// Mock German business customer data
const mockCustomers: Customer[] = [
    {
      id: '1',
      name: 'Max Mustermann',
      email: 'max.mustermann@musterfirma.de',
      company: 'Musterfirma GmbH',
      phone: '+49 30 12345678',
      status: 'vip',
      lastContact: '2024-09-10',
      value: 125000,
      createdAt: '2024-01-15',
      interactions: [
        { id: '1', type: 'email', description: 'Vertragsverlängerung besprochen', date: '2024-09-10', icon: Mail },
        { id: '2', type: 'meeting', description: 'Quartalsgespräch durchgeführt', date: '2024-08-15', icon: Calendar }
      ]
    },
    {
      id: '2',
      name: 'Anna Schmidt',
      email: 'a.schmidt@techsolution.de',
      company: 'TechSolution AG',
      phone: '+49 40 98765432',
      status: 'kunde',
      lastContact: '2024-09-08',
      value: 85000,
      createdAt: '2024-02-20',
      interactions: [
        { id: '3', type: 'call', description: 'Support-Anfrage bearbeitet', date: '2024-09-08', icon: Phone },
        { id: '4', type: 'email', description: 'Rechnungsstellung geklärt', date: '2024-09-01', icon: Mail }
      ]
    },
    {
      id: '3',
      name: 'Klaus Weber',
      email: 'klaus.weber@innovation-gmbh.de',
      company: 'Innovation GmbH',
      phone: '+49 89 55544433',
      status: 'lead',
      lastContact: '2024-09-05',
      value: 0,
      createdAt: '2024-09-01',
      interactions: [
        { id: '5', type: 'email', description: 'Erstberatung terminiert', date: '2024-09-05', icon: Mail }
      ]
    },
    {
      id: '4',
      name: 'Sarah Müller',
      email: 's.mueller@digital-services.de',
      company: 'Digital Services GmbH',
      phone: '+49 221 77788899',
      status: 'kunde',
      lastContact: '2024-08-28',
      value: 67500,
      createdAt: '2024-03-10',
      interactions: [
        { id: '6', type: 'meeting', description: 'Projektabschluss besprochen', date: '2024-08-28', icon: Calendar }
      ]
    },
    {
      id: '5',
      name: 'Thomas Becker',
      email: 't.becker@consulting-pro.de',
      company: 'Consulting Pro',
      phone: '+49 69 11122233',
      status: 'inaktiv',
      lastContact: '2024-06-15',
      value: 45000,
      createdAt: '2023-11-05',
      interactions: [
        { id: '7', type: 'note', description: 'Projekt pausiert auf Kundenwunsch', date: '2024-06-15', icon: Activity }
      ]
    },
    {
      id: '6',
      name: 'Lisa König',
      email: 'l.koenig@startup-hub.de',
      company: 'Startup Hub Berlin',
      phone: '+49 30 99887766',
      status: 'lead',
      lastContact: '2024-09-12',
      value: 0,
      createdAt: '2024-09-10',
      interactions: [
        { id: '8', type: 'call', description: 'Erstberatung durchgeführt', date: '2024-09-12', icon: Phone }
      ]
    }
  ];

export default function CRMPage() {
  const [mounted, setMounted] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isNewCustomerDialogOpen, setIsNewCustomerDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    status: 'lead' as CustomerStatus['value']
  });

  useEffect(() => {
    setMounted(true);
    setCustomers(mockCustomers);
  }, []); // mockCustomers is static data, safe to ignore dependency warning

  // Filter customers based on search and status
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [customers, searchTerm, statusFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const newThisMonth = customers.filter(c => 
      new Date(c.createdAt) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    ).length;
    const totalValue = customers.reduce((sum, c) => sum + c.value, 0);
    const activeCustomers = customers.filter(c => c.status !== 'inaktiv').length;
    
    return {
      totalCustomers,
      newThisMonth,
      totalValue,
      activeCustomers
    };
  }, [customers]);

  const handleAddCustomer = () => {
    if (!newCustomer.name || !newCustomer.email) return;
    
    const customer: Customer = {
      id: Date.now().toString(),
      ...newCustomer,
      lastContact: new Date().toISOString().split('T')[0],
      value: 0,
      createdAt: new Date().toISOString().split('T')[0],
      interactions: [{
        id: Date.now().toString(),
        type: 'note',
        description: 'Kunde wurde zum CRM hinzugefügt',
        date: new Date().toISOString().split('T')[0],
        icon: Activity
      }]
    };
    
    setCustomers([...customers, customer]);
    setNewCustomer({ name: '', email: '', company: '', phone: '', status: 'lead' });
    setIsNewCustomerDialogOpen(false);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setNewCustomer({
      name: customer.name,
      email: customer.email,
      company: customer.company,
      phone: customer.phone,
      status: customer.status
    });
  };

  const handleUpdateCustomer = () => {
    if (!editingCustomer || !newCustomer.name || !newCustomer.email) return;
    
    setCustomers(customers.map(c => 
      c.id === editingCustomer.id 
        ? { ...c, ...newCustomer }
        : c
    ));
    setEditingCustomer(null);
    setNewCustomer({ name: '', email: '', company: '', phone: '', status: 'lead' });
  };

  const handleDeleteCustomer = (customerId: string) => {
    setCustomers(customers.filter(c => c.id !== customerId));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="fade-in-up">
        <h1 className="text-3xl font-bold mb-2">
          <span className="text-mystery-gradient">CRM Dashboard</span>
        </h1>
        <p className="text-muted-foreground">
          Verwalten Sie Ihre Kundenbeziehungen und -interaktionen.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-effect border-0 hover:shadow-mystery transition-all duration-300 group fade-in-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gesamt Kunden
            </CardTitle>
            <Users className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">{stats.totalCustomers}</div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-green-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +{stats.newThisMonth} neu
              </span>
              <span className="text-xs text-muted-foreground">diesen Monat</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-0 hover:shadow-mystery transition-all duration-300 group fade-in-up" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aktive Kunden
            </CardTitle>
            <Target className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">{stats.activeCustomers}</div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-blue-500">
                {Math.round((stats.activeCustomers / stats.totalCustomers) * 100)}%
              </span>
              <span className="text-xs text-muted-foreground">der Gesamtkunden</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-0 hover:shadow-mystery transition-all duration-300 group fade-in-up" style={{ animationDelay: '0.3s' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gesamtwert
            </CardTitle>
            <Euro className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">{formatCurrency(stats.totalValue)}</div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-green-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +15%
              </span>
              <span className="text-xs text-muted-foreground">vs letzter Monat</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-0 hover:shadow-mystery transition-all duration-300 group fade-in-up" style={{ animationDelay: '0.4s' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Durchschnittswert
            </CardTitle>
            <Briefcase className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">
              {formatCurrency(stats.totalValue / stats.totalCustomers || 0)}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-blue-500">pro Kunde</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="glass-effect border-0 fade-in-up" style={{ animationDelay: '0.5s' }}>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Kunden durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass-effect border-0"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] glass-effect border-0">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status filtern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="kunde">Kunde</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="inaktiv">Inaktiv</SelectItem>
                </SelectContent>
              </Select>
              
              <Dialog open={isNewCustomerDialogOpen} onOpenChange={setIsNewCustomerDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="mystery-button">
                    <Plus className="w-4 h-4 mr-2" />
                    Neuer Kunde
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Neuen Kunden hinzufügen</DialogTitle>
                    <DialogDescription>
                      Fügen Sie einen neuen Kunden zu Ihrem CRM hinzu.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                        placeholder="Max Mustermann"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">E-Mail *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newCustomer.email}
                        onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                        placeholder="max@example.com"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="company">Unternehmen</Label>
                      <Input
                        id="company"
                        value={newCustomer.company}
                        onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })}
                        placeholder="Musterfirma GmbH"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Telefon</Label>
                      <Input
                        id="phone"
                        value={newCustomer.phone}
                        onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                        placeholder="+49 30 12345678"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={newCustomer.status} onValueChange={(value: CustomerStatus['value']) => setNewCustomer({ ...newCustomer, status: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(customerStatuses).map(status => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsNewCustomerDialogOpen(false)}>
                      Abbrechen
                    </Button>
                    <Button onClick={handleAddCustomer} className="mystery-button">
                      Kunde hinzufügen
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <Card className="glass-effect border-0 fade-in-up" style={{ animationDelay: '0.6s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Kundenliste ({filteredCustomers.length})
          </CardTitle>
          <CardDescription>
            Übersicht aller Kunden mit wichtigen Informationen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-white/10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kunde</TableHead>
                  <TableHead>Unternehmen</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Letzter Kontakt</TableHead>
                  <TableHead>Wert</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer, index) => (
                  <TableRow key={customer.id} className="hover:bg-primary/5 transition-colors" style={{ animationDelay: `${0.7 + index * 0.05}s` }}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-mystery-gradient flex items-center justify-center text-white font-semibold text-sm mystery-glow">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">{customer.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        {customer.company || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={customerStatuses[customer.status].color}>
                        {customerStatuses[customer.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {new Date(customer.lastContact).toLocaleDateString('de-DE')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {customer.value > 0 ? formatCurrency(customer.value) : '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCustomer(customer)}
                          className="hover:bg-primary/10"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="hover:bg-blue-500/10"
                        >
                          <a href={`mailto:${customer.email}`}>
                            <Mail className="w-4 h-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="hover:bg-green-500/10"
                        >
                          <a href={`tel:${customer.phone}`}>
                            <Phone className="w-4 h-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="hover:bg-destructive/10 text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Customer Interaction Timeline */}
      <Card className="glass-effect border-0 fade-in-up" style={{ animationDelay: '0.8s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Letzte Kundeninteraktionen
          </CardTitle>
          <CardDescription>
            Übersicht der neuesten Kundenaktivitäten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {customers
              .flatMap(customer => 
                customer.interactions.map(interaction => ({
                  ...interaction,
                  customerName: customer.name,
                  customerCompany: customer.company,
                  status: customer.status
                }))
              )
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 6)
              .map((interaction, index) => (
                <div key={interaction.id} className="flex items-start gap-4 p-4 rounded-lg hover:bg-primary/5 transition-all duration-200 group fade-in-up" style={{ animationDelay: `${0.9 + index * 0.05}s` }}>
                  <div className="p-2 rounded-lg bg-background border border-white/10 mystery-glow">
                    <interaction.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-medium text-sm">{interaction.customerName}</div>
                      <Badge className={customerStatuses[interaction.status as CustomerStatus['value']].color} variant="outline">
                        {customerStatuses[interaction.status as CustomerStatus['value']].label}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-1">{interaction.customerCompany}</div>
                    <div className="text-sm">{interaction.description}</div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {new Date(interaction.date).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Customer Dialog */}
      <Dialog open={editingCustomer !== null} onOpenChange={() => setEditingCustomer(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Kunde bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Informationen des Kunden.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                placeholder="Max Mustermann"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">E-Mail *</Label>
              <Input
                id="edit-email"
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                placeholder="max@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-company">Unternehmen</Label>
              <Input
                id="edit-company"
                value={newCustomer.company}
                onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })}
                placeholder="Musterfirma GmbH"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Telefon</Label>
              <Input
                id="edit-phone"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                placeholder="+49 30 12345678"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={newCustomer.status} onValueChange={(value: CustomerStatus['value']) => setNewCustomer({ ...newCustomer, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(customerStatuses).map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCustomer(null)}>
              Abbrechen
            </Button>
            <Button onClick={handleUpdateCustomer} className="mystery-button">
              Änderungen speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}