'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Clock,
  Calendar,
  User,
  Building,
  Mail,
  Phone,
  Shield,
  UserCheck,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle,
  Users,
  Briefcase
} from 'lucide-react';
import { formatUserDate, getUserDisplayName, getUserRoleInfo, getUserStatusInfo } from '@/lib/user-utils';
import { CreateUserModal } from './CreateUserModal';
import { EditUserModal } from './EditUserModal';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  profile?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    user_type: string;
    is_active?: boolean;
  };
  customer?: {
    id: string;
    company_name: string;
    contact_person: string;
    phone?: string;
    industry?: string;
  };
  employee?: {
    id: string;
    employee_id?: string;
    job_title?: string;
    department?: {
      name: string;
    };
  };
}

interface UserKanbanBoardProps {
  isWorkspace?: boolean;
}

const columns = [
  { id: 'admin', title: 'Administratoren', roles: ['admin'], color: 'bg-red-500' },
  { id: 'employee', title: 'Mitarbeiter', roles: ['employee'], color: 'bg-blue-500' },
  { id: 'customer', title: 'Kunden', roles: ['customer'], color: 'bg-purple-500' },
  { id: 'inactive', title: 'Inaktiv', roles: ['inactive'], color: 'bg-gray-500' }
];

export function UserKanbanBoard({ isWorkspace = false }: UserKanbanBoardProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actioningUser, setActioningUser] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        const list = data.users || data.data?.users || (Array.isArray(data.data) ? data.data : []);
        setUsers(list || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId: string, isActive: boolean) => {
    setActioningUser(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive }),
      });

      if (response.ok) {
        const { user } = await response.json();
        setUsers(prev =>
          prev.map(u => u.id === userId ? { ...u, profile: { ...u.profile, is_active: isActive } } : u)
        );
      } else {
        const error = await response.json();
        alert('Fehler beim Update: ' + error.error);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Fehler beim Aktualisieren des Benutzers');
    } finally {
      setActioningUser(null);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Benutzer wirklich löschen?')) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        setSelectedUser(null);
        setShowUserModal(false);
      } else {
        const error = await response.json();
        alert('Fehler beim Löschen: ' + error.error);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Fehler beim Löschen des Benutzers');
    }
  };

  const getUsersByColumn = (columnRoles: string[]) => {
    if (columnRoles.includes('inactive')) {
      // Handle both nested profile structure and flat structure
      const isActive = (user: any) => user.profile?.is_active ?? user.is_active;
      return users.filter(user =>
        isActive(user) === false ||
        (user.email_confirmed_at !== undefined && !user.email_confirmed_at)
      );
    }
    return users.filter(user => {
      // Handle both nested profile structure and flat structure
      const userType = user.profile?.user_type || user.user_type;
      const isActive = user.profile?.is_active ?? user.is_active;

      return columnRoles.includes(userType || '') &&
             isActive !== false &&
             (user.email_confirmed_at === undefined || user.email_confirmed_at);
    });
  };

  const getStatusActions = (user: User) => {
    // Handle both nested profile structure and flat structure
    const isActive = user.profile?.is_active ?? user.is_active;
    const isInactive = (user.email_confirmed_at !== undefined && !user.email_confirmed_at) ||
                      isActive === false;

    if (isInactive) {
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() => updateUserStatus(user.id, true)}
          disabled={actioningUser === user.id}
          className="bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500/20"
        >
          <CheckCircle className="w-3 h-3 mr-1" />
          Aktivieren
        </Button>
      );
    }

    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => updateUserStatus(user.id, false)}
        disabled={actioningUser === user.id}
        className="bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"
      >
        <AlertTriangle className="w-3 h-3 mr-1" />
        Deaktivieren
      </Button>
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => (
          <Card key={column.id} className="modern-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-white">
                <div className={`w-3 h-3 rounded-full ${column.color}`} />
                {column.title}
                <div className="w-6 h-4 bg-white/10 rounded animate-pulse" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-3 animate-pulse">
                  <div className="h-4 bg-white/10 rounded mb-2" />
                  <div className="h-3 bg-white/5 rounded mb-2" />
                  <div className="flex gap-2">
                    <div className="h-4 w-12 bg-white/10 rounded" />
                    <div className="h-4 w-8 bg-white/10 rounded" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Header with Create Button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">User Management</h2>
          <p className="text-white/70">Verwalten Sie Benutzer in Kategorien</p>
        </div>
        <CreateUserModal
          trigger={
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Neuer Benutzer
            </Button>
          }
          onUserCreated={(newUser) => {
            setUsers(prev => [newUser, ...prev]);
          }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => {
          const columnUsers = getUsersByColumn(column.roles);

          return (
            <Card key={column.id} className="modern-card border-0">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${column.color}`} />
                    {column.title}
                    <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                      {columnUsers.length}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {columnUsers.map((user) => {
                  const roleInfo = getUserRoleInfo(user.profile?.user_type || user.user_type);
                  const statusInfo = getUserStatusInfo(user);
                  const displayName = getUserDisplayName(user);
                  const RoleIcon = roleInfo.icon;

                  return (
                    <Link href={`/dashboard/users/${user.id}`} key={user.id}>
                      <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all cursor-pointer">
                        <CardContent className="p-3">
                        <div className="space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="text-xs bg-white/20 text-white">
                                  {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-white text-sm line-clamp-1">
                                  {displayName}
                                </h4>
                                <p className="text-xs text-white/70 truncate">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-white/50 hover:text-white h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSelectedUser(user);
                                  setShowUserModal(true);
                                }}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-400/50 hover:text-red-400 h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  deleteUser(user.id);
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Role & Status */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={`${roleInfo.bg} ${roleInfo.text} ${roleInfo.border} text-xs`}>
                              <RoleIcon className="w-3 h-3 mr-1" />
                              {roleInfo.label}
                            </Badge>
                            <Badge variant="outline" className={`${statusInfo.color} text-xs`}>
                              <statusInfo.icon className="w-3 h-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                          </div>

                          {/* Additional Info */}
                          {(user.customer?.company_name || user.employee?.job_title) && (
                            <div className="space-y-1">
                              {user.customer?.company_name && (
                                <div className="flex items-center gap-1 text-xs text-white/60">
                                  <Building className="w-3 h-3" />
                                  <span className="truncate">{user.customer.company_name}</span>
                                </div>
                              )}
                              {user.employee?.job_title && (
                                <div className="flex items-center gap-1 text-xs text-white/60">
                                  <Briefcase className="w-3 h-3" />
                                  <span className="truncate">{user.employee.job_title}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Contact & Login Info */}
                          <div className="flex items-center justify-between text-xs text-white/50">
                            <div className="flex items-center gap-2">
                              {(user.profile?.phone || user.customer?.phone) && (
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  <span>{user.profile?.phone || user.customer?.phone}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatUserDate(user.created_at)}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div onClick={(e) => e.stopPropagation()}>
                            {getStatusActions(user)}
                          </div>
                        </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}

                {columnUsers.length === 0 && (
                  <div className="text-center py-8 text-white/50">
                    <div className="text-xs">Keine Benutzer</div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit User Modal */}
      <EditUserModal
        open={showUserModal}
        onOpenChange={setShowUserModal}
        user={selectedUser}
        onUserUpdated={(updatedUser) => {
          setUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
          setSelectedUser(null);
        }}
      />
    </>
  );
}
