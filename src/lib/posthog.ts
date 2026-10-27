import type { PostHog } from "posthog-js"; // type-only, erased at build

let loading: Promise<PostHog> | null = null;
let client: PostHog | null = null;
const queue: Array<(ph: PostHog) => void> = [];

export function initPostHog() {
  if (loading) return loading;

  loading = import("posthog-js").then(({ default: posthog }) => {
    posthog.init(import.meta.env.VITE_POSTHOG_PROJECT_TOKEN, {
      api_host: import.meta.env.VITE_POSTHOG_HOST,
      defaults: "2026-05-30",
      // turn off the heavy stuff you don't need:
       autocapture: false,
       disable_session_recording: false,
       capture_heatmaps: false,
       capture_dead_clicks: false,
       disable_surveys: true,
    });
    client = posthog;
    queue.splice(0).forEach((fn) => fn(posthog)); // flush calls made before load
    return posthog;
  });

  return loading;
}

function withPostHog(fn: (ph: PostHog) => void) {
  client ? fn(client) : queue.push(fn);
}

// Safe to call any time; runs once PostHog has loaded
export const analytics = {
  capture: (...a: Parameters<PostHog["capture"]>) =>
    withPostHog((ph) => ph.capture(...a)),
  identify: (...a: Parameters<PostHog["identify"]>) =>
    withPostHog((ph) => ph.identify(...a)),
  reset: () => withPostHog((ph) => ph.reset()),
};

// Drop-in replacement for usePostHog from @posthog/react
export const usePostHog = () => analytics;