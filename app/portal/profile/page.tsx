import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  User,
  Mail,
  Building,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Edit,
  Save
} from 'lucide-react';

export default async function CustomerProfile() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type, first_name, last_name, is_active, created_at')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/auth/login');
  }

  if (profile.user_type !== 'customer') {
    // Redirect non-customers to their appropriate area
    if (profile.user_type === 'employee') {
      redirect('/workspace');
    } else if (profile.user_type === 'admin') {
      redirect('/workspace'); // Admins can use workspace too
    } else {
      redirect('/auth/login');
    }
  }

  // Get customer data
  const admin = createAdminClient();
  const { data: customer } = await admin
    .from('customers')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fallback to user client if admin did not return a row
  let customerRow = customer
  if (!customerRow) {
    const { data: userCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    customerRow = userCustomer as any
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profil verwalten</h1>
            <p className="text-slate-400">
              Verwalten Sie Ihre Kontaktdaten und Profileinstellungen
            </p>
          </div>
          <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
            <Shield className="w-3 h-3 mr-1" />
            Kunde
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Account Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Grundinformationen
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Ihre persönlichen und Unternehmensdaten
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" action="/api/portal/profile" method="post">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name" className="text-slate-300">Vorname</Label>
                      <Input
                        id="first_name"
                        name="first_name"
                        defaultValue={profile.first_name || ''}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="Ihr Vorname"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name" className="text-slate-300">Nachname</Label>
                      <Input
                        id="last_name"
                        name="last_name"
                        defaultValue={profile.last_name || ''}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="Ihr Nachname"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">E-Mail-Adresse</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                    defaultValue={customerRow?.email || user.email || ''}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="ihre@email.de"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company_name" className="text-slate-300">Firmenname</Label>
                    <Input
                      id="company_name"
                      name="company_name"
                      defaultValue={customer?.company_name || ''}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="Ihr Unternehmen"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-300">Telefonnummer</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                    defaultValue={customerRow?.phone || ''}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="+49 123 456789"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address_line1" className="text-slate-300">Straße und Nr.</Label>
                      <Input
                        id="address_line1"
                        name="address_line1"
                        defaultValue={customerRow?.address_line1 || ''}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="Musterstraße 1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address_line2" className="text-slate-300">Adresszusatz</Label>
                      <Input
                        id="address_line2"
                        name="address_line2"
                        defaultValue={customerRow?.address_line2 || ''}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="2. Stock / Top 5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postal_code" className="text-slate-300">PLZ</Label>
                      <Input
                        id="postal_code"
                        name="postal_code"
                        defaultValue={customerRow?.postal_code || ''}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="1010"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-slate-300">Stadt</Label>
                      <Input
                        id="city"
                        name="city"
                        defaultValue={customerRow?.city || ''}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="Wien"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="country" className="text-slate-300">Land</Label>
                      <Input
                        id="country"
                        name="country"
                        defaultValue={customerRow?.country || ''}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="Österreich"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500">
                    <Save className="w-4 h-4 mr-2" />
                    Profil speichern
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Account Summary */}
          <div className="space-y-6">
            {/* Account Status */}
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Kontostatus
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Status</span>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                    {customerRow?.status === 'active' ? 'Aktiv' : customerRow?.status || 'Unbekannt'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Kontotyp</span>
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
                    Kunde
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Mitglied seit</span>
                  <span className="text-sm text-white">
                    {new Date(profile.created_at).toLocaleDateString('de-DE')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Kontakt
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300">
                    {customerRow?.email || user.email || 'Keine E-Mail'}
                  </span>
                </div>

                {customerRow?.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">{customerRow.phone}</span>
                  </div>
                )}

                {customerRow?.company_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">{customerRow.company_name}</span>
                  </div>
                )}

                {(customerRow?.address_line1 || customerRow?.city) && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">
                      {customerRow?.address_line1}
                      {customerRow?.address_line2 ? `, ${customerRow.address_line2}` : ''}
                      {(customerRow?.postal_code || customerRow?.city) ? `, ${customerRow?.postal_code || ''} ${customerRow?.city || ''}` : ''}
                      {customerRow?.country ? `, ${customerRow.country}` : ''}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Support */}
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader>
                <CardTitle>Support</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-400">
                  Benötigen Sie Hilfe oder haben Fragen?
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <a href="/portal">
                    Neue Anfrage erstellen
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
