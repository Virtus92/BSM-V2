'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePublicSettings } from "@/lib/contexts/settings-context";
import { ArrowRight, Sparkles, Shield, Zap, Users, FileText, BarChart3 } from "lucide-react";

export function Hero() {
  const [mounted, setMounted] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    { icon: Users, text: "CRM & Kundenmanagement", color: "text-brand-purple" },
    { icon: FileText, text: "Dokumenten-Hub", color: "text-brand-blue" },
    { icon: BarChart3, text: "Projekt-Tracking", color: "text-brand-cyan" },
    { icon: Shield, text: "Enterprise Sicherheit", color: "text-brand-purple" },
  ];

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [features.length]);

  if (!mounted) return null;

  return (
    <div className="relative min-h-[80vh] flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-brand-purple/20 rounded-full blur-3xl animate-floating" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-blue/20 rounded-full blur-3xl animate-floating" style={{ animationDelay: '2s' }} />
        <div className="absolute top-3/4 left-3/4 w-64 h-64 bg-brand-cyan/20 rounded-full blur-3xl animate-floating" style={{ animationDelay: '4s' }} />
      </div>

      {/* Main Hero Content */}
      <div className="text-center max-w-5xl mx-auto relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 mystery-glow fade-in-up">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Business Service Management V2</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 fade-in-up" style={{ animationDelay: '0.2s' }}>
          <span className="text-mystery-gradient block">Rising BSM</span>
          <span className="text-2xl md:text-4xl lg:text-5xl font-normal text-muted-foreground block mt-4">
            Die Zukunft des Business Managements
          </span>
        </h1>

        {/* Subtitle with rotating features */}
        <div className="text-xl md:text-2xl text-muted-foreground mb-8 h-16 flex items-center justify-center fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-3">
            {(() => {
              const IconComponent = features[currentFeature].icon;
              return IconComponent && (
                <IconComponent className={`w-6 h-6 ${features[currentFeature].color}`} />
              );
            })()}
            <span className="transition-all duration-500 ease-in-out">
              {features[currentFeature].text}
            </span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 fade-in-up" style={{ animationDelay: '0.6s' }}>
          <Button size="lg" className="mystery-button group">
            Jetzt starten
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button size="lg" variant="outline" className="glass-effect hover:bg-primary/5 transition-all duration-300">
            <Zap className="mr-2 w-5 h-5" />
            Live Demo
          </Button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            {
              icon: Users,
              title: "CRM System",
              description: "Komplettes Kundenmanagement mit intelligenten Workflows",
              delay: "0.8s"
            },
            {
              icon: FileText,
              title: "Dokumenten-Hub",
              description: "Zentrale Verwaltung aller Geschäftsdokumente",
              delay: "1.0s"
            },
            {
              icon: BarChart3,
              title: "Projekt-Tracking",
              description: "Echzeit-Übersicht über alle laufenden Projekte",
              delay: "1.2s"
            }
          ].map((feature, index) => (
            <div
              key={index}
              className="glass-effect p-6 rounded-lg hover:shadow-mystery transition-all duration-300 group fade-in-up"
              style={{ animationDelay: feature.delay }}
            >
              <feature.icon className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-mystery-gradient opacity-50" />
    </div>
  );
}
