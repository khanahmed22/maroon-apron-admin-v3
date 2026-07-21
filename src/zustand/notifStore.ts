import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";

export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error";

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  description?: string;
  duration?: number;
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (
    notification: Omit<Notification, "id">
  ) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore =
  create<NotificationStore>()(
    persist(
      (set) => ({
        notifications: [],

        addNotification: (notification) =>
          set((state) => ({
            notifications: [
              ...state.notifications,
              {
                ...notification,
                id: uuidv4(),
              },
            ],
          })),

        removeNotification: (id) =>
          set((state) => ({
            notifications: state.notifications.filter(
              (n) => n.id !== id
            ),
          })),

        clearAll: () =>
          set({
            notifications: [],
          }),
      }),
      {
        name: "notification-storage",
      }
    )
  );

interface NotifyOptions {
  type?: NotificationType;
  description?: string;
  duration?: number;
}

export function notif(
  message: string,
  options: NotifyOptions = {}
) {
  useNotificationStore.getState().addNotification({
    message,
    type: options.type ?? "info",
    description: options.description,
    duration: options.duration ?? 5000,
  });
}