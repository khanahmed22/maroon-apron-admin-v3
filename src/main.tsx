import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router";
import { AuthContextProvider } from "./context/AuthContext.tsx";
import { listenForMessages } from "./lib/firebase.ts";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import * as Sentry from "@sentry/react";
import "../SentryConfig.ts";
import { Capacitor } from "@capacitor/core";
import { initPostHog } from "./lib/posthog.ts";

const queryClient = new QueryClient();


// src/serviceWorkerRegistration.ts
// Call this once from main.tsx: registerServiceWorker();

function registerServiceWorker(): void {
 if (Capacitor.isNativePlatform()) return;

  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
        scope: "/",
      });
    } catch (err) {
      console.error("❌ Service Worker registration failed", err);
    }
  });
}

registerServiceWorker()

listenForMessages()

//posthog

function deferPostHog() {
  const start = () => void initPostHog();
 const schedule = () =>
   "requestIdleCallback" in window
     ? requestIdleCallback(start, { timeout: 4000 })
    : setTimeout(start, 2000); // Safari fallback

 if (document.readyState === "complete") schedule();  else window.addEventListener("load", schedule, { once: true });
}

deferPostHog();

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container, {
  onUncaughtError: Sentry.reactErrorHandler((error, errorInfo) => {
    console.warn("Uncaught error", error, errorInfo.componentStack);
  }),

  onCaughtError: Sentry.reactErrorHandler((error, errorInfo) => {
    console.warn("Caught error", error, errorInfo.componentStack);
  }),

  onRecoverableError: Sentry.reactErrorHandler((error, errorInfo) => {
    console.warn("Recoverable error", error, errorInfo.componentStack);
  }),
});




root.render(
  <StrictMode>
  
    <QueryClientProvider client={queryClient}>
      <AuthContextProvider>
        <BrowserRouter>

          <App />
        </BrowserRouter>
      </AuthContextProvider>

      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>

  </StrictMode>
);