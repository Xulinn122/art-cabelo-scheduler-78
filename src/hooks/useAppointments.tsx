import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  appointment_date: string;
  appointment_time: string;
  status: string;
  user_id: string | null;
  created_at: string;
  services?: Service;
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

export function useAvailableSlots(date: string, serviceDuration: number = 30) {
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (date) {
      fetchAvailableSlots();
    }
  }, [date, serviceDuration]);

  const fetchAvailableSlots = async () => {
    setLoading(true);
    
    // Working hours: 9:00 - 19:00
    const allSlots = generateTimeSlots('09:00', '19:00', 30);
    
    // Fetch booked appointments for the date
    const { data: bookedAppointments, error } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('appointment_date', date)
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
  };

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
        services (*)
      `)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (!error && data) {
      setAppointments(data);
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
