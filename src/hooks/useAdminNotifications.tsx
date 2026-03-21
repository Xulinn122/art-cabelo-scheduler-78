import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useAdminNotifications() {
  const permissionGranted = useRef(false);

  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      permissionGranted.current = true;
      return;
    }

    if (Notification.permission !== 'denied') {
      const result = await Notification.requestPermission();
      permissionGranted.current = result === 'granted';
    }
  };

  useEffect(() => {
    requestPermission();

    const channel = supabase
      .channel('admin-new-appointments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
        },
        async (payload) => {
          const apt = payload.new as any;
          const title = 'Novo Agendamento!';
          const body = `${apt.client_name} quer agendar para ${apt.appointment_date} às ${apt.appointment_time?.slice(0, 5)}`;

          // In-app toast
          toast.info(title, { description: body, duration: 8000 });

          // Browser notification
          if (permissionGranted.current && document.visibilityState !== 'visible') {
            new Notification(title, {
              body,
              icon: '/favicon.png',
              tag: apt.id,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
