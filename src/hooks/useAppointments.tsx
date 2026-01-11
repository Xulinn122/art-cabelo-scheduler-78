import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Barber } from './useBarbers';

export interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
}

export interface Appointment {
  id: string;
  client_name: string;
  client_phone: string;
  service_id: string | null;
  barber_id: string | null;
  appointment_date: string;
  appointment_time: string;
  status: string;
  user_id: string | null;
  created_at: string;
  services?: Service;
  barbers?: Barber;
}

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true);

    if (!error && data) {
      setServices(data);
    }
    setLoading(false);
  };

  return { services, loading };
}

export function useAvailableSlots(
  date: string, 
  barberId: string | null,
  serviceDuration: number = 30
) {
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAvailableSlots = useCallback(async () => {
    if (!date || !barberId) {
      setAvailableSlots([]);
      return;
    }

    setLoading(true);
    
    // Get the day of week for the selected date
    const selectedDate = new Date(date + 'T12:00:00');
    const dayOfWeek = selectedDate.getDay();

    // Fetch barber's schedule for this day
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('barber_schedules')
      .select('*')
      .eq('barber_id', barberId)
      .eq('day_of_week', dayOfWeek)
      .single();

    if (scheduleError || !scheduleData || !scheduleData.is_active) {
      setAvailableSlots([]);
      setLoading(false);
      return;
    }

    // Generate slots based on barber's working hours
    const allSlots = generateTimeSlots(
      scheduleData.start_time.slice(0, 5), 
      scheduleData.end_time.slice(0, 5), 
      30
    );
    
    // Fetch booked appointments for this barber on this date
    const { data: bookedAppointments, error } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('appointment_date', date)
      .eq('barber_id', barberId)
      .neq('status', 'cancelled');

    if (error) {
      console.error('Error fetching appointments:', error);
      setLoading(false);
      return;
    }

    const bookedTimes = bookedAppointments?.map(apt => apt.appointment_time) || [];
    const available = allSlots.filter(slot => !bookedTimes.includes(slot));
    
    setAvailableSlots(available);
    setLoading(false);
  }, [date, barberId, serviceDuration]);

  useEffect(() => {
    fetchAvailableSlots();
  }, [fetchAvailableSlots]);

  return { availableSlots, loading, refetch: fetchAvailableSlots };
}

function generateTimeSlots(start: string, end: string, intervalMinutes: number): string[] {
  const slots: string[] = [];
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);

  let currentHour = startHour;
  let currentMin = startMin;

  while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
    slots.push(
      `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}:00`
    );

    currentMin += intervalMinutes;
    if (currentMin >= 60) {
      currentHour += Math.floor(currentMin / 60);
      currentMin = currentMin % 60;
    }
  }

  return slots;
}

export function useCreateAppointment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAppointment = async (
    clientName: string,
    clientPhone: string,
    serviceId: string,
    barberId: string,
    appointmentDate: string,
    appointmentTime: string,
    userId?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from('appointments')
        .insert({
          client_name: clientName,
          client_phone: clientPhone,
          service_id: serviceId,
          barber_id: barberId,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          user_id: userId || null,
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          setError('Este horário já está ocupado. Por favor, escolha outro horário.');
        } else {
          setError('Erro ao criar agendamento. Tente novamente.');
        }
        setLoading(false);
        return { success: false, data: null };
      }

      setLoading(false);
      return { success: true, data };
    } catch (err) {
      setError('Erro inesperado. Tente novamente.');
      setLoading(false);
      return { success: false, data: null };
    }
  };

  return { createAppointment, loading, error, setError };
}

export function useAdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        services (*),
        barbers (*)
      `)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (!error && data) {
      setAppointments(data as Appointment[]);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id);

    if (!error) {
      setAppointments(prev =>
        prev.map(apt => (apt.id === id ? { ...apt, status } : apt))
      );
    }

    return { error };
  };

  const deleteAppointment = async (id: string) => {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (!error) {
      setAppointments(prev => prev.filter(apt => apt.id !== id));
    }

    return { error };
  };

  return { appointments, loading, refetch: fetchAppointments, updateStatus, deleteAppointment };
}
