import * as Sentry from "@sentry/react";
Sentry.init({
  dsn: "https://9efe73f71a7c497c3512201dd711d43d@o4511847840088064.ingest.us.sentry.io/4511887970467840",
  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/react/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },
});