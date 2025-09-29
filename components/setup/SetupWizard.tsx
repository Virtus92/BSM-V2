'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  User,
  Settings,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Lock,
  UserCheck,
  Database,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useActivityLogger } from '@/lib/hooks/use-activity-logger';

interface SetupWizardProps {
  currentUser: SupabaseUser | null;
}

type SetupStep = 'welcome' | 'auth' | 'admin' | 'security' | 'complete';

interface AdminSetupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface SecuritySettings {
  allowRegistration: boolean;
  requireAdminApproval: boolean;
  requireEmailVerification: boolean;
  enforceStrongPasswords: boolean;
  sessionTimeoutHours: number;
  maxFailedAttempts: number;
}

export function SetupWizard({ currentUser }: SetupWizardProps) {
  const router = useRouter();
  const supabase = createClient();
  const { logClientActivity } = useActivityLogger();

  const [currentStep, setCurrentStep] = useState<SetupStep>('welcome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form data
  const [adminData, setAdminData] = useState<AdminSetupData>({
    firstName: '',
    lastName: '',
    email: currentUser?.email || '',
    password: '',
    confirmPassword: ''
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    allowRegistration: false,
    requireAdminApproval: true,
    requireEmailVerification: true,
    enforceStrongPasswords: true,
    sessionTimeoutHours: 8,
    maxFailedAttempts: 5
  });

  // Step validation
  const canProceedFromAuth = currentUser !== null;
  const canProceedFromAdmin =
    adminData.firstName.trim() !== '' &&
    adminData.lastName.trim() !== '' &&
    adminData.email.trim() !== '' &&
    (!currentUser ? (
      adminData.password.length >= 8 &&
      adminData.password === adminData.confirmPassword
    ) : true);

  const steps = [
    { id: 'welcome', title: 'Willkommen', icon: Shield },
    { id: 'auth', title: 'Authentifizierung', icon: User },
    { id: 'admin', title: 'Administrator', icon: UserCheck },
    { id: 'security', title: 'Sicherheit', icon: Lock },
    { id: 'complete', title: 'Abschluss', icon: CheckCircle }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  const handleSignUp = async () => {
    if (currentUser) return;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email: adminData.email,
        password: adminData.password,
        options: {
          data: {
            first_name: adminData.firstName,
            last_name: adminData.lastName,
            setup_mode: true
          }
        }
      });

      if (error) throw error;

      // The user should now be logged in automatically
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentStep('admin');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler bei der Registrierung');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSetup = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kein authentifizierter Benutzer');

      // Call the setup completion function
      const { error } = await supabase.rpc('complete_system_setup', {
        p_admin_user_id: user.id,
        p_allow_registration: securitySettings.allowRegistration,
        p_require_admin_approval: securitySettings.requireAdminApproval
      });

      if (error) throw error;

      // Log setup completion
      await logClientActivity(
        'SETUP_COMPLETE',
        'system',
        undefined,
        {
          admin_user_id: user.id,
          security_settings: securitySettings
        }
      );

      setCurrentStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Abschließen der Einrichtung');
    } finally {
      setLoading(false);
    }
  };

  const renderWelcomeStep = () => (
    <Card className="modern-card border-0">
      <CardHeader className="text-center pb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Systemeinrichtung</CardTitle>
        <CardDescription className="text-base">
          Richten Sie Ihr BSM V2 System mit professionellen Sicherheitsstandards ein
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <UserCheck className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <h3 className="font-medium text-blue-300">Admin-Account</h3>
            <p className="text-sm text-blue-200">Erstellen Sie den ersten Administrator</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <Lock className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <h3 className="font-medium text-purple-300">Sicherheit</h3>
            <p className="text-sm text-purple-200">Konfigurieren Sie Sicherheitsrichtlinien</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <Database className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <h3 className="font-medium text-green-300">System</h3>
            <p className="text-sm text-green-200">Aktivieren Sie das BSM System</p>
          </div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <span className="font-medium text-yellow-300">Wichtiger Hinweis</span>
          </div>
          <p className="text-sm text-yellow-200">
            Diese Einrichtung ist nur einmalig möglich. Stellen Sie sicher, dass Sie die Admin-Zugangsdaten sicher aufbewahren.
          </p>
        </div>

        <Button
          onClick={() => setCurrentStep('auth')}
          className="w-full mystery-button"
        >
          Einrichtung starten
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );

  const renderAuthStep = () => (
    <Card className="modern-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Authentifizierung
        </CardTitle>
        <CardDescription>
          {currentUser
            ? 'Sie sind bereits angemeldet und können fortfahren'
            : 'Melden Sie sich an oder erstellen Sie einen neuen Admin-Account'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {currentUser ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="font-medium text-green-300">Angemeldet als</span>
            </div>
            <p className="text-green-200">{currentUser.email}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Erstellen Sie den ersten Administrator-Account für das System:
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Vorname *</label>
                <Input
                  value={adminData.firstName}
                  onChange={(e) => setAdminData({...adminData, firstName: e.target.value})}
                  placeholder="Ihr Vorname"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nachname *</label>
                <Input
                  value={adminData.lastName}
                  onChange={(e) => setAdminData({...adminData, lastName: e.target.value})}
                  placeholder="Ihr Nachname"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">E-Mail Adresse *</label>
              <Input
                type="email"
                value={adminData.email}
                onChange={(e) => setAdminData({...adminData, email: e.target.value})}
                placeholder="admin@ihr-unternehmen.de"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Passwort *</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={adminData.password}
                  onChange={(e) => setAdminData({...adminData, password: e.target.value})}
                  placeholder="Sicheres Passwort (min. 8 Zeichen)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Passwort bestätigen *</label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={adminData.confirmPassword}
                onChange={(e) => setAdminData({...adminData, confirmPassword: e.target.value})}
                placeholder="Passwort wiederholen"
              />
            </div>

            {adminData.password && adminData.confirmPassword && adminData.password !== adminData.confirmPassword && (
              <p className="text-sm text-red-400">Passwörter stimmen nicht überein</p>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setCurrentStep('welcome')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          <Button
            onClick={currentUser ? () => setCurrentStep('admin') : handleSignUp}
            disabled={!canProceedFromAuth || loading}
            className="flex-1 mystery-button"
          >
            {loading ? 'Wird erstellt...' : currentUser ? 'Weiter' : 'Admin erstellen'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderAdminStep = () => (
    <Card className="modern-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          Administrator-Profil
        </CardTitle>
        <CardDescription>
          Vervollständigen Sie Ihr Administrator-Profil
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <span className="font-medium text-blue-300">Administrator-Rolle</span>
          </div>
          <p className="text-sm text-blue-200">
            Als Administrator haben Sie vollständigen Zugriff auf alle Systemfunktionen:
          </p>
          <ul className="text-sm text-blue-200 mt-2 space-y-1">
            <li>• Benutzerverwaltung und Rollenzuweisung</li>
            <li>• Vollständiger CRM und Anfragenzugriff</li>
            <li>• Systemkonfiguration und Sicherheitseinstellungen</li>
            <li>• Aktivitätsprotokolle und Berichte</li>
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Vorname *</label>
            <Input
              value={adminData.firstName}
              onChange={(e) => setAdminData({...adminData, firstName: e.target.value})}
              placeholder="Ihr Vorname"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nachname *</label>
            <Input
              value={adminData.lastName}
              onChange={(e) => setAdminData({...adminData, lastName: e.target.value})}
              placeholder="Ihr Nachname"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">E-Mail Adresse</label>
          <Input
            type="email"
            value={adminData.email}
            onChange={(e) => setAdminData({...adminData, email: e.target.value})}
            placeholder="admin@ihr-unternehmen.de"
            disabled={!!currentUser}
          />
          {currentUser && (
            <p className="text-xs text-muted-foreground">
              E-Mail kann nach der Anmeldung nicht geändert werden
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setCurrentStep('auth')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          <Button
            onClick={() => setCurrentStep('security')}
            disabled={!canProceedFromAdmin}
            className="flex-1 mystery-button"
          >
            Weiter zu Sicherheitseinstellungen
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderSecurityStep = () => (
    <Card className="modern-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Sicherheitseinstellungen
        </CardTitle>
        <CardDescription>
          Konfigurieren Sie die Sicherheitsrichtlinien für Ihr System
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-white/10">
            <div>
              <h4 className="font-medium">Benutzerregistrierung erlauben</h4>
              <p className="text-sm text-muted-foreground">
                Neue Benutzer können sich selbst registrieren
              </p>
            </div>
            <input
              type="checkbox"
              checked={securitySettings.allowRegistration}
              onChange={(e) => setSecuritySettings({
                ...securitySettings,
                allowRegistration: e.target.checked
              })}
              className="w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-white/10">
            <div>
              <h4 className="font-medium">Admin-Genehmigung erforderlich</h4>
              <p className="text-sm text-muted-foreground">
                Neue Benutzer müssen von einem Admin aktiviert werden
              </p>
            </div>
            <input
              type="checkbox"
              checked={securitySettings.requireAdminApproval}
              onChange={(e) => setSecuritySettings({
                ...securitySettings,
                requireAdminApproval: e.target.checked
              })}
              className="w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-white/10">
            <div>
              <h4 className="font-medium">E-Mail-Verifizierung</h4>
              <p className="text-sm text-muted-foreground">
                E-Mail-Adresse muss verifiziert werden
              </p>
            </div>
            <input
              type="checkbox"
              checked={securitySettings.requireEmailVerification}
              onChange={(e) => setSecuritySettings({
                ...securitySettings,
                requireEmailVerification: e.target.checked
              })}
              className="w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-white/10">
            <div>
              <h4 className="font-medium">Starke Passwörter erzwingen</h4>
              <p className="text-sm text-muted-foreground">
                Mindestens 8 Zeichen mit Sonderzeichen
              </p>
            </div>
            <input
              type="checkbox"
              checked={securitySettings.enforceStrongPasswords}
              onChange={(e) => setSecuritySettings({
                ...securitySettings,
                enforceStrongPasswords: e.target.checked
              })}
              className="w-4 h-4"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Session-Timeout (Stunden)</label>
            <Input
              type="number"
              min="1"
              max="24"
              value={securitySettings.sessionTimeoutHours}
              onChange={(e) => setSecuritySettings({
                ...securitySettings,
                sessionTimeoutHours: parseInt(e.target.value)
              })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Max. Fehlversuche</label>
            <Input
              type="number"
              min="3"
              max="10"
              value={securitySettings.maxFailedAttempts}
              onChange={(e) => setSecuritySettings({
                ...securitySettings,
                maxFailedAttempts: parseInt(e.target.value)
              })}
            />
          </div>
        </div>

        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <span className="font-medium text-orange-300">Empfehlung</span>
          </div>
          <p className="text-sm text-orange-200">
            Für maximale Sicherheit empfehlen wir: Registrierung deaktiviert, Admin-Genehmigung aktiviert,
            starke Passwörter erzwungen.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setCurrentStep('admin')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          <Button
            onClick={handleCompleteSetup}
            disabled={loading}
            className="flex-1 mystery-button"
          >
            {loading ? 'System wird eingerichtet...' : 'Einrichtung abschließen'}
            <CheckCircle className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderCompleteStep = () => (
    <Card className="modern-card border-0">
      <CardHeader className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <CardTitle className="text-2xl text-green-300">Einrichtung abgeschlossen!</CardTitle>
        <CardDescription>
          Ihr BSM V2 System ist jetzt bereit für den Einsatz
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <h3 className="font-medium text-blue-300 mb-2">Administrator erstellt</h3>
            <p className="text-sm text-blue-200">
              Sie sind jetzt als System-Administrator angemeldet
            </p>
          </div>
          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <h3 className="font-medium text-purple-300 mb-2">Sicherheit konfiguriert</h3>
            <p className="text-sm text-purple-200">
              Alle Sicherheitsrichtlinien wurden angewendet
            </p>
          </div>
        </div>

        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <h3 className="font-medium text-green-300 mb-2">Nächste Schritte:</h3>
          <ul className="text-sm text-green-200 space-y-1">
            <li>• Zusätzliche Benutzer und Mitarbeiter einladen</li>
            <li>• Kundendaten importieren oder anlegen</li>
            <li>• Systemeinstellungen nach Bedarf anpassen</li>
            <li>• Backup-Strategien implementieren</li>
          </ul>
        </div>

        <Button
          onClick={() => router.push('/dashboard')}
          className="w-full mystery-button"
        >
          Zum Dashboard
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcomeStep();
      case 'auth':
        return renderAuthStep();
      case 'admin':
        return renderAdminStep();
      case 'security':
        return renderSecurityStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return renderWelcomeStep();
    }
  };

  return (
    <div className="space-y-8">
      {/* Progress indicator */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = index < currentStepIndex;
            const StepIcon = step.icon;

            return (
              <div key={step.id} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                  ${isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : isCompleted
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-600 bg-gray-800 text-gray-400'
                  }
                `}>
                  <StepIcon className="w-5 h-5" />
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    w-16 h-0.5 ml-4 transition-all
                    ${isCompleted ? 'bg-green-500' : 'bg-gray-600'}
                  `} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current step indicator */}
      <div className="text-center">
        <Badge variant="outline" className="mb-2">
          Schritt {currentStepIndex + 1} von {steps.length}
        </Badge>
        <h2 className="text-xl font-semibold text-white">
          {steps[currentStepIndex]?.title}
        </h2>
      </div>

      {/* Step content */}
      {renderCurrentStep()}
    </div>
  );
}