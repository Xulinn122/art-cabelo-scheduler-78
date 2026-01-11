import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Barber {
  id: string;
  name: string;
  photo_url: string | null;
  bio: string | null;
  is_active: boolean;
  created_at: string;
}

export interface BarberSchedule {
  id: string;
  barber_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function useBarbers() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBarbers = useCallback(async (activeOnly: boolean = true) => {
    setLoading(true);
    
    let query = supabase
      .from('barbers')
      .select('*')
      .order('name');
    
    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (!error && data) {
      setBarbers(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBarbers();
  }, [fetchBarbers]);

  return { barbers, loading, refetch: fetchBarbers };
}

export function useAdminBarbers() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBarbers = useCallback(async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('barbers')
      .select('*')
      .order('name');

    if (!error && data) {
      setBarbers(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBarbers();
  }, [fetchBarbers]);

  const createBarber = async (name: string, photoUrl: string | null, bio: string | null) => {
    const { data, error } = await supabase
      .from('barbers')
      .insert({ name, photo_url: photoUrl, bio })
      .select()
      .single();

    if (!error && data) {
      setBarbers(prev => [...prev, data]);
    }

    return { data, error };
  };

  const updateBarber = async (id: string, updates: Partial<Omit<Barber, 'id' | 'created_at'>>) => {
    const { data, error } = await supabase
      .from('barbers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setBarbers(prev => prev.map(b => b.id === id ? data : b));
    }

    return { data, error };
  };

  const deleteBarber = async (id: string) => {
    const { error } = await supabase
      .from('barbers')
      .delete()
      .eq('id', id);

    if (!error) {
      setBarbers(prev => prev.filter(b => b.id !== id));
    }

    return { error };
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    return updateBarber(id, { is_active: isActive });
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('barber-photos')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading photo:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('barber-photos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  return { 
    barbers, 
    loading, 
    refetch: fetchBarbers, 
    createBarber, 
    updateBarber, 
    deleteBarber, 
    toggleActive,
    uploadPhoto 
  };
}

export function useBarberSchedules(barberId: string | null) {
  const [schedules, setSchedules] = useState<BarberSchedule[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSchedules = useCallback(async () => {
    if (!barberId) {
      setSchedules([]);
      return;
    }

    setLoading(true);
    
    const { data, error } = await supabase
      .from('barber_schedules')
      .select('*')
      .eq('barber_id', barberId)
      .order('day_of_week');

    if (!error && data) {
      setSchedules(data);
    }
    setLoading(false);
  }, [barberId]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const updateSchedule = async (
    dayOfWeek: number, 
    startTime: string, 
    endTime: string, 
    isActive: boolean
  ) => {
    if (!barberId) return { error: new Error('No barber selected') };

    const { data, error } = await supabase
      .from('barber_schedules')
      .update({ start_time: startTime, end_time: endTime, is_active: isActive })
      .eq('barber_id', barberId)
      .eq('day_of_week', dayOfWeek)
      .select()
      .single();

    if (!error && data) {
      setSchedules(prev => prev.map(s => 
        s.day_of_week === dayOfWeek ? data : s
      ));
    }

    return { data, error };
  };

  const resetToDefault = async () => {
    if (!barberId) return { error: new Error('No barber selected') };

    const defaultSchedules = [
      { day: 1, start: '09:00', end: '19:00', active: true },
      { day: 2, start: '09:00', end: '19:00', active: true },
      { day: 3, start: '09:00', end: '19:00', active: true },
      { day: 4, start: '09:00', end: '19:00', active: true },
      { day: 5, start: '09:00', end: '19:00', active: true },
      { day: 6, start: '09:00', end: '18:00', active: true },
      { day: 0, start: '00:00', end: '00:00', active: false },
    ];

    const promises = defaultSchedules.map(({ day, start, end, active }) =>
      supabase
        .from('barber_schedules')
        .update({ start_time: start, end_time: end, is_active: active })
        .eq('barber_id', barberId)
        .eq('day_of_week', day)
    );

    await Promise.all(promises);
    await fetchSchedules();

    return { error: null };
  };

  return { 
    schedules, 
    loading, 
    refetch: fetchSchedules, 
    updateSchedule, 
    resetToDefault,
    getDayName: (day: number) => DAY_NAMES[day]
  };
}
