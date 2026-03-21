self.addEventListener('push', (event) => {
  let data = { title: 'Novo Agendamento', body: 'Alguém quer agendar!' };
  
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    // fallback to default
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon.png',
      badge: '/favicon.png',
      vibrate: [200, 100, 200],
      tag: 'new-appointment',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/admin') && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow('/admin');
    })
  );
});
