importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyCb9KvEy6yw6L9HLmaCyJb93T3dNPCWacY",
  authDomain: "e-barangay-system-427d0.firebaseapp.com",
  projectId: "e-barangay-system-427d0",
  storageBucket: "e-barangay-system-427d0.firebasestorage.app",
  messagingSenderId: "1010877605074",
  appId: "1:1010877605074:web:f22fe43b7a66f88424390b",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Background message received:",
    payload
  );

  const notificationTitle =
    payload.notification?.title || "Barangay Poblacion North";

  const notificationOptions = {
    body:
      payload.notification?.body ||
      "There is an update to your request.",
    icon: "/icon-192.png",
    data: {
      url: payload.data?.url || "/notifications",
    },
  };

  self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url =
    event.notification?.data?.url || "/notifications";

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});