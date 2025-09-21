import { Navigation } from "@/components/navigation";
import { Hero } from "@/components/hero";
import { LandingChat } from "@/components/landing-chat";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  Users,
  FileText,
  BarChart3,
  Shield,
  Zap,
  Clock,
  CheckCircle
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  const stats = [
    { value: "500+", label: "Zufriedene Kunden", icon: Users },
    { value: "50k+", label: "Verwaltete Dokumente", icon: FileText },
    { value: "99.9%", label: "Uptime", icon: Shield },
    { value: "24/7", label: "Support", icon: Clock },
  ];

  const features = [
    {
      icon: Users,
      title: "Intelligentes CRM",
      description: "Verwalten Sie alle Kundendaten, Interaktionen und Vertriebsprozesse an einem Ort.",
      benefits: ["360° Kundenansicht", "Automatisierte Workflows", "Lead-Scoring"]
    },
    {
      icon: FileText,
      title: "Dokumenten-Hub",
      description: "Zentrale Verwaltung aller Geschäftsdokumente mit fortschrittlicher Suchfunktion.",
      benefits: ["Versionskontrolle", "OCR-Texterkennung", "Sichere Cloud-Speicherung"]
    },
    {
      icon: BarChart3,
      title: "Projekt-Management",
      description: "Behalten Sie den Überblick über alle Projekte mit Echzeit-Tracking und Reporting.",
      benefits: ["Gantt-Charts", "Team-Kollaboration", "Zeiterfassung"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main>
        {/* Hero Section */}
        <Hero />

        {/* Stats Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="glass-effect p-6 rounded-lg hover:shadow-mystery transition-all duration-300 group">
                    <stat.icon className="w-8 h-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
                    <div className="text-2xl md:text-3xl font-bold text-mystery-gradient mb-2">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 bg-secondary/20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 fade-in-up">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Alles was Sie für Ihr Business brauchen
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Rising BSM V2 vereint alle wichtigen Geschäftsprozesse in einer einzigen, intuitiven Plattform.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="glass-effect border-0 hover:shadow-mystery transition-all duration-300 group fade-in-up" style={{ animationDelay: `${index * 0.2}s` }}>
                  <CardHeader>
                    <feature.icon className="w-10 h-10 text-primary mb-4 group-hover:scale-110 transition-transform duration-300" />
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="glass-effect p-12 rounded-2xl mystery-glow fade-in-up">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Bereit für die Zukunft des Business Managements?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Starten Sie noch heute mit Rising BSM V2 und erleben Sie, wie einfach modernes Business Management sein kann.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="mystery-button group">
                  <Link href="/auth/sign-up">
                    Kostenlos starten
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="glass-effect">
                  <Link href="/contact">
                    <Zap className="mr-2 w-5 h-5" />
                    Demo anfragen
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 border-t border-white/10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-mystery-gradient rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">BSM</span>
                </div>
                <span className="text-lg font-semibold">Rising BSM V2</span>
              </div>
              <div className="text-sm text-muted-foreground">
                © 2024 Rising BSM V2. Alle Rechte vorbehalten.
              </div>
              <div className="flex items-center gap-4">
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Datenschutz
                </Link>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  AGB
                </Link>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Kontakt
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </main>

      {/* Landing Page Chat */}
      <LandingChat />
    </div>
  );
}
