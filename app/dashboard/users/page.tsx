import { createClient } from '@/lib/supabase/server';
import { adminUserOperations, requireAdminUser, createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserKanbanBoard } from '@/components/users/UserKanbanBoard';
import {
  Users,
  Shield,
  CheckCircle,
  Clock,
  User,
  Plus,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { CompleteUserData } from '@/lib/user-utils';


export default async function UsersManagement() {
  const supabase = await createClient();

  // Check if user is admin
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/auth/login');
  }

  try {
    await requireAdminUser(user.id);
  } catch (error) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-3">
              <span className="text-mystery-gradient">Benutzerverwaltung</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Kanban Board für effiziente Benutzerverwaltung
            </p>
          </div>
        </div>
      </div>

      {/* User Kanban Board */}
      <div className="fade-in-up">
        <UserKanbanBoard />
      </div>
    </div>
  );
}
