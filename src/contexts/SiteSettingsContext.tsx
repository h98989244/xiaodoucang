import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface SiteSettings {
  siteName: string;
  phone: string;
  address: string;
  taxId: string;
  email: string;
  loading: boolean;
}

const defaults: SiteSettings = {
  siteName: '小豆倉點卡商城',
  phone: '(02) 1234-5678',
  address: '台北市信義區信義路一段123號',
  taxId: '12345678',
  email: 'service@xiaodoucang.com',
  loading: true,
};

const SiteSettingsContext = createContext<SiteSettings>(defaults);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaults);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .single();
      if (data) {
        setSettings({
          siteName: data.site_name || defaults.siteName,
          phone: data.phone || defaults.phone,
          address: data.address || defaults.address,
          taxId: data.tax_id || defaults.taxId,
          email: data.email || defaults.email,
          loading: false,
        });
      } else {
        setSettings(prev => ({ ...prev, loading: false }));
      }
    })();
  }, []);

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
