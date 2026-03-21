import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const VAPID_PUBLIC_KEY = 'BK4fs11IEx04JJ8j2jJDTvZpblpJ3BWL-yYTwfY3Ol42fTqgiwHVlXwwj2JKbDYrKZb1v9whcskze2XV-mOvc8s';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
}

async function registerPushSubscription(userId: string) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications not supported');
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.log('Notification permission denied');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const subJson = subscription.toJSON();
    
    // Upsert subscription to database
    await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint: subJson.endpoint!,
        p256dh: subJson.keys!.p256dh,
        auth: subJson.keys!.auth,
      }, { onConflict: 'endpoint' });

    console.log('Push subscription registered');
  } catch (err) {
    console.error('Failed to register push:', err);
  }
}

export function useAdminNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Register push subscription for this device
    registerPushSubscription(user.id);

    // Also listen via realtime for in-app toasts
    const channel = supabase
      .channel('admin-new-appointments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
        },
        (payload) => {
          const apt = payload.new as any;
          toast.info('Novo Agendamento! ✂️', {
            description: `${apt.client_name} quer agendar para ${apt.appointment_date} às ${apt.appointment_time?.slice(0, 5)}`,
            duration: 8000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
}
