// src/firebase.ts
import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  deleteToken,
  onMessage,
  isSupported,
  type Messaging,
} from "firebase/messaging";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

// TODO: confirm this matches the env var your other fetch calls use for the API base URL
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

const LAST_FCM_TOKEN_KEY = "maroonapron_fcm_token";

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
 * Native (Capacitor/Android) token registration path.
 * Requests permission, registers with FCM via the native plugin, and
 * posts the resulting token to the same subscribe endpoint the web
 * flow uses. The backend doesn't need to know or care whether a stored
 * token is a web push token or a native Android FCM token.
 */
async function enableNotificationsNative(): Promise<string | undefined> {
  const perm = await PushNotifications.checkPermissions();
  let receive = perm.receive;

  if (receive === "prompt" || receive === "prompt-with-rationale") {
    const req = await PushNotifications.requestPermissions();
    receive = req.receive;
  }

  if (receive !== "granted") return undefined;

  await PushNotifications.register();

  const token = await new Promise<string | undefined>((resolve) => {
    PushNotifications.addListener("registration", (t) => resolve(t.value));
    PushNotifications.addListener("registrationError", () => resolve(undefined));
  });

  if (!token) return undefined;

  await apiFetch("/notifications/subscribe", {
    method: "POST",
    body: JSON.stringify({ fcmToken: token }),
  });

  localStorage.setItem(LAST_FCM_TOKEN_KEY, token);

  return token;
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
export const enableNotifications = async (): Promise<string | undefined> => {
  if (Capacitor.isNativePlatform()) {
    return enableNotificationsNative();
  }

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

    localStorage.setItem(LAST_FCM_TOKEN_KEY, token);

    return token;
  } catch (err) {
    console.error("❌ Failed to enable notifications:", err);
    throw err;
  }
};

/**
 * Deletes the merchant's push subscription on the backend so no further
 * notifications are sent to this device, and — on web — invalidates the
 * FCM token client-side so it can't be silently reused.
 *
 * Note: this can't revoke OS/browser notification permission itself; the
 * user (or a fresh uninstall/reinstall on native) controls that. This only
 * stops delivery by removing the record the backend sends to.
 */
export const disableNotifications = async (): Promise<void> => {
  const token = localStorage.getItem(LAST_FCM_TOKEN_KEY);

  if (token) {
    await apiFetch("/notifications/unsubscribe", {
      method: "POST",
      body: JSON.stringify({ fcmToken: token }),
    });
  }

  if (!Capacitor.isNativePlatform()) {
    try {
      const messagingInstance = await getMessagingSafe();
      await deleteToken(messagingInstance);
    } catch (err) {
      // Backend record is already gone, which is what actually matters —
      // failing to invalidate client-side isn't worth surfacing as an error.
      console.error("⚠️ Failed to delete FCM token client-side:", err);
    }
  }
  // Native: @capacitor/push-notifications has no client-side token
  // invalidation call — removing the backend subscription is sufficient
  // since no more pushes will be routed to this token.

  localStorage.removeItem(LAST_FCM_TOKEN_KEY);
};

/**
 * Fetches whether push is already enabled for the current merchant.
 * Replaces the old client-side fetchNotificationStatus() logic in
 * Settings.jsx, which queried rest_list + push_subscriptions directly
 * via Supabase. Call this from the Settings page's useQuery instead.
 */
export const fetchNotificationStatus = async (): Promise<boolean> => {
  if (Capacitor.isNativePlatform()) {
    const perm = await PushNotifications.checkPermissions();
    if (perm.receive !== "granted") return false;
  } else {
    // Browser permission is still the first gate — no server round trip needed.
    if (Notification.permission !== "granted") {
      return false;
    }
  }

  const data = await apiFetch<{ enabled: boolean }>("/notifications/status");
  return data.enabled;
};

// 🔹 Foreground listener (call once AFTER app load)
// When the tab/app is open and focused, FCM does NOT go through the
// service worker's auto-display (web) or the OS tray (native) — it
// delivers here instead. Without this, orders placed while the
// dashboard is open produce no notification at all, even though the
// backend send succeeds.
export const listenForMessages = async (): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    PushNotifications.addListener("pushNotificationReceived", () => {
      // App was open when it arrived — Android won't auto-show a tray
      // entry in this case, so surface your own in-app toast here if desired.
    });

    PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      const link = action.notification?.data?.link;
      if (link) window.location.href = link;
    });
    return;
  }

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