
import * as Sentry from "@sentry/react";

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: "https://9efe73f71a7c497c3512201dd711d43d@o4511847840088064.ingest.us.sentry.io/4511887970467840",

    dataCollection: {
      // userInfo: false,
      // httpBodies: [],
    },
  });
}
