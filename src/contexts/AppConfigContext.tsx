import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { AppConfig } from '../types';

const DEFAULT_CONFIG: AppConfig = {
  default_theme: 'night',
  enable_focus_mode: true,
  enable_share_badge: true,
  enable_speed_controls: true,
  donation_link: '',
  donation_prompt_frequency: 5,
};

const AppConfigContext = createContext<AppConfig>(DEFAULT_CONFIG);

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    async function fetchConfig() {
      const { data } = await supabase
        .from('app_config')
        .select('key, value');

      if (data) {
        const merged = { ...DEFAULT_CONFIG };
        for (const row of data) {
          const k = row.key as keyof AppConfig;
          if (k in merged) {
            (merged as Record<string, unknown>)[k] = row.value;
          }
        }
        setConfig(merged);
      }
    }
    fetchConfig();
  }, []);

  return (
    <AppConfigContext.Provider value={config}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig() {
  return useContext(AppConfigContext);
}
