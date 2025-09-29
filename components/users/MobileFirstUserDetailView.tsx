'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  UserCheck,
  User,
  Building,
  Mail,
  Phone,
  Calendar,
  Clock,
  Globe,
  MapPin,
  Briefcase,
  Star,
  Activity,
  MessageSquare,
  FileText,
  CreditCard,
  CheckSquare,
  Zap,
  Users,
  TrendingUp,
  Target,
  Edit,
  Eye,
  Plus,
  ChevronRight,
  ArrowLeft,
  MoreVertical
} from 'lucide-react';
import Link from 'next/link';
import {
  CompleteUserData,
  getUserDisplayName,
  getUserRoleInfo,
  getUserStatusInfo,
  getLastLoginStatus,
  formatUserDate,
  getCustomerTier
} from '@/lib/user-utils';

interface MobileFirstUserDetailViewProps {
  user: CompleteUserData;
  activityLogs?: any[] | null;
  userRequests?: any[] | null;
  userTasks?: any[] | null;
  managedCustomers?: any[] | null;
  automations?: any[] | null;
  customerOrders?: any[] | null;
  customerInvoices?: any[] | null;
  customerNotes?: any[] | null;
  systemStats?: {
    totalUsers: number;
    activeUsers: number;
    totalRequests: number;
    pendingRequests: number;
    systemHealth: number;
  };
}

type TabSection = 'overview' | 'activity' | 'data' | 'actions';

export function MobileFirstUserDetailView({
  user,
  activityLogs = [],
  userRequests = [],
  userTasks = [],
  managedCustomers = [],
  automations = [],
  customerOrders = [],
  customerInvoices = [],
  customerNotes = [],
  systemStats
}: MobileFirstUserDetailViewProps) {
  const [activeTab, setActiveTab] = useState<TabSection>('overview');
  const [isExpanded, setIsExpanded] = useState(false);

  const userInfo = useMemo(() => {
    const roleInfo = getUserRoleInfo(user.profile?.user_type);
    const statusInfo = getUserStatusInfo(user);
    const lastLoginInfo = getLastLoginStatus(user.last_sign_in_at);
    const displayName = getUserDisplayName(user);

    return {
      displayName,
      roleInfo,
      statusInfo,
      lastLoginInfo
    };
  }, [user]);

  const stats = useMemo(() => {
    const requestStats = {
      total: userRequests?.length || 0,
      resolved: userRequests?.filter(req => req.status === 'resolved').length || 0,
      pending: userRequests?.filter(req => req.status === 'pending').length || 0
    };

    const taskStats = {
      total: userTasks?.length || 0,
      completed: userTasks?.filter(task => task.status === 'completed').length || 0,
      pending: userTasks?.filter(task => task.status === 'pending').length || 0,
      inProgress: userTasks?.filter(task => task.status === 'in_progress').length || 0
    };

    const customerStats = {
      total: managedCustomers?.length || 0,
      active: managedCustomers?.filter(customer => customer.status === 'active').length || 0
    };

    return { requestStats, taskStats, customerStats };
  }, [userRequests, userTasks, managedCustomers]);

  const tier = user.profile?.user_type === 'customer'
    ? getCustomerTier(stats.requestStats.total, customerOrders?.length || 0, !!user.last_sign_in_at)
    : null;

  const RoleIcon = userInfo.roleInfo.icon;
  const StatusIcon = userInfo.statusInfo.icon;
  const LastLoginIcon = userInfo.lastLoginInfo.icon;

  const quickActions = useMemo(() => {
    const actions = [];

    switch (user.profile?.user_type) {
      case 'admin':
        actions.push(
          { icon: Users, label: 'Benutzer', href: '/dashboard/users', color: 'blue' },
          { icon: Shield, label: 'System', href: '/dashboard/admin', color: 'red' },
          { icon: Activity, label: 'Berichte', href: '/dashboard/activity', color: 'purple' }
        );
        break;
      case 'employee':
        actions.push(
          { icon: CheckSquare, label: 'Aufgaben', href: '/dashboard/tasks', color: 'green' },
          { icon: Users, label: 'Kunden', href: '/dashboard/crm', color: 'purple' },
          { icon: Zap, label: 'Workflows', href: '/dashboard/automation', color: 'orange' }
        );
        break;
      case 'customer':
        actions.push(
          { icon: MessageSquare, label: 'Anfragen', href: '/portal/requests', color: 'blue' },
          { icon: FileText, label: 'Bestellungen', href: '/portal/orders', color: 'green' },
          { icon: CreditCard, label: 'Rechnungen', href: '/portal/invoices', color: 'orange' }
        );
        break;
    }

    return actions;
  }, [user.profile?.user_type]);

  const renderUserHeader = () => (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-white/10 -mx-4 -mt-4 px-4 pt-4 pb-3 mb-6">
      {/* Mobile Header */}
      <div className="flex items-center justify-between mb-3 lg:hidden">
        <Link href="/dashboard/users">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>

      {/* User Info */}
      <div className="flex items-start gap-3 mb-4">
        <div className={`relative w-16 h-16 lg:w-20 lg:h-20 rounded-2xl ${userInfo.roleInfo.bg} flex items-center justify-center ring-4 ring-white/5`}>
          <RoleIcon className={`w-8 h-8 lg:w-10 lg:h-10 ${userInfo.roleInfo.text}`} />
          {/* Status indicator */}
          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${userInfo.statusInfo.color.split(' ')[0]} border-2 border-background flex items-center justify-center`}>
            <StatusIcon className="w-3 h-3" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h1 className={`text-xl lg:text-2xl font-bold ${userInfo.roleInfo.accent} line-clamp-2 mb-1`}>
            {userInfo.displayName}
          </h1>

          {/* Role subtitle */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant={userInfo.roleInfo.variant} className="text-xs">
              <RoleIcon className="w-3 h-3 mr-1" />
              {userInfo.roleInfo.label}
            </Badge>
            {tier && (
              <Badge variant="outline" className={tier.color}>
                <tier.icon className="w-3 h-3 mr-1" />
                {tier.level}
              </Badge>
            )}
          </div>

          {/* Company/Department info */}
          {user.customer?.company_name && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
              <Building className="w-3 h-3" />
              <span className="truncate">{user.customer.company_name}</span>
            </p>
          )}
          {user.employee?.job_title && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
              <Briefcase className="w-3 h-3" />
              <span className="truncate">{user.employee.job_title}</span>
            </p>
          )}
          {user.employee?.department?.name && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Building className="w-3 h-3" />
              <span className="truncate">{user.employee.department.name}</span>
            </p>
          )}

          {/* Last login info */}
          <div className={`flex items-center gap-1 text-xs mt-2 ${userInfo.lastLoginInfo.color}`}>
            <LastLoginIcon className="w-3 h-3" />
            <span>{userInfo.lastLoginInfo.text}</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 lg:gap-4">
        {user.profile?.user_type === 'admin' && systemStats && (
          <>
            <div className="text-center p-2 lg:p-3 rounded-lg bg-blue-500/10">
              <p className="text-lg lg:text-xl font-bold text-blue-400">{systemStats.totalUsers}</p>
              <p className="text-xs text-muted-foreground">Benutzer</p>
            </div>
            <div className="text-center p-2 lg:p-3 rounded-lg bg-green-500/10">
              <p className="text-lg lg:text-xl font-bold text-green-400">{systemStats.activeUsers}</p>
              <p className="text-xs text-muted-foreground">Aktiv</p>
            </div>
            <div className="text-center p-2 lg:p-3 rounded-lg bg-orange-500/10">
              <p className="text-lg lg:text-xl font-bold text-orange-400">{systemStats.systemHealth}%</p>
              <p className="text-xs text-muted-foreground">System</p>
            </div>
          </>
        )}

        {user.profile?.user_type === 'employee' && (
          <>
            <div className="text-center p-2 lg:p-3 rounded-lg bg-green-500/10">
              <p className="text-lg lg:text-xl font-bold text-green-400">{stats.taskStats.total}</p>
              <p className="text-xs text-muted-foreground">Aufgaben</p>
            </div>
            <div className="text-center p-2 lg:p-3 rounded-lg bg-purple-500/10">
              <p className="text-lg lg:text-xl font-bold text-purple-400">{stats.customerStats.total}</p>
              <p className="text-xs text-muted-foreground">Kunden</p>
            </div>
            <div className="text-center p-2 lg:p-3 rounded-lg bg-orange-500/10">
              <p className="text-lg lg:text-xl font-bold text-orange-400">{automations?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Workflows</p>
            </div>
          </>
        )}

        {user.profile?.user_type === 'customer' && (
          <>
            <div className="text-center p-2 lg:p-3 rounded-lg bg-blue-500/10">
              <p className="text-lg lg:text-xl font-bold text-blue-400">{stats.requestStats.total}</p>
              <p className="text-xs text-muted-foreground">Anfragen</p>
            </div>
            <div className="text-center p-2 lg:p-3 rounded-lg bg-green-500/10">
              <p className="text-lg lg:text-xl font-bold text-green-400">{customerOrders?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Bestellungen</p>
            </div>
            <div className="text-center p-2 lg:p-3 rounded-lg bg-orange-500/10">
              <p className="text-lg lg:text-xl font-bold text-orange-400">{customerInvoices?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Rechnungen</p>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderOverviewTab = () => (
    <div className="space-y-4 lg:space-y-6">
      {/* Contact Information */}
      <Card className="modern-card border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Kontaktinformationen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/5 border border-white/5">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">E-Mail</p>
                  <p className="font-medium truncate">{user.email}</p>
                </div>
              </div>

              {(user.profile?.phone || user.customer?.phone) && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/5 border border-white/5">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Telefon</p>
                    <p className="font-medium">{user.profile?.phone || user.customer?.phone}</p>
                  </div>
                </div>
              )}

              {user.customer?.website && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/5 border border-white/5">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Website</p>
                    <a
                      href={user.customer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-400 hover:underline truncate block"
                    >
                      {user.customer.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/5 border border-white/5">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {user.profile?.user_type === 'customer' ? 'Kunde seit' : 'Erstellt am'}
                  </p>
                  <p className="font-medium">{formatUserDate(user.created_at)}</p>
                </div>
              </div>

              {user.employee?.hire_date && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/5 border border-white/5">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Eingestellt am</p>
                    <p className="font-medium">{formatUserDate(user.employee.hire_date)}</p>
                  </div>
                </div>
              )}

              {user.employee?.performance_rating && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/5 border border-white/5">
                  <Star className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Bewertung</p>
                    <p className="font-medium">{user.employee.performance_rating}/5</p>
                  </div>
                </div>
              )}

              {user.customer?.industry && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/5 border border-white/5">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Branche</p>
                    <p className="font-medium">{user.customer.industry}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Address for customers */}
          {user.customer && (user.customer.address_line1 || user.customer.city) && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/5 border border-white/5">
              <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Adresse</p>
                <div className="space-y-1 text-sm">
                  {user.customer.address_line1 && <div>{user.customer.address_line1}</div>}
                  {user.customer.address_line2 && <div>{user.customer.address_line2}</div>}
                  <div>
                    {user.customer.postal_code} {user.customer.city}
                  </div>
                  {user.customer.country && <div>{user.customer.country}</div>}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <Card className="modern-card border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4" />
              Schnellzugriff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {quickActions.map((action, index) => (
                <Link key={index} href={action.href}>
                  <Button
                    variant="outline"
                    className={`w-full h-16 lg:h-20 flex-col gap-2 hover:bg-${action.color}-500/10 hover:border-${action.color}-500/30`}
                  >
                    <action.icon className="w-5 h-5 lg:w-6 lg:h-6" />
                    <span className="text-xs lg:text-sm">{action.label}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderActivityTab = () => (
    <div className="space-y-4">
      {/* Recent Activity Preview */}
      {user.profile?.user_type === 'employee' && (
        <Card className="modern-card border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-green-400" />
                Aktuelle Aufgaben
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {stats.taskStats.completed}/{stats.taskStats.total}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {stats.taskStats.total > 0 ? (
              <div className="space-y-3">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(stats.taskStats.completed / stats.taskStats.total) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-400">Abgeschlossen: {stats.taskStats.completed}</span>
                  <span className="text-yellow-400">Offen: {stats.taskStats.pending + stats.taskStats.inProgress}</span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Keine Aufgaben zugewiesen</p>
            )}
          </CardContent>
        </Card>
      )}

      {user.profile?.user_type === 'customer' && (
        <Card className="modern-card border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                Anfragen-Status
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {stats.requestStats.resolved}/{stats.requestStats.total}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {stats.requestStats.total > 0 ? (
              <div className="space-y-3">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(stats.requestStats.resolved / stats.requestStats.total) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-400">Gelöst: {stats.requestStats.resolved}</span>
                  <span className="text-yellow-400">Offen: {stats.requestStats.pending}</span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Keine Anfragen vorhanden</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Items */}
      {userRequests && userRequests.length > 0 && (
        <Card className="modern-card border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Letzte Aktivitäten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userRequests.slice(0, 3).map((request, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${request.status === 'resolved' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{request.subject || 'Unbenannte Anfrage'}</p>
                    <p className="text-xs text-muted-foreground">{formatUserDate(request.created_at)}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {renderUserHeader()}

      {/* Mobile-First Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabSection)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6 lg:mb-8">
          <TabsTrigger value="overview" className="text-xs lg:text-sm">
            <Activity className="w-4 h-4 mr-1 lg:mr-2" />
            <span className="hidden sm:inline">Übersicht</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-xs lg:text-sm">
            <TrendingUp className="w-4 h-4 mr-1 lg:mr-2" />
            <span className="hidden sm:inline">Aktivität</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="text-xs lg:text-sm">
            <FileText className="w-4 h-4 mr-1 lg:mr-2" />
            <span className="hidden sm:inline">Daten</span>
          </TabsTrigger>
          <TabsTrigger value="actions" className="text-xs lg:text-sm">
            <Edit className="w-4 h-4 mr-1 lg:mr-2" />
            <span className="hidden sm:inline">Aktionen</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 lg:space-y-6">
          {renderOverviewTab()}
        </TabsContent>

        <TabsContent value="activity" className="space-y-4 lg:space-y-6">
          {renderActivityTab()}
        </TabsContent>

        <TabsContent value="data" className="space-y-4 lg:space-y-6">
          <Card className="modern-card border-0">
            <CardHeader>
              <CardTitle>Detaillierte Daten</CardTitle>
              <CardDescription>Vollständige Benutzerinformationen und Verlauf</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Detailansicht wird implementiert...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4 lg:space-y-6">
          <Card className="modern-card border-0">
            <CardHeader>
              <CardTitle>Benutzer-Aktionen</CardTitle>
              <CardDescription>Verwaltungsoptionen und Einstellungen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Button variant="outline" className="h-12 justify-start gap-3">
                  <Edit className="w-4 h-4" />
                  Benutzer bearbeiten
                </Button>
                <Button variant="outline" className="h-12 justify-start gap-3">
                  <Mail className="w-4 h-4" />
                  E-Mail senden
                </Button>
                <Button variant="outline" className="h-12 justify-start gap-3">
                  <Activity className="w-4 h-4" />
                  Aktivitätslog
                </Button>
                <Button variant="outline" className="h-12 justify-start gap-3">
                  <Shield className="w-4 h-4" />
                  Berechtigungen
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}