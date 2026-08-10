import * as Sentry from "@sentry/react";
Sentry.init({
  dsn: "https://7ae2b72b461bf4d285c2d4d031d9d778@o4511847840088064.ingest.us.sentry.io/4511847850246144",
  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/react/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },
});