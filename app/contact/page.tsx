'use client';

import { useState } from "react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  CheckCircle,
  MessageSquare,
  Users,
  Zap,
  AlertCircle,
  Loader2
} from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'name':
        if (!value.trim()) {
          newErrors.name = 'Name ist erforderlich';
        } else if (value.trim().length < 2) {
          newErrors.name = 'Name muss mindestens 2 Zeichen haben';
        } else {
          delete newErrors.name;
        }
        break;
        
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value.trim()) {
          newErrors.email = 'E-Mail ist erforderlich';
        } else if (!emailRegex.test(value)) {
          newErrors.email = 'Bitte geben Sie eine gültige E-Mail-Adresse ein';
        } else {
          delete newErrors.email;
        }
        break;
        
      case 'subject':
        if (!value.trim()) {
          newErrors.subject = 'Betreff ist erforderlich';
        } else if (value.trim().length < 5) {
          newErrors.subject = 'Betreff muss mindestens 5 Zeichen haben';
        } else {
          delete newErrors.subject;
        }
        break;
        
      case 'message':
        if (!value.trim()) {
          newErrors.message = 'Nachricht ist erforderlich';
        } else if (value.trim().length < 10) {
          newErrors.message = 'Nachricht muss mindestens 10 Zeichen haben';
        } else {
          delete newErrors.message;
        }
        break;
        
      case 'phone':
        if (value.trim() && !/^[\d\s\+\-\(\)]+$/.test(value)) {
          newErrors.phone = 'Bitte geben Sie eine gültige Telefonnummer ein';
        } else {
          delete newErrors.phone;
        }
        break;
    }
    
    setErrors(newErrors);
    return !newErrors[name];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const fieldsToValidate = ['name', 'email', 'subject', 'message'];
    let isValid = true;
    
    fieldsToValidate.forEach(field => {
      const fieldIsValid = validateField(field, formData[field as keyof typeof formData]);
      if (!fieldIsValid) isValid = false;
      setTouched(prev => ({ ...prev, [field]: true }));
    });
    
    if (!isValid) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Fehler beim Senden der Nachricht');
      }

      setIsSubmitted(true);
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        subject: '',
        message: ''
      });
      setTouched({});
      setErrors({});

      // Reset success state after 5 seconds
      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Fehler beim Senden der Nachricht. Bitte versuchen Sie es erneut.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Real-time validation
    if (touched[name]) {
      validateField(name, value);
    }
  };
  
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "E-Mail",
      value: "kontakt@rising-bsm.de",
      description: "Antwort innerhalb von 24h"
    },
    {
      icon: Phone,
      title: "Telefon",
      value: "+49 (0) 123 456 789",
      description: "Mo-Fr 9:00-18:00 Uhr"
    },
    {
      icon: MapPin,
      title: "Adresse",
      value: "Musterstraße 123, 12345 Berlin",
      description: "Nach Vereinbarung"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-8">
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 mystery-glow fade-in-up">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Kontakt & Support</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 fade-in-up" style={{ animationDelay: '0.2s' }}>
              <span className="text-mystery-gradient">Sprechen Sie mit uns</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto fade-in-up" style={{ animationDelay: '0.4s' }}>
              Haben Sie Fragen zu Rising BSM V2? Benötigen Sie eine Demo? Unser Team ist hier, um Ihnen zu helfen.
            </p>
          </div>
        </section>

        {/* Contact Form & Info Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12">
              
              {/* Contact Form */}
              <Card className="glass-effect border-0 p-8 fade-in-up" style={{ animationDelay: '0.6s' }}>
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <Send className="w-6 h-6 text-primary" />
                    Nachricht senden
                  </CardTitle>
                  <CardDescription className="text-base">
                    Füllen Sie das Formular aus und wir melden uns schnellstmöglich bei Ihnen.
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="px-0 pb-0">
                  {!isSubmitted ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name *</Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            required
                            className={`glass-effect border-white/20 focus:border-primary/50 transition-all duration-300 ${
                              errors.name && touched.name ? 'border-red-500 focus:border-red-500' : ''
                            }`}
                            placeholder="Ihr vollständiger Name"
                          />
                          {errors.name && touched.name && (
                            <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                              <AlertCircle className="w-4 h-4" />
                              <span>{errors.name}</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">E-Mail *</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            required
                            className={`glass-effect border-white/20 focus:border-primary/50 transition-all duration-300 ${
                              errors.email && touched.email ? 'border-red-500 focus:border-red-500' : ''
                            }`}
                            placeholder="ihre@email.de"
                          />
                          {errors.email && touched.email && (
                            <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                              <AlertCircle className="w-4 h-4" />
                              <span>{errors.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="company">Unternehmen</Label>
                          <Input
                            id="company"
                            name="company"
                            value={formData.company}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className="glass-effect border-white/20 focus:border-primary/50 transition-all duration-300"
                            placeholder="Ihr Unternehmen"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Telefon</Label>
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className={`glass-effect border-white/20 focus:border-primary/50 transition-all duration-300 ${
                              errors.phone && touched.phone ? 'border-red-500 focus:border-red-500' : ''
                            }`}
                            placeholder="+49 123 456 789"
                          />
                          {errors.phone && touched.phone && (
                            <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                              <AlertCircle className="w-4 h-4" />
                              <span>{errors.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="subject">Betreff *</Label>
                        <Input
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          required
                          className={`glass-effect border-white/20 focus:border-primary/50 transition-all duration-300 ${
                            errors.subject && touched.subject ? 'border-red-500 focus:border-red-500' : ''
                          }`}
                          placeholder="Worum geht es in Ihrer Nachricht?"
                        />
                        {errors.subject && touched.subject && (
                          <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                            <AlertCircle className="w-4 h-4" />
                            <span>{errors.subject}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="message">Nachricht *</Label>
                        <Textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          required
                          rows={5}
                          className={`glass-effect border-white/20 focus:border-primary/50 transition-all duration-300 resize-none ${
                            errors.message && touched.message ? 'border-red-500 focus:border-red-500' : ''
                          }`}
                          placeholder="Beschreiben Sie Ihr Anliegen..."
                        />
                        {errors.message && touched.message && (
                          <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                            <AlertCircle className="w-4 h-4" />
                            <span>{errors.message}</span>
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        type="submit" 
                        disabled={isSubmitting || Object.keys(errors).length > 0}
                        className="w-full mystery-button group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                            Wird gesendet...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            Nachricht senden
                          </>
                        )}
                      </Button>
                      
                      {/* Form validation summary */}
                      {Object.keys(errors).length > 0 && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-red-500 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            <span>Bitte korrigieren Sie die Fehler oben</span>
                          </div>
                        </div>
                      )}
                    </form>
                  ) : (
                    <div className="text-center py-12 fade-in-up">
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Nachricht gesendet!</h3>
                      <p className="text-muted-foreground">
                        Vielen Dank für Ihre Nachricht. Wir melden uns schnellstmöglich bei Ihnen.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Contact Information */}
              <div className="space-y-8">
                <div className="fade-in-up" style={{ animationDelay: '0.8s' }}>
                  <h2 className="text-2xl font-bold mb-6">Kontaktinformationen</h2>
                  <div className="space-y-6">
                    {contactInfo.map((info, index) => (
                      <Card key={index} className="glass-effect border-0 p-6 hover:shadow-mystery transition-all duration-300 group">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 group-hover:shadow-mystery transition-all duration-300">
                            <info.icon className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold mb-1">{info.title}</h3>
                            <p className="text-primary font-medium mb-1">{info.value}</p>
                            <p className="text-sm text-muted-foreground">{info.description}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="fade-in-up" style={{ animationDelay: '1.0s' }}>
                  <h3 className="text-xl font-semibold mb-4">Schnelle Aktionen</h3>
                  <div className="grid gap-4">
                    <Button variant="outline" className="glass-effect justify-start h-auto p-4 group">
                      <Zap className="mr-3 w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                        <div className="font-medium">Demo anfragen</div>
                        <div className="text-sm text-muted-foreground">Live-Präsentation vereinbaren</div>
                      </div>
                    </Button>
                    
                    <Button variant="outline" className="glass-effect justify-start h-auto p-4 group">
                      <Users className="mr-3 w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                        <div className="font-medium">Beratungstermin</div>
                        <div className="text-sm text-muted-foreground">Individuelle Beratung buchen</div>
                      </div>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-4 bg-secondary/20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 fade-in-up">
              <h2 className="text-3xl font-bold mb-4">Häufige Fragen</h2>
              <p className="text-xl text-muted-foreground">
                Die wichtigsten Antworten auf einen Blick
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  q: "Wie schnell erhalte ich eine Antwort?",
                  a: "Wir antworten in der Regel innerhalb von 24 Stunden auf alle Anfragen."
                },
                {
                  q: "Ist eine Demo kostenlos?",
                  a: "Ja, wir bieten kostenlose Live-Demos für alle Interessenten an."
                },
                {
                  q: "Welche Integrationsmöglichkeiten gibt es?",
                  a: "Rising BSM V2 bietet umfangreiche API-Integrationen und Standard-Schnittstellen."
                },
                {
                  q: "Wie funktioniert der Support?",
                  a: "Unser Support-Team steht Ihnen per E-Mail, Telefon und Live-Chat zur Verfügung."
                }
              ].map((faq, index) => (
                <Card key={index} className="glass-effect border-0 p-6 fade-in-up" style={{ animationDelay: `${1.2 + index * 0.1}s` }}>
                  <CardHeader className="px-0 pt-0 pb-3">
                    <CardTitle className="text-lg">{faq.q}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    <p className="text-muted-foreground">{faq.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}