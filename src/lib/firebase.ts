// src/firebase.ts
import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  type Messaging,
} from "firebase/messaging";

// TODO: confirm this matches the env var your other fetch calls use for the API base URL
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

const firebaseConfig = {
  apiKey: "AIzaSyDYC4eTX1p8Lk-dvR61tnWZk0aYyI6hgv8",
  authDomain: "crimson-castle.firebaseapp.com",
  projectId: "crimson-castle",
  storageBucket: "crimson-castle.firebasestorage.app",
  messagingSenderId: "558981554645",
  appId: "1:558981554645:web:fe9d36bb829c21a9795d5c",
  measurementId: "G-J6KPP4TT43",
};

// 🔹 Init Firebase ONCE
const app: FirebaseApp = initializeApp(firebaseConfig);

let messaging: Messaging | null = null;

// TODO: swap "credentials: include" for an Authorization header if you're
// on token-based auth rather than cookie sessions.
async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!res.ok) {
    throw new Error(`API request to ${path} failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

/* 🔑 Lazy init messaging ONLY when supported */
async function getMessagingSafe(): Promise<Messaging> {
  if (!(await isSupported())) {
    throw new Error("Firebase messaging not supported in this browser");
  }

  if (!messaging) {
    messaging = getMessaging(app);
  }

  return messaging;
}

/**
 * Requests notification permission, grabs an FCM token, and registers it
 * against the merchant's account via the Express API.
 *
 * Note: in v2 this took a user_id and used it to look up rest_list.id on
 * the client before inserting into push_subscriptions directly via Supabase.
 * In v3 the backend resolves the merchant/restID from the authenticated
 * session, so the client no longer needs to pass or look up an id — it's
 * kept here as an optional param only in case a call site wants it for
 * logging/analytics.
 */
export const enableNotifications = async (
  user_id?: string,
): Promise<string | undefined> => {
  try {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service workers not supported");
    }

    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }
    if (permission !== "granted") return undefined;

    // ✅ Wait until YOUR SW is active
    const registration = await navigator.serviceWorker.ready;

    const messagingInstance = await getMessagingSafe();

    const token = await getToken(messagingInstance, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) return undefined;

    // Single authenticated call — backend resolves restId from the session
    // and upserts the token, instead of two separate Supabase round trips.
    await apiFetch("/notifications/subscribe", {
      method: "POST",
      body: JSON.stringify({ fcmToken: token }),
    });

    return token;
  } catch (err) {
    console.error("❌ Failed to enable notifications:", err);
    throw err;
  }
};

/**
 * Fetches whether push is already enabled for the current merchant.
 * Replaces the old client-side fetchNotificationStatus() logic in
 * Settings.jsx, which queried rest_list + push_subscriptions directly
 * via Supabase. Call this from the Settings page's useQuery instead.
 */
export const fetchNotificationStatus = async (): Promise<boolean> => {
  // Browser permission is still the first gate — no server round trip needed.
  if (Notification.permission !== "granted") {
    return false;
  }

  const data = await apiFetch<{ enabled: boolean }>("/notifications/status");
  return data.enabled;
};

// 🔹 Foreground listener (call once AFTER app load)
// When the tab is open and focused, FCM does NOT go through the service
// worker's auto-display — it delivers here instead. Without this, orders
// placed while the dashboard tab is open produce no notification tray
// entry at all, even though the backend send succeeds.
export const listenForMessages = async (): Promise<void> => {
  try {
    const messagingInstance = await getMessagingSafe();
    onMessage(messagingInstance, (payload) => {
      if (Notification.permission !== "granted") return;

      const title = payload.notification?.title ?? "New notification";
      const body = payload.notification?.body ?? "";
      const link = payload.data?.link;

      const notification = new Notification(title, { body });
      if (link) {
        notification.onclick = () => {
          window.focus();
          window.location.href = link;
        };
      }
    });
  } catch {
    // silently ignore unsupported browsers
  }
};