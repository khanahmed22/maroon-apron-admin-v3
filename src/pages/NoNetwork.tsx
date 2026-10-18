import { useState } from "react";
import { WifiOff, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";

const ACCENT = "#D6293F";
const INK = "#171717";
const MUTE = "#6B7280";
const BORDER = "#E7E5E4";
const SOFT = "#FBF7F6";

export default function NoNetwork({
  onRetry,
}: {
  onRetry: () => void | Promise<void>;
}) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await onRetry();
      // the check is near-instant, so keep the spinner up briefly
      // so the tap visibly does something
      await new Promise((resolve) => setTimeout(resolve, 600));
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: SOFT }}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl border p-6 sm:p-8 text-center"
        style={{ borderColor: BORDER }}
      >
        <div
          className="mx-auto mb-5 w-14 h-14 rounded-full flex items-center justify-center"
          style={{ backgroundColor: SOFT }}
        >
          <WifiOff className="w-7 h-7" style={{ color: ACCENT }} />
        </div>

        <h1 className="text-2xl font-extrabold" style={{ color: INK }}>
          No internet connection
        </h1>

        <p
          className="text-sm sm:text-base mt-2 leading-relaxed"
          style={{ color: MUTE }}
        >
          Check your Wi-Fi or mobile data and try again.
        </p>

        <Button
          onClick={handleRetry}
          disabled={retrying}
          className="w-full mt-6 h-11 rounded-xl text-sm sm:text-base font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: ACCENT }}
        >
          {retrying ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Checking…
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try again
            </>
          )}
        </Button>
      </div>
    </div>
  );
}