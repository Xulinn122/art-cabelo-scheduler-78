import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Settings {
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  instagram: string;
  facebook: string;
  hours_weekday: string;
  hours_saturday: string;
  hours_sunday: string;
}

const defaultSettings: Settings = {
  phone: '47 9961-3570',
  whatsapp: '5547996135570',
  address: 'R Monsenhor Gercino 5207 - Jarivatuba',
  city: 'Joinville, SC',
  instagram: 'BARBEARIA.ARTCABELO',
  facebook: '',
  hours_weekday: '09:00 - 19:00',
  hours_saturday: '09:00 - 18:00',
  hours_sunday: 'Fechado',
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('key, value');

        if (error) throw error;

        if (data) {
          const settingsObj = data.reduce((acc, item) => {
            acc[item.key as keyof Settings] = item.value;
            return acc;
          }, {} as Settings);

          setSettings({ ...defaultSettings, ...settingsObj });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading };
}
