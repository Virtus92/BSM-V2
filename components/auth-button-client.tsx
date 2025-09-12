'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { LogOut } from "lucide-react";

export function AuthButtonClient() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="w-20 h-9 bg-muted rounded animate-pulse" />
    );
  }

  return user ? (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground hidden md:inline">
        {user.email}
      </span>
      <Button 
        size="sm" 
        variant="outline" 
        onClick={handleSignOut}
        className="gap-2"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">Abmelden</span>
      </Button>
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant="outline">
        <Link href="/auth/login">Anmelden</Link>
      </Button>
      <Button asChild size="sm" className="mystery-button">
        <Link href="/auth/sign-up">Registrieren</Link>
      </Button>
    </div>
  );
}