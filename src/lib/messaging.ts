import {
  getMessaging,
  getToken,
  isSupported,
} from "firebase/messaging";

import app from "@/lib/firebase";

const VAPID_KEY =
  "BNjfskHZMg1K0j_ll9BP8eKsGdJHYmarfdRHOrO5fc-4SOMlN1LJ1fXlNlWioAJEran-6OkddDGwg2Tt_22NAyA";

export async function requestNotificationPermission() {
  try {
    if (typeof window === "undefined") {
      return null;
    }

    /*
     * Check whether Firebase Cloud Messaging
     * is supported by this browser.
     */
    const supported = await isSupported();

    if (!supported) {
      console.log(
        "Firebase Cloud Messaging is not supported."
      );

      return null;
    }

    /*
     * Check browser notification permission.
     */
    const permission =
      await Notification.requestPermission();

    if (permission !== "granted") {
      console.log(
        "Notification permission was not granted."
      );

      return null;
    }

    /*
     * Register the Firebase Messaging Service Worker.
     */
    const registration =
      await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
        {
          scope: "/",
        }
      );

    console.log(
      "Firebase Messaging Service Worker registered:",
      registration
    );

    /*
     * IMPORTANT:
     *
     * Wait until the Service Worker becomes active.
     * This prevents:
     *
     * "Subscription failed - no active Service Worker"
     */
    let activeRegistration = registration;

    if (!registration.active) {
      activeRegistration =
        await navigator.serviceWorker.ready;
    }

    /*
     * Make sure there is actually an active
     * Service Worker before continuing.
     */
    if (!activeRegistration.active) {
      console.error(
        "Firebase Messaging Service Worker is not active."
      );

      return null;
    }

    console.log(
      "Firebase Messaging Service Worker is active."
    );

    /*
     * Initialize Firebase Cloud Messaging.
     */
    const messaging = getMessaging(app);

    /*
     * Get the FCM device/browser token.
     */
    const token = await getToken(
      messaging,
      {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration:
          activeRegistration,
      }
    );

    if (!token) {
      console.log(
        "Unable to get FCM token."
      );

      return null;
    }

    console.log(
      "FCM token successfully generated."
    );

    return token;
  } catch (error) {
    console.error(
      "Error setting up notifications:",
      error
    );

    return null;
  }
}