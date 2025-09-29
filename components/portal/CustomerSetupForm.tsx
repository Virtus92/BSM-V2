'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Building, User, MapPin, Globe, ArrowRight, ArrowLeft } from 'lucide-react';
import { ErrorDisplay } from '@/components/ui/error-display';

interface CustomerSetupFormProps {
  user: any;
  profile: {
    first_name?: string;
    last_name?: string;
    user_type: string;
  };
}

export function CustomerSetupForm({ user, profile }: CustomerSetupFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // Company Information
    company_name: '',
    contact_person: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || '',
    industry: '',
    website: '',

    // Contact Information
    email: user.email,
    phone: '',

    // Address Information
    address_line1: '',
    address_line2: '',
    city: '',
    postal_code: '',
    country: 'Österreich',

    // Additional Information
    description: '',
    how_heard: '',
    special_requirements: ''
  });

  const steps = [
    {
      id: 1,
      title: 'Unternehmensdaten',
      description: 'Grundlegende Informationen über Ihr Unternehmen',
      icon: Building
    },
    {
      id: 2,
      title: 'Kontaktdaten',
      description: 'Wie können wir Sie erreichen?',
      icon: User
    },
    {
      id: 3,
      title: 'Adresse',
      description: 'Ihre Geschäftsadresse',
      icon: MapPin
    },
    {
      id: 4,
      title: 'Zusätzliche Informationen',
      description: 'Weitere Details zu Ihren Anforderungen',
      icon: Globe
    }
  ];

  const currentStepData = steps.find(step => step.id === currentStep);

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        if (!formData.company_name) {
          setError('Bitte geben Sie einen Firmennamen ein.');
          return false;
        }
        if (!formData.contact_person) {
          setError('Bitte geben Sie eine Kontaktperson ein.');
          return false;
        }
        break;
      case 2:
        if (!formData.email || !formData.email.includes('@')) {
          setError('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
          return false;
        }
        break;
      case 3:
        if (!formData.city) {
          setError('Bitte geben Sie eine Stadt ein.');
          return false;
        }
        break;
    }
    setError(null);
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/customer-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Fehler beim Speichern der Daten');
      }

      setSuccess('Ihr Kundenprofil wurde erfolgreich erstellt!');
      setTimeout(() => {
        router.push('/portal');
      }, 2000);

    } catch (error) {
      console.error('Setup error:', error);
      setError(error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="company_name">Firmenname *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="Ihre Firma GmbH"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_person">Kontaktperson *</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                placeholder="Max Mustermann"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Branche</Label>
              <Select value={formData.industry} onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Wählen Sie Ihre Branche" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technologie</SelectItem>
                  <SelectItem value="finance">Finanzwesen</SelectItem>
                  <SelectItem value="healthcare">Gesundheitswesen</SelectItem>
                  <SelectItem value="retail">Einzelhandel</SelectItem>
                  <SelectItem value="manufacturing">Produktion</SelectItem>
                  <SelectItem value="services">Dienstleistungen</SelectItem>
                  <SelectItem value="education">Bildung</SelectItem>
                  <SelectItem value="other">Andere</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://www.ihre-website.at"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail-Adresse *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="kontakt@ihre-firma.at"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefonnummer</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+43 1 234 5678"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="address_line1">Straße und Hausnummer</Label>
              <Input
                id="address_line1"
                value={formData.address_line1}
                onChange={(e) => setFormData(prev => ({ ...prev, address_line1: e.target.value }))}
                placeholder="Musterstraße 123"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address_line2">Adresszusatz</Label>
              <Input
                id="address_line2"
                value={formData.address_line2}
                onChange={(e) => setFormData(prev => ({ ...prev, address_line2: e.target.value }))}
                placeholder="2. Stock"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postleitzahl</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                  placeholder="1010"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Stadt *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Wien"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Land</Label>
              <Select value={formData.country} onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Österreich">Österreich</SelectItem>
                  <SelectItem value="Deutschland">Deutschland</SelectItem>
                  <SelectItem value="Schweiz">Schweiz</SelectItem>
                  <SelectItem value="other">Andere</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="description">Kurze Beschreibung Ihres Unternehmens</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Beschreiben Sie kurz, was Ihr Unternehmen macht..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="how_heard">Wie haben Sie von uns erfahren?</Label>
              <Select value={formData.how_heard} onValueChange={(value) => setFormData(prev => ({ ...prev, how_heard: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Bitte wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="referral">Empfehlung</SelectItem>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="search_engine">Suchmaschine</SelectItem>
                  <SelectItem value="advertisement">Werbung</SelectItem>
                  <SelectItem value="event">Veranstaltung</SelectItem>
                  <SelectItem value="other">Andere</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="special_requirements">Besondere Anforderungen oder Wünsche</Label>
              <Textarea
                id="special_requirements"
                value={formData.special_requirements}
                onChange={(e) => setFormData(prev => ({ ...prev, special_requirements: e.target.value }))}
                placeholder="Haben Sie spezielle Anforderungen oder Wünsche?"
                rows={3}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 fade-in-up">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-mystery-gradient">
          Willkommen im Kundenportal
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Lassen Sie uns Ihr Kundenprofil einrichten. Dies dauert nur wenige Minuten und hilft uns, Ihnen den bestmöglichen Service zu bieten.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;

            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200 ${
                  isCompleted
                    ? 'bg-green-500 border-green-500 text-white'
                    : isActive
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'border-gray-600 text-gray-400'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-2 transition-all duration-200 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-600'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <Card className="modern-card max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {currentStepData && <currentStepData.icon className="w-6 h-6" />}
            {currentStepData?.title}
          </CardTitle>
          <CardDescription>
            {currentStepData?.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error/Success Messages */}
          {error && (
            <ErrorDisplay
              type="error"
              message={error}
              onClose={() => setError(null)}
            />
          )}
          {success && (
            <ErrorDisplay
              type="success"
              message={success}
            />
          )}

          {/* Step Content */}
          {renderStepContent()}

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Zurück
            </Button>

            {currentStep < 4 ? (
              <Button
                onClick={handleNext}
                className="flex items-center gap-2"
              >
                Weiter
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                {isSubmitting ? 'Speichert...' : 'Profil erstellen'}
                <CheckCircle className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}