import { useState, useEffect, useCallback } from "react";

const NOTIFICATIONS_KEY = "workforceos_notifications_enabled";

export function useNotifications() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const isSupported = "Notification" in window;
    setSupported(isSupported);
    if (isSupported) {
      setPermission(Notification.permission);
      setEnabled(localStorage.getItem(NOTIFICATIONS_KEY) === "true" && Notification.permission === "granted");
    }
  }, []);

  const enable = useCallback(async () => {
    if (!supported) return false;
    
    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result === "granted") {
      localStorage.setItem(NOTIFICATIONS_KEY, "true");
      setEnabled(true);
      // Show test notification
      new Notification("WorkforceOS", {
        body: "Push notifications are now enabled!",
        icon: "/favicon.ico",
      });
      return true;
    }
    return false;
  }, [supported]);

  const disable = useCallback(() => {
    localStorage.setItem(NOTIFICATIONS_KEY, "false");
    setEnabled(false);
  }, []);

  const notify = useCallback((title: string, options?: NotificationOptions) => {
    if (enabled && supported && Notification.permission === "granted") {
      new Notification(title, { icon: "/favicon.ico", ...options });
    }
  }, [enabled, supported]);

  return { supported, permission, enabled, enable, disable, notify };
}
