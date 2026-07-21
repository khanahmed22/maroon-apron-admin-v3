import { useState } from "react";
import { ArrowRight, Bell, X } from "lucide-react";
import { useNotificationStore } from "../zustand/notifStore";
import { useNavigate } from "react-router";

export default function NotificationPanel() {
  const navigate = useNavigate();

  const {
    notifications,
    removeNotification,
    clearAll,
  } = useNotificationStore();

  const [open, setOpen] = useState(false);

  return (
    <div className="fixed top-4 max-md:top-4 right-0 max-md:right-6 z-9999">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full border bg-white p-2 shadow-md hover:bg-gray-100"
      >
        <Bell size={17} />

        {notifications.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute -right-6  mt-3 w-64 overflow-hidden rounded-xl border bg-white shadow-xl">
          <div className="flex items-center justify-between border-b bg-gray-50 p-3">
            <h3 className="font-semibold">
              Notifications
            </h3>

            <div className="flex gap-2">
              {!!notifications.length && (
                <button
                  onClick={clearAll}
                  className="text-xs text-red-500"
                >
                  Clear All
                </button>
              )}

              <button
                onClick={() => setOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {!notifications.length ? (
              <p className="py-6 text-center text-sm text-gray-500">
                No notifications
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="border-b bg-blue-50 p-3 last:border-none"
                >
                  <div className="flex justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium">
                        {n.message}
                      </p>

                      {n.description && (
                        <button
                          onClick={() =>
                            navigate("/orders")
                          }
                          className="mt-1 flex items-center gap-1 text-sm text-blue-600 hover:underline"
                        >
                          {n.description}
                          <ArrowRight size={15} />
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() =>
                        removeNotification(n.id)
                      }
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}