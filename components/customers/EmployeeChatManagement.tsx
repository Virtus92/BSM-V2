'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MessageCircle,
  Users,
  Clock,
  MessageSquare,
  Search,
  Filter,
  User,
  Building,
  Mail,
  Phone,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import Link from 'next/link';

interface Customer {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  status: string;
  assigned_employee_id: string | null;
  created_at: string;
  user_profiles?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface ChatStat {
  customer_id: string;
  is_from_customer: boolean;
  created_at: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface UserProfile {
  user_type: string;
  first_name: string;
  last_name: string;
}

interface EmployeeChatManagementProps {
  customers: Customer[];
  activeChatCustomers: Customer[];
  chatStats: ChatStat[];
  currentUser: SupabaseUser;
  userProfile: UserProfile;
  availableEmployees: Employee[];
}

export function EmployeeChatManagement({
  customers,
  activeChatCustomers,
  chatStats,
  currentUser,
  userProfile,
  availableEmployees
}: EmployeeChatManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [filteredCustomers, setFilteredCustomers] = useState(customers);

  // Filter customers based on search and employee filter
  useEffect(() => {
    let filtered = customers;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Employee filter
    if (selectedEmployee !== 'all') {
      if (selectedEmployee === 'unassigned') {
        filtered = filtered.filter(customer => !customer.assigned_employee_id);
      } else {
        filtered = filtered.filter(customer => customer.assigned_employee_id === selectedEmployee);
      }
    }

    setFilteredCustomers(filtered);
  }, [searchTerm, selectedEmployee, customers]);

  const assignEmployee = async (customerId: string, employeeId: string | null) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ assigned_employee_id: employeeId })
        .eq('id', customerId);

      if (error) {
        throw error;
      }

      toast({
        title: 'Erfolg',
        description: 'Mitarbeiter wurde erfolgreich zugewiesen'
      });
      router.refresh();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Fehler beim Zuweisen'
      });
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getCustomerChatStats = (customerId: string) => {
    const customerStats = chatStats.filter(stat => stat.customer_id === customerId);
    const recentMessages = customerStats.filter(
      stat => new Date(stat.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    const unreadFromCustomer = customerStats.filter(
      stat => stat.is_from_customer && new Date(stat.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    return {
      totalMessages: customerStats.length,
      recentMessages: recentMessages.length,
      unreadFromCustomer: unreadFromCustomer.length,
      hasRecentActivity: recentMessages.length > 0
    };
  };

  // Calculate overall statistics
  const overallStats = {
    totalCustomers: customers.length,
    activeChats: activeChatCustomers.length,
    unassignedCustomers: customers.filter(c => !c.assigned_employee_id).length,
    recentMessages: chatStats.filter(
      stat => new Date(stat.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Kunden-Chat Management
          </h1>
          <p className="text-muted-foreground">
            Verwalten Sie Kundenchats und -zuweisungen
          </p>
        </div>
        <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
          {userProfile.user_type === 'admin' ? 'Administrator' : 'Mitarbeiter'}
        </Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gesamt Kunden
            </CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {userProfile.user_type === 'admin' ? 'Alle Kunden' : 'Zugewiesene Kunden'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Aktive Chats
            </CardTitle>
            <MessageCircle className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{overallStats.activeChats}</div>
            <p className="text-xs text-muted-foreground">
              Mit Chat-Aktivität
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Nicht zugewiesen
            </CardTitle>
            <User className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{overallStats.unassignedCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Benötigen Zuweisung
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Neue Nachrichten
            </CardTitle>
            <MessageSquare className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{overallStats.recentMessages}</div>
            <p className="text-xs text-muted-foreground">
              Letzte 24 Stunden
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter & Suche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Nach Kunde, Unternehmen oder E-Mail suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {userProfile.user_type === 'admin' && (
              <div className="w-full md:w-64">
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Nach Mitarbeiter filtern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Mitarbeiter</SelectItem>
                    <SelectItem value="unassigned">Nicht zugewiesen</SelectItem>
                    {availableEmployees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.first_name} {employee.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customer Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Alle Kunden ({filteredCustomers.length})</TabsTrigger>
          <TabsTrigger value="active">Aktive Chats ({activeChatCustomers.length})</TabsTrigger>
          <TabsTrigger value="unassigned">Nicht zugewiesen ({overallStats.unassignedCustomers})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <CustomerList
            customers={filteredCustomers}
            chatStats={chatStats}
            userProfile={userProfile}
            availableEmployees={availableEmployees}
            onAssignEmployee={assignEmployee}
            getCustomerChatStats={getCustomerChatStats}
            getInitials={getInitials}
          />
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <CustomerList
            customers={activeChatCustomers.filter(customer =>
              filteredCustomers.some(fc => fc.id === customer.id)
            )}
            chatStats={chatStats}
            userProfile={userProfile}
            availableEmployees={availableEmployees}
            onAssignEmployee={assignEmployee}
            getCustomerChatStats={getCustomerChatStats}
            getInitials={getInitials}
          />
        </TabsContent>

        <TabsContent value="unassigned" className="space-y-4">
          <CustomerList
            customers={filteredCustomers.filter(customer => !customer.assigned_employee_id)}
            chatStats={chatStats}
            userProfile={userProfile}
            availableEmployees={availableEmployees}
            onAssignEmployee={assignEmployee}
            getCustomerChatStats={getCustomerChatStats}
            getInitials={getInitials}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface CustomerListProps {
  customers: Customer[];
  chatStats: ChatStat[];
  userProfile: UserProfile;
  availableEmployees: Employee[];
  onAssignEmployee: (customerId: string, employeeId: string | null) => void;
  getCustomerChatStats: (customerId: string) => {
    totalMessages: number;
    recentMessages: number;
    unreadFromCustomer: number;
    hasRecentActivity: boolean;
  };
  getInitials: (firstName?: string, lastName?: string) => string;
}

function CustomerList({
  customers,
  chatStats,
  userProfile,
  availableEmployees,
  onAssignEmployee,
  getCustomerChatStats,
  getInitials
}: CustomerListProps) {
  if (customers.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Keine Kunden gefunden</h3>
          <p className="text-muted-foreground">
            Keine Kunden entsprechen den aktuellen Filterkriterien.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {customers.map((customer) => {
        const stats = getCustomerChatStats(customer.id);
        const assignedEmployee = customer.user_profiles;

        return (
          <Card key={customer.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-blue-600 text-white">
                      {getInitials(customer.contact_person?.split(' ')[0], customer.contact_person?.split(' ')[1])}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{customer.company_name}</CardTitle>
                    <CardDescription>{customer.contact_person}</CardDescription>
                  </div>
                </div>
                {stats.hasRecentActivity && (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                    Aktiv
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Customer Info */}
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  {customer.email}
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {customer.phone}
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Kunde seit {new Date(customer.created_at).toLocaleDateString('de-DE')}
                </div>
              </div>

              {/* Chat Statistics */}
              {stats.totalMessages > 0 && (
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    <span>{stats.totalMessages} Nachrichten</span>
                  </div>
                  {stats.recentMessages > 0 && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-green-500" />
                      <span>{stats.recentMessages} heute</span>
                    </div>
                  )}
                  {stats.unreadFromCustomer > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {stats.unreadFromCustomer} ungelesen
                    </Badge>
                  )}
                </div>
              )}

              {/* Assigned Employee */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Zugewiesener Mitarbeiter:</span>
                  {userProfile.user_type === 'admin' && (
                    <Select
                      value={customer.assigned_employee_id || 'unassigned'}
                      onValueChange={(value) => onAssignEmployee(customer.id, value === 'unassigned' ? null : value)}
                    >
                      <SelectTrigger className="w-40 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Nicht zugewiesen</SelectItem>
                        {availableEmployees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.first_name} {employee.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                {assignedEmployee ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="bg-green-600 text-white text-xs">
                        {getInitials(assignedEmployee.first_name, assignedEmployee.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {assignedEmployee.first_name} {assignedEmployee.last_name}
                    </span>
                  </div>
                ) : (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    Nicht zugewiesen
                  </Badge>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Link href={`/workspace/customers/chat/${customer.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat öffnen
                  </Button>
                </Link>
                <Link href={`/workspace/customers/${customer.id}`}>
                  <Button variant="ghost" size="sm">
                    <User className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
