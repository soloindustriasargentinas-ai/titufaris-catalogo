const PUSH_NOTIFICATION_PREF_KEY = 'titufaris_push_notifications_enabled_v1';

export function isPushNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getPushNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isPushNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export function isPushNotificationEnabledByUser(): boolean {
  if (!isPushNotificationSupported()) return false;
  const pref = localStorage.getItem(PUSH_NOTIFICATION_PREF_KEY);
  return pref === 'true' && Notification.permission === 'granted';
}

export function setPushNotificationEnabledByUser(enabled: boolean): void {
  try {
    localStorage.setItem(PUSH_NOTIFICATION_PREF_KEY, enabled ? 'true' : 'false');
  } catch (err) {
    console.warn('Error saving push notification preference:', err);
  }
}

export async function requestPushNotificationPermission(): Promise<boolean> {
  if (!isPushNotificationSupported()) {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    setPushNotificationEnabledByUser(granted);
    return granted;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return false;
  }
}

export function sendBrowserPushNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
  }
): boolean {
  if (!isPushNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    const defaultIcon = '/vite.svg';
    const notif = new Notification(title, {
      icon: options?.icon || defaultIcon,
      badge: options?.badge || defaultIcon,
      body: options?.body || 'Nueva alerta de tu catálogo comercial Titufaris',
      tag: options?.tag,
      data: options?.data,
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
    };

    // Auto-close after 6 seconds
    setTimeout(() => {
      try {
        notif.close();
      } catch {
        // ignore
      }
    }, 6000);

    return true;
  } catch (err) {
    console.warn('Error triggering browser notification:', err);
    return false;
  }
}
