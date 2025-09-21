import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  Users,
  MessageSquare,
  BarChart3,
  TrendingUp,
  Plus,
  ArrowRight,
  Activity,
  Calendar,
  Clock,
  Zap
} from "lucide-react";
import Link from "next/link";

// ✅ Import unified types instead of local definitions
import { CustomerStats, ContactRequestStats, ActivityType } from '@/lib/shared-types';

// TODO: Import Activity from shared-types once TypeScript parsing issue is resolved
interface Activity {
  id: string
  created_at: string
  type: ActivityType
  description: string
  user_id: string | null
  user_name?: string
  entity_type?: 'customer' | 'contact_request' | 'workflow' | 'user' | 'system'
  entity_id?: string | null
}

export default async function DashboardPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/auth/login');
  }

  // Fetch dashboard statistics - Single-tenant (no workspace filter)
  const [customersResult, requestsResult] = await Promise.all([
    // Customer stats
    supabase
      .from('customers')
      .select('id, status, company_name, contact_person, created_at'),

    // Contact requests stats
    supabase
      .from('contact_requests')
      .select('id, status, created_at, subject')
  ]);

  type CustomerRow = {
    id: string
    status: string | null
    company_name: string | null
    contact_person: string | null
    created_at: string
  }
  type RequestRow = {
    id: string
    status: string | null
    created_at: string
    subject: string | null
  }
  const customers = (customersResult.data ?? []) as CustomerRow[];
  const requests = (requestsResult.data ?? []) as RequestRow[];

  // ✅ Use unified stats calculation matching shared-types.ts
  const customerStats: CustomerStats = {
    total: customers.length,
    lead: customers.filter(c => c.status === 'prospect').length,
    active: customers.filter(c => c.status === 'active').length,
    inactive: customers.filter(c => c.status === 'inactive').length,
    archived: customers.filter(c => c.status === 'archived').length,
    totalRevenue: 0, // Revenue tracking not yet implemented
    averageRevenue: 0 // Revenue tracking not yet implemented
  };

  const requestStats: ContactRequestStats = {
    total: requests.length,
    new: requests.filter(r => r.status === 'new').length,
    inProgress: requests.filter(r => r.status === 'in_progress').length,
    responded: requests.filter(r => r.status === 'responded').length,
    converted: requests.filter(r => r.status === 'converted').length,
    conversionRate: requests.length > 0 ? (requests.filter(r => r.status === 'converted').length / requests.length) * 100 : 0
  };

  // ✅ Generate real activities from actual database data
  const recentActivities: Activity[] = [
    // Recent customers (create activity for each)
    ...customers.slice(0, 3).map((customer, index) => ({
      id: `customer_${customer.id}_${index}`,
      type: 'customer_created' as ActivityType,
      description: `Kunde "${customer.company_name || customer.contact_person}" wurde angelegt`,
      created_at: customer.created_at || new Date(Date.now() - 1000 * 60 * (index + 1) * 30).toISOString(),
      user_id: user.id,
      user_name: user.email || 'System User',
      entity_type: 'customer' as const,
      entity_id: customer.id
    })),
    // Recent requests (create activity for each)
    ...requests.slice(0, 3).map((request, index) => ({
      id: `request_${request.id}_${index}`,
      type: 'request_received' as ActivityType,
      description: `Kontaktanfrage "${request.subject || 'Neue Anfrage'}" eingegangen`,
      created_at: request.created_at || new Date(Date.now() - 1000 * 60 * (index + 1) * 60).toISOString(),
      user_id: null,
      user_name: 'Website',
      entity_type: 'contact_request' as const,
      entity_id: request.id
    }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'customer_created': case 'customer_updated': case 'customer_deleted': return Users;
      case 'request_received': case 'request_updated': case 'request_converted': case 'request_responded': return MessageSquare;
      case 'workflow_executed': case 'workflow_failed': return Zap;
      case 'user_login': case 'user_logout': return Users;
      case 'system_event': return Activity;
      default: return Activity;
    }
  };

  const getActivityColor = (type: ActivityType) => {
    switch (type) {
      case 'customer_created': case 'customer_updated': return 'text-blue-500';
      case 'customer_deleted': return 'text-red-500';
      case 'request_received': case 'request_updated': return 'text-yellow-500';
      case 'request_converted': case 'request_responded': return 'text-green-500';
      case 'workflow_executed': return 'text-purple-500';
      case 'workflow_failed': return 'text-red-500';
      case 'user_login': return 'text-green-500';
      case 'user_logout': return 'text-gray-500';
      case 'system_event': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="fade-in-up">
        <div className="flex items-center justify-between bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4 lg:p-8">
          <div>
            <h1 className="text-2xl lg:text-4xl font-bold mb-3">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                Command Center
              </span>
            </h1>
            <p className="text-slate-400 text-sm lg:text-lg">
              Willkommen zurück! Hier ist eine Übersicht über Ihre Geschäftsaktivitäten.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-slate-400">Letztes Update</p>
              <p className="text-sm font-medium text-white">
                {new Date().toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Customers Card */}
        <div className="modern-card fade-in-up stagger-delay-1 group">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Kunden</p>
                <p className="text-3xl font-bold text-white">{customerStats.total}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 text-green-500">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium">{customerStats.active} aktiv</span>
            </div>
            <span className="text-slate-400">von {customerStats.total} gesamt</span>
          </div>
        </div>

        {/* Contact Requests Card */}
        <div className="modern-card fade-in-up stagger-delay-2 group">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
                <MessageSquare className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Anfragen</p>
                <p className="text-3xl font-bold text-white">{requestStats.total}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 text-yellow-500">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{requestStats.new} neu</span>
            </div>
            <span className="text-slate-400">• {requestStats.converted} konvertiert</span>
          </div>
        </div>

        {/* N8N Workflows Card */}
        <div className="modern-card fade-in-up stagger-delay-3 group">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                <Zap className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Workflows</p>
                <p className="text-3xl font-bold text-white">N/A</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 text-green-500">
              <Activity className="w-4 h-4" />
              <span className="font-medium">N/A</span>
            </div>
            <span className="text-slate-400">• N8N Integration pending</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="modern-card fade-in-up stagger-delay-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Schnelle Aktionen</h2>
            <Plus className="w-5 h-5 text-slate-400" />
          </div>

          <div className="space-y-3">
            <Link
              href="/dashboard/crm?action=create"
              className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/[0.03] transition-all duration-200 border border-transparent hover:border-white/[0.05] group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium text-sm text-white">Neuer Kunde</p>
                <p className="text-xs text-slate-400">Kundendaten erfassen</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 ml-auto group-hover:text-white transition-colors" />
            </Link>

            <Link
              href="/dashboard/requests"
              className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/[0.03] transition-all duration-200 border border-transparent hover:border-white/[0.05] group"
            >
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
                <MessageSquare className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="font-medium text-sm text-white">Anfragen bearbeiten</p>
                <p className="text-xs text-slate-400">Neue Anfragen verwalten</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 ml-auto group-hover:text-white transition-colors" />
            </Link>

            <Link
              href="/dashboard/development"
              className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/[0.03] transition-all duration-200 border border-transparent hover:border-white/[0.05] group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                <BarChart3 className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="font-medium text-sm text-white">N8N Dashboard</p>
                <p className="text-xs text-slate-400">Workflows verwalten</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 ml-auto group-hover:text-white transition-colors" />
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="modern-card fade-in-up stagger-delay-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Letzte Aktivitäten</h2>
            <Calendar className="w-5 h-5 text-slate-400" />
          </div>

          <div className="space-y-4">
            {recentActivities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              const colorClass = getActivityColor(activity.type);

              return (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/[0.02] transition-colors">
                  <div className={`w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon className={`w-4 h-4 ${colorClass}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white mb-1">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{activity.user_name}</span>
                      <span>•</span>
                      <span>
                        {new Date(activity.created_at).toLocaleDateString('de-DE', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-700/50">
            <Link
              href="/dashboard/activity"
              className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2"
            >
              Alle Aktivitäten anzeigen
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
