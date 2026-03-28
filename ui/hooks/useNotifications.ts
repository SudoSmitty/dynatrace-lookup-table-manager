/**
 * hooks/useNotification.ts
 * ---------------------------------------------------------------------------
 * Simple notification state manager used across the app.
 */

import { useCallback, useState } from "react";

export type NotificationType = "success" | "warning" | "critical" | "info";

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message?: string;
}

let nextId = 1;

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback(
    (type: NotificationType, title: string, message?: string) => {
      const id = nextId++;
      setNotifications((prev) => [...prev, { id, type, title, message }]);
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 5000);
    },
    []
  );

  const dismiss = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return { notifications, addNotification, dismiss };
}
