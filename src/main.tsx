import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router";
import { AuthContextProvider } from "./context/AuthContext.tsx";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import * as Sentry from "@sentry/react";
import "../SentryConfig.ts";

import "leaflet/dist/leaflet.css";
import L from "leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const queryClient = new QueryClient();

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// src/serviceWorkerRegistration.ts
// Call this once from main.tsx: registerServiceWorker();

function registerServiceWorker(): void {
 

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