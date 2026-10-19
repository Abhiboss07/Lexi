export interface SystemNotificationStatus {
  isSupported: boolean;
  permission: NotificationPermission | 'unsupported';
}

export class SystemNotificationService {
  /**
   * Checks if Notification API is supported by the browser and returns current permission.
   */
  getStatus(): SystemNotificationStatus {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return {
        isSupported: false,
        permission: 'unsupported',
      };
    }

    return {
      isSupported: true,
      permission: window.Notification.permission,
    };
  }

  /**
   * Prompts the user for system notification permission.
   * Only called on explicit user action (e.g. toggling the switch in settings).
   */
  async requestPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }

    try {
      const permission = await window.Notification.requestPermission();
      return permission;
    } catch {
      return window.Notification.permission;
    }
  }

  /**
   * Sends a browser system notification if supported and granted.
   */
  sendNotification(
    title: string,
    options?: {
      body?: string;
      icon?: string;
      tag?: string;
    }
  ): boolean {
    const status = this.getStatus();
    if (!status.isSupported || status.permission !== 'granted') {
      return false;
    }

    try {
      new window.Notification(title, {
        body: options?.body,
        icon: options?.icon || '/favicon.svg',
        tag: options?.tag || 'lexi-notification',
      });
      return true;
    } catch (err) {
      console.warn('Unable to dispatch browser system notification:', err);
      return false;
    }
  }
}

export const systemNotificationService = new SystemNotificationService();
