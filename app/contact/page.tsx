'use client';

import { useState } from "react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  CheckCircle,
  Clock,
  MessageSquare,
  Users,
  Zap
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        subject: '',
        message: ''
      });
    }, 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
                            required
                            className="glass-effect border-white/20 focus:border-primary/50 transition-all duration-300"
                            placeholder="Ihr vollständiger Name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">E-Mail *</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="glass-effect border-white/20 focus:border-primary/50 transition-all duration-300"
                            placeholder="ihre@email.de"
                          />
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
                            className="glass-effect border-white/20 focus:border-primary/50 transition-all duration-300"
                            placeholder="+49 123 456 789"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="subject">Betreff *</Label>
                        <Input
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          required
                          className="glass-effect border-white/20 focus:border-primary/50 transition-all duration-300"
                          placeholder="Worum geht es in Ihrer Nachricht?"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="message">Nachricht *</Label>
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          required
                          rows={5}
                          className="w-full px-3 py-2 bg-background/50 backdrop-blur-sm border border-white/20 rounded-lg focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300 resize-none"
                          placeholder="Beschreiben Sie Ihr Anliegen..."
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full mystery-button group"
                      >
                        {isSubmitting ? (
                          <>
                            <Clock className="mr-2 w-5 h-5 animate-spin" />
                            Wird gesendet...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            Nachricht senden
                          </>
                        )}
                      </Button>
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