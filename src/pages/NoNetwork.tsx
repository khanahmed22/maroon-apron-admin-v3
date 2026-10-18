export default function NoNetwork({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="fixed inset-0 z-[9998] flex flex-col items-center justify-center bg-[#FBF7F6] px-6 text-center">
      <h2 className="text-xl font-semibold text-[#1F2937]">No internet connection</h2>
      <p className="mt-3 max-w-sm text-sm text-[#6B7280]">
        Please check your Wi-Fi or mobile data and try again.
      </p>
      <button
        onClick={onRetry}
        className="mt-6 rounded-lg bg-[#D6293F] px-6 py-3 text-sm font-medium text-white"
      >
        Try again
      </button>
    </div>
  );
}