'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { AllSystemSettings } from '@/lib/settings-types';

interface SettingsContextType {
  settings: AllSystemSettings | null;
  publicSettings: Partial<AllSystemSettings> | null;
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
  updateSetting: (category: keyof AllSystemSettings, key: string, value: any) => void;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  publicSettings: null,
  loading: true,
  error: null,
  refreshSettings: async () => {},
  updateSetting: () => {}
});

interface SettingsProviderProps {
  children: ReactNode;
  isAdmin?: boolean;
  initialSettings?: AllSystemSettings | null;
}

export function SettingsProvider({ children, isAdmin = false, initialSettings = null }: SettingsProviderProps) {
  const [settings, setSettings] = useState<AllSystemSettings | null>(initialSettings);
  const [publicSettings, setPublicSettings] = useState<Partial<AllSystemSettings> | null>(null);
  const [loading, setLoading] = useState(!initialSettings);
  const [error, setError] = useState<string | null>(null);

  const loadPublicSettings = async () => {
    try {
      const response = await fetch('/api/settings/public', {
        cache: 'force-cache',
        next: { revalidate: 300 } // Cache for 5 minutes
      });

      if (!response.ok) {
        throw new Error(`Failed to load public settings: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setPublicSettings(result.data);
      }
    } catch (err) {
      console.error('Error loading public settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load public settings');
    }
  };

  const loadSystemSettings = async () => {
    if (!isAdmin) return;

    try {
      const response = await fetch('/api/settings/system');

      if (!response.ok) {
        throw new Error(`Failed to load system settings: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setSettings(result.data);
      } else {
        throw new Error(result.error || 'Failed to load system settings');
      }
    } catch (err) {
      console.error('Error loading system settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load system settings');
    }
  };

  const refreshSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        loadPublicSettings(),
        isAdmin ? loadSystemSettings() : Promise.resolve()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (category: keyof AllSystemSettings, key: string, value: any) => {
    // Optimistic update for immediate UI feedback
    if (settings) {
      setSettings(prev => prev ? {
        ...prev,
        [category]: {
          ...prev[category],
          [key]: value
        }
      } : null);
    }

    // Also update public settings if this is a public setting
    if (publicSettings && publicSettings[category]) {
      setPublicSettings(prev => prev ? {
        ...prev,
        [category]: {
          ...prev[category],
          [key]: value
        }
      } : null);
    }
  };

  useEffect(() => {
    if (!initialSettings) {
      refreshSettings();
    } else {
      loadPublicSettings(); // Always load public settings
    }
  }, [isAdmin]);

  // Inject CSS variables when settings change
  useEffect(() => {
    if (publicSettings?.display) {
      const root = document.documentElement;

      if (publicSettings.display.primary_color) {
        // Convert hex to HSL for CSS variables
        const primaryHSL = hexToHSL(publicSettings.display.primary_color);
        root.style.setProperty('--primary', primaryHSL);
      }

      if (publicSettings.display.secondary_color) {
        const secondaryHSL = hexToHSL(publicSettings.display.secondary_color);
        root.style.setProperty('--secondary', secondaryHSL);
      }
    }
  }, [publicSettings?.display]);

  const value: SettingsContextType = {
    settings,
    publicSettings,
    loading,
    error,
    refreshSettings,
    updateSetting
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const usePublicSettings = () => {
  const { publicSettings, loading, error } = useSettings();
  return { settings: publicSettings, loading, error };
};

// Utility function to convert hex to HSL for CSS variables
function hexToHSL(hex: string): string {
  // Remove the hash if present
  hex = hex.replace('#', '');

  // Convert hex to RGB
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  // Find the maximum and minimum values
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  // Convert to degrees and percentages
  const hDeg = Math.round(h * 360);
  const sPercent = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  return `${hDeg} ${sPercent}% ${lPercent}%`;
}